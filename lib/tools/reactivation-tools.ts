import { Type } from '@google/genai'
import type { Tool } from '@google/genai'

export const reactivationCommsTools: Tool = {
  functionDeclarations: [
    {
      name: 'saveEmail',
      description:
        'Send a personalized confirmation email to the client acknowledging their intake submission. Type must be CONFIRMATION. Write the full content — reference their specific answers, confirm next steps, show you understood what they submitted.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          type: {
            type: Type.STRING,
            enum: ['CONFIRMATION'],
            description: 'Always CONFIRMATION for reactivation emails',
          },
          subject: {
            type: Type.STRING,
            description: 'Specific subject line referencing their project',
          },
          content: {
            type: Type.STRING,
            description:
              'Complete email body. Reference their actual answers. Confirm what happens next. Write as a senior account manager.',
          },
        },
        required: ['type', 'subject', 'content'],
      },
    },
    {
      name: 'requestMeeting',
      description:
        'Call this ONLY when the intake answers reveal information that requires a conversation before the project can proceed — scope changes, technical ambiguities, contradictory requirements, or missing critical detail that cannot be resolved by email. Do NOT call this for routine projects where the answers are clear.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          reason: {
            type: Type.STRING,
            description: 'Exactly why a meeting is needed based on what the intake answers revealed',
          },
          suggestedTopics: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Specific agenda items for the meeting based on the intake answers',
          },
          draftEmail: {
            type: Type.STRING,
            description:
              'Pre-written email body for the PM to send to the client requesting the meeting. Reference the specific topics and why they matter.',
          },
        },
        required: ['reason', 'suggestedTopics', 'draftEmail'],
      },
    },
  ],
}

export const reactivationProjectTools: Tool = {
  functionDeclarations: [
    {
      name: 'flagProjectRisk',
      description:
        'Flag a NEW risk revealed by the intake answers that was not known at project start. Only call this for genuine risks — scope changes, technical constraints the client revealed, timeline concerns based on their answers. Do not duplicate risks already flagged.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          risk: {
            type: Type.STRING,
            description: 'Description of the risk revealed by the intake answers',
          },
          recommendation: {
            type: Type.STRING,
            description: 'What should be done to address this risk',
          },
          severity: {
            type: Type.STRING,
            enum: ['low', 'medium', 'high'],
          },
        },
        required: ['risk', 'recommendation', 'severity'],
      },
    },
  ],
}
