import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Login() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setError('')
    if (!email || !password) { setError('Please fill in all fields.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true)

    const { error: err } = mode === 'signup'
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })

    if (err) setError(err.message)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-stone-200 p-8 w-full max-w-sm shadow-sm">
        <h1 className="font-serif text-2xl text-amber-800 text-center mb-1">✏ Luminary</h1>
        <p className="text-sm text-stone-400 text-center italic mb-6">Your private journal, illuminated by AI</p>

        <div className="flex border border-stone-200 rounded-lg mb-5 overflow-hidden">
          {(['login','signup'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${mode===m ? 'bg-amber-800 text-white' : 'text-stone-400'}`}>
              {m === 'login' ? 'Sign in' : 'Create account'}
            </button>
          ))}
        </div>

        {error && <p className="bg-red-50 text-red-600 border border-red-200 rounded-lg px-3 py-2 text-sm mb-4">{error}</p>}

        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400" />
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading}
          className="w-full bg-amber-800 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-amber-900 disabled:opacity-50 transition-colors">
          {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
      </div>
    </div>
  )
}