"use client"

import { useState, useEffect } from "react"
import { formatDistanceToNow } from "date-fns"
import { Clock, Loader2 } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getSupabaseClient } from "@/lib/supabase/client"
import { TiptapContent } from "@/components/ui/tiptap-editor"

interface TimeEntry {
  id: string
  title: string
  description: string | null
  start_time: string
  end_time: string | null
  duration: number
  is_active: boolean
  paid: boolean
}

export function TimeEntries() {
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = getSupabaseClient()
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const getCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        fetchEntries(user.id)
      }
    }

    getCurrentUser()

    // Define the fetchEntries function
    const fetchEntries = async (uid: string) => {
      try {
        const { data, error } = await supabase
          .from("time_entries")
          .select("*")
          .eq("user_id", uid)
          .order("start_time", { ascending: false })
          .limit(10)

        if (error) {
          throw error
        }

        setEntries(data || [])
      } catch (error) {
        console.error("Error fetching time entries:", error)
      } finally {
        setLoading(false)
      }
    }

    // Subscribe to changes
    if (userId) {
      const channel = supabase
        .channel("time_entries_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "time_entries",
            filter: `user_id=eq.${userId}`,
          },
          () => {
            if (userId) fetchEntries(userId)
          },
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [supabase, userId])

  // Format duration as HH:MM:SS
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60

    return [
      hours.toString().padStart(2, "0"),
      minutes.toString().padStart(2, "0"),
      remainingSeconds.toString().padStart(2, "0"),
    ].join(":")
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Clock className="mx-auto h-12 w-12 mb-4" />
          <p>No time entries yet. Start tracking your time!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Time Entries</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {entries.map((entry) => (
            <div key={entry.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium">{entry.title}</h3>
                <div className="text-sm font-mono bg-secondary px-2 py-1 rounded">{formatDuration(entry.duration)}</div>
              </div>

              {entry.description && (
                <div className="text-sm text-muted-foreground mb-2">
                  <TiptapContent content={entry.description} />
                </div>
              )}

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Started {formatDistanceToNow(new Date(entry.start_time), { addSuffix: true })}</span>
                <div className="flex items-center gap-2">
                  {entry.is_active ? (
                    <span className="text-primary font-medium">Active</span>
                  ) : (
                    <span>Completed {formatDistanceToNow(new Date(entry.end_time!), { addSuffix: true })}</span>
                  )}
                  {entry.paid && (
                    <span className="bg-green-500/10 text-green-500 text-xs px-1.5 py-0.5 rounded-sm">Paid</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
