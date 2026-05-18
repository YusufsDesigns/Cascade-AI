import { MilestoneCard, type MilestoneData, type TeamMember } from './MilestoneCard'
import { cn } from '@/lib/utils'

const phaseNames: Record<number, string> = {
  1: 'Discovery & Requirements',
  2: 'Design',
  3: 'Development',
  4: 'Integration & Testing',
  5: 'Launch',
}

const phaseBarColors = [
  'bg-indigo-500', 'bg-blue-500', 'bg-violet-500',
  'bg-emerald-500', 'bg-amber-500', 'bg-pink-500',
]

export function MilestoneList({
  milestones,
  teamMembers,
}: {
  milestones: MilestoneData[]
  teamMembers: TeamMember[]
}) {
  if (milestones.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-200 p-8 text-center">
        <p className="text-sm text-zinc-400">No milestones yet.</p>
      </div>
    )
  }

  const phases = new Map<number, MilestoneData[]>()
  for (const m of milestones) {
    if (!phases.has(m.phase)) phases.set(m.phase, [])
    phases.get(m.phase)!.push(m)
  }

  let globalIndex = 0

  return (
    <div className="space-y-5">
      {Array.from(phases.entries()).map(([phase, items]) => {
        const barColor = phaseBarColors[(phase - 1) % phaseBarColors.length]
        const phaseLabel = phaseNames[phase] ?? `Phase ${phase}`
        return (
          <div key={phase}>
            <div className="flex items-center gap-2.5 mb-2">
              <div className={cn('w-1 h-4 rounded-full shrink-0', barColor)} />
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                Phase {phase} — {phaseLabel}
              </p>
              <span className="text-[10px] text-zinc-300 font-medium">{items.length}</span>
            </div>
            <div className="space-y-2">
              {items.map(m => {
                const idx = globalIndex++
                return (
                  <MilestoneCard
                    key={m.id}
                    milestone={m}
                    teamMembers={teamMembers}
                    index={idx}
                  />
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
