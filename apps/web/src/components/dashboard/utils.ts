/**
 * Dashboard utility functions for Nexus Financial Management.
 */
import type { TimeframeKey } from './types'

function getLocale(currency: string): string {
  switch (currency.toUpperCase()) {
    case 'ZAR': return 'en-ZA'
    case 'INR': return 'en-IN'
    case 'GBP': return 'en-GB'
    case 'EUR': return 'en-GB'
    default: return 'en-US'
  }
}

function getCurrencySymbol(currency: string): string {
  switch (currency.toUpperCase()) {
    case 'ZAR': return 'R'
    case 'USD': return '$'
    case 'INR': return '₹'
    case 'GBP': return '£'
    case 'EUR': return '€'
    default: return currency.toUpperCase()
  }
}

export function formatCurrency(amount: number, currency: string = 'ZAR'): string {
  return new Intl.NumberFormat(getLocale(currency), {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatCompact(amount: number, currency: string = 'ZAR'): string {
  const absAmount = Math.abs(amount)
  const sign = amount < 0 ? '-' : ''
  const symbol = getCurrencySymbol(currency)
  if (absAmount >= 1_000_000_000) return `${sign}${symbol}${(absAmount / 1_000_000_000).toFixed(2)}B`
  if (absAmount >= 1_000_000) return `${sign}${symbol}${(absAmount / 1_000_000).toFixed(2)}M`
  if (absAmount >= 10_000) return `${sign}${symbol}${(absAmount / 1_000).toFixed(1)}K`
  return formatCurrency(amount, currency)
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
  })
}

export function getDateRange(timeframe: TimeframeKey): { startDate?: string; endDate?: string } {
  const now = new Date()
  const formatDateStr = (d: Date) => d.toISOString().split('T')[0]

  switch (timeframe) {
    case 'this_month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      return { startDate: formatDateStr(start), endDate: formatDateStr(end) }
    }
    case 'this_year': {
      return { startDate: `${now.getFullYear()}-01-01`, endDate: formatDateStr(now) }
    }
    case 'last_7d': {
      const start = new Date(now); start.setDate(start.getDate() - 7)
      return { startDate: formatDateStr(start), endDate: formatDateStr(now) }
    }
    case 'last_30d': {
      const start = new Date(now); start.setDate(start.getDate() - 30)
      return { startDate: formatDateStr(start), endDate: formatDateStr(now) }
    }
    case 'last_3m': {
      const start = new Date(now); start.setMonth(start.getMonth() - 3)
      return { startDate: formatDateStr(start), endDate: formatDateStr(now) }
    }
    case 'last_6m': {
      const start = new Date(now); start.setMonth(start.getMonth() - 6)
      return { startDate: formatDateStr(start), endDate: formatDateStr(now) }
    }
    case 'last_1y': {
      const start = new Date(now); start.setFullYear(start.getFullYear() - 1)
      return { startDate: formatDateStr(start), endDate: formatDateStr(now) }
    }
    case 'last_3y': {
      const start = new Date(now); start.setFullYear(start.getFullYear() - 3)
      return { startDate: formatDateStr(start), endDate: formatDateStr(now) }
    }
    case 'all_time':
      return {}
  }
}

export function getFiscalYearStartMonth(country: string | null | undefined): number {
  switch (country) {
    case 'ZA': return 2 // 1 March
    case 'IN':
    case 'AU':
    case 'GB':
    case 'NZ': return 3
    case 'US':
    default: return 0
  }
}

export function getFinancialYearRange(
  country: string | null | undefined,
  offset: number = 0
): { startDate: string; endDate: string; label: string } {
  const fyStartMonth = getFiscalYearStartMonth(country)
  const now = new Date()
  let fyStartYear = now.getFullYear()
  if (now.getMonth() < fyStartMonth) fyStartYear -= 1
  fyStartYear += offset

  const fyEndYear = fyStartYear + 1
  const startDate = `${fyStartYear}-${String(fyStartMonth + 1).padStart(2, '0')}-01`

  let endMonth = fyStartMonth - 1
  let endYear = fyEndYear
  if (fyStartMonth === 0) {
    endMonth = 11
    endYear = fyStartYear
  }
  const lastDay = new Date(endYear, endMonth + 1, 0).getDate()
  const endDate = `${endYear}-${String(endMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  const label = fyStartMonth === 0
    ? `FY ${fyStartYear}`
    : country === 'ZA'
      ? `TY ${fyStartYear}-${String(fyEndYear).slice(-2)}`
      : `FY ${fyStartYear}-${String(fyEndYear).slice(-2)}`

  return { startDate, endDate, label }
}
