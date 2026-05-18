import { Type } from '@google/genai'
import type { Tool } from '@google/genai'

export const projectTools: Tool = {
  functionDeclarations: [
    {
      name: 'saveMilestone',
      description:
        'Save one project milestone. Call this once per milestone — you will call it multiple times to build the full plan. YOU decide the content, phasing, owner, and timeline based on the deliverables and total project duration. Title must be specific and actionable — not "Phase 2" but what actually gets delivered, e.g. "Discovery & Requirements Sign-off".',
      parameters: {
        type: Type.OBJECT,
        properties: {
          title: {
            type: Type.STRING,
            description: 'Specific, actionable milestone title describing what gets delivered — never just "Phase N"',
          },
          description: {
            type: Type.STRING,
            description: 'What work happens in this milestone and what the concrete output or deliverable is',
          },
          phase: {
            type: Type.NUMBER,
            description: 'Phase number, starting from 1',
          },
          ownerRole: {
            type: Type.STRING,
            enum: ['designer', 'developer', 'pm', 'qa'],
            description:
              'Team role responsible: pm (planning/communication), designer (UI/UX/mockups), developer (code/build), qa (testing/review)',
          },
          dueWeek: {
            type: Type.NUMBER,
            description: 'Which week this milestone is due, counting from project start at week 1. Must fit within the total timeline.',
          },
          requiresClient: {
            type: Type.BOOLEAN,
            description:
              'True if the team cannot proceed without client input, approval, assets, or credentials. Be precise — identify every client dependency.',
          },
          riskNote: {
            type: Type.STRING,
            description:
              'Any dependency, blocker, or risk you observed for this milestone. Leave empty string if none.',
          },
        },
        required: ['title', 'description', 'phase', 'ownerRole', 'dueWeek', 'requiresClient'],
      },
    },
    {
      name: 'requestMoreContext',
      description:
        'Call this when deliverables are too vague or ambiguous to create an accurate project plan. Do NOT create vague milestones for vague deliverables — ask for specifics instead. The account manager will answer.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          reason: {
            type: Type.STRING,
            description: 'What specifically is unclear and why it blocks you from creating an accurate plan',
          },
          questions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Targeted questions that would let you create a proper milestone plan',
          },
        },
        required: ['reason', 'questions'],
      },
    },
    {
      name: 'flagProjectRisk',
      description:
        'Call this for project-level risks that are not specific to a single milestone: timeline too tight for the scope, potential scope creep, missing critical information that will block the project later, or technical complexity not reflected in the quoted timeline.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          risk: {
            type: Type.STRING,
            description: 'Clear, specific description of the risk',
          },
          recommendation: {
            type: Type.STRING,
            description: 'Concrete recommendation to address or mitigate this risk',
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
