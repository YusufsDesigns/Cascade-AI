import { Client } from '@upstash/qstash'

let _client: Client | null = null

function getClient(): Client {
  if (!_client) {
    if (!process.env.QSTASH_TOKEN) throw new Error('QSTASH_TOKEN is not set')
    _client = new Client({ token: process.env.QSTASH_TOKEN })
  }
  return _client
}

export async function scheduleFollowUpMessage(
  projectId: string,
  delaySeconds: number,
): Promise<string | null> {
  if (!process.env.QSTASH_TOKEN) return null
  try {
    const msg = await getClient().publishJSON({
      url: `${process.env.APP_URL}/api/webhooks/followup`,
      body: { projectId },
      delay: delaySeconds,
    })
    return msg.messageId
  } catch {
    return null
  }
}

export async function cancelQStashMessage(messageId: string | null | undefined): Promise<void> {
  if (!messageId || !process.env.QSTASH_TOKEN) return
  try {
    await getClient().messages.cancel(messageId)
  } catch {
    // already sent or invalid — ignore
  }
}
