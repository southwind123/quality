"use client"

import { Button } from "@/components/ui/button"
import { History } from "lucide-react"
import Image from "next/image"

interface LandingPageProps {
  onStartEvaluation: () => void
  onViewHistory: () => void
}

export default function LandingPage({ onStartEvaluation, onViewHistory }: LandingPageProps) {
  const sidePadding = "clamp(16px, 10vw, 400px)"
  const columnGap = "2vw"

  const titleFontSize = "clamp(28px, 4vw, 48px)"
  const descFontSize = "clamp(14px, 1.2vw, 18px)"
  const tagFontSize = "clamp(12px, 1vw, 16px)"
  const buttonFontSize = "clamp(14px, 1.1vw, 18px)"
  const headerTitleFontSize = "clamp(16px, 1.4vw, 22px)"
  const headerSubFontSize = "clamp(12px, 1vw, 16px)"
  const footerFontSize = "clamp(12px, 1vw, 16px)"

  return (
    <div className="min-h-screen pattern-background flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0 bg-white/80 backdrop-blur-sm border-b border-[#d4a45c]/20 w-full">
        <div className="h-16 flex items-center w-full" style={{ paddingLeft: sidePadding, paddingRight: sidePadding }}>
          <div className="flex items-center gap-3">
            <Image
              src="/images/logo.png"
              alt="Logo"
              width={40}
              height={40}
              className="object-contain"
              style={{ width: "clamp(32px, 3vw, 48px)", height: "clamp(32px, 3vw, 48px)" }}
            />
            <span className="font-medium text-[#78350f]" style={{ fontSize: headerTitleFontSize }}>
              文物数字资源元数据质量评估
              <span className="text-[#78350f]/60 ml-2 hidden sm:inline" style={{ fontSize: headerSubFontSize }}>
                CULTURAL RELIC DATA ASSESSMENT
              </span>
            </span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center">
        <div
          className="w-full"
          style={{
            paddingLeft: sidePadding,
            paddingRight: sidePadding,
            paddingTop: "clamp(20px, 4vh, 60px)",
            paddingBottom: "clamp(40px, 10vh, 140px)",
          }}
        >
          <div className="grid items-center grid-cols-1 md:grid-cols-2" style={{ gap: columnGap }}>
            {/* Left */}
            <div className="min-w-0">
              <div
                className="inline-flex items-center bg-[#fef3c7] text-[#78350f] rounded-full"
                style={{
                  fontSize: tagFontSize,
                  padding: "clamp(4px, 0.5vw, 8px) clamp(10px, 1vw, 16px)",
                  gap: "clamp(4px, 0.4vw, 8px)",
                  marginBottom: "clamp(12px, 1.5vw, 24px)",
                }}
              >
                <span className="bg-[#d4a45c] rounded-full" style={{ width: "8px", height: "8px" }} />
                专业元数据质量评估工具
              </div>

              <h1
                className="font-bold text-[#78350f] leading-tight"
                style={{
                  fontSize: titleFontSize,
                  marginBottom: "clamp(12px, 1.5vw, 28px)",
                }}
              >
                文物数字资源
                <br />
                元数据质量自动化评估
              </h1>

              <p
                className="text-[#78350f]/70 leading-relaxed"
                style={{
                  fontSize: descFontSize,
                  marginBottom: "clamp(16px, 2vw, 32px)",
                }}
              >
                基于文物数字资源元数据质量评估体系，运用大语言模型为数据提供专业的质量评估与优化指导，确保文物数字资源的可用性与规范性。
              </p>

              <div
                className="flex flex-col sm:flex-row items-start sm:items-center"
                style={{
                  gap: "clamp(8px, 1vw, 16px)",
                  marginBottom: "clamp(16px, 2vw, 32px)",
                }}
              >
                <Button
                  onClick={onStartEvaluation}
                  className="bg-[#7b3306] hover:bg-[#5c2605] text-white h-auto rounded-lg font-medium shadow-lg"
                  style={{
                    fontSize: buttonFontSize,
                    padding: "clamp(10px, 1vw, 16px) clamp(20px, 2vw, 32px)",
                  }}
                >
                  开始评估
                </Button>
                <Button
                  variant="outline"
                  onClick={onViewHistory}
                  className="border-[#d4a45c] text-[#78350f] hover:bg-[#f5efe6] hover:text-[#78350f] h-auto rounded-lg font-medium bg-transparent"
                  style={{
                    fontSize: buttonFontSize,
                    padding: "clamp(10px, 1vw, 16px) clamp(20px, 2vw, 32px)",
                  }}
                >
                  <History
                    style={{
                      width: "clamp(14px, 1.2vw, 20px)",
                      height: "clamp(14px, 1.2vw, 20px)",
                      marginRight: "8px",
                    }}
                  />
                  查看历史记录
                </Button>
              </div>

              <div
                className="flex items-center text-[#78350f]/60"
                style={{
                  fontSize: footerFontSize,
                  gap: "clamp(12px, 2vw, 32px)",
                }}
              >
                <div className="flex items-center gap-1">
                  <span className="text-[#78350f] font-semibold">自定义</span> 评估规则
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[#78350f] font-semibold">7</span> 大评估维度全覆盖
                </div>
              </div>
            </div>

            {/* Right */}
            <div className="flex justify-center md:justify-end items-center mt-8 md:mt-0">
              <div className="relative aspect-square" style={{ width: "clamp(220px, 32vw, 520px)" }}>
                <Image
                  src="/images/hero-illustration.png"
                  alt="文物数据质量评估插图"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
