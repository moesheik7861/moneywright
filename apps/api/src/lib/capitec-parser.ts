import type { AccountInfo } from '../llm/schemas'
import type { RawPdfTransaction } from './pdf/types'

const MONEY_RE = /[-+]?R?\s?\d[\d\s,]*\.\d{2}/g
const DATE_RE = /\b(\d{2}\/\d{2}\/\d{4})\b/

function money(value: string): number {
  return Number(value.replace(/R/gi, '').replace(/\s/g, '').replace(/,/g, ''))
}

function isoDate(value: string): string {
  const [day, month, year] = value.split('/')
  return \`\${year}-\${month}-\${day}\`
}

function firstMatch(text: string, regex: RegExp): string | null {
  const match = text.match(regex)
  return match?.[1]?.trim() ?? null
}

function findHolderName(text: string): string | null {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  const bankIndex = lines.findIndex((line) => /capitec\s+bank\s+limited/i.test(line))
  const candidates =
    bankIndex > 0 ? lines.slice(Math.max(0, bankIndex - 8), bankIndex) : lines.slice(0, 12)
  const blocked =
    /statement|account|tax invoice|branch|device|street|road|avenue|technopark|techno park|vat|registration|postcode|cape town|johannesburg|stellenbosch|bank limited/i

  for (const line of candidates) {
    const words = line.split(/\s+/)
    if (
      words.length >= 2 &&
      words.length <= 6 &&
      /^[A-Z][A-Z .'-]+$/.test(line) &&
      !blocked.test(line)
    ) {
      return line
    }
  }
  return null
}

function extractTextValue(text: string, labels: RegExp[]): string | null {
  for (const label of labels) {
    const match = text.match(label)
    if (match?.[1]) return match[1].trim()
  }
  return null
}

export interface CapitecLocalParseResult {
  accountInfo: AccountInfo
  transactions: RawPdfTransaction[]
  confidence: number
}

export function looksLikeCapitecStatement(text: string): boolean {
  return /capitec(?:\s+bank)?(?:\s+limited)?/i.test(text)
}

export function parseCapitecStatement(text: string): CapitecLocalParseResult | null {
  if (!looksLikeCapitecStatement(text)) return null

  const accountNumber = extractTextValue(text, [
    /\bAccount(?:\s+Number)?\s*:\s*([0-9]{6,20})/i,
    /\bAccount(?:\s+Number)?\s+([0-9]{6,20})/i,
    /\bAccount(?:\s+Number)?\s*[:\s]*\n?\s*([0-9]{6,20})/i,
  ])
  const fromDate = extractTextValue(text, [
    /\bFrom\s+Date\s*:\s*(\d{2}\/\d{2}\/\d{4})/i,
    /\bFrom\s+Date\s*:\s*\n?\s*(\d{2}\/\d{2}\/\d{4})/i,
  ])
  const toDate = extractTextValue(text, [
    /\bTo\s+Date\s*:\s*(\d{2}\/\d{2}\/\d{4})/i,
    /\bTo\s+Date\s*:\s*\n?\s*(\d{2}\/\d{2}\/\d{4})/i,
  ])
  const opening = firstMatch(
    text,
    /\bOpening\s+Balance\s*:\s*(R?\s?[\d\s,]+\.\d{2})/i
  )
  const closing = firstMatch(
    text,
    /\bClosing\s+Balance\s*:\s*(R?\s?[\d\s,]+\.\d{2})/i
  )

  if (!accountNumber) return null

  const accountType = /Savings\s+Account\s+Statement/i.test(text)
    ? 'savings_account'
    : 'current_account'

  const accountInfo: AccountInfo = {
    account_type: accountType,
    institution_id: 'capitec',
    institution_name: 'Capitec Bank',
    account_number: accountNumber,
    account_holder_name: findHolderName(text),
    product_name: null,
    period_start: fromDate ? isoDate(fromDate) : null,
    period_end: toDate ? isoDate(toDate) : null,
    summary: {
      debit_count: null,
      credit_count: null,
      total_debits: null,
      total_credits: null,
      opening_balance: opening ? money(opening) : null,
      closing_balance: closing ? money(closing) : null,
    },
    total_dues: null,
    minimum_dues: null,
    payment_due_date: null,
  }

  const transactions: RawPdfTransaction[] = []
  const historyIndex = text.search(/\bTransaction\s+History\b/i)

  if (historyIndex >= 0) {
    const afterHistory = text.slice(historyIndex)
    const endMatch = afterHistory.search(
      /\n\s*(?:Scheduled Payments|Transactions? not yet processed|Cheques? not yet processed|24hr Client Care|Unique Document No\.)\b/i
    )
    const history = endMatch > 0 ? afterHistory.slice(0, endMatch) : afterHistory
    const lines = history
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)

    let current: { date: string; text: string } | null = null

    const flush = () => {
      if (!current) return
      const nums = current.text.match(MONEY_RE) || []
      if (nums.length < 2) {
        current = null
        return
      }

      const balance = money(nums[nums.length - 1]!)
      const amountToken = nums[0]!
      let amount = money(amountToken)
      let type: 'credit' | 'debit'

      if (/^-/.test(amountToken)) {
        type = 'debit'
        amount = Math.abs(amount)
      } else if (opening !== null && transactions.length === 0) {
        const openingBalance = money(opening!)
        type = balance >= openingBalance ? 'credit' : 'debit'
      } else {
        const previousBalance = transactions[transactions.length - 1]?.balance
        type = previousBalance != null && balance < previousBalance ? 'debit' : 'credit'
      }

      let description = current.text
      for (const n of nums) description = description.replace(n, ' ')
      description = description.replace(/\s+/g, ' ').trim()

      if (
        !description ||
        /^(date|description|category|money in|money out|balance)/i.test(description)
      ) {
        current = null
        return
      }

      transactions.push({
        date: current.date,
        type,
        amount,
        description,
        balance,
      })
      current = null
    }

    for (const line of lines) {
      const match = line.match(DATE_RE)

      if (match) {
        flush()
        let rest = line.slice(match.index! + match[0].length).trim()

        // Older Capitec statements can print posting date + transaction date.
        const secondDate = rest.match(/^\d{2}\/\d{2}\/\d{4}\s+/)
        if (secondDate) {
          rest = rest.replace(/^\d{2}\/\d{2}\/\d{4}\s+/, '').trim()
        }

        current = {
          date: isoDate(match[1]!),
          text: rest,
        }
      } else if (current) {
        current.text += ' ' + line
      }
    }

    flush()
  }

  return {
    accountInfo,
    transactions,
    confidence: transactions.length > 0 ? 0.95 : 0.85,
  }
}
