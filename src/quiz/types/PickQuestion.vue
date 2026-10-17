<script setup lang="ts">
import type { PlayerId } from '../../model/types'
import type { PickQuestion, RinkTap } from '../model'
import TapCue from './TapCue.vue'

defineProps<{ q: PickQuestion; answer: PlayerId | null }>()
const emit = defineEmits<{ submit: [id: PlayerId] }>()

defineExpose({
  onTap: (t: RinkTap) => {
    if (t.id) emit('submit', t.id)
  },
})
</script>

<template>
  <TapCue v-if="!answer">Tap a player on the rink</TapCue>
</template>
