"use client"

import type React from "react"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, FileSpreadsheet } from "lucide-react"

interface FileUploadSectionProps {
  onFileUpload: (file: File) => void
}

export default function FileUploadSection({ onFileUpload }: FileUploadSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.currentTarget.classList.add("border-primary")
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.currentTarget.classList.remove("border-primary")
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.currentTarget.classList.remove("border-primary")

    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (
        file.type.includes("spreadsheet") ||
        file.type.includes("excel") ||
        file.name.endsWith(".xlsx") ||
        file.name.endsWith(".xls")
      ) {
        onFileUpload(file)
      } else {
        alert("Please upload an Excel file (.xlsx or .xls)")
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      onFileUpload(files[0])
    }
  }

  return (
    <Card className="border border-border bg-card shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <FileSpreadsheet className="w-5 h-5 text-primary" />
          上传Excel文件
        </CardTitle>
        <CardDescription className="text-muted-foreground">拖放您的Excel文件或点击下方区域选择文件</CardDescription>
      </CardHeader>
      <CardContent>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border rounded-xl p-12 text-center transition-all cursor-pointer hover:border-primary hover:bg-primary/5 bg-muted/30"
        >
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFileSelect} className="hidden" />

          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-primary/10 rounded-xl">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="text-foreground font-medium mb-1">将Excel文件拖放到此处</p>
              <p className="text-muted-foreground text-sm">或</p>
            </div>
            <Button
              onClick={(e) => {
                e.stopPropagation()
                fileInputRef.current?.click()
              }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer rounded-full px-6 shadow-md"
            >
              <Upload className="w-4 h-4 mr-2" />
              选择文件
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
