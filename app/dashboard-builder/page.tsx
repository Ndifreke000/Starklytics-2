"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Save, Eye, BarChart3, Table, Hash, PieChart, Edit } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { DashboardGrid } from "@/components/dashboard-grid"

interface Dashboard {
  id: string
  title: string
  description: string
  layout: any[]
  is_public: boolean
  created_at: string
}

interface Widget {
  id: string
  dashboard_id: string
  query_id: string | null
  widget_type: "table" | "chart" | "counter" | "pivot"
  title: string
  config: any
  position: any
}

interface SavedQuery {
  id: string
  title: string
  sql_query: string
}

export default function DashboardBuilderPage() {
  const [dashboards, setDashboards] = useState<Dashboard[]>([])
  const [currentDashboard, setCurrentDashboard] = useState<Dashboard | null>(null)
  const [widgets, setWidgets] = useState<Widget[]>([])
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([])
  const [user, setUser] = useState<any>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isWidgetDialogOpen, setIsWidgetDialogOpen] = useState(false)
  const [newDashboard, setNewDashboard] = useState({ title: "", description: "" })
  const [newWidget, setNewWidget] = useState({
    title: "",
    widget_type: "table" as const,
    query_id: "",
    config: {},
  })

  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        loadDashboards()
        loadSavedQueries()
      }
    }
    getUser()
  }, [])

  const loadDashboards = async () => {
    const { data, error } = await supabase.from("dashboards").select("*").order("created_at", { ascending: false })

    if (data && !error) {
      setDashboards(data)
    }
  }

  const loadSavedQueries = async () => {
    const { data, error } = await supabase
      .from("queries")
      .select("id, title, sql_query")
      .order("created_at", { ascending: false })

    if (data && !error) {
      setSavedQueries(data)
    }
  }

  const loadDashboardWidgets = async (dashboardId: string) => {
    const { data, error } = await supabase.from("dashboard_widgets").select("*").eq("dashboard_id", dashboardId)

    if (data && !error) {
      setWidgets(data)
    }
  }

  const createDashboard = async () => {
    if (!user || !newDashboard.title.trim()) return

    const { data, error } = await supabase
      .from("dashboards")
      .insert({
        user_id: user.id,
        title: newDashboard.title,
        description: newDashboard.description,
        layout: [],
      })
      .select()
      .single()

    if (data && !error) {
      setCurrentDashboard(data)
      loadDashboards()
      setIsCreateDialogOpen(false)
      setNewDashboard({ title: "", description: "" })
    }
  }

  const addWidget = async () => {
    if (!currentDashboard || !newWidget.title.trim()) return

    const { data, error } = await supabase
      .from("dashboard_widgets")
      .insert({
        dashboard_id: currentDashboard.id,
        query_id: newWidget.query_id || null,
        widget_type: newWidget.widget_type,
        title: newWidget.title,
        config: newWidget.config,
        position: { x: 0, y: 0, w: 6, h: 4 },
      })
      .select()
      .single()

    if (data && !error) {
      setWidgets([...widgets, data])
      setIsWidgetDialogOpen(false)
      setNewWidget({ title: "", widget_type: "table", query_id: "", config: {} })
    }
  }

  const deleteWidget = async (widgetId: string) => {
    const { error } = await supabase.from("dashboard_widgets").delete().eq("id", widgetId)

    if (!error) {
      setWidgets(widgets.filter((w) => w.id !== widgetId))
    }
  }

  const saveDashboard = async () => {
    if (!currentDashboard) return

    const { error } = await supabase
      .from("dashboards")
      .update({
        layout: widgets.map((w) => ({ id: w.id, ...w.position })),
      })
      .eq("id", currentDashboard.id)

    if (!error) {
      // Show success message
    }
  }

  const widgetTypeIcons = {
    table: Table,
    chart: BarChart3,
    counter: Hash,
    pivot: PieChart,
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Dashboard Builder</h1>
              <p className="text-muted-foreground">Create and customize interactive dashboards</p>
            </div>
            <div className="flex items-center gap-2">
              {currentDashboard && (
                <>
                  <Button variant="outline" onClick={saveDashboard}>
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button variant="outline">
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                </>
              )}
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-1" />
                    New Dashboard
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Dashboard</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="dashboard-title">Title</Label>
                      <Input
                        id="dashboard-title"
                        placeholder="Enter dashboard title..."
                        value={newDashboard.title}
                        onChange={(e) => setNewDashboard({ ...newDashboard, title: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="dashboard-description">Description</Label>
                      <Textarea
                        id="dashboard-description"
                        placeholder="Brief description..."
                        value={newDashboard.description}
                        onChange={(e) => setNewDashboard({ ...newDashboard, description: e.target.value })}
                      />
                    </div>
                    <Button onClick={createDashboard} className="w-full">
                      Create Dashboard
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="builder" className="w-full">
          <TabsList>
            <TabsTrigger value="builder">Builder</TabsTrigger>
            <TabsTrigger value="dashboards">My Dashboards</TabsTrigger>
          </TabsList>

          <TabsContent value="builder" className="mt-6">
            {currentDashboard ? (
              <div className="space-y-6">
                {/* Dashboard Header */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{currentDashboard.title}</CardTitle>
                        <p className="text-muted-foreground">{currentDashboard.description}</p>
                      </div>
                      <Dialog open={isWidgetDialogOpen} onOpenChange={setIsWidgetDialogOpen}>
                        <DialogTrigger asChild>
                          <Button>
                            <Plus className="h-4 w-4 mr-1" />
                            Add Widget
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add New Widget</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="widget-title">Widget Title</Label>
                              <Input
                                id="widget-title"
                                placeholder="Enter widget title..."
                                value={newWidget.title}
                                onChange={(e) => setNewWidget({ ...newWidget, title: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label htmlFor="widget-type">Widget Type</Label>
                              <Select
                                value={newWidget.widget_type}
                                onValueChange={(value: any) => setNewWidget({ ...newWidget, widget_type: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="table">Table</SelectItem>
                                  <SelectItem value="chart">Chart</SelectItem>
                                  <SelectItem value="counter">Counter</SelectItem>
                                  <SelectItem value="pivot">Pivot Table</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="widget-query">Data Source (Query)</Label>
                              <Select
                                value={newWidget.query_id}
                                onValueChange={(value) => setNewWidget({ ...newWidget, query_id: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a saved query..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {savedQueries.map((query) => (
                                    <SelectItem key={query.id} value={query.id}>
                                      {query.title}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <Button onClick={addWidget} className="w-full">
                              Add Widget
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                </Card>

                {/* Dashboard Grid */}
                <DashboardGrid widgets={widgets} onWidgetUpdate={setWidgets} onWidgetDelete={deleteWidget} />
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Dashboard Selected</h3>
                    <p className="text-muted-foreground mb-4">
                      Create a new dashboard or select an existing one to start building
                    </p>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Create Dashboard
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="dashboards" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboards.map((dashboard) => (
                <Card key={dashboard.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{dashboard.title}</CardTitle>
                      <Badge variant={dashboard.is_public ? "default" : "secondary"}>
                        {dashboard.is_public ? "Public" : "Private"}
                      </Badge>
                    </div>
                    {dashboard.description && <p className="text-muted-foreground text-sm">{dashboard.description}</p>}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        Created {new Date(dashboard.created_at).toLocaleDateString()}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCurrentDashboard(dashboard)
                            loadDashboardWidgets(dashboard.id)
                          }}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm">
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {dashboards.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Dashboards Yet</h3>
                  <p className="text-muted-foreground mb-4">Create your first dashboard to get started</p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Create Dashboard
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
