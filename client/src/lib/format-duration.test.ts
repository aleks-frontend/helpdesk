import { describe, it, expect } from 'vitest'
import { formatDuration } from './format-duration'

describe('formatDuration', () => {
  it('formats sub-minute durations as <1m', () => {
    expect(formatDuration(30 * 1000)).toBe('<1m')
  })

  it('formats minutes only', () => {
    expect(formatDuration(5 * 60 * 1000)).toBe('5m')
  })

  it('formats hours and minutes', () => {
    expect(formatDuration(5 * 60 * 60 * 1000 + 12 * 60 * 1000)).toBe('5h 12m')
  })

  it('formats days and hours', () => {
    expect(formatDuration(2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000)).toBe('2d 3h')
  })
})
