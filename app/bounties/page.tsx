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
import { Plus, Trophy, Send, Eye } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { BountyCard } from "@/components/bounty-card"
import { SubmissionDialog } from "@/components/submission-dialog"

interface Bounty {
  id: string
  creator_id: string
  title: string
  description: string
  requirements: string
  reward_amount: number
  reward_token: string
  status: "open" | "in_progress" | "completed" | "cancelled"
  deadline: string | null
  created_at: string
  profiles?: {
    display_name: string
  }
}

interface Submission {
  id: string
  bounty_id: string
  analyst_id: string
  submission_text: string
  status: "pending" | "approved" | "rejected"
  created_at: string
  profiles?: {
    display_name: string
  }
}

export default function BountiesPage() {
  const [bounties, setBounties] = useState<Bounty[]>([])
  const [mySubmissions, setMySubmissions] = useState<Submission[]>([])
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedBounty, setSelectedBounty] = useState<Bounty | null>(null)
  const [isSubmissionDialogOpen, setIsSubmissionDialogOpen] = useState(false)
  const [newBounty, setNewBounty] = useState({
    title: "",
    description: "",
    requirements: "",
    reward_amount: "",
    reward_token: "STRK",
    deadline: "",
  })

  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        loadBounties()
        loadUserProfile(user.id)
        loadMySubmissions(user.id)
      }
    }
    getUser()
  }, [])

  const loadUserProfile = async (userId: string) => {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

    if (data && !error) {
      setUserProfile(data)
    }
  }

  const loadBounties = async () => {
    const { data, error } = await supabase
      .from("bounties")
      .select(
        `
        *,
        profiles:creator_id (display_name)
      `,
      )
      .order("created_at", { ascending: false })

    if (data && !error) {
      setBounties(data)
    }
  }

  const loadMySubmissions = async (userId: string) => {
    const { data, error } = await supabase
      .from("submissions")
      .select(
        `
        *,
        bounties (title),
        profiles:analyst_id (display_name)
      `,
      )
      .eq("analyst_id", userId)
      .order("created_at", { ascending: false })

    if (data && !error) {
      setMySubmissions(data)
    }
  }

  const createBounty = async () => {
    if (!user || !userProfile || userProfile.role !== "admin") return
    if (!newBounty.title.trim() || !newBounty.description.trim() || !newBounty.requirements.trim()) return

    const { data, error } = await supabase
      .from("bounties")
      .insert({
        creator_id: user.id,
        title: newBounty.title,
        description: newBounty.description,
        requirements: newBounty.requirements,
        reward_amount: Number.parseFloat(newBounty.reward_amount) || 0,
        reward_token: newBounty.reward_token,
        deadline: newBounty.deadline || null,
      })
      .select()
      .single()

    if (data && !error) {
      loadBounties()
      setIsCreateDialogOpen(false)
      setNewBounty({
        title: "",
        description: "",
        requirements: "",
        reward_amount: "",
        reward_token: "STRK",
        deadline: "",
      })
    }
  }

  const handleSubmitToBounty = (bounty: Bounty) => {
    setSelectedBounty(bounty)
    setIsSubmissionDialogOpen(true)
  }

  const onSubmissionSuccess = () => {
    if (user) {
      loadMySubmissions(user.id)
    }
    setIsSubmissionDialogOpen(false)
    setSelectedBounty(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "in_progress":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "completed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  const getSubmissionStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Bounty System</h1>
              <p className="text-muted-foreground">Earn rewards for analytics tasks and data insights</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Trophy className="h-3 w-3" />
                {bounties.filter((b) => b.status === "open").length} Active
              </Badge>
              {userProfile?.role === "admin" && (
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-1" />
                      Create Bounty
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create New Bounty</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="bounty-title">Title</Label>
                        <Input
                          id="bounty-title"
                          placeholder="Enter bounty title..."
                          value={newBounty.title}
                          onChange={(e) => setNewBounty({ ...newBounty, title: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="bounty-description">Description</Label>
                        <Textarea
                          id="bounty-description"
                          placeholder="Describe what needs to be analyzed..."
                          value={newBounty.description}
                          onChange={(e) => setNewBounty({ ...newBounty, description: e.target.value })}
                          className="min-h-[100px]"
                        />
                      </div>
                      <div>
                        <Label htmlFor="bounty-requirements">Requirements</Label>
                        <Textarea
                          id="bounty-requirements"
                          placeholder="Specific requirements and deliverables..."
                          value={newBounty.requirements}
                          onChange={(e) => setNewBounty({ ...newBounty, requirements: e.target.value })}
                          className="min-h-[100px]"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="reward-amount">Reward Amount</Label>
                          <Input
                            id="reward-amount"
                            type="number"
                            placeholder="100"
                            value={newBounty.reward_amount}
                            onChange={(e) => setNewBounty({ ...newBounty, reward_amount: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="reward-token">Token</Label>
                          <Select
                            value={newBounty.reward_token}
                            onValueChange={(value) => setNewBounty({ ...newBounty, reward_token: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="STRK">STRK</SelectItem>
                              <SelectItem value="ETH">ETH</SelectItem>
                              <SelectItem value="USDC">USDC</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="deadline">Deadline (Optional)</Label>
                        <Input
                          id="deadline"
                          type="datetime-local"
                          value={newBounty.deadline}
                          onChange={(e) => setNewBounty({ ...newBounty, deadline: e.target.value })}
                        />
                      </div>
                      <Button onClick={createBounty} className="w-full">
                        Create Bounty
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="all-bounties" className="w-full">
          <TabsList>
            <TabsTrigger value="all-bounties">All Bounties</TabsTrigger>
            <TabsTrigger value="my-submissions">My Submissions</TabsTrigger>
          </TabsList>

          <TabsContent value="all-bounties" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {bounties.map((bounty) => (
                <BountyCard
                  key={bounty.id}
                  bounty={bounty}
                  onSubmit={() => handleSubmitToBounty(bounty)}
                  canSubmit={user && bounty.status === "open"}
                />
              ))}
              {bounties.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Bounties Available</h3>
                  <p className="text-muted-foreground">Check back later for new analytics challenges</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="my-submissions" className="mt-6">
            <div className="space-y-4">
              {mySubmissions.map((submission) => (
                <Card key={submission.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{(submission as any).bounties?.title}</CardTitle>
                      <Badge className={getSubmissionStatusColor(submission.status)}>{submission.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium mb-2">Submission</h4>
                        <p className="text-sm text-muted-foreground">{submission.submission_text}</p>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Submitted {new Date(submission.created_at).toLocaleDateString()}</span>
                        <Button variant="outline" size="sm">
                          <Eye className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {mySubmissions.length === 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                      <Send className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Submissions Yet</h3>
                      <p className="text-muted-foreground">Start working on bounties to see your submissions here</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {selectedBounty && (
        <SubmissionDialog
          bounty={selectedBounty}
          isOpen={isSubmissionDialogOpen}
          onClose={() => setIsSubmissionDialogOpen(false)}
          onSuccess={onSubmissionSuccess}
        />
      )}
    </div>
  )
}
