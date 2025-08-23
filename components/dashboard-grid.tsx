"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { WidgetPreview } from "@/components/widget-preview"
import { Settings, Trash2, Move, Maximize2 } from "lucide-react"

interface Widget {
  id: string
  dashboard_id: string
  query_id: string | null
  widget_type: "table" | "chart" | "counter" | "pivot"
  title: string
  config: any
  position: any
}

interface DashboardGridProps {
  widgets: Widget[]
  onWidgetUpdate: (widgets: Widget[]) => void
  onWidgetDelete: (widgetId: string) => void
}

export function DashboardGrid({ widgets, onWidgetUpdate, onWidgetDelete }: DashboardGridProps) {
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null)

  const handleDragStart = (widgetId: string) => {
    setDraggedWidget(widgetId)
  }

  const handleDragEnd = () => {
    setDraggedWidget(null)
  }

  const getGridColumns = () => {
    return Math.max(12, Math.max(...widgets.map((w) => (w.position?.x || 0) + (w.position?.w || 6))))
  }

  if (widgets.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-6 opacity-50">
              <div className="h-24 bg-muted rounded-lg"></div>
              <div className="h-24 bg-muted rounded-lg"></div>
              <div className="h-16 bg-muted rounded-lg"></div>
              <div className="h-16 bg-muted rounded-lg"></div>
            </div>
            <h3 className="text-lg font-medium mb-2">Empty Dashboard</h3>
            <p className="text-muted-foreground">Add widgets to start building your dashboard</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {widgets.map((widget) => (
          <Card
            key={widget.id}
            className={`transition-all duration-200 ${
              draggedWidget === widget.id ? "opacity-50 scale-95" : "hover:shadow-md"
            }`}
            draggable
            onDragStart={() => handleDragStart(widget.id)}
            onDragEnd={handleDragEnd}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">{widget.title}</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {widget.widget_type}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Move className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Settings className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Maximize2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    onClick={() => onWidgetDelete(widget.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <WidgetPreview widget={widget} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
