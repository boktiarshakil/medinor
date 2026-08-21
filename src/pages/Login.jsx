import { useState } from 'react'
import { useNavigate, useLocation, Navigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { MdLock, MdEmail, MdVisibility, MdVisibilityOff } from 'react-icons/md'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signIn, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  if (user) {
    const from = location.state?.from?.pathname || '/dashboard'
    return <Navigate to={from} replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Email and password required')
      return
    }
    setLoading(true)
    try {
      const profile = await signIn(email, password)
      toast.success(`Welcome, ${profile.full_name}!`)
      const from = location.state?.from?.pathname || '/dashboard'
      navigate(from, { replace: true })
    } catch (err) {
      toast.error(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="bg-brand-500 rounded-2xl px-8 py-7 mb-4 shadow-lg shadow-brand-500/20">
            <div className="font-logo text-6xl leading-none text-white select-none tracking-[-0.09em]">mms.</div>
            <div className="font-brandname text-xl font-bold text-black uppercase tracking-[0.12em] mt-3">MMS Prime Ltd</div>
            <div className="font-tagline text-[15px] text-black uppercase tracking-[0.1008em] mt-1.5">Delivering Value Every Day</div>
          </div>
        </div>

        {/* Form */}
        <div className="card p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Sign in to your account</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <MdEmail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  className="input pl-10"
                  placeholder="you@kgsmgroup.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <MdLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input pl-10 pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end -mt-1">
              <Link to="/forgot-password" className="text-sm text-brand-500 hover:text-brand-600">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} MMS Prime Ltd. All rights reserved.
        </p>
      </div>
    </div>
  )
}
