import { generateText } from "ai"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const rulesJson = formData.get("rules") as string

    if (!file || !rulesJson) {
      return NextResponse.json({ error: "Missing file or rules" }, { status: 400 })
    }

    // Parse the rules
    const rules = JSON.parse(rulesJson)

    // Read file content (simplified - in production you'd parse Excel properly)
    const fileContent = await file.text()

    // Create a prompt for the AI
    const prompt = `
You are a data quality analyst. Analyze the following data evaluation rules and provide a comprehensive report.

FILE: ${file.name}

EVALUATION RULES:
${JSON.stringify(rules, null, 2)}

FILE PREVIEW (first 500 chars):
${fileContent.substring(0, 500)}

Please generate a detailed evaluation report that:
1. Assesses the data against each defined rule
2. Identifies potential data quality issues
3. Provides recommendations for improvement
4. Summarizes the overall data quality score

Format the report in a clear, structured manner with sections and bullet points.
    `

    // Call AI to generate report
    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt: prompt,
      temperature: 0.7,
      maxTokens: 2000,
    })

    return NextResponse.json({ report: text })
  } catch (error) {
    console.error("Error generating report:", error)
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 })
  }
}
