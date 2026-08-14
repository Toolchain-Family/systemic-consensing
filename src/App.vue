<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-400 to-purple-600 p-4">

    <!-- Auth loading -->
    <div v-if="!authInitialized" class="min-h-screen flex items-center justify-center">
      <div class="text-white text-lg">Loading...</div>
    </div>

    <!-- Login -->
    <LoginView v-else-if="!isAuthenticated" />

    <!-- Main App -->
    <div v-else class="max-w-7xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">

      <!-- Header Section -->
      <div class="bg-slate-700 text-white p-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-white rounded flex items-center justify-center">
              <span class="text-slate-700 font-bold">🤝</span>
            </div>
            <h1 class="text-xl font-semibold">Systemic Consensing Tool</h1>
          </div>
          <div class="flex items-center space-x-4">
            <div class="text-sm text-slate-300">
              Decision Making through Minimum Resistance
            </div>
            <button
                @click="logout()"
                class="text-xs px-3 py-1.5 bg-slate-600 hover:bg-slate-500 rounded transition-colors"
            >
              Logout ({{ userName }})
            </button>
          </div>
        </div>
      </div>

      <!-- Navigation Bar -->
      <div class="bg-slate-100 border-b border-gray-200 px-4 py-2">
        <div class="flex items-center justify-between">
          <div class="flex space-x-1">
            <button
                v-for="tab in tabs"
                :key="tab.id"
                @click="activeTab = tab.id"
                :class="[
                'px-4 py-2 text-sm font-medium rounded transition-colors',
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              ]"
            >
              {{ tab.label }}
            </button>
          </div>
          <div class="text-sm text-gray-500">
            <span v-if="sessionsLoading">Loading sessions…</span>
            <span v-else>{{ sessions.length }} sessions</span>
          </div>
        </div>
      </div>

      <!-- Main Content Area -->
      <div class="flex min-h-[600px]">

        <!-- Sidebar -->
        <div class="w-80 bg-gray-50 border-r border-gray-200 p-4">
          <SessionSidebar
              :user-name="userName"
              :sessions="sessions"
              :current-session="currentSession"
              :participant-count="participantCount"
              :voted-count="votedCount"
              :time-remaining="timeRemaining"
              :has-voted="hasVoted"
              :sorted-results="sortedResults"
              @join="joinSession"
              @create="createSession"
              @create-from-import="createSessionFromImport"
              @export="exportResults"
          />
        </div>

        <!-- Main Content -->
        <div class="flex-1 p-6">

          <!-- Welcome Screen -->
          <div v-if="!currentSession" class="text-center py-12">
            <div class="max-w-md mx-auto">
              <div class="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span class="text-3xl">🤝</span>
              </div>
              <h2 class="text-2xl font-bold text-gray-900 mb-2">Welcome to Systemic Consensing</h2>
              <p class="text-gray-600 mb-6">Make decisions through minimum resistance rather than maximum approval.</p>
              <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p class="text-yellow-800 text-sm">👈 Create a new session or join an existing one in the sidebar</p>
              </div>
            </div>
          </div>

          <!-- Session Content -->
          <div v-else>

            <!-- Question Header -->
            <div class="mb-6">
              <h2 class="text-2xl font-bold text-gray-900 mb-2">{{ currentSession.question }}</h2>
              <div class="flex items-center space-x-4 text-sm text-gray-600">
                <span>{{ currentSession.options.length }} options</span>
                <span>•</span>
                <span>{{ votedCount }}/{{ participantCount }} voted</span>
                <span>•</span>
                <span class="text-blue-600 font-medium">{{ timeRemaining }}</span>
              </div>
            </div>

            <!-- Voting Tab -->
            <VotingPanel
                v-if="activeTab === 'voting'"
                :key="currentSession._id"
                :session="currentSession"
                :has-voted="hasVoted"
                :is-voting-active="isVotingActive"
                @submit="submitVotes"
            />

            <!-- Results Tab -->
            <ResultsPanel
                v-if="activeTab === 'results'"
                :sorted-results="sortedResults"
                :voted-count="votedCount"
                :has-voted="hasVoted"
                @go-voting="activeTab = 'voting'"
            />

            <!-- About Tab -->
            <AboutPanel v-if="activeTab === 'about'" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import LoginView from './components/LoginView.vue';
import SessionSidebar from './components/SessionSidebar.vue';
import VotingPanel from './components/VotingPanel.vue';
import ResultsPanel from './components/ResultsPanel.vue';
import AboutPanel from './components/AboutPanel.vue';
import {
  isAuthenticated, authInitialized, userName, initAuth, logout,
} from './composables/useAuth.js';
import {
  sessions, currentSession, sessionsLoading, loadSessions,
  createSession as createDocSession, joinSession as joinDocSession,
  submitVotes as persistVotes,
} from './composables/useConsensusData.js';

const activeTab = ref('voting');

const tabs = [
  { id: 'voting', label: 'Voting' },
  { id: 'results', label: 'Results' },
  { id: 'about', label: 'About' },
];

onMounted(async () => {
  await initAuth();
  if (isAuthenticated.value) {
    await loadSessions();
  }
});

const participantCount = computed(() => {
  if (!currentSession.value) return 0;
  return Object.keys(currentSession.value.votes || {}).length;
});

const votedCount = computed(() => {
  if (!currentSession.value) return 0;
  return Object.values(currentSession.value.votes || {}).filter(p => p.hasVoted).length;
});

const hasVoted = computed(() => {
  if (!currentSession.value || !userName.value) return false;
  return currentSession.value.votes?.[userName.value]?.hasVoted || false;
});

const isVotingActive = computed(() => {
  if (!currentSession.value) return false;
  if (!currentSession.value.endTime) return true;
  return new Date(currentSession.value.endTime) > new Date();
});

const timeRemaining = computed(() => {
  if (!currentSession.value?.endTime) return 'No limit';
  const remaining = new Date(currentSession.value.endTime) - new Date();
  if (remaining <= 0) return 'Ended';
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
});

const sortedResults = computed(() => {
  if (!currentSession.value) return [];

  const results = {};
  const participation = {};
  currentSession.value.options.forEach(option => {
    results[option] = 0;
    participation[option] = 0;
  });

  Object.values(currentSession.value.votes || {}).forEach(participant => {
    if (participant.hasVoted) {
      Object.entries(participant.votes).forEach(([option, resistance]) => {
        if (results[option] !== undefined) {
          results[option] += resistance;
          participation[option] += 1;
        }
      });
    }
  });

  return currentSession.value.options
      .map(option => ({
        option,
        total: results[option],
        average: participation[option] > 0 ? results[option] / participation[option] : 0,
        participants: participation[option],
      }))
      .sort((a, b) => a.total - b.total);
});

async function joinSession(sessionId) {
  const session = await joinDocSession(sessionId, userName.value);
  if (!session) {
    alert('Session not found.');
    return;
  }
  activeTab.value = 'voting';
}

async function createSession(payload) {
  const session = await createDocSession(payload);
  await joinDocSession(session._id, userName.value);
  activeTab.value = 'voting';
}

async function createSessionFromImport(payload) {
  const session = await createDocSession(payload);
  await joinDocSession(session._id, userName.value);
  activeTab.value = 'voting';
}

async function submitVotes(votes) {
  if (!currentSession.value || !userName.value) return;
  await persistVotes(currentSession.value, userName.value, votes);
  activeTab.value = 'results';
}

// --- Export ---
function exportResults(format) {
  if (!currentSession.value || !sortedResults.value.length) return;

  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `systemic-consensus-results-${timestamp}`;

  switch (format) {
    case 'csv':
      exportCSV(filename);
      break;
    case 'json':
      exportJSON(filename);
      break;
    case 'markdown':
      exportMarkdown(filename);
      break;
    case 'excel':
      exportExcel(filename);
      break;
  }
}

const exportCSV = (filename) => {
  const headers = ['Rank', 'Option', 'Total Resistance', 'Average Resistance', 'Participants Voted'];
  const rows = sortedResults.value.map((item, index) => [
    index + 1,
    `"${item.option}"`,
    item.total,
    item.average.toFixed(2),
    item.participants,
  ]);
  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  downloadFile(csvContent, `${filename}.csv`, 'text/csv');
};

const exportJSON = (filename) => {
  const exportData = {
    session: {
      id: currentSession.value._id,
      question: currentSession.value.question,
      timestamp: new Date().toISOString(),
      participants: participantCount.value,
      votedCount: votedCount.value,
    },
    results: sortedResults.value.map((item, index) => ({
      rank: index + 1,
      option: item.option,
      totalResistance: item.total,
      averageResistance: parseFloat(item.average.toFixed(2)),
      participantsVoted: item.participants,
    })),
    winner: sortedResults.value[0]?.option,
    originalData: currentSession.value.importedData || null,
  };
  downloadFile(JSON.stringify(exportData, null, 2), `${filename}.json`, 'application/json');
};

const exportMarkdown = (filename) => {
  const markdown = `# Systemic Consensus Results

## Session Information
- **Question:** ${currentSession.value.question}
- **Date:** ${new Date().toLocaleDateString()}
- **Participants:** ${participantCount.value}
- **Voted:** ${votedCount.value}

## 🏆 Winner
**${sortedResults.value[0]?.option}** - Total resistance: ${sortedResults.value[0]?.total} points

## Detailed Results
(Sorted by lowest resistance)

| Rank | Option | Total Resistance | Average | Votes |
|------|--------|------------------|---------|-------|
${sortedResults.value.map((item, index) =>
    `| ${index + 1} | ${item.option} | ${item.total} | ${item.average.toFixed(1)} | ${item.participants} |`
).join('\n')}

## About Systemic Consensus
Systemic Consensus identifies the option with the least resistance rather than the most approval, creating decisions the entire group can accept.
`;
  downloadFile(markdown, `${filename}.md`, 'text/markdown');
};

const exportExcel = (filename) => {
  const headers = ['Rank', 'Option', 'Total Resistance', 'Average Resistance', 'Participants Voted'];
  const rows = sortedResults.value.map((item, index) => [
    index + 1,
    item.option,
    item.total,
    item.average.toFixed(2),
    item.participants,
  ]);
  const tsvContent = [headers.join('\t'), ...rows.map(row => row.join('\t'))].join('\n');
  downloadFile(tsvContent, `${filename}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
};

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
</script>
