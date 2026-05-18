import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'
import { EmailCard } from '@/components/emails/EmailCard'
import { MilestoneList } from '@/components/milestones/MilestoneList'
import { ActionItemsSection, type ActionItem } from '@/components/projects/ActionItemsSection'
import { ResearchSection } from '@/components/projects/ResearchSection'
import { RiskCard } from '@/components/projects/RiskCard'
import { ProjectSidebar } from '@/components/projects/ProjectSidebar'
import { RerunButton } from '@/components/projects/RerunButton'
import { MeetingRequestCard } from '@/components/projects/MeetingRequestCard'
import { MeetingOutcomeCard } from '@/components/projects/MeetingOutcomeCard'
import { RunHistory } from '@/components/agent-feed/RunHistory'
import {
  ArrowLeft, Calendar, ExternalLink, CheckCircle2,
  Clock, Mail, Flag, ClipboardList,
} from 'lucide-react'
import { cn } from '@/lib/utils'

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDateTime(d: Date | string) {
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

type ProjectWithRelations = Awaited<ReturnType<typeof fetchProject>>

async function fetchProject(id: string, userId: string) {
  return prisma.project.findFirst({
    where: { id, userId },
    include: {
      emails:          { orderBy: { createdAt: 'asc' } },
      milestones:      { orderBy: [{ phase: 'asc' }, { createdAt: 'asc' }] },
      risks:           { orderBy: [{ severity: 'asc' }, { createdAt: 'asc' }] },
      followUp:        true,
      intakeForm:      true,
      meetingRequests: { orderBy: { createdAt: 'desc' }, take: 1 },
      agentEvents:     { orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] },
      user:            { include: { teamMembers: true } },
    },
  })
}

const statusStages = ['INTAKE', 'ONBOARDING', 'ACTIVE', 'COMPLETED'] as const
const stageLabelMap: Record<string, string> = {
  INTAKE:     'Intake',
  ONBOARDING: 'Onboarding',
  ACTIVE:     'Active',
  COMPLETED:  'Completed',
}

function computeActionItems(project: NonNullable<ProjectWithRelations>): ActionItem[] {
  const items: ActionItem[] = []

  const typeLabels: Record<string, string> = {
    WELCOME: 'welcome email', QUESTIONNAIRE: 'intake questionnaire',
    KICKOFF: 'kickoff agenda', FOLLOWUP: 'follow-up email',
  }

  const unsent = project.emails.filter(e => e.status === 'DRAFT')
  if (unsent.length > 0) {
    items.push({
      id: 'unsent-emails',
      title: `${unsent.length} email${unsent.length === 1 ? '' : 's'} waiting to be sent`,
      description: unsent.map(e => typeLabels[e.type] ?? e.type).join(', ') + ' — review and send.',
      sectionId: 'section-comms',
      cta: 'Go to emails →',
    })
  }

  if (project.intakeForm && !project.intakeForm.submittedAt) {
    items.push({
      id: 'intake-pending',
      title: 'Client hasn\'t submitted the intake form',
      description: 'Share the intake link with your client to get the information needed.',
      sectionId: 'section-intake',
      cta: 'View intake →',
    })
  }

  const unassigned = project.milestones.filter(m => !m.ownerName)
  if (unassigned.length > 0) {
    items.push({
      id: 'unassigned-milestones',
      title: `${unassigned.length} milestone${unassigned.length === 1 ? '' : 's'} need${unassigned.length === 1 ? 's' : ''} assignment`,
      description: 'Assign a team member so each milestone has a clear owner.',
      sectionId: 'section-plan',
      cta: 'Assign owners →',
    })
  }

  const unreviewedHigh = project.risks.filter(r => r.severity === 'high' && !r.reviewed)
  if (unreviewedHigh.length > 0) {
    items.push({
      id: 'high-risks',
      title: `${unreviewedHigh.length} high-severity risk${unreviewedHigh.length === 1 ? '' : 's'} need${unreviewedHigh.length === 1 ? 's' : ''} review`,
      description: 'These were flagged by the Project Agent and require your attention.',
      sectionId: 'section-risks',
      cta: 'Review risks →',
    })
  }

  return items
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { id } = await params
  const project = await fetchProject(id, session.user.id)
  if (!project) notFound()

  const actionItems = computeActionItems(project)
  const sentCount = project.emails.filter(e => e.status === 'SENT').length
  const reviewedRisks = project.risks.filter(r => r.reviewed).length
  const stageIndex = statusStages.indexOf(project.status as typeof statusStages[number])
  const appUrl = process.env.APP_URL ?? 'http://localhost:3000'
  const intakeUrl = project.intakeForm
    ? `${appUrl}/intake/${project.id}/${project.intakeForm.token}`
    : null

  // Group agent events by runType for RunHistory component
  const runMap = new Map<string, typeof project.agentEvents>()
  for (const ev of project.agentEvents) {
    const rt = ev.runType ?? 'initial'
    if (!runMap.has(rt)) runMap.set(rt, [])
    runMap.get(rt)!.push(ev)
  }
  const RUN_ORDER = ['initial', 'reactivation', 'finalization', 'completion']
  const runs = Array.from(runMap.entries())
    .sort((a, b) => RUN_ORDER.indexOf(a[0]) - RUN_ORDER.indexOf(b[0]))
    .map(([runType, events]) => ({
      runType,
      events: events.map(e => ({
        id:        e.id,
        type:      e.type,
        agent:     e.agent,
        message:   e.message,
        eventData: e.eventData as Record<string, unknown> | null,
        createdAt: e.createdAt.toISOString(),
        runType:   e.runType,
      })),
      startedAt: events[0]?.createdAt.toISOString() ?? new Date().toISOString(),
    }))

  // Meeting outcome card: show when latest meeting request is SENT but notes not yet logged
  const latestMeeting = project.meetingRequests[0] as (typeof project.meetingRequests[0] & {
    meetingCompleted?: boolean
    meetingNotes?: string | null
  }) | undefined
  const showMeetingOutcome = latestMeeting?.status === 'SENT' && !latestMeeting?.meetingCompleted

  // Unique team members on the project (from milestone owners)
  const teamOnProject = Array.from(
    new Map(
      project.milestones
        .filter(m => m.ownerName)
        .map(m => [m.ownerName, { name: m.ownerName!, role: m.ownerRole }])
    ).values()
  )

  type IntakeQuestion = { id: string; question: string; required: boolean; type: string; options?: string[] }
  type IntakeAnswer = { questionId: string; answer: string }
  const intakeQuestions = project.intakeForm?.questions as IntakeQuestion[] | null ?? []
  const intakeAnswers = project.intakeForm?.answers as IntakeAnswer[] | null ?? []

  return (
    <div className="px-8 py-8 max-w-7xl mx-auto">

      {/* ── Back breadcrumb ── */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-700 transition-colors mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
      </Link>

      {/* ── Header card ── */}
      <div className="rounded-2xl border border-zinc-100 bg-white shadow-sm shadow-zinc-900/4 px-6 py-5 mb-6">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
            <span className="text-base font-bold text-indigo-600">
              {project.clientName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-semibold text-zinc-900 tracking-tight leading-tight mb-0.5">
                  {project.name}
                </h1>
                <p className="text-sm text-zinc-400">{project.clientName} · {project.clientEmail}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0 text-xs text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> {formatDate(project.createdAt)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> {sentCount}/{project.emails.length} sent
                </span>
              </div>
            </div>
            {project.brief && (
              <p className="text-xs text-zinc-500 leading-relaxed mt-2 line-clamp-2 max-w-2xl">
                {project.brief}
              </p>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-0">
          {statusStages.map((stage, i) => {
            const isCompleted = i < stageIndex
            const isCurrent   = i === stageIndex
            const isFirst = i === 0
            const isLast  = i === statusStages.length - 1
            return (
              <div
                key={stage}
                className={cn(
                  'flex-1 flex flex-col items-center',
                )}
              >
                <div className={cn(
                  'w-full h-1.5 transition-colors duration-500',
                  isFirst ? 'rounded-l-full' : '',
                  isLast  ? 'rounded-r-full' : '',
                  isCompleted || isCurrent ? 'bg-indigo-500' : 'bg-zinc-100',
                )} />
                <div className={cn(
                  'mt-1.5 text-[10px] font-medium transition-colors',
                  isCurrent   ? 'text-indigo-600' :
                  isCompleted ? 'text-zinc-400'   : 'text-zinc-300',
                )}>
                  {stageLabelMap[stage]}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Completion banner ── */}
      {project.status === 'COMPLETED' && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-emerald-900">Project complete</p>
              <p className="text-xs text-emerald-700 mt-0.5">
                All milestones delivered. Completion summary sent to {project.clientName}.
              </p>
            </div>
            <div className="text-xs text-emerald-600 font-mono shrink-0">
              {formatDate(project.updatedAt)}
            </div>
          </div>
        </div>
      )}

      {/* ── Meeting request (shown when pending review) ── */}
      {latestMeeting?.status === 'PENDING_REVIEW' && (
        <div className="mb-4">
          <MeetingRequestCard request={latestMeeting} />
        </div>
      )}

      {/* ── Meeting outcome card (shown when meeting was sent but notes not yet logged) ── */}
      {showMeetingOutcome && (
        <MeetingOutcomeCard
          projectId={project.id}
          meetingRequestId={latestMeeting.id}
        />
      )}

      {/* ── Agent run history (shown while running or when events exist) ── */}
      {runs.length > 0 && (
        <RunHistory
          projectId={project.id}
          runs={runs}
          agentStatus={project.agentStatus}
        />
      )}

      {/* ── Action items ── */}
      <ActionItemsSection items={actionItems} />

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-[1fr_248px] gap-6 items-start">

        {/* ── Main content ── */}
        <div className="min-w-0 space-y-6">

          {/* Research Agent findings */}
          <ResearchSection
            contractSummary={project.contractSummary}
            websiteInsights={project.websiteInsights}
            clientIntelligence={project.clientIntelligence}
          />

          {/* Communications */}
          <div id="section-comms">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-zinc-400" />
                <h2 className="text-sm font-semibold text-zinc-900">Communications</h2>
                <span className="text-xs text-zinc-400">{sentCount} of {project.emails.length} sent</span>
              </div>
              <RerunButton projectId={project.id} />
            </div>
            {project.emails.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-200 p-8 text-center">
                <p className="text-sm text-zinc-400">No emails generated yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {project.emails.map(email => (
                  <EmailCard key={email.id} email={email} />
                ))}
              </div>
            )}
          </div>

          {/* Project plan */}
          <div id="section-plan">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-zinc-400" />
                <h2 className="text-sm font-semibold text-zinc-900">Project Plan</h2>
              </div>
              <span className="text-xs text-zinc-400">{project.milestones.length} milestones</span>
            </div>
            <MilestoneList
              milestones={project.milestones}
              teamMembers={project.user.teamMembers}
            />
          </div>

          {/* Risks */}
          {project.risks.length > 0 && (
            <div id="section-risks">
              <div className="flex items-center gap-2 mb-3">
                <Flag className="w-4 h-4 text-zinc-400" />
                <h2 className="text-sm font-semibold text-zinc-900">Risk Flags</h2>
                <span className="text-xs text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full tabular-nums">
                  {reviewedRisks}/{project.risks.length} reviewed
                </span>
              </div>
              <div className="space-y-2">
                {project.risks.map((risk, i) => (
                  <RiskCard key={risk.id} risk={risk} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* Client intake */}
          <div id="section-intake">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-zinc-400" />
                <h2 className="text-sm font-semibold text-zinc-900">Client Intake</h2>
              </div>
              {project.intakeForm?.submittedAt && (
                <span className="flex items-center gap-1.5 text-xs text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Submitted {formatDate(project.intakeForm.submittedAt)}
                </span>
              )}
            </div>

            {!project.intakeForm ? (
              <div className="rounded-2xl border border-dashed border-zinc-200 p-8 text-center">
                <p className="text-sm text-zinc-400">No intake form generated yet.</p>
              </div>
            ) : project.intakeForm.submittedAt && intakeAnswers.length > 0 ? (
              // Q&A display
              <div className="rounded-2xl border border-zinc-100 bg-white shadow-sm shadow-zinc-900/4 divide-y divide-zinc-50">
                {intakeQuestions.map((q, i) => {
                  const answer = intakeAnswers.find(a => a.questionId === q.id)
                  return (
                    <div key={q.id} className="px-5 py-4">
                      <p className="text-xs font-medium text-zinc-500 mb-1">
                        {i + 1}. {q.question}
                      </p>
                      <p className="text-sm text-zinc-800 leading-relaxed">
                        {answer?.answer ?? <span className="text-zinc-300 italic">No answer</span>}
                      </p>
                    </div>
                  )
                })}
              </div>
            ) : (
              // Pending — show link
              <div className={cn(
                'rounded-2xl border px-5 py-4 flex items-center justify-between gap-4',
                'border-amber-100 bg-amber-50/40',
              )}>
                <div>
                  <p className="text-xs font-semibold text-zinc-900 mb-0.5">Awaiting client response</p>
                  <p className="text-[11px] text-zinc-400">
                    {intakeQuestions.length} question{intakeQuestions.length !== 1 ? 's' : ''} generated ·
                    Share the link below with your client
                  </p>
                </div>
                {intakeUrl && (
                  <a
                    href={intakeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'flex items-center gap-1.5 h-7 px-3 rounded-lg text-[11px] font-medium shrink-0',
                      'bg-white border border-zinc-200 text-zinc-600',
                      'hover:bg-zinc-50 hover:border-zinc-300 transition-all duration-150',
                    )}
                  >
                    <ExternalLink className="w-3 h-3" /> Open form
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Follow-up */}
          {project.followUp && (
            <div className={cn(
              'rounded-2xl border px-5 py-4 flex items-center gap-3',
              project.followUp.status === 'SCHEDULED' ? 'border-amber-100 bg-amber-50/40' :
              project.followUp.status === 'SENT'      ? 'border-emerald-100 bg-emerald-50/40' :
                                                        'border-zinc-100 bg-zinc-50',
            )}>
              <Clock className={cn(
                'w-4 h-4 shrink-0',
                project.followUp.status === 'SCHEDULED' ? 'text-amber-500' :
                project.followUp.status === 'SENT'      ? 'text-emerald-500' : 'text-zinc-400',
              )} />
              <div>
                <p className="text-xs font-semibold text-zinc-900 mb-0.5">
                  {project.followUp.status === 'SENT'      ? 'Follow-up sent' :
                   project.followUp.status === 'CANCELLED' ? 'Follow-up cancelled' :
                                                             'Follow-up scheduled'}
                </p>
                <p className="text-[11px] text-zinc-400">
                  {project.followUp.status === 'SCHEDULED'
                    ? `Auto-sends ${formatDateTime(project.followUp.scheduledAt)}`
                    : project.followUp.status === 'SENT'
                    ? `Sent ${formatDate(project.followUp.scheduledAt)}`
                    : 'Cancelled — intake was submitted'}
                </p>
              </div>
            </div>
          )}

        </div>

        {/* ── Sticky sidebar ── */}
        <div className="sticky top-8">
          <ProjectSidebar
            status={project.status}
            emailsSent={sentCount}
            emailsTotal={project.emails.length}
            milestonesTotal={project.milestones.length}
            risksTotal={project.risks.length}
            risksReviewed={reviewedRisks}
            team={teamOnProject}
            intakeSubmitted={!!project.intakeForm?.submittedAt}
            nav={[
              ...(project.contractSummary || project.websiteInsights || project.clientIntelligence
                ? [{ id: 'section-research', label: 'Research findings' }]
                : []),
              { id: 'section-comms',  label: 'Communications' },
              { id: 'section-plan',   label: 'Project plan' },
              ...(project.risks.length > 0 ? [{ id: 'section-risks', label: 'Risk flags' }] : []),
              { id: 'section-intake', label: 'Client intake' },
            ]}
          />
        </div>

      </div>
    </div>
  )
}
