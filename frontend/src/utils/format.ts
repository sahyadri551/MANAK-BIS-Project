export function scorePercent(score: number): number {
  return Math.round(score * 100)
}

export function scoreTier(score: number): 'high' | 'medium' | 'low' {
  const pct = scorePercent(score)
  if (pct >= 70) return 'high'
  if (pct >= 40) return 'medium'
  return 'low'
}

export function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function truncate(text: string, n = 90): string {
  return text.length > n ? `${text.slice(0, n)}…` : text
}
