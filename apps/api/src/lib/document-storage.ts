/**
 * Persistent storage for uploaded financial documents.
 *
 * Documents live outside the database so the original PDF/image/spreadsheet
 * survives failed extraction and can be sent to a local AI/OCR worker later.
 */
import { existsSync, mkdirSync } from 'fs'
import { writeFile } from 'fs/promises'
import { join } from 'path'

function getDocumentRoot(): string {
  if (process.env.DATA_DIR) return join(process.env.DATA_DIR, 'documents')
  if (process.env.APP_ENV === 'development') {
    return join(process.cwd(), '..', '..', 'data', 'documents')
  }
  return join(process.cwd(), 'data', 'documents')
}

export async function storeOriginalDocument(
  userId: string,
  statementId: string,
  filename: string,
  buffer: Buffer
): Promise<string> {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  const directory = join(getDocumentRoot(), userId)
  if (!existsSync(directory)) mkdirSync(directory, { recursive: true })
  const path = join(directory, `${statementId}-${safeName}`)
  await writeFile(path, buffer)
  return path
}

export function getDocumentRootPath(): string {
  return getDocumentRoot()
}
