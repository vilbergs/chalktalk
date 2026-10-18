# Winger's board

A hockey positioning trainer for a recreational right wing (right shot). It teaches reading the game in roles rather than fixed spots: F1/F2/F3 by arrival order, strong side vs weak side, high vs low, read-fill-recover.

The starting point is `legacy/wingers-board.html`, a single-file prototype built as a Claude artifact. It works and is the reference for behaviour, but it is one 900-line script and should be ported, not extended.

## Goal

A mobile app (iPhone first) built from a proper repo. Stack: Vue 3 + Vite + TypeScript, wrapped with Tauri 2 for iOS. The developer works daily in Vue (with PrimeVue), so prefer idiomatic Vue 3 Composition API.

The app has no AI and no backend. All content (situations, questions, feedback, model plays) is authored ahead of time and ships in the bundle, so everything works offline.

## What the prototype did

The prototype called Claude at runtime; the app does not. "What should I do?" and "Ask the coach" are gone.

Two modes, switched by tabs.

**Free board.** A portrait rink (85 x 200 ft). Twelve players (your five skaters and goalie in teal, theirs in coral). Drag to move; each player has a facing direction (white nose on the circle) and an optional skating direction (long arrow). Tap a player to give them the puck or mark them as "me". Presets load common situations. "What should I do?" sends the board to Claude and gets back JSON: a read, a target spot, why, stick/body cue, what to watch for, plus a 2 to 4 second plan for every player who moves and who has the puck at the end. The plan plays back with play/pause, scrub and 0.25x to 2x speed, and "Keep end positions" commits it to the board.

**Quiz.** Authored situations with authored questions. No AI is needed to grade; an optional "Ask the coach to say more" button calls Claude for a deeper explanation after answering.

## Coordinate system

- x: 0 = left boards, 85 = right boards, seen facing up ice toward the opponent's net.
- y: 0 = boards behind your own net, 11 = your goal line, 75 = your blue line, 100 = red line, 125 = their blue line, 189 = their goal line, 200 = boards behind their net.
- Headings and facing are degrees: 0 = straight up ice, 90 = toward the right boards, 180 = back toward your own net.
- The rink is drawn in SVG at 10 units per foot with y flipped (`cy = (200 - y) * 10`).

## Player model

`{ id, team: 'us'|'them', label, x, y, h, fa, off }` where `h` is skating heading or null when standing still, `fa` is facing (used when `h` is null), and `off` removes a player (used for the penalty kill). Ids: `rw c lw rd ld g` for us, `orw oc olw ord old og` for them. The puck is either a player id (`state.puck`) or loose at `state.loose = {x, y}`.

When a quiz situation is built, standing players are auto-faced toward the puck; goalies face up ice for their team.

## Quiz architecture (keep this)

**Situations** are data: one JSON file per situation in `content/situations/`, read through `ContentRepository` (see `docs/content-store.md`). Each play picks a side (mirror left/right), a variant and one applicable question, then places players with small random jitter. Mirrored values are written `{ "m": value }` (the value when the play is on the right), `$F1..$F3` are forwards by arrival order, `when` limits a question to a side or variant, and `{side}` in text becomes right/left. Captions must match the picture; this has been a recurring source of bugs, so check it whenever a situation changes.

**Question types** are a registry. Each type has:

- pure logic in `quiz/types/<type>.ts`: `grade(q, answer, board)` returns `{ grade: 0|1|2, chosen, feedback, modelText, plan }` (2 = right, 1 = close, 0 = wrong), and `marks(q, answer, board)` returns the rink overlays drawn after answering.
- a component that renders the question and emits `submit(answer)`. Types answered on the rink expose `onTap(tap)`.

Current types:

- `choice`: four shuffled options, each with a grade, feedback and (for the right one) a model plan.
- `spot`: tap where you should be. Graded by distance to a target: within `r1` (about 9 ft) is right, within `r2` (about 18 ft) is close. The target zone and your tap are drawn after.
- `order`: tap your three forwards in F1, F2, F3 order. The correct order is computed from actual distances to the puck carrier, so jitter changes the answer. All three right = 2, F1 right = 1.
- `pick`: tap a player (your man, the open teammate, the trailer). Supports partial answers.

Planned types, in rough priority order: freeze the frame (tap when to leave during playback, graded on a time window), draw your route (graded on end zone, which side of a defender it passes, offside), spot the cue, what's wrong here, predict the play, and a shift builder that chains questions using "keep end positions".

**Plans** are authored as `{ label, seconds, moves: [[id, x, y], ...], puck: { to, at } }`, validated and clamped by `sanitizePlan` before playback.

## Situations so far

Dump-in forecheck, puck in your corner, breakout, breakout (who is open), regroup vs 1-2-2, offensive-zone cycle, rush against (3-on-2), point shot, lost faceoff in your zone, penalty kill, zone entry with LW carrying, zone entry with LW angled off, zone entry pass across, neutral-zone turnover, loose puck on the half-wall. Most have two or three question types.

## Hockey content conventions

Feedback is written in role language, direct and warm, never vague praise. Every wrong option explains what it costs. "High" means toward your own net, "low" means toward the net you're attacking. Right wing is the default position; the app may later support left wing via the mirror.

## Mobile lessons from the prototype

- The controls, question and answer live in a bottom sheet fixed to the screen (about half height, collapsible), so the rink can scroll behind it.
- On iOS, `touch-action: none` on the whole rink kills page scroll. Only touches that start on a player should be captured; the rink itself uses `touch-action: pan-y`. In quiz mode, a tap counts only if the pointer moved under 10 px.
- The puck is drawn on a short stick in the carrier's colour, on the forehand side relative to facing, and rendered above all players so it can't hide under someone.
- Respect safe-area insets and `prefers-reduced-motion`.

## Content

Content is pre-generated and checked in as JSON under `content/situations/`. Drafting it with Claude offline is fine, but review every caption against the picture and run the tests. Situation and question ids are permanent; progress will key on them. The plan for moving to SQLite and then PostgreSQL as the collection grows is in `docs/content-store.md`. If free-board recommendations come back, they should be authored plans attached to presets, not runtime calls.

## Structure

```
src/
  model/        types, rink geometry, players + autoFace, board validation, place names
  rink/         RinkSvg (markings, overlays, pointer handling), PlayerToken
  board/        free board: store (localStorage 'wb-state'), presets, BoardView
  playback/     plan model + interpolation + sanitizing, usePlayback, controls
  content/      quiz content store
    schema.ts     stored format (situations, questions, SCHEMA_VERSION)
    validate.ts   structural checks on content files
    repository.ts ContentRepository interface + in-memory implementation
    files.ts      loads content/situations/*.json into rows
    resolve.ts    record + side + variant -> board and runtime question
    builder.ts    jittered placement, puck, arrival order (injectable rng)
    index.ts      picks the backend
  quiz/
    model.ts    runtime question/answer/result types
    types/      choice, spot, order, pick: pure logic (.ts) + component (.vue)
    store.ts    session: current instance, answer, score
  sheet/        bottom sheet, answer card
content/
  situations/   one JSON file per situation (the content database for now)
docs/           content-store.md: format, rules, SQLite/PostgreSQL plan
src-tauri/      Tauri shell; gen/apple is the generated Xcode project
legacy/         wingers-board.html (reference only)
```

To add a question type: add its type to `quiz/model.ts`, its logic in `quiz/types/<name>.ts` (register in `types/index.ts`), and a component that exposes `onTap` if it takes rink taps (register in `QuizView.vue`).

## Commands

- `bun run dev`: web dev server on :1420 (fastest loop, use a phone-sized viewport)
- `bun run test`: vitest, including the content test that builds every situation × side × variant × question
- `bun run typecheck`
- `bun run ios:dev`: run on simulator or a connected iPhone (pick in the prompt)
- `bun run ios:build`: release build
- `bun run ios:install`: standalone build installed on the connected iPhone (`IOS_DEVICE` picks one). With the free personal team an install lasts 7 days.

Signing uses the personal team set in `bundle.iOS.developmentTeam` (`src-tauri/tauri.conf.json`); `APPLE_DEVELOPMENT_TEAM` overrides it. The first install on a phone needs the developer trusted in Settings > General > VPN & Device Management.

`src-tauri/Cargo.toml` pins `libc = "=0.2.185"` for iOS. 0.2.190 gates `mach_task_self` to macOS only, which breaks `num_threads` (via tauri → cookie → time) on iOS. The pin survives `cargo update`; remove it once fixed upstream.

TypeScript is pinned to 5.9 because vue-tsc does not support TS 7 yet.
