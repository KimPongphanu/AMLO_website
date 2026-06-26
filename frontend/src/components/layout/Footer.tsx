import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FaEnvelope,
  FaExternalLinkAlt,
  FaFacebook,
  FaFax,
  FaLine,
  FaMapMarkerAlt,
  FaPhone,
  FaRss,
  FaTwitter,
  FaYoutube,
} from 'react-icons/fa'
import { Link } from 'react-router-dom'
import { contentService } from '../../services/contentService'

const Footer = () => {
  const { t } = useTranslation()
  const [settings, setSettings] = useState<Record<string, string>>({})

  useEffect(() => {
    contentService
      .getSiteSettings()
      .then((data) => setSettings(data))
      .catch(() => {})
  }, [])

  const s = (key: string, fallback = '') => settings[key] || fallback

  return (
    <footer
      className='bg-slate-900 text-slate-300 pt-10 pb-6 mt-[50px]'
      role='contentinfo'
    >
      <a
        href='#main-content'
        className='sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-white focus:text-slate-900 focus:font-bold'
      >
        {t('common.skipToContent', 'ข้ามไปยังเนื้อหาหลัก')}
      </a>

      <div className='max-w-7xl mx-auto px-6'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12'>
          {/* Column 1: Logo + Contact */}
          <div className='flex flex-col gap-4'>
            <div className='flex items-center gap-3'>
              <img
                src='/Logo.png'
                alt={t('app.logoAlt', 'ตราสัญลักษณ์สำนักงาน ปปง.')}
                className='w-[80px] h-[80px] object-contain'
              />
              <div>
                <h3 className='text-white text-lg font-bold leading-snug'>
                  {t('home.heroTitle')}
                </h3>
                <p className='text-sm text-slate-400'>{t('app.title')}</p>
                <p className='text-xs text-slate-500'>{t('app.subtitle')}</p>
              </div>
            </div>
            <div className='space-y-2 text-sm leading-relaxed'>
              <p className='flex items-start gap-2'>
                <FaMapMarkerAlt className='w-4 h-4 mt-0.5 shrink-0 text-blue-400' />
                <span>
                  {s('address', t('footer.address', '422 ถนนพญาไท...'))}
                </span>
              </p>
              <p className='flex items-center gap-2'>
                <FaPhone className='w-3.5 h-3.5 shrink-0 text-blue-400' />
                <span>
                  {s('phone', t('footer.phone', '02-219-3600 ต่อ 1022, 1028'))}
                </span>
              </p>
              <p className='flex items-center gap-2'>
                <FaFax className='w-3.5 h-3.5 shrink-0 text-blue-400' />
                <span>{s('fax', t('footer.fax', '02-219-3902'))}</span>
              </p>
              <p className='flex items-center gap-2'>
                <FaEnvelope className='w-3.5 h-3.5 shrink-0 text-blue-400' />
                <a
                  href={`mailto:${s('email', t('footer.email', 'webmaster@amlo.go.th'))}`}
                  className='hover:text-white transition-colors underline underline-offset-2'
                >
                  {s('email', t('footer.email', 'webmaster@amlo.go.th'))}
                </a>
              </p>
            </div>
            <div className='flex items-center gap-3 pt-2'>
              <span className='text-xs font-medium text-slate-500 uppercase tracking-wider'>
                {t('footer.followUs')}
              </span>
              <div className='flex items-center gap-2'>
                {s('facebook') && (
                  <a
                    href={s('facebook')}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='w-8 h-8 rounded-full bg-slate-800 hover:bg-blue-600 flex items-center justify-center transition-colors'
                    aria-label='Facebook'
                  >
                    <FaFacebook className='w-4 h-4' />
                  </a>
                )}
                {s('line') && (
                  <a
                    href={s('line')}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='w-8 h-8 rounded-full bg-slate-800 hover:bg-green-600 flex items-center justify-center transition-colors'
                    aria-label='LINE'
                  >
                    <FaLine className='w-4 h-4' />
                  </a>
                )}
                {s('youtube') && (
                  <a
                    href={s('youtube')}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='w-8 h-8 rounded-full bg-slate-800 hover:bg-red-600 flex items-center justify-center transition-colors'
                    aria-label='YouTube'
                  >
                    <FaYoutube className='w-4 h-4' />
                  </a>
                )}
                {s('twitter') && (
                  <a
                    href={s('twitter')}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='w-8 h-8 rounded-full bg-slate-800 hover:bg-sky-500 flex items-center justify-center transition-colors'
                    aria-label='Twitter/X'
                  >
                    <FaTwitter className='w-4 h-4' />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className='text-white text-sm font-semibold uppercase tracking-wider mb-4'>
              {t('footer.quickLinks')}
            </h4>
            <ul className='space-y-2.5 text-sm'>
              <li>
                <Link
                  to='/'
                  className='text-slate-400 hover:text-white transition-colors'
                >
                  {t('nav.home')}
                </Link>
              </li>
              <li>
                <Link
                  to='/sitemap'
                  className='text-slate-400 hover:text-white transition-colors'
                >
                  {t('nav.sitemap')}
                </Link>
              </li>
              <li>
                <Link
                  to='/news'
                  className='text-slate-400 hover:text-white transition-colors'
                >
                  {t('nav.news')}
                </Link>
              </li>
              <li>
                <Link
                  to='/advertise'
                  className='text-slate-400 hover:text-white transition-colors'
                >
                  {t('nav.pr')}
                </Link>
              </li>
              <li>
                <Link
                  to='/bookguide'
                  className='text-slate-400 hover:text-white transition-colors'
                >
                  {t('nav.bookguide')}
                </Link>
              </li>
              <li>
                <Link
                  to='/contactform'
                  className='text-slate-400 hover:text-white transition-colors'
                >
                  {t('nav.contact')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Policies */}
          <div>
            <h4 className='text-white text-sm font-semibold uppercase tracking-wider mb-4'>
              {t('footer.policies')}
            </h4>
            <ul className='space-y-2.5 text-sm'>
              {[
                'policy_website',
                'policy_privacy',
                'policy_cookies',
                'policy_security',
                'policy_accessibility',
              ].map((pk) => {
                const labels: Record<string, string> = {
                  policy_website: t('footer.policyWebsite'),
                  policy_privacy: t('footer.policyPrivacy'),
                  policy_cookies: t('footer.policyCookies'),
                  policy_security: t('footer.policySecurity'),
                  policy_accessibility: t('footer.policyAccessibility'),
                }
                return (
                  <li key={pk}>
                    {s(pk) ? (
                      <a
                        href={s(pk)}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1'
                      >
                        {labels[pk]} <FaExternalLinkAlt className='w-3 h-3' />
                      </a>
                    ) : (
                      <span className='text-slate-500'>{labels[pk]}</span>
                    )}
                  </li>
                )
              })}
              <li className='pt-2'>
                <a
                  href='/rss.xml'
                  className='text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1.5'
                  aria-label='RSS Feed'
                >
                  <FaRss className='w-3.5 h-3.5 text-orange-400' />{' '}
                  {t('nav.rss')}
                </a>
              </li>
            </ul>
            <div className='mt-5 pt-4 border-t border-slate-800'>
              <Link
                to='/open-data'
                className='inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium'
              >
                {t('nav.openData')} <FaExternalLinkAlt className='w-3 h-3' />
              </Link>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className='mt-10 pt-6 border-t border-slate-800'>
          <div
            className='w-full rounded-xl overflow-hidden shadow-lg bg-slate-800'
            style={{ maxHeight: 250 }}
          >
            <iframe
              src='https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3875.5088760861113!2d100.52815717538161!3d13.748157697377236!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x30e29ecd23502191%3A0x6727623006f0914c!2z4Liq4Liz4LiZ4Lix4LiB4LiH4Liy4LiZ4Lib4LmJ4Lit4LiH4LiB4Lix4LiZ4LmB4Lil4Liw4Lib4Lij4Liy4Lia4Lib4Lij4Liy4Lih4LiB4Liy4Lij4Lif4Lit4LiB4LmA4LiH4Li04LiZICjguKrguLPguJnguLHguIHguIfguLLguJkg4Lib4Lib4LiHLik!5e0!3m2!1sth!2sth!4v1777450612263!5m2!1sth!2sth'
              className='w-full h-[250px]'
              style={{ border: 0 }}
              loading='lazy'
              referrerPolicy='no-referrer-when-downgrade'
              title={t('footer.mapTitle', 'แผนที่ตั้งสำนักงาน ปปง.')}
            ></iframe>
          </div>
        </div>

        {/* Copyright */}
        <div className='mt-8 pt-5 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-3 text-xs md:text-sm text-slate-500'>
          <p>
            &copy; {new Date().getFullYear()}{' '}
            {s('copyright', t('footer.copyright'))}
          </p>
          <div className='flex items-center gap-4'>
            <span>
              {t('footer.visitor')}: {s('visitor_count', '0')}{' '}
              {t('common.people', 'คน')}
            </span>
            <span className='hidden md:inline'>|</span>
            <a
              href='#main-content'
              className='hover:text-white transition-colors'
            >
              {t('footer.backToTop')}
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
