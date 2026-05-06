// ML Prediction Engine
// Ensemble of three classical forecasting models implemented from scratch:
//   1. Ordinary Least Squares Linear Regression on time index
//   2. Moving-Average Drift (Hyndman & Athanasopoulos drift method)
//   3. Holt's Linear Exponential Smoothing (level + trend)
// The forecast is the weighted average of the three, with prediction intervals
// from residual standard deviation.

import type { HistoricalPoint, PredictionResult, PredictionPoint } from "./types"
import { computeIndicators, generateSignal } from "./indicators"

interface LinearFit {
  slope: number
  intercept: number
  residuals: number[]
  rSquared: number
  rmse: number
  mae: number
}

function linearRegression(y: number[]): LinearFit {
  const n = y.length
  const x = Array.from({ length: n }, (_, i) => i)
  const meanX = x.reduce((a, b) => a + b, 0) / n
  const meanY = y.reduce((a, b) => a + b, 0) / n
  let num = 0
  let den = 0
  for (let i = 0; i < n; i++) {
    num += (x[i] - meanX) * (y[i] - meanY)
    den += (x[i] - meanX) ** 2
  }
  const slope = den === 0 ? 0 : num / den
  const intercept = meanY - slope * meanX
  let ssRes = 0
  let ssTot = 0
  let absErr = 0
  const residuals: number[] = []
  for (let i = 0; i < n; i++) {
    const yhat = slope * x[i] + intercept
    const r = y[i] - yhat
    residuals.push(r)
    ssRes += r * r
    ssTot += (y[i] - meanY) ** 2
    absErr += Math.abs(r)
  }
  const rSquared = ssTot === 0 ? 0 : 1 - ssRes / ssTot
  const rmse = Math.sqrt(ssRes / n)
  const mae = absErr / n
  return { slope, intercept, residuals, rSquared, rmse, mae }
}

/** Moving-average drift forecast: extends last value with average per-step drift */
function driftForecast(y: number[], horizon: number): number[] {
  const n = y.length
  if (n < 2) return Array(horizon).fill(y[n - 1] ?? 0)
  const drift = (y[n - 1] - y[0]) / (n - 1)
  const out: number[] = []
  for (let h = 1; h <= horizon; h++) out.push(y[n - 1] + drift * h)
  return out
}

/** Holt's linear (double) exponential smoothing */
function holtForecast(
  y: number[],
  horizon: number,
  alpha = 0.6,
  beta = 0.2,
): number[] {
  if (y.length === 0) return Array(horizon).fill(0)
  if (y.length === 1) return Array(horizon).fill(y[0])
  let level = y[0]
  let trend = y[1] - y[0]
  for (let i = 1; i < y.length; i++) {
    const prevLevel = level
    level = alpha * y[i] + (1 - alpha) * (level + trend)
    trend = beta * (level - prevLevel) + (1 - beta) * trend
  }
  const out: number[] = []
  for (let h = 1; h <= horizon; h++) out.push(level + h * trend)
  return out
}

/**
 * Run an ensemble forecast. We use the trailing window of `lookback` closes,
 * generate `horizon` future business days, and combine three models with
 * weights derived from each model's training-fit accuracy.
 */
export function predictPrices(
  data: HistoricalPoint[],
  horizon = 7,
  lookback = 90,
): PredictionResult {
  const symbol = "" // filled by caller
  const window = data.slice(Math.max(0, data.length - lookback))
  const closes = window.map((d) => d.close)
  const fit = linearRegression(closes)

  // generate next dates (skip weekends for realism)
  const lastDate = new Date(window[window.length - 1].date)
  const futureDates: string[] = []
  const cursor = new Date(lastDate)
  while (futureDates.length < horizon) {
    cursor.setDate(cursor.getDate() + 1)
    const dow = cursor.getDay()
    if (dow !== 0 && dow !== 6) {
      futureDates.push(cursor.toISOString().slice(0, 10))
    }
  }

  // model outputs
  const lrPreds: number[] = []
  for (let h = 1; h <= horizon; h++) {
    lrPreds.push(fit.slope * (closes.length - 1 + h) + fit.intercept)
  }
  const driftPreds = driftForecast(closes, horizon)
  const holtPreds = holtForecast(closes, horizon)

  // weight by inverse RMSE on in-sample fit (proxy)
  const driftFit = inSampleError(closes, (yArr, h) => driftForecast(yArr, h))
  const holtFit = inSampleError(closes, (yArr, h) => holtForecast(yArr, h))
  const weights = inverseRmseWeights([fit.rmse, driftFit.rmse, holtFit.rmse])

  const ensemble: number[] = lrPreds.map((_, i) => {
    return (
      weights[0] * lrPreds[i] +
      weights[1] * driftPreds[i] +
      weights[2] * holtPreds[i]
    )
  })

  // residual stdev for prediction intervals (95% ~ 1.96σ)
  const residSd = Math.sqrt(
    fit.residuals.reduce((a, b) => a + b * b, 0) / Math.max(1, fit.residuals.length - 1),
  )
  const forecast: PredictionPoint[] = ensemble.map((p, i) => {
    // widen interval over horizon to reflect growing uncertainty
    const widen = Math.sqrt(i + 1)
    return {
      date: futureDates[i],
      predicted: p,
      lower: p - 1.96 * residSd * widen,
      upper: p + 1.96 * residSd * widen,
    }
  })

  // Generate trading signal from technicals
  const indicators = computeIndicators(data)
  const sig = generateSignal(data, indicators)

  // Adjust signal slightly based on forecast direction
  const lastClose = data[data.length - 1].close
  const forecastLast = forecast[forecast.length - 1].predicted
  const forecastReturn = (forecastLast - lastClose) / lastClose
  let { signal, confidence, rationale } = sig
  if (forecastReturn > 0.03 && signal === "HOLD") {
    signal = "BUY"
    rationale.push(
      `Ensemble forecast suggests +${(forecastReturn * 100).toFixed(2)}% over ${horizon} sessions.`,
    )
  } else if (forecastReturn < -0.03 && signal === "HOLD") {
    signal = "SELL"
    rationale.push(
      `Ensemble forecast suggests ${(forecastReturn * 100).toFixed(2)}% over ${horizon} sessions.`,
    )
  } else {
    rationale.push(
      `Ensemble forecast: ${(forecastReturn * 100).toFixed(2)}% expected over ${horizon} sessions.`,
    )
  }

  return {
    symbol,
    modelEnsemble: {
      linearRegression: lrPreds[lrPreds.length - 1],
      movingAverageDrift: driftPreds[driftPreds.length - 1],
      exponentialSmoothing: holtPreds[holtPreds.length - 1],
    },
    forecast,
    signal,
    confidence: Math.max(confidence, Math.min(1, Math.abs(forecastReturn) * 10)),
    rationale,
    metrics: {
      rmse: fit.rmse,
      mae: fit.mae,
      rSquared: fit.rSquared,
    },
  }
}

function inSampleError(
  y: number[],
  forecaster: (yArr: number[], horizon: number) => number[],
) {
  // walk-forward 1-step ahead error on last 20% of data
  const splitIdx = Math.max(2, Math.floor(y.length * 0.8))
  let sse = 0
  let abs = 0
  let n = 0
  for (let i = splitIdx; i < y.length; i++) {
    const train = y.slice(0, i)
    const pred = forecaster(train, 1)[0]
    const err = y[i] - pred
    sse += err * err
    abs += Math.abs(err)
    n++
  }
  return {
    rmse: n === 0 ? 0 : Math.sqrt(sse / n),
    mae: n === 0 ? 0 : abs / n,
  }
}

function inverseRmseWeights(rmses: number[]): number[] {
  const inv = rmses.map((r) => (r > 0 ? 1 / r : 1))
  const sum = inv.reduce((a, b) => a + b, 0)
  return inv.map((v) => v / sum)
}
