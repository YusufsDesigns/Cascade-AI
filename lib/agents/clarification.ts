import { randomUUID } from 'crypto'

const pending = new Map<string, (answers: string) => void>()

export function makeClarificationId(projectId: string, agent: string): string {
  return `${projectId}-${agent}-${randomUUID()}`
}

export function awaitClarification(id: string): Promise<string> {
  return new Promise(resolve => pending.set(id, resolve))
}

export function submitClarification(id: string, answers: string): boolean {
  const resolve = pending.get(id)
  if (!resolve) return false
  pending.delete(id)
  resolve(answers)
  return true
}
