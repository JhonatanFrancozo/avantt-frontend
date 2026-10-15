interface BrandProps {
  compact?: boolean
  inverse?: boolean
}

export default function Brand({ compact, inverse }: BrandProps) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid size-9 place-items-center rounded-xl bg-blue text-sm font-extrabold text-white shadow-lg shadow-blue/20">
        A
      </div>
      {!compact && (
        <div className={`text-base font-extrabold tracking-widest ${inverse ? 'text-white' : 'text-text-primary'}`}>
          AVANTT
        </div>
      )}
    </div>
  )
}
