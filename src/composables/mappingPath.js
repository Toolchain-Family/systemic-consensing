// src/composables/mappingPath.js
// Pfade in Datenfluss-Mappings (identisch in allen Tools der Toolchain-Family).
//
// Ein Mapping { source, target } darf statt eines Feldnamens einen Pfad enthalten:
//   mission.text                    Unterfeld eines Objekts
//   factors.political               Liste innerhalb eines Objekts
//   strategies.title                aus jedem Listeneintrag ein Feld -> Liste von Werten
//   factorDetails[category=strength] nur die Listeneinträge mit category = strength
//   factorDetails[category=strength].factorText   gefiltert und ein Feld daraus
//   factors.*[impactType=threat]    "*" = alle Unterfelder (hier alle PESTEL-Kategorien)
// Ein Ziel-Pfad wie "project.description" oder "swotFactors.strengths" baut das
// verschachtelte Objekt auf, das das Ziel-Tool beim Import erwartet.
// Einfache Feldnamen ohne Punkt und Klammern verhalten sich wie bisher.
//
// Zusätzliche Angaben pro Mapping (optional):
//   rename: { label: 'factorText' }  Feld in jedem Listeneintrag umbenennen
//                                    (z. B. PESTEL "label" -> SWOT "factorText")
//   single: true                     nur den ersten Wert übernehmen statt einer Liste

// "factorDetails[category=strength]" -> { key: 'factorDetails', filter: { field: 'category', value: 'strength' } }
function parseSegment(seg) {
    const m = /^([^[\]]+)(?:\[([^=\]]+)=([^\]]*)\])?$/.exec(seg)
    if (!m) return { key: seg, filter: null }
    return { key: m[1], filter: m[2] !== undefined ? { field: m[2].trim(), value: m[3].trim() } : null }
}

export function splitPath(path) {
    return String(path || '').split('.').filter(Boolean).map(parseSegment)
}

function step(value, { key, filter }) {
    if (value === undefined || value === null) return undefined
    // Über Listen hinweg: aus jedem Eintrag lesen und das Ergebnis flach halten
    if (Array.isArray(value)) {
        const out = []
        value.forEach((item) => {
            const v = step(item, { key, filter })
            if (v === undefined || v === null) return
            if (Array.isArray(v)) out.push(...v)
            else out.push(v)
        })
        return out
    }
    if (typeof value !== 'object') return undefined
    let v = key === '*' ? Object.values(value).flatMap((x) => (Array.isArray(x) ? x : [x])) : value[key]
    if (filter) {
        if (!Array.isArray(v)) return undefined
        v = v.filter((x) => x && typeof x === 'object' && String(x[filter.field]) === filter.value)
    }
    return v
}

// Wert an einem Pfad lesen
export function readPath(obj, path) {
    return splitPath(path).reduce((cur, seg) => step(cur, seg), obj)
}

// Wert an einem Pfad schreiben; Listen werden aneinandergehängt (mehrere Quellen -> ein Ziel)
export function writePath(target, path, value) {
    const segs = splitPath(path).map((s) => s.key)
    if (!segs.length) return target
    let cur = target
    segs.slice(0, -1).forEach((k) => {
        if (!cur[k] || typeof cur[k] !== 'object' || Array.isArray(cur[k])) cur[k] = {}
        cur = cur[k]
    })
    const last = segs[segs.length - 1]
    if (Array.isArray(value)) {
        cur[last] = (Array.isArray(cur[last]) ? cur[last] : []).concat(value)
    } else if (value !== undefined) {
        cur[last] = value
    }
    return target
}

// Alle Mappings eines Datenflusses auf ein Quelldokument anwenden.
// Objekte in Listen werden mit ihrer Herkunft markiert (_from: Dokument, Quellpfad, ID).
export function applyFieldMappings(content, fieldMappings, docId) {
    const fields = {}
    ;(fieldMappings || []).forEach((fm) => {
        let v = readPath(content || {}, fm.source)
        if (Array.isArray(v)) {
            v = v.map((x) => (x && typeof x === 'object'
                ? { ...renameFields(x, fm.rename), _from: { docId, field: fm.source, id: x.id } }
                : x))
            if (fm.single) v = v.length ? v[0] : undefined
        } else if (v && typeof v === 'object') {
            v = renameFields(v, fm.rename)
        }
        writePath(fields, fm.target, v)
    })
    return fields
}

// Felder eines Eintrags umbenennen: { label: 'factorText' } kopiert label nach factorText.
// Das ursprüngliche Feld bleibt erhalten, damit nichts verloren geht.
export function renameFields(item, rename) {
    if (!rename || typeof rename !== 'object') return item
    const out = { ...item }
    Object.entries(rename).forEach(([from, to]) => {
        if (from && to && item[from] !== undefined) out[to] = item[from]
    })
    return out
}

// "label→factorText, description→note" (oder mit ->) in { label: 'factorText', description: 'note' }
export function parseRename(text) {
    const out = {}
    String(text || '').split(',').forEach((pair) => {
        const [from, to] = pair.split(/->|→/).map((x) => (x || '').trim())
        if (from && to) out[from] = to
    })
    return out
}

// Alle Pfade eines Beispiel-Dokuments auflisten (für Vorschläge im Mapping-Editor)
export function listPaths(obj, maxDepth = 3, prefix = '') {
    const out = []
    if (!obj || typeof obj !== 'object' || maxDepth < 0) return out
    const sample = Array.isArray(obj) ? obj.find((x) => x && typeof x === 'object') : obj
    if (!sample) return out
    Object.keys(sample).forEach((k) => {
        if (k === '_from') return
        const p = prefix ? `${prefix}.${k}` : k
        out.push(p)
        const v = sample[k]
        if (v && typeof v === 'object') out.push(...listPaths(v, maxDepth - 1, p))
    })
    return [...new Set(out)]
}

// Quelldokumente wählen: das zum Case passende Dokument (Titel oder Name enthält den
// Case-Namen) oder – mit multiple – alle Dokumente des Case. Ohne Treffer: das erste
// bzw. alle Dokumente.
export function selectSourceDocs(docs, caseName, multiple) {
    const list = Array.isArray(docs) ? docs : []
    if (!list.length) return []
    const n = String(caseName || '').toLowerCase()
    const matches = n
        ? list.filter((d) => String(d.title || (d.content && d.content.name) || '').toLowerCase().includes(n))
        : []
    if (multiple) return matches.length ? matches : list
    return [matches[0] || list[0]]
}

// Felder mehrerer Quelldokumente zusammenführen: Listen werden aneinandergehängt,
// Objekte zusammengeführt, zwei Einzelwerte werden zu einer Liste.
export function mergeFields(target, add) {
    Object.entries(add || {}).forEach(([k, v]) => {
        if (v === undefined) return
        const cur = target[k]
        if (cur === undefined) target[k] = v
        else if (Array.isArray(cur)) target[k] = cur.concat(v)
        else if (cur && typeof cur === 'object' && v && typeof v === 'object' && !Array.isArray(v)) mergeFields(cur, v)
        else target[k] = [cur].concat(v)
    })
    return target
}
