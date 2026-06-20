"use client"

import { useState, useEffect } from "react"
import FileUploadSection from "@/components/file-upload-section"
import EvaluationDimensions from "@/components/evaluation-dimensions"
import ReportDisplay from "@/components/report-display"
import StepNavigation from "@/components/step-navigation"
import LandingPage from "@/components/landing-page"
import HistoryModal, { type HistoryRecord } from "@/components/history-modal"
import { Button } from "@/components/ui/button"
import { Home } from "lucide-react"

type Step = "landing" | "upload" | "configure" | "report"

interface SelectedIndicators {
  [dimensionId: string]: {
    name: string
    subIndicators: Array<{
      id: string
      name: string
    }>
  }
}

const HISTORY_STORAGE_KEY = "evaluation_history"

export default function Main() {
  const [step, setStep] = useState<Step>("landing")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [report, setReport] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [fileMetadata, setFileMetadata] = useState<{ name: string; size: number } | null>(null)

  const [historyModalOpen, setHistoryModalOpen] = useState(false)
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([])
  const [currentSelectedIndicators, setCurrentSelectedIndicators] = useState<SelectedIndicators>({})
  const [viewingHistoryRecord, setViewingHistoryRecord] = useState<HistoryRecord | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem(HISTORY_STORAGE_KEY)
    if (stored) {
      try {
        setHistoryRecords(JSON.parse(stored))
      } catch (e) {
        console.error("Failed to parse history records", e)
      }
    }
  }, [])

  const saveHistoryRecords = (records: HistoryRecord[]) => {
    setHistoryRecords(records)
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(records))
  }

  const handleFileUpload = (file: File) => {
    setUploadedFile(file)
    setFileMetadata({
      name: file.name,
      size: file.size,
    })
    setViewingHistoryRecord(null)
    setStep("configure")
  }

  useEffect(() => {
    const handleReplaceFile = (e: CustomEvent<File>) => {
      const file = e.detail
      if (file) {
        setUploadedFile(file)
        setFileMetadata({
          name: file.name,
          size: file.size,
        })
      }
    }

    window.addEventListener("replaceFile", handleReplaceFile as EventListener)
    return () => {
      window.removeEventListener("replaceFile", handleReplaceFile as EventListener)
    }
  }, [])

  const handleGenerateReport = async (selectedIndicators: SelectedIndicators) => {
    if (!uploadedFile) return

    setCurrentSelectedIndicators(selectedIndicators)
    setStep("report")
    setIsLoading(true)
    setReport("")

    try {
      const formData = new FormData()
      formData.append("file", uploadedFile)
      formData.append("selectedIndicators", JSON.stringify(selectedIndicators))

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Failed to generate report")

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let reportText = ""

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          reportText += chunk
          setReport(reportText)
        }
      }

      const newRecord: HistoryRecord = {
        id: Date.now().toString(),
        fileName: uploadedFile.name,
        fileSize: uploadedFile.size,
        report: reportText,
        createdAt: new Date().toISOString(),
        selectedIndicators: selectedIndicators,
      }
      saveHistoryRecords([newRecord, ...historyRecords])
    } catch (error) {
      console.error("Error generating report:", error)
      alert("Failed to generate report")
      setStep("configure")
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToUpload = () => {
    setStep("upload")
    setUploadedFile(null)
    setFileMetadata(null)
    setReport("")
    setViewingHistoryRecord(null)
  }

  const handleBackToConfigure = () => {
    if (viewingHistoryRecord) {
      // 如果是从历史记录进入的，返回配置页面时显示历史记录的配置
      setStep("configure")
    } else {
      setStep("configure")
    }
  }

  const handleStartEvaluation = () => {
    setViewingHistoryRecord(null)
    setStep("upload")
  }

  const handleBackToLanding = () => {
    setStep("landing")
    setUploadedFile(null)
    setFileMetadata(null)
    setReport("")
    setViewingHistoryRecord(null)
  }

  const handleViewHistory = () => {
    setHistoryModalOpen(true)
  }

  const handleSelectHistoryRecord = (record: HistoryRecord) => {
    setViewingHistoryRecord(record)
    setFileMetadata({
      name: record.fileName,
      size: record.fileSize,
    })
    setReport(record.report)
    setCurrentSelectedIndicators(record.selectedIndicators)
    setStep("report")
  }

  const handleDeleteHistoryRecord = (id: string) => {
    const newRecords = historyRecords.filter((r) => r.id !== id)
    saveHistoryRecords(newRecords)
  }

  const handleStepClick = (targetStep: Step) => {
    if (viewingHistoryRecord) {
      if (targetStep === "configure" || targetStep === "report") {
        setStep(targetStep)
      }
    } else if (report) {
      // 正常生成报告后，允许在configure和report之间切换
      if (targetStep === "configure" || targetStep === "report") {
        setStep(targetStep)
      }
    }
  }

  if (step === "landing") {
    return (
      <>
        <LandingPage onStartEvaluation={handleStartEvaluation} onViewHistory={handleViewHistory} />
        <HistoryModal
          open={historyModalOpen}
          onOpenChange={setHistoryModalOpen}
          records={historyRecords}
          onSelectRecord={handleSelectHistoryRecord}
          onDeleteRecord={handleDeleteHistoryRecord}
        />
      </>
    )
  }

  return (
    <main className="h-screen bg-background pattern-background overflow-hidden flex flex-col">
      <header className="flex-shrink-0 bg-white/80 backdrop-blur-sm border-b border-[#d4a45c]/20 w-full">
        <div className="h-16 flex items-center justify-between max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBackToLanding}
              className="border-[#d4a45c]/30 text-[#78350f] hover:bg-[#f5efe6] hover:text-[#78350f] rounded-full px-4 bg-white/50"
            >
              <Home className="w-4 h-4 mr-2" />
              返回首页
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full w-full max-w-6xl mx-auto px-6 py-4 flex flex-col">
          <StepNavigation
            currentStep={step}
            onStepClick={handleStepClick}
            canNavigate={!!viewingHistoryRecord || !!report}
            maxStep={viewingHistoryRecord || report ? "report" : step}
            isReportComplete={!!report && !isLoading}
          />

          <div className="flex-1 min-h-0 overflow-hidden">
            {step === "upload" && <FileUploadSection onFileUpload={handleFileUpload} />}

            {step === "configure" && (uploadedFile || viewingHistoryRecord) && (
              <EvaluationDimensions
                fileName={fileMetadata?.name || ""}
                fileSize={fileMetadata?.size || 0}
                onGenerateReport={handleGenerateReport}
                isLoading={isLoading}
                onReplaceFile={() => setStep("upload")}
                initialSelectedIndicators={viewingHistoryRecord?.selectedIndicators}
                readOnly={!!viewingHistoryRecord}
              />
            )}

            {step === "report" && (
              <ReportDisplay
                report={report}
                onBackToConfigure={handleBackToConfigure}
                onBackToUpload={handleBackToUpload}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
