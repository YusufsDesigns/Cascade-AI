import { sendEmail } from './resend'

interface MilestoneNotificationParams {
  to: string
  memberName: string
  milestoneName: string
  projectName: string
  clientName: string
  ownerRole: string
  dueDate: Date | string | null
}

export async function sendMilestoneAssignmentEmail(params: MilestoneNotificationParams) {
  const { to, memberName, milestoneName, projectName, clientName, ownerRole, dueDate } = params

  const dueLine = dueDate
    ? `<p style="margin:0 0 8px;">Due: <strong>${new Date(dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong></p>`
    : ''

  const roleLabel: Record<string, string> = {
    pm: 'Project Manager', designer: 'Designer', developer: 'Developer', qa: 'QA',
  }

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f4f4f5;margin:0;padding:24px;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e4e4e7;">
    <div style="background:#4f46e5;padding:24px 28px;">
      <p style="color:#c7d2fe;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 6px;">Cascade — Milestone Assignment</p>
      <h1 style="color:#fff;font-size:20px;font-weight:600;margin:0;line-height:1.3;">${milestoneName}</h1>
    </div>
    <div style="padding:24px 28px;">
      <p style="color:#3f3f46;font-size:15px;margin:0 0 16px;">Hi ${memberName},</p>
      <p style="color:#52525b;font-size:14px;line-height:1.6;margin:0 0 20px;">
        You've been assigned as <strong>${roleLabel[ownerRole] ?? ownerRole}</strong> on the following milestone for <strong>${clientName}</strong>.
      </p>
      <div style="background:#f8f8f9;border-radius:10px;border:1px solid #e4e4e7;padding:16px 18px;margin-bottom:20px;">
        <p style="color:#71717a;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;margin:0 0 8px;">Milestone</p>
        <p style="color:#18181b;font-size:15px;font-weight:600;margin:0 0 4px;">${milestoneName}</p>
        <p style="color:#71717a;font-size:13px;margin:0 0 8px;">Project: ${projectName}</p>
        ${dueLine}
      </div>
      <p style="color:#71717a;font-size:12px;margin:0;">
        Log in to Cascade to view the full milestone details and project plan.
      </p>
    </div>
  </div>
</body>
</html>`

  await sendEmail({
    to,
    subject: `You've been assigned: ${milestoneName} — ${projectName}`,
    html,
  })
}
