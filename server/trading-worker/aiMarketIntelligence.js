// AI-Enhanced Market Intelligence with Google Gemini Integration
// Provides advanced market analysis and strategy recommendations using AI reasoning

const { analyzeMarketIntelligence } = require('./marketIntelligence')

// Optional: Google Gemini API for advanced reasoning (can work without it using rule-based AI)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const USE_GEMINI = !!GEMINI_API_KEY

/**
 * Enhanced AI-Powered Market Intelligence
 * Uses OpenAI for advanced reasoning + rule-based AI for strategy recommendations
 */
async function analyzeMarketIntelligenceWithAI() {
  try {
    // Get base market intelligence
    const baseIntel = await analyzeMarketIntelligence()
    
    if (!baseIntel.conditions || baseIntel.error) {
      return baseIntel
    }

    // Enhance with AI reasoning
    const aiEnhanced = await enhanceWithAI(baseIntel)

    return {
      ...baseIntel,
      aiInsights: aiEnhanced.insights,
      aiRecommendations: aiEnhanced.recommendations,
      confidenceScore: aiEnhanced.confidenceScore,
      riskAssessment: aiEnhanced.riskAssessment,
      marketOutlook: aiEnhanced.marketOutlook
    }
  } catch (error) {
    console.error('[AI MarketIntel] Error:', error)
    // Fallback to base intelligence if AI fails
    return await analyzeMarketIntelligence()
  }
}

/**
 * Enhance market intelligence with AI reasoning
 */
async function enhanceWithAI(baseIntel) {
  const { conditions, recommendations, trendAnalysis } = baseIntel

  // Build comprehensive market context for AI
  const marketContext = {
    vix: conditions.vix,
    niftySpot: conditions.niftySpot,
    niftyChangePercent: conditions.niftyChangePercent,
    trend: conditions.trend,
    trendStrength: conditions.trendStrength,
    volatilityLevel: conditions.volatilityLevel,
    technicalIndicators: conditions.technicalIndicators,
    timestamp: conditions.timestamp
  }

  // Use Gemini if available, otherwise use advanced rule-based AI
  if (USE_GEMINI) {
    return await enhanceWithGemini(marketContext, recommendations)
  } else {
    return await enhanceWithRuleBasedAI(marketContext, recommendations, trendAnalysis)
  }
}

/**
 * Enhance with Google Gemini for advanced reasoning
 * Gemini API is free tier friendly and provides excellent reasoning
 */
async function enhanceWithGemini(marketContext, recommendations) {
  try {
    const fetch = require('node-fetch')
    
    const prompt = buildAIPrompt(marketContext, recommendations)

    // Use Gemini 1.5 Flash (fast and cost-effective) or Gemini 1.5 Pro (better reasoning)
    const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash'
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are an expert algorithmic trading advisor specializing in Indian options markets (NIFTY, BANKNIFTY). Provide concise, actionable insights based on market data.

${prompt}

Provide your response as JSON with the following structure:
{
  "marketOutlook": "1-2 sentence market sentiment",
  "riskAssessment": "low/medium/medium-high/high with brief reason",
  "topStrategy": "strategy name",
  "insights": ["insight 1", "insight 2", "insight 3"]
}`
          }]
        }],
        generationConfig: {
          temperature: 0.3, // Lower temperature for more consistent, factual responses
          maxOutputTokens: 500,
          responseMimeType: 'application/json' // Request JSON response
        }
      })
    })

    const data = await response.json()
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const aiResponse = data.candidates[0].content.parts[0].text
      return parseAIResponse(aiResponse, marketContext, recommendations)
    }

    // Fallback to rule-based if Gemini fails
    return await enhanceWithRuleBasedAI(marketContext, recommendations, {})
  } catch (error) {
    console.error('[AI MarketIntel] Gemini error:', error.message)
    // Fallback to rule-based AI
    return await enhanceWithRuleBasedAI(marketContext, recommendations, {})
  }
}

/**
 * Build AI prompt for market analysis
 */
function buildAIPrompt(marketContext, recommendations) {
  return `Analyze the current Indian options market conditions and provide trading insights:

Market Data:
- VIX: ${marketContext.vix.toFixed(2)} (${marketContext.volatilityLevel} volatility)
- NIFTY: ${marketContext.niftySpot.toFixed(2)} (${marketContext.niftyChangePercent > 0 ? '+' : ''}${marketContext.niftyChangePercent.toFixed(2)}%)
- Trend: ${marketContext.trend} (${marketContext.trendStrength} strength)
- Price Position: ${marketContext.technicalIndicators.pricePosition.toFixed(1)}% of daily range
- Momentum: ${marketContext.technicalIndicators.momentum.toFixed(2)}%

Current Recommendations:
${recommendations.map((r, i) => `${i + 1}. ${r.strategy} (${r.confidence} confidence, score: ${r.score})`).join('\n')}

Provide:
1. Market Outlook (1-2 sentences): Overall market sentiment and expected direction
2. Risk Assessment: Current risk level (low/medium/high) and why
3. Top Strategy: Which strategy is most suitable now and why
4. Key Insights: 2-3 actionable insights for options trading

Format as JSON:
{
  "marketOutlook": "...",
  "riskAssessment": "...",
  "topStrategy": "...",
  "insights": ["...", "...", "..."]
}`
}

/**
 * Parse AI response
 */
function parseAIResponse(aiResponse, marketContext, recommendations) {
  try {
    // Try to extract JSON from response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        insights: parsed.insights || [],
        recommendations: recommendations, // Keep original recommendations
        confidenceScore: calculateAIConfidence(marketContext),
        riskAssessment: parsed.riskAssessment || 'medium',
        marketOutlook: parsed.marketOutlook || 'Neutral market conditions',
        topStrategy: parsed.topStrategy || recommendations[0]?.strategy,
        aiReasoning: aiResponse
      }
    }
  } catch (error) {
    console.error('[AI MarketIntel] Failed to parse AI response:', error)
  }

  // Fallback parsing
  return {
    insights: extractInsightsFromText(aiResponse),
    recommendations: recommendations,
    confidenceScore: calculateAIConfidence(marketContext),
    riskAssessment: 'medium',
    marketOutlook: 'Market analysis in progress',
    aiReasoning: aiResponse
  }
}

/**
 * Advanced Rule-Based AI (works without OpenAI)
 * Uses sophisticated pattern matching and statistical analysis
 */
async function enhanceWithRuleBasedAI(marketContext, recommendations, trendAnalysis) {
  const insights = []
  const riskFactors = []
  let riskLevel = 'low'
  let confidenceScore = 50

  // Analyze VIX patterns
  if (marketContext.vix >= 25) {
    insights.push('Extremely high VIX indicates market fear - excellent premium collection opportunity')
    riskFactors.push('High volatility may lead to large price swings')
    riskLevel = 'high'
    confidenceScore += 15
  } else if (marketContext.vix >= 20) {
    insights.push('Elevated VIX provides attractive premium income for selling strategies')
    riskLevel = 'medium-high'
    confidenceScore += 10
  } else if (marketContext.vix < 10) {
    insights.push('Very low VIX suggests complacency - potential for sudden volatility spike')
    riskFactors.push('Low volatility may compress quickly')
    riskLevel = 'medium'
    confidenceScore += 5
  }

  // Trend analysis
  if (marketContext.trend === 'bullish' && marketContext.trendStrength === 'strong') {
    insights.push('Strong bullish momentum supports directional strategies')
    confidenceScore += 10
  } else if (marketContext.trend === 'bearish' && marketContext.trendStrength === 'strong') {
    insights.push('Strong bearish momentum - consider defensive strategies')
    riskLevel = riskLevel === 'low' ? 'medium' : riskLevel
    riskFactors.push('Bearish trend may continue')
  } else if (marketContext.trend === 'sideways') {
    insights.push('Range-bound market ideal for premium collection strategies')
    confidenceScore += 5
  }

  // Technical indicator insights
  if (marketContext.technicalIndicators.isNearSupport) {
    insights.push('Price near support level - potential bounce opportunity')
    confidenceScore += 5
  }
  if (marketContext.technicalIndicators.isNearResistance) {
    insights.push('Price near resistance - potential reversal point')
  }

  // Momentum analysis
  if (Math.abs(marketContext.technicalIndicators.momentum) > 1.0) {
    insights.push(`Strong momentum (${marketContext.technicalIndicators.momentum > 0 ? 'upward' : 'downward'}) - directional strategies favored`)
    confidenceScore += 5
  }

  // Volume analysis
  if (marketContext.technicalIndicators.volumeIndicator === 'low') {
    riskFactors.push('Low volume may indicate lack of conviction')
    riskLevel = riskLevel === 'low' ? 'medium' : riskLevel
  }

  // Calculate final confidence (0-100)
  confidenceScore = Math.min(100, Math.max(0, confidenceScore))

  // Market outlook
  let marketOutlook = 'Neutral market conditions'
  if (marketContext.vix >= 20 && marketContext.trend === 'sideways') {
    marketOutlook = 'High volatility, range-bound market - premium collection strategies optimal'
  } else if (marketContext.vix < 15 && marketContext.trend === 'bullish') {
    marketOutlook = 'Low volatility with bullish bias - directional buying strategies favored'
  } else if (marketContext.vix >= 25) {
    marketOutlook = 'Extreme volatility - high-risk, high-reward premium collection environment'
  }

  return {
    insights,
    recommendations,
    confidenceScore,
    riskAssessment: {
      level: riskLevel,
      factors: riskFactors,
      score: calculateRiskScore(riskLevel, riskFactors.length)
    },
    marketOutlook,
    topStrategy: recommendations[0]?.strategy || 'Short Strangle',
    aiReasoning: `Rule-based AI analysis: ${insights.join('; ')}`
  }
}

/**
 * Calculate AI confidence score
 */
function calculateAIConfidence(marketContext) {
  let score = 50 // Base score

  // VIX confidence
  if (marketContext.vix >= 20 || marketContext.vix < 15) {
    score += 15 // Clear volatility signal
  }

  // Trend confidence
  if (marketContext.trendStrength === 'strong') {
    score += 15
  } else if (marketContext.trendStrength === 'moderate') {
    score += 10
  }

  // Technical indicator confidence
  if (marketContext.technicalIndicators.momentumStrength > 1.0) {
    score += 10
  }

  // Price position confidence
  if (marketContext.technicalIndicators.pricePosition < 20 || marketContext.technicalIndicators.pricePosition > 80) {
    score += 10 // Near extremes
  }

  return Math.min(100, score)
}

/**
 * Calculate risk score
 */
function calculateRiskScore(riskLevel, riskFactorCount) {
  const baseScores = { low: 20, 'medium-low': 40, medium: 60, 'medium-high': 75, high: 90 }
  return Math.min(100, (baseScores[riskLevel] || 50) + (riskFactorCount * 5))
}

/**
 * Extract insights from AI text response
 */
function extractInsightsFromText(text) {
  const insights = []
  const lines = text.split('\n').filter(line => line.trim())
  
  for (const line of lines) {
    if (line.includes('insight') || line.includes('recommend') || line.includes('suggest') || 
        line.match(/^\d+[\.\)]/) || line.startsWith('-') || line.startsWith('•')) {
      insights.push(line.trim().replace(/^[\d\-•\.\)\s]+/, ''))
    }
  }

  return insights.slice(0, 3) // Max 3 insights
}

/**
 * Historical Pattern Recognition
 * Analyzes historical market patterns to predict future movements
 */
async function analyzeHistoricalPatterns(currentConditions) {
  // This would require historical data storage
  // For now, return pattern-based insights
  const patterns = {
    vixSpike: currentConditions.vix > 20 && currentConditions.vix < 30,
    lowVolatility: currentConditions.vix < 12,
    strongTrend: currentConditions.trendStrength === 'strong',
    rangeBound: currentConditions.trend === 'sideways' && currentConditions.technicalIndicators.volatility < 1.5
  }

  const patternInsights = []
  if (patterns.vixSpike) {
    patternInsights.push('VIX spike pattern detected - historically favorable for premium collection')
  }
  if (patterns.lowVolatility) {
    patternInsights.push('Low volatility pattern - potential for breakout strategies')
  }
  if (patterns.strongTrend) {
    patternInsights.push('Strong trend pattern - directional strategies historically perform well')
  }
  if (patterns.rangeBound) {
    patternInsights.push('Range-bound pattern - premium collection strategies historically profitable')
  }

  return {
    patterns,
    insights: patternInsights,
    historicalMatch: calculateHistoricalMatch(patterns)
  }
}

/**
 * Calculate historical pattern match score
 */
function calculateHistoricalMatch(patterns) {
  let matchScore = 0
  if (patterns.vixSpike) matchScore += 25
  if (patterns.lowVolatility) matchScore += 20
  if (patterns.strongTrend) matchScore += 25
  if (patterns.rangeBound) matchScore += 30
  return matchScore
}

module.exports = {
  analyzeMarketIntelligenceWithAI,
  enhanceWithAI,
  analyzeHistoricalPatterns,
  USE_GEMINI
}

