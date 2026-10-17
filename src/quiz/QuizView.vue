<script setup lang="ts">
import { computed, onMounted, ref, type Component } from 'vue'
import { spotText } from '../model/describe'
import type { Mark } from '../model/types'
import { commitPlan, fromAuthored } from '../playback/plan'
import PlaybackControls from '../playback/PlaybackControls.vue'
import { usePlayback } from '../playback/usePlayback'
import RinkSvg from '../rink/RinkSvg.vue'
import AnswerCard from '../sheet/AnswerCard.vue'
import BottomSheet from '../sheet/BottomSheet.vue'
import type { QuestionKind, RinkTap } from './model'
import { newSituation, quiz } from './store'
import ChoiceQuestion from './types/ChoiceQuestion.vue'
import { gradeAnswer, marksFor, type AnyAnswer } from './types'
import OrderQuestion from './types/OrderQuestion.vue'
import PickQuestion from './types/PickQuestion.vue'
import SpotQuestion from './types/SpotQuestion.vue'

/** UI half of the question-type registry (logic lives in ./types). */
const components: Record<QuestionKind, Component> = {
  choice: ChoiceQuestion,
  spot: SpotQuestion,
  order: OrderQuestion,
  pick: PickQuestion,
}

const playback = usePlayback()
const sheet = ref<InstanceType<typeof BottomSheet>>()
const quizEl = ref<HTMLElement>()
const answerEl = ref<HTMLElement>()
const questionRef = ref<{ onTap?: (t: RinkTap) => void } | null>(null)

const cur = computed(() => quiz.current!)
const answered = computed(() => quiz.result !== null)

async function next() {
  playback.clear()
  await newSituation()
  sheet.value?.show(quizEl.value)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function loadModelPlan() {
  const plan = quiz.result?.plan
  if (!plan) return playback.clear()
  const r = fromAuthored(cur.value.board, plan)
  playback.load(r.plan, r.reco)
}

function submit(answer: AnyAnswer) {
  if (answered.value) return
  const r = gradeAnswer(cur.value.q, answer, cur.value.board)
  quiz.answer = answer
  quiz.result = r
  quiz.marks = marksFor(cur.value.q, answer, cur.value.board)
  quiz.score.done++
  quiz.score.points += r.grade
  if (r.grade === 2) quiz.score.right++
  loadModelPlan()
  sheet.value?.show(answerEl.value)
}

/** Same as the free board: move everyone to the end of the model play. */
function commit() {
  if (!playback.pb.plan) return
  commitPlan(cur.value.board, playback.pb.plan)
  playback.clear()
}

function onTap(t: RinkTap) {
  if (!answered.value) questionRef.value?.onTap?.(t)
}

function setMarks(marks: Mark[]) {
  quiz.marks = marks
}

const verdict = computed(() => (['Not this one', 'Close', 'Right'] as const)[quiz.result?.grade ?? 0])
const answerRows = computed(() => {
  const r = quiz.result!
  return [
    { label: 'You picked', text: r.chosen },
    { label: 'Why', text: r.feedback },
    { label: 'Model play', text: r.modelText },
    { label: 'Go to', text: r.plan && playback.pb.reco ? spotText(playback.pb.reco) : '—' },
  ]
})

onMounted(() => {
  if (!quiz.current) newSituation()
  else loadModelPlan()
})
</script>

<template>
  <RinkSvg
    v-if="quiz.current"
    :board="cur.board"
    :plan="playback.pb.plan"
    :t="playback.pb.t"
    :reco="playback.pb.reco"
    :marks="quiz.marks"
    :interaction="answered || cur.q.type === 'choice' ? 'none' : 'tap'"
    @tap="onTap"
  />

  <BottomSheet ref="sheet">
    <div v-if="quiz.current" ref="quizEl" class="section">
      <div class="qhead">
        <span>{{ cur.name }}</span>
        <span v-if="quiz.score.done" class="score">{{ quiz.score.right }} right of {{ quiz.score.done }}</span>
      </div>
      <p class="caption">{{ cur.caption }}</p>
      <p class="qprompt">{{ cur.q.prompt }}</p>
      <component
        :is="components[cur.q.type]"
        :key="quiz.round"
        ref="questionRef"
        :q="cur.q"
        :answer="quiz.answer"
        :board="cur.board"
        @submit="submit"
        @marks="setMarks"
      />
      <div class="row actions">
        <button class="ghost" @click="next">New situation</button>
      </div>
      <p v-if="answered && quiz.result?.plan" class="hint">The model play is loaded in the player below.</p>
    </div>

    <div v-if="quiz.result" ref="answerEl">
      <AnswerCard :title="verdict" :rows="answerRows" />
    </div>

    <PlaybackControls v-if="playback.pb.plan" :playback="playback" @commit="commit" />
  </BottomSheet>
</template>

<style scoped>
.qhead {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-family: var(--display);
  font-size: 22px;
  font-weight: 600;
}
.score {
  font-size: 15px;
  color: var(--muted);
  font-family: Barlow, sans-serif;
  font-weight: 500;
}
.caption {
  margin: 4px 0 8px;
}
.qprompt {
  margin: 0 0 8px;
  font-weight: 500;
}
.actions {
  margin-top: 10px;
}
</style>
