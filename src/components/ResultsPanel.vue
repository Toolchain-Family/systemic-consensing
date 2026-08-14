<template>
  <div class="space-y-6">

    <div v-if="votedCount === 0" class="text-center py-12">
      <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <span class="text-2xl">📊</span>
      </div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">Waiting for Votes</h3>
      <p class="text-gray-600">Results will appear once participants start voting.</p>
    </div>

    <div v-else-if="!hasVoted" class="text-center py-12">
      <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <span class="text-2xl">🗳️</span>
      </div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">Submit Your Vote First</h3>
      <p class="text-gray-600 mb-4">Results will be visible after you submit your votes.</p>
      <button
          @click="$emit('go-voting')"
          class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
      >
        Go to Voting
      </button>
    </div>

    <div v-else class="space-y-6">

      <div v-if="sortedResults.length > 0" class="bg-green-50 border border-green-200 rounded-lg p-6">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mr-4">
            <span class="text-white text-xl">🏆</span>
          </div>
          <div>
            <h3 class="text-green-800 font-bold text-lg">Consensus Result</h3>
            <p class="text-green-700">
              <strong>{{ sortedResults[0]?.option }}</strong> -
              Total resistance: {{ sortedResults[0]?.total }} points
            </p>
          </div>
        </div>
      </div>

      <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div class="bg-gray-50 px-6 py-3 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">Detailed Results</h3>
          <p class="text-sm text-gray-600">Sorted by lowest total resistance</p>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Option</th>
              <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Total Resistance</th>
              <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Average</th>
              <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Votes</th>
            </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="(item, index) in sortedResults" :key="item.option"
                :class="index === 0 ? 'bg-green-50' : ''">
              <td class="px-6 py-4 whitespace-nowrap">
                <span v-if="index === 0" class="text-green-600 font-bold">#{{ index + 1 }} 🏆</span>
                <span v-else class="text-gray-900 font-medium">#{{ index + 1 }}</span>
              </td>
              <td class="px-6 py-4">
                <div class="font-medium text-gray-900">{{ item.option }}</div>
              </td>
              <td class="px-6 py-4 text-center">
                <span class="text-lg font-bold text-gray-900">{{ item.total }}</span>
              </td>
              <td class="px-6 py-4 text-center">
                <span class="text-gray-900">{{ item.average.toFixed(1) }}</span>
              </td>
              <td class="px-6 py-4 text-center">
                <span class="text-gray-900">{{ item.participants }}</span>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="bg-white border border-gray-200 rounded-lg p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Average Resistance Comparison</h3>
        <div class="space-y-3">
          <div v-for="item in sortedResults" :key="item.option" class="space-y-1">
            <div class="flex justify-between text-sm">
              <span class="font-medium text-gray-900">{{ item.option }}</span>
              <span class="text-gray-600">{{ item.average.toFixed(1) }}</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-3">
              <div
                  class="bg-gradient-to-r from-green-500 to-red-500 h-3 rounded-full transition-all duration-1000"
                  :style="{ width: `${(item.average / 10) * 100}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  sortedResults: { type: Array, default: () => [] },
  votedCount: { type: Number, default: 0 },
  hasVoted: { type: Boolean, default: false },
});

defineEmits(['go-voting']);
</script>
