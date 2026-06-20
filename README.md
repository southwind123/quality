# 文物数字资源元数据质量评估系统

这是一个基于 Next.js 构建的 Web 应用，用于对 Excel 格式的文物元数据进行质量评估，并通过大语言模型生成结构化分析报告。

## 功能简介

- 上传 Excel 文件进行评估
- 按 7 大质量维度选择评估指标
- 支持自定义评估规则
- 自动生成 Markdown 质量评估报告
- 本地保存历史评估记录
- 提供适合馆内工作人员阅读的通俗化总结

## 运行效果概览

使用流程如下：

1. 打开系统首页
2. 上传 Excel 文件
3. 选择评估维度与规则
4. 点击生成报告
5. 查看 AI 输出的质量评估结果

---

## 补充说明：AI 生成报告是在哪里实现的

本项目中，真正负责“调用 AI 并生成评估报告”的核心接口文件是：

- [app/api/analyze/route.ts](app/api/analyze/route.ts)

这个文件主要负责以下事情：

1. 接收前端上传的 Excel 文件和用户选择的评估指标
2. 使用 `xlsx` 解析 Excel 数据
3. 把表格数据、字段信息、评估规则整理成一段完整的提示词（Prompt）
4. 调用 AI 模型生成质量评估报告
5. 把 AI 返回的文本流式返回给前端页面显示

当前项目里使用的并不是 AI 官方原始域名直连方式，而是通过中转平台：

- https://aihubmix.com/

在代码里可以看到两个关键信息：

- 使用的密钥变量名是 `AIHUBMIX_API_KEY`
- 请求地址基于 `https://aihubmix.com`

也就是说：

- `app/api/analyze/route.ts` 是“AI 报告生成入口”
- `.env.local` 是“给这个入口提供密钥配置的地方”

如果后续你要更换模型、切换 AI 平台、或者改成自己的接口地址，通常就是从 [app/api/analyze/route.ts](app/api/analyze/route.ts) 这里开始改。

---

## 一、在新电脑上运行本项目前，需要准备什么

如果你是一台新电脑，建议先安装下面这些工具。

### 1. 安装 Node.js

本项目推荐使用：

- Node.js 20 或更高版本

下载地址：

- https://nodejs.org/

安装完成后，打开终端或 PowerShell，输入下面命令检查是否安装成功：

```bash
node -v
npm -v
```

如果能看到版本号，就说明安装成功了。

### 2. 安装 pnpm

本项目使用 `pnpm` 管理依赖。

在终端中执行：

```bash
npm install -g pnpm
```

安装完成后检查：

```bash
pnpm -v
```

### 3. 安装 Git

如果你需要从 GitHub 拉取代码、更新代码、上传代码，需要安装 Git。

下载地址：

- https://git-scm.com/downloads

安装后检查：

```bash
git --version
```

### 4. 准备 AI 接口密钥

本项目调用 AI 服务生成评估报告，所以必须配置接口密钥。

你需要准备：

- `AIHUBMIX_API_KEY`

如果没有这个密钥，项目可以启动，但生成报告时会报错。

---

## 二、如何获取项目代码

### 方式 1：直接从 GitHub 克隆

```bash
git clone https://github.com/southwind123/quality.git
cd quality
```

### 方式 2：下载 ZIP 压缩包

1. 打开 GitHub 仓库页面
2. 点击 `Code`
3. 点击 `Download ZIP`
4. 解压到本地
5. 用终端进入项目目录

例如：

```bash
cd 你的项目文件夹路径
```

---

## 三、项目第一次运行的完整步骤

下面这部分按顺序操作即可，适合第一次接触代码的同学。

### 第 1 步：打开终端并进入项目目录

如果你已经把代码下载到本地，先进入项目目录：

```bash
cd quality
```

如果你的文件夹名字不是 `quality`，就改成你自己的文件夹名。

### 第 2 步：安装项目依赖

在项目根目录运行：

```bash
pnpm install
```

这一步会安装项目运行所需的全部依赖。首次安装可能需要几分钟。

### 第 3 步：创建环境变量文件

在项目根目录新建一个文件：

- `.env.local`

把下面内容复制进去：

```env
AIHUBMIX_API_KEY=请填写你自己的密钥
```

#### `.env.local` 在这里的作用是什么？

可以把 `.env.local` 理解成：

- 这个项目在你自己电脑上的“本地配置文件”
- 专门用来保存敏感信息和每台电脑可能不同的参数

在当前项目里，它最重要的作用就是：

- 给 [app/api/analyze/route.ts](app/api/analyze/route.ts) 提供 `AIHUBMIX_API_KEY`

代码运行时，会读取：

- `process.env.AIHUBMIX_API_KEY`

如果 `.env.local` 里没有这个值，那么项目虽然能打开页面，但在真正生成报告时会失败，并返回“未配置 AIHUBMIX_API_KEY”的错误。

你可以把它简单理解为：

- 前端页面负责上传文件和展示结果
- [app/api/analyze/route.ts](app/api/analyze/route.ts) 负责调用 AI
- `.env.local` 负责告诉后端“调用 AI 时该用哪一个密钥”

注意：

- 等号右边替换成你自己的真实密钥
- 不要加中文引号
- 不要把这个文件上传到 GitHub
- 这个文件只在你自己的电脑生效，不同电脑都要各自创建

### 第 4 步：启动开发环境

运行：

```bash
pnpm dev
```

启动成功后，终端通常会看到类似内容：

```bash
Local: http://localhost:3000
```

### 第 5 步：打开浏览器访问系统

在浏览器打开：

- http://localhost:3000

看到首页后，就说明项目已经成功运行。

---

## 四、如何使用这个系统

### 1. 进入首页

点击“开始评估”。

### 2. 上传 Excel 文件

请上传包含文物元数据的 Excel 文件。

建议：

- 第一张工作表应包含要评估的数据
- 表头尽量清晰
- 每行代表一条记录

### 3. 选择评估维度

系统内置以下 7 类维度：

1. 完整性
2. 规范性
3. 准确性
4. 一致性
5. 时效性
6. 权威性
7. 可理解性

你可以：

- 全选默认维度
- 按需取消某些维度
- 给具体二级指标添加自定义规则

### 4. 生成评估报告

点击生成后，系统会：

- 解析 Excel 数据
- 整理字段与记录
- 拼接评估规则
- 调用 AI 生成报告

### 5. 查看历史记录

系统会在浏览器本地保存历史报告。

注意：

- 历史记录保存在当前浏览器的本地存储中
- 换浏览器或清空浏览器缓存后，历史记录可能消失

---

## 五、项目常用命令

### 启动开发模式

```bash
pnpm dev
```

### 打包项目

```bash
pnpm build
```

### 以生产模式启动

```bash
pnpm start
```

### 检查代码

```bash
pnpm lint
```

---

## 六、常见问题排查

### 1. 运行 `pnpm dev` 提示找不到 pnpm

说明你还没有安装 pnpm。

执行：

```bash
npm install -g pnpm
```

### 2. 运行时报 `AIHUBMIX_API_KEY` 未配置

说明你没有创建 `.env.local`，或者里面没有正确填写密钥。

请检查：

- 项目根目录下是否有 `.env.local`
- 文件内容是否类似：

```env
AIHUBMIX_API_KEY=你的密钥
```

修改后请重新启动项目。

### 3. 上传文件后生成报告失败

可能原因：

- AI 密钥无效
- 网络无法访问 AI 服务
- Excel 文件内容过大
- Excel 格式异常

建议按顺序检查：

1. `.env.local` 是否正确
2. 网络是否正常
3. Excel 是否能正常打开
4. 是否为标准 `.xlsx` 文件

### 4. 依赖安装失败

可以尝试：

```bash
pnpm store prune
pnpm install
```

如果仍然失败，建议：

- 升级 Node.js 到较新的 LTS 版本
- 关闭代理后重试
- 检查网络连接

### 5. 3000 端口被占用

如果 `http://localhost:3000` 打不开，可能是端口被其他程序占用。

可以先关闭占用端口的程序，或者直接运行：

```bash
pnpm dev -- --port 3001
```

然后在浏览器打开：

- http://localhost:3001

---

## 七、项目目录说明

```text
app/                    页面与接口
app/api/analyze/        质量评估主接口
app/api/excel-parser/   Excel 解析接口
components/             页面组件
lib/                    规则、PDF、HTML、质量评估相关逻辑
public/                 静态资源
styles/                 全局样式
```

其中最关键的几个位置如下：

- [app/page.tsx](app/page.tsx)：前端主页面
- [app/api/analyze/route.ts](app/api/analyze/route.ts)：解析数据并调用 AI 生成报告
- [lib/dimensions-data.ts](lib/dimensions-data.ts)：内置评估维度和二级指标配置
- [.env.example](.env.example)：环境变量示例
- `.env.local`：你本地真实使用的密钥配置文件（不会上传到 GitHub）

---

## 八、推荐的运行环境

为了减少兼容性问题，建议使用下面环境：

- Windows 10 / Windows 11
- Node.js 20+
- pnpm 9+
- Git 最新稳定版
- Chrome 或 Edge 最新版浏览器

---

## 九、部署前说明

如果你要把项目部署到服务器或云平台，也要配置环境变量：

- `AIHUBMIX_API_KEY`

没有这个变量，系统无法正常生成评估报告。

---

## 十、给代码小白的最简操作版

如果你只想最快跑起来，直接照着下面做：

### 1. 安装 Node.js
### 2. 安装 pnpm

```bash
npm install -g pnpm
```

### 3. 下载项目代码

```bash
git clone https://github.com/southwind123/quality.git
cd quality
```

### 4. 安装依赖

```bash
pnpm install
```

### 5. 创建 `.env.local`

内容如下：

```env
AIHUBMIX_API_KEY=你的密钥
```

### 6. 启动项目

```bash
pnpm dev
```

### 7. 打开浏览器

访问：

- http://localhost:3000

---

## 十一、补充说明

- 本项目当前主要面向 Excel 文物元数据质量评估场景
- 报告内容由 AI 生成，建议人工复核后再用于正式业务流程
- `.env.local` 不要提交到 GitHub

如果你是第一次接触前端项目，建议严格按本 README 的顺序执行，不要跳步骤。
