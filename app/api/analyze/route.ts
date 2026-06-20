import { type NextRequest, NextResponse } from "next/server";
import { Buffer } from "buffer";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;
// 确保使用 Node.js runtime（Buffer、xlsx 等在 Edge 下会炸）
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const selectedIndicatorsJson = formData.get("selectedIndicators") as string;

    if (!file || !selectedIndicatorsJson) {
      return NextResponse.json(
        { error: "Missing file or indicators" },
        { status: 400 },
      );
    }

    let selectedIndicators: Record<string, any> = {};
    try {
      selectedIndicators = JSON.parse(selectedIndicatorsJson);
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid indicators format" },
        { status: 400 },
      );
    }

    // 解析 Excel 文件
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    const XLSX = await import("xlsx");
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });

    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const records = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

    // 从选中的指标构建规则文档
    let rulesDocument = "## 质量评估指标与规则\n\n";

    Object.entries(selectedIndicators).forEach(
      ([dimensionId, dimensionData]: [string, any]) => {
        if (dimensionData.name) {
          rulesDocument += `## ${dimensionData.name}\n\n`;

          if (dimensionData.subIndicators) {
            dimensionData.subIndicators.forEach((sub: any) => {
              rulesDocument += `### ${sub.name}\n\n`;
              if (sub.description) {
                rulesDocument += `**二级指标说明：** ${sub.description}\n\n`;
              }
              if (sub.rules && sub.rules.length > 0) {
                rulesDocument += `**用户自定义规则：**\n`;
                sub.rules.forEach((rule: string) => {
                  rulesDocument += `- ${rule}\n`;
                });
                rulesDocument += "\n";
              } else {
                rulesDocument += `**用户自定义规则：** 无\n\n`;
              }
            });
          }
        }
      },
    );

    console.log("[v0] Rules document:\n", rulesDocument);

    // 为 prompt 构建数据概览
    const columnNames = Object.keys(records[0] || {});
    const dataSummary = {
      totalRecords: records.length,
      // 实际是全量 records
      sampleRows: records,
      columns: columnNames,
      emptyFieldStats: columnNames.reduce(
        (acc, col) => {
          const emptyCount = records.filter(
            (r: any) => !r[col] || r[col].toString().trim() === "",
          ).length;
          return {
            ...acc,
            [col]: `${((emptyCount / records.length) * 100).toFixed(1)}%`,
          };
        },
        {} as Record<string, string>,
      ),
    };

    console.log(JSON.stringify(dataSummary.sampleRows, null, 2));

    // === Prompt ===
    const evaluationPrompt = `
# 模块一：任务背景与角色设定（Context + Audience + Tone）

## 角色
你是一位同时具备文物领域知识和数据质量审计经验的专家，熟悉博物馆藏品登记规范、文物分类方法和数据治理实践。

## 任务背景
本次任务是对博物馆文物数字资源元数据进行质量评估。数据来自博物馆藏品登记台账，用于后续的统计分析、展陈策划和跨系统共享。

## 受众
报告的目标读者是博物馆工作人员，包括专业编目人员和一般管理人员。用语应通俗易懂，专业术语需附简要解释。

## 语气要求
- 保持严谨、中立、客观的语气
- 对问题的描述应基于数据事实，避免主观臆断
- 对于不确定的判断，应标注为"疑似问题"并说明判断依据

---

# 模块二：评估数据与检查规则（Objective）

## 待评估数据
以下是本次要评估的文物元数据（JSON格式，共 ${records.length} 条记录）：
${JSON.stringify(dataSummary.sampleRows)}

请先确认：
- 总记录数 N = ${records.length}
- 识别所有字段名：${columnNames.join(", ")}

## 评估体系与检查规则
请根据以下评估指标与用户配置的检查规则开展评估：
${rulesDocument}

重要约束：
- 只围绕上述指标与规则进行检查，不得自行新增指标
- 对于数据中缺乏相关字段支撑而无法评估的指标，应如实说明原因
- 必须对所有 ${records.length} 条记录逐条扫描，不得抽样或省略

---

# 模块三：报告格式要求（Style + Response）

## 写作风格
- 采用专业、客观的质量检测报告风格
- 使用短句和列表，避免长段落嵌套，保持可读性
- 表述简洁准确，不给读者造成阅读负担

## 报告整体结构
报告使用Markdown格式，按以下四个部分组织：

### 第一部分：数据概览
- 确认记录总数和字段列表
- 将数据字段与评估规则中的标准字段进行映射对照
- 说明哪些标准字段在数据中缺失

### 第二部分：分指标质量评估
按评估体系的一级指标和二级指标逐项展开，标题和顺序与评估体系保持一致。例如：
- 1. 完整性 (Completeness)
  - 1.1 元数据完整性（A1）
  - 1.2 内容完整性（A2）
- 2. 规范性 (Standardization) … 依此类推。

每个二级指标下包含三个板块：

**（1）定义**
用2-4句话简要说明该指标的含义。

**（2）质量问题**
- 按问题类型分条列出，使用 (1)(2)(3)… 编号
- 每类问题先给出一条粗体标题，再给1-2句简短说明
- 同一指标下的问题按严重程度由高到低排列，影响较大的问题优先呈现
- 每类问题标题末尾标注严重程度等级，共四种：
  - 【必须修改】：影响数据基本可用性的问题，如字段缺失、数值明显错误、字段间逻辑矛盾等
  - 【建议修改】：影响数据规范性的问题，如格式不统一、用字不规范、分类口径不一致等
  - 【疑似问题】：不完全确定的问题，需人工确认后判断，须附上判断依据
  - 对于因数据中缺乏相关字段而无法评估的指标，在该指标的质量问题部分标注【无法评估】并说明原因
- 然后列出所有存在该类问题的记录，每条记录单独一行，格式为：
  - 唯一标识（如"藏品编号: xxx"）
  - 问题说明（一句话说明为什么有问题、如何改进）
- 全局性问题（影响全部记录的）标注"全局性问题"，给出问题描述和建议，可选择几条代表记录
- 部分记录的问题必须完整列出所有涉及的记录，不得使用"等""……"省略
- "疑似问题"也必须列出，标注"疑似问题"并附上判断依据
- 各指标之间的质量问题不得重叠

**（3）不合规率**
不合规率 = 不合规记录数 m / 总记录数 N × 100%
同一条记录在该指标下有多个问题只计算一次。

### 第三部分：不合规率汇总表
以表格形式汇总所有指标的不合规率。

### 第四部分：通俗总结与改进建议
从馆内实际工作角度，用通俗语言说明这些问题意味着什么、按优先级给出改进建议，帮助用户明确先改什么、后改什么。

## 自检要求
在每个重要维度结束时，简要说明：
- 列出的问题记录数是否与扫描逻辑一致
- 本次评估可能存在的局限（如字段缺失导致无法判断）
`;

const apiKey = process.env.AIHUBMIX_API_KEY;
const model = "claude-opus-4-6-think";

if (!apiKey) {
  return new Response(
    JSON.stringify({
      error:
        "未配置 AIHUBMIX_API_KEY，请在环境变量或部署平台中设置。",
    }),
    {
      status: 500,
      headers: { "Content-Type": "application/json" },
    },
  );
}

const client = new Anthropic({
  apiKey,
  baseURL: "https://aihubmix.com",
  timeout: 600000, // 600 秒
});

console.log(
  "[v0] Calling Claude (AiHubMix) with messages.create (non-stream)...",
);

// 非流式：一次性拿完整结果
const response = await client.messages.create({
  model,
  max_tokens: 16000,
  thinking: {
    type: "enabled",
    budget_tokens: 10000,
  },
  system: "你是一名专业的文物专家和数据质量审计专家，负责识别文物元数据中的问题并输出结构化、可追溯的质量评估报告。",
  messages: [
    {
      role: "user",
      content: evaluationPrompt,
    },
  ],
});

// 从 response.content 中提取文本（跳过 thinking blocks）
let text = "";
for (const block of response.content) {
  if (block.type === "thinking") {
    console.log("[v0] Thinking summary length:", block.thinking.length);
  } else if (block.type === "text") {
    text += block.text;
  }
}

if (!text) {
  text =
    "（模型未返回任何文本内容，请检查日志或精简 prompt / 数据后重试。）";
}

console.log(
  "[v0] Chat completions finished, total content length:",
  text.length,
);

return new Response(text, {
  headers: {
    "Content-Type": "text/plain; charset=utf-8",
  },
});
} catch (error) {
console.error("[v0] Error in analyze route:", {
  message: error instanceof Error ? error.message : String(error),
  stack: error instanceof Error ? error.stack : undefined,
});
return new Response(JSON.stringify({ error: "生成报告失败" }), {
  status: 500,
  headers: { "Content-Type": "application/json" },
});
}
}