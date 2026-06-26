// src/i18n/components/LanguageSwitcher.tsx
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES } from '../index'

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const [open, setOpen] = useState(false)

  const current =
    SUPPORTED_LANGUAGES.find((l) => l.code === i18n.language) ||
    SUPPORTED_LANGUAGES[0]

  const handleSelect = (code: string) => {
    i18n.changeLanguage(code)
    setOpen(false)
  }

  return (
    <div className='relative'>
      <button
        onClick={() => setOpen(!open)}
        className='flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-100 transition-colors'
      >
        <img
          src={current.flag}
          alt={current.label}
          className='w-5 h-3.5 rounded-sm object-cover'
        />
        <span>{current.label}</span>
      </button>

      {open && (
        <>
          <div className='fixed inset-0 z-10' onClick={() => setOpen(false)} />
          <div className='absolute right-0 mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden'>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors ${
                  lang.code === i18n.language
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <img
                  src={lang.flag}
                  alt={lang.label}
                  className='w-5 h-3.5 rounded-sm object-cover'
                />
                <span>{lang.label}</span>
                {lang.code === i18n.language && (
                  <span className='ml-auto text-blue-500'>✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
