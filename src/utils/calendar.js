/** Build a minimal recurring-event .ics file for download */
export function buildMarketIcs({
  title,
  description,
  dtStart,
  dtEnd,
  rrule,
  location,
}) {
  const uid = `${Date.now()}-retrocharm@local`
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Retro Charm Co//Market//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeIcsText(title)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    `LOCATION:${escapeIcsText(location)}`,
    `RRULE:${rrule}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return lines.join('\r\n')
}

function formatIcsDate(d) {
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

function escapeIcsText(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

export function downloadIcs(filename, icsContent) {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function googleCalendarTemplateUrl({ title, details, location, dates }) {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    details: details,
    location: location,
    dates: dates,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}
