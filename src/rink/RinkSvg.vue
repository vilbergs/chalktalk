<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { clamp, fromSvg, headingOf, S, toSvg } from '../model/geometry'
import type { BoardState, Mark, Plan, PlayerId, Point, Reco } from '../model/types'
import { holderAt, poseAt } from '../playback/plan'
import type { RinkTap } from '../quiz/model'
import { ACCENT, gradeColor, R, TEAM_FILL } from './colors'
import PlayerToken from './PlayerToken.vue'
import RinkMarkings from './RinkMarkings.vue'

const props = withDefaults(
  defineProps<{
    board: BoardState
    plan?: Plan | null
    /** Seconds into the plan. */
    t?: number
    reco?: Reco | null
    marks?: Mark[]
    selected?: PlayerId | null
    /** edit: drag and turn players. tap: report taps (quiz answers). none: look only. */
    interaction?: 'edit' | 'tap' | 'none'
  }>(),
  { plan: null, t: 0, reco: null, marks: () => [], selected: null, interaction: 'none' },
)

const emit = defineEmits<{
  select: [id: PlayerId | null]
  move: [id: PlayerId, at: Point]
  turn: [id: PlayerId, deg: number]
  dragend: []
  tap: [tap: RinkTap]
}>()

const svg = ref<SVGSVGElement>()

const tokens = computed(() =>
  props.board.players
    .filter((p) => !p.off)
    .map((p) => ({ player: p, pose: poseAt(p, props.plan, props.t) })),
)
const poseById = computed(() => new Map(tokens.value.map((t) => [t.player.id, t.pose])))

/** Puck on a short stick, forehand side of facing, in the carrier's colour. Drawn above everyone. */
const puck = computed(() => {
  const holder = holderAt(props.board, props.plan, props.t)
  const tok = tokens.value.find((t) => t.player.id === holder)
  if (!tok) {
    if (holder || !props.board.loose) return null
    const { cx, cy } = toSvg(props.board.loose)
    return { loose: true as const, kx: cx, ky: cy }
  }
  const { cx, cy } = toSvg(tok.pose)
  const a = ((tok.pose.fa + (tok.pose.h === null ? 35 : 25)) * Math.PI) / 180
  return {
    loose: false as const,
    fill: TEAM_FILL[tok.player.team],
    sx: cx + Math.sin(a) * R * 0.9,
    sy: cy - Math.cos(a) * R * 0.9,
    kx: cx + Math.sin(a) * (R + 22),
    ky: cy - Math.cos(a) * (R + 22),
  }
})

const routes = computed(() => {
  if (!props.plan || !props.reco) return null
  const done = props.t >= props.plan.seconds
  const others = props.board.players.flatMap((p) => {
    const m = props.plan!.moves[p.id]
    if (!m || p.id === props.board.me) return []
    return [{ id: p.id, a: toSvg(p), b: toSvg(m), color: TEAM_FILL[p.team] }]
  })
  const me = props.board.players.find((p) => p.id === props.board.me)!
  return { done, others, me: toSvg(me), target: toSvg(props.reco), label: props.reco.label || 'Go here' }
})

const markShapes = computed(() =>
  props.marks.flatMap((m): { m: Mark; cx: number; cy: number }[] => {
    if (m.k === 'target' || m.k === 'dot') return [{ m, ...toSvg(m) }]
    const pose = poseById.value.get(m.id)
    return pose ? [{ m, ...toSvg(pose) }] : []
  }),
)

// ---- Pointer handling ----
// Only touches that start on a player are captured; the rink itself pans (touch-action: pan-y),
// so the page can still scroll on iOS. In tap mode a tap only counts if the finger moved < 10 px.

let drag: { id: PlayerId; role: 'body' | 'handle' } | null = null
let tap: { x: number; y: number; id: PlayerId | null } | null = null

function svgPoint(ev: PointerEvent): Point {
  const el = svg.value!
  const pt = el.createSVGPoint()
  pt.x = ev.clientX
  pt.y = ev.clientY
  const m = pt.matrixTransform(el.getScreenCTM()!.inverse())
  return fromSvg(m.x, m.y)
}

function hit(ev: PointerEvent) {
  const t = (ev.target as Element).closest('[data-role]') as SVGElement | null
  const g = t?.closest('g[data-id]') as SVGGElement | null
  return { role: t?.dataset.role as 'body' | 'handle' | undefined, id: (g?.dataset.id as PlayerId) ?? null }
}

function onDown(ev: PointerEvent) {
  if (props.interaction === 'none') return
  const { role, id } = hit(ev)
  if (props.interaction === 'tap') {
    tap = { x: ev.clientX, y: ev.clientY, id }
    return
  }
  if (!role || !id) {
    emit('select', null)
    return
  }
  emit('select', id)
  drag = { id, role }
  svg.value!.setPointerCapture(ev.pointerId)
  ev.preventDefault()
}

function onMove(ev: PointerEvent) {
  if (!drag) return
  const m = svgPoint(ev)
  if (drag.role === 'body') {
    emit('move', drag.id, { x: clamp(m.x, 2, 83), y: clamp(m.y, 2, 198) })
  } else {
    const pose = poseById.value.get(drag.id)!
    emit('turn', drag.id, headingOf(m.x - pose.x, m.y - pose.y))
  }
}

function onUp(ev: PointerEvent) {
  if (tap && ev.type === 'pointerup' && Math.hypot(ev.clientX - tap.x, ev.clientY - tap.y) < 10) {
    const m = svgPoint(ev)
    emit('tap', { x: clamp(m.x, 1, 84), y: clamp(m.y, 1, 199), id: tap.id })
  }
  tap = null
  if (drag) {
    drag = null
    emit('dragend')
  }
}

// iOS Safari needs non-passive touch listeners to stop the page scrolling under a drag.
const onTouchStart = (ev: TouchEvent) => {
  if (props.interaction === 'edit' && (ev.target as Element).closest?.('[data-role]')) ev.preventDefault()
}
const onTouchMove = (ev: TouchEvent) => {
  if (drag) ev.preventDefault()
}
onMounted(() => {
  svg.value!.addEventListener('touchstart', onTouchStart, { passive: false })
  svg.value!.addEventListener('touchmove', onTouchMove, { passive: false })
})
onBeforeUnmount(() => {
  svg.value?.removeEventListener('touchstart', onTouchStart)
  svg.value?.removeEventListener('touchmove', onTouchMove)
})
</script>

<template>
  <div class="rinkwrap">
    <svg
      ref="svg"
      viewBox="0 0 850 2000"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Ice rink with players"
      @pointerdown="onDown"
      @pointermove="onMove"
      @pointerup="onUp"
      @pointercancel="onUp"
    >
      <defs>
        <marker id="ah" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M1 1L8 5L1 9" fill="none" stroke="context-stroke" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </marker>
        <marker id="ah2" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M1 1L8 5L1 9" fill="none" :stroke="ACCENT" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </marker>
      </defs>

      <RinkMarkings />

      <g v-if="routes" class="routes">
        <line
          v-for="r in routes.others" :key="r.id"
          :x1="r.a.cx" :y1="r.a.cy" :x2="r.b.cx" :y2="r.b.cy"
          :stroke="r.color" stroke-width="4" stroke-dasharray="10 12" :opacity="routes.done ? 0.25 : 0.5"
        />
        <line
          :x1="routes.me.cx" :y1="routes.me.cy" :x2="routes.target.cx" :y2="routes.target.cy"
          :stroke="ACCENT" stroke-width="7" stroke-dasharray="18 14" marker-end="url(#ah2)" :opacity="routes.done ? 0.35 : 1"
        />
        <circle
          :cx="routes.target.cx" :cy="routes.target.cy" r="44"
          :fill="ACCENT" fill-opacity=".15" :stroke="ACCENT" stroke-width="5" stroke-dasharray="10 8"
          :class="{ pulse: !routes.done }"
        />
        <text :x="routes.target.cx" :y="routes.target.cy - 58" text-anchor="middle" class="svg-label" :fill="ACCENT">
          {{ routes.label }}
        </text>
      </g>

      <g class="marks">
        <template v-for="(s, i) in markShapes" :key="i">
          <template v-if="s.m.k === 'target'">
            <circle :cx="s.cx" :cy="s.cy" :r="s.m.r2 * S" fill="#1D9E75" fill-opacity=".08" stroke="#1D9E75" stroke-width="3" stroke-dasharray="10 10" />
            <circle :cx="s.cx" :cy="s.cy" :r="s.m.r1 * S" fill="#1D9E75" fill-opacity=".18" stroke="#1D9E75" stroke-width="4" />
          </template>
          <template v-else-if="s.m.k === 'dot'">
            <circle :cx="s.cx" :cy="s.cy" r="18" :fill="gradeColor(s.m.ok)" stroke="#fff" stroke-width="4" />
            <text :x="s.cx" :y="s.cy - 28" text-anchor="middle" class="svg-label small" :fill="gradeColor(s.m.ok)">You</text>
          </template>
          <circle
            v-else-if="s.m.k === 'ring'"
            :cx="s.cx" :cy="s.cy" :r="R + 16" fill="none" :stroke="gradeColor(s.m.ok)" stroke-width="8" opacity=".9"
          />
          <g v-else-if="s.m.k === 'tag'">
            <rect :x="s.cx - 34" :y="s.cy - R - 58" width="68" height="40" rx="8" :fill="gradeColor(s.m.ok)" />
            <text :x="s.cx" :y="s.cy - R - 37" text-anchor="middle" dominant-baseline="central" class="svg-label" fill="#fff">
              {{ s.m.text }}
            </text>
          </g>
        </template>
      </g>

      <g class="players">
        <PlayerToken
          v-for="t in tokens" :key="t.player.id"
          :player="t.player" :pose="t.pose"
          :selected="selected === t.player.id" :me="board.me === t.player.id"
        />
        <template v-if="puck">
          <circle v-if="puck.loose" :cx="puck.kx" :cy="puck.ky" r="13" fill="#111" stroke="#fff" stroke-width="3" pointer-events="none" />
          <g v-else pointer-events="none">
            <line :x1="puck.sx" :y1="puck.sy" :x2="puck.kx" :y2="puck.ky" :stroke="puck.fill" stroke-width="7" stroke-linecap="round" />
            <circle :cx="puck.kx" :cy="puck.ky" r="13" fill="#111" :stroke="puck.fill" stroke-width="4" />
          </g>
        </template>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.rinkwrap {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 6px;
}
svg {
  display: block;
  width: 100%;
  height: auto;
  touch-action: pan-y;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}
.svg-label {
  font-family: var(--display);
  font-weight: 600;
  font-size: 30px;
}
.svg-label.small {
  font-size: 28px;
}
</style>
