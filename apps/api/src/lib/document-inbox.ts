/**
 * Document inbox contract.
 *
 * This is the neutral boundary between uploaded financial documents and AI
 * providers. AI returns proposed facts; the ledger remains the source of truth.
 */

export type AiProvider = 'openai' | 'anthropic' | 'ollama'

export type DocumentIntakeType =
  | 'bank_statement'
  | 'credit_card_statement'
  | 'investment_statement'
  | 'payslip'
  | 'receipt'
  | 'tax_certificate'
  | 'retirement_statement'
  | 'other_financial_document'

export interface DocumentTransactionProposal {
  date: string
  description: string
  amount: number
  currency: string
  direction: 'credit' | 'debit'
  category?: string
  counterparty?: string
  reference?: string
  taxRelevant?: boolean
  confidence: number
  evidence?: {
    page?: number
    row?: number
    text?: string
  }
}

export interface DocumentIntakeResult {
  documentType: DocumentIntakeType
  suggestedFilename: string
  institution?: string
  accountName?: string
  periodStart?: string
  periodEnd?: string
  taxYear?: string
  currency: string
  transactions: DocumentTransactionProposal[]
  notes: string[]
  provider: AiProvider
  model: string
}

/**
 * Deterministic filing name. AI may suggest the metadata, but the application
 * owns the final filename and sanitises it before writing to disk.
 */
export function buildDocumentFilename(input: {
  date?: string
  institution?: string
  documentType: DocumentIntakeType
  originalFilename: string
}): string {
  const safe = (value: string) =>
    value
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

  const base = [
    input.date || new Date().toISOString().slice(0, 10),
    input.institution || 'Unknown',
    input.documentType,
  ]
    .map(safe)
    .join(' ')

  const extension = input.originalFilename.toLowerCase().endsWith('.xlsx')
    ? '.xlsx'
    : input.originalFilename.toLowerCase().endsWith('.csv')
      ? '.csv'
      : '.pdf'

  return safe(base) + extension
}
