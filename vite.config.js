import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { resolve } from 'node:path'
import { mkdirSync, writeFileSync } from 'node:fs'

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
export default defineConfig({
    base: '/tc/SysConsens/',
    plugins: [vue(), versionStamp()],
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
