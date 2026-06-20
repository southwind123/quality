"use client"

import { Check } from "lucide-react"

type Step = "landing" | "upload" | "configure" | "report"

interface StepNavigationProps {
  currentStep: Step
  onStepClick?: (step: Step) => void
  canNavigate?: boolean
  maxStep?: Step
  isReportComplete?: boolean
}

const steps = [
  { id: "upload" as Step, label: "上传文件", number: 1 },
  { id: "configure" as Step, label: "维度配置", number: 2 },
  { id: "report" as Step, label: "查看报告", number: 3 },
]

export default function StepNavigation({
  currentStep,
  onStepClick,
  canNavigate = false,
  maxStep,
  isReportComplete = false,
}: StepNavigationProps) {
  const getStepIndex = (step: Step) => {
    if (step === "landing") return -1
    return steps.findIndex((s) => s.id === step)
  }

  const currentIndex = getStepIndex(currentStep)
  const maxIndex = maxStep ? getStepIndex(maxStep) : currentIndex

  const isStepClickable = (index: number) => {
    if (!canNavigate || !onStepClick) return false
    return index <= maxIndex
  }

  const isStepCompleted = (index: number, stepId: Step) => {
    if (stepId === "report" && isReportComplete) {
      return true
    }
    return index < maxIndex
  }

  const handleStepClick = (step: Step, index: number) => {
    if (isStepClickable(index) && onStepClick) {
      onStepClick(step)
    }
  }

  return (
    <div className="flex items-center justify-center gap-0 py-6">
      {steps.map((step, index) => {
        const isCompleted = isStepCompleted(index, step.id)
        const isCurrent = index === currentIndex
        const isLast = index === steps.length - 1
        const clickable = isStepClickable(index)

        return (
          <div key={step.id} className="flex items-center">
            <div
              className={`flex flex-col items-center ${clickable ? "cursor-pointer" : ""}`}
              onClick={() => handleStepClick(step.id, index)}
            >
              {/* Circle */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  isCompleted
                    ? "bg-[#7b3306] border-[#7b3306] text-white"
                    : isCurrent
                      ? "bg-[#7b3306]/10 border-[#7b3306] text-[#7b3306]"
                      : "bg-white border-[#d4a45c]/30 text-[#78350f]/50"
                } ${clickable ? "hover:ring-2 hover:ring-[#d4a45c]/50 hover:ring-offset-2" : ""}`}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-semibold">{step.number}</span>
                )}
              </div>
              {/* Label */}
              <div className="mt-2 flex flex-col items-center">
                <span className="text-xs text-[#78350f]/50">STEP {step.number}</span>
                <span
                  className={`text-sm font-medium ${isCompleted || isCurrent ? "text-[#78350f]" : "text-[#78350f]/50"} ${clickable ? "hover:underline" : ""}`}
                >
                  {step.label}
                </span>
              </div>
            </div>

            {/* Connector Line - 当 step3 完成时，第二条连接线也变为实线 */}
            {!isLast && (
              <div className="flex items-center mx-8 -mt-6">
                <div
                  className={`w-32 h-0.5 transition-all ${
                    isCompleted || (index === 1 && isReportComplete) ? "bg-[#7b3306]" : "bg-[#d4a45c]/30"
                  }`}
                  style={{
                    backgroundImage:
                      isCompleted || (index === 1 && isReportComplete)
                        ? "none"
                        : "repeating-linear-gradient(90deg, #d4a45c 0, #d4a45c 4px, transparent 4px, transparent 8px)",
                  }}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
