"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trophy, Clock, DollarSign, Calendar, User } from "lucide-react"

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

interface BountyCardProps {
  bounty: Bounty
  onSubmit: () => void
  canSubmit: boolean
}

export function BountyCard({ bounty, onSubmit, canSubmit }: BountyCardProps) {
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

  const isExpired = bounty.deadline && new Date(bounty.deadline) < new Date()

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            <Badge className={getStatusColor(bounty.status)}>{bounty.status}</Badge>
          </div>
          <div className="flex items-center gap-1 text-primary font-semibold">
            <DollarSign className="h-4 w-4" />
            {bounty.reward_amount} {bounty.reward_token}
          </div>
        </div>
        <CardTitle className="text-lg leading-tight">{bounty.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="space-y-3 flex-1">
          <p className="text-sm text-muted-foreground line-clamp-3">{bounty.description}</p>

          <div className="space-y-2">
            <h4 className="font-medium text-sm">Requirements:</h4>
            <p className="text-xs text-muted-foreground line-clamp-2">{bounty.requirements}</p>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {bounty.profiles?.display_name || "Anonymous"}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(bounty.created_at).toLocaleDateString()}
            </div>
          </div>

          {bounty.deadline && (
            <div className="flex items-center gap-1 text-xs">
              <Clock className="h-3 w-3" />
              <span className={isExpired ? "text-red-500" : "text-muted-foreground"}>
                Deadline: {new Date(bounty.deadline).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        <div className="pt-4 mt-auto">
          <Button
            onClick={onSubmit}
            disabled={!canSubmit || bounty.status !== "open" || isExpired}
            className="w-full"
            variant={bounty.status === "open" && !isExpired ? "default" : "secondary"}
          >
            {bounty.status === "open" && !isExpired
              ? "Submit Solution"
              : bounty.status === "completed"
                ? "Completed"
                : bounty.status === "cancelled"
                  ? "Cancelled"
                  : isExpired
                    ? "Expired"
                    : "In Progress"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
