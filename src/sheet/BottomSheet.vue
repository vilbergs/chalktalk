<script setup lang="ts">
import { nextTick, ref } from 'vue'

/** Controls, questions and answers live here, fixed to the bottom so the rink scrolls behind. */
const collapsed = ref(false)
const body = ref<HTMLElement>()

/** Expand, and optionally scroll an element inside the sheet into view. */
async function show(el?: HTMLElement | null) {
  collapsed.value = false
  if (!el) return
  await nextTick()
  setTimeout(() => {
    if (!body.value) return
    const top = el.getBoundingClientRect().top - body.value.getBoundingClientRect().top + body.value.scrollTop
    body.value.scrollTo({ top: Math.max(0, top - 6), behavior: 'smooth' })
  }, 60)
}

defineExpose({ show })
</script>

<template>
  <section class="sheet" :class="{ collapsed }">
    <button class="handle" :aria-expanded="!collapsed" aria-label="Collapse or expand panel" @click="collapsed = !collapsed">
      <span class="pill" />
      <span>{{ collapsed ? 'Show panel' : 'Hide panel' }}</span>
    </button>
    <div ref="body" class="body">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.sheet {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 5;
  max-width: 460px;
  margin: 0 auto;
  max-height: 52vh;
  display: flex;
  flex-direction: column;
  background: var(--card);
  border: 1px solid var(--line);
  border-bottom: none;
  border-radius: 18px 18px 0 0;
  box-shadow: 0 -6px 24px rgba(0, 0, 0, 0.08);
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
@media (prefers-reduced-motion: no-preference) {
  .sheet {
    transition: max-height 0.25s ease;
  }
}
.sheet.collapsed {
  max-height: calc(44px + env(safe-area-inset-bottom, 0px));
}
.sheet.collapsed .body {
  overflow: hidden;
}
.handle {
  width: 100%;
  border: none;
  background: transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 0 4px;
  min-height: 44px;
  font-size: 12px;
  color: var(--muted);
  border-radius: 18px 18px 0 0;
  flex-shrink: 0;
}
.handle:active {
  transform: none;
}
.pill {
  width: 40px;
  height: 5px;
  border-radius: 3px;
  background: var(--line);
}
.body {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}
</style>
