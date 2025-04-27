import { SummaryStats } from "@/components/reports/summary-stats"
import { TimeEntriesTable } from "@/components/reports/time-entries-table"

export default function ReportsPage() {
  return (
    <div className="space-y-8 p-4">
      <h1 className="text-3xl font-bold">Reports</h1>
      <SummaryStats />
      <TimeEntriesTable />
    </div>
  )
}
