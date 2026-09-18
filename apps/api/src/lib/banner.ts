import chalk from 'chalk'
import boxen from 'boxen'
import type { DatabaseType } from '../db'

export function getVersion(): string {
  return typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev'
}

interface StartupOptions {
  port: number
  isFirstRun?: boolean
  dbType: DatabaseType
}

export function printBanner() {
  console.clear()
  console.log()
  console.log(chalk.hex('#34d399').bold('  NEXUS'))
  console.log(chalk.hex('#6ee7b7')('  Financial Management'))
  console.log()
  console.log(chalk.dim('  Private, local-first personal finance'))
  console.log(chalk.dim('  South Africa · ZAR · AI of your choice'))
  console.log()
  console.log(chalk.dim(`  v${getVersion()}`))
  console.log()
}

export function printStartupInfo(options: StartupOptions) {
  const { port, isFirstRun, dbType } = options

  const statusBox = boxen(chalk.green.bold('✓') + chalk.white.bold(' Server is running'), {
    padding: { top: 0, bottom: 0, left: 1, right: 1 },
    margin: { top: 0, bottom: 0, left: 1, right: 0 },
    borderStyle: 'round',
    borderColor: '#34d399',
  })
  console.log(statusBox)
  console.log()
  console.log(chalk.hex('#6ee7b7').bold('  🌐 Open in browser'))
  console.log(chalk.hex('#34d399')(`     http://localhost:${port}`))
  console.log()

  if (isFirstRun) {
    const firstRunContent = [
      chalk.white('Configure your AI provider to get started:'),
      chalk.hex('#34d399')(`→ http://localhost:${port}/setup`),
    ].join('\n')
    const firstRunBox = boxen(firstRunContent, {
      title: chalk.hex('#6ee7b7')('⚡ First run detected'),
      titleAlignment: 'left',
      padding: { top: 0, bottom: 0, left: 1, right: 1 },
      margin: { top: 0, bottom: 0, left: 1, right: 0 },
      borderStyle: 'round',
      borderColor: '#34d399',
    })
    console.log(firstRunBox)
    console.log()
  }

  console.log(chalk.dim(
    `  📦 Database: ${chalk.hex('#6ee7b7')(dbType === 'postgres' ? 'PostgreSQL' : 'SQLite')}`
  ))
  console.log(chalk.dim('  🔒 Local-first mode'))
  console.log(chalk.dim('  Press ') + chalk.hex('#34d399')('Ctrl+C') + chalk.dim(' to stop'))
  console.log()
}

export function printError(message: string) {
  console.log(chalk.red.bold('  ✗ Error: ') + chalk.red(message))
}

export function printWarning(message: string) {
  console.log(chalk.hex('#fbbf24')('  ⚠ ') + chalk.hex('#fbbf24')(message))
}

export function printSuccess(message: string) {
  console.log(chalk.hex('#34d399')('  ✓ ') + message)
}
