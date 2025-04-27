export function exportToCSV(data: any[], filename: string): void {
  // Convert data to CSV format
  const csvContent = convertToCSV(data)

  // Create a blob with the CSV content
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })

  // Create a download link
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)

  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  link.style.visibility = "hidden"

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function convertToCSV(data: any[]): string {
  if (data.length === 0) return ""

  // Get headers from the first object
  const headers = Object.keys(data[0])

  // Create CSV header row
  const headerRow = headers.join(",")

  // Create CSV data rows
  const rows = data.map((obj) => {
    return headers
      .map((header) => {
        // Handle values that might contain commas or quotes
        const value = obj[header] === null || obj[header] === undefined ? "" : obj[header]
        const valueStr = value.toString()

        // Escape quotes and wrap in quotes if contains commas or quotes
        if (valueStr.includes(",") || valueStr.includes('"')) {
          return `"${valueStr.replace(/"/g, '""')}"`
        }
        return valueStr
      })
      .join(",")
  })

  // Combine header and data rows
  return [headerRow, ...rows].join("\n")
}
