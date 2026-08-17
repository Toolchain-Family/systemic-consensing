<template>
  <header class="tool-header">
    <div class="tool-header-inner">
      <router-link v-if="homePath" to="/" class="tool-brand">
        <span class="tool-logo" v-if="logo">{{ logo }}</span>
        <h1 class="tool-title">{{ toolName }}</h1>
      </router-link>
      <h1 class="tool-title" v-else>{{ toolName }}</h1>
      <p class="tool-subtitle" v-if="subtitle">{{ subtitle }}</p>
      <p class="tool-metrics" v-if="metrics">{{ metrics }}</p>
    </div>
    <div class="tool-header-actions" v-if="$slots.default">
      <slot />
    </div>
  </header>
</template>

<script setup>
defineProps({
  toolName: { type: String, required: true },
  subtitle: { type: String, default: '' },
  logo:     { type: String, default: '🛠️' },
  metrics:  { type: String, default: '' },
  homePath: { type: String, default: '/' },   // '' = kein Link auf dem Titel
})
</script>

<style scoped>
.tool-header {
  position: relative;
  background: linear-gradient(90deg, #2e4154 0%, #32465b 100%);
  color: #fff;
  text-align: center;
  padding: 20px 24px;
}
.tool-header-inner {
  max-width: 1100px;
  margin: 0 auto;
}
.tool-brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #fff;
  text-decoration: none;
  transition: opacity 0.2s;
}
.tool-brand:hover { opacity: 0.9; }
.tool-logo { font-size: 26px; line-height: 1; }
.tool-title { font-size: 26px; font-weight: 700; margin: 0; line-height: 1.2; }
.tool-subtitle { font-size: 14px; color: rgba(255, 255, 255, 0.75); margin: 4px 0 0; }
.tool-metrics { font-size: 12px; color: rgba(255, 255, 255, 0.55); margin: 6px 0 0; }
.tool-header-actions {
  position: absolute;
  top: 14px;
  right: 16px;
  display: flex;
  gap: 8px;
}
</style>