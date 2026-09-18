/**
 * South African tax rules.
 *
 * IMPORTANT:
 * These values are informational software rules and must be verified against
 * the applicable SARS tax-year publications before being used for a filing.
 */

export interface ZaTaxYear {
  id: string
  start: string
  end: string
  individualBrackets: readonly { threshold: number; rate: number; base: number }[]
  primaryRebate: number
  age65Rebate: number
  age75Rebate: number
  cgtAnnualExclusion: number
  cgtInclusionRate: number
  tfsaAnnualLimit: number
  tfsaLifetimeLimit: number
}

export const ZA_TAX_YEARS: readonly ZaTaxYear[] = [
  {
    id: '2026-27',
    start: '2026-03-01',
    end: '2027-02-28',
    individualBrackets: [
      { threshold: 0, rate: 0.18, base: 0 },
      { threshold: 245100, rate: 0.26, base: 44118 },
      { threshold: 383100, rate: 0.31, base: 79998 },
      { threshold: 530200, rate: 0.36, base: 125599 },
      { threshold: 695800, rate: 0.39, base: 185215 },
      { threshold: 887000, rate: 0.41, base: 259783 },
      { threshold: 1878600, rate: 0.45, base: 666339 },
    ],
    primaryRebate: 17820,
    age65Rebate: 9765,
    age75Rebate: 3249,
    cgtAnnualExclusion: 50000,
    cgtInclusionRate: 0.40,
    tfsaAnnualLimit: 46000,
    tfsaLifetimeLimit: 500000,
  },
]

export function getZaTaxYear(id = '2026-27'): ZaTaxYear {
  const rules = ZA_TAX_YEARS.find((x) => x.id === id)
  if (!rules) throw new Error(`Unsupported South African tax year: ${id}`)
  return rules
}

export function calculateIndividualIncomeTax(taxableIncome: number, taxYear = '2026-27') {
  const rules = getZaTaxYear(taxYear)
  const income = Math.max(0, taxableIncome)
  let tax = 0

  for (let i = rules.individualBrackets.length - 1; i >= 0; i--) {
    const bracket = rules.individualBrackets[i]
    if (income >= bracket.threshold) {
      tax = bracket.base + (income - bracket.threshold) * bracket.rate
      break
    }
  }

  return Math.max(0, tax - rules.primaryRebate)
}

export function calculateTaxableCapitalGain(realisedGain: number, taxYear = '2026-27') {
  const rules = getZaTaxYear(taxYear)
  return Math.max(0, realisedGain - rules.cgtAnnualExclusion) * rules.cgtInclusionRate
}

export function getTfsaAllowance(contributed: number, taxYear = '2026-27') {
  const rules = getZaTaxYear(taxYear)
  return Math.max(0, rules.tfsaAnnualLimit - Math.max(0, contributed))
}
