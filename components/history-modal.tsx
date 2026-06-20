"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FileText, Trash2, Calendar, Clock } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

export interface HistoryRecord {
  id: string
  fileName: string
  fileSize: number
  report: string
  createdAt: string
  selectedIndicators: Record<
    string,
    {
      name: string
      subIndicators: Array<{ id: string; name: string }>
    }
  >
}

interface HistoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  records: HistoryRecord[]
  onSelectRecord: (record: HistoryRecord) => void
  onDeleteRecord: (id: string) => void
}

export default function HistoryModal({
  open,
  onOpenChange,
  records,
  onSelectRecord,
  onDeleteRecord,
}: HistoryModalProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB"
    return (bytes / (1024 * 1024)).toFixed(2) + " MB"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white border-[#d4a45c]/30">
        <DialogHeader>
          <DialogTitle className="text-[#78350f] text-xl">历史记录</DialogTitle>
        </DialogHeader>

        {records.length === 0 ? (
          <div className="py-12 text-center text-[#78350f]/50">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>暂无历史记录</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px] pr-4">
            <div className="space-y-3">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="p-4 rounded-lg border border-[#d4a45c]/30 bg-[#fffcf7] hover:border-[#d4a45c] transition-all cursor-pointer group"
                  onClick={() => {
                    onSelectRecord(record)
                    onOpenChange(false)
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-[#7b3306]/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-[#7b3306]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[#78350f] font-medium truncate">{record.fileName}</h4>
                        <p className="text-sm text-[#78350f]/50">{formatFileSize(record.fileSize)}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-[#78350f]/50">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(record.createdAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(record.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-[#78350f]/50 hover:text-red-500 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteRecord(record.id)
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  )
}
