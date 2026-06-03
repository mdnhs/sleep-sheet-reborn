import { subDays, subWeeks, subMonths, startOfToday } from 'date-fns'

export const getDateRange = (period: string) => {
  const now = startOfToday()
  switch (period) {
    case 'day':
      return { startDate: subDays(now, 1), endDate: now }
    case 'week':
      return { startDate: subWeeks(now, 1), endDate: now }
    case 'month':
      return { startDate: subMonths(now, 1), endDate: now }
    default:
      return { startDate: subMonths(now, 1), endDate: now }
  }
}

export function getStartDate(period: string): Date {
  const now = new Date()
  switch (period) {
    case 'day':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate())
    case 'week': {
      const dayOfWeek = now.getDay()
      const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
      return new Date(now.getFullYear(), now.getMonth(), diff)
    }
    case 'month':
      return new Date(now.getFullYear(), now.getMonth(), 1)
    case 'year':
      return new Date(now.getFullYear(), 0, 1)
    default:
      return new Date(now.getFullYear(), now.getMonth(), 1)
  }
}
