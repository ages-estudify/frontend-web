import { LoginForm } from '@/components/login/LoginForm'

export function LoginPage() {
  return (
    <div
      className="flex min-h-screen bg-[#3D2068]"
      style={{
        backgroundImage: `url('/bg-pattern.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <h1
  className="text-7xl font-black text-[#7AE04A]"
  style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '-2px' }}
>
  Estudify
</h1>
        <p className="text-center text-base text-white/80 leading-relaxed">
  Se o Duolingo ensina idiomas...
  <br />
  O Estudify ensina você, vestibulando,
  <br />a entrar na universidade dos{' '}
  <span className="text-[#7AE04A]">sonhos.</span>
</p>
      </div>

      <div className="flex flex-1 items-center justify-center">
        <div className="w-[400px] rounded-2xl bg-white px-10 py-8 shadow-2xl">
          <div className="mb-6 flex flex-col items-center gap-2">
            <img src="/logo.png" alt="Estudify" className="h-24 w-24 object-contain" />
            <h2 className="text-3xl font-bold text-black">
  Login
</h2>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  )
}