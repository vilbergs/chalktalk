<script setup lang="ts">
import { computed } from 'vue'
import type { Playback } from './usePlayback'

const props = defineProps<{ playback: Playback }>()
const emit = defineEmits<{ commit: [] }>()

const pb = computed(() => props.playback.pb)
const seconds = computed(() => pb.value.plan?.seconds ?? 1)
const done = computed(() => pb.value.t >= seconds.value)

const playLabel = computed(() =>
  pb.value.running ? 'Pause' : done.value ? 'Play again' : pb.value.t > 0 ? 'Resume' : 'Play it out',
)
const hint = computed(() =>
  done.value
    ? 'End of the sequence. Keep these positions to ask what comes next.'
    : pb.value.running
      ? `Playing at ${pb.value.speed}×.`
      : pb.value.t > 0
      ? `Paused at ${pb.value.t.toFixed(1)} s.`
      : `Plays the next ${seconds.value} seconds as suggested: your move, plus how the others likely react.`,
)
const progress = computed(() => Math.round((1000 * pb.value.t) / seconds.value))
</script>

<template>
  <div class="section">
    <div class="row spread">
      <div class="row">
        <button class="primary" @click="playback.toggle()">{{ playLabel }}</button>
        <button class="ghost" @click="playback.rewind()">Rewind</button>
      </div>
      <button class="ghost" @click="emit('commit')">Keep end positions</button>
    </div>
    <label class="slab">
      <span>Progress</span>
      <input
        type="range" min="0" max="1000" step="1" :value="progress"
        @input="playback.scrub(Number(($event.target as HTMLInputElement).value) / 1000)"
      />
    </label>
    <label class="slab">
      <span>Speed <b>{{ pb.speed }}×</b></span>
      <input
        type="range" min="0.25" max="2" step="0.25" :value="pb.speed"
        @input="playback.pb.speed = Number(($event.target as HTMLInputElement).value)"
      />
    </label>
    <p class="hint">{{ hint }}</p>
  </div>
</template>

<style scoped>
.slab {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 10px;
  font-size: 14px;
  color: var(--muted);
}
.slab span {
  min-width: 84px;
}
.slab b {
  color: var(--ink);
  font-weight: 500;
}
.slab input {
  flex: 1;
  accent-color: var(--accent);
}
</style>
