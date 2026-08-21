import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { MdEmail, MdArrowBack } from 'react-icons/md'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) {
      toast.error('Enter your email address')
      return
    }
    setLoading(true)
    try {
      const redirectTo = `${window.location.origin}/reset-password`
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
      if (error) throw error
      setSent(true)
    } catch (err) {
      toast.error(err.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-brand-500 rounded-2xl px-8 py-7 mb-4 shadow-lg shadow-brand-500/20">
            <div className="font-logo text-6xl leading-none text-white select-none tracking-[-0.09em]">mms.</div>
            <div className="font-brandname text-xl font-bold text-black uppercase tracking-[0.12em] mt-3">MMS Prime Ltd</div>
            <div className="font-tagline text-[15px] text-black uppercase tracking-[0.1008em] mt-1.5">Delivering Value Every Day</div>
          </div>
        </div>

        <div className="card p-8">
          {sent ? (
            <div className="text-center">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Check your inbox</h2>
              <p className="text-sm text-gray-500 mb-6">
                If an account exists for <span className="font-medium text-gray-700">{email}</span>,
                we've sent a password reset link. The link expires in 1 hour.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="btn-primary w-full py-3 text-base"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Reset your password</h2>
              <p className="text-sm text-gray-500 mb-6">
                Enter your account email and we'll send you a reset link.
              </p>

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

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3 text-base"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : 'Send Reset Link'}
                </button>
              </form>

              <Link
                to="/login"
                className="mt-6 flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-brand-600"
              >
                <MdArrowBack size={16} />
                Back to Sign In
              </Link>
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} MMS Prime Ltd. All rights reserved.
        </p>
      </div>
    </div>
  )
}
