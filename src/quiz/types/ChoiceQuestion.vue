<script setup lang="ts">
import { computed } from 'vue'
import type { ChoiceQuestion } from '../model'

const props = defineProps<{ q: ChoiceQuestion; answer: number | null }>()
const emit = defineEmits<{ submit: [i: number] }>()

// Shuffled once per question so the right answer isn't always first.
const order = computed(() => props.q.options.map((_, i) => i).sort(() => Math.random() - 0.5))

function state(i: number) {
  if (props.answer === null) return ''
  const g = props.q.options[i].grade
  if (i === props.answer) return g === 2 ? 'correct' : g === 1 ? 'partial' : 'wrong'
  return g === 2 ? 'correct' : ''
}
</script>

<template>
  <div class="opts">
    <button
      v-for="i in order" :key="i"
      class="opt" :class="state(i)" :disabled="answer !== null"
      @click="emit('submit', i)"
    >
      {{ q.options[i].text }}
    </button>
  </div>
</template>

<style scoped>
.opts {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.opt {
  text-align: left;
  padding: 10px 12px;
  min-height: 44px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: var(--bg);
  line-height: 1.35;
  font-weight: 400;
}
.opt.correct {
  border-color: #1d9e75;
  box-shadow: inset 0 0 0 1px #1d9e75;
}
.opt.wrong {
  border-color: #d85a30;
  box-shadow: inset 0 0 0 1px #d85a30;
}
.opt.partial {
  border-color: #ef9f27;
  box-shadow: inset 0 0 0 1px #ef9f27;
}
.opt[disabled] {
  opacity: 1;
  cursor: default;
}
.opt[disabled]:not(.correct):not(.wrong):not(.partial) {
  opacity: 0.55;
}
</style>
