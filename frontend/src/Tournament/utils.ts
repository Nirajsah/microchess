export function microsToDatetimeLocal(micros: number | null): string {
  if (!micros) return ''
  // Convert microseconds to milliseconds for JavaScript Date
  const date = new Date(micros / 1000)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

// Convert datetime-local string to microseconds
export function datetimeLocalToMicros(value: string): number | null {
  if (!value) return null
  // Get milliseconds from Date, then convert to microseconds
  return new Date(value).getTime() * 1000
}
