import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginService } from '../../services/auth.service'
import { storage } from '../../utils/storage'
import { InputField } from './InputField'

export function LoginForm() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)

  function validate() {
    const newErrors: { email?: string; password?: string } = {}
    if (!email) newErrors.email = 'E-mail obrigatório'
    if (!password) newErrors.password = 'Senha obrigatória'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setApiError('')
    if (!validate()) return
    if (loading) return

    setLoading(true)
    try {
      const response = await loginService({ email, password })
      storage.setToken(response.data.token)
      storage.setRole(response.data.role)
      storage.setPlanExpiration(response.data.planExpirationDate)
      navigate('/')
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Erro ao realizar login. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )

  const EyeOffIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <InputField
        label="E-mail"
        type="email"
        placeholder="john.doe@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
      />
      <InputField
        label="Senha"
        type={showPassword ? 'text' : 'password'}
        placeholder="••••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
        rightElement={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        }
      />

      <button type="button" className="text-left text-sm font-bold text-black hover:underline">
  Esqueceu a senha?
</button>
      {apiError && (
        <span className="text-center text-sm text-red-500">{apiError}</span>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-2 w-full rounded-md bg-[#3E2B5C] py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {loading ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  )
}