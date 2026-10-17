<script setup lang="ts">
import { ref } from 'vue'
import BoardView from './board/BoardView.vue'
import QuizView from './quiz/QuizView.vue'

type Mode = 'board' | 'quiz'
const mode = ref<Mode>('board')

const subline: Record<Mode, string> = {
  board: 'Drag players into place, give someone the puck and set skating directions to sketch a situation.',
  quiz: 'Read the situation, answer on the rink or below, and see why.',
}
</script>

<template>
  <main>
    <h1>Winger's board</h1>
    <p class="sub">{{ subline[mode] }}</p>
    <div class="tabs" role="tablist">
      <button role="tab" :aria-selected="mode === 'board'" :class="{ on: mode === 'board' }" @click="mode = 'board'">
        Free board
      </button>
      <button role="tab" :aria-selected="mode === 'quiz'" :class="{ on: mode === 'quiz' }" @click="mode = 'quiz'">
        Quiz me
      </button>
    </div>
    <BoardView v-if="mode === 'board'" />
    <QuizView v-else />
  </main>
</template>

<style scoped>
main {
  max-width: 460px;
  margin: 0 auto;
  padding: calc(12px + env(safe-area-inset-top, 0px)) 12px 56vh;
}
h1 {
  font-family: var(--display);
  font-weight: 600;
  font-size: 34px;
  line-height: 1;
  margin: 8px 0 2px;
  letter-spacing: 0.3px;
}
.sub {
  color: var(--muted);
  margin: 0 0 12px;
  font-size: 15px;
}
.tabs {
  display: flex;
  gap: 6px;
  margin: 0 0 10px;
  padding: 4px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 12px;
}
.tabs button {
  flex: 1;
  border: none;
  background: transparent;
  border-radius: 9px;
  min-height: 38px;
}
.tabs button.on {
  background: var(--accent);
  color: #fff;
  box-shadow: none;
}
</style>
