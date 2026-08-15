import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

const VERSION_KEY = 'sysconsens_app_version'
const RELOADED_KEY = 'sysconsens_checked_version'
const BASE = import.meta.env.BASE_URL

async function ensureCurrentVersion() {
  try {
    const res = await fetch(`${BASE}version.json?cb=${Date.now()}`, { cache: 'no-store' })
    const data = await res.json()
    const remote = data && data.version ? data.version : null
    if (!remote) return
    const local = localStorage.getItem(VERSION_KEY)
    if (local !== remote) {
      localStorage.setItem(VERSION_KEY, remote)
      const alreadyReloaded = sessionStorage.getItem(RELOADED_KEY) === '1'
      if (alreadyReloaded) return
      sessionStorage.setItem(RELOADED_KEY, '1')
      window.location.reload()
    }
  } catch (e) {
    console.warn('Version check skipped:', e)
  }
}

async function boot() {
  await ensureCurrentVersion()

  createApp(App).mount('#app')
}

boot()
