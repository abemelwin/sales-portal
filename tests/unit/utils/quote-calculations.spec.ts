import { describe, it, expect } from 'vitest'
import { computeAmortization } from '@/utils/quote-calculations'

describe('computeAmortization', () => {
  it('computes monthly amortization rounded to 2 decimal places', () => {
    const result = computeAmortization(100000, 20000, 10000, 12)
    expect(result.value).toBe(5833.33)
    expect(result.error).toBeUndefined()
  })

  it('returns exact value when evenly divisible', () => {
    const result = computeAmortization(12000, 0, 0, 12)
    expect(result.value).toBe(1000)
  })

  it('accounts for down payment in calculation', () => {
    const result = computeAmortization(50000, 10000, 0, 10)
    // (50000 - 10000 - 0) / 10 = 4000
    expect(result.value).toBe(4000)
  })

  it('accounts for trade-in sum in calculation', () => {
    const result = computeAmortization(50000, 0, 15000, 10)
    // (50000 - 0 - 15000) / 10 = 3500
    expect(result.value).toBe(3500)
  })

  it('accounts for both down payment and trade-in', () => {
    const result = computeAmortization(100000, 20000, 30000, 24)
    // (100000 - 20000 - 30000) / 24 = 2083.333... -> 2083.33
    expect(result.value).toBe(2083.33)
  })

  it('returns error when months is zero', () => {
    const result = computeAmortization(100000, 20000, 10000, 0)
    expect(result.error).toBe('Number of months must be greater than zero')
    expect(result.value).toBeUndefined()
  })

  it('returns error when months is negative', () => {
    const result = computeAmortization(100000, 20000, 10000, -5)
    expect(result.error).toBe('Number of months must be greater than zero')
    expect(result.value).toBeUndefined()
  })

  it('returns error when down payment equals contract price', () => {
    const result = computeAmortization(50000, 50000, 0, 12)
    expect(result.error).toBe(
      'Down payment plus trade-in value equals or exceeds contract price'
    )
    expect(result.value).toBeUndefined()
  })

  it('returns error when trade-in sum equals contract price', () => {
    const result = computeAmortization(50000, 0, 50000, 12)
    expect(result.error).toBe(
      'Down payment plus trade-in value equals or exceeds contract price'
    )
    expect(result.value).toBeUndefined()
  })

  it('returns error when down payment + trade-in exceeds contract price', () => {
    const result = computeAmortization(50000, 30000, 25000, 12)
    expect(result.error).toBe(
      'Down payment plus trade-in value equals or exceeds contract price'
    )
    expect(result.value).toBeUndefined()
  })

  it('handles very small remaining amounts', () => {
    const result = computeAmortization(10000, 9999, 0, 1)
    // (10000 - 9999 - 0) / 1 = 1
    expect(result.value).toBe(1)
  })

  it('handles maximum months value (60)', () => {
    const result = computeAmortization(120000, 0, 0, 60)
    expect(result.value).toBe(2000)
  })

  it('rounds correctly when third decimal is >= 5', () => {
    // (10000 - 0 - 0) / 3 = 3333.3333... -> 3333.33
    const result = computeAmortization(10000, 0, 0, 3)
    expect(result.value).toBe(3333.33)
  })

  it('rounds correctly when third decimal is < 5', () => {
    // (10000 - 0 - 0) / 7 = 1428.5714... -> 1428.57
    const result = computeAmortization(10000, 0, 0, 7)
    expect(result.value).toBe(1428.57)
  })
})
