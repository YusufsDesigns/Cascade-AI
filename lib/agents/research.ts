import { GoogleGenAI, type Content, type FunctionCall, type Part } from '@google/genai'
import { prisma } from '@/lib/db/prisma'
import { researchTools } from '@/lib/tools/research-tools'
import type { AgentEvent } from '@/lib/tools/deal-tools'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })
const MAX_STEPS = 12

const RESEARCH_SYSTEM_PROMPT = `
You are the Research Agent for Cascade, a B2B client onboarding platform.
You run BEFORE any other agent. Your job is to build a complete intelligence picture of this client.

You have four tools: saveContractSummary, readClientWebsite, searchClientBackground, synthesizeIntelligence.

YOUR PROCESS — follow in strict order:

Step 1: If a contract PDF has been provided (you will see it as document content in the initial message):
  Call saveContractSummary with everything you extract from the document.
  READ THE ENTIRE CONTRACT carefully. Extract:
  - Every specific deliverable listed
  - Payment terms and amounts
  - Number of revision rounds
  - Project timeline
  - EVERY discrepancy between the contract and the deal brief (these are critical)
  - Any unusual liability, IP, or termination clauses

  If no PDF was provided, skip to Step 2.

Step 2: If a client website URL was provided in the brief:
  Call readClientWebsite with that URL.
  The result will tell you the client's industry, products, tone, and technical signals.
  If no website URL was provided, proceed with what you have.

Step 3: Call searchClientBackground to find recent news about the company.
  Always do this — background context helps the team.
  Use the company name from the brief as your search query.
  Even if no results are found, proceed.

Step 4: Call synthesizeIntelligence to combine ALL findings into a final profile.
  This is the most important step. The profile you create will be used by the
  Communication Agent to write personalized emails and by the Project Agent to
  identify risks before they happen.

  Write the fullProfile as if briefing a senior account manager who has never
  met this client. Include everything that matters. Be specific.

CRITICAL RULES:
- Every discrepancy between contract and brief MUST be flagged. These protect the company legally.
- Do not invent information you cannot verify from the sources given.
- The fullProfile paragraph should be 150-250 words — detailed enough to be useful, short enough to be read.
- redFlags must be specific: not "payment risk" but "Contract specifies net-60 payment but brief implies immediate payment".
- If the brief mentions a website but readClientWebsite returns little content, note this in the profile.
`

export interface ResearchResult {
  clientIntelligence: string
  contractSummary: string | null
  websiteInsights: string | null
  discrepancies: string[]
}

export async function runResearchAgent(
  projectId: string,
  brief: string,
  pdfBase64: string | null,
  websiteUrl: string | null,
  emit: (event: AgentEvent) => void,
): Promise<ResearchResult> {
  emit({ type: 'agent', agent: 'orchestrator', message: '' })
  emit({ type: 'step', agent: 'orchestrator', message: '→ Research Agent reading brief...' })

  let contractSummary: string | null = null
  let websiteInsights: string | null = null
  let clientIntelligence = ''
  let discrepancies: string[] = []

  async function executeTool(
    toolName: string,
    args: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    switch (toolName) {

      case 'saveContractSummary': {
        const summary = {
          deliverables:     args.deliverables     as string[],
          paymentTerms:     args.paymentTerms     as string,
          revisionRounds:   args.revisionRounds   as number,
          timeline:         args.timeline         as string,
          discrepancies:    args.discrepancies    as string[],
          keyRisks:         args.keyRisks         as string[],
          summary:          args.summary          as string,
        }
        discrepancies = summary.discrepancies
        contractSummary = JSON.stringify(summary, null, 2)

        await prisma.project.update({
          where: { id: projectId },
          data:  { contractSummary },
        })

        const discrepancyNote = summary.discrepancies.length > 0
          ? ` ⚠ ${summary.discrepancies.length} discrepanc${summary.discrepancies.length === 1 ? 'y' : 'ies'} found`
          : ' · No discrepancies'

        emit({
          type: 'success',
          agent: 'orchestrator',
          message: `✓ Contract read: ${summary.deliverables.length} deliverables, ${summary.revisionRounds} revision rounds${discrepancyNote}`,
        })

        return {
          success: true,
          summary: summary.summary,
          discrepanciesCount: summary.discrepancies.length,
          instruction: 'Contract summary saved. Now call readClientWebsite if a URL is available in the brief, or searchClientBackground.',
        }
      }

      case 'readClientWebsite': {
        const url = args.url as string
        emit({ type: 'step', agent: 'orchestrator', message: `→ Reading ${url}...` })

        try {
          // Secondary Gemini call with URL context tool enabled
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{
              role: 'user',
              parts: [{
                text: `Read this website and extract: (1) what the company does, (2) their target customers, (3) their tone of voice, (4) any technology signals (tech stack, integrations, API mentions), (5) company size signals. URL: ${url}`,
              }],
            }],
            config: {
              tools: [{ urlContext: {} }],
              systemInstruction: 'You are a research analyst. Extract structured intelligence from the website. Be specific and factual.',
            },
          })

          websiteInsights = response.text ?? ''

          await prisma.project.update({
            where: { id: projectId },
            data:  { websiteInsights },
          })

          emit({
            type: 'success',
            agent: 'orchestrator',
            message: `✓ Website intelligence extracted from ${url}`,
          })

          return {
            success: true,
            insights: websiteInsights,
            instruction: 'Website read successfully. Now call searchClientBackground to find recent news.',
          }
        } catch {
          emit({ type: 'step', agent: 'orchestrator', message: `→ Could not read website (${url}) — continuing` })
          return {
            success: false,
            error: 'Could not access website',
            instruction: 'Website could not be read. Continue with searchClientBackground.',
          }
        }
      }

      case 'searchClientBackground': {
        const query = args.query as string
        emit({ type: 'step', agent: 'orchestrator', message: `→ Searching: "${query}"...` })

        try {
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{
              role: 'user',
              parts: [{
                text: `Search for recent information about "${query}". Report: funding stage, recent product news, any red flags or concerns, competitive context. Be factual and cite what you find.`,
              }],
            }],
            config: {
              tools: [{ googleSearch: {} }],
              systemInstruction: 'You are a research analyst. Find accurate, recent information about this company. Report only what you can verify from search results.',
            },
          })

          const searchResults = response.text ?? 'No public information found.'

          emit({
            type: 'success',
            agent: 'orchestrator',
            message: `✓ Background research complete`,
          })

          return {
            success: true,
            searchResults,
            instruction: 'Background research complete. Now call synthesizeIntelligence to combine all findings.',
          }
        } catch {
          return {
            success: false,
            searchResults: 'Search unavailable.',
            instruction: 'Search failed. Proceed with synthesizeIntelligence using the information you have.',
          }
        }
      }

      case 'synthesizeIntelligence': {
        const profile = {
          industry:               args.industry               as string,
          companyProfile:         args.companyProfile         as string,
          toneOfVoice:            args.toneOfVoice            as string,
          techStack:              args.techStack              as string | undefined,
          contractDiscrepancies:  args.contractDiscrepancies  as string[],
          redFlags:               args.redFlags               as string[],
          keyInsights:            args.keyInsights            as string[],
          fullProfile:            args.fullProfile            as string,
        }

        clientIntelligence = profile.fullProfile
        discrepancies = profile.contractDiscrepancies.length > 0
          ? profile.contractDiscrepancies
          : discrepancies

        await prisma.project.update({
          where: { id: projectId },
          data:  { clientIntelligence: JSON.stringify(profile, null, 2) },
        })

        if (profile.redFlags.length > 0) {
          for (const flag of profile.redFlags) {
            emit({ type: 'warning', agent: 'orchestrator', message: `⚠ ${flag}` })
          }
        }

        emit({
          type: 'success',
          agent: 'orchestrator',
          message: `✓ Intelligence profile built · ${profile.keyInsights.length} key insights · ${profile.redFlags.length} red flags`,
        })

        return {
          success: true,
          profile,
          instruction: 'Intelligence synthesis complete. Research Agent work is done.',
        }
      }

      default:
        return { error: `Unknown tool: ${toolName}` }
    }
  }

  // Build initial message — include PDF as inlineData if provided
  const parts: Part[] = []

  if (pdfBase64) {
    parts.push({
      inlineData: {
        data: pdfBase64,
        mimeType: 'application/pdf',
      },
    })
  }

  parts.push({
    text: `Research this client. Here is the deal brief:\n\n${brief}${websiteUrl ? `\n\nClient website: ${websiteUrl}` : ''}${pdfBase64 ? '\n\nA contract PDF has been included above. Read it carefully.' : ''}`,
  })

  const messages: Content[] = [{ role: 'user', parts }]

  let steps = 0
  let response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: messages,
    config: { tools: [researchTools], systemInstruction: RESEARCH_SYSTEM_PROMPT },
  })

  while (response.functionCalls?.length && steps < MAX_STEPS) {
    steps++
    const call = response.functionCalls[0] as FunctionCall
    const toolName = call.name!
    const toolArgs = (call.args ?? {}) as Record<string, unknown>

    const result = await executeTool(toolName, toolArgs)

    messages.push(
      { role: 'model', parts: [{ functionCall: call }] },
      { role: 'user',  parts: [{ functionResponse: { name: toolName, response: result } }] },
    )

    response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: messages,
      config: { tools: [researchTools], systemInstruction: RESEARCH_SYSTEM_PROMPT },
    })
  }

  return { clientIntelligence, contractSummary, websiteInsights, discrepancies }
}
