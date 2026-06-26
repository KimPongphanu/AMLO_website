import { useEffect, useState } from 'react'
import { API_URL } from '../../config/constants'
import { contentService } from '../../services/contentService'

export default function SplashPopup() {
  // Check localStorage once outside effect
  const today = new Date().toISOString().slice(0, 10)
  const alreadySeen = !!localStorage.getItem(`splash_seen_${today}`)

  const [popup, setPopup] = useState<{
    image_url: string
    title: string
  } | null>(null)
  const [dismissed, setDismissed] = useState(alreadySeen)

  useEffect(() => {
    if (dismissed) return

    contentService
      .getActiveSplashPopup()
      .then((data) => {
        if (!data || !data.image_url) {
          setDismissed(true)
        } else {
          setPopup(data)
        }
      })
      .catch(() => {
        setDismissed(true)
      })
  }, [dismissed])

  const handleEnter = () => {
    const today = new Date().toISOString().slice(0, 10)
    localStorage.setItem(`splash_seen_${today}`, 'true')
    setDismissed(true)
  }

  if (dismissed || !popup) return null

  const imgSrc = popup.image_url.startsWith('http')
    ? popup.image_url
    : `${API_URL}${popup.image_url}`

  return (
    <div className='fixed inset-0 z-[999999] flex items-center justify-center'>
      {/* Backdrop: blur + dark overlay - no pointer events so it won't intercept clicks */}
      <div className='absolute inset-0 bg-black/60 backdrop-blur-sm' />

      {/* Content card - centered */}
      <div className='relative z-10 flex flex-col items-center max-w-2xl w-full mx-6'>
        {/* Image */}
        <div className='w-full rounded-2xl overflow-hidden shadow-2xl'>
          <img
            src={imgSrc}
            alt={popup.title || 'Splash'}
            className='w-full h-auto object-cover'
          />
        </div>

        {/* Title */}
        {popup.title && (
          <h2 className='text-white text-xl md:text-2xl font-bold mt-6 text-center'>
            {popup.title}
          </h2>
        )}

        {/* Enter button */}
        <button
          onClick={handleEnter}
          className='mt-8 px-10 py-3.5 rounded-xl bg-white text-slate-900 font-bold text-lg hover:bg-slate-100 active:scale-[0.97] transition-all shadow-xl'
        >
          เข้าสู่เว็บไซต์
        </button>
      </div>
    </div>
  )
}
