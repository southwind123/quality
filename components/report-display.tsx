"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Copy, Download, FileText, AlertCircle, RotateCcw, Loader2 } from "lucide-react"
import { useState, useMemo } from "react"
import { generatePDF } from "@/lib/pdf-generator"
import { generateHTML } from "@/lib/html-generator"
import ReactMarkdown from "react-markdown"

interface ReportDisplayProps {
  report: string
  onBackToConfigure: () => void
  onBackToUpload: () => void
  isLoading?: boolean
}

interface ReportSection {
  title: string
  content: string
  icon?: React.ReactNode
}

export default function ReportDisplay({
  report,
  onBackToConfigure,
  onBackToUpload,
  isLoading = false,
}: ReportDisplayProps) {
  const [copied, setCopied] = useState(false)

  const reportSections = useMemo((): ReportSection[] => {
    const sections: ReportSection[] = []
    const lines = report.split("\n")
    let currentSection: ReportSection | null = null

    lines.forEach((line) => {
      if (line.match(/^#{1,3}\s/) || line.match(/^\d+\.\s/) || line.match(/^[A-Z][^a-z]*:$/)) {
        if (currentSection) {
          sections.push(currentSection)
        }
        const title = line.replace(/^#+\s|^\d+\.\s|:$/, "").trim()
        currentSection = {
          title,
          content: "",
          icon:
            line.includes("Issue") || line.includes("Problem") ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <FileText className="w-4 h-4" />
            ),
        }
      } else if (currentSection && line.trim()) {
        currentSection.content += line + "\n"
      }
    })

    if (currentSection) {
      sections.push(currentSection)
    }

    return sections.length > 0 ? sections : [{ title: "Evaluation Report", content: report }]
  }, [report])

  const handleCopy = () => {
    navigator.clipboard.writeText(report)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const element = document.createElement("a")
    const file = new Blob([report], { type: "text/plain" })
    element.href = URL.createObjectURL(file)
    element.download = `evaluation-report-${new Date().toISOString().split("T")[0]}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const handleDownloadPDF = () => {
    const today = new Date()
    const dateStr = today.toISOString().split("T")[0].replace(/-/g, "")
    const filename = `Cultural_Relic_Metadata_Quality_Report_${dateStr}.pdf`

    generatePDF({
      title: "文物数字资源元数据质量评估报告",
      content: report,
      filename,
    })
  }

  const handleDownloadHTML = () => {
    const today = new Date()
    const dateStr = today.toISOString().split("T")[0].replace(/-/g, "")
    const filename = `文物数字资源元数据质量报告_${dateStr}.html`

    generateHTML({
      title: "文物数字资源元数据质量评估报告",
      content: report,
      filename,
    })
  }

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        {/* 顶部按钮区域 */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            onClick={onBackToConfigure}
            className="gap-2 bg-[#8b4513] hover:bg-[#723a0f] text-white rounded-full px-6"
          >
            <ArrowLeft className="h-4 w-4" />
            返回配置
          </Button>
          <Button
            onClick={onBackToUpload}
            variant="ghost"
            className="gap-2 text-[#6b7280] hover:text-[#4b5563] hover:bg-transparent"
          >
            <RotateCcw className="h-4 w-4" />
            重新开始
          </Button>
        </div>

        {/* 加载卡片 */}
        <Card className="flex-1 border border-border bg-white flex items-center justify-center">
          <div className="text-center">
            {/* 旋转加载图标 */}
            <div className="w-24 h-24 mx-auto mb-6 rounded-full border-4 border-[#e5e5e5] flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-[#8b4513] animate-spin" />
            </div>

            <h3 className="text-xl text-[#8b4513] font-medium mb-2">正在生成评估报告...</h3>
            <p className="text-[#9ca3af] text-sm mb-6">正在分析文物数据完整性、规范性与一致性</p>

            {/* 三个点动画 */}
            <div className="flex justify-center gap-2">
              <span
                className="w-2 h-2 bg-[#d4a45c] rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              ></span>
              <span
                className="w-2 h-2 bg-[#d4a45c] rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              ></span>
              <span
                className="w-2 h-2 bg-[#d4a45c] rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              ></span>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 h-full overflow-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex gap-3">
          <Button
            onClick={onBackToConfigure}
            className="gap-2 bg-[#8b4513] hover:bg-[#723a0f] text-white rounded-full px-6"
          >
            <ArrowLeft className="h-4 w-4" />
            返回配置
          </Button>
          <Button
            onClick={onBackToUpload}
            variant="ghost"
            className="gap-2 text-[#6b7280] hover:text-[#4b5563] hover:bg-transparent"
          >
            <RotateCcw className="h-4 w-4" />
            重新开始
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          生成时间: {new Date().toLocaleDateString("zh-CN")} {new Date().toLocaleTimeString("zh-CN")}
        </div>
      </div>

      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <FileText className="w-5 h-5 text-primary" />
            AI生成的评估报告
          </CardTitle>
          <CardDescription className="text-muted-foreground">基于您定义的评估规则生成的综合分析报告</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Report Content Display */}
          <div className="bg-muted/30 rounded-xl p-6 border border-border min-h-96 max-h-96 overflow-y-auto">
  <div
    id="report-content"
    className="prose prose-slate max-w-none text-sm leading-relaxed"
  >
    <ReactMarkdown>{report}</ReactMarkdown>
  </div>
</div>

          {report && (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-muted/50 rounded-xl p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">报告长度</p>
                <p className="text-lg font-semibold text-foreground">{report.length.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">字符</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">章节数</p>
                <p className="text-lg font-semibold text-foreground">{reportSections.length}</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">行数</p>
                <p className="text-lg font-semibold text-foreground">{report.split("\n").length}</p>
              </div>
            </div>
          )}

          <div className="flex gap-3 flex-wrap">
            <Button
              onClick={handleCopy}
              variant="outline"
              className="gap-2 bg-transparent border-border text-foreground hover:bg-[#723a0f] flex-1 rounded-full"
            >
              <Copy className="h-4 w-4" />
              {copied ? "已复制!" : "复制报告"}
            </Button>
            <Button
              onClick={handleDownload}
              variant="outline"
              className="gap-2 bg-[#8b4513] hover:bg-[#723a0f] border-[#d4a45c] text-white flex-1 rounded-full"
            >
              <Download className="h-4 w-4" />
              下载 TXT
            </Button>
            <Button
              onClick={handleDownloadHTML}
              className="gap-2 bg-[#8b4513] hover:bg-[#723a0f] text-white flex-1 rounded-full"
            >
              <Download className="h-4 w-4" />
              下载 HTML
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
