import { toJalaali } from "jalaali-js"

// Convert Gregorian date to Jalali format
export function toJalaliDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  const { jy, jm, jd } = toJalaali(dateObj.getFullYear(), dateObj.getMonth() + 1, dateObj.getDate())

  return `${jy}/${jm.toString().padStart(2, "0")}/${jd.toString().padStart(2, "0")}`
}

// Format time as HH:MM:SS
export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  return [
    hours.toString().padStart(2, "0"),
    minutes.toString().padStart(2, "0"),
    remainingSeconds.toString().padStart(2, "0"),
  ].join(":")
}

// Convert duration in seconds to hours (for billing)
export function secondsToHours(seconds: number): number {
  return Number.parseFloat((seconds / 3600).toFixed(2))
}
