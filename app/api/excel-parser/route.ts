import { type NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: "array" })

    const structuredData: Record<string, any[]> = {}

    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" })
      structuredData[sheetName] = jsonData
    })

    return NextResponse.json({ structuredData })
  } catch (error) {
    console.error("Error parsing Excel:", error)
    return NextResponse.json({ error: "Failed to parse Excel file" }, { status: 500 })
  }
}
