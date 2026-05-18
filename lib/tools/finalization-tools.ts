import { Type } from '@google/genai'
import type { Tool } from '@google/genai'

export const finalizationCommsTools: Tool = {
  functionDeclarations: [
    {
      name: 'saveEmail',
      description: 'Save a post-meeting finalization summary email as a DRAFT for PM review. The PM will review and send it.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          subject: { type: Type.STRING, description: 'Email subject line' },
          content: { type: Type.STRING, description: 'Full email body. Professional, warm, specific to this project.' },
        },
        required: ['subject', 'content'],
      },
    },
  ],
}

export const finalizationProjectTools: Tool = {
  functionDeclarations: [
    {
      name: 'updateMilestone',
      description: 'Update an existing milestone with revised details based on what was clarified in the meeting. Only call this for milestones that actually need changes.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          milestoneId:    { type: Type.STRING,  description: 'The id of the milestone to update' },
          title:          { type: Type.STRING,  description: 'New title, if changed' },
          description:    { type: Type.STRING,  description: 'New description, if changed' },
          ownerRole:      { type: Type.STRING,  description: 'New owner role, if changed' },
          requiresClient: { type: Type.BOOLEAN, description: 'Updated requiresClient flag' },
          riskNote:       { type: Type.STRING,  description: 'Updated or new risk note' },
        },
        required: ['milestoneId'],
      },
    },
    {
      name: 'flagRisk',
      description: 'Flag a new project risk revealed by the meeting outcome. Only flag risks not already known.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          risk:     { type: Type.STRING, description: 'Description of the risk' },
          severity: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
        },
        required: ['risk', 'severity'],
      },
    },
    {
      name: 'finalizeProjectPlan',
      description: 'Call this as the last step to signal that milestone review is complete.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING, description: 'Brief summary of what was updated' },
        },
        required: ['summary'],
      },
    },
  ],
}
