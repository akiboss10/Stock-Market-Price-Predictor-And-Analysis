// Core domain types for the Stock Analysis & Prediction System

export interface Quote {
  symbol: string
  shortName?: string
  longName?: string
  regularMarketPrice: number
  regularMarketChange: number
  regularMarketChangePercent: number
  regularMarketPreviousClose: number
  regularMarketOpen?: number
  regularMarketDayHigh?: number
  regularMarketDayLow?: number
  regularMarketVolume?: number
  marketCap?: number
  fiftyTwoWeekHigh?: number
  fiftyTwoWeekLow?: number
  trailingPE?: number
  forwardPE?: number
  dividendYield?: number
  currency?: string
  exchange?: string
  quoteType?: string
  averageVolume?: number
  beta?: number
  epsTrailingTwelveMonths?: number
}

export interface HistoricalPoint {
  date: string // ISO date
  open: number
  high: number
  low: number
  close: number
  adjClose?: number
  volume: number
}

export type TimeRange = "1D" | "5D" | "1M" | "3M" | "6M" | "1Y" | "5Y" | "MAX"

export interface IndicatorSeries {
  date: string
  value: number | null
}

export interface MACDSeries {
  date: string
  macd: number | null
  signal: number | null
  histogram: number | null
}

export interface BollingerBandsSeries {
  date: string
  upper: number | null
  middle: number | null
  lower: number | null
}

export interface IndicatorBundle {
  sma20: IndicatorSeries[]
  sma50: IndicatorSeries[]
  sma200: IndicatorSeries[]
  ema12: IndicatorSeries[]
  ema26: IndicatorSeries[]
  rsi14: IndicatorSeries[]
  macd: MACDSeries[]
  bollinger: BollingerBandsSeries[]
}

export interface PredictionPoint {
  date: string
  predicted: number
  lower: number
  upper: number
}

export interface PredictionResult {
  symbol: string
  modelEnsemble: {
    linearRegression: number
    movingAverageDrift: number
    exponentialSmoothing: number
  }
  forecast: PredictionPoint[]
  signal: "BUY" | "SELL" | "HOLD"
  confidence: number // 0-1
  rationale: string[]
  metrics: {
    rmse: number
    mae: number
    rSquared: number
  }
}

export interface NewsItem {
  title: string
  link: string
  publisher?: string
  publishTime: string
  summary?: string
  thumbnail?: string
  sentiment?: SentimentScore
}

export interface SentimentScore {
  label: "POSITIVE" | "NEGATIVE" | "NEUTRAL"
  score: number // -1 to 1
  pos: number
  neg: number
  neu: number
}

export interface AggregateSentiment {
  overall: SentimentScore
  count: number
  positive: number
  negative: number
  neutral: number
}

export interface PortfolioHolding {
  id: string
  symbol: string
  shares: number
  avgCost: number
  purchaseDate: string
  notes?: string
}

export interface PriceAlert {
  id: string
  symbol: string
  type: "ABOVE" | "BELOW"
  threshold: number
  createdAt: string
  active: boolean
  triggeredAt?: string
}

export interface SearchResult {
  symbol: string
  shortname?: string
  longname?: string
  exchDisp?: string
  typeDisp?: string
}
