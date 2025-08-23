"use client"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { TrendingUp } from "lucide-react"

interface Widget {
  id: string
  widget_type: "table" | "chart" | "counter" | "pivot"
  title: string
  config: any
  query_id: string | null
}

interface WidgetPreviewProps {
  widget: Widget
}

// Mock data for preview
const mockTableData = [
  { block: "12345", txs: "150", time: "10:30:00" },
  { block: "12346", txs: "203", time: "10:31:00" },
  { block: "12347", txs: "178", time: "10:32:00" },
]

const mockChartData = [
  { name: "Jan", value: 400 },
  { name: "Feb", value: 300 },
  { name: "Mar", value: 600 },
  { name: "Apr", value: 800 },
  { name: "May", value: 500 },
]

const mockPieData = [
  { name: "Transfers", value: 45, color: "#059669" },
  { name: "Swaps", value: 30, color: "#10b981" },
  { name: "Stakes", value: 25, color: "#34d399" },
]

export function WidgetPreview({ widget }: WidgetPreviewProps) {
  const renderWidget = () => {
    switch (widget.widget_type) {
      case "table":
        return (
          <div className="space-y-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Block</TableHead>
                  <TableHead className="text-xs">TXs</TableHead>
                  <TableHead className="text-xs">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockTableData.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs font-mono">{row.block}</TableCell>
                    <TableCell className="text-xs">{row.txs}</TableCell>
                    <TableCell className="text-xs">{row.time}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )

      case "chart":
        return (
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip />
                <Bar dataKey="value" fill="#059669" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )

      case "counter":
        return (
          <div className="flex items-center justify-between p-4">
            <div>
              <p className="text-2xl font-bold">1,234</p>
              <p className="text-xs text-muted-foreground">Total Transactions</p>
            </div>
            <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
          </div>
        )

      case "pivot":
        return (
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mockPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={20}
                  outerRadius={50}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {mockPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )

      default:
        return <div className="text-center text-muted-foreground py-4">Widget preview not available</div>
    }
  }

  return (
    <div className="space-y-2">
      {renderWidget()}
      {!widget.query_id && (
        <Badge variant="outline" className="text-xs">
          No data source
        </Badge>
      )}
    </div>
  )
}
