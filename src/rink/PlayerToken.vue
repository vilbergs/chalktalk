<script setup lang="ts">
import { computed } from 'vue'
import { toSvg } from '../model/geometry'
import type { Player } from '../model/types'
import type { PlayerPose } from '../playback/plan'
import { HD, R, SEL, TEAM_FILL } from './colors'

const props = defineProps<{
  player: Player
  pose: PlayerPose
  selected: boolean
  me: boolean
}>()

const g = computed(() => {
  const { cx, cy } = toSvg(props.pose)
  const fill = TEAM_FILL[props.player.team]
  const fa = (props.pose.fa * Math.PI) / 180
  const sx = Math.sin(fa)
  const sy = -Math.cos(fa)
  const len = props.pose.h !== null ? HD : 80
  // Nose: small white triangle on the rim showing facing.
  const px = Math.cos(fa)
  const py = Math.sin(fa)
  const nose = [
    [cx + sx * (R + 14), cy + sy * (R + 14)],
    [cx + sx * (R - 4) + px * 11, cy + sy * (R - 4) + py * 11],
    [cx + sx * (R - 4) - px * 11, cy + sy * (R - 4) - py * 11],
  ]
    .map((p) => p.join(','))
    .join(' ')
  return { cx, cy, fill, hx: cx + sx * len, hy: cy + sy * len, nose }
})
</script>

<template>
  <g :data-id="player.id" class="token">
    <line
      v-if="pose.h !== null"
      :x1="g.cx" :y1="g.cy" :x2="g.hx" :y2="g.hy"
      :stroke="g.fill" stroke-width="6" marker-end="url(#ah)" opacity=".85"
    />
    <line
      v-else-if="selected"
      :x1="g.cx" :y1="g.cy" :x2="g.hx" :y2="g.hy"
      :stroke="SEL" stroke-width="3" stroke-dasharray="6 6" opacity=".8"
    />
    <circle
      v-if="selected"
      data-role="handle"
      :cx="g.hx" :cy="g.hy" r="30"
      :fill="SEL" fill-opacity=".35" :stroke="SEL" stroke-width="4"
    />
    <circle
      data-role="body"
      :cx="g.cx" :cy="g.cy" :r="R" :fill="g.fill"
      :stroke="selected ? SEL : me ? '#17222b' : '#fff'"
      :stroke-width="selected ? 8 : me ? 7 : 4"
    />
    <polygon :points="g.nose" fill="#fff" :stroke="g.fill" stroke-width="2" pointer-events="none" />
    <text
      :x="g.cx" :y="g.cy + 1" text-anchor="middle" dominant-baseline="central"
      class="label" pointer-events="none"
    >{{ player.label }}</text>
  </g>
</template>

<style scoped>
.token,
.token * {
  touch-action: none;
}
.label {
  font-family: var(--display);
  font-weight: 600;
  font-size: 30px;
  fill: #fff;
}
</style>
