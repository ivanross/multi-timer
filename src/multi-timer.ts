import EventSystem, { Listener, EventName } from './event-system'
import { bind } from './uilts'

export type Step<Info> = Info & { duration: number }
export type TimerState = 'playing' | 'stopped' | 'paused'

export type TimerListener<Event extends EventName<TimerEventsMap>> = Listener<TimerEventsMap[Event]>

export interface TimerEvent<Info extends object = {}> {
  /** Referece to the timer */
  timer: Timer<Info>

  /** Elapsed time for current step */
  elapsed: number

  /** Elapes time from the first step */
  totalElapsed: number

  /** Current step */
  step: Step<Info>

  /** Current state of the timer */
  state: TimerState

  /** Index of the current step */
  stepIndex: number
}

export interface TimerEventsMap<Info extends object = {}> {
  start: TimerEvent<Info>
  pause: TimerEvent<Info>
  end: TimerEvent<Info>

  tick: TimerEvent<Info>
  stepchange: TimerEvent<Info>
}

export interface Timer<Info extends object = {}> {
  /** Return all steps */
  steps(): Array<Step<Info>>
  /** Set new steps */
  steps(steps: Array<Step<Info>>): Timer<Info>

  /** Add a step */
  pushStep(step: Step<Info>): Timer<Info>

  /** Return tick rate */
  tickRate(): number
  /** Set tick rate */
  tickRate(rate: number): Timer<Info>

  /** Return tick duration */
  tickDuration(): number
  /** Set tick duration */
  tickDuration(rate: number): Timer<Info>

  /** Return the current running step */
  activeStep(): Step<Info>

  /** Return the state of the timer */
  state(): TimerState

  /** Start the timer */
  start(): void

  /** Pause the timer */
  pause(): void

  /** Add event listener */
  on<E extends EventName<TimerEventsMap>>(event: E, listener: TimerListener<E>): void

  /** Remove event listener */
  off<E extends EventName<TimerEventsMap>>(event: E, listener: TimerListener<E>): void
}

const rate2duration = (r: number) => 1000 / r
const duration2rate = (d: number) => 1000 / d

export function multiTimer<Info extends object = {}>() {
  const ev = new EventSystem<TimerEventsMap>()

  let _steps: Array<Step<Info>> = []
  let _stepIndex = 0
  let _startTime = Date.now()

  let _currStepElapsed = 0
  let _prevStepElapsed = 0
  let _shouldCancelFrame = false

  let _state: TimerState = 'paused'

  let _tickRate = 60

  const timer = {} as Timer<Info>

  const activeStep = () => _steps[_stepIndex]
  const updatePrevElapsed = () =>
    (_prevStepElapsed = _steps.slice(0, _stepIndex).reduce((acc, s) => acc + s.duration, 0))

  const event: () => TimerEvent<Info> = () => ({
    timer,
    elapsed: _currStepElapsed,
    totalElapsed: _currStepElapsed + _prevStepElapsed,
    step: activeStep(),
    state: _state,
    stepIndex: _stepIndex,
  })

  function steps(): Array<Step<Info>>
  function steps(steps: Array<Step<Info>>): Timer<Info>
  function steps(steps?: Step<Info>[]) {
    if (typeof steps === 'undefined') return _steps
    _steps = steps
    return timer
  }

  function tickRate(): number
  function tickRate(rate: number): Timer<Info>
  function tickRate(rate?: number) {
    if (typeof rate === 'undefined') return _tickRate
    _tickRate = rate
    return timer
  }

  function tickDuration(): number
  function tickDuration(duration: number): Timer<Info>
  function tickDuration(duration?: number) {
    if (typeof duration === 'undefined') return rate2duration(_tickRate)
    _tickRate = duration2rate(duration)
    return timer
  }

  const pushStep = (step: Step<Info>) => (_steps.push(step), timer)

  function handleTick() {
    if (_shouldCancelFrame) {
      _shouldCancelFrame = false
      return
    }

    _currStepElapsed = Date.now() - _startTime

    const step = activeStep()
    const missingTime = step.duration - _currStepElapsed

    const isLastStep = _stepIndex >= _steps.length - 1
    const isStepEnded = missingTime <= 0
    const isTimerEnded = isStepEnded && isLastStep

    if (isTimerEnded) {
      // Timer has finished last step
      handleEnd()
      ev.dispatch('end', event())
    } else if (isStepEnded) {
      // Timer has finished current step. Set next stap as active
      // and continue
      handleStepChange()
      ev.dispatch('stepchange', event())
    }

    ev.dispatch('tick', event())

    if (!isTimerEnded) {
      const nextTickDuration = Math.min(rate2duration(_tickRate), missingTime)
      setTimeout(handleTick, nextTickDuration)
    }
  }

  // Update state when step changes
  function handleStepChange() {
    _stepIndex++
    _prevStepElapsed = updatePrevElapsed()
    _currStepElapsed -= _prevStepElapsed
    _startTime = Date.now() - _currStepElapsed
  }

  // Update state when timer ends all steps
  function handleEnd() {
    _state = 'stopped'
    _prevStepElapsed = updatePrevElapsed()
    _currStepElapsed = _steps[_stepIndex].duration
  }

  const start = () => {
    if (_state === 'playing') {
      __DEV__ && console.warn('Trying to start a MultiTimer that is already playing, skipping.')
      return
    }

    _state = 'playing'
    ev.dispatch('start', event())

    _startTime = Date.now() - _currStepElapsed
    handleTick()
  }

  const pause = () => {
    if (_state === 'paused') {
      __DEV__ && console.warn('Trying to pause a MultiTimer that is already paused, skipping.')
      return
    }

    _state = 'paused'
    ev.dispatch('pause', event())

    _shouldCancelFrame = true
  }

  Object.assign<Timer<Info>, Timer<Info>>(timer, {
    activeStep,
    pushStep,
    steps,
    start,
    pause,
    tickRate,
    tickDuration,
    state: () => _state,
    on: bind(ev.subscribe, ev),
    off: bind(ev.unsubscribe, ev),
  })
  return timer
}
