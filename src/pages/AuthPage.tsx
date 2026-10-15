import { useState, type FormEvent } from 'react'
import { BtnPrimary } from '../components/atoms'
import { Field, Inp } from '../components/form'
import Brand from '../components/Brand'
import ProductIcon from '../components/ProductIcon'
import { siteCopy as copy } from '../content'
import { getApiErrorMessage } from '../api'
import type { LoginPayload, SignupPayload } from '../types'

type AuthMode = 'login' | 'signup'

interface Props {
  initialMode: AuthMode
  dark: boolean
  onToggleTheme: () => void
  onBack: () => void
  onSubmit: (mode: AuthMode, payload: LoginPayload | SignupPayload) => Promise<void>
}

const panelTransition = 'transition-[opacity,transform,visibility] duration-500 ease-in-out motion-reduce:duration-0'

type FormErrors = Partial<Record<'name' | 'company' | 'email' | 'password' | 'confirmPassword', string>>

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function formatCnpj(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 14)
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

export default function AuthPage({ initialMode, dark, onToggleTheme, onBack, onSubmit }: Props) {
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [name, setName] = useState('')
  const [signupType, setSignupType] = useState<'organization' | 'developer'>('organization')
  const [company, setCompany] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [requestError, setRequestError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const isLogin = mode === 'login'

  async function submit(event: FormEvent) {
    event.preventDefault()
    const nextErrors: FormErrors = {}
    if (!emailPattern.test(email.trim())) nextErrors.email = copy.auth.errors.email
    if (password.length < 8) nextErrors.password = copy.auth.errors.password
    if (!isLogin) {
      if (name.trim().length < 3) nextErrors.name = copy.auth.errors.name
      if (signupType === 'organization' && company.trim().length < 2) nextErrors.company = copy.auth.errors.company
      if (password !== confirmPassword) nextErrors.confirmPassword = copy.auth.errors.confirmPassword
    }
    setErrors(nextErrors)
    setRequestError('')
    if (Object.keys(nextErrors).length) return

    setSubmitting(true)
    try {
      await onSubmit(
        mode,
        isLogin
          ? { email: email.trim().toLowerCase(), password, remember }
          : {
              accountType: signupType,
              name: name.trim(),
              email: email.trim().toLowerCase(),
              password,
              organizationName: signupType === 'organization' ? company.trim() : undefined,
              cnpj: signupType === 'organization' ? cnpj.trim() : undefined,
            },
      )
    } catch (error) {
      setRequestError(getApiErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  function switchMode() {
    setErrors({})
    setRequestError('')
    setMode((current) => current === 'login' ? 'signup' : 'login')
  }

  return (
    <div className="grid min-h-screen overflow-hidden bg-bg lg:grid-cols-2">
      <main
        className={`flex min-h-screen min-w-0 transform-gpu flex-col overflow-y-auto transition-transform duration-700 ease-in-out motion-reduce:duration-0 ${
          isLogin ? 'lg:translate-x-0' : 'lg:translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
          <div className="lg:hidden"><Brand /></div>
          <BtnPrimary variant="ghost" onClick={onBack}>
            <span className="rotate-180"><ProductIcon name="arrow" /></span>
            {copy.auth.back}
          </BtnPrimary>
          <BtnPrimary variant="ghost" onClick={onToggleTheme} ariaLabel={dark ? 'Ativar tema claro' : 'Ativar tema escuro'}>
            <ProductIcon name={dark ? 'sun' : 'moon'} />
          </BtnPrimary>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 py-8 sm:px-8 lg:px-12">
          <div className="grid w-full max-w-md">
            <section
              className={`col-start-1 row-start-1 ${panelTransition} ${
                isLogin ? 'visible translate-x-0 opacity-100' : 'invisible -translate-x-12 opacity-0'
              }`}
              aria-hidden={!isLogin}
              inert={!isLogin}
            >
              <div className="mb-9 lg:hidden">
                <div className="text-3xl font-bold tracking-tight text-text-primary">{copy.auth.loginTitle}</div>
                <p className="mt-3 leading-7 text-text-secondary">{copy.auth.loginDescription}</p>
              </div>

              <form className="space-y-5" onSubmit={submit}>
                <Field label={copy.auth.email} required error={errors.email}>
                  <Inp id="login-email" name="email" type="email" value={email} onChange={setEmail} placeholder={copy.auth.emailPlaceholder} autoComplete="email" required />
                </Field>
                <Field label={copy.auth.password} required error={errors.password}>
                  <Inp id="login-password" name="password" type="password" value={password} onChange={setPassword} placeholder={copy.auth.passwordPlaceholder} autoComplete="current-password" required />
                </Field>

                <div className="flex items-center justify-between">
                  <BtnPrimary variant="ghost" onClick={() => setRemember((value) => !value)}>
                    <span className={`grid size-4 place-items-center rounded border ${remember ? 'border-blue bg-blue text-white' : 'border-border bg-surface'}`}>
                      {remember && <ProductIcon name="check" className="size-3" />}
                    </span>
                    {copy.auth.remember}
                  </BtnPrimary>
                  <BtnPrimary variant="link">{copy.auth.forgot}</BtnPrimary>
                </div>

                {requestError && <div role="alert" className="rounded-lg border border-red/20 bg-red-light px-3.5 py-3 text-sm text-red">{requestError}</div>}
                <BtnPrimary type="submit" fullWidth disabled={submitting}>
                  {submitting ? copy.auth.submitting : copy.auth.loginAction}
                  <ProductIcon name="arrow" />
                </BtnPrimary>
              </form>

              <div className="mt-8 flex items-center justify-center gap-1 border-t border-border pt-7 text-sm text-text-secondary">
                <span>{copy.auth.noAccount}</span>
                <BtnPrimary variant="link" onClick={switchMode}>{copy.auth.switchSignup}</BtnPrimary>
              </div>
            </section>

            <section
              className={`col-start-1 row-start-1 ${panelTransition} ${
                isLogin ? 'invisible translate-x-12 opacity-0' : 'visible translate-x-0 opacity-100'
              }`}
              aria-hidden={isLogin}
              inert={isLogin}
            >
              <div className="mb-9 lg:hidden">
                <div className="text-3xl font-bold tracking-tight text-text-primary">{copy.auth.signupTitle}</div>
                <p className="mt-3 leading-7 text-text-secondary">{copy.auth.signupDescription}</p>
              </div>

              <form className="space-y-5" onSubmit={submit}>
                <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-bg p-1.5">
                  <BtnPrimary
                    variant={signupType === 'organization' ? 'primary' : 'ghost'}
                    onClick={() => { setSignupType('organization'); setErrors({}) }}
                    fullWidth
                  >
                    Cadastrar empresa
                  </BtnPrimary>
                  <BtnPrimary
                    variant={signupType === 'developer' ? 'primary' : 'ghost'}
                    onClick={() => { setSignupType('developer'); setErrors({}) }}
                    fullWidth
                  >
                    Sou desenvolvedor
                  </BtnPrimary>
                </div>
                <p className="text-xs leading-5 text-text-muted">
                  {signupType === 'organization'
                    ? 'Você criará a organização e receberá automaticamente o perfil de gestor.'
                    : 'Crie sua conta agora. Você poderá vincular uma organização por convite depois.'}
                </p>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label={copy.auth.name} required error={errors.name}>
                    <Inp id="signup-name" name="name" value={name} onChange={setName} placeholder={copy.auth.namePlaceholder} autoComplete="name" required />
                  </Field>
                  {signupType === 'organization' && (
                    <Field label={copy.auth.company} required error={errors.company}>
                      <Inp id="signup-company" name="company" value={company} onChange={setCompany} placeholder={copy.auth.companyPlaceholder} autoComplete="organization" required />
                    </Field>
                  )}
                </div>
                {signupType === 'organization' && (
                  <Field label="CNPJ">
                    <Inp id="signup-cnpj" name="cnpj" value={cnpj} onChange={(value) => setCnpj(formatCnpj(value))} placeholder="00.000.000/0000-00" />
                  </Field>
                )}
                <Field label={copy.auth.email} required error={errors.email}>
                  <Inp id="signup-email" name="email" type="email" value={email} onChange={setEmail} placeholder={copy.auth.emailPlaceholder} autoComplete="email" required />
                </Field>
                <Field label={copy.auth.password} required error={errors.password}>
                  <Inp id="signup-password" name="password" type="password" value={password} onChange={setPassword} placeholder={copy.auth.passwordPlaceholder} autoComplete="new-password" required />
                </Field>
                <Field label={copy.auth.confirmPassword} required error={errors.confirmPassword}>
                  <Inp id="signup-confirm-password" name="confirmPassword" type="password" value={confirmPassword} onChange={setConfirmPassword} placeholder={copy.auth.confirmPasswordPlaceholder} autoComplete="new-password" required />
                </Field>

                {requestError && <div role="alert" className="rounded-lg border border-red/20 bg-red-light px-3.5 py-3 text-sm text-red">{requestError}</div>}
                <BtnPrimary type="submit" fullWidth disabled={submitting}>
                  {submitting ? copy.auth.submitting : copy.auth.signupAction}
                  <ProductIcon name="arrow" />
                </BtnPrimary>
              </form>

              <p className="mt-4 text-center text-xs leading-5 text-text-muted">{copy.auth.terms}</p>
              <div className="mt-8 flex items-center justify-center gap-1 border-t border-border pt-7 text-sm text-text-secondary">
                <span>{copy.auth.hasAccount}</span>
                <BtnPrimary variant="link" onClick={switchMode}>{copy.auth.switchLogin}</BtnPrimary>
              </div>
            </section>
          </div>
        </div>
      </main>

      <aside
        className={`relative hidden transform-gpu overflow-hidden bg-sidebar p-12 text-white transition-transform duration-700 ease-in-out motion-reduce:duration-0 lg:flex lg:flex-col lg:justify-between ${
          isLogin ? 'lg:translate-x-0' : 'lg:-translate-x-full'
        }`}
      >
        <div className="absolute -left-28 top-1/3 size-96 rounded-full bg-blue/20 blur-3xl" />
        <div className="absolute -right-28 bottom-0 size-80 rounded-full bg-purple/20 blur-3xl" />
        <Brand inverse />

        <div className="relative grid max-w-xl">
          <section
            className={`col-start-1 row-start-1 ${panelTransition} ${
              isLogin ? 'visible translate-x-0 opacity-100' : 'invisible translate-x-12 opacity-0'
            }`}
            aria-hidden={!isLogin}
          >
            <div className="mb-8 flex gap-2">
              <div className="h-1 w-16 rounded-full bg-blue" />
              <div className="h-1 w-8 rounded-full bg-blue/30" />
            </div>
            <div className="text-4xl font-semibold leading-tight tracking-tight">{copy.auth.loginTitle}</div>
            <p className="mt-4 max-w-md leading-7 text-text-on-dark">{copy.auth.loginDescription}</p>
            <div className="mt-10 border-l-2 border-blue/60 pl-5">
              <p className="text-sm leading-6 text-text-on-dark">“{copy.auth.testimonial}”</p>
              <div className="mt-4 text-sm font-semibold">{copy.auth.testimonialAuthor}</div>
              <div className="mt-1 text-xs text-text-on-dark-muted">{copy.auth.testimonialRole}</div>
            </div>
          </section>

          <section
            className={`col-start-1 row-start-1 ${panelTransition} ${
              isLogin ? 'invisible -translate-x-12 opacity-0' : 'visible translate-x-0 opacity-100'
            }`}
            aria-hidden={isLogin}
          >
            <div className="mb-8 flex gap-2">
              <div className="h-1 w-8 rounded-full bg-blue/30" />
              <div className="h-1 w-16 rounded-full bg-blue" />
            </div>
            <div className="text-4xl font-semibold leading-tight tracking-tight">{copy.auth.signupTitle}</div>
            <p className="mt-4 max-w-md leading-7 text-text-on-dark">{copy.auth.signupDescription}</p>
          </section>
        </div>

        <div className="relative text-xs text-text-on-dark-muted">{copy.footer.description}</div>
      </aside>
    </div>
  )
}
