import { ref } from 'vue';
import { dpClient, currentUserId } from './useAuth.js';
import { CONSENSUS_STRUCTURE, TOOL_NAME } from '../config/docpouch.js';

const sessions = ref([]);
const currentSession = ref(null);
const sessionsLoading = ref(false);
const loadError = ref('');

const DEFAULT_TITLE = 'Systemic Consensing';

function serializeSession(session) {
    return {
        title: session.title || DEFAULT_TITLE,
        question: session.question,
        options: Array.isArray(session.options) ? session.options : [],
        endTime: session.endTime || null,
        status: session.status || 'open',
        votes: session.votes || {},
        importedData: session.importedData || null,
        category: session.category || null,
        originalItems: session.originalItems || null,
    };
}

function deserializeSession(doc) {
    const c = doc.content || {};
    return {
        _id: doc._id,
        owner: doc.owner || '',
        ...c,
        votes: c.votes || {},
    };
}

export async function loadSessions() {
    sessionsLoading.value = true;
    loadError.value = '';
    try {
        const docs = await dpClient.fetchDocuments({
            type: CONSENSUS_STRUCTURE.type,
            subType: CONSENSUS_STRUCTURE.subType,
        });
        sessions.value = (docs || []).map(deserializeSession);
    } catch (e) {
        loadError.value = e.message || 'Sessions konnten nicht geladen werden.';
    } finally {
        sessionsLoading.value = false;
    }
}

export async function createSession(payload) {
    const session = {
        title: payload.question,
        question: payload.question,
        options: payload.options,
        endTime: payload.endTime,
        status: 'open',
        votes: {},
        importedData: payload.importedData || null,
        category: payload.category || null,
        originalItems: payload.originalItems || null,
    };
    const base = {
        type: CONSENSUS_STRUCTURE.type,
        subType: CONSENSUS_STRUCTURE.subType,
        title: `${DEFAULT_TITLE} — ${payload.question}`,
        shareWithGroup: false,
        shareWithDepartment: false,
        public: false,
        content: serializeSession(session),
    };
    const created = await dpClient.createDocument(base);
    const doc = deserializeSession(created);
    sessions.value.unshift(doc);
    return doc;
}

// Teilnehmer der Session anmelden (leerer Stimmzettel) und Session als aktiv setzen
export async function joinSession(sessionId, participant) {
    const session = sessions.value.find(s => s._id === sessionId);
    if (!session) return null;
    if (!session.votes[participant]) {
        session.votes[participant] = { hasVoted: false, votes: {} };
        await persist(session);
    }
    currentSession.value = session;
    return session;
}

export async function submitVotes(session, participant, votes) {
    const next = { ...session.votes, [participant]: { hasVoted: true, votes: { ...votes } } };
    session.votes = next;
    await persist(session);
    return session;
}

export async function persist(session) {
    const base = {
        type: CONSENSUS_STRUCTURE.type,
        subType: CONSENSUS_STRUCTURE.subType,
        title: session.title || `${DEFAULT_TITLE} — ${session.question}`,
        shareWithGroup: false,
        shareWithDepartment: false,
        public: false,
        content: serializeSession(session),
    };
    const canUpdate = !session.owner
        || (currentUserId.value && session.owner === currentUserId.value);
    if (session._id && canUpdate) {
        await dpClient.updateDocument(session._id, base);
    } else {
        const created = await dpClient.createDocument(base);
        session._id = created._id;
        session.owner = currentUserId.value || '';
        // Liste aktualisieren, falls der Session-Datensatz noch nicht enthalten ist
        if (!sessions.value.some(s => s._id === session._id)) {
            sessions.value.unshift(deserializeSession(created));
        }
    }
    return session;
}

export { sessions, currentSession, sessionsLoading, loadError, TOOL_NAME };
