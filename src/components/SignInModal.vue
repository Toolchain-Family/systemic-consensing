<script setup>
defineProps({
  toolName: { type: String, required: true },
  dataDescription: { type: String, required: true },
})
defineEmits(['continueWithoutLogin', 'signIn'])
</script>

<template>
  <div class="signin-overlay">
    <div class="signin-card">
      <div class="signin-header">
        <div class="signin-icon">🔒</div>
        <div>
          <h3 class="signin-title">{{ toolName }}</h3>
          <p class="signin-subtitle">Sign in to DocPouch</p>
        </div>
      </div>
      <p class="signin-text">
        Please sign in via DocPouch to save and load your {{ dataDescription }}.
      </p>
      <button class="signin-btn" @click="$emit('signIn')">🔓 Sign in with DocPouch</button>
      <button class="continue-link" @click="$emit('continueWithoutLogin')">Continue without signing in</button>
    </div>
  </div>
</template>

<style scoped>
.signin-overlay { position: fixed; inset: 0; background: #3e4454; display: flex; align-items: center; justify-content: center; z-index: 1000; }
.signin-card { background: #ffffff; border-radius: 18px; padding: 28px 30px; max-width: 420px; width: 90%; box-shadow: 0 10px 30px rgba(0,0,0,0.25); }
.signin-header { display: flex; align-items: center; gap: 14px; margin-bottom: 18px; }
.signin-icon { width: 52px; height: 52px; border-radius: 50%; background: linear-gradient(135deg, #f9895d 0%, #f6789d 100%); display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0; }
.signin-title { margin: 0; font-size: 18px; font-weight: 700; color: #1f2937; }
.signin-subtitle { margin: 2px 0 0; font-size: 13px; color: #6b7280; }
.signin-text { font-size: 14px; color: #4b5563; margin: 0 0 20px; line-height: 1.5; }
.signin-btn { width: 100%; padding: 12px 16px; background: #2563eb; color: #fff; border: none; border-radius: 10px; font-size: 15px; font-weight: 600; cursor: pointer; }
.signin-btn:hover { background: #1d4ed8; }
.continue-link { display: block; width: 100%; margin-top: 12px; padding: 8px; background: transparent; border: none; color: #6b7280; font-size: 13px; text-align: center; cursor: pointer; text-decoration: underline; }
.continue-link:hover { color: #4b5563; }
</style>
