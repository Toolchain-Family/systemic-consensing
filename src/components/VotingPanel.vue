<template>
  <div class="space-y-6">

    <!-- Voting Status -->
    <div v-if="hasVoted" class="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
      <div class="flex items-center">
        <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
          <span class="text-white text-sm">✓</span>
        </div>
        <div>
          <h3 class="text-green-800 font-medium">Vote Submitted</h3>
          <p class="text-green-700 text-sm">You have successfully voted in this session.</p>
        </div>
      </div>
    </div>

    <div v-else-if="!isVotingActive" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <div class="flex items-center">
        <div class="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center mr-3">
          <span class="text-white text-sm">⏰</span>
        </div>
        <div>
          <h3 class="text-yellow-800 font-medium">Voting Period Ended</h3>
          <p class="text-yellow-700 text-sm">No more votes can be submitted.</p>
        </div>
      </div>
    </div>

    <!-- Voting Form -->
    <div v-if="isVotingActive && !hasVoted" class="space-y-6">

      <div class="bg-blue-50 rounded-lg p-4">
        <h3 class="text-blue-900 font-medium mb-2">Cast Your Vote</h3>
        <p class="text-blue-800 text-sm mb-3">Rate your resistance to each option from 0 (no resistance) to 10 (strong opposition).</p>
        <div class="flex justify-between text-xs text-blue-700 mb-2">
          <span>No resistance</span>
          <span>Strong opposition</span>
        </div>
        <div class="w-full h-1 bg-gradient-to-r from-green-400 to-red-400 rounded"></div>
      </div>

      <div class="space-y-4">
        <div v-for="option in session.options" :key="option" class="bg-white border border-gray-200 rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <h4 class="font-medium text-gray-900">{{ option }}</h4>
            <span v-if="votes[option] !== undefined" class="text-sm font-medium text-blue-600">{{ votes[option] }}</span>
          </div>
          <div class="flex justify-between items-center">
            <label v-for="value in scale" :key="value" class="flex flex-col items-center cursor-pointer">
              <input
                  type="radio"
                  :name="`vote-${option}`"
                  :value="value"
                  v-model.number="votes[option]"
                  class="mb-1"
              />
              <span class="text-xs text-gray-600">{{ value }}</span>
            </label>
          </div>
        </div>
      </div>

      <div class="flex justify-center pt-4">
        <button
            @click="submit"
            :disabled="!canSubmitVotes"
            class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-medium transition-colors"
            title="Submit All Votes"
        >
          Submit All Votes
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  session: { type: Object, required: true },
  hasVoted: { type: Boolean, default: false },
  isVotingActive: { type: Boolean, default: true },
});

const emit = defineEmits(['submit']);

const scale = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const votes = ref({});

function initVotes() {
  votes.value = {};
  props.session.options.forEach(option => {
    votes.value[option] = undefined;
  });
}

initVotes();

const canSubmitVotes = computed(() => {
  return props.session.options.every(option => votes.value[option] !== undefined);
});

function submit() {
  emit('submit', { ...votes.value });
}
</script>
