// Adaptive Market Intelligence Scheduler
// Dynamically adjusts assessment intervals based on market conditions
// Base: 15 min | Active positions: 10 min | High volatility: 5 min

const cron = require('node-cron')
const { isMarketOpen, shouldSkipAssessment } = require('./marketContext')

// Assessment interval states
const INTERVALS = {
  NORMAL: 15,      // Normal market conditions
  ACTIVE: 10,      // Active positions, market opening/closing
  VOLATILE: 5      // High volatility events (VIX spike, etc.)
}

// Market hours (IST)
const MARKET_OPEN = 9
const MARKET_CLOSE = 15
const MARKET_OPENING_WINDOW = { start: 9, end: 10 } // 9:15 AM - 10:00 AM
const MARKET_CLOSING_WINDOW = { start: 14, end: 15 } // 2:30 PM - 3:30 PM

// Current assessment state
let currentInterval = INTERVALS.NORMAL
let lastAssessment = null
let lastMarketConditions = null
let activePositionsCount = 0
let nextScheduledTime = null

/**
 * Determine optimal assessment interval based on market conditions
 */
function determineOptimalInterval(marketConditions, hasActivePositions) {
  const now = new Date()
  const hour = now.getHours()
  const minute = now.getMinutes()
  const currentTime = hour * 60 + minute

  // Market opening window (9:15 AM - 10:00 AM) → 10 min
  const openingStart = MARKET_OPENING_WINDOW.start * 60 + 15 // 9:15 AM
  const openingEnd = MARKET_OPENING_WINDOW.end * 60 // 10:00 AM
  if (currentTime >= openingStart && currentTime <= openingEnd) {
    return {
      interval: INTERVALS.ACTIVE,
      reason: 'Market opening window - increased monitoring'
    }
  }

  // Market closing window (2:30 PM - 3:30 PM) → 10 min
  const closingStart = MARKET_CLOSING_WINDOW.start * 60 + 30 // 2:30 PM
  const closingEnd = MARKET_CLOSING_WINDOW.end * 60 + 30 // 3:30 PM
  if (currentTime >= closingStart && currentTime <= closingEnd) {
    return {
      interval: INTERVALS.ACTIVE,
      reason: 'Market closing window - prepare for exit'
    }
  }

  // Active positions → 10 min
  if (hasActivePositions) {
    return {
      interval: INTERVALS.ACTIVE,
      reason: 'Active positions - closer monitoring'
    }
  }

  // High volatility (VIX spike or rapid change) → 5 min
  if (marketConditions) {
    const vix = marketConditions.vix || 15
    const vixChange = marketConditions.vixChange || 0
    
    // VIX above 20 or rapid spike (>2 points in last assessment)
    if (vix >= 20 || Math.abs(vixChange) > 2) {
      return {
        interval: INTERVALS.VOLATILE,
        reason: `High volatility detected (VIX: ${vix.toFixed(1)}, change: ${vixChange > 0 ? '+' : ''}${vixChange.toFixed(1)})`
      }
    }

    // Strong trend with momentum → 10 min
    if (marketConditions.trendStrength === 'strong' && 
        Math.abs(marketConditions.technicalIndicators?.momentum || 0) > 1.0) {
      return {
        interval: INTERVALS.ACTIVE,
        reason: 'Strong trend with momentum - increased monitoring'
      }
    }
  }

  // Default: Normal conditions → 15 min
  return {
    interval: INTERVALS.NORMAL,
    reason: 'Normal market conditions'
  }
}

/**
 * Schedule next assessment based on adaptive interval
 */
function scheduleNextAssessment(assessmentCallback, marketConditions, hasActivePositions) {
  // Determine optimal interval
  const { interval, reason } = determineOptimalInterval(marketConditions, hasActivePositions)
  
  // If interval changed, log it
  if (interval !== currentInterval) {
    console.log(`[AdaptiveScheduler] Interval changed: ${currentInterval}min → ${interval}min (${reason})`)
    currentInterval = interval
  }

  // Calculate next assessment time
  const now = new Date()
  const nextTime = new Date(now.getTime() + (interval * 60 * 1000))
  nextScheduledTime = nextTime

  // Schedule assessment
  const timeout = setTimeout(async () => {
    try {
      // Update last assessment time
      lastAssessment = new Date()
      lastMarketConditions = marketConditions

      // Run assessment
      await assessmentCallback()

      // Schedule next assessment
      scheduleNextAssessment(assessmentCallback, marketConditions, hasActivePositions)
    } catch (error) {
      console.error('[AdaptiveScheduler] Assessment error:', error)
      // Retry with normal interval on error
      scheduleNextAssessment(assessmentCallback, null, false)
    }
  }, interval * 60 * 1000)

  return timeout
}

/**
 * Start adaptive scheduler
 * Replaces fixed-interval cron jobs with dynamic scheduling
 */
function startAdaptiveScheduler(assessmentCallback, getMarketConditions, getActivePositions) {
  console.log('[AdaptiveScheduler] Starting adaptive market intelligence scheduler')
  console.log('[AdaptiveScheduler] Initial interval: 15 minutes (normal conditions)')

  // Initial assessment
  const runAssessment = async () => {
    try {
      // Check if market is open - skip if closed
      const skipCheck = shouldSkipAssessment()
      if (skipCheck.skip) {
        console.log(`[AdaptiveScheduler] Market closed - ${skipCheck.reason}`)
        if (skipCheck.nextOpenTime) {
          const msUntilOpen = skipCheck.nextOpenTime.getTime() - Date.now()
          console.log(`[AdaptiveScheduler] Next assessment at market open: ${skipCheck.nextOpenTime.toISOString()}`)
          // Schedule next assessment at market open
          setTimeout(runAssessment, msUntilOpen)
        } else {
          // Schedule check for next day
          setTimeout(runAssessment, 60 * 60 * 1000) // Check every hour
        }
        return
      }

      // Get current market conditions
      const conditions = await getMarketConditions()
      const hasActivePositions = await getActivePositions()

      // Run assessment
      await assessmentCallback()

      // Schedule next assessment with updated conditions
      scheduleNextAssessment(runAssessment, conditions, hasActivePositions)
    } catch (error) {
      console.error('[AdaptiveScheduler] Error in assessment cycle:', error)
      // Retry with normal interval
      setTimeout(runAssessment, INTERVALS.NORMAL * 60 * 1000)
    }
  }

  // Start first assessment
  runAssessment()

  // Return cleanup function
  return () => {
    console.log('[AdaptiveScheduler] Stopping adaptive scheduler')
  }
}

/**
 * Get current scheduler status
 */
function getSchedulerStatus() {
  return {
    currentInterval,
    lastAssessment: lastAssessment ? lastAssessment.toISOString() : null,
    nextScheduledTime: nextScheduledTime ? nextScheduledTime.toISOString() : null,
    activePositionsCount,
    intervals: INTERVALS
  }
}

/**
 * Update active positions count (called from main scheduler)
 */
function updateActivePositions(count) {
  activePositionsCount = count
}

module.exports = {
  startAdaptiveScheduler,
  determineOptimalInterval,
  getSchedulerStatus,
  updateActivePositions,
  INTERVALS
}

