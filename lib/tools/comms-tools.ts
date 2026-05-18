import { Type } from '@google/genai'
import type { Tool } from '@google/genai'

export const commsTools: Tool = {
  functionDeclarations: [
    {
      name: 'saveEmail',
      description:
        'Save a complete drafted email to the database. YOU write the full personalized content as arguments — Gemini provides the subject and body, not placeholder text. Every email must reference the client\'s actual name and specific deliverables. No placeholders like [Name] or [Company] allowed.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          type: {
            type: Type.STRING,
            enum: ['WELCOME', 'QUESTIONNAIRE', 'FOLLOWUP'],
            description: 'Email type — WELCOME for the initial greeting, QUESTIONNAIRE for the intake form email, FOLLOWUP for the scheduled reminder',
          },
          subject: {
            type: Type.STRING,
            description: 'Specific, personalized subject line — reference the project or client name',
          },
          content: {
            type: Type.STRING,
            description:
              'Complete email body. Professional, warm, specific to this client and their deliverables. Must use the client\'s real name and reference actual deliverables. Write it as a senior account manager would — not as AI boilerplate.',
          },
        },
        required: ['type', 'subject', 'content'],
      },
    },
    {
      name: 'saveIntakeQuestion',
      description:
        'Save one intake questionnaire question. Call this once per question — you will call it multiple times for 5-8 questions total. Questions MUST be tailored to this client\'s specific deliverables and situation. A generic question like "What are your goals?" is not acceptable.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          question: {
            type: Type.STRING,
            description: 'The specific question to ask the client, directly relevant to their deliverables',
          },
          type: {
            type: Type.STRING,
            enum: ['text', 'textarea', 'select', 'checkbox'],
            description: 'Input type for the answer',
          },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Answer choices — only for select or checkbox types',
          },
          required: {
            type: Type.BOOLEAN,
            description: 'Whether this question must be answered before the project can proceed',
          },
        },
        required: ['question', 'type', 'required'],
      },
    },
    {
      name: 'requestMoreContext',
      description:
        'Call this when you need additional information to write high-quality, personalized communications. Do not produce a weaker email when you could ask for details instead. The account manager will answer and you will receive their response.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          reason: {
            type: Type.STRING,
            description: 'Specifically what you need and why it matters for communication quality',
          },
          questions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Precise questions — the more specific, the more useful the answers',
          },
        },
        required: ['reason', 'questions'],
      },
    },
    {
      name: 'scheduleFollowUp',
      description:
        'Schedule the automatic follow-up email to fire if the client has not submitted the intake form. Call this after all emails and questions are saved. Standard delay is 48 hours.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          delayHours: {
            type: Type.NUMBER,
            description: 'Hours until follow-up fires. Use 48 unless there is a specific reason to change.',
          },
          note: {
            type: Type.STRING,
            description: 'Brief reasoning for the delay chosen',
          },
        },
        required: ['delayHours'],
      },
    },
  ],
}
