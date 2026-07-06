/**
 * localStorage 래퍼 — 키 네임스페이스 관리 + 손상 데이터 안전 복구.
 * 파싱 실패나 저장 불가(사파리 프라이빗 모드 등) 시에도 앱은 계속 동작한다.
 */
const NS = 'retro-learn:'

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(NS + key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    // 손상된 데이터는 제거하고 초기 상태로 복구
    try {
      localStorage.removeItem(NS + key)
    } catch {
      /* ignore */
    }
    return fallback
  }
}

export function save(key: string, value: unknown): void {
  try {
    localStorage.setItem(NS + key, JSON.stringify(value))
  } catch {
    /* 저장 불가 환경에서는 조용히 무시 */
  }
}

export function clearAll(): void {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(NS))
      .forEach((k) => localStorage.removeItem(k))
  } catch {
    /* ignore */
  }
}
