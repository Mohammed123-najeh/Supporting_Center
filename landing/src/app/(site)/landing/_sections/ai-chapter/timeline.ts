// The demos' clock. A scene is an async script of `await tl.wait(ms)` steps.
// While paused (the Pause button, the demo scrolled away, a hidden tab) a wait is
// parked with the time it still had left: no timer runs, nothing polls. cancel()
// resolves every pending wait with false, so a script stops at its next await.
export type Clock = {
  now(): number
  set(fn: () => void, ms: number): unknown
  clear(id: unknown): void
}

const systemClock: Clock = {
  now: () => Date.now(),
  set: (fn, ms) => setTimeout(fn, ms),
  clear: (id) => clearTimeout(id as ReturnType<typeof setTimeout>),
}

type Pending = { left: number; since: number; id: unknown; resolve: (ran: boolean) => void }

export type Timeline = {
  /** Resolves true after `ms` of running time, false if the timeline is cancelled. */
  wait(ms: number): Promise<boolean>
  pause(): void
  resume(): void
  cancel(): void
  readonly paused: boolean
  readonly cancelled: boolean
}

export function createTimeline(clock: Clock = systemClock, startPaused = false): Timeline {
  let paused = startPaused
  let cancelled = false
  const pending = new Set<Pending>()

  const arm = (p: Pending) => {
    p.since = clock.now()
    p.id = clock.set(() => {
      pending.delete(p)
      p.resolve(true)
    }, p.left)
  }

  return {
    get paused() { return paused },
    get cancelled() { return cancelled },
    wait(ms) {
      if (cancelled) return Promise.resolve(false)
      return new Promise<boolean>((resolve) => {
        const p: Pending = { left: Math.max(0, ms), since: 0, id: null, resolve }
        pending.add(p)
        if (!paused) arm(p)
      })
    },
    pause() {
      if (paused || cancelled) return
      paused = true
      const t = clock.now()
      for (const p of pending) {
        clock.clear(p.id)
        p.id = null
        p.left = Math.max(0, p.left - (t - p.since))
      }
    },
    resume() {
      if (!paused || cancelled) return
      paused = false
      for (const p of pending) arm(p)
    },
    cancel() {
      if (cancelled) return
      cancelled = true
      for (const p of pending) {
        clock.clear(p.id)
        p.resolve(false)
      }
      pending.clear()
    },
  }
}
