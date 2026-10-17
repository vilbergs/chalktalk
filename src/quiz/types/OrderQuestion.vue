<script setup lang="ts">
import { ref, watch } from 'vue'
import type { BoardState, Mark, PlayerId } from '../../model/types'
import type { OrderQuestion, RinkTap } from '../model'
import { canPickForOrder } from './order'
import TapCue from './TapCue.vue'

const props = defineProps<{ q: OrderQuestion; answer: PlayerId[] | null; board: BoardState }>()
const emit = defineEmits<{ submit: [ids: PlayerId[]]; marks: [marks: Mark[]] }>()

const picked = ref<PlayerId[]>([])
watch(() => props.q, () => (picked.value = []))

defineExpose({
  onTap(t: RinkTap) {
    if (!t.id || picked.value.length >= 3 || !canPickForOrder(props.board, t.id, picked.value)) return
    picked.value.push(t.id)
    emit('marks', picked.value.map((id, i) => ({ k: 'tag', id, text: props.q.roles[i], ok: null })))
    if (picked.value.length === 3) emit('submit', picked.value.slice())
  },
})
</script>

<template>
  <TapCue v-if="!answer && picked.length < 3">
    Tap the forward who is <b>{{ q.roles[picked.length] }}</b>
  </TapCue>
</template>
