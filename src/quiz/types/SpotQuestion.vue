<script setup lang="ts">
import type { Point } from '../../model/types'
import type { RinkTap, SpotQuestion } from '../model'
import TapCue from './TapCue.vue'

defineProps<{ q: SpotQuestion; answer: Point | null }>()
const emit = defineEmits<{ submit: [p: Point] }>()

defineExpose({ onTap: (t: RinkTap) => emit('submit', { x: t.x, y: t.y }) })
</script>

<template>
  <TapCue v-if="!answer">Tap a spot on the rink</TapCue>
</template>
