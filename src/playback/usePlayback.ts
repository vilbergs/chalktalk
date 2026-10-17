import { onBeforeUnmount, reactive } from 'vue'
import type { Plan, Reco } from '../model/types'

/** Playback state for one plan: play/pause, scrub and speed. */
export function usePlayback() {
  const pb = reactive({
    plan: null as Plan | null,
    reco: null as Reco | null,
    t: 0,
    speed: 1,
    running: false,
  })
  let raf = 0
  let last = 0

  function stop() {
    pb.running = false
    cancelAnimationFrame(raf)
    raf = 0
  }

  function tick(now: number) {
    if (!pb.running || !pb.plan) return
    const dt = (now - last) / 1000
    last = now
    pb.t = Math.min(pb.plan.seconds, pb.t + dt * pb.speed)
    if (pb.t >= pb.plan.seconds) return stop()
    raf = requestAnimationFrame(tick)
  }

  function toggle() {
    if (!pb.plan) return
    if (pb.running) return stop()
    if (pb.t >= pb.plan.seconds) pb.t = 0
    pb.running = true
    last = performance.now()
    raf = requestAnimationFrame(tick)
  }

  function rewind() {
    stop()
    pb.t = 0
  }

  function scrub(fraction: number) {
    if (!pb.plan) return
    stop()
    pb.t = pb.plan.seconds * fraction
  }

  function load(plan: Plan, reco: Reco | null) {
    stop()
    pb.plan = plan
    pb.reco = reco
    pb.t = 0
  }

  function clear() {
    stop()
    pb.plan = null
    pb.reco = null
    pb.t = 0
  }

  onBeforeUnmount(stop)

  return { pb, toggle, rewind, scrub, load, clear, stop }
}

export type Playback = ReturnType<typeof usePlayback>
