export const locations = [
  {
    id: 'springville',
    name: 'Sunset Farmers Market — Springville',
    shortName: 'Springville',
    address: '110 S Main St, Springville, UT 84663',
    embedQuery: '110+S+Main+St,+Springville,+UT',
    lat: 40.1668,
    lng: -111.6108,
    dates: 'Tuesday evenings, June–October',
    hours: '5:00–9:00 PM weekly',
    dayLabel: 'Tuesdays',
    calendar: {
      title: 'Sunset Farmers Market — Springville (Retro Charm Co)',
      description:
        'Build your Italian charm bracelet at the Retro Charm Co booth. Sunset Farmers Market, Springville.',
      /** Approximate start for ICS (first Tuesday of June 2026); adjust as needed */
      dtStart: '20260602T170000',
      dtEnd: '20260602T210000',
      rrule: 'FREQ=WEEKLY;BYDAY=TU;UNTIL=20261027T215959Z',
    },
  },
  {
    id: 'draper',
    name: 'Sunset Farmers Market — Draper',
    shortName: 'Draper',
    address: '200 E 13400 S, Draper, UT 84020',
    embedQuery: '200+E+13400+S,+Draper,+UT',
    lat: 40.5078,
    lng: -111.8601,
    dates: 'July–October',
    hours: '5:00–9:00 PM weekly',
    dayLabel: 'Weekly (see market schedule)',
    calendar: {
      title: 'Sunset Farmers Market — Draper (Retro Charm Co)',
      description: 'Custom Italian charm bracelets at the Retro Charm Co booth.',
      dtStart: '20260701T170000',
      dtEnd: '20260701T210000',
      rrule: 'FREQ=WEEKLY;UNTIL=20261029T215959Z',
    },
  },
  {
    id: 'orem',
    name: 'Sunset Farmers Market — Orem',
    shortName: 'Orem',
    address: '293 E Center St, Orem, UT 84097',
    embedQuery: '293+E+Center+St,+Orem,+UT',
    lat: 40.2969,
    lng: -111.6945,
    dates: 'May–October',
    hours: '5:00–9:00 PM weekly',
    dayLabel: 'Weekly (see market schedule)',
    calendar: {
      title: 'Sunset Farmers Market — Orem (Retro Charm Co)',
      description: 'Pick your base and charms at the Retro Charm Co booth.',
      dtStart: '20260506T170000',
      dtEnd: '20260506T210000',
      rrule: 'FREQ=WEEKLY;UNTIL=20261029T215959Z',
    },
  },
  {
    id: 'lindon',
    name: 'Sunset Farmers Market — Lindon',
    shortName: 'Lindon',
    address: '200 N State St, Lindon, UT 84042',
    embedQuery: '200+N+State+St,+Lindon,+UT',
    lat: 40.3436,
    lng: -111.7207,
    dates: 'July–October',
    hours: '5:00–9:00 PM weekly',
    dayLabel: 'Weekly (see market schedule)',
    calendar: {
      title: 'Sunset Farmers Market — Lindon (Retro Charm Co)',
      description: 'Retro Charm Co — Italian charm bracelets.',
      dtStart: '20260701T170000',
      dtEnd: '20260701T210000',
      rrule: 'FREQ=WEEKLY;UNTIL=20261029T215959Z',
    },
  },
]

export function getMapsEmbedSrc(query) {
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`
}
