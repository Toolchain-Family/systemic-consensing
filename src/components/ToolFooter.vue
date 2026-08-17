<template>
  <footer class="tool-footer">
    <p>
      © 2026 {{ toolName }} · Toolchain
      <template v-if="connected !== null">
        <span v-if="connected"> · DocPouch: connected</span>
        <span v-else> · DocPouch: not connected</span>
      </template>
      <template v-if="configLoaded !== null">
        <span v-if="configLoaded"> · configuration loaded (doc <code>{{ configDocId }}</code>)</span>
        <span v-else-if="connected === true"> · configuration not loaded<span v-if="configLoadError"> ({{ configLoadError }})</span></span>
      </template>
    </p>
  </footer>
</template>

<script setup>
defineProps({
  toolName:        { type: String, required: true },
  connected:       { type: Boolean, default: null },   // null = Status nicht anzeigen
  configLoaded:    { type: Boolean, default: null },
  configDocId:     { type: String, default: '' },
  configLoadError: { type: String, default: '' },
})
</script>

<style scoped>
.tool-footer {
  background: #2c3e50;
  color: #fff;
  text-align: center;
  padding: 16px 24px;
  font-size: 14px;
}
.tool-footer p { margin: 0; }
.tool-footer code { background: rgba(255, 255, 255, 0.15); border-radius: 4px; padding: 1px 5px; font-size: 12px; }
</style>