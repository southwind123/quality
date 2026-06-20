"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Save, Trash2, Upload, Download, ChevronDown } from "lucide-react"

interface RulePreset {
  id: string
  name: string
  description: string
  rules: Record<string, string[]>
  createdAt: number
  updatedAt: number
}

interface RulesManagerProps {
  currentRules: Record<string, string[]>
  onLoadRules: (rules: Record<string, string[]>) => void
}

const PRESETS_STORAGE_KEY = "rule-presets"

export default function RulesManager({ currentRules, onLoadRules }: RulesManagerProps) {
  const [presets, setPresets] = useState<RulePreset[]>([])
  const [selectedPreset, setSelectedPreset] = useState<RulePreset | null>(null)
  const [newPresetName, setNewPresetName] = useState("")
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Load presets from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(PRESETS_STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setPresets(parsed)
        if (parsed.length > 0) {
          setSelectedPreset(parsed[0])
        }
      } catch (error) {
        console.error("Failed to load presets:", error)
      }
    }
  }, [])

  // Save presets to localStorage
  const savePresetsToStorage = (newPresets: RulePreset[]) => {
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(newPresets))
    setPresets(newPresets)
  }

  const saveCurrentRules = () => {
    if (!newPresetName.trim()) {
      showToast("请输入预设名称", "error")
      return
    }

    const hasRules = Object.values(currentRules).some((rules) => rules.length > 0)

    if (!hasRules) {
      showToast("没有可保存的规则", "error")
      return
    }

    const timestamp = new Date().toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" }).replace("/", "")
    const presetName = newPresetName || `规则-${timestamp}`

    const newPreset: RulePreset = {
      id: Date.now().toString(),
      name: presetName,
      description: "",
      rules: currentRules,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    const updated = [newPreset, ...presets]
    savePresetsToStorage(updated)
    setSelectedPreset(newPreset)
    setNewPresetName("")
    setIsSaveDialogOpen(false)
    showToast(`已保存为 "${presetName}"`)
  }

  const loadPreset = (preset: RulePreset) => {
    setSelectedPreset(preset)
    onLoadRules(preset.rules)
    showToast(`已加载 "${preset.name}"`)
  }

  const deletePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updated = presets.filter((p) => p.id !== id)
    savePresetsToStorage(updated)
    if (selectedPreset?.id === id) {
      setSelectedPreset(updated[0] || null)
    }
    showToast("预设已删除")
  }

  const exportPresets = () => {
    const dataStr = JSON.stringify(presets, null, 2)
    const element = document.createElement("a")
    element.href = URL.createObjectURL(new Blob([dataStr], { type: "application/json" }))
    element.download = "rule-presets.json"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const importPresets = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string)
        if (Array.isArray(imported)) {
          const updated = [...imported, ...presets]
          savePresetsToStorage(updated)
          showToast(`已导入 ${imported.length} 个预设`)
        }
      } catch (error) {
        showToast("导入失败", "error")
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="flex items-center gap-2">
      {toast && (
        <div
          className={`fixed top-24 right-6 z-50 px-4 py-3 rounded-lg text-sm font-medium shadow-lg transition-all animate-in fade-in slide-in-from-top-2 duration-300 ${
            toast.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors min-w-[160px] justify-between">
            <span className="truncate">{selectedPreset?.name || "选择预设"}</span>
            <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {presets.length > 0 ? (
            <>
              {presets.map((preset) => (
                <DropdownMenuItem
                  key={preset.id}
                  onClick={() => loadPreset(preset)}
                  className="flex items-center justify-between group"
                >
                  <span className="truncate">{preset.name}</span>
                  <button
                    onClick={(e) => deletePreset(preset.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all"
                  >
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </button>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </>
          ) : (
            <DropdownMenuItem disabled className="text-slate-400 text-sm">
              暂无预设
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={exportPresets} disabled={presets.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            导出所有预设
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <label className="cursor-pointer flex items-center">
              <Upload className="w-4 h-4 mr-2" />
              导入预设
              <input type="file" accept=".json" onChange={importPresets} className="hidden" />
            </label>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogTrigger asChild>
          <button className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
            <Save className="w-5 h-5" />
          </button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>保存规则预设</DialogTitle>
            <DialogDescription>将当前配置的规则保存为预设，方便下次快速使用</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">预设名称</label>
              <Input
                placeholder="例如：文物数据验证规则"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                className="bg-white"
              />
            </div>
            <Button onClick={saveCurrentRules} className="w-full bg-blue-500 hover:bg-blue-600">
              保存预设
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
