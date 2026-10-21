// src/composables/ditImport.js
// Import über Data Import Templates (DIT) – identisch in allen Tools der Toolchain-Family.
//
// Ein DIT ist ein DocPouch-Dokument (type 0 / subType 1) und gehört zu genau einem Tool
// (content.toolID = _id des Tool Definition Document, type 0 / subType 0).
// Es nennt pro Quell-Struktur, welche Daten das Tool übernimmt:
//
//   {
//     "toolID": "<TDD des Ziel-Tools>",
//     "caseId": "<Case-Dokument>",        // fehlt = Vorlage für alle Cases
//     "name": "TAM-SAM-SOM ← Distance from Core",
//     "structures": [{
//       "templateName": "Markt aus Distance from Core",
//       "incomingStructureId": "<_id der Quell-Struktur>",
//       "fieldMappings": [{ "source": "opportunities[id=O1].name",
//                           "target": "marketDefinition.marketName", "single": true }],
//       "importString": "[name]",          // optional: ein Text pro Quelldokument …
//       "importTarget": "options",         // … in dieses Zielfeld (Standard: "items")
//       "multiple": false                   // true = alle Dokumente des Case
//     }]
//   }
//
// Nichts ist fest verdrahtet: Das Tool findet sein TDD über die eigene URL (oder eine
// mitgegebene ID), die Quell-Struktur und das Quell-Tool werden über die "assignments"
// aller TDDs aufgelöst. Neue Tools funktionieren, sobald sie im Tool-Pool registriert sind.
//
// Vorrang: Für dieselbe Quell-Struktur gilt ein DIT des aktiven Case vor einer Vorlage.

const TDD = { type: 0, subType: 0 }
const DIT = { type: 0, subType: 1 }

export function normalizeToolUrl(url) {
    let u = String(url || '').trim().replace(/\/tools\//i, '/tc/').replace(/[?#].*$/, '')
    while (u.endsWith('/')) u = u.slice(0, -1)
    return u.toLowerCase()
}

// Das eigene Tool Definition Document: über die ID oder über die URL des Tools
export function findOwnTool(tdds, { toolDocId, toolUrl } = {}) {
    const list = Array.isArray(tdds) ? tdds : []
    if (toolDocId) {
        const byId = list.find((d) => d._id === toolDocId)
        if (byId) return byId
    }
    const here = normalizeToolUrl(toolUrl)
    if (!here) return null
    return list.find((d) => normalizeToolUrl((d.content || {}).toolUrl || (d.content || {}).url) === here) || null
}

// structureId -> { type, subType, toolName, role, toolDocId } aus den assignments aller TDDs
export function structureIndex(tdds) {
    const index = new Map()
    ;(tdds || []).forEach((d) => {
        const c = d.content || {}
        const toolName = c.name || c.tool || d.title || ''
        Object.entries(c.assignments || {}).forEach(([role, a]) => {
            if (a && a.structureId && !index.has(a.structureId)) {
                index.set(a.structureId, { type: a.type, subType: a.subType, toolName, role, toolDocId: d._id })
            }
        })
    })
    return index
}

// DIT-Einträge für ein Tool und einen Case wählen.
// Case-spezifische Einträge ersetzen Vorlagen-Einträge mit derselben Quell-Struktur.
export function selectDitEntries(dits, toolDocId, caseId) {
    const own = (dits || []).filter((d) => (d.content || {}).toolID === toolDocId)
    const caseDits = caseId ? own.filter((d) => (d.content || {}).caseId === caseId) : []
    const templates = own.filter((d) => !(d.content || {}).caseId)
    const flatten = (docs, scope) => docs.flatMap((d) => ((d.content || {}).structures || [])
        .filter((e) => e && e.incomingStructureId)
        .map((e, i) => ({ ...e, ditId: d._id, ditName: (d.content || {}).name || d.title || '', scope, index: i })))
    const fromCase = flatten(caseDits, 'case')
    const covered = new Set(fromCase.map((e) => e.incomingStructureId))
    return [...fromCase, ...flatten(templates, 'template').filter((e) => !covered.has(e.incomingStructureId))]
}

// DIT-Einträge in Import-"Mappings" umwandeln, wie sie useDataFlow.fetchSource versteht
export function ditEntriesToImports(entries, index, fallbackStructures = []) {
    const byStructure = new Map((fallbackStructures || []).map((s) => [s._id, s]))
    return (entries || []).map((e) => {
        const info = index.get(e.incomingStructureId) || {}
        const st = byStructure.get(e.incomingStructureId) || {}
        const type = info.type !== undefined ? info.type : st.type
        const subType = info.subType !== undefined ? info.subType : st.subType
        return {
            id: `dit-${e.ditId}-${e.index}`,
            origin: 'dit',
            scope: e.scope,
            ditId: e.ditId,
            ditName: e.ditName,
            templateName: e.templateName || '',
            sourceToolName: info.toolName || st.name || e.templateName || 'upstream',
            sourceStructure: info.role || st.name || e.incomingStructureId,
            sourceStructureId: e.incomingStructureId,
            sourceType: type,
            sourceSubType: subType,
            fieldMappings: Array.isArray(e.fieldMappings) ? e.fieldMappings : [],
            importString: e.importString || '',
            importTarget: e.importTarget || 'items',
            multiple: !!e.multiple,
        }
    }).filter((m) => m.sourceType !== undefined && m.sourceSubType !== undefined)
}

// Alles zusammen: TDDs und DITs laden, eigenes Tool finden, Einträge für den Case liefern.
// client braucht fetchDocuments(query); getStructures() wird genutzt, falls vorhanden.
export async function loadDitImports(client, { toolDocId, toolUrl, caseId } = {}) {
    if (!client || typeof client.fetchDocuments !== 'function') return []
    const [tdds, dits] = await Promise.all([
        client.fetchDocuments(TDD),
        client.fetchDocuments(DIT),
    ])
    const own = findOwnTool(tdds, { toolDocId, toolUrl })
    if (!own) return []
    const entries = selectDitEntries(dits, own._id, caseId)
    if (!entries.length) return []
    const index = structureIndex(tdds)
    let structures = []
    if (entries.some((e) => !index.has(e.incomingStructureId)) && typeof client.getStructures === 'function') {
        try { structures = await client.getStructures() } catch { structures = [] }
    }
    return ditEntriesToImports(entries, index, structures)
}
