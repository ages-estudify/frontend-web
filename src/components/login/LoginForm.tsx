import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { InputField } from '@/components/InputField';
import { EyeIcon, EyeOffIcon } from '@/components/icons/EyeIcons';

export function LoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  function validate() {
    const newErrors: { email?: string; password?: string } = {};
    if (!email) newErrors.email = 'E-mail obrigatório';
    if (!password) newErrors.password = 'Senha obrigatória';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;
    if (loading) return;

    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setApiError(
        err instanceof Error ? err.message : 'Não foi possível realizar login. Tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  }

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
            className="flex h-5 w-5 items-center justify-center text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        }
      />

      <button type="button" className="text-left text-sm font-bold text-black hover:underline">
        Esqueceu a senha?
      </button>

      {apiError && <span className="text-center text-sm text-red-500">{apiError}</span>}

      <button
        type="submit"
        disabled={loading}
        className="mt-2 w-full rounded-md bg-[#3E2B5C] py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {loading ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  );
}
