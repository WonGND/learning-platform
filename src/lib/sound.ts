import { load, save } from './storage'

/**
 * Web Audio 기반 레트로 효과음 — 오디오 파일 없이 오실레이터로 합성한다.
 * 음소거 상태는 localStorage에 유지된다.
 */
let ctx: AudioContext | null = null
let muted = load<boolean>('muted', false)

export function isMuted(): boolean {
  return muted
}

export function setMuted(next: boolean): void {
  muted = next
  save('muted', next)
}

function ensureCtx(): AudioContext | null {
  if (typeof AudioContext === 'undefined') return null
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function beep(freq: number, durationSec = 0.06, type: OscillatorType = 'square', gain = 0.03): void {
  if (muted) return
  const ac = ensureCtx()
  if (!ac) return
  const osc = ac.createOscillator()
  const g = ac.createGain()
  osc.type = type
  osc.frequency.value = freq
  g.gain.setValueAtTime(gain, ac.currentTime)
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + durationSec)
  osc.connect(g).connect(ac.destination)
  osc.start()
  osc.stop(ac.currentTime + durationSec)
}

/** 레트로 효과음 프리셋 */
export const sfx = {
  /** 타이핑 틱 (부팅 시퀀스) */
  tick(): void {
    beep(720 + Math.random() * 160, 0.015, 'square', 0.012)
  },
  /** 메뉴 이동/호버 */
  blip(): void {
    beep(520, 0.04, 'square', 0.025)
  },
  /** 확인/선택 */
  confirm(): void {
    beep(660, 0.06, 'square', 0.03)
    setTimeout(() => beep(880, 0.08, 'square', 0.03), 70)
  },
  /** 게임 시작 팡파레 */
  start(): void {
    beep(523, 0.09, 'square', 0.035)
    setTimeout(() => beep(659, 0.09, 'square', 0.035), 100)
    setTimeout(() => beep(784, 0.16, 'square', 0.035), 200)
  },
  /** 오류/거절 */
  error(): void {
    beep(180, 0.15, 'sawtooth', 0.03)
  },
  /** 업적 획득 팡파레 */
  achievement(): void {
    beep(660, 0.07, 'square', 0.035)
    setTimeout(() => beep(880, 0.07, 'square', 0.035), 80)
    setTimeout(() => beep(1046, 0.12, 'square', 0.035), 160)
    setTimeout(() => beep(1318, 0.18, 'square', 0.03), 260)
  },
  /** RANDOM ENCOUNTER 등장 */
  encounter(): void {
    beep(300, 0.09, 'sawtooth', 0.03)
    setTimeout(() => beep(240, 0.12, 'sawtooth', 0.03), 100)
  },
}
