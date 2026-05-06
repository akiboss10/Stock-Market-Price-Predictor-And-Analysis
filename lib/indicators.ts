// Technical indicators - all implemented from scratch in pure TypeScript.
// References: Investopedia formulas; Wilder's RSI; standard MACD(12,26,9); BB(20, 2σ)

import type {
  HistoricalPoint,
  IndicatorSeries,
  MACDSeries,
  BollingerBandsSeries,
  IndicatorBundle,
} from "./types"

/** Simple Moving Average over `period` closes */
export function sma(data: HistoricalPoint[], period: number): IndicatorSeries[] {
  const out: IndicatorSeries[] = []
  let sum = 0
  for (let i = 0; i < data.length; i++) {
    sum += data[i].close
    if (i >= period) sum -= data[i - period].close
    out.push({
      date: data[i].date,
      value: i >= period - 1 ? sum / period : null,
    })
  }
  return out
}

/** Exponential Moving Average using standard alpha = 2/(period+1) */
export function ema(data: HistoricalPoint[], period: number): IndicatorSeries[] {
  const out: IndicatorSeries[] = []
  if (data.length === 0) return out
  const k = 2 / (period + 1)
  let prev: number | null = null
  // seed with SMA of first `period` values
  let seedSum = 0
  for (let i = 0; i < data.length; i++) {
    if (i < period) {
      seedSum += data[i].close
      if (i === period - 1) {
        prev = seedSum / period
        out.push({ date: data[i].date, value: prev })
      } else {
        out.push({ date: data[i].date, value: null })
      }
    } else {
      const v = data[i].close * k + (prev as number) * (1 - k)
      prev = v
      out.push({ date: data[i].date, value: v })
    }
  }
  return out
}

/** RSI using Wilder's smoothing, period defaults to 14 */
export function rsi(data: HistoricalPoint[], period = 14): IndicatorSeries[] {
  const out: IndicatorSeries[] = []
  if (data.length === 0) return out
  let avgGain = 0
  let avgLoss = 0
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      out.push({ date: data[i].date, value: null })
      continue
    }
    const change = data[i].close - data[i - 1].close
    const gain = Math.max(change, 0)
    const loss = Math.max(-change, 0)
    if (i <= period) {
      avgGain += gain
      avgLoss += loss
      if (i === period) {
        avgGain /= period
        avgLoss /= period
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
        out.push({ date: data[i].date, value: 100 - 100 / (1 + rs) })
      } else {
        out.push({ date: data[i].date, value: null })
      }
    } else {
      avgGain = (avgGain * (period - 1) + gain) / period
      avgLoss = (avgLoss * (period - 1) + loss) / period
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
      out.push({ date: data[i].date, value: 100 - 100 / (1 + rs) })
    }
  }
  return out
}

/** MACD: 12-EMA - 26-EMA, signal = 9-EMA of MACD, histogram = MACD - signal */
export function macd(
  data: HistoricalPoint[],
  fast = 12,
  slow = 26,
  signalPeriod = 9,
): MACDSeries[] {
  const fastE = ema(data, fast)
  const slowE = ema(data, slow)
  const macdLine: { date: string; value: number | null }[] = data.map((d, i) => {
    const f = fastE[i]?.value
    const s = slowE[i]?.value
    return {
      date: d.date,
      value: f != null && s != null ? f - s : null,
    }
  })
  // signal line = EMA of macdLine (skip nulls; seed at first slow valid)
  const k = 2 / (signalPeriod + 1)
  const out: MACDSeries[] = []
  let prevSig: number | null = null
  let count = 0
  let seedSum = 0
  for (let i = 0; i < macdLine.length; i++) {
    const m = macdLine[i].value
    if (m == null) {
      out.push({ date: macdLine[i].date, macd: null, signal: null, histogram: null })
      continue
    }
    if (prevSig == null) {
      seedSum += m
      count++
      if (count === signalPeriod) {
        prevSig = seedSum / signalPeriod
        out.push({
          date: macdLine[i].date,
          macd: m,
          signal: prevSig,
          histogram: m - prevSig,
        })
      } else {
        out.push({ date: macdLine[i].date, macd: m, signal: null, histogram: null })
      }
    } else {
      prevSig = m * k + prevSig * (1 - k)
      out.push({
        date: macdLine[i].date,
        macd: m,
        signal: prevSig,
        histogram: m - prevSig,
      })
    }
  }
  return out
}

/** Bollinger Bands - period=20, stdDev multiplier=2 */
export function bollingerBands(
  data: HistoricalPoint[],
  period = 20,
  multiplier = 2,
): BollingerBandsSeries[] {
  const out: BollingerBandsSeries[] = []
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      out.push({ date: data[i].date, upper: null, middle: null, lower: null })
      continue
    }
    const slice = data.slice(i - period + 1, i + 1).map((d) => d.close)
    const mean = slice.reduce((a, b) => a + b, 0) / period
    const variance = slice.reduce((a, b) => a + (b - mean) ** 2, 0) / period
    const sd = Math.sqrt(variance)
    out.push({
      date: data[i].date,
      upper: mean + multiplier * sd,
      middle: mean,
      lower: mean - multiplier * sd,
    })
  }
  return out
}

/** Compute the full indicator bundle for charting and decision logic */
export function computeIndicators(data: HistoricalPoint[]): IndicatorBundle {
  return {
    sma20: sma(data, 20),
    sma50: sma(data, 50),
    sma200: sma(data, 200),
    ema12: ema(data, 12),
    ema26: ema(data, 26),
    rsi14: rsi(data, 14),
    macd: macd(data, 12, 26, 9),
    bollinger: bollingerBands(data, 20, 2),
  }
}

/** Heuristic signal generator using the latest indicator values */
export function generateSignal(
  data: HistoricalPoint[],
  ind: IndicatorBundle,
): { signal: "BUY" | "SELL" | "HOLD"; confidence: number; rationale: string[] } {
  const rationale: string[] = []
  let score = 0
  let weight = 0

  const last = data.length - 1
  const price = data[last].close

  const sma50 = ind.sma50[last]?.value
  const sma200 = ind.sma200[last]?.value
  if (sma50 != null && sma200 != null) {
    if (sma50 > sma200) {
      score += 1
      rationale.push("Golden cross: 50-day SMA above 200-day SMA (bullish trend).")
    } else {
      score -= 1
      rationale.push("Death cross: 50-day SMA below 200-day SMA (bearish trend).")
    }
    weight += 1
  }

  const sma20 = ind.sma20[last]?.value
  if (sma20 != null) {
    if (price > sma20) {
      score += 0.5
      rationale.push("Price is above the 20-day SMA (short-term bullish).")
    } else {
      score -= 0.5
      rationale.push("Price is below the 20-day SMA (short-term bearish).")
    }
    weight += 0.5
  }

  const rsiV = ind.rsi14[last]?.value
  if (rsiV != null) {
    if (rsiV > 70) {
      score -= 1
      rationale.push(`RSI ${rsiV.toFixed(1)} indicates overbought conditions.`)
    } else if (rsiV < 30) {
      score += 1
      rationale.push(`RSI ${rsiV.toFixed(1)} indicates oversold conditions.`)
    } else {
      rationale.push(`RSI ${rsiV.toFixed(1)} is in the neutral zone.`)
    }
    weight += 1
  }

  const m = ind.macd[last]
  const mPrev = ind.macd[last - 1]
  if (m?.macd != null && m?.signal != null && mPrev?.macd != null && mPrev?.signal != null) {
    const crossedUp = mPrev.macd <= mPrev.signal && m.macd > m.signal
    const crossedDown = mPrev.macd >= mPrev.signal && m.macd < m.signal
    if (crossedUp) {
      score += 1
      rationale.push("MACD bullish crossover detected.")
    } else if (crossedDown) {
      score -= 1
      rationale.push("MACD bearish crossover detected.")
    } else if (m.histogram != null) {
      if (m.histogram > 0) {
        score += 0.3
        rationale.push("MACD histogram is positive.")
      } else {
        score -= 0.3
        rationale.push("MACD histogram is negative.")
      }
    }
    weight += 1
  }

  const bb = ind.bollinger[last]
  if (bb?.upper != null && bb?.lower != null) {
    if (price >= bb.upper) {
      score -= 0.5
      rationale.push("Price is at or above the upper Bollinger band (potential pullback).")
    } else if (price <= bb.lower) {
      score += 0.5
      rationale.push("Price is at or below the lower Bollinger band (potential bounce).")
    }
    weight += 0.5
  }

  const normalized = weight === 0 ? 0 : score / weight
  let signal: "BUY" | "SELL" | "HOLD" = "HOLD"
  if (normalized > 0.3) signal = "BUY"
  else if (normalized < -0.3) signal = "SELL"

  return {
    signal,
    confidence: Math.min(1, Math.abs(normalized)),
    rationale,
  }
}
