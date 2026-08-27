import { ref } from 'vue'
import { dpClient } from './useAuth.js'

export const CONSENSUS_TOOL_ID = 'sysconsens'

const normalizeToolUrl = (url) => (url || '').trim().replace(/\/tools\//i, '/tc/').replace(/\/+$/, '').toLowerCase()
const currentToolUrl = () => window.location.origin + window.location.pathname
const selfHealConfigUrl = async (doc) => {
  try {
    if (!doc || !doc._id) return
    const cur = currentToolUrl().replace(/\/+$/, '')
    const stored = String(doc.content?.toolUrl || doc.content?.url || '').replace(/\/+$/, '')
    if (!stored || stored === cur) return
    await dpClient.updateDocument(doc._id, { ...doc, content: { ...doc.content, toolUrl: cur } })
  } catch (e) {
    console.warn('config self-heal failed', e)
  }
}

export const consensusStructure = ref({ type: 6, subType: 0 })
export const configDocId = ref('')
export const isConfigLoaded = ref(false)
export const configLoadError = ref('')

export async function loadConsensusConfig() {
    configLoadError.value = ''
    if (!dpClient.getToken()) return null
    try {
        const all = await dpClient.fetchDocuments({ type: 0, subType: 0 })
        const candidates = (all || []).filter((d) => {
            const c = d.content || {}
            return (c.tool || c.name || '').toLowerCase() === CONSENSUS_TOOL_ID
        })
        if (!candidates.length) {
            configLoadError.value = 'SysConsens configuration not found on DocPouch.'
            return null
        }
        const here = normalizeToolUrl(currentToolUrl())
        const matching = candidates.find((d) => {
            const c = d.content || {}
            return normalizeToolUrl(c.toolUrl || c.url) === here
        })
        const doc = matching || candidates[0]
        await selfHealConfigUrl(doc)
        const c = doc.content || {}
        const a = c.assignments?.consensusSession
        if (!a || !a.type || a.subType === undefined) {
            configLoadError.value = 'SysConsens configuration missing the "consensusSession" assignment.'
            return null
        }
        consensusStructure.value = { type: a.type, subType: a.subType }
        configDocId.value = doc._id
        isConfigLoaded.value = true
        return consensusStructure.value
    } catch (e) {
        configLoadError.value = e?.message || 'Failed to load SysConsens configuration'
        return null
    }
}
