import type { AccountInfo } from '../llm/schemas'
import type { RawPdfTransaction } from './pdf/types'

const MONEY_RE = /[-+]?R?\s?\d[\d\s,]*\.\d{2}/g
const DATE_RE = /\b(\d{2}\/\d{2}\/\d{4})\b/

function money(value: string): number {
  return Number(value.replace(/R/gi, '').replace(/\s/g, '').replace(/,/g, ''))
}

function isoDate(value: string): string {
  const [day, month, year] = value.split('/')
  return `${year}-${month}-${day}`
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
  // PDF extraction can place arbitrary spaces, newlines, or punctuation between
  // characters. Compact alphabetic text makes the bank-name test resilient.
  const compact = text.replace(/[^a-z]/gi, '').toLowerCase()
  return compact.includes('capitec') && compact.includes('bank')
}

function normalizeAccountCandidate(value: string): string | null {
  const digits = value.replace(/[^0-9]/g, '')
  // Capitec uses 10-digit account numbers. Reject shorter values so a date
  // fragment such as "202615" can never become the linked account.
  return digits.length === 10 ? digits : null
}

function extractAccountNumber(text: string): string | null {
  const normalized = text.replace(/\u00a0/g, ' ').replace(/\r/g, '').replace(/\f/g, '\n')
  const lines = normalized.split('\n').map((line) => line.trim()).filter(Boolean)

  // Preferred: account label followed by the number on the same line or one
  // of the next few lines. Allow spaces/hyphens inside the number because some
  // PDF extractors split long digit runs.
  for (let i = 0; i < lines.length; i++) {
    if (!/\bAccount(?:\s+Number)?\b/i.test(lines[i]!)) continue

    const nearby = lines.slice(i, Math.min(i + 5, lines.length)).join(' ')
    const candidates = nearby.match(/[0-9][0-9\s-]{9,29}/g) || []
    for (const candidate of candidates) {
      const normalizedCandidate = normalizeAccountCandidate(candidate)
      if (normalizedCandidate) return normalizedCandidate
    }
  }

  // Fallback for "Account 1234567890" / "Account Number: 1234567890"
  // and line-wrapped variants.
  const directCandidates =
    normalized.match(/\bAccount(?:\s+Number)?\b\s*:?\s*([0-9][0-9\s-]{5,25})/i)
  const direct = directCandidates?.[1] ? normalizeAccountCandidate(directCandidates[1]) : null
  if (direct) return direct

  // Last deterministic fallback: locate the first plausible 6-20 digit value
  // immediately after the word "Account", ignoring PDF whitespace/punctuation.
  const compact = normalized.replace(/[^A-Za-z0-9]/g, ' ')
  const compactMatch = compact.match(/\bAccount\s+(?:Number\s+)?(\d(?:[\d ]{9,29}))\b/i)
  return compactMatch?.[1] ? normalizeAccountCandidate(compactMatch[1]) : null
}

export function parseCapitecStatement(text: string): CapitecLocalParseResult | null {
  if (!looksLikeCapitecStatement(text)) return null

  const normalized = text.replace(/\u00a0/g, ' ').replace(/\r/g, '').replace(/\f/g, '\n')

  const accountNumber = extractAccountNumber(normalized)

  const fromDate =
    extractTextValue(normalized, [
      /\bFrom\s+Date\s*:\s*(\d{2}\/\d{2}\/\d{4})/i,
      /\bFrom\s+Date\s*:\s*\n\s*(\d{2}\/\d{2}\/\d{4})/i,
    ]) ||
    firstMatch(normalized, /\bFrom\s+Date\s*[:]?\s*(?:\n\s*)?(\d{2}\/\d{2}\/\d{4})/i)

  const toDate =
    extractTextValue(normalized, [
      /\bTo\s+Date\s*:\s*(\d{2}\/\d{2}\/\d{4})/i,
      /\bTo\s+Date\s*:\s*\n\s*(\d{2}\/\d{2}\/\d{4})/i,
    ]) ||
    firstMatch(normalized, /\bTo\s+Date\s*[:]?\s*(?:\n\s*)?(\d{2}\/\d{2}\/\d{4})/i)
  const opening = firstMatch(
    normalized,
    /\bOpening\s+Balance\s*:\s*(R?\s?[\d\s,]+\.\d{2})/i
  )
  const closing = firstMatch(
    normalized,
    /\bClosing\s+Balance\s*:\s*(R?\s?[\d\s,]+\.\d{2})/i
  )

  if (!accountNumber) {
    const accountIndex = normalized.search(/\bAccount(?:\s+Number)?\b/i)
    console.warn(
      `[Capitec] Bank detected but account number not extracted; account label index=${accountIndex}`
    )
    return null
  }

  const accountType = /Savings\s+Account\s+Statement/i.test(normalized)
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
  const historyIndex = normalized.search(/\bTransaction\s+History\b/i)

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
