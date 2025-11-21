// Market Context and Event Detection Module
// Detects market hours, events (budget, expiry), and provides context for VIX interpretation

/**
 * Check if market is currently open (IST)
 * Market hours: 9:15 AM - 3:30 PM IST (Monday to Friday)
 */
function isMarketOpen() {
  const now = new Date()
  const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  const day = istTime.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const hour = istTime.getHours()
  const minute = istTime.getMinutes()
  const timeInMinutes = hour * 60 + minute

  // Market is closed on weekends
  if (day === 0 || day === 6) {
    return { isOpen: false, reason: 'Weekend' }
  }

  // Market hours: 9:15 AM (555 minutes) to 3:30 PM (930 minutes)
  const marketOpen = 9 * 60 + 15 // 9:15 AM
  const marketClose = 15 * 60 + 30 // 3:30 PM

  if (timeInMinutes >= marketOpen && timeInMinutes <= marketClose) {
    return { isOpen: true, reason: 'Market hours' }
  }

  // Before market opens
  if (timeInMinutes < marketOpen) {
    const hoursUntilOpen = Math.floor((marketOpen - timeInMinutes) / 60)
    const minutesUntilOpen = (marketOpen - timeInMinutes) % 60
    return { 
      isOpen: false, 
      reason: `Market opens in ${hoursUntilOpen}h ${minutesUntilOpen}m`,
      nextOpenTime: new Date(istTime.setHours(9, 15, 0, 0))
    }
  }

  // After market closes
  if (timeInMinutes > marketClose) {
    return { 
      isOpen: false, 
      reason: 'Market closed for today',
      nextOpenTime: getNextMarketOpen(istTime)
    }
  }

  return { isOpen: false, reason: 'Unknown' }
}

/**
 * Get next market open time
 */
function getNextMarketOpen(currentDate) {
  const next = new Date(currentDate)
  next.setDate(next.getDate() + 1)
  next.setHours(9, 15, 0, 0)
  
  // Skip weekends
  while (next.getDay() === 0 || next.getDay() === 6) {
    next.setDate(next.getDate() + 1)
  }
  
  return next
}

/**
 * Detect upcoming market events
 */
function detectMarketEvents(currentDate = new Date()) {
  const istTime = new Date(currentDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  const events = []

  // Budget day (typically late January/early February)
  const budgetMonth = 1 // February (0-indexed, so 1 = February)
  const budgetDay = 1 // Usually 1st of February
  const budgetDate = new Date(istTime.getFullYear(), budgetMonth, budgetDay)
  const daysUntilBudget = Math.ceil((budgetDate - istTime) / (1000 * 60 * 60 * 24))
  
  if (daysUntilBudget >= 0 && daysUntilBudget <= 30) {
    events.push({
      type: 'budget',
      name: 'Union Budget',
      date: budgetDate,
      daysUntil: daysUntilBudget,
      impact: daysUntilBudget <= 7 ? 'high' : daysUntilBudget <= 14 ? 'medium' : 'low',
      description: 'Union Budget announcement - expect high volatility'
    })
  }

  // Monthly expiry (last Thursday of month)
  const expiryDate = getMonthlyExpiry(istTime)
  const daysUntilExpiry = Math.ceil((expiryDate - istTime) / (1000 * 60 * 60 * 24))
  
  if (daysUntilExpiry >= 0 && daysUntilExpiry <= 7) {
    events.push({
      type: 'expiry',
      name: 'Monthly Expiry',
      date: expiryDate,
      daysUntil: daysUntilExpiry,
      impact: daysUntilExpiry <= 2 ? 'high' : 'medium',
      description: 'Monthly options expiry - increased volatility expected'
    })
  }

  // Weekly expiry (every Thursday)
  const weeklyExpiry = getWeeklyExpiry(istTime)
  const daysUntilWeeklyExpiry = Math.ceil((weeklyExpiry - istTime) / (1000 * 60 * 60 * 24))
  
  if (daysUntilWeeklyExpiry >= 0 && daysUntilWeeklyExpiry <= 2) {
    events.push({
      type: 'weekly_expiry',
      name: 'Weekly Expiry',
      date: weeklyExpiry,
      daysUntil: daysUntilWeeklyExpiry,
      impact: daysUntilWeeklyExpiry === 0 ? 'high' : 'medium',
      description: 'Weekly options expiry - intraday volatility'
    })
  }

  // RBI Policy (typically 6 times a year - approximate)
  const rbiPolicyMonths = [2, 4, 6, 8, 10, 12] // Approximate
  const currentMonth = istTime.getMonth()
  if (rbiPolicyMonths.includes(currentMonth)) {
    events.push({
      type: 'rbi_policy',
      name: 'RBI Policy Meeting',
      date: new Date(istTime.getFullYear(), currentMonth, 7), // Approximate
      daysUntil: 7,
      impact: 'high',
      description: 'RBI Monetary Policy Committee meeting - expect rate decisions'
    })
  }

  return events
}

/**
 * Get monthly expiry (last Thursday of month)
 */
function getMonthlyExpiry(date) {
  const year = date.getFullYear()
  const month = date.getMonth()
  const lastDay = new Date(year, month + 1, 0) // Last day of month
  let thursday = new Date(lastDay)
  
  // Find last Thursday
  while (thursday.getDay() !== 4) { // 4 = Thursday
    thursday.setDate(thursday.getDate() - 1)
  }
  
  thursday.setHours(15, 30, 0, 0) // Market close time
  return thursday
}

/**
 * Get weekly expiry (next Thursday)
 */
function getWeeklyExpiry(date) {
  const thursday = new Date(date)
  const day = thursday.getDay()
  const diff = (4 - day + 7) % 7 // Days until next Thursday
  thursday.setDate(thursday.getDate() + (diff === 0 ? 7 : diff))
  thursday.setHours(15, 30, 0, 0)
  return thursday
}

/**
 * Interpret VIX with context
 */
function interpretVIX(vix, vixChange, marketConditions, events) {
  const interpretation = {
    level: getVIXLevel(vix),
    trend: vixChange > 0.5 ? 'rising' : vixChange < -0.5 ? 'falling' : 'stable',
    change: vixChange,
    meaning: '',
    context: '',
    caution: false,
    recommendation: ''
  }

  // High VIX interpretation
  if (vix >= 20) {
    interpretation.meaning = 'High volatility - market fear/uncertainty'
    interpretation.caution = true
    
    if (vixChange > 1) {
      interpretation.context = 'VIX rising rapidly - indicates increasing fear'
      interpretation.recommendation = 'Wait for stabilization or use defensive strategies'
    } else if (marketConditions?.trend === 'bearish') {
      interpretation.context = 'High VIX with declining market - fear-driven selloff'
      interpretation.recommendation = 'Premium collection attractive but risky - use wider strikes'
    } else {
      interpretation.context = 'High VIX without major decline - potential volatility spike ahead'
      interpretation.recommendation = 'Monitor for event risk or news'
    }
  }
  // Low VIX interpretation
  else if (vix < 15) {
    interpretation.meaning = 'Low volatility - market complacency or stability'
    interpretation.caution = false
    
    if (marketConditions?.trend === 'bullish') {
      interpretation.context = 'Low VIX with bullish momentum - stable uptrend'
      interpretation.recommendation = 'Good for directional buying strategies'
    } else if (vixChange > 0.5) {
      interpretation.context = 'VIX rising from low levels - potential volatility expansion'
      interpretation.recommendation = 'Monitor for breakout or event'
    } else {
      interpretation.context = 'Low VIX - market stable, premium collection less attractive'
      interpretation.recommendation = 'Consider buying strategies for breakout'
    }
  }
  // Medium VIX
  else {
    interpretation.meaning = 'Moderate volatility - normal market conditions'
    
    if (vixChange > 1) {
      interpretation.context = 'VIX rising - market entering caution mode'
      interpretation.caution = true
      interpretation.recommendation = 'Monitor for event risk or news'
    } else {
      interpretation.context = 'Stable VIX - normal market conditions'
      interpretation.recommendation = 'Standard strategy selection'
    }
  }

  // Event-based context
  const upcomingEvents = events.filter(e => e.daysUntil <= 7 && e.impact === 'high')
  if (upcomingEvents.length > 0) {
    const event = upcomingEvents[0]
    interpretation.context += ` | Upcoming: ${event.name} in ${event.daysUntil} days`
    interpretation.caution = true
    interpretation.recommendation = `Event risk ahead - reduce position size, use wider strikes`
  }

  return interpretation
}

/**
 * Get VIX level classification
 */
function getVIXLevel(vix) {
  if (vix >= 25) return 'very_high'
  if (vix >= 20) return 'high'
  if (vix >= 15) return 'medium'
  if (vix >= 10) return 'low'
  return 'very_low'
}

/**
 * Should skip market intelligence assessment?
 * Returns true if market is closed or it's outside assessment hours
 */
function shouldSkipAssessment() {
  const marketStatus = isMarketOpen()
  
  if (!marketStatus.isOpen) {
    return {
      skip: true,
      reason: marketStatus.reason,
      nextOpenTime: marketStatus.nextOpenTime
    }
  }

  return { skip: false }
}

module.exports = {
  isMarketOpen,
  detectMarketEvents,
  interpretVIX,
  shouldSkipAssessment,
  getNextMarketOpen
}

