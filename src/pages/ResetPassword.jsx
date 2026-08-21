import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { MdLock, MdVisibility, MdVisibilityOff, MdCheckCircle, MdError } from 'react-icons/md'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Supabase redirects here with session tokens in the URL hash
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (sessionError || !data.session) {
        setError('This reset link is invalid or has expired. Please request a new one.')
        return
      }
      setReady(true)
    })
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError
      await supabase.auth.signOut()
      setDone(true)
      toast.success('Password updated. Please sign in.')
      setTimeout(() => navigate('/login', { replace: true }), 1500)
    } catch (err) {
      toast.error(err.message || 'Failed to update password')
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
          {error ? (
            <div className="text-center">
              <MdError className="mx-auto text-red-500 mb-3" size={40} />
              <h2 className="text-lg font-bold text-gray-900 mb-2">Link invalid or expired</h2>
              <p className="text-sm text-gray-500 mb-6">{error}</p>
              <button
                onClick={() => navigate('/forgot-password')}
                className="btn-primary w-full py-3 text-base"
              >
                Request New Link
              </button>
            </div>
          ) : done ? (
            <div className="text-center">
              <MdCheckCircle className="mx-auto text-green-500 mb-3" size={40} />
              <h2 className="text-lg font-bold text-gray-900 mb-2">Password updated</h2>
              <p className="text-sm text-gray-500">Redirecting you to sign in...</p>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-bold text-gray-900 mb-6">Set a new password</h2>

              {!ready && (
                <div className="flex justify-center py-6">
                  <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
                </div>
              )}

              {ready && (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="label">New Password</label>
                    <div className="relative">
                      <MdLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="input pl-10 pr-10"
                        placeholder="At least 8 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
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

                  <div>
                    <label className="label">Confirm Password</label>
                    <div className="relative">
                      <MdLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="input pl-10 pr-10"
                        placeholder="Repeat your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        autoComplete="new-password"
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
                    ) : 'Update Password'}
                  </button>
                </form>
              )}
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
