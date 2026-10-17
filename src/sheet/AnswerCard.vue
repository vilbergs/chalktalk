<script setup lang="ts">
defineProps<{
  title: string
  rows: { label: string; text: string }[]
}>()
</script>

<template>
  <div class="answer section">
    <h2>{{ title }}</h2>
    <dl>
      <template v-for="r in rows" :key="r.label">
        <dt>{{ r.label }}</dt>
        <dd>{{ r.text }}</dd>
      </template>
    </dl>
    <slot />
  </div>
</template>

<style scoped>
h2 {
  font-family: var(--display);
  font-size: 22px;
  font-weight: 600;
  margin: 0 0 6px;
}
dl {
  margin: 0;
  display: grid;
  grid-template-columns: 88px 1fr;
  gap: 6px 10px;
  font-size: 15px;
}
dt {
  color: var(--muted);
  font-weight: 500;
}
dd {
  margin: 0;
}
</style>
