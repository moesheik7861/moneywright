# Moneywright South Africa 🇿🇦

South Africa mode adds ZAR support, South African institutions/categories, local investment providers, and a versioned SARS tax-rules foundation.

## Current foundation

- Country: ZA / South Africa
- Currency: ZAR / R
- South African bank/institution presets
- EasyEquities and other local investment-provider presets
- South African account and transaction categories
- Tax-year model: 1 March to end of February
- Versioned tax rules in `apps/api/src/lib/za-tax.ts`

## Tax safety

The tax engine is an informational calculation aid. Tax rules can change through legislation, Budget announcements and SARS guidance. Before filing or making a tax decision, verify the applicable tax year against current SARS publications or a qualified tax practitioner.

Future phases should add:
1. document-to-tax-record links
2. payslip/PAYE extraction
3. capital-gains transaction lots
4. TFSA contribution tracking
5. SARS-source metadata per rule
6. tax-year reports
7. South African statement parsers and reconciliation
