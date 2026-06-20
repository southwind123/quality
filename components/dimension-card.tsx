"use client"

import type React from "react"

import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { ChevronUp, ChevronDown, Plus, Shield, Ruler, Target, GitBranch, Clock, Award, BookOpen, X } from "lucide-react"

interface SubIndicator {
  id: string
  name: string
  description: string
}

interface Dimension {
  id: string
  name: string
  description: string
  subIndicators: SubIndicator[]
}

interface DimensionCardProps {
  dimension: Dimension
  isChecked: boolean
  selectedSubIndicators: Set<string>
  onDimensionToggle: (dimensionId: string) => void
  onSubIndicatorToggle: (dimensionId: string, subIndicatorId: string) => void
  rules: Record<string, string[]>
  onAddRule: (subIndicatorId: string, rule: string) => void
  onRemoveRule: (subIndicatorId: string, rule: string) => void
  defaultCollapsed?: boolean
}

const dimensionIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  completeness: Shield,
  standardization: Ruler,
  accuracy: Target,
  consistency: GitBranch,
  timeliness: Clock,
  authority: Award,
  understandability: BookOpen,
}

export default function DimensionCard({
  dimension,
  isChecked,
  selectedSubIndicators,
  onDimensionToggle,
  onSubIndicatorToggle,
  rules,
  onAddRule,
  onRemoveRule,
  defaultCollapsed = false,
}: DimensionCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)
  const [ruleInputs, setRuleInputs] = useState<Record<string, string>>({})
  const [hoveredRule, setHoveredRule] = useState<string | null>(null)
  const [hoveredSubIndicator, setHoveredSubIndicator] = useState<string | null>(null)

  const handleAddRuleClick = (subIndicatorId: string) => {
    const ruleText = ruleInputs[subIndicatorId]?.trim()
    if (ruleText) {
      onAddRule(subIndicatorId, ruleText)
      setRuleInputs((prev) => ({ ...prev, [subIndicatorId]: "" }))
    }
  }

  const IconComponent = dimensionIcons[dimension.id] || Shield

  return (
    <div
      className={`bg-card rounded-xl border overflow-hidden transition-all duration-200 ${
        isChecked
          ? "border-border hover:border-primary/50 hover:shadow-md"
          : "border-border hover:border-border hover:shadow-sm"
      }`}
    >
      <div className={`p-4 flex items-center justify-between gap-4 ${!isCollapsed ? "border-b border-border" : ""}`}>
        <div className="flex items-center gap-3 flex-1">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              isChecked ? "bg-primary/10" : "bg-muted"
            }`}
          >
            <IconComponent className={`w-5 h-5 ${isChecked ? "text-primary" : "text-muted-foreground"}`} />
          </div>
          <div className="min-w-0">
            <h3 className={`text-base font-semibold ${isChecked ? "text-foreground" : "text-muted-foreground"}`}>
              {dimension.name}
            </h3>
            <p className="text-sm text-muted-foreground truncate">{dimension.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-md hover:bg-muted transition-colors cursor-pointer"
          >
            {isCollapsed ? (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
          <Switch
            checked={isChecked}
            onCheckedChange={() => onDimensionToggle(dimension.id)}
            className="data-[state=checked]:bg-primary cursor-pointer"
          />
        </div>
      </div>

      {!isCollapsed && (
        <div className={`p-4 space-y-1 ${!isChecked ? "opacity-50" : ""}`}>
          {dimension.subIndicators.map((subIndicator, index) => {
            const subRules = rules[subIndicator.id] || []
            const isHovered = hoveredSubIndicator === subIndicator.id

            return (
              <div
                key={subIndicator.id}
                className={`relative pl-4 py-3 border-l-2 transition-colors duration-200 ${
                  isHovered ? "border-primary" : "border-border"
                }`}
                onMouseEnter={() => setHoveredSubIndicator(subIndicator.id)}
                onMouseLeave={() => setHoveredSubIndicator(null)}
              >
                <div className="space-y-3">
                  <div className="mb-4">
                    <h4 className="font-bold text-foreground text-[15px]">{subIndicator.name}</h4>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{subIndicator.description}</p>
                  </div>

                  {subRules.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {subRules.map((rule, idx) => (
                        <div
                          key={idx}
                          className="group inline-flex items-center gap-1.5 px-3 py-1.5 bg-card border border-primary/30 rounded-full text-xs text-primary transition-colors hover:bg-primary/5"
                          onMouseEnter={() => setHoveredRule(`${subIndicator.id}-${idx}`)}
                          onMouseLeave={() => setHoveredRule(null)}
                        >
                          <span>{rule}</span>
                          {isChecked && (
                            <button
                              onClick={() => onRemoveRule(subIndicator.id, rule)}
                              className="p-0.5 rounded-full text-primary/60 hover:text-primary hover:bg-primary/10 cursor-pointer transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {isChecked && (
                    <div className="flex items-center border border-border rounded-lg pl-3 pr-1 py-1 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all bg-muted/30">
                      <Plus className="w-4 h-4 text-muted-foreground flex-shrink-0 mr-2" />
                      <input
                        type="text"
                        value={ruleInputs[subIndicator.id] || ""}
                        onChange={(e) => setRuleInputs((prev) => ({ ...prev, [subIndicator.id]: e.target.value }))}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            handleAddRuleClick(subIndicator.id)
                          }
                        }}
                        placeholder="在此输入新规则..."
                        className="flex-1 text-xs bg-transparent focus:outline-none placeholder-muted-foreground text-foreground"
                      />
                      <button
                        onClick={() => handleAddRuleClick(subIndicator.id)}
                        className="ml-2 px-4 py-1.5 text-xs bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 cursor-pointer flex-shrink-0 transition-colors shadow-sm"
                      >
                        添加
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
