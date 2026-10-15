import { BtnPrimary } from '../atoms'

interface Props {
  loading?: boolean
  error?: string | null
  onRetry?: () => void
}

export default function DataState({ loading, error, onRetry }: Props) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-6">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-8 text-center shadow-sm">
        {loading ? (
          <>
            <div className="mx-auto mb-4 size-9 animate-spin rounded-full border-2 border-blue-light border-t-blue" />
            <div className="font-semibold text-text-primary">Carregando seu espaço de trabalho</div>
            <p className="mt-2 text-sm text-text-muted">Buscando projetos, tarefas, sprints e equipe.</p>
          </>
        ) : (
          <>
            <div className="mx-auto mb-4 grid size-10 place-items-center rounded-full bg-red-light text-red">
              <span className="text-lg font-bold">!</span>
            </div>
            <div className="font-semibold text-text-primary">Não foi possível carregar os dados</div>
            <p className="mt-2 mb-5 text-sm leading-6 text-text-muted">{error}</p>
            {onRetry && <BtnPrimary onClick={onRetry}>Tentar novamente</BtnPrimary>}
          </>
        )}
      </div>
    </div>
  )
}
