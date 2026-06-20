import jsPDF from "jspdf"
import "jspdf-autotable"

interface PDFOptions {
  title: string
  content: string
  filename: string
}

export function generatePDF(options: PDFOptions): void {
  const { title, content, filename } = options

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const marginTop = 25
  const marginBottom = 25
  const marginLeft = 20
  const marginRight = 20
  const contentWidth = pageWidth - marginLeft - marginRight

  // Using fallback system: SimSun > Microsoft YaHei > Heiti SC
  const setChineseFont = (style: "normal" | "bold" = "normal") => {
    try {
      doc.setFont("SimSun", style)
    } catch {
      try {
        doc.setFont("Microsoft YaHei", style)
      } catch {
        try {
          doc.setFont("Heiti SC", style)
        } catch {
          // Fallback to default font
          doc.setFont("helvetica", style)
        }
      }
    }
  }

  let yPosition = marginTop

  const addPageHeader = () => {
    setChineseFont("normal")
    doc.setFontSize(10)
    doc.setTextColor(136, 136, 136) // Gray #888888
    doc.text("文物数字资源元数据质量评估报告", marginLeft, 12)
  }

  const addPageFooter = (pageNum: number) => {
    setChineseFont("normal")
    doc.setFontSize(10)
    doc.setTextColor(136, 136, 136) // Gray #888888

    // Page number at center
    const pageText = `Page ${pageNum}`
    const pageTextWidth = (doc.getStringUnitWidth(pageText) * doc.getFontSize()) / doc.internal.scaleFactor
    doc.text(pageText, pageWidth / 2 - pageTextWidth / 2, pageHeight - 12)

    // Date at right
    const dateText = new Date().toLocaleDateString("zh-CN")
    doc.text(dateText, pageWidth - marginRight - 15, pageHeight - 12)
  }

  const lines = content.split("\n")
  const titleFontSize = 20
  const heading1FontSize = 16
  const heading2FontSize = 14
  const bodyFontSize = 12
  const bodyLineHeight = (bodyFontSize * 1.5) / doc.internal.scaleFactor

  let currentPageNum = 1

  setChineseFont("bold")
  doc.setFontSize(titleFontSize)
  doc.setTextColor(0, 0, 0)
  doc.text(title, pageWidth / 2, yPosition, { align: "center" })
  yPosition += titleFontSize / 2 + 12

  setChineseFont("normal")
  doc.setFontSize(bodyFontSize)
  doc.setTextColor(0, 0, 0)

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Check for section headers
    let fontSize = bodyFontSize
    let fontWeight: "normal" | "bold" = "normal"
    let spacing = 0

    if (/^\d+\.\s+[A-Z]/.test(line) && !/\d+\.\d+/.test(line)) {
      // Level 1 heading (e.g., "1. 完整性")
      fontSize = heading1FontSize
      fontWeight = "bold"
      spacing = 12
    } else if (/^\d+\.\d+\s+/.test(line)) {
      // Level 2 heading (e.g., "1.1 元数据完整性")
      fontSize = heading2FontSize
      fontWeight = "bold"
      spacing = 8
    }

    const estimatedHeight = fontSize / 2 + spacing + 5
    if (yPosition + estimatedHeight > pageHeight - marginBottom) {
      // Don't split secondary headings
      if (
        fontWeight === "bold" &&
        fontSize === heading2FontSize &&
        yPosition + estimatedHeight > pageHeight - marginBottom - 10
      ) {
        addPageFooter(currentPageNum)
        doc.addPage()
        currentPageNum += 1
        addPageHeader()
        yPosition = marginTop + 10
      } else if (yPosition + estimatedHeight > pageHeight - marginBottom) {
        addPageFooter(currentPageNum)
        doc.addPage()
        currentPageNum += 1
        addPageHeader()
        yPosition = marginTop + 10
      }
    }

    // Add spacing before heading
    if (spacing > 0 && yPosition > marginTop + 10) {
      yPosition += spacing / 2 / doc.internal.scaleFactor
    }

    setChineseFont(fontWeight)
    doc.setFontSize(fontSize)

    // Add first line indent for body text (2em)
    const isBodyText = fontSize === bodyFontSize && fontWeight === "normal"
    const lineIndent = isBodyText ? (2 * bodyFontSize) / doc.internal.scaleFactor : 0

    // Wrap text to fit content width with proper handling
    let wrappedLines: string[] = []
    try {
      wrappedLines = doc.splitTextToSize(line || " ", contentWidth - lineIndent)
    } catch {
      // Fallback if splitTextToSize fails with Chinese characters
      wrappedLines = [line || " "]
    }

    wrappedLines.forEach((wrappedLine: string, index: number) => {
      const xPos = marginLeft + (index === 0 ? lineIndent : 0)
      try {
        doc.text(wrappedLine, xPos, yPosition)
      } catch {
        // Skip lines that can't be rendered
        console.warn("[v0] Could not render line:", wrappedLine)
      }
      yPosition += fontSize / 2 + 1
    })

    // Add spacing after body paragraphs
    if (isBodyText && line.trim()) {
      yPosition += 6 / doc.internal.scaleFactor
    }
  }

  // Add footer to last page
  addPageFooter(currentPageNum)

  doc.save(filename)
}
