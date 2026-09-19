import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  ArrowUpRight,
  ArrowDownLeft,
  Pencil,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Transaction, Account, Category, Profile } from '@/lib/api'
import { getProfileName } from '@/components/ui/profile-badge'

export type SortBy = 'date' | 'amount'
export type SortOrder = 'asc' | 'desc'

interface TransactionTableProps {
  transactions: Transaction[]
  accounts: Account[]
  categories: Category[]
  countryCode: string
  onEditTransaction: (transaction: Transaction) => void
  getCategoryLabel: (code: string) => string
  formatAmount: (amount: number, currency: string) => string
  sortBy?: SortBy
  sortOrder?: SortOrder
  onSortChange?: (sortBy: SortBy, sortOrder: SortOrder) => void
  profiles?: Profile[]
  showProfileBadge?: boolean
}

function SortIndicator({
  column,
  sortBy,
  sortOrder,
}: {
  column: SortBy
  sortBy: SortBy
  sortOrder: SortOrder
}) {
  if (sortBy !== column) return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />
  return sortOrder === 'asc' ? (
    <ArrowUp className="h-3.5 w-3.5 text-primary" />
  ) : (
    <ArrowDown className="h-3.5 w-3.5 text-primary" />
  )
}

const colorStyles: Record<string, string> = {
  emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
  orange: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20',
  lime: 'bg-lime-100 text-lime-700 border-lime-200 dark:bg-lime-500/10 dark:text-lime-400 dark:border-lime-500/20',
  blue: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
  cyan: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20',
  purple: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20',
  amber: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
  pink: 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-500/10 dark:text-pink-400 dark:border-pink-500/20',
  sky: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20',
  red: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
  fuchsia: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-500/10 dark:text-fuchsia-400 dark:border-fuchsia-500/20',
  indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20',
  slate: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20',
  violet: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20',
  teal: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-500/20',
  rose: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20',
  zinc: 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-500/10 dark:text-zinc-400 dark:border-zinc-500/20',
}

export function TransactionTable({
  transactions,
  accounts,
  categories,
  countryCode,
  onEditTransaction,
  getCategoryLabel,
  formatAmount,
  sortBy = 'date',
  sortOrder = 'desc',
  onSortChange,
  profiles,
  showProfileBadge,
}: TransactionTableProps) {
  const accountMap = new Map(accounts?.map((a) => [a.id, a]) || [])
  const categoryMap = new Map(categories?.map((c) => [c.code, c]) || [])

  const getCategoryColor = (code: string) => {
    const category = categoryMap.get(code)
    return colorStyles[category?.color || 'zinc'] || colorStyles.zinc
  }

  const handleSort = (column: SortBy) => {
    if (!onSortChange) return
    onSortChange(column, sortBy === column ? (sortOrder === 'asc' ? 'desc' : 'asc') : 'desc')
  }

  return (
    <div className="rounded-xl overflow-hidden border border-border-subtle bg-card">
      <div className="border-b border-border-subtle bg-surface-elevated px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Transaction Journal</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Log every income & expense. Imported transactions are shown here in ledger format.
            </p>
          </div>
          <div className="text-xs text-muted-foreground whitespace-nowrap">
            South Africa · ZAR
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table className="min-w-[1900px]">
          <TableHeader>
            <TableRow className="bg-surface-elevated hover:bg-surface-elevated border-b border-border-subtle">
              <TableHead className="w-28">Date</TableHead>
              <TableHead className="w-28">Type</TableHead>
              <TableHead className="w-48">Category</TableHead>
              <TableHead className="w-48">Account</TableHead>
              <TableHead className="w-32 text-right">Amount</TableHead>
              <TableHead className="min-w-[360px]">Description</TableHead>
              <TableHead className="w-24">Tax?</TableHead>
              <TableHead className="w-24">Month</TableHead>
              <TableHead className="w-20">Year</TableHead>
              <TableHead className="w-28">Recurring?</TableHead>
              <TableHead className="w-28">Source</TableHead>
              <TableHead className="w-28 text-right">Units (kWh)</TableHead>
              <TableHead className="w-28 text-right">VAT (R)</TableHead>
              <TableHead className="w-36 text-right">Other charges (R)</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {transactions.map((txn, index) => {
              const account = accountMap.get(txn.accountId)
              const accountNumber = account?.accountNumber || ''
              const last4 = accountNumber ? accountNumber.slice(-4) : '----'
              const institutionId = account?.institution || ''
              const logoPath = institutionId
                ? `/institutions/za/${institutionId}.svg`
                : null
              const date = new Date(txn.date)
              const month = date.toLocaleDateString('en-ZA', { year: 'numeric', month: '2-digit' })
              const year = date.getFullYear()
              const typeLabel = txn.type === 'credit' ? 'Income' : 'Expense'

              return (
                <TableRow
                  key={txn.id}
                  className="group border-b border-border-subtle last:border-b-0 hover:bg-surface-hover transition-colors"
                  style={{ animationDelay: `${Math.min(index * 15, 180)}ms` }}
                >
                  <TableCell className="whitespace-nowrap py-3 text-sm text-foreground">
                    {date.toLocaleDateString('en-ZA', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                    })}
                  </TableCell>

                  <TableCell className="py-3">
                    <span className={cn(
                      'inline-flex rounded-md border px-2 py-1 text-xs font-medium',
                      txn.type === 'credit'
                        ? 'border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400'
                        : 'border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-500/20 dark:bg-zinc-500/10 dark:text-zinc-400'
                    )}>
                      {typeLabel}
                    </span>
                  </TableCell>

                  <TableCell className="py-3">
                    <span
                      className={cn(
                        'inline-flex max-w-[190px] items-center rounded-md border px-2 py-1 text-xs font-medium',
                        getCategoryColor(txn.category)
                      )}
                      title={
                        txn.categoryConfidence != null
                          ? `Categorization confidence: ${Math.round(txn.categoryConfidence * 100)}%`
                          : undefined
                      }
                    >
                      <span className="truncate">{getCategoryLabel(txn.category)}</span>
                    </span>
                  </TableCell>

                  <TableCell className="py-3">
                    <AccountLogo
                      logoPath={logoPath}
                      institutionId={institutionId || 'bank'}
                      accountName={account?.accountName || account?.productName || 'Account'}
                      last4={last4}
                      profileName={
                        showProfileBadge && profiles
                          ? getProfileName(txn.profileId, profiles)
                          : null
                      }
                    />
                  </TableCell>

                  <TableCell className="py-3 text-right whitespace-nowrap">
                    <span className={cn(
                      'font-semibold tabular-nums text-sm',
                      txn.type === 'credit' ? 'text-positive' : 'text-foreground'
                    )}>
                      {txn.type === 'credit' ? '+' : '-'}{formatAmount(txn.amount, 'ZAR')}
                    </span>
                  </TableCell>

                  <TableCell className="py-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground text-sm" title={txn.summary || txn.originalDescription}>
                        {txn.summary || txn.originalDescription}
                      </p>
                      {txn.summary && txn.summary !== txn.originalDescription && (
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          Bank description: {txn.originalDescription}
                        </p>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="py-3 text-xs text-muted-foreground">No</TableCell>
                  <TableCell className="py-3 text-xs text-muted-foreground">{month}</TableCell>
                  <TableCell className="py-3 text-xs text-muted-foreground">{year}</TableCell>
                  <TableCell className="py-3 text-xs text-muted-foreground">
                    {txn.isSubscription ? 'Yes' : 'No'}
                  </TableCell>
                  <TableCell className="py-3 text-xs text-muted-foreground">Statement</TableCell>
                  <TableCell className="py-3 text-right text-xs text-muted-foreground">—</TableCell>
                  <TableCell className="py-3 text-right text-xs text-muted-foreground">—</TableCell>
                  <TableCell className="py-3 text-right text-xs text-muted-foreground">—</TableCell>

                  <TableCell className="py-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                      onClick={() => onEditTransaction(txn)}
                      title="Edit transaction"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )

}

function AccountLogo({
  logoPath,
  institutionId,
  accountName,
  last4,
  profileName,
}: {
  logoPath: string | null
  institutionId: string
  accountName: string
  last4: string
  profileName?: string | null
}) {
  const [logoError, setLogoError] = useState(false)

  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="h-7 w-7 rounded-md bg-surface flex items-center justify-center overflow-hidden shrink-0 border border-border-subtle">
        {logoPath && !logoError ? (
          <img
            src={logoPath}
            alt={institutionId}
            className="h-4 w-4 object-contain"
            onError={() => setLogoError(true)}
          />
        ) : (
          <span className="text-[9px] font-medium text-muted-foreground">
            {institutionId.slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-foreground">{accountName}</p>
        <p className="text-[11px] text-muted-foreground">••{last4}</p>
        {profileName && (
          <p className="truncate text-[10px] text-muted-foreground">{profileName}'s account</p>
        )}
      </div>
    </div>
  )
}
