<template>
  <div class="space-y-6">

    <!-- Session Management -->
    <div class="bg-white rounded-lg p-4 shadow-sm">
      <h3 class="text-sm font-semibold text-gray-900 mb-3">Session Management</h3>

      <div class="grid grid-cols-3 gap-1 mb-3">
        <button
            @click="sessionMode = 'join'"
            :class="[
            'px-2 py-2 text-xs font-medium rounded transition-colors',
            sessionMode === 'join'
              ? 'bg-blue-100 text-blue-700 border border-blue-300'
              : 'bg-gray-100 text-gray-700 border border-gray-300'
          ]"
        >
          Join
        </button>
        <button
            @click="sessionMode = 'create'"
            :class="[
            'px-2 py-2 text-xs font-medium rounded transition-colors',
            sessionMode === 'create'
              ? 'bg-green-100 text-green-700 border border-green-300'
              : 'bg-gray-100 text-gray-700 border border-gray-300'
          ]"
        >
          Create
        </button>
        <button
            @click="sessionMode = 'import'"
            :class="[
            'px-2 py-2 text-xs font-medium rounded transition-colors',
            sessionMode === 'import'
              ? 'bg-purple-100 text-purple-700 border border-purple-300'
              : 'bg-gray-100 text-gray-700 border border-gray-300'
          ]"
        >
          Import
        </button>
      </div>

      <!-- Join Session Form -->
      <div v-if="sessionMode === 'join'" class="space-y-2">
        <label class="block text-xs font-medium text-gray-700">Session ID</label>
        <input
            type="text"
            placeholder="Enter Session ID"
            v-model="joinSessionId"
            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
            @click="join"
            class="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
        >
          Join Session
        </button>

        <div v-if="sessions.length > 0" class="pt-2">
          <label class="block text-xs font-medium text-gray-700 mb-1">Available Sessions:</label>
          <div class="space-y-1 max-h-40 overflow-y-auto">
            <button
                v-for="s in sessions"
                :key="s._id"
                @click="joinSessionById(s._id)"
                class="w-full text-left px-3 py-2 text-xs bg-gray-50 hover:bg-blue-50 rounded border border-gray-200 transition-colors"
            >
              <div class="font-medium text-gray-900">{{ s.question }}</div>
              <div class="text-gray-500">{{ s._id.slice(0, 8) }}… · {{ s.options.length }} options</div>
            </button>
          </div>
        </div>
      </div>

      <!-- Import JSON Form -->
      <div v-if="sessionMode === 'import'" class="space-y-2">
        <label class="block text-xs font-medium text-gray-700">Import JSON File</label>
        <input
            type="file"
            accept=".json"
            @change="handleFileUpload"
            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />

        <div v-if="importedData" class="space-y-3 mt-3 p-3 bg-purple-50 rounded border">
          <div class="text-xs font-medium text-purple-900">
            📄 {{ importedData.title || 'Imported Document' }}
          </div>

          <div v-if="availableCategories.length > 0">
            <label class="block text-xs font-medium text-gray-700 mb-1">Vote on Category:</label>
            <select
                v-model="selectedCategory"
                class="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select category...</option>
              <option v-for="cat in availableCategories" :key="cat" :value="cat">
                {{ cat }} ({{ getCategoryItems(cat).length }} items)
              </option>
            </select>
          </div>

          <div v-if="selectedCategory" class="max-h-32 overflow-y-auto">
            <div class="text-xs font-medium text-gray-700 mb-1">Preview:</div>
            <div class="space-y-1">
              <div v-for="(item, index) in getCategoryItems(selectedCategory).slice(0, 3)"
                   :key="index"
                   class="text-xs p-2 bg-white rounded border">
                {{ item.description || item.name || item.title || JSON.stringify(item) }}
              </div>
              <div v-if="getCategoryItems(selectedCategory).length > 3"
                   class="text-xs text-gray-500 text-center">
                ... and {{ getCategoryItems(selectedCategory).length - 3 }} more
              </div>
            </div>
          </div>

          <button
              @click="createFromImport"
              :disabled="!selectedCategory"
              class="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Create Session from Import
          </button>
        </div>
      </div>

      <!-- Create Session Form -->
      <div v-if="sessionMode === 'create'" class="space-y-2">
        <button
            @click="showCreateForm = !showCreateForm"
            class="w-full bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
        >
          {{ showCreateForm ? 'Cancel' : 'Create Session' }}
        </button>

        <div v-if="showCreateForm" class="space-y-3 pt-2 border-t border-gray-200">
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Question</label>
            <textarea
                v-model="newSession.question"
                placeholder="What are we deciding on?"
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="2"
            ></textarea>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Options (one per line)</label>
            <textarea
                v-model="newSession.optionsText"
                placeholder="Option 1&#10;Option 2&#10;Option 3"
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="4"
            ></textarea>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Duration (hours)</label>
            <input
                type="number"
                v-model.number="newSession.hours"
                min="1"
                max="168"
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
              @click="create"
              :disabled="!canCreateSession"
              class="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Create & Start
          </button>
        </div>
      </div>
    </div>

    <!-- Session Info -->
    <div v-if="currentSession" class="bg-white rounded-lg p-4 shadow-sm">
      <h3 class="text-sm font-semibold text-gray-900 mb-3">Current Session</h3>
      <div class="space-y-2 text-xs">
        <div class="flex justify-between">
          <span class="text-gray-600">Session ID:</span>
          <span class="font-mono text-gray-900">{{ currentSession._id?.slice(0, 8) }}...</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">Participants:</span>
          <span class="font-semibold text-gray-900">{{ participantCount }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">Voted:</span>
          <span class="font-semibold text-gray-900">{{ votedCount }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">Time Left:</span>
          <span class="font-semibold text-blue-600">{{ timeRemaining }}</span>
        </div>
      </div>
    </div>

    <!-- Export Options -->
    <div v-if="currentSession && hasVoted && sortedResults.length > 0" class="bg-white rounded-lg p-4 shadow-sm">
      <h3 class="text-sm font-semibold text-gray-900 mb-3">Export Results</h3>
      <div class="grid grid-cols-2 gap-2">
        <button @click="$emit('export', 'csv')"
                class="px-3 py-2 text-xs font-medium bg-green-100 text-green-700 border border-green-300 rounded hover:bg-green-200 transition-colors">
          📊 CSV
        </button>
        <button @click="$emit('export', 'json')"
                class="px-3 py-2 text-xs font-medium bg-blue-100 text-blue-700 border border-blue-300 rounded hover:bg-blue-200 transition-colors">
          📋 JSON
        </button>
        <button @click="$emit('export', 'markdown')"
                class="px-3 py-2 text-xs font-medium bg-purple-100 text-purple-700 border border-purple-300 rounded hover:bg-purple-200 transition-colors">
          📝 Markdown
        </button>
        <button @click="$emit('export', 'excel')"
                class="px-3 py-2 text-xs font-medium bg-orange-100 text-orange-700 border border-orange-300 rounded hover:bg-orange-200 transition-colors">
          📈 Excel
        </button>
      </div>
    </div>

    <div class="bg-blue-50 rounded-lg p-4">
      <h4 class="text-sm font-semibold text-blue-900 mb-2">How it works:</h4>
      <ol class="text-xs text-blue-800 space-y-1">
        <li>1. Rate your resistance (0-10) to each option</li>
        <li>2. 0 = No resistance, 10 = Strong opposition</li>
        <li>3. Option with lowest total wins</li>
        <li>4. Results visible after voting</li>
      </ol>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  userName: { type: String, default: '' },
  sessions: { type: Array, default: () => [] },
  currentSession: { type: Object, default: null },
  participantCount: { type: Number, default: 0 },
  votedCount: { type: Number, default: 0 },
  timeRemaining: { type: String, default: '' },
  hasVoted: { type: Boolean, default: false },
  sortedResults: { type: Array, default: () => [] },
});

const emit = defineEmits(['join', 'create', 'create-from-import', 'export']);

const sessionMode = ref('join');
const joinSessionId = ref('');
const showCreateForm = ref(false);
const importedData = ref(null);
const selectedCategory = ref('');
const availableCategories = ref([]);
const fileInput = ref(null);

const newSession = ref({
  question: '',
  optionsText: '',
  hours: 24,
});

const canCreateSession = computed(() => {
  return newSession.value.question.trim()
      && newSession.value.optionsText.trim()
      && newSession.value.optionsText.split('\n').filter(o => o.trim()).length >= 2;
});

function join() {
  if (!joinSessionId.value.trim()) return;
  emit('join', joinSessionId.value.trim());
}

function joinSessionById(id) {
  emit('join', id);
}

function create() {
  if (!canCreateSession.value) return;
  const options = newSession.value.optionsText
      .split('\n')
      .map(o => o.trim())
      .filter(o => o.length > 0);
  emit('create', {
    question: newSession.value.question.trim(),
    options,
    endTime: new Date(Date.now() + (newSession.value.hours || 24) * 60 * 60 * 1000).toISOString(),
  });
  newSession.value = { question: '', optionsText: '', hours: 24 };
  showCreateForm.value = false;
  sessionMode.value = 'join';
}

function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      importedData.value = data;
      detectCategories(data);
    } catch (error) {
      alert('Invalid JSON file. Please check the format.');
      console.error('JSON parsing error:', error);
    }
  };
  reader.readAsText(file);
}

function detectCategories(data) {
  const categories = [];
  if (data.swot) {
    Object.keys(data.swot).forEach(key => {
      if (Array.isArray(data.swot[key]) && data.swot[key].length > 0) {
        categories.push(key);
      }
    });
  }
  Object.keys(data).forEach(key => {
    if (Array.isArray(data[key]) && data[key].length > 0) {
      const firstItem = data[key][0];
      if (typeof firstItem === 'object' && (firstItem.description || firstItem.name || firstItem.title)) {
        categories.push(key);
      }
    }
  });
  availableCategories.value = [...new Set(categories)];
}

function getCategoryItems(category) {
  if (!importedData.value) return [];
  if (importedData.value.swot && importedData.value.swot[category]) {
    return importedData.value.swot[category];
  }
  if (Array.isArray(importedData.value[category])) {
    return importedData.value[category];
  }
  return [];
}

function createFromImport() {
  if (!selectedCategory.value || !importedData.value) return;
  const items = getCategoryItems(selectedCategory.value);
  const options = items.map((item, index) => {
    return item.description || item.name || item.title || `Item ${index + 1}`;
  });
  emit('create-from-import', {
    question: `Vote on ${selectedCategory.value} from: ${importedData.value.title || 'Imported Document'}`,
    options,
    endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    importedData: importedData.value,
    category: selectedCategory.value,
    originalItems: items,
  });
  importedData.value = null;
  selectedCategory.value = '';
  availableCategories.value = [];
  sessionMode.value = 'join';
}
</script>
