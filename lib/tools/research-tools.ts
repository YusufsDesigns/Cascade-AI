import { Type } from '@google/genai'
import type { Tool } from '@google/genai'

export const researchTools: Tool = {
  functionDeclarations: [
    {
      name: 'saveContractSummary',
      description:
        'Call this after reading the contract PDF to save the extracted key clauses. Extract deliverables, payment terms, revision rounds, timelines, and any clauses that differ from what the brief states. Flag every discrepancy you find — these are risks.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          deliverables: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Exact deliverables listed in the contract',
          },
          paymentTerms: {
            type: Type.STRING,
            description: 'Payment schedule and amounts as stated in the contract',
          },
          revisionRounds: {
            type: Type.NUMBER,
            description: 'Number of revision rounds specified in the contract',
          },
          timeline: {
            type: Type.STRING,
            description: 'Project timeline as specified in the contract',
          },
          discrepancies: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Specific differences between the contract and the deal brief. Every discrepancy must be listed.',
          },
          keyRisks: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Risk clauses, liability limitations, or unusual terms found in the contract',
          },
          summary: {
            type: Type.STRING,
            description: 'A concise 2-3 sentence summary of the contract commitment',
          },
        },
        required: ['deliverables', 'paymentTerms', 'revisionRounds', 'timeline', 'discrepancies', 'keyRisks', 'summary'],
      },
    },
    {
      name: 'readClientWebsite',
      description:
        'Call this to retrieve and analyze the client\'s website. Pass the website URL and this tool will fetch live content from that URL. Use the results to understand the client\'s industry, products, tone of voice, and technical sophistication.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          url: {
            type: Type.STRING,
            description: 'The full URL of the client website to read (e.g. https://acmecorp.com)',
          },
        },
        required: ['url'],
      },
    },
    {
      name: 'searchClientBackground',
      description:
        'Call this to search for recent news and background information about the client company. Use results to identify funding stage, recent announcements, competitive context, and any public concerns about the company.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          query: {
            type: Type.STRING,
            description: 'Search query — use the company name plus relevant terms like "funding", "news", "product launch"',
          },
        },
        required: ['query'],
      },
    },
    {
      name: 'synthesizeIntelligence',
      description:
        'Call this LAST after all research is complete. Combine contract data, website intelligence, and background research into a final client intelligence profile. This is saved to the database and shared with the Communication and Project agents.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          industry: {
            type: Type.STRING,
            description: 'Client\'s primary industry and market position',
          },
          companyProfile: {
            type: Type.STRING,
            description: 'Brief company description — what they do, their stage, their customers',
          },
          toneOfVoice: {
            type: Type.STRING,
            description: 'Communication style inferred from their website — formal/informal, technical/plain, etc.',
          },
          techStack: {
            type: Type.STRING,
            description: 'Technical stack or preferences identified from website or job listings, if any',
          },
          contractDiscrepancies: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'All discrepancies between the contract and the brief, verbatim from the contract analysis',
          },
          redFlags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Any concerns about the client — payment risk, unclear scope, reputational issues, etc.',
          },
          keyInsights: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'The most important 3-5 intelligence points the account team must know before kickoff',
          },
          fullProfile: {
            type: Type.STRING,
            description: 'Complete intelligence profile as a rich paragraph that the Communication Agent will use to personalize emails',
          },
        },
        required: ['industry', 'companyProfile', 'toneOfVoice', 'contractDiscrepancies', 'redFlags', 'keyInsights', 'fullProfile'],
      },
    },
  ],
}
