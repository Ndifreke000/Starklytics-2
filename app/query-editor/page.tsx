"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Play, Save, Share, Database, Clock, Download, Settings } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { QueryResults } from "@/components/query-results"
import { SchemaExplorer } from "@/components/schema-explorer"

interface SavedQuery {
  id: string
  title: string
  description: string
  sql_query: string
  created_at: string
  is_public: boolean
}

export default function QueryEditorPage() {
  const [query, setQuery] = useState("")
  const [queryTitle, setQueryTitle] = useState("")
  const [queryDescription, setQueryDescription] = useState("")
  const [isExecuting, setIsExecuting] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([])
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        loadSavedQueries()
      }
    }
    getUser()
  }, [])

  const loadSavedQueries = async () => {
    const { data, error } = await supabase.from("queries").select("*").order("created_at", { ascending: false })

    if (data && !error) {
      setSavedQueries(data)
    }
  }

  const executeQuery = async () => {
    if (!query.trim()) return

    setIsExecuting(true)
    setError(null)

    try {
      // Mock execution - in real app, this would call the RPC endpoint
      const response = await fetch("https://36c4832f2e9b.ngrok-free.app/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({ query }),
      })

      if (!response.ok) {
        throw new Error("Query execution failed")
      }

      const data = await response.json()
      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      // Mock results for demo
      setResults({
        columns: ["block_number", "transaction_count", "timestamp"],
        rows: [
          [12345, 150, "2024-01-15T10:30:00Z"],
          [12346, 203, "2024-01-15T10:31:00Z"],
          [12347, 178, "2024-01-15T10:32:00Z"],
        ],
        execution_time: "0.45s",
      })
    } finally {
      setIsExecuting(false)
    }
  }

  const saveQuery = async () => {
    if (!user || !query.trim() || !queryTitle.trim()) return

    const { error } = await supabase.from("queries").insert({
      user_id: user.id,
      title: queryTitle,
      description: queryDescription,
      sql_query: query,
    })

    if (!error) {
      loadSavedQueries()
      setQueryTitle("")
      setQueryDescription("")
    }
  }

  const loadQuery = (savedQuery: SavedQuery) => {
    setQuery(savedQuery.sql_query)
    setQueryTitle(savedQuery.title)
    setQueryDescription(savedQuery.description)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Query Editor</h1>
              <p className="text-muted-foreground">Write and execute SQL queries on Starknet data</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Database className="h-3 w-3" />
                Starknet Mainnet
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Schema Explorer Sidebar */}
          <div className="lg:col-span-1">
            <SchemaExplorer />
          </div>

          {/* Main Query Editor */}
          <div className="lg:col-span-3 space-y-6">
            {/* Query Input Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Query Details
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={saveQuery}
                      disabled={!user || !query.trim() || !queryTitle.trim()}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share className="h-4 w-4 mr-1" />
                      Share
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="query-title">Query Title</Label>
                    <Input
                      id="query-title"
                      placeholder="Enter query title..."
                      value={queryTitle}
                      onChange={(e) => setQueryTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="query-description">Description</Label>
                    <Input
                      id="query-description"
                      placeholder="Brief description..."
                      value={queryDescription}
                      onChange={(e) => setQueryDescription(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="sql-query">SQL Query</Label>
                  <Textarea
                    id="sql-query"
                    placeholder="SELECT * FROM blocks WHERE block_number > 100000 LIMIT 10;"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="min-h-[200px] font-mono text-sm"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button onClick={executeQuery} disabled={isExecuting || !query.trim()}>
                      <Play className="h-4 w-4 mr-1" />
                      {isExecuting ? "Executing..." : "Execute Query"}
                    </Button>
                    {results && (
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Export
                      </Button>
                    )}
                  </div>
                  {results && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {results.execution_time}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Results Section */}
            <Tabs defaultValue="results" className="w-full">
              <TabsList>
                <TabsTrigger value="results">Results</TabsTrigger>
                <TabsTrigger value="saved">Saved Queries</TabsTrigger>
              </TabsList>

              <TabsContent value="results" className="mt-4">
                <QueryResults results={results} error={error} />
              </TabsContent>

              <TabsContent value="saved" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Saved Queries</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3">
                        {savedQueries.map((savedQuery) => (
                          <div
                            key={savedQuery.id}
                            className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => loadQuery(savedQuery)}
                          >
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{savedQuery.title}</h4>
                              <Badge variant={savedQuery.is_public ? "default" : "secondary"}>
                                {savedQuery.is_public ? "Public" : "Private"}
                              </Badge>
                            </div>
                            {savedQuery.description && (
                              <p className="text-sm text-muted-foreground mt-1">{savedQuery.description}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              Created {new Date(savedQuery.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                        {savedQueries.length === 0 && (
                          <p className="text-center text-muted-foreground py-8">
                            No saved queries yet. Create and save your first query!
                          </p>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
