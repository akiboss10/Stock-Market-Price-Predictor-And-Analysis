# 📈 Quantum Stocks — AI-Powered Stock Analysis & Prediction Dashboard

A full-featured, real-time stock market analysis platform built with **Next.js 16**, featuring ML-based price prediction, technical indicators, sentiment analysis, portfolio tracking, and price alerts — all in a sleek dark-mode UI.

![Next.js](https://img.shields.io/badge/Next.js-16.2.4-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.2-38bdf8?logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ Features

### 📊 Market Dashboard
- Live market overview with major indices (S&P 500, Dow Jones, Nasdaq, Russell 2000, VIX, FTSE 100)
- Trending tickers & popular stocks grid
- Market heatmap visualization
- Real-time quote cards with change indicators

### 🔍 Stock Analysis (per symbol)
- **Interactive price chart** — 1D, 5D, 1M, 3M, 6M, 1Y, 5Y, MAX timeframes
- **Technical indicators** — SMA (20/50/200), EMA (12/26), RSI (14), MACD (12,26,9), Bollinger Bands (20, 2σ)
- **AI Price Prediction** — 7-day forecast with confidence intervals using an ensemble of 3 models
- **Trading signal** — Automated BUY / SELL / HOLD recommendation with confidence score & rationale
- **News & Sentiment** — Latest headlines with real-time sentiment scoring (Positive / Negative / Neutral)
- **Fundamentals** — P/E, EPS, market cap, 52-week range, volume, dividend yield, beta

### 📋 Watchlist
- Add/remove stocks to a personal watchlist
- Live quotes with auto-refresh
- Persistent via localStorage

### 💼 Portfolio Tracker
- Track holdings with shares, average cost, and purchase date
- Live P&L calculation
- Add/edit/remove positions

### 🔔 Price Alerts
- Set alerts for when a stock goes **above** or **below** a target price
- Auto-trigger detection with live price checks
- Persistent alerts with triggered history

### 🔀 Compare
- Side-by-side comparison of up to 5 stocks
- Normalized performance chart (% change over 1 year)
- Fundamentals comparison table

### 🔎 Screener & Search
- Global stock search with real-time suggestions
- Recent searches history
- Stock screener page

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, Turbopack) |
| **Language** | TypeScript 5.7 |
| **Styling** | Tailwind CSS 4.2 |
| **UI Components** | Radix UI + shadcn/ui |
| **Charts** | Recharts 2.15 |
| **Data Fetching** | SWR (client) + server-side fetch |
| **Data Source** | Yahoo Finance via [`yahoo-finance2`](https://github.com/gadicc/node-yahoo-finance2) |
| **Fonts** | Geist Sans + Geist Mono (Google Fonts) |
| **Theme** | `next-themes` (dark/light/system) |
| **Toasts** | Sonner |
| **Analytics** | Vercel Analytics |
| **Package Manager** | pnpm |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **pnpm** (recommended) or npm

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/stock-predictor-dashboard.git
cd stock-predictor-dashboard

# 2. Install dependencies
pnpm install

# 3. Start the development server
pnpm dev
```

The app will be running at **http://localhost:3000**

### Build for Production

```bash
pnpm build
pnpm start
```

---

## 📡 API Routes

All API routes are under `/app/api/` and act as a proxy to the Yahoo Finance API + local analysis engines:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/market` | GET | Market overview — indices, trending, popular tickers |
| `/api/quote/[symbol]` | GET | Single stock quote with full fundamentals |
| `/api/quotes?symbols=AAPL,MSFT` | GET | Batch quotes for multiple symbols |
| `/api/historical/[symbol]?range=1Y` | GET | OHLCV historical data for a symbol |
| `/api/historical-multi?symbols=AAPL,MSFT&range=1Y` | GET | Historical data for multiple symbols |
| `/api/indicators/[symbol]?range=1Y` | GET | Technical indicators + trading signal |
| `/api/predict/[symbol]` | GET | ML price prediction (7-day forecast) |
| `/api/news/[symbol]` | GET | News headlines + sentiment analysis |
| `/api/search?q=apple` | GET | Symbol search / autocomplete |
| `/api/analysis/[symbol]` | GET | Full analysis bundle (quote + indicators + prediction) |

---

## 🧠 Analysis Engines

All analysis is computed **locally in TypeScript** — no external AI/ML APIs required.

### 1. Technical Indicators (`lib/indicators.ts`)
Implemented from scratch using standard financial formulas:
- **SMA** (Simple Moving Average) — 20, 50, 200 day
- **EMA** (Exponential Moving Average) — 12, 26 day
- **RSI** (Relative Strength Index) — 14-day, Wilder's smoothing
- **MACD** (Moving Average Convergence Divergence) — (12, 26, 9)
- **Bollinger Bands** — 20-day, 2σ

### 2. Signal Generator (`lib/indicators.ts`)
Heuristic BUY/SELL/HOLD signal based on:
- Golden/Death cross (SMA 50 vs 200)
- Price vs SMA 20
- RSI overbought/oversold zones
- MACD crossovers
- Bollinger Band position

### 3. Price Prediction (`lib/predict.ts`)
Ensemble of 3 classical forecasting models:

| Model | Description |
|-------|-------------|
| **Linear Regression** | OLS on time-indexed closing prices |
| **Moving-Average Drift** | Hyndman & Athanasopoulos drift method |
| **Holt's Exponential Smoothing** | Double exponential (level + trend) |

- Models are **weighted by inverse RMSE** (better fit → higher weight)
- **Prediction intervals** at 95% confidence (1.96σ), widening over the forecast horizon
- Walk-forward validation on last 20% of data

### 4. Sentiment Analysis (`lib/sentiment.ts`)
Lexicon-based approach inspired by **VADER** + **Loughran-McDonald** financial dictionary:
- 150+ curated financial terms with weighted scores [-3, +3]
- Negation handling (e.g., "not profitable" → negative)
- Intensifier support (e.g., "extremely bullish" → amplified)
- Tanh-normalized compound score [-1, +1]
- Aggregate scoring across multiple headlines

---

## 📁 Project Structure

```
Stock predictor dashboard/
├── app/                          # Next.js App Router pages
│   ├── api/                      # Server-side API routes
│   │   ├── analysis/[symbol]/    # Full analysis bundle
│   │   ├── historical/[symbol]/  # OHLCV price history
│   │   ├── historical-multi/     # Multi-symbol history
│   │   ├── indicators/[symbol]/  # Technical indicators
│   │   ├── market/               # Market overview data
│   │   ├── news/[symbol]/        # News + sentiment
│   │   ├── predict/[symbol]/     # ML price prediction
│   │   ├── quote/[symbol]/       # Single quote
│   │   ├── quotes/               # Batch quotes
│   │   └── search/               # Symbol search
│   ├── alerts/                   # Price alerts page
│   ├── compare/                  # Stock comparison page
│   ├── portfolio/                # Portfolio tracker page
│   ├── screener/                 # Stock screener page
│   ├── search/                   # Search results page
│   ├── stock/[symbol]/           # Individual stock analysis
│   ├── watchlist/                # Watchlist page
│   ├── layout.tsx                # Root layout (sidebar, theme, fonts)
│   ├── page.tsx                  # Home / market dashboard
│   └── globals.css               # Global styles + CSS variables
│
├── components/                   # React components
│   ├── alerts/                   # Alert management UI
│   ├── compare/                  # Stock comparison UI
│   ├── portfolio/                # Portfolio management UI
│   ├── screener/                 # Screener filters & results
│   ├── stock/                    # Stock detail components
│   ├── watchlist/                # Watchlist components
│   ├── ui/                       # shadcn/ui base components
│   ├── app-sidebar.tsx           # Navigation sidebar
│   ├── global-search.tsx         # Command-palette search
│   ├── market-heatmap.tsx        # Market heatmap grid
│   ├── market-status.tsx         # Market open/close indicator
│   ├── quote-card.tsx            # Reusable stock quote card
│   ├── change-pill.tsx           # Green/red change badge
│   ├── theme-provider.tsx        # Dark/light theme wrapper
│   └── theme-toggle.tsx          # Theme switcher button
│
├── lib/                          # Core logic & utilities
│   ├── yahoo.ts                  # Yahoo Finance API wrapper (server-only)
│   ├── indicators.ts             # Technical indicators engine
│   ├── predict.ts                # ML prediction engine
│   ├── sentiment.ts              # Sentiment analysis engine
│   ├── storage.ts                # localStorage persistence (client)
│   ├── format.ts                 # Number/currency/date formatters
│   ├── types.ts                  # TypeScript type definitions
│   └── utils.ts                  # General utilities (cn helper)
│
├── hooks/                        # Custom React hooks
├── styles/                       # Additional stylesheets
├── public/                       # Static assets
├── package.json                  # Dependencies & scripts
├── tsconfig.json                 # TypeScript configuration
├── next.config.mjs               # Next.js configuration
└── postcss.config.mjs            # PostCSS / Tailwind config
```

---

## 🔧 Configuration

### Environment Variables

No environment variables are required! The app uses the **Yahoo Finance public API** via the `yahoo-finance2` package which doesn't need an API key.

### Customization

| What | Where |
|------|-------|
| App name & SEO metadata | `app/layout.tsx` → `metadata` object |
| Default theme (dark/light) | `app/layout.tsx` → `ThemeProvider defaultTheme` |
| Major indices list | `lib/yahoo.ts` → `MAJOR_INDICES` array |
| Popular tickers | `lib/yahoo.ts` → `POPULAR_TICKERS` array |
| Prediction horizon | `lib/predict.ts` → `horizon` param (default: 7 days) |
| Prediction lookback | `lib/predict.ts` → `lookback` param (default: 90 days) |
| Sentiment lexicon | `lib/sentiment.ts` → `LEXICON` object |

---

## 📦 Key Dependencies

| Package | Purpose |
|---------|---------|
| `next` | React framework (App Router, SSR, API routes) |
| `yahoo-finance2` | Yahoo Finance data (quotes, charts, news, search) |
| `recharts` | Interactive stock charts & visualizations |
| `swr` | Client-side data fetching with caching & revalidation |
| `@radix-ui/*` | Accessible, unstyled UI primitives |
| `lucide-react` | Icon library |
| `sonner` | Toast notifications |
| `next-themes` | Dark/light mode support |
| `cmdk` | Command-palette search (⌘K) |
| `tailwind-merge` | Merge Tailwind classes without conflicts |
| `class-variance-authority` | Component variant styling |
| `zod` | Schema validation |
| `react-hook-form` | Form state management |

---

## 🗄️ Data Storage

- **Client-side only** — all user data (watchlist, portfolio, alerts, recent searches) is stored in **localStorage**
- No database required
- No user accounts or authentication
- Data persists across browser sessions but is device-specific

---

## 📝 Scripts

```bash
pnpm dev        # Start dev server with Turbopack (http://localhost:3000)
pnpm build      # Build for production
pnpm start      # Start production server
pnpm lint       # Run ESLint
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## ⚠️ Disclaimer

This application is for **educational and informational purposes only**. It does not constitute financial advice. The predictions are based on statistical models and should not be used as the sole basis for investment decisions. Always do your own research and consult a qualified financial advisor.

---

## 📄 License

This project is licensed under the MIT License.
