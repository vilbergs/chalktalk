<script setup lang="ts">
import { computed, ref } from 'vue'
import { faceOf, findPlayer } from '../model/players'
import type { PlayerId, Point } from '../model/types'
import RinkSvg from '../rink/RinkSvg.vue'
import BottomSheet from '../sheet/BottomSheet.vue'
import { applyPreset, presets } from './presets'
import { board, saveBoard } from './store'

const sheet = ref<InstanceType<typeof BottomSheet>>()

const selected = ref<PlayerId | null>(null)
const sel = computed(() => findPlayer(board, selected.value))

function onSelect(id: PlayerId | null) {
  selected.value = id
  if (id) sheet.value?.show()
}

function onMove(id: PlayerId, at: Point) {
  Object.assign(findPlayer(board, id)!, at)
}

function onTurn(id: PlayerId, deg: number) {
  const p = findPlayer(board, id)!
  p.fa = deg
  if (p.h !== null) p.h = deg
}

function change(fn: () => void) {
  fn()
  saveBoard()
}

const givePuck = () =>
  change(() => {
    board.puck = selected.value
    board.loose = null
  })
const toggleSkating = () =>
  change(() => {
    const p = sel.value!
    if (p.h === null) p.h = faceOf(p)
    else {
      p.fa = p.h
      p.h = null
    }
  })
const makeMe = () =>
  change(() => {
    if (sel.value?.team === 'us') board.me = sel.value.id
  })
const loadPreset = (key: string | null) =>
  change(() => {
    applyPreset(board, key)
    selected.value = null
  })
</script>

<template>
  <RinkSvg
    :board="board"
    :selected="selected"
    interaction="edit"
    @select="onSelect"
    @move="onMove"
    @turn="onTurn"
    @dragend="saveBoard"
  />

  <BottomSheet ref="sheet">
    <div class="section">
      <div class="who">
        <span class="chip" :class="sel?.team" />
        <span v-if="sel">
          {{ sel.team === 'us' ? 'Your' : 'Their' }} {{ sel.label }}{{ board.me === sel.id ? ' (you)' : '' }}
        </span>
        <span v-else>Tap a player</span>
      </div>
      <div class="row">
        <button :disabled="!sel" :class="{ on: sel && board.puck === sel.id }" @click="givePuck">
          {{ sel && board.puck === sel.id ? 'Has the puck' : 'Give the puck' }}
        </button>
        <button :disabled="!sel" :class="{ on: sel && sel.h === null }" @click="toggleSkating">
          {{ !sel || sel.h === null ? 'Standing still' : 'Skating' }}
        </button>
        <button class="ghost" :disabled="sel?.team !== 'us'" :class="{ on: sel && board.me === sel.id }" @click="makeMe">
          This is me
        </button>
      </div>
      <p class="hint">
        Drag a player to move. Drag the orange tip to turn them; the white nose shows which way they face. Toggle
        Skating to make them move that way.
      </p>
    </div>

    <div class="section row presets">
      <button v-for="(p, key) in presets" :key="key" @click="loadPreset(key)">{{ p.label }}</button>
      <button class="ghost" @click="loadPreset(null)">Reset</button>
    </div>

  </BottomSheet>
</template>

<style scoped>
.who {
  font-family: var(--display);
  font-size: 22px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.chip {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--line);
}
.chip.us {
  background: var(--teal);
}
.chip.them {
  background: var(--coral);
}
.presets button {
  font-size: 14px;
  padding: 7px 11px;
  min-height: 36px;
}
</style>
