import { BtnPrimary } from '../components/atoms'
import Brand from '../components/Brand'
import ProductIcon from '../components/ProductIcon'
import type { IconName } from '../components/ProductIcon'
import { siteCopy as copy } from '../content'

interface Props {
  dark: boolean
  onToggleTheme: () => void
  onLogin: () => void
  onSignup: () => void
  onDemo: () => void
}

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

function DashboardPreview() {
  const stats = [
    [copy.preview.done, '34', 'bg-green'],
    [copy.preview.progress, '12', 'bg-blue'],
    [copy.preview.blocked, '3', 'bg-red'],
    [copy.preview.late, '5', 'bg-amber'],
  ]

  return (
    <div className="relative mx-auto w-full max-w-5xl">
      <div className="absolute -inset-8 -z-10 rounded-full bg-blue/10 blur-3xl" />
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl shadow-sidebar/15">
        <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Brand compact />
            <div>
              <div className="text-sm font-semibold text-text-primary">{copy.preview.title}</div>
              <div className="text-xs text-text-muted">{copy.preview.period}</div>
            </div>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <div className="size-8 rounded-full bg-blue-light" />
            <div className="size-8 rounded-full bg-purple-light" />
            <div className="grid size-8 place-items-center rounded-full bg-sidebar text-xs font-semibold text-white">MC</div>
          </div>
        </div>
        <div className="grid gap-4 bg-bg/70 p-4 sm:grid-cols-4 sm:p-6">
          {stats.map(([label, value, color]) => (
            <div key={label} className="rounded-xl border border-border bg-surface p-4">
              <div className={`mb-3 h-1 w-8 rounded-full ${color}`} />
              <div className="text-2xl font-bold text-text-primary">{value}</div>
              <div className="mt-1 text-xs text-text-secondary">{label}</div>
            </div>
          ))}
          <div className="rounded-xl border border-border bg-surface p-5 sm:col-span-2">
            <div className="mb-5 flex items-center justify-between">
              <div className="text-sm font-semibold text-text-primary">{copy.preview.delivery}</div>
              <div className="rounded-full bg-green-light px-2.5 py-1 text-xs font-semibold text-green">{copy.preview.deliveryTrend}</div>
            </div>
            <div className="flex items-end gap-2">
              {[42, 56, 48, 68, 62, 78, 72, 88, 82, 96].map((height, index) => (
                <div key={index} className="flex h-28 flex-1 items-end rounded-sm bg-blue-light">
                  <div className="w-full rounded-sm bg-blue/80" style={{ height: `${height}%` }} />
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5 sm:col-span-2">
            <div className="mb-5 flex items-center justify-between">
              <div className="text-sm font-semibold text-text-primary">{copy.preview.workload}</div>
              <div className="text-2xl font-bold text-green">{copy.preview.deliveryValue}</div>
            </div>
            {['Ana', 'Bruno', 'Caio'].map((name, index) => (
              <div key={name} className="mb-4 flex items-center gap-3 last:mb-0">
                <div className="grid size-7 place-items-center rounded-full bg-blue-light text-xs font-semibold text-blue">{name[0]}</div>
                <div className="w-14 text-xs text-text-secondary">{name}</div>
                <div className="h-2 flex-1 rounded-full bg-border">
                  <div className="h-full rounded-full bg-blue" style={{ width: `${[74, 58, 86][index]}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="hidden rounded-xl border border-border bg-surface p-5 sm:col-span-4 sm:block">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm font-semibold text-text-primary">{copy.preview.sprint}</div>
              <div className="font-mono text-xs text-text-muted">24 / 31 tarefas</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 flex-1 rounded-full bg-border"><div className="h-full w-3/4 rounded-full bg-blue" /></div>
              <div className="text-sm font-bold text-blue">77%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MarketingPage({ dark, onToggleTheme, onLogin, onSignup, onDemo }: Props) {
  return (
    <div className="min-h-screen overflow-hidden bg-bg text-text-primary">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border/70 bg-bg/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <Brand />
          <nav className="hidden items-center gap-1 md:flex">
            <BtnPrimary variant="ghost" onClick={() => scrollTo('produto')}>{copy.nav.product}</BtnPrimary>
            <BtnPrimary variant="ghost" onClick={() => scrollTo('beneficios')}>{copy.nav.benefits}</BtnPrimary>
            <BtnPrimary variant="ghost" onClick={() => scrollTo('como-funciona')}>{copy.nav.workflow}</BtnPrimary>
          </nav>
          <div className="flex items-center gap-1 sm:gap-2">
            <BtnPrimary variant="ghost" onClick={onToggleTheme} ariaLabel={dark ? 'Ativar tema claro' : 'Ativar tema escuro'}>
              <ProductIcon name={dark ? 'sun' : 'moon'} />
            </BtnPrimary>
            <div className="hidden sm:block"><BtnPrimary variant="ghost" onClick={onLogin}>{copy.nav.login}</BtnPrimary></div>
            <BtnPrimary onClick={onSignup}>{copy.nav.signup}</BtnPrimary>
          </div>
        </div>
      </header>

      <main>
        <section className="relative px-5 pb-24 pt-36 lg:px-8 lg:pb-32 lg:pt-44">
          <div className="absolute left-1/2 top-20 -z-10 size-96 -translate-x-1/2 rounded-full bg-blue/10 blur-3xl" />
          <div className="mx-auto max-w-5xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue/20 bg-blue-light px-4 py-2 text-xs font-semibold uppercase tracking-widest text-blue">
              <span className="size-2 rounded-full bg-blue" />
              {copy.hero.eyebrow}
            </div>
            <div className="mx-auto max-w-4xl text-4xl font-bold leading-tight tracking-tight text-text-primary sm:text-6xl lg:text-7xl">
              {copy.hero.title}
            </div>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-text-secondary sm:text-lg">
              {copy.hero.description}
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <BtnPrimary onClick={onSignup}>{copy.hero.primary}<ProductIcon name="arrow" /></BtnPrimary>
              <BtnPrimary variant="secondary" onClick={onDemo}>{copy.hero.secondary}</BtnPrimary>
            </div>
            <p className="mt-4 text-xs text-text-muted">{copy.hero.trust}</p>
          </div>
          <div className="mx-auto mt-16 max-w-6xl lg:mt-20"><DashboardPreview /></div>
        </section>

        <section className="border-y border-border bg-surface px-5 py-10 lg:px-8">
          <div className="mx-auto grid max-w-6xl gap-8 text-center sm:grid-cols-3">
            {copy.metrics.map((metric) => (
              <div key={metric.value}>
                <div className="text-2xl font-bold text-text-primary">{metric.value}</div>
                <div className="mt-1 text-sm text-text-secondary">{metric.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section id="beneficios" className="px-5 py-24 lg:px-8 lg:py-32">
          <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-blue">{copy.problem.eyebrow}</div>
              <div className="mt-4 max-w-xl text-3xl font-bold leading-tight tracking-tight sm:text-5xl">{copy.problem.title}</div>
              <p className="mt-6 max-w-xl leading-7 text-text-secondary">{copy.problem.description}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-red/20 bg-red-light/50 p-6">
                <div className="mb-5 text-sm font-semibold text-red">{copy.problem.oldWay}</div>
                <div className="space-y-4">
                  {copy.problem.oldItems.map((item) => (
                    <div key={item} className="flex gap-3 text-sm leading-6 text-text-secondary">
                      <span className="mt-2 size-2 shrink-0 rounded-full bg-red" />{item}
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-green/20 bg-green-light/50 p-6">
                <div className="mb-5 text-sm font-semibold text-green">{copy.problem.newWay}</div>
                <div className="space-y-4">
                  {copy.problem.newItems.map((item) => (
                    <div key={item} className="flex gap-3 text-sm leading-6 text-text-secondary">
                      <ProductIcon name="check" className="mt-1 size-4 shrink-0 text-green" />{item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="produto" className="bg-surface px-5 py-24 lg:px-8 lg:py-32">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <div className="text-xs font-bold uppercase tracking-widest text-blue">{copy.features.eyebrow}</div>
              <div className="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-5xl">{copy.features.title}</div>
              <p className="mt-5 leading-7 text-text-secondary">{copy.features.description}</p>
            </div>
            <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {copy.features.items.map((feature) => (
                <article key={feature.title} className="group rounded-2xl border border-border bg-bg/50 p-6 transition hover:-translate-y-1 hover:border-blue/30 hover:shadow-xl hover:shadow-blue/5">
                  <div className="mb-5 grid size-11 place-items-center rounded-xl bg-blue-light text-blue transition group-hover:bg-blue group-hover:text-white">
                    <ProductIcon name={feature.icon as IconName} />
                  </div>
                  <div className="text-lg font-semibold text-text-primary">{feature.title}</div>
                  <p className="mt-2 text-sm leading-6 text-text-secondary">{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="como-funciona" className="px-5 py-24 lg:px-8 lg:py-32">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <div className="text-xs font-bold uppercase tracking-widest text-blue">{copy.workflow.eyebrow}</div>
              <div className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">{copy.workflow.title}</div>
            </div>
            <div className="relative mt-16 grid gap-8 md:grid-cols-3">
              <div className="absolute left-1/6 right-1/6 top-7 hidden border-t border-dashed border-blue/30 md:block" />
              {copy.workflow.items.map((item) => (
                <div key={item.number} className="relative text-center">
                  <div className="relative mx-auto grid size-14 place-items-center rounded-full border-4 border-bg bg-sidebar font-mono text-sm font-bold text-white">{item.number}</div>
                  <div className="mt-6 text-lg font-semibold">{item.title}</div>
                  <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-text-secondary">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 pb-24 lg:px-8 lg:pb-32">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-sidebar px-6 py-16 text-center text-white shadow-2xl shadow-sidebar/20 sm:px-12">
            <div className="absolute -right-20 -top-20 size-72 rounded-full bg-blue/30 blur-3xl" />
            <div className="relative">
              <div className="text-xs font-bold uppercase tracking-widest text-blue-mid">{copy.cta.eyebrow}</div>
              <div className="mx-auto mt-4 max-w-2xl text-3xl font-bold tracking-tight sm:text-5xl">{copy.cta.title}</div>
              <p className="mx-auto mt-5 max-w-xl text-text-on-dark-muted">{copy.cta.description}</p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <BtnPrimary onClick={onSignup}>{copy.cta.primary}<ProductIcon name="arrow" /></BtnPrimary>
                <BtnPrimary variant="secondary" onClick={onDemo}>{copy.cta.secondary}</BtnPrimary>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-surface px-5 py-10 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div><Brand /><p className="mt-3 text-sm text-text-secondary">{copy.footer.description}</p></div>
          <div className="flex flex-col gap-3 text-xs text-text-muted sm:items-end">
            <div className="flex gap-5"><span>{copy.footer.privacy}</span><span>{copy.footer.terms}</span></div>
            <span>{copy.footer.copyright}</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
