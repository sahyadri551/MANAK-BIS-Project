import axios from 'axios'

const backendUrl = import.meta.env.VITE_BACKEND_URL

export const api = axios.create({
  baseURL: `${backendUrl}/api`,
  headers: { 'Content-Type': 'application/json' },
})

// Language sent with every request so the API can localize standard data.
export function setApiLang(lang: string) {
  api.defaults.params = { ...(api.defaults.params || {}), lang }
}
