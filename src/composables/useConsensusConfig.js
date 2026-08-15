import { ref } from 'vue'
import { dpClient } from './useAuth.js'

export const CONSENSUS_TOOL_ID = 'sysconsens'

const normalizeToolUrl = (url) => (url || '').trim().replace(/\/+$/, '').toLowerCase()
const currentToolUrl = () => window.location.origin + window.location.pathname

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
