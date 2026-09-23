import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { resolve } from 'node:path'
import { mkdirSync, writeFileSync , readFileSync} from 'node:fs'

function versionStamp() {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  return {
    name: 'generate-version-json',
    closeBundle() {
      const outDir = resolve(process.cwd(), 'dist')
      mkdirSync(outDir, { recursive: true })
      writeFileSync(resolve(outDir, 'version.json'), JSON.stringify({ version: stamp }, null, 2))
    },
  }
}

// https://vitejs.dev/config/

const MANIFEST_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'public, max-age=300',
}

function toolManifestPlugin() {
  const manifestFile = resolve(process.cwd(), 'public', 'manifest.json')
  const isManifestRequest = (url) => (url ?? '').split('?')[0].endsWith('/manifest.json')
  const sendManifest = (res) => {
    try {
      const payload = readFileSync(manifestFile)
      for (const [k, v] of Object.entries(MANIFEST_HEADERS)) res.setHeader(k, v)
      res.end(payload)
    } catch {
      res.statusCode = 404
      res.end('manifest.json not found')
    }
  }
  return {
    name: 'serve-manifest-json',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!isManifestRequest(req?.url)) return next()
        sendManifest(res)
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!isManifestRequest(req?.url)) return next()
        sendManifest(res)
      })
    },
  }
}

export default defineConfig({
    base: '/tc/SysConsens/',
    plugins: [vue(), toolManifestPlugin(), versionStamp()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    server: {
        port: 3001,
        open: true
    },
    build: {
        outDir: 'dist',
        sourcemap: true
    }
})
