"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { DollarSign, Send } from "lucide-react"

interface Bounty {
  id: string
  title: string
  description: string
  requirements: string
  reward_amount: number
  reward_token: string
}

interface SubmissionDialogProps {
  bounty: Bounty
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function SubmissionDialog({ bounty, isOpen, onClose, onSuccess }: SubmissionDialogProps) {
  const [submissionText, setSubmissionText] = useState("")
  const [selectedQueryId, setSelectedQueryId] = useState("")
  const [selectedDashboardId, setSelectedDashboardId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [savedQueries, setSavedQueries] = useState<any[]>([])
  const [savedDashboards, setSavedDashboards] = useState<any[]>([])

  const supabase = createClient()

  const loadUserAssets = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      // Load user's queries
      const { data: queries } = await supabase
        .from("queries")
        .select("id, title")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (queries) setSavedQueries(queries)

      // Load user's dashboards
      const { data: dashboards } = await supabase
        .from("dashboards")
        .select("id, title")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (dashboards) setSavedDashboards(dashboards)
    }
  }

  const handleSubmit = async () => {
    if (!submissionText.trim()) return

    setIsSubmitting(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("User not authenticated")

      const { error } = await supabase.from("submissions").insert({
        bounty_id: bounty.id,
        analyst_id: user.id,
        query_id: selectedQueryId || null,
        dashboard_id: selectedDashboardId || null,
        submission_text: submissionText,
      })

      if (error) throw error

      onSuccess()
      setSubmissionText("")
      setSelectedQueryId("")
      setSelectedDashboardId("")
    } catch (error) {
      console.error("Submission failed:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Load user assets when dialog opens
  if (isOpen && savedQueries.length === 0 && savedDashboards.length === 0) {
    loadUserAssets()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Submit Solution
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Bounty Summary */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{bounty.title}</h3>
              <Badge variant="secondary" className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {bounty.reward_amount} {bounty.reward_token}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{bounty.description}</p>
            <div>
              <h4 className="font-medium text-sm mb-1">Requirements:</h4>
              <p className="text-xs text-muted-foreground">{bounty.requirements}</p>
            </div>
          </div>

          {/* Submission Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="submission-text">Your Solution</Label>
              <Textarea
                id="submission-text"
                placeholder="Describe your analysis, findings, and methodology..."
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                className="min-h-[150px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="query-select">Related Query (Optional)</Label>
                <Select value={selectedQueryId} onValueChange={setSelectedQueryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a query..." />
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

              <div>
                <Label htmlFor="dashboard-select">Related Dashboard (Optional)</Label>
                <Select value={selectedDashboardId} onValueChange={setSelectedDashboardId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a dashboard..." />
                  </SelectTrigger>
                  <SelectContent>
                    {savedDashboards.map((dashboard) => (
                      <SelectItem key={dashboard.id} value={dashboard.id}>
                        {dashboard.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || !submissionText.trim()}>
              {isSubmitting ? "Submitting..." : "Submit Solution"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
