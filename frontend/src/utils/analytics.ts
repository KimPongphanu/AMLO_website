import ReactGA from 'react-ga4'

export const initGA = (): void => {
  // ดึงค่าจาก .env
  const trackingId = import.meta.env.VITE_GA_MEASUREMENT_ID

  if (import.meta.env.PROD && trackingId) {
    ReactGA.initialize(trackingId)
  } else {
    console.log('GA4: Deactivated on Localhost')
  }
}

export const logPageView = (path: string): void => {
  if (import.meta.env.PROD) {
    ReactGA.send({ hitType: 'pageview', page: path })
  } else {
    console.log(`GA4 Virtual Pageview: ${path}`)
  }
}
