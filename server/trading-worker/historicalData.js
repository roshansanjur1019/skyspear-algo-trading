// Historical Market Data Analysis Module
// Stores and analyzes 1 year of market data for pattern recognition

const { getMarketData, createAuthenticatedClient } = require('./angelOneSDK')

// Historical data cache (in-memory, should be moved to database for production)
let historicalDataCache = {
  dailyData: [], // Array of daily market snapshots
  maxDays: 365, // 1 year of data
  lastUpdate: null
}

/**
 * Store daily market snapshot
 */
function storeDailySnapshot(conditions, recommendations, outcome = null) {
  const snapshot = {
    date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    timestamp: new Date().toISOString(),
    vix: conditions.vix,
    niftySpot: conditions.niftySpot,
    niftyChangePercent: conditions.niftyChangePercent,
    trend: conditions.trend,
    trendStrength: conditions.trendStrength,
    volatilityLevel: conditions.volatilityLevel,
    technicalIndicators: conditions.technicalIndicators,
    topRecommendation: recommendations[0]?.strategy || null,
    recommendationScore: recommendations[0]?.score || 0,
    events: conditions.events || [],
    outcome: outcome // Will be filled later with actual P&L
  }

  // Add to cache
  historicalDataCache.dailyData.push(snapshot)

  // Keep only last 365 days
  if (historicalDataCache.dailyData.length > historicalDataCache.maxDays) {
    historicalDataCache.dailyData.shift()
  }

  historicalDataCache.lastUpdate = new Date().toISOString()

  return snapshot
}

/**
 * Get historical patterns matching current conditions
 */
function findSimilarHistoricalPatterns(currentConditions, days = 30) {
  const recentData = historicalDataCache.dailyData.slice(-days)
  const similarPatterns = []

  for (const historical of recentData) {
    let similarityScore = 0
    const matches = []

    // VIX similarity (±2 points)
    if (Math.abs(historical.vix - currentConditions.vix) <= 2) {
      similarityScore += 20
      matches.push('vix')
    }

    // Trend similarity
    if (historical.trend === currentConditions.trend) {
      similarityScore += 15
      matches.push('trend')
    }

    // Volatility level similarity
    if (historical.volatilityLevel === currentConditions.volatilityLevel) {
      similarityScore += 10
      matches.push('volatility')
    }

    // Similar change percentage (±0.3%)
    if (Math.abs(historical.niftyChangePercent - currentConditions.niftyChangePercent) <= 0.3) {
      similarityScore += 15
      matches.push('change')
    }

    // Similar technical indicators
    if (historical.technicalIndicators) {
      const pricePosDiff = Math.abs(
        historical.technicalIndicators.pricePosition - 
        currentConditions.technicalIndicators.pricePosition
      )
      if (pricePosDiff <= 10) {
        similarityScore += 10
        matches.push('pricePosition')
      }
    }

    if (similarityScore >= 30) {
      similarPatterns.push({
        date: historical.date,
        similarityScore,
        matches,
        historical,
        outcome: historical.outcome
      })
    }
  }

  // Sort by similarity score
  return similarPatterns.sort((a, b) => b.similarityScore - a.similarityScore).slice(0, 10)
}

/**
 * Analyze historical momentum
 */
function analyzeHistoricalMomentum(days = 30) {
  const recentData = historicalDataCache.dailyData.slice(-days)
  if (recentData.length < 5) return null

  const changes = recentData.map(d => d.niftyChangePercent)
  const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length
  const volatility = Math.sqrt(
    changes.reduce((sum, change) => sum + Math.pow(change - avgChange, 2), 0) / changes.length
  )

  // Count trends
  const bullishDays = recentData.filter(d => d.trend === 'bullish').length
  const bearishDays = recentData.filter(d => d.trend === 'bearish').length
  const sidewaysDays = recentData.filter(d => d.trend === 'sideways').length

  // VIX trend
  const vixValues = recentData.map(d => d.vix)
  const vixTrend = vixValues[vixValues.length - 1] > vixValues[0] ? 'rising' : 'falling'

  return {
    period: days,
    avgDailyChange: parseFloat(avgChange.toFixed(2)),
    volatility: parseFloat(volatility.toFixed(2)),
    trendDistribution: {
      bullish: bullishDays,
      bearish: bearishDays,
      sideways: sidewaysDays,
      dominant: bullishDays > bearishDays ? 'bullish' : bearishDays > bullishDays ? 'bearish' : 'sideways'
    },
    vixTrend,
    vixRange: {
      min: Math.min(...vixValues),
      max: Math.max(...vixValues),
      current: vixValues[vixValues.length - 1]
    },
    successRate: calculateHistoricalSuccessRate(recentData)
  }
}

/**
 * Calculate historical success rate of recommendations
 */
function calculateHistoricalSuccessRate(data) {
  const withOutcomes = data.filter(d => d.outcome !== null)
  if (withOutcomes.length === 0) return null

  const successful = withOutcomes.filter(d => d.outcome > 0).length
  return {
    total: withOutcomes.length,
    successful,
    successRate: parseFloat(((successful / withOutcomes.length) * 100).toFixed(2)),
    avgOutcome: parseFloat((
      withOutcomes.reduce((sum, d) => sum + (d.outcome || 0), 0) / withOutcomes.length
    ).toFixed(2))
  }
}

/**
 * Get historical data summary for AI analysis
 */
function getHistoricalSummaryForAI(days = 365) {
  const data = historicalDataCache.dailyData.slice(-days)
  
  if (data.length === 0) {
    return {
      available: false,
      message: 'No historical data available yet'
    }
  }

  const momentum = analyzeHistoricalMomentum(30)
  const similarPatterns = data.length > 0 ? findSimilarHistoricalPatterns(
    data[data.length - 1], 
    30
  ) : []

  return {
    available: true,
    totalDays: data.length,
    period: `${data[0]?.date} to ${data[data.length - 1]?.date}`,
    momentum: momentum,
    similarPatterns: similarPatterns.slice(0, 5), // Top 5 similar patterns
    successRate: calculateHistoricalSuccessRate(data),
    vixHistory: {
      avg: parseFloat((data.reduce((sum, d) => sum + d.vix, 0) / data.length).toFixed(2)),
      min: Math.min(...data.map(d => d.vix)),
      max: Math.max(...data.map(d => d.vix)),
      current: data[data.length - 1]?.vix
    },
    trendHistory: {
      bullish: data.filter(d => d.trend === 'bullish').length,
      bearish: data.filter(d => d.trend === 'bearish').length,
      sideways: data.filter(d => d.trend === 'sideways').length
    }
  }
}

module.exports = {
  storeDailySnapshot,
  findSimilarHistoricalPatterns,
  analyzeHistoricalMomentum,
  getHistoricalSummaryForAI,
  calculateHistoricalSuccessRate,
  historicalDataCache
}

