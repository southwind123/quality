"use client"

import { useCallback } from "react"

import type React from "react"
import { useState, useRef, useEffect, useMemo } from "react"
import DimensionCard from "./dimension-card"
import { ChevronDown, RefreshCw, Save, X, FileSpreadsheet, Trash2, Sparkles } from "lucide-react"
import { DIMENSIONS } from "@/lib/dimensions-data"

interface SelectedIndicators {
  [dimensionId: string]: {
    name: string
    subIndicators: Array<{
      id: string
      name: string
      description?: string
      rules?: string[]
    }>
  }
}

interface EvaluationDimensionsProps {
  fileName: string
  fileSize: number
  onGenerateReport: (selectedIndicators: SelectedIndicators) => void
  isLoading: boolean
  onReplaceFile: () => void
  initialSelectedIndicators?: SelectedIndicators
  readOnly?: boolean
}

const STORAGE_KEY = "evaluation_selections"
const RULES_STORAGE_KEY = "evaluation_rules"

const DEFAULT_SELECTIONS = () => {
  const initial: Record<string, Set<string>> = {}
  const initialChecked: Record<string, boolean> = {}
  DIMENSIONS.forEach((dim) => {
    initial[dim.id] = new Set(dim.subIndicators.map((sub) => sub.id))
    initialChecked[dim.id] = true
  })
  return { selections: initial, checked: initialChecked }
}

const serializeSelections = (selections: Record<string, Set<string>>, checked: Record<string, boolean>) => {
  return JSON.stringify({
    selections: Object.fromEntries(Object.entries(selections).map(([key, set]) => [key, Array.from(set)])),
    checked,
  })
}

const deserializeSelections = (json: string) => {
  try {
    const data = JSON.parse(json)
    return {
      selections: Object.fromEntries(
        Object.entries(data.selections).map(([key, arr]) => [key, new Set(arr as string[])]),
      ),
      checked: data.checked,
    }
  } catch {
    return null
  }
}

export default function EvaluationDimensions({
  fileName,
  fileSize,
  onGenerateReport,
  isLoading,
  onReplaceFile,
  initialSelectedIndicators,
  readOnly = false,
}: EvaluationDimensionsProps) {
  const [selectedDimensions, setSelectedDimensions] = useState<Record<string, Set<string>>>(() => {
    if (initialSelectedIndicators) {
      const selections: Record<string, Set<string>> = {}
      DIMENSIONS.forEach((dim) => {
        if (initialSelectedIndicators[dim.id]) {
          selections[dim.id] = new Set(initialSelectedIndicators[dim.id].subIndicators.map((s) => s.id))
        } else {
          selections[dim.id] = new Set()
        }
      })
      return selections
    }
    if (typeof window === "undefined") return DEFAULT_SELECTIONS().selections
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const deserialized = deserializeSelections(saved)
      return deserialized?.selections || DEFAULT_SELECTIONS().selections
    }
    return DEFAULT_SELECTIONS().selections
  })

  const [dimensionChecked, setDimensionChecked] = useState<Record<string, boolean>>(() => {
    if (initialSelectedIndicators) {
      const checked: Record<string, boolean> = {}
      DIMENSIONS.forEach((dim) => {
        checked[dim.id] = !!initialSelectedIndicators[dim.id]
      })
      return checked
    }
    if (typeof window === "undefined") return DEFAULT_SELECTIONS().checked
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const deserialized = deserializeSelections(saved)
      return deserialized?.checked || DEFAULT_SELECTIONS().checked
    }
    return DEFAULT_SELECTIONS().checked
  })

  const [rules, setRules] = useState<Record<string, string[]>>(() => {
    if (typeof window === "undefined") return {}
    const saved = localStorage.getItem(RULES_STORAGE_KEY)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return {}
      }
    }
    return {}
  })

  const [presets, setPresets] = useState<{ name: string; rules: Record<string, string[]> }[]>(() => {
    if (typeof window === "undefined") return []
    const saved = localStorage.getItem("rule_presets")
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return []
      }
    }
    return []
  })
  const [selectedPreset, setSelectedPreset] = useState<string>("")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [toast, setToast] = useState<{ message: string; type: "success" | "info" } | null>(null)

  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [presetName, setPresetName] = useState("")

  const showToast = (message: string, type: "success" | "info" = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleDimensionToggle = (dimensionId: string) => {
    if (readOnly) return
    setDimensionChecked((prev) => {
      const newState = { ...prev, [dimensionId]: !prev[dimensionId] }
      setSelectedDimensions((prevDims) => {
        const dimension = DIMENSIONS.find((d) => d.id === dimensionId)
        if (!dimension) return prevDims

        const newDims = { ...prevDims }
        if (newState[dimensionId]) {
          newDims[dimensionId] = new Set(dimension.subIndicators.map((sub) => sub.id))
        } else {
          newDims[dimensionId] = new Set()
        }
        return newDims
      })
      return newState
    })
  }

  const handleSubIndicatorToggle = (dimensionId: string, subIndicatorId: string) => {
    if (readOnly) return
    setSelectedDimensions((prev) => {
      const newDims = { ...prev }
      const newSet = new Set(newDims[dimensionId])

      if (newSet.has(subIndicatorId)) {
        newSet.delete(subIndicatorId)
      } else {
        newSet.add(subIndicatorId)
      }

      newDims[dimensionId] = newSet

      setDimensionChecked((prevChecked) => {
        const dimension = DIMENSIONS.find((d) => d.id === dimensionId)
        const allSelected = dimension ? dimension.subIndicators.every((sub) => newSet.has(sub.id)) : false
        return { ...prevChecked, [dimensionId]: allSelected }
      })

      return newDims
    })
  }

  const handleAddRule = (subIndicatorId: string, rule: string) => {
    if (readOnly) return
    if (!rule.trim()) return

    setRules((prev) => {
      const updated = { ...prev }
      if (!updated[subIndicatorId]) {
        updated[subIndicatorId] = []
      }
      if (!updated[subIndicatorId].includes(rule)) {
        updated[subIndicatorId] = [...updated[subIndicatorId], rule]
      }
      localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }

  const handleRemoveRule = (subIndicatorId: string, rule: string) => {
    if (readOnly) return
    setRules((prev) => {
      const updated = { ...prev }
      updated[subIndicatorId] = (updated[subIndicatorId] || []).filter((r) => r !== rule)
      localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }

  const handleLoadPreset = (presetRules: Record<string, string[]>) => {
    setRules(presetRules)
    localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(presetRules))
  }

  const handleSavePresetClick = () => {
    const defaultName = `规则-${new Date().toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" }).replace("/", "")}${new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }).replace(":", "")}`
    setPresetName(defaultName)
    setShowSaveDialog(true)
  }

  const handleConfirmSavePreset = () => {
    if (!presetName.trim()) return

    const newPreset = { name: presetName.trim(), rules }
    const updatedPresets = [...presets, newPreset]
    setPresets(updatedPresets)
    setSelectedPreset(presetName.trim())
    localStorage.setItem("rule_presets", JSON.stringify(updatedPresets))
    showToast(`预设 "${presetName.trim()}" 已保存`, "success")
    setShowSaveDialog(false)
    setPresetName("")
  }

  const handlePresetChange = (presetName: string) => {
    setSelectedPreset(presetName)
    const preset = presets.find((p) => p.name === presetName)
    if (preset) {
      setRules(preset.rules)
      localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(preset.rules))
      showToast(`已加载预设 "${presetName}"`, "info")
    }
  }

  const hasAnyDimensionSelected = useMemo(() => {
    return Object.values(dimensionChecked).some((checked) => checked)
  }, [dimensionChecked])

  const handleGenerateReport = useCallback(() => {
    const payload: SelectedIndicators = {}

    DIMENSIONS.forEach((dimension) => {
      if (dimensionChecked[dimension.id]) {
        const selectedSubs = dimension.subIndicators.filter((sub) => selectedDimensions[dimension.id]?.has(sub.id))

        if (selectedSubs.length > 0) {
          payload[dimension.id] = {
            name: dimension.name,
            subIndicators: selectedSubs.map((sub) => ({
              id: sub.id,
              name: sub.name,
              description: sub.description,
              rules: rules[sub.id] || [],
            })),
          }
        }
      }
    })

    onGenerateReport(payload)
  }, [rules, dimensionChecked, selectedDimensions, onGenerateReport])

  const handleResetRules = () => {
    const defaults = DEFAULT_SELECTIONS()
    setSelectedDimensions(defaults.selections)
    setDimensionChecked(defaults.checked)
    setRules({})
    setSelectedPreset("")
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(RULES_STORAGE_KEY)
    localStorage.removeItem("rule_presets")
    showToast("已重置所有设置", "info")
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  useEffect(() => {
    const handleTriggerGenerate = () => {
      if (hasAnyDimensionSelected && !isLoading) {
        handleGenerateReport()
      }
    }
    window.addEventListener("triggerGenerateReport", handleTriggerGenerate)
    return () => window.removeEventListener("triggerGenerateReport", handleTriggerGenerate)
  }, [hasAnyDimensionSelected, isLoading, handleGenerateReport])

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleReplaceClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      window.dispatchEvent(new CustomEvent("replaceFile", { detail: file }))
    }
    e.target.value = ""
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="flex h-full overflow-hidden gap-6">
      {!readOnly && (
        <div className="w-72 flex-shrink-0 flex flex-col gap-4 overflow-y-auto scrollbar-hide sticky top-0 self-start max-h-full pt-[56px]">
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <h3 className="text-base font-semibold text-primary mb-4">上传文件</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm truncate">{fileName}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(fileSize)}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleReplaceClick}
                className="flex-1 py-2.5 px-4 text-sm text-muted-foreground bg-muted/50 hover:bg-muted rounded-xl cursor-pointer transition-colors font-medium"
              >
                替换文件
              </button>
              <button
                onClick={onReplaceFile}
                className="p-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl cursor-pointer transition-colors"
                title="删除文件"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <h3 className="text-base font-semibold text-primary mb-4">规则预设</h3>
            <div className="relative mb-3" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full flex items-center justify-between gap-2 bg-muted/50 hover:bg-muted text-sm text-foreground cursor-pointer rounded-xl px-4 py-2.5 transition-colors"
              >
                <span className={selectedPreset ? "text-foreground" : "text-muted-foreground"}>
                  {selectedPreset || "选择预设"}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-muted-foreground transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <button
                    onClick={() => {
                      handlePresetChange("")
                      setIsDropdownOpen(false)
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                  >
                    选择预设
                  </button>
                  {presets.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => {
                        handlePresetChange(preset.name)
                        setIsDropdownOpen(false)
                      }}
                      className={`w-full px-4 py-2 text-left text-sm transition-colors cursor-pointer ${
                        selectedPreset === preset.name
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={handleSavePresetClick}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm text-primary bg-primary/10 hover:bg-primary/20 rounded-xl cursor-pointer transition-colors font-medium"
            >
              <Save className="w-4 h-4" />
              保存当前配置
            </button>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <h3 className="text-base font-semibold text-primary mb-4">评估说明</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>选择您需要评估的维度</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>展开维度可进行详细配置</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>点击"开始评估"生成报告</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {readOnly && (
        <div className="w-72 flex-shrink-0 flex flex-col gap-4 overflow-y-auto scrollbar-hide sticky top-0 self-start max-h-full">
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <h3 className="text-base font-semibold text-primary mb-4">历史记录详情</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm truncate">{fileName}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(fileSize)}</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <h3 className="text-base font-semibold text-primary mb-4">查看说明</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>这是历史评估的维度配置</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>点击步骤条可查看报告</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {toast && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 bg-primary text-primary-foreground rounded-full text-sm font-medium shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="p-1 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {showSaveDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card rounded-2xl shadow-xl p-6 w-96 animate-in fade-in zoom-in-95 duration-200 border border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">保存规则预设</h3>
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="p-1 text-muted-foreground hover:text-foreground rounded cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mb-4">
                <label className="block text-sm text-muted-foreground mb-2">预设名称</label>
                <input
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="输入预设名称..."
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleConfirmSavePreset()
                    }
                  }}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmSavePreset}
                  disabled={!presetName.trim()}
                  className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}

        <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.xml" onChange={handleFileChange} className="hidden" />

        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <h2 className="text-xl font-semibold text-foreground">{readOnly ? "历史维度配置" : "评估维度配置"}</h2>
          {!readOnly && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleGenerateReport}
                disabled={!hasAnyDimensionSelected || isLoading}
                className="flex items-center gap-2 px-5 py-2.5 text-sm text-primary-foreground bg-primary hover:bg-primary/90 rounded-full cursor-pointer font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-4 h-4" />
                {isLoading ? "评估中..." : "开始评估"}
              </button>
              <button
                onClick={handleResetRules}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                重置所有
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pb-2 scrollbar-hide">
          {DIMENSIONS.map((dimension, index) => (
            <DimensionCard
              key={dimension.id}
              dimension={dimension}
              isChecked={dimensionChecked[dimension.id]}
              selectedSubIndicators={selectedDimensions[dimension.id] || new Set()}
              onDimensionToggle={handleDimensionToggle}
              onSubIndicatorToggle={handleSubIndicatorToggle}
              rules={rules}
              onAddRule={handleAddRule}
              onRemoveRule={handleRemoveRule}
              defaultCollapsed={index !== 0}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
