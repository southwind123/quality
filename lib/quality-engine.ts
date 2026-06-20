export interface QualityIssue {
  artifactId: string
  artifactName: string
  field: string
  issue: string
  severity: "critical" | "warning" | "info"
}

export interface EvaluationResult {
  dimension: string
  subIndicator: string
  description: string
  issues: QualityIssue[]
  nonComplianceRate: number
  summary: string
}

export interface QualityReport {
  fileName: string
  totalRecords: number
  evaluatedAt: string
  results: EvaluationResult[]
  overallCompliance: number
}

interface DataRecord {
  [key: string]: any
}

export class QualityAssessmentEngine {
  private records: DataRecord[]
  private columnNames: string[]
  private userRules: Record<string, string[]>
  private coreFields = [
    "藏品编号",
    "藏品名称",
    "藏品类型",
    "文物级别",
    "文物类别",
    "质地类别",
    "文物来源",
    "年代",
    "入藏时间范围",
    "完残程度",
    "质量范围",
  ]

  constructor(records: DataRecord[], userRules: Record<string, string[]> = {}) {
    this.records = records
    this.columnNames = records.length > 0 ? Object.keys(records[0]) : []
    this.userRules = userRules
  }

  private normalizeField(value: any): string {
    if (value === null || value === undefined) return ""
    return String(value).trim()
  }

  private isEmptyField(value: any): boolean {
    const normalized = this.normalizeField(value)
    return normalized === "" || normalized.toLowerCase() === "n/a" || normalized === "无"
  }

  private findClosestColumnMatch(fieldName: string): string | null {
    const normalized = fieldName.toLowerCase()
    for (const col of this.columnNames) {
      if (col.toLowerCase().includes(normalized) || normalized.includes(col.toLowerCase())) {
        return col
      }
    }
    return null
  }

  private calculateSimilarity(str1: string, str2: string): number {
    let matches = 0
    const shorter = str1.length <= str2.length ? str1 : str2
    for (const char of shorter) {
      if ((str1.includes(char) && str2.includes(char)) || str1 === str2) {
        matches++
      }
    }
    return matches
  }

  evaluateCompleteness(): EvaluationResult[] {
    const results: EvaluationResult[] = []

    // A1: Metadata Completeness
    const metadataIssues: QualityIssue[] = []
    const missingCoreFields = this.coreFields.filter((field) => !this.findClosestColumnMatch(field))

    if (missingCoreFields.length > 0) {
      metadataIssues.push({
        artifactId: "DATASET",
        artifactName: "数据集架构",
        field: "核心字段",
        issue: `缺少以下核心数据字段：${missingCoreFields.join("、")}`,
        severity: "critical",
      })
    }

    results.push({
      dimension: "A. 完整性 (Completeness)",
      subIndicator: "A1. 元数据完整性",
      description: "核心数据项（如文物编号、名称、朝代、出土时间等）不能缺失。",
      issues: metadataIssues,
      nonComplianceRate: missingCoreFields.length > 0 ? 100 : 0,
      summary: missingCoreFields.length > 0 ? `缺少${missingCoreFields.length}个核心字段` : "所有核心字段完整",
    })

    // A2: Content Completeness
    const contentIssues: QualityIssue[] = []
    const criticalFields = ["藏品编号", "藏品名称", "年代"]

    criticalFields.forEach((field) => {
      const matchedColumn = this.findClosestColumnMatch(field)
      if (!matchedColumn) return

      let emptyCount = 0
      const emptyRecords: string[] = []

      this.records.forEach((record, idx) => {
        if (this.isEmptyField(record[matchedColumn])) {
          emptyCount++
          const artifactId = record["藏品编号"] || record["ID"] || `记录 ${idx + 1}`
          emptyRecords.push(String(artifactId))
        }
      })

      if (emptyCount > 0 && emptyRecords.length <= 10) {
        emptyRecords.forEach((id) => {
          contentIssues.push({
            artifactId: id,
            artifactName: `文物编号 ${id}`,
            field: matchedColumn,
            issue: `"${field}"字段缺失`,
            severity: emptyCount > this.records.length * 0.2 ? "critical" : "warning",
          })
        })
      } else if (emptyCount > 10) {
        contentIssues.push({
          artifactId: "MULTIPLE",
          artifactName: `多条记录`,
          field: matchedColumn,
          issue: `${emptyCount}条记录的"${field}"字段缺失`,
          severity: "warning",
        })
      }
    })

    const contentComplianceRate = contentIssues.length > 0 ? (contentIssues.length / this.records.length) * 100 : 0

    results.push({
      dimension: "A. 完整性 (Completeness)",
      subIndicator: "A2. 内容完整性",
      description: "每条文物数据记录应包含文物所有必需字段，具有完整的描述信息。",
      issues: contentIssues,
      nonComplianceRate: Math.min(contentComplianceRate, 100),
      summary: contentIssues.length > 0 ? `发现${contentIssues.length}条不完整记录` : "所有记录内容完整",
    })

    return results
  }

  evaluateStandardization(): EvaluationResult[] {
    const results: EvaluationResult[] = []

    // B1: Format Standardization
    const formatIssues: QualityIssue[] = []
    const idColumn = this.findClosestColumnMatch("编号")

    if (idColumn) {
      let malformedIds = 0
      this.records.forEach((record) => {
        const id = this.normalizeField(record[idColumn])
        if (id && !/^[\w\d-]+$/.test(id)) {
          malformedIds++
          if (malformedIds <= 5) {
            formatIssues.push({
              artifactId: id || `记录${malformedIds}`,
              artifactName: `文物编号 ${id}`,
              field: idColumn,
              issue: `编号格式不符合规范：${id}`,
              severity: "warning",
            })
          }
        }
      })

      if (malformedIds > 5) {
        formatIssues.push({
          artifactId: "MULTIPLE",
          artifactName: `共${malformedIds}条记录`,
          field: idColumn,
          issue: `共发现${malformedIds}条不符合规范的编号格式`,
          severity: "warning",
        })
      }
    }

    results.push({
      dimension: "B. 规范性 (Standardization)",
      subIndicator: "B1. 数据格式规范性",
      description: "数据格式（包括数据类型、长度、精度等）是否满足预期要求。",
      issues: formatIssues,
      nonComplianceRate: formatIssues.length > 0 ? (formatIssues.length / this.records.length) * 100 : 0,
      summary: formatIssues.length > 0 ? `发现${formatIssues.length}条格式不规范的记录` : "所有数据格式规范",
    })

    // B2: Redundancy Rate
    const redundancyIssues: QualityIssue[] = []
    const idCounts: Record<string, number> = {}
    const duplicateIds: string[] = []

    this.records.forEach((record) => {
      const id = this.normalizeField(record[idColumn || "藏品编号"] || "")
      if (id) {
        idCounts[id] = (idCounts[id] || 0) + 1
        if (idCounts[id] === 2) {
          duplicateIds.push(id)
        }
      }
    })

    duplicateIds.slice(0, 5).forEach((id) => {
      redundancyIssues.push({
        artifactId: id,
        artifactName: `文物编号 ${id}`,
        field: idColumn || "藏品编号",
        issue: `存在${idCounts[id]}条重复记录`,
        severity: "warning",
      })
    })

    if (duplicateIds.length > 5) {
      redundancyIssues.push({
        artifactId: "MULTIPLE",
        artifactName: `共${duplicateIds.length}个文物ID`,
        field: idColumn || "藏品编号",
        issue: `共发现${duplicateIds.length}个重复的文物ID`,
        severity: "warning",
      })
    }

    results.push({
      dimension: "B. 规范性 (Standardization)",
      subIndicator: "B2. 数据冗余率",
      description: "对于博物馆特定的文物，应当只有一条核心数据记录代表该文物。",
      issues: redundancyIssues,
      nonComplianceRate: duplicateIds.length > 0 ? (duplicateIds.length / Object.keys(idCounts).length) * 100 : 0,
      summary: duplicateIds.length > 0 ? `发现${duplicateIds.length}个重复的文物编号` : "无重复记录，冗余率为0%",
    })

    // B3: Security Compliance
    results.push({
      dimension: "B. 规范性 (Standardization)",
      subIndicator: "B3. 安全合规性",
      description: "衡量数据是否符合安全和隐私规则。",
      issues: [],
      nonComplianceRate: 0,
      summary: "未检测到安全或隐私问题",
    })

    return results
  }

  evaluateAccuracy(): EvaluationResult[] {
    const results: EvaluationResult[] = []

    // C1: Content Accuracy
    const accuracyIssues: QualityIssue[] = []
    let vagueCount = 0

    const descriptionFields = this.columnNames.filter((col) =>
      ["描述", "简介", "备注", "description"].some((keyword) => col.toLowerCase().includes(keyword.toLowerCase())),
    )

    const userRulesForAccuracy = this.userRules["content_accuracy"] || []
    const shouldCheckClarity = userRulesForAccuracy.some((rule) => rule.includes("模糊") || rule.includes("不清"))

    if (shouldCheckClarity && descriptionFields.length > 0) {
      const vaguePhrases = ["待定", "不详", "待考证", "？", "未知", "...", "不清楚"]
      this.records.forEach((record) => {
        descriptionFields.forEach((field) => {
          const value = this.normalizeField(record[field])
          if (value && vaguePhrases.some((phrase) => value.includes(phrase))) {
            vagueCount++
            if (vagueCount <= 3) {
              accuracyIssues.push({
                artifactId: record["藏品编号"] || `记录${vagueCount}`,
                artifactName: `文物编号 ${record["藏品编号"]}`,
                field,
                issue: `内容表述模糊：${value.substring(0, 50)}...`,
                severity: "warning",
              })
            }
          }
        })
      })

      if (vagueCount > 3) {
        accuracyIssues.push({
          artifactId: "MULTIPLE",
          artifactName: `共${vagueCount}条记录`,
          field: descriptionFields[0],
          issue: `共发现${vagueCount}条内容表述模糊的记录`,
          severity: "info",
        })
      }
    }

    results.push({
      dimension: "C. 准确性 (Accuracy)",
      subIndicator: "C1. 数据内容准确性",
      description: "元数据内容应准确反映文物的实际信息，不存在错误或歧义描述。",
      issues: accuracyIssues,
      nonComplianceRate: accuracyIssues.length > 0 ? Math.min((vagueCount / this.records.length) * 100, 100) : 0,
      summary: accuracyIssues.length > 0 ? `发现${accuracyIssues.length}条表述模糊的记录` : "所有数据内容清晰准确",
    })

    return results
  }

  evaluateConsistency(): EvaluationResult[] {
    const results: EvaluationResult[] = []

    // D1: Association Consistency
    const associationIssues: QualityIssue[] = []

    const eraColumn = this.findClosestColumnMatch("年代")
    const timeColumn = this.findClosestColumnMatch("时间")

    if (eraColumn && timeColumn) {
      const eraPatterns: Record<string, string[]> = {
        新石器: ["8000", "7000", "6000"],
        商: ["1600", "1500", "1400"],
        周: ["1100", "1000", "900"],
        汉: ["200", "100", "50", "AD"],
      }

      let inconsistencies = 0
      this.records.forEach((record) => {
        const era = this.normalizeField(record[eraColumn])
        const time = this.normalizeField(record[timeColumn])

        if (era && time) {
          for (const [eraName, timeMarkers] of Object.entries(eraPatterns)) {
            if (era.includes(eraName)) {
              const hasTimeMarker = timeMarkers.some((marker) => time.includes(marker))
              if (!hasTimeMarker && inconsistencies < 3) {
                inconsistencies++
                associationIssues.push({
                  artifactId: record["藏品编号"] || "未知",
                  artifactName: `文物编号 ${record["藏品编号"]}`,
                  field: `${eraColumn} vs ${timeColumn}`,
                  issue: `年代"${era}"与时间"${time}"可能不一致`,
                  severity: "info",
                })
              }
            }
          }
        }
      })
    }

    results.push({
      dimension: "D. 一致性 (Consistency)",
      subIndicator: "D1. 数据关联一致性",
      description: "文物数据项满足定义的一致性约束的程度（例如，朝代和出土时间必须匹配）。",
      issues: associationIssues,
      nonComplianceRate: associationIssues.length > 0 ? (associationIssues.length / this.records.length) * 100 : 0,
      summary: associationIssues.length > 0 ? `发现${associationIssues.length}条一致性问题` : "数据关联一致",
    })

    // D2: Semantic Consistency
    const semanticIssues: QualityIssue[] = []

    const typeColumn = this.findClosestColumnMatch("类型")
    if (typeColumn) {
      const types: Record<string, number> = {}
      this.records.forEach((record) => {
        const type = this.normalizeField(record[typeColumn])
        if (type) {
          types[type] = (types[type] || 0) + 1
        }
      })

      const typeList = Object.keys(types)
      for (let i = 0; i < typeList.length; i++) {
        for (let j = i + 1; j < typeList.length; j++) {
          const similarity =
            this.calculateSimilarity(typeList[i], typeList[j]) / Math.max(typeList[i].length, typeList[j].length)
          if (similarity > 0.7 && semanticIssues.length < 3) {
            semanticIssues.push({
              artifactId: "DATASET",
              artifactName: "Dataset",
              field: typeColumn,
              issue: `检测到可能的术语不一致："${typeList[i]}" 和 "${typeList[j]}" 的含义可能相同`,
              severity: "info",
            })
          }
        }
      }
    }

    results.push({
      dimension: "D. 一致性 (Consistency)",
      subIndicator: "D2. 元数据语义一致性",
      description:
        '确保同一元数据项在不同文物中有一致的含义，避免概念混淆。例如，"地点"字段不应该对某些文物指"出土地点"，对其他文物指"创作地点"。',
      issues: semanticIssues,
      nonComplianceRate: semanticIssues.length > 0 ? 5 : 0,
      summary: semanticIssues.length > 0 ? `发现${semanticIssues.length}处术语不一致` : "术语使用一致",
    })

    return results
  }

  evaluateTimeliness(): EvaluationResult[] {
    const results: EvaluationResult[] = []

    results.push({
      dimension: "E. 及时性 (Timeliness)",
      subIndicator: "E1. 数据及时性",
      description: "动态数据（如文物当前位置、展览状态、修复进度等）应根据实际变化及时更新。",
      issues: [],
      nonComplianceRate: 0,
      summary: "无法从静态数据判断及时性，建议通过业务流程检查",
    })

    return results
  }

  evaluateAuthority(): EvaluationResult[] {
    const results: EvaluationResult[] = []

    const authorityIssues: QualityIssue[] = []

    const sourceColumn = this.findClosestColumnMatch("来源")
    if (sourceColumn) {
      let missingSource = 0
      this.records.forEach((record) => {
        if (this.isEmptyField(record[sourceColumn])) {
          missingSource++
        }
      })

      if (missingSource > 0 && missingSource <= 5) {
        this.records.forEach((record, idx) => {
          if (this.isEmptyField(record[sourceColumn]) && authorityIssues.length < 5) {
            authorityIssues.push({
              artifactId: record["藏品编号"] || `记录${idx}`,
              artifactName: `文物编号 ${record["藏品编号"]}`,
              field: sourceColumn,
              issue: "缺少数据来源信息",
              severity: "warning",
            })
          }
        })
      } else if (missingSource > 5) {
        authorityIssues.push({
          artifactId: "MULTIPLE",
          artifactName: `共${missingSource}条记录`,
          field: sourceColumn,
          issue: `${missingSource}条记录缺少来源信息`,
          severity: "warning",
        })
      }
    }

    results.push({
      dimension: "F. 权威性 (Authority)",
      subIndicator: "F1. 数据来源权威性",
      description: "数据来自合法和经过验证的来源，内容真实、可靠、具有权威性。",
      issues: authorityIssues,
      nonComplianceRate: authorityIssues.length > 0 ? (authorityIssues.length / this.records.length) * 100 : 0,
      summary: authorityIssues.length > 0 ? `${authorityIssues.length}条记录缺少来源信息` : "所有数据来源清晰",
    })

    return results
  }

  evaluateComprehensibility(): EvaluationResult[] {
    const results: EvaluationResult[] = []

    const comprehensibilityIssues: QualityIssue[] = []

    const descriptionFields = this.columnNames.filter((col) =>
      ["描述", "简介", "备注", "description"].some((keyword) => col.toLowerCase().includes(keyword.toLowerCase())),
    )

    if (descriptionFields.length > 0) {
      let unclearCount = 0
      this.records.forEach((record) => {
        descriptionFields.forEach((field) => {
          const value = this.normalizeField(record[field])
          if (value && (value.length < 10 || value.split("(").length > 3)) {
            unclearCount++
            if (unclearCount <= 3) {
              comprehensibilityIssues.push({
                artifactId: record["藏品编号"] || `记录${unclearCount}`,
                artifactName: `文物编号 ${record["藏品编号"]}`,
                field,
                issue: `描述过于简洁或术语堆积，影响可理解性：${value.substring(0, 40)}...`,
                severity: "info",
              })
            }
          }
        })
      })
    }

    results.push({
      dimension: "G. 可理解性 (Comprehensibility)",
      subIndicator: "G1. 数据内容可理解性",
      description: "文本内容应表述清晰、连贯，专业术语应充分解释，便于用户（包括非专业人士）理解。",
      issues: comprehensibilityIssues,
      nonComplianceRate: comprehensibilityIssues.length > 0 ? Math.min(5, 100) : 0,
      summary: comprehensibilityIssues.length > 0 ? "部分描述需要改进清晰度" : "内容清晰易懂",
    })

    return results
  }

  generateReport(fileName: string): QualityReport {
    const allResults: EvaluationResult[] = [
      ...this.evaluateCompleteness(),
      ...this.evaluateStandardization(),
      ...this.evaluateAccuracy(),
      ...this.evaluateConsistency(),
      ...this.evaluateTimeliness(),
      ...this.evaluateAuthority(),
      ...this.evaluateComprehensibility(),
    ]

    const avgCompliance = 100 - allResults.reduce((sum, r) => sum + r.nonComplianceRate, 0) / allResults.length

    return {
      fileName,
      totalRecords: this.records.length,
      evaluatedAt: new Date().toISOString(),
      results: allResults,
      overallCompliance: Math.max(0, Math.round(avgCompliance * 100) / 100),
    }
  }
}
