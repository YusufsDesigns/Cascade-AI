import { prisma } from '@/lib/db/prisma'
import type { AgentEvent } from '@/lib/tools/deal-tools'

export function createEventLogger(projectId: string, runType: string) {
  return async function logEvent(event: AgentEvent): Promise<void> {
    const eventDataPayload: Record<string, unknown> = {}
    if (event.questions)       eventDataPayload.questions       = event.questions
    if (event.clarificationId) eventDataPayload.clarificationId = event.clarificationId
    if (event.projectId)       eventDataPayload.projectId       = event.projectId
    if (event.data)            Object.assign(eventDataPayload, event.data)

    await prisma.agentEvent.create({
      data: {
        projectId,
        runType,
        type:      event.type,
        agent:     event.agent ?? null,
        message:   event.message,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        eventData: Object.keys(eventDataPayload).length > 0 ? eventDataPayload as any : undefined,
      },
    })
  }
}
