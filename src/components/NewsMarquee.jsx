import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { formatDate } from '../lib/utils'
import { MdCampaign, MdClose, MdOutlineNotificationsActive } from 'react-icons/md'

const DISMISS_KEY = 'mediron_marquee_dismissed'

function getDismissed(userId) {
  try {
    return JSON.parse(localStorage.getItem(`${DISMISS_KEY}_${userId}`)) || []
  } catch {
    return []
  }
}

// direction: 'right' (text scrolls left→right) or 'left' (right→left, classic ticker)
export default function NewsMarquee({ direction = 'right' }) {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [dismissed, setDismissed] = useState([])

  const load = async () => {
    if (!user?.id) return
    try {
      const data = await api.getActiveAnnouncements(user.id)
      setItems(data)
    } catch (err) {
      console.error('Marquee load failed:', err)
      setItems([])
    }
  }

  useEffect(() => {
    if (!user?.id) return
    setDismissed(getDismissed(user.id))
    load()
    const timer = setInterval(load, 60000)
    return () => clearInterval(timer)
  }, [user?.id])

  const visible = items.filter(a => !dismissed.includes(a.id))
  if (visible.length === 0) return null

  const handleDismiss = () => {
    const next = Array.from(new Set([...dismissed, ...visible.map(a => a.id)]))
    setDismissed(next)
    try {
      localStorage.setItem(`${DISMISS_KEY}_${user.id}`, JSON.stringify(next))
    } catch { /* ignore */ }
  }

  return (
    <div className="no-print news-marquee">
      <span className="news-marquee-label">
        <MdOutlineNotificationsActive size={13} />
        <span>Announcements</span>
      </span>

      <div className="marquee" aria-label="Scrolling announcements">
        <div className={`marquee-track marquee-${direction}`}>
          {[0, 1].map(dup => (
            <div key={dup} className="marquee-content">
              {visible.map(a => (
                <span key={`${dup}-${a.id}`} className="marquee-item">
                  <MdCampaign size={11} className="marquee-item-icon" />
                  <span className="marquee-item-title">{a.title}</span>
                  <span className="marquee-item-text">{a.message}</span>
                  <span className="marquee-item-date">{formatDate(a.created_at, 'dd MMM')}</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <button onClick={handleDismiss} className="news-marquee-close" aria-label="Dismiss announcements" title="Dismiss">
        <MdClose size={16} />
      </button>
    </div>
  )
}
