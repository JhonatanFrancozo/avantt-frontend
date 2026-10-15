import { BtnPrimary } from '../atoms'

interface Props {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export default function EmptyState({ title, description, actionLabel, onAction }: Props) {
  return (
    <div className="col-span-full rounded-xl border border-dashed border-border bg-surface px-6 py-14 text-center">
      <div className="font-semibold text-text-primary">{title}</div>
      <p className="mx-auto mt-2 mb-5 max-w-md text-sm leading-6 text-text-muted">{description}</p>
      {actionLabel && onAction && <BtnPrimary onClick={onAction}>{actionLabel}</BtnPrimary>}
    </div>
  )
}
