<template>
  <div class="help-overlay" @click.self="$emit('close')">
    <div class="help-card">
      <div class="help-header">
        <span class="help-title">Help</span>
        <button class="help-close" title="Close" @click="$emit('close')">&#10005;</button>
      </div>
      <div class="help-body" v-html="html"></div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HelpModal',
  props: {
    content: { type: String, default: '' }
  },
  computed: {
    html() {
      return this.renderMarkdown(this.content);
    }
  },
  methods: {
    renderMarkdown(src) {
      const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const inline = (t) => t
        .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
      const lines = String(src).replace(/\r\n/g, '\n').split('\n');
      let html = '';
      let i = 0;
      while (i < lines.length) {
        const line = lines[i];
        if (/^\s*$/.test(line)) { i++; continue; }
        if (/^```/.test(line)) {
          let buf = [];
          i++;
          while (i < lines.length && !/^```/.test(lines[i])) { buf.push(lines[i]); i++; }
          i++;
          html += '<pre>' + esc(buf.join('\n')) + '</pre>\n';
          continue;
        }
        if (/^#{1,4}\s/.test(line)) {
          const m = line.match(/^(#{1,4})\s+(.*)$/);
          html += '<h' + m[1].length + '>' + inline(m[2]) + '</h' + m[1].length + '>\n';
          i++;
          continue;
        }
        if (/^[-*]\s+/.test(line) || /^\d+\.\s+/.test(line)) {
          let items = [];
          while (i < lines.length && (/^[-*]\s+/.test(lines[i]) || /^\d+\.\s+/.test(lines[i]))) {
            items.push('<li>' + inline(lines[i].replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '')) + '</li>');
            i++;
          }
          html += '<ul>' + items.join('') + '</ul>\n';
          continue;
        }
        if (/^>/.test(line)) {
          let buf = [];
          while (i < lines.length && /^>/.test(lines[i])) { buf.push(inline(lines[i].replace(/^>\s?/, ''))); i++; }
          html += '<blockquote>' + buf.join('<br>') + '</blockquote>\n';
          continue;
        }
        if (/^---+\s*$/.test(line)) { html += '<hr>\n'; i++; continue; }
        let buf = [];
        while (i < lines.length && !/^\s*$/.test(lines[i]) && !/^#{1,4}\s/.test(lines[i]) && !/^```/.test(lines[i]) && !/^[-*]\s+/.test(lines[i]) && !/^\d+\.\s+/.test(lines[i]) && !/^>/.test(lines[i])) {
          buf.push(inline(lines[i]));
          i++;
        }
        html += '<p>' + buf.join('<br>') + '</p>\n';
      }
      return html;
    }
  }
};
</script>

<style>
.help-overlay {
  position: fixed;
  inset: 0;
  background: rgba(62, 68, 84, 0.65);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.help-card {
  background: #fff;
  border-radius: 18px;
  width: 100%;
  max-width: 720px;
  max-height: 82vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
}
.help-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}
.help-title {
  font-size: 18px;
  font-weight: 700;
  color: #222;
}
.help-close {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: none;
  background: #f0f0f0;
  color: #555;
  font-size: 15px;
  cursor: pointer;
  line-height: 1;
}
.help-close:hover {
  background: #e2e2e2;
}
.help-body {
  overflow-y: auto;
  padding: 20px;
  font-size: 14px;
  line-height: 1.6;
  color: #333;
}
.help-body h1 { font-size: 20px; margin: 0 0 10px; }
.help-body h2 { font-size: 17px; margin: 18px 0 8px; }
.help-body h3 { font-size: 15px; margin: 16px 0 6px; }
.help-body h4 { font-size: 14px; margin: 14px 0 6px; }
.help-body pre {
  background: #f6f8fa;
  border-radius: 8px;
  padding: 12px;
  overflow-x: auto;
  font-size: 13px;
  margin: 10px 0;
}
.help-body code {
  background: #f0f2f5;
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 13px;
}
.help-body ul { padding-left: 20px; margin: 8px 0; }
.help-body li { margin: 4px 0; }
.help-body p { margin: 10px 0; }
.help-body a { color: #2563eb; }
.help-body blockquote {
  border-left: 3px solid #ddd;
  margin: 10px 0;
  padding-left: 12px;
  color: #555;
}
.help-body hr { border: none; border-top: 1px solid #eee; margin: 16px 0; }
</style>
