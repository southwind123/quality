interface GenerateHTMLOptions {
  title: string
  content: string   // 兜底用
  filename: string
}

export function generateHTML({ title, content, filename }: GenerateHTMLOptions): void {
  const now = new Date()
  const timestamp = now.toLocaleString("zh-CN")

  let renderedHTML = ""

  if (typeof document !== "undefined") {
    const container = document.getElementById("report-content")
    if (container) {
      renderedHTML = container.innerHTML
    }
  }

  if (!renderedHTML) {
    const escaped = content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")

    renderedHTML = `<pre>${escaped}</pre>`
  }

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    :root {
      --bg: #f3f4f6;
      --card-bg: #ffffff;
      --primary: #2563eb;
      --primary-soft: #eff6ff;
      --border-subtle: #e5e7eb;
      --text-main: #111827;
      --text-muted: #6b7280;
      --accent: #0ea5e9;
      --danger: #dc2626;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: "Microsoft YaHei", system-ui, -apple-system, BlinkMacSystemFont,
        "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Heiti SC", Arial, sans-serif;
      line-height: 1.8;
      color: var(--text-main);
      background: radial-gradient(circle at top left, #e0f2fe 0, var(--bg) 55%);
      padding: 40px 16px;
    }

    .container {
      max-width: 1100px;
      margin: 0 auto;
      background: var(--card-bg);
      border-radius: 16px;
      box-shadow:
        0 20px 25px -5px rgba(15, 23, 42, 0.08),
        0 8px 10px -6px rgba(15, 23, 42, 0.06);
      padding: 32px 40px 40px;
      border: 1px solid rgba(148, 163, 184, 0.25);
    }

    .report-header {
      border-bottom: 1px solid var(--border-subtle);
      padding-bottom: 18px;
      margin-bottom: 24px;
    }

    .report-header h1 {
      font-size: 24px;
      letter-spacing: 0.03em;
      margin-bottom: 6px;
      color: var(--text-main);
    }

    .report-header .subtitle {
      font-size: 13px;
      color: var(--text-muted);
      margin-bottom: 8px;
    }

    .report-header .meta {
      font-size: 12px;
      color: var(--text-muted);
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      border-radius: 999px;
      background: var(--primary-soft);
      color: var(--primary);
      font-size: 11px;
      font-weight: 500;
      margin-right: 8px;
    }

    .badge-dot {
      width: 6px;
      height: 6px;
      border-radius: 999px;
      background: var(--primary);
    }

    .content {
      font-size: 14px;
      color: var(--text-main);
    }

    .content h1,
    .content h2,
    .content h3 {
      margin-top: 24px;
      margin-bottom: 8px;
      line-height: 1.4;
      color: var(--text-main);
    }

    .content h1 {
      font-size: 20px;
      border-left: 4px solid var(--primary);
      padding-left: 10px;
      background: linear-gradient(to right, rgba(37, 99, 235, 0.06), transparent);
      border-radius: 6px;
    }

    .content h2 {
      font-size: 18px;
      border-left: 3px solid var(--accent);
      padding-left: 8px;
      background: linear-gradient(to right, rgba(14, 165, 233, 0.08), transparent);
      border-radius: 6px;
    }

    .content h3 {
      font-size: 16px;
      border-left: 2px solid #9ca3af;
      padding-left: 6px;
      color: #374151;
    }

    .content p {
      margin: 8px 0;
      text-align: justify;
    }

    .content strong {
      font-weight: 600;
      color: #111827;
    }

    .content em {
      color: #4b5563;
    }

    .content hr {
      border: none;
      border-top: 1px dashed var(--border-subtle);
      margin: 16px 0;
    }

    .content ul,
    .content ol {
      margin: 8px 0 8px 24px;
      padding-left: 0;
    }

    .content ul li {
      margin: 4px 0;
      position: relative;
    }

    .content ul li::marker {
      color: var(--primary);
    }

    .content ol li {
      margin: 4px 0;
    }

    .content blockquote {
      border-left: 4px solid var(--primary);
      padding-left: 12px;
      margin: 12px 0;
      color: var(--text-muted);
      background: #f9fafb;
      border-radius: 4px;
    }

    .content code {
      font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
        "Liberation Mono", "Courier New", monospace;
      font-size: 12px;
      background: #f3f4f6;
      padding: 2px 4px;
      border-radius: 4px;
    }

    .content pre {
      background: #0b1120;
      color: #e5e7eb;
      padding: 10px 12px;
      border-radius: 8px;
      overflow-x: auto;
      font-size: 12px;
    }

    .content table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0;
      font-size: 13px;
      table-layout: auto;
    }

    .content table th,
    .content table td {
      border: 1px solid var(--border-subtle);
      padding: 6px 8px;
      text-align: left;
      vertical-align: top;
    }

    .content table th {
      background: #f9fafb;
      font-weight: 600;
      color: #111827;
    }

    .content table tr:nth-child(even) td {
      background: #f9fafb;
    }

    .content table tr:hover td {
      background: rgba(219, 234, 254, 0.6);
    }

    .indicator-section {
      padding: 12px 14px;
      margin: 16px 0;
      border-radius: 10px;
      border: 1px solid rgba(148, 163, 184, 0.6);
      background: linear-gradient(135deg, #f9fafb, #eff6ff);
    }

    .indicator-section h2,
    .indicator-section h3 {
      margin-top: 0;
    }

    .tag-pill {
      display: inline-flex;
      align-items: center;
      padding: 1px 8px;
      border-radius: 999px;
      font-size: 11px;
      background: rgba(37, 99, 235, 0.08);
      color: var(--primary);
      margin-right: 6px;
    }

    .tag-pill.danger {
      background: rgba(220, 38, 38, 0.06);
      color: var(--danger);
    }

    .note {
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 4px;
    }

    @media print {
      body {
        background: #ffffff;
        padding: 0;
      }
      .container {
        box-shadow: none;
        border-radius: 0;
        border: none;
        max-width: 100%;
        margin: 0;
        padding: 20px 24px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="report-header">
      <div class="badge"><span class="badge-dot"></span>元数据质量评估报告</div>
      <h1>${title}</h1>
      <div class="subtitle">Cultural Relic Digital Resource Metadata Quality Evaluation</div>
      <div class="meta">导出时间：${timestamp}</div>
    </div>
    <div class="content">
      ${renderedHTML}
    </div>
  </div>
</body>
</html>`

  const blob = new Blob([html], { type: "text/html;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
