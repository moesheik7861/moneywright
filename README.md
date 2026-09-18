# Nexus Financial Management

Private, local-first personal finance management for South Africa.

Nexus is a personal finance application built around one principle:

**Capture financial evidence once. Turn it into trustworthy transactions. Let every financial view read from those transactions.**

## What Nexus does

- Upload bank and card statements, receipts, slips, invoices and financial photos.
- Extract transactions and keep the original source document with the imported record.
- Categorise transactions using deterministic rules, history, document evidence and your chosen AI.
- View cash flow, accounts, debt, investments, tax information, bills, subscriptions, goals and net worth from the same financial data.
- Use OpenAI, Anthropic, Google or another supported provider — or keep AI local with Ollama.
- Run locally with SQLite so your financial database and documents stay on your machine. Cloud AI is optional and only used when you configure it.

## South African defaults

- Currency: **ZAR / Rand (R)**
- South African date and number formatting
- Financial/tax year: **1 March – 28 February**
- SARS-aware tax-year concepts and South African financial categories
- Local institutions such as Capitec, FNB, Standard Bank, Absa and Nedbank

Tax rules in the application are software guidance and should be checked against the applicable SARS publication before filing.

## Architecture

```
Documents / Statements / Receipts
              ↓
        Extraction + AI
              ↓
         TRANSACTIONS
        (master ledger)
              ↓
 ┌────────────┼──────────────┐
 ↓            ↓              ↓
Accounts    Budget          Tax
 ↓            ↓              ↓
Assets      Goals          Debt
 ↓            ↓              ↓
Investments Bills       Subscriptions
 └────────────┬─────────────┘
              ↓
       Dashboard / Analytics
```

Transactions are the financial event history. Other pages are views, calculations, classifications or planning structures derived from that history.

## Local development

Prerequisite: Bun.

```bash
bun install
bun run dev
```

- Web: http://localhost:3000
- API: http://localhost:17777

The application uses SQLite by default. Local mode uses the local authentication/PIN flow.

## License

AGPL-3.0-only.

This repository started from the Moneywright codebase and the South African branch is being developed into Nexus Financial Management.
