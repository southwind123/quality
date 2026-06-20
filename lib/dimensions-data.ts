export interface SubIndicator {
  id: string
  name: string
  description: string
}

export interface Dimension {
  id: string
  name: string
  description: string
  subIndicators: SubIndicator[]
}

export const DIMENSIONS: Dimension[] = [
  {
    id: "completeness",
    name: "A. 完整性 (Completeness)",
    description: "检查文物元数据是否完整",
    subIndicators: [
      {
        id: "metadata_completeness",
        name: "A1. 元数据完整性",
        description: "核心数据项（如文物编号、名称、朝代、出土时间等）不能缺失。",
      },
      {
        id: "content_completeness",
        name: "A2. 内容完整性",
        description: "每条文物数据记录应包含文物所有必需字段，具有完整的描述信息。",
      },
    ],
  },
  {
    id: "standardization",
    name: "B. 规范性 (Standardization)",
    description: "检查数据格式是否符合规范",
    subIndicators: [
      {
        id: "format_standardization",
        name: "B1. 数据格式规范性",
        description: "数据格式（包括数据类型、长度、精度等）是否满足预期要求。",
      },
      {
        id: "redundancy_rate",
        name: "B2. 数据冗余率",
        description: "对于博物馆特定的文物，应当只有一条核心数据记录代表该文物。",
      },
      {
        id: "security_compliance",
        name: "B3. 安全合规性",
        description: "数据符合安全和隐私方面规则的度量。",
      },
    ],
  },
  {
    id: "accuracy",
    name: "C. 准确性 (Accuracy)",
    description: "确保记录的数据真实可靠",
    subIndicators: [
      {
        id: "content_accuracy",
        name: "C1. 数据内容准确性",
        description: "元数据内容应准确反映文物的实际信息，不存在错误或歧义描述。",
      },
    ],
  },
  {
    id: "consistency",
    name: "D. 一致性 (Consistency)",
    description: "确保文物元数据一致性",
    subIndicators: [
      {
        id: "association_consistency",
        name: "D1. 数据关联一致性",
        description: "文物数据项满足定义的一致性约束的程度（例如，朝代和出土时间必须匹配）。",
      },
      {
        id: "semantic_consistency",
        name: "D2. 元数据语义一致性",
        description: "应保证同一元数据项在不同文物中含义一致，避免概念混用。如“地点”字段在某些文物中表示“出土地点”，而在其他文物中表示“创作地点”，会导致数据语义混乱。",
      },
    ],
  },
  {
    id: "timeliness",
    name: "E. 时效性 (Timeliness)",
    description: "检查数据是否及时更新",
    subIndicators: [
      {
        id: "data_timeliness",
        name: "E1. 数据及时性",
        description: "动态数据（如文物当前位置、展览状态、修复进度等）应根据实际变化及时更新。",
      },
    ],
  },
  {
    id: "authority",
    name: "F. 权威性 (Authority)",
    description: "检查数据来源的权威性",
    subIndicators: [
      {
        id: "source_authority",
        name: "F1. 数据来源权威性",
        description: "数据来自合法和经过验证的来源，内容真实、可靠、具有权威性。",
      },
    ],
  },
  {
    id: "understandability",
    name: "G. 可理解性 (Comprehensibility)",
    description: "确保数据容易理解与使用",
    subIndicators: [
      {
        id: "content_comprehensibility",
        name: "G1. 数据内容可理解性",
        description: "文本内容应清晰、通顺、专业术语解释充分，便于用户（含非专业者）理解。",
      },
    ],
  },
]
