import { create } from 'zustand'

type FontSize = 'small' | 'medium' | 'large'
type Language = 'th' | 'en'

interface SiteState {
  fontSize: FontSize
  language: Language
  setFontSize: (size: FontSize) => void
  setLanguage: (lang: Language) => void
}

const getInitialFontSize = (): FontSize => {
  const saved = localStorage.getItem('amlo_font_size') as FontSize | null
  return saved || 'medium'
}

const getInitialLanguage = (): Language => {
  const saved = localStorage.getItem('amlo_language') as Language | null
  return saved || 'th'
}

export const useSiteStore = create<SiteState>((set) => ({
  fontSize: getInitialFontSize(),
  language: getInitialLanguage(),
  setFontSize: (size) => {
    localStorage.setItem('amlo_font_size', size)
    set({ fontSize: size })
  },
  setLanguage: (lang) => {
    localStorage.setItem('amlo_language', lang)
    set({ language: lang })
  },
}))
