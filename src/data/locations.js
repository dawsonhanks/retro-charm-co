export const locations = [
  {
    id: 'orem',
    name: 'Sunset Farmers Market — Orem',
    shortName: 'Orem',
    address: '293 E Center St, Orem, UT 84058',
    embedQuery: '293+E+Center+St,+Orem,+UT',
    lat: 40.2969,
    lng: -111.6945,
    dates: 'May - October',
    hours: '5-9 PM through September; 5-8 PM in October',
    dayLabel: 'Wednesdays',
    calendar: {
      title: 'Sunset Farmers Market — Orem (RetroCharm Co)',
      description: 'Pick your base and charms at the RetroCharm Co booth.',
      dtStart: '20260506T170000',
      dtEnd: '20260506T210000',
      rrule: 'FREQ=WEEKLY;UNTIL=20261029T215959Z',
    },
  },
]

export function getMapsEmbedSrc(query) {
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`
}
