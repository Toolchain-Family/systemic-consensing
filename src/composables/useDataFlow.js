// src/composables/useDataFlow.js
// Generischer Datenfluss-Import: liest das aktive Toolchain-Dokument (Case) und
// liefert die dataFlow-Mappings, in denen DIESE Tool-Instanz das Ziel ist.
// Nichts ist hartkodiert - Quellen/Strukturen/Felder kommen aus der Toolchain.
import { ref, reactive } from 'vue'
import { dpClient } from './useAuth.js'
const CASE_DOC_TYPE = 98
const CASE_DOC_SUBTYPE = 0

const recordedSources = ref([])

export function useDataFlow() {
    const caseId = ref('')
    const caseName = ref('')           // Name des aktiven Case (z. B. "PawCam")
    const instanceId = ref(null)
    const chain = ref(null)          // content.toolchain des aktiven Case-Dokuments
    const imports = ref([])          // Mappings, wo diese Instanz Ziel ist
    const upstreamTools = ref([])    // Namen der Tools transitiv stromaufwärts (in Kettenreihenfolge)
    const error = ref('')
    const loading = ref(false)

    const readContext = () => {
        const q = new URLSearchParams(window.location.search)
        caseId.value = q.get('case') || ''
        const inst = q.get('instance')
        instanceId.value = inst ? Number(inst) : null
    }

    const fetchChain = async () => {
        if (!caseId.value) {
            error.value = 'No case context (open the tool from the Toolchain Dashboard workspace)'
            return null
        }
        if (!dpClient.getToken()) { error.value = 'Not signed in'; return null }
        try {
            const docs = await dpClient.fetchDocuments({ _id: caseId.value })
            const doc = docs && docs[0]
            if (!doc) { error.value = 'Case document not found'; return null }
            caseName.value = (doc.content && doc.content.name) || doc.title || ''
            chain.value = (doc.content && doc.content.toolchain) || null
            return chain.value
        } catch (e) {
            error.value = e?.message || 'Failed to load toolchain'
            return null
        }
    }

    const buildImports = () => {
        imports.value = []
        if (!chain.value || instanceId.value == null) return
        const df = chain.value.dataFlow || []
        imports.value = df.filter((m) => Number(m.targetInstanceId) === instanceId.value)
    }

    // Ermittelt transitiv alle Tools, die über die Verbindungen vor dieser Instanz liegen,
    // in Kettenreihenfolge (Quellen zuerst).
    const buildUpstream = () => {
        upstreamTools.value = []
        if (!chain.value || instanceId.value == null) return
        const placed = chain.value.placedTools || []
        const conns = chain.value.connections || []
        const nameById = {}
        placed.forEach((t) => { if (t.instanceId != null) nameById[t.instanceId] = t.name || '#' + t.instanceId })
        const inDeg = {}
        const adj = {}
        placed.forEach((t) => { inDeg[t.instanceId] = 0; adj[t.instanceId] = [] })
        conns.forEach((c) => {
            if (adj[c.startId] && adj[c.endId] != null) {
                adj[c.startId].push(c.endId); inDeg[c.endId] = (inDeg[c.endId] || 0) + 1
            }
        })
        const q = placed.filter((t) => inDeg[t.instanceId] === 0).map((t) => t.instanceId)
        const result = []
        while (q.length) {
            const u = q.shift()
            if (u === instanceId.value) break
            result.push(u)
            ;(adj[u] || []).forEach((v) => {
                inDeg[v] = (inDeg[v] || 0) - 1
                if (inDeg[v] === 0) q.push(v)
            })
        }
        result.forEach((id) => { if (nameById[id]) upstreamTools.value.push(nameById[id]) })
    }

    const load = async () => {
        readContext()
        loading.value = true
        await fetchChain()
        buildImports()
        buildUpstream()
        loading.value = false
        return chain.value
    }

    // Wählt das zum Case passende Quell-Dokument (bevorzugt Titel mit Case-Namen).
    const pickSourceDoc = (docs) => {
        if (!docs || !docs.length) return null
        if (caseName.value) {
            const n = caseName.value.toLowerCase()
            const match = docs.find((d) =>
                (d.title || (d.content && d.content.name) || '').toLowerCase().includes(n))
            if (match) return match
        }
        return docs[0]
    }

    // Holt das Quell-Dokument und extrahiert die gemappten Felder (generisch).
    const fetchSource = async (mapping) => {
        if (!dpClient.getToken()) throw new Error('Not signed in')
        if (mapping.sourceType == null || mapping.sourceSubType == null) {
            throw new Error('Mapping has no sourceType/sourceSubType')
        }
        const docs = await dpClient.fetchDocuments({ type: mapping.sourceType, subType: mapping.sourceSubType })
        if (!docs || !docs.length) throw new Error('No source document found for this mapping')
        const doc = pickSourceDoc(docs)
        const content = (doc.content || {})
        const fields = {}
        ;(mapping.fieldMappings || []).forEach((fm) => {
            const v = content[fm.source]
            if (Array.isArray(v)) {
                // Jeden Faktor mit Provenienz markieren: Dokument + Quellfeld + Faktor-ID
                const tagged = v.map((x) => (x && typeof x === 'object'
                    ? { ...x, _from: { docId: doc._id, field: fm.source, id: x.id } }
                    : x))
                fields[fm.target] = (fields[fm.target] || []).concat(tagged)
            } else {
                fields[fm.target] = v
            }
        })
        return { sourceDocId: doc._id, sourceToolName: mapping.sourceToolName || mapping.sourceStructure, fields }
    }

    // Import für die Empfänger-Seite festhalten: Inhalt + Referenz zum Dokument
    const recordSource = (mapping, result) => {
        recordedSources.value.push({
            tool: mapping.sourceToolName || mapping.sourceStructure,
            structure: mapping.sourceStructure,
            docId: result.sourceDocId,
            importedAt: new Date().toISOString(),
            fields: result.fields,
        })
    }

    const clearRecordedSources = () => { recordedSources.value = [] }

    return reactive({ caseId, caseName, instanceId, chain, imports, upstreamTools, error, loading, load, fetchSource, recordSource, clearRecordedSources, recordedSources })
}

export { recordedSources }
