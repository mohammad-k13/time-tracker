import { TimerTracker } from "@/components/timer/timer-tracker"
import { TimeEntries } from "@/components/timer/time-entries"

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <TimerTracker />
      <TimeEntries />
    </div>
  )
}
