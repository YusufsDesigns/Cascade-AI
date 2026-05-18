import { Type } from '@google/genai'
import type { Tool } from '@google/genai'

// Shared event type — logged to DB and polled by frontend
export type AgentEvent = {
  type:
    | 'start'    | 'agent'    | 'thinking'  | 'reading_doc'  | 'reading_web'
    | 'searching'| 'intelligence' | 'discrepancy' | 'step'    | 'generating'
    | 'email_sent'| 'question_saved' | 'milestone_saved' | 'risk'
    | 'clarification' | 'clarification_answered' | 'delegate' | 'parallel_start'
    | 'success'  | 'done'     | 'error'     | 'warning'
    | 'meeting_requested'
  agent?: 'orchestrator' | 'comms' | 'project' | 'system' | 'research' | 'reactivation'
  message: string
  questions?: string[]
  clarificationId?: string
  projectId?: string
  data?: Record<string, unknown>
}

export const orchestratorTools: Tool = {
  functionDeclarations: [
    {
      name: 'extractDealInfo',
      description:
        'CALL THIS FIRST. Extract all structured information from the deal brief: client company name, primary contact email, contact person name, list of deliverables, total timeline in weeks, and budget if mentioned. Set isComplete to true only when clientName, clientEmail, deliverables, and timelineWeeks are all clearly present.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          clientName:    { type: Type.STRING,  description: 'Full name of the client company or individual' },
          clientEmail:   { type: Type.STRING,  description: 'Email address of the primary contact' },
          contactName:   { type: Type.STRING,  description: 'Name of the contact person at the client' },
          deliverables:  { type: Type.ARRAY,   items: { type: Type.STRING }, description: 'Specific deliverables promised in the deal' },
          timelineWeeks: { type: Type.NUMBER,  description: 'Total project duration in weeks' },
          budget:        { type: Type.STRING,  description: 'Budget amount if mentioned, otherwise empty string' },
          isComplete:    { type: Type.BOOLEAN, description: 'True only if clientName, clientEmail, deliverables, AND timelineWeeks are all present and clear' },
          missingFields: { type: Type.ARRAY,   items: { type: Type.STRING }, description: 'Names of fields that are missing or unclear' },
        },
        required: ['clientName', 'clientEmail', 'deliverables', 'timelineWeeks', 'isComplete', 'missingFields'],
      },
    },
    {
      name: 'requestClarification',
      description:
        'Call this when critical information is missing or ambiguous in ways that would block the sub-agents. Ask specific, intelligent questions — not generic ones. Do NOT ask for things you can reasonably infer from context.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          reason:    { type: Type.STRING, description: 'Exactly why you need this and how missing it affects downstream work' },
          questions: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Specific questions for the account manager' },
        },
        required: ['reason', 'questions'],
      },
    },
    {
      name: 'assessComplexity',
      description:
        'Call after extractDealInfo when all info is present. Classify the project as standard or high complexity based on deliverable count, timeline pressure, and technical scope.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          complexity: { type: Type.STRING, enum: ['standard', 'high'] },
          reasoning:  { type: Type.STRING, description: 'Why this complexity level was assigned' },
        },
        required: ['complexity', 'reasoning'],
      },
    },
    {
      name: 'delegateToAgents',
      description:
        'Call as the FINAL step once extraction and complexity assessment are done. Triggers the Communication Agent and Project Agent to run in parallel. Include notes about anything the sub-agents should watch for.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          proceed:    { type: Type.BOOLEAN },
          complexity: { type: Type.STRING, enum: ['standard', 'high'] },
          notes:      { type: Type.STRING, description: 'Notes for sub-agents about risks, timeline concerns, ambiguities, or things to pay attention to' },
        },
        required: ['proceed'],
      },
    },
  ],
}
