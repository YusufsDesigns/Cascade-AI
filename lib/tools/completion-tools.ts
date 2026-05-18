import { Type } from '@google/genai'
import type { Tool } from '@google/genai'

export const completionTools: Tool = {
  functionDeclarations: [
    {
      name: 'generateCompletionSummary',
      description: 'Generate and save the project completion handoff summary. Write a comprehensive summary of what was delivered.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          summary: {
            type: Type.STRING,
            description: 'Full handoff summary: each deliverable confirmed complete, key decisions made, what the client now has, any handoff notes, warm closing.',
          },
        },
        required: ['summary'],
      },
    },
    {
      name: 'sendCompletionEmail',
      description: 'Send the project completion email to the client. Call this after generateCompletionSummary.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          subject: { type: Type.STRING, description: 'Email subject, e.g. "[ProjectName] — Project Complete"' },
          content: { type: Type.STRING, description: 'Full email body. Warm and professional. References specific deliverables.' },
        },
        required: ['subject', 'content'],
      },
    },
  ],
}
