// Advanced Market Intelligence Module with AI-Powered Strategy Recommendations
// Analyzes market conditions, trends, and recommends optimal strategies

const { getMarketData, createAuthenticatedClient } = require('./angelOneSDK')

// Market assessment interval: 15 minutes (optimal balance between accuracy and API rate limits)
const ASSESSMENT_INTERVAL_MINUTES = 15

// Cache market intelligence to avoid excessive API calls
let marketIntelligenceCache = {
  data: null,
  timestamp: null,
  ttl: ASSESSMENT_INTERVAL_MINUTES * 60 * 1000 // 15 minutes in milliseconds
}

/**
 * Enhanced Market Intelligence Analysis
 * Collects multiple market indicators and uses AI/ML for strategy recommendations
 */
async function analyzeMarketIntelligence() {
  try {
    // Check cache first
    if (marketIntelligenceCache.data && marketIntelligenceCache.timestamp) {
      const age = Date.now() - marketIntelligenceCache.timestamp
      if (age < marketIntelligenceCache.ttl) {
        console.log('[MarketIntel] Using cached market intelligence (age:', Math.round(age / 1000), 's)')
        return marketIntelligenceCache.data
      }
    }

    // Use platform credentials for market intelligence
    const apiKey = process.env.ANGEL_ONE_API_KEY
    const clientId = process.env.ANGEL_ONE_CLIENT_ID
    const password = process.env.ANGEL_ONE_PASSWORD
    const mpin = process.env.ANGEL_ONE_PASSWORD
    const totpSecret = process.env.ANGEL_ONE_TOTP_SECRET

    if (!apiKey || !clientId || !totpSecret || (!password && !mpin)) {
      return { conditions: null, recommendations: [], error: 'Missing Angel One credentials' }
    }

    // Authenticate
    const auth = await createAuthenticatedClient({
      apiKey,
      clientId,
      password: password || mpin,
      mpin: mpin,
      totpSecret
    })

    if (!auth.success || !auth.client) {
      return { conditions: null, recommendations: [], error: auth.error || 'Authentication failed' }
    }

    // Fetch comprehensive market data
    const marketDataResult = await getMarketData(auth.client, {
      mode: 'FULL', // Get full data for better analysis
      exchangeTokens: {
        NSE: ['99926000', '99926009', '99926037', '99926017'], // NIFTY, BANKNIFTY, FINNIFTY, VIX
        BSE: ['99919000'] // SENSEX
      }
    })

    if (!marketDataResult.success) {
      return { conditions: null, recommendations: [], error: marketDataResult.error }
    }

    const marketData = marketDataResult.data
    const fetched = marketData?.fetched || []

    // Extract key market indicators
    const vixData = fetched.find(d => d.symbolToken === '99926017')
    const niftyData = fetched.find(d => d.symbolToken === '99926000')
    const bankniftyData = fetched.find(d => d.symbolToken === '99926009')
    const finniftyData = fetched.find(d => d.symbolToken === '99926037')

    const vix = vixData?.ltp || 15
    const niftySpot = niftyData?.ltp || 24750
    const niftyChange = niftyData?.change || 0
    const niftyChangePercent = niftyData?.changePercent || 0
    const niftyVolume = niftyData?.tradeVolume || 0
    const niftyOpen = niftyData?.open || niftySpot
    const niftyHigh = niftyData?.high || niftySpot
    const niftyLow = niftyData?.low || niftySpot
    const niftyClose = niftyData?.close || niftySpot

    const bankniftySpot = bankniftyData?.ltp || 51200
    const bankniftyChangePercent = bankniftyData?.changePercent || 0

    // Calculate technical indicators
    const technicalIndicators = calculateTechnicalIndicators({
      current: niftySpot,
      open: niftyOpen,
      high: niftyHigh,
      low: niftyLow,
      close: niftyClose,
      change: niftyChange,
      changePercent: niftyChangePercent,
      volume: niftyVolume
    })

    // Analyze market trend
    const trendAnalysis = analyzeTrend({
      niftySpot,
      niftyChange,
      niftyChangePercent,
      bankniftyChangePercent,
      vix,
      technicalIndicators
    })

    // Build comprehensive market conditions
    const conditions = {
      vix,
      niftySpot,
      bankniftySpot,
      niftyChange,
      niftyChangePercent,
      volume: niftyVolume,
      trend: trendAnalysis.trend,
      trendStrength: trendAnalysis.strength,
      volatilityLevel: getVolatilityLevel(vix),
      marketSentiment: trendAnalysis.sentiment,
      technicalIndicators,
      timestamp: new Date().toISOString()
    }

    // AI-Powered Strategy Recommendations
    const recommendations = generateStrategyRecommendations(conditions, trendAnalysis)

    // Calculate VIX change for adaptive scheduler
    const previousVix = marketIntelligenceCache.data?.conditions?.vix
    const vixChange = previousVix ? (vix - previousVix) : 0

    const result = {
      conditions: {
        ...conditions,
        vixChange: parseFloat(vixChange.toFixed(2)) // Add VIX change for adaptive scheduling
      },
      recommendations,
      trendAnalysis,
      assessmentInterval: 'adaptive' // Now uses adaptive 5/10/15 minute intervals
    }

    // Cache the result
    marketIntelligenceCache = {
      data: result,
      timestamp: Date.now(),
      ttl: ASSESSMENT_INTERVAL_MINUTES * 60 * 1000
    }

    console.log('[MarketIntel] Market intelligence updated:', {
      vix: vix.toFixed(2),
      nifty: niftySpot.toFixed(2),
      trend: trendAnalysis.trend,
      recommendations: recommendations.length
    })

    return result
  } catch (error) {
    console.error('[MarketIntel] Analysis error:', error)
    return { conditions: null, recommendations: [], error: error.message }
  }
}

/**
 * Calculate Technical Indicators (Enhanced)
 * No external APIs needed - all calculated from Angel One data
 */
function calculateTechnicalIndicators(data) {
  const { current, open, high, low, close, change, changePercent, volume, previousClose } = data

  // Price position within daily range
  const dailyRange = high - low
  const pricePosition = dailyRange > 0 ? ((current - low) / dailyRange) * 100 : 50

  // Momentum indicators
  const momentum = changePercent
  const momentumStrength = Math.abs(momentum)

  // Volume analysis
  const volumeIndicator = volume > 0 ? 'normal' : 'low'
  const volumeRatio = volume > 0 ? (volume / 1000000) : 0 // Normalize volume

  // Support/Resistance levels
  const supportLevel = low
  const resistanceLevel = high
  const midLevel = (high + low) / 2

  // Volatility (based on daily range)
  const volatility = dailyRange > 0 ? (dailyRange / close) * 100 : 0

  // Simple RSI approximation (would need 14-period data for accurate RSI)
  // Using current change as proxy
  const rsiApproximation = changePercent > 0 ? 
    Math.min(70, 50 + (changePercent * 2)) : 
    Math.max(30, 50 + (changePercent * 2))

  // Price action classification
  const priceAction = current > open ? 'bullish' : current < open ? 'bearish' : 'neutral'
  const bodySize = Math.abs(current - open)
  const bodyPercent = close > 0 ? (bodySize / close) * 100 : 0

  // Trend strength (based on price position and momentum)
  let trendStrength = 'weak'
  if (pricePosition > 70 && momentum > 0.5) trendStrength = 'strong'
  else if (pricePosition < 30 && momentum < -0.5) trendStrength = 'strong'
  else if (pricePosition > 60 || pricePosition < 40) trendStrength = 'moderate'

  return {
    pricePosition: parseFloat(pricePosition.toFixed(2)),
    momentum: parseFloat(momentum.toFixed(2)),
    momentumStrength: parseFloat(momentumStrength.toFixed(2)),
    volumeIndicator,
    volumeRatio: parseFloat(volumeRatio.toFixed(2)),
    supportLevel: parseFloat(supportLevel.toFixed(2)),
    resistanceLevel: parseFloat(resistanceLevel.toFixed(2)),
    midLevel: parseFloat(midLevel.toFixed(2)),
    volatility: parseFloat(volatility.toFixed(2)),
    rsiApproximation: parseFloat(rsiApproximation.toFixed(2)),
    priceAction,
    bodySize: parseFloat(bodySize.toFixed(2)),
    bodyPercent: parseFloat(bodyPercent.toFixed(2)),
    trendStrength,
    isNearSupport: current <= low * 1.01, // Within 1% of support
    isNearResistance: current >= high * 0.99, // Within 1% of resistance
    isNearMid: Math.abs(current - midLevel) / midLevel < 0.005 // Within 0.5% of mid
  }
}

/**
 * Analyze Market Trend
 */
function analyzeTrend(data) {
  const { niftyChangePercent, bankniftyChangePercent, vix, technicalIndicators } = data

  // Determine primary trend
  let trend = 'sideways'
  let strength = 'weak'
  let sentiment = 'neutral'

  // Bullish indicators
  const bullishSignals = []
  if (niftyChangePercent > 0.3) bullishSignals.push('nifty_up')
  if (bankniftyChangePercent > 0.3) bullishSignals.push('banknifty_up')
  if (technicalIndicators.momentum > 0.5) bullishSignals.push('momentum_positive')
  if (vix < 15) bullishSignals.push('low_volatility')

  // Bearish indicators
  const bearishSignals = []
  if (niftyChangePercent < -0.3) bearishSignals.push('nifty_down')
  if (bankniftyChangePercent < -0.3) bearishSignals.push('banknifty_down')
  if (technicalIndicators.momentum < -0.5) bearishSignals.push('momentum_negative')
  if (vix > 20) bearishSignals.push('high_volatility')

  // Determine trend
  if (bullishSignals.length > bearishSignals.length && bullishSignals.length >= 2) {
    trend = 'bullish'
    strength = bullishSignals.length >= 3 ? 'strong' : 'moderate'
    sentiment = 'positive'
  } else if (bearishSignals.length > bullishSignals.length && bearishSignals.length >= 2) {
    trend = 'bearish'
    strength = bearishSignals.length >= 3 ? 'strong' : 'moderate'
    sentiment = 'negative'
  } else {
    trend = 'sideways'
    strength = 'weak'
    sentiment = 'neutral'
  }

  return {
    trend,
    strength,
    sentiment,
    bullishSignals: bullishSignals.length,
    bearishSignals: bearishSignals.length,
    confidence: calculateTrendConfidence(bullishSignals.length, bearishSignals.length, vix)
  }
}

/**
 * Calculate Trend Confidence Score
 */
function calculateTrendConfidence(bullishCount, bearishCount, vix) {
  const signalDifference = Math.abs(bullishCount - bearishCount)
  const vixFactor = vix < 15 ? 1.2 : vix > 20 ? 0.8 : 1.0 // Lower VIX = higher confidence
  
  let confidence = 'low'
  const score = signalDifference * vixFactor

  if (score >= 3) confidence = 'high'
  else if (score >= 2) confidence = 'medium'
  else confidence = 'low'

  return confidence
}

/**
 * Get Volatility Level
 */
function getVolatilityLevel(vix) {
  if (vix >= 25) return 'very_high'
  if (vix >= 20) return 'high'
  if (vix >= 15) return 'medium'
  if (vix >= 10) return 'low'
  return 'very_low'
}

/**
 * AI-Powered Strategy Recommendation Engine
 * Uses weighted scoring system based on market conditions
 */
function generateStrategyRecommendations(conditions, trendAnalysis) {
  const recommendations = []
  const { vix, trend, trendStrength, volatilityLevel, technicalIndicators, niftyChangePercent } = conditions

  // Strategy scoring system
  const strategyScores = {
    'Short Strangle': 0,
    'Iron Condor': 0,
    'Short Straddle': 0,
    'Long Straddle': 0,
    'Bull Call Spread': 0,
    'Bull Put Spread': 0,
    'Covered Call': 0
  }

  // High VIX (20+) - Favor premium collection strategies
  if (vix >= 20) {
    strategyScores['Short Strangle'] += 30
    strategyScores['Iron Condor'] += 25
    strategyScores['Short Straddle'] += 20
    strategyScores['Bull Put Spread'] += 15
  }

  // Very High VIX (25+) - Strong premium collection
  if (vix >= 25) {
    strategyScores['Short Strangle'] += 20
    strategyScores['Iron Condor'] += 15
  }

  // Low VIX (< 15) - Favor buying strategies for breakout
  if (vix < 15) {
    strategyScores['Long Straddle'] += 25
    strategyScores['Bull Call Spread'] += 20
    if (trend === 'bullish') {
      strategyScores['Bull Call Spread'] += 15
      strategyScores['Covered Call'] += 10
    }
  }

  // Very Low VIX (< 10) - Strong buying opportunity
  if (vix < 10) {
    strategyScores['Long Straddle'] += 15
    strategyScores['Bull Call Spread'] += 10
  }

  // Trend-based scoring
  if (trend === 'bullish' && trendStrength === 'strong') {
    strategyScores['Bull Call Spread'] += 20
    strategyScores['Bull Put Spread'] += 15
    strategyScores['Covered Call'] += 10
  }

  if (trend === 'bearish' && trendStrength === 'strong') {
    strategyScores['Short Strangle'] += 15
    strategyScores['Iron Condor'] += 15
  }

  if (trend === 'sideways') {
    strategyScores['Short Strangle'] += 20
    strategyScores['Iron Condor'] += 20
    strategyScores['Short Straddle'] += 15
  }

  // Technical indicator scoring
  if (technicalIndicators.isNearSupport && trend === 'bullish') {
    strategyScores['Bull Call Spread'] += 10
    strategyScores['Long Straddle'] += 5
  }

  if (technicalIndicators.isNearResistance && trend === 'bearish') {
    strategyScores['Short Strangle'] += 10
    strategyScores['Iron Condor'] += 10
  }

  // Momentum-based scoring
  if (technicalIndicators.momentumStrength > 1.0) {
    if (technicalIndicators.momentum > 0) {
      strategyScores['Bull Call Spread'] += 10
    } else {
      strategyScores['Short Strangle'] += 10
    }
  }

  // Convert scores to recommendations
  const sortedStrategies = Object.entries(strategyScores)
    .filter(([_, score]) => score > 0)
    .sort(([_, a], [__, b]) => b - a)
    .slice(0, 3) // Top 3 recommendations

  for (const [strategy, score] of sortedStrategies) {
    const confidence = score >= 50 ? 'high' : score >= 30 ? 'medium' : 'low'
    const reason = generateRecommendationReason(strategy, conditions, trendAnalysis, score)

    recommendations.push({
      strategy,
      confidence,
      score,
      reason,
      priority: recommendations.length + 1,
      optimalConditions: getOptimalConditions(strategy)
    })
  }

  return recommendations
}

/**
 * Generate human-readable recommendation reason
 */
function generateRecommendationReason(strategy, conditions, trendAnalysis, score) {
  const { vix, trend, volatilityLevel } = conditions
  const reasons = []

  if (vix >= 20) {
    reasons.push(`High VIX (${vix.toFixed(1)}) provides excellent premium collection opportunity`)
  }
  if (vix < 15) {
    reasons.push(`Low VIX (${vix.toFixed(1)}) suggests potential breakout - good for buying strategies`)
  }
  if (trend === 'bullish') {
    reasons.push(`Strong bullish trend favors directional strategies`)
  }
  if (trend === 'sideways') {
    reasons.push(`Sideways market ideal for range-bound premium collection`)
  }
  if (volatilityLevel === 'high') {
    reasons.push(`High volatility environment maximizes premium income`)
  }

  return reasons.join('. ') || `Market conditions favor ${strategy} strategy`
}

/**
 * Get optimal conditions for each strategy
 */
function getOptimalConditions(strategy) {
  const conditions = {
    'Short Strangle': { vix: '>20', trend: 'sideways', volatility: 'high' },
    'Iron Condor': { vix: '>18', trend: 'sideways', volatility: 'medium-high' },
    'Short Straddle': { vix: '>22', trend: 'sideways', volatility: 'very_high' },
    'Long Straddle': { vix: '<15', trend: 'any', volatility: 'low-medium' },
    'Bull Call Spread': { vix: '<15', trend: 'bullish', volatility: 'low' },
    'Bull Put Spread': { vix: '>18', trend: 'bullish', volatility: 'high' },
    'Covered Call': { vix: 'any', trend: 'bullish', volatility: 'any' }
  }
  return conditions[strategy] || {}
}

/**
 * Clear market intelligence cache (useful for testing)
 */
function clearMarketIntelligenceCache() {
  marketIntelligenceCache = {
    data: null,
    timestamp: null,
    ttl: ASSESSMENT_INTERVAL_MINUTES * 60 * 1000
  }
}

/**
 * Get historical market data for pattern analysis
 * Stores market conditions in database for future ML training
 */
async function storeMarketConditions(conditions) {
  // This would store in Supabase for historical analysis
  // Implementation depends on database schema
  // For now, just log
  console.log('[MarketIntel] Market conditions logged for historical analysis:', {
    vix: conditions.vix,
    trend: conditions.trend,
    timestamp: conditions.timestamp
  })
}

module.exports = {
  analyzeMarketIntelligence,
  clearMarketIntelligenceCache,
  storeMarketConditions,
  ASSESSMENT_INTERVAL_MINUTES
}

