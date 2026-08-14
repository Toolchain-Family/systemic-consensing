<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center p-4">
    <div class="w-full max-w-md bg-white rounded-lg shadow-lg overflow-hidden">
      <div class="bg-slate-700 text-white p-6 text-center">
        <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3">
          <span class="text-3xl">🤝</span>
        </div>
        <h1 class="text-xl font-semibold">Systemic Consensing</h1>
        <p class="text-slate-300 text-sm mt-1">Decision Making through Minimum Resistance</p>
      </div>

      <div class="p-6">
        <template v-if="AUTH_METHOD === 'jwt'">
          <div class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Benutzername</label>
              <input
                  type="text"
                  v-model="username"
                  placeholder="admin"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Passwort</label>
              <input
                  type="password"
                  v-model="password"
                  placeholder="••••••••"
                  @keyup.enter="login"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <p v-if="loginError" class="text-sm text-red-600">{{ loginError }}</p>
            <button
                @click="login"
                :disabled="!username || !password"
                class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Anmelden
            </button>
          </div>
        </template>

        <template v-else>
          <p class="text-sm text-gray-600 text-center mb-4">
            Melden Sie sich mit Ihrem Toolchain-Konto an, um Abstimmungen zu erstellen und daran teilzunehmen.
          </p>
          <button
              @click="loginOidc()"
              class="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Mit DocPouch anmelden
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { AUTH_METHOD, loginError, loginJwt, loginOidc } from '../composables/useAuth.js';

const username = ref('');
const password = ref('');

async function login() {
  await loginJwt(username.value, password.value);
}
</script>
