// Lexicon-based sentiment analysis tuned for financial news.
// Inspired by VADER + Loughran-McDonald financial dictionary.
// Scores each headline / summary on a [-1, 1] valence scale and aggregates.

import type { SentimentScore, AggregateSentiment } from "./types"

// Curated financial sentiment lexicon. Weights roughly in [-3, 3].
const LEXICON: Record<string, number> = {
  // strong positive
  surge: 2.5,
  surges: 2.5,
  surged: 2.5,
  soar: 2.8,
  soars: 2.8,
  soared: 2.8,
  rally: 2.0,
  rallies: 2.0,
  rallied: 2.0,
  jump: 1.8,
  jumps: 1.8,
  jumped: 1.8,
  beat: 2.2,
  beats: 2.2,
  outperform: 2.5,
  outperforms: 2.5,
  outperformed: 2.5,
  upgrade: 2.4,
  upgraded: 2.4,
  upgrades: 2.4,
  bullish: 2.5,
  growth: 1.5,
  profit: 1.8,
  profits: 1.8,
  profitable: 1.8,
  gain: 1.5,
  gains: 1.5,
  gained: 1.5,
  rise: 1.4,
  rises: 1.4,
  rose: 1.4,
  rising: 1.4,
  strong: 1.5,
  stronger: 1.5,
  positive: 1.4,
  record: 1.6,
  high: 0.9,
  highs: 0.9,
  buy: 1.6,
  expand: 1.5,
  expansion: 1.5,
  innovation: 1.2,
  breakthrough: 2.2,
  approval: 2.0,
  approved: 2.0,
  partnership: 1.4,
  acquire: 1.3,
  acquired: 1.3,
  acquisition: 1.3,
  dividend: 1.1,
  raised: 1.5,
  hike: 1.4,
  boom: 2.4,
  optimistic: 1.8,
  momentum: 1.4,
  exceed: 2.0,
  exceeded: 2.0,
  exceeds: 2.0,
  blockbuster: 2.6,
  recovery: 1.6,
  rebound: 1.8,
  // strong negative
  plunge: -2.8,
  plunges: -2.8,
  plunged: -2.8,
  crash: -3.0,
  crashes: -3.0,
  crashed: -3.0,
  collapse: -2.8,
  collapses: -2.8,
  collapsed: -2.8,
  tumble: -2.4,
  tumbles: -2.4,
  tumbled: -2.4,
  slump: -2.0,
  slumps: -2.0,
  slumped: -2.0,
  fall: -1.4,
  falls: -1.4,
  fell: -1.4,
  falling: -1.4,
  drop: -1.5,
  drops: -1.5,
  dropped: -1.5,
  decline: -1.5,
  declines: -1.5,
  declined: -1.5,
  miss: -2.0,
  misses: -2.0,
  missed: -2.0,
  downgrade: -2.4,
  downgraded: -2.4,
  downgrades: -2.4,
  bearish: -2.5,
  loss: -1.8,
  losses: -1.8,
  losing: -1.6,
  lost: -1.6,
  weak: -1.4,
  weaker: -1.4,
  negative: -1.4,
  low: -0.7,
  lows: -0.7,
  sell: -1.6,
  fraud: -3.0,
  scandal: -2.8,
  lawsuit: -1.8,
  lawsuits: -1.8,
  investigation: -1.6,
  probe: -1.4,
  bankruptcy: -3.0,
  bankrupt: -3.0,
  default: -2.5,
  defaults: -2.5,
  layoff: -2.0,
  layoffs: -2.0,
  cut: -1.0,
  cuts: -1.0,
  cutting: -1.0,
  warning: -1.6,
  warned: -1.6,
  warns: -1.6,
  recession: -2.6,
  inflation: -1.0,
  fears: -1.5,
  fear: -1.5,
  concerns: -1.0,
  concern: -1.0,
  pressure: -0.8,
  uncertain: -1.2,
  uncertainty: -1.2,
  volatile: -0.9,
  volatility: -0.9,
  shrink: -1.5,
  shrank: -1.5,
  shrinks: -1.5,
  delay: -1.0,
  delayed: -1.0,
  delays: -1.0,
  recall: -1.8,
  recalled: -1.8,
  recalls: -1.8,
  halt: -1.6,
  halted: -1.6,
  halts: -1.6,
}

const NEGATIONS = new Set([
  "not",
  "no",
  "never",
  "none",
  "nothing",
  "without",
  "hardly",
  "barely",
  "scarcely",
  "neither",
  "nor",
])

const INTENSIFIERS: Record<string, number> = {
  very: 1.3,
  extremely: 1.5,
  highly: 1.3,
  significantly: 1.4,
  sharply: 1.5,
  massively: 1.6,
  slightly: 0.6,
  somewhat: 0.7,
  modestly: 0.7,
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
}

/** Score a single piece of text */
export function analyzeText(text: string): SentimentScore {
  if (!text) return neutralScore()
  const tokens = tokenize(text)
  let sumPos = 0
  let sumNeg = 0
  let hits = 0

  for (let i = 0; i < tokens.length; i++) {
    const word = tokens[i]
    const baseScore = LEXICON[word]
    if (baseScore === undefined) continue
    let score = baseScore
    // check 2 words back for negation/intensifier
    for (let j = 1; j <= 2; j++) {
      const prev = tokens[i - j]
      if (!prev) break
      if (NEGATIONS.has(prev)) score *= -0.8
      else if (INTENSIFIERS[prev]) score *= INTENSIFIERS[prev]
    }
    if (score > 0) sumPos += score
    else sumNeg += Math.abs(score)
    hits++
  }

  if (hits === 0) return neutralScore()

  const total = sumPos + sumNeg
  const pos = sumPos / total
  const neg = sumNeg / total
  const neu = Math.max(0, 1 - pos - neg)
  // raw compound: tanh-like normalization to [-1, 1]
  const rawComp = (sumPos - sumNeg) / Math.sqrt((sumPos - sumNeg) ** 2 + 15)
  let label: "POSITIVE" | "NEGATIVE" | "NEUTRAL" = "NEUTRAL"
  if (rawComp >= 0.05) label = "POSITIVE"
  else if (rawComp <= -0.05) label = "NEGATIVE"
  return { label, score: rawComp, pos, neg, neu }
}

function neutralScore(): SentimentScore {
  return { label: "NEUTRAL", score: 0, pos: 0, neg: 0, neu: 1 }
}

/** Aggregate scores over multiple news items */
export function aggregateSentiment(scores: SentimentScore[]): AggregateSentiment {
  if (scores.length === 0) {
    return {
      overall: neutralScore(),
      count: 0,
      positive: 0,
      negative: 0,
      neutral: 0,
    }
  }
  const sum = scores.reduce((a, b) => a + b.score, 0)
  const avg = sum / scores.length
  let label: "POSITIVE" | "NEGATIVE" | "NEUTRAL" = "NEUTRAL"
  if (avg >= 0.05) label = "POSITIVE"
  else if (avg <= -0.05) label = "NEGATIVE"
  const positive = scores.filter((s) => s.label === "POSITIVE").length
  const negative = scores.filter((s) => s.label === "NEGATIVE").length
  const neutral = scores.filter((s) => s.label === "NEUTRAL").length
  return {
    overall: {
      label,
      score: avg,
      pos: positive / scores.length,
      neg: negative / scores.length,
      neu: neutral / scores.length,
    },
    count: scores.length,
    positive,
    negative,
    neutral,
  }
}
