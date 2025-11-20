// Enhanced Trading Worker with Auto-Execute, Scheduler, Market Intelligence, and Order Management
// This is a comprehensive implementation - will be merged into index.js after testing

const express = require('express')
const bodyParser = require('body-parser')
const crypto = require('crypto')
const fetch = require('node-fetch')
const cron = require('node-cron')
const { createClient } = require('@supabase/supabase-js')
const WebSocket = require('ws')

const app = express()
app.use(bodyParser.json())

// Supabase client initialization
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://blnphqmmsjlxlqnrmriw.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Lot sizes configuration
const LOT_SIZES = {
  NIFTY: 75,
  BANKNIFTY: 35,
  SENSEX: 20
}

// Strategy type classification
const STRATEGY_TYPES = {
  'Short Strangle': 'selling',
  'Iron Condor': 'selling',
  'Short Straddle': 'selling',
  'Covered Call': 'selling',
  'Bull Put Spread': 'selling',
  'Bull Call Spread': 'buying',
  'Long Straddle': 'buying'
}

// Basic CORS support
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.CORS_ALLOW_ORIGIN || '*')
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }
  next()
})

// Health check routes
app.get('/', (req, res) => {
  res.json({ ok: true, service: 'trading-worker', version: '2.0-enhanced' })
})

app.get('/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() })
})

// ===== ANGEL ONE INTEGRATION HELPERS =====
// (Keep existing functions - base32ToBytes, generateTOTP, authenticateAngelOne, fetchMarketData)
// These are already implemented in the current index.js

// ===== MARKET INTELLIGENCE MODULE =====
async function analyzeMarketIntelligence() {
  try {
    // Fetch current VIX, NIFTY spot, trend indicators
    const apiKey = process.env.ANGEL_ONE_API_KEY
    const clientId = process.env.ANGEL_ONE_CLIENT_ID
    const mpin = process.env.ANGEL_ONE_PASSWORD
    const totpSecret = process.env.ANGEL_ONE_TOTP_SECRET
    const publicIp = process.env.ANGEL_ONE_PUBLIC_IP || '127.0.0.1'
    const localIp = process.env.ANGEL_ONE_LOCAL_IP || '127.0.0.1'
    const macAddress = process.env.ANGEL_ONE_MAC_ADDRESS || 'fe:ed:fa:ce:be:ef'

    const auth = await authenticateAngelOne({
      apiKey, clientId, mpin, totpSecret, publicIp, localIp, macAddress
    })

    if (!auth.success) {
      throw new Error('Failed to authenticate for market intelligence')
    }

    // Fetch VIX and NIFTY data
    const marketData = await fetchMarketData({
      token: auth.token,
      apiKey, clientId, publicIp, localIp, macAddress,
      mode: 'LTP',
      exchangeTokens: {
        NSE: ['99926000', '99926017'] // NIFTY and VIX
      }
    })

    const vix = marketData?.data?.fetched?.find(d => d.symbolToken === '99926017')?.ltp || 15
    const niftySpot = marketData?.data?.fetched?.find(d => d.symbolToken === '99926000')?.ltp || 24750

    // Analyze market conditions
    const conditions = {
      vix,
      niftySpot,
      trend: vix > 20 ? 'volatile' : vix < 15 ? 'stable' : 'normal',
      volatilityLevel: vix > 20 ? 'high' : vix < 15 ? 'low' : 'medium'
    }

    // Suggest strategies based on market intelligence
    const recommendations = []
    
    if (vix > 20) {
      // High volatility - suggest selling strategies
      recommendations.push({ strategy: 'Iron Condor', confidence: 'high', reason: 'High VIX favors premium collection' })
      recommendations.push({ strategy: 'Short Strangle', confidence: 'high', reason: 'High volatility premium' })
    } else if (vix < 15) {
      // Low volatility - suggest buying strategies for breakout
      recommendations.push({ strategy: 'Long Straddle', confidence: 'medium', reason: 'Low VIX, potential breakout' })
      recommendations.push({ strategy: 'Bull Call Spread', confidence: 'medium', reason: 'Low volatility, bullish bias' })
    } else {
      // Normal volatility - balanced approach
      recommendations.push({ strategy: 'Short Strangle', confidence: 'medium', reason: 'Normal volatility, range-bound' })
      recommendations.push({ strategy: 'Iron Condor', confidence: 'medium', reason: 'Stable premium collection' })
    }

    return { conditions, recommendations }
  } catch (error) {
    console.error('Market intelligence analysis error:', error)
    return { conditions: null, recommendations: [], error: error.message }
  }
}

// ===== PRE-CHECK ENHANCEMENT =====
app.post('/precheck', async (req, res) => {
  try {
    const { userId, strategy = 'Short Strangle', capital } = req.body || {}

    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId required' })
    }

    // Fetch broker account and available funds
    const { data: brokerAccount } = await supabase
      .from('broker_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .eq('broker_type', 'angel_one')
      .single()

    if (!brokerAccount) {
      return res.json({
        success: false,
        eligible: false,
        reason: 'No active Angel One broker account found'
      })
    }

    // Get market intelligence
    const marketIntel = await analyzeMarketIntelligence()
    const vix = marketIntel.conditions?.vix || 15

    // Calculate required capital
    const lotSize = LOT_SIZES.NIFTY // For Short Strangle
    const sellAllocPct = 0.5 // 50% allocation for selling strategies
    const totalCapital = typeof capital === 'number' ? capital : 500000
    const requiredCapitalPerLot = Math.round(totalCapital * sellAllocPct)

    // Adjust strike gap based on VIX
    const baseStrikeGap = 250
    const strikeGap = vix > 20 ? 400 : vix < 15 ? 200 : baseStrikeGap

    // TODO: Fetch actual available funds from Angel One API
    // For now, use a placeholder
    const availableFunds = totalCapital * 0.8 // Assume 80% available
    const eligible = availableFunds >= requiredCapitalPerLot

    res.json({
      success: true,
      strategy,
      vix,
      niftySpot: marketIntel.conditions?.niftySpot,
      totalCapital,
      availableFunds,
      requiredCapitalPerLot,
      strikeGap,
      eligible,
      reason: eligible ? undefined : 'Insufficient funds for 1 lot short strangle',
      marketConditions: marketIntel.conditions
    })
  } catch (error) {
    console.error('Pre-check error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// ===== SCHEDULER MODULE =====
// Entry scheduler for Skyspear Short Strangle (3:10 PM IST daily)
cron.schedule('10 15 * * *', async () => {
  console.log('[Scheduler] Entry time triggered for Short Strangle (3:10 PM IST)')
  // TODO: Implement entry execution
  // This will call executeShortStrangleEntry()
})

// Exit scheduler for Skyspear Short Strangle (3:00 PM IST next day)
cron.schedule('0 15 * * *', async () => {
  console.log('[Scheduler] Exit time triggered for Short Strangle (3:00 PM IST)')
  // TODO: Implement exit execution
  // This will call executeShortStrangleExit()
})

// Monitoring scheduler for other strategies (2:30 PM - 3:25 PM)
cron.schedule('30 14 * * *', async () => {
  console.log('[Scheduler] Monitoring window started (2:30 PM IST)')
  // Start monitoring for profit >= 0.5% exit
})

cron.schedule('15 15 * * *', async () => {
  console.log('[Scheduler] Late exit window started (3:15 PM IST)')
  // Start monitoring for breakeven/0.3% loss exit
})

cron.schedule('25 15 * * *', async () => {
  console.log('[Scheduler] Force exit time (3:25 PM IST)')
  // Force exit all open positions
})

// ===== ORDER PLACEMENT MODULE =====
async function placeOrder({ token, apiKey, clientId, publicIp, localIp, macAddress, orderParams }) {
  try {
    // Angel One order placement API
    const response = await fetch('https://apiconnect.angelbroking.com/rest/secure/angelbroking/order/v1/placeOrder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-UserType': 'USER',
        'X-SourceID': 'WEB',
        'X-ClientLocalIP': localIp,
        'X-ClientPublicIP': publicIp,
        'X-MACAddress': macAddress,
        'X-PrivateKey': apiKey,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: JSON.stringify(orderParams)
    })

    const data = await response.json()
    return { success: data?.status === true, data, orderId: data?.data?.orderid }
  } catch (error) {
    console.error('Order placement error:', error)
    return { success: false, error: error.message }
  }
}

// ===== TRAILING STOP LOSS MODULE =====
function calculateTrailingSL(currentProfit, trailSLSteps) {
  if (!trailSLSteps || !Array.isArray(trailSLSteps)) return null

  for (const step of trailSLSteps.sort((a, b) => b.profit_pct - a.profit_pct)) {
    if (currentProfit >= step.profit_pct) {
      return step.trail_to_pct
    }
  }
  return null
}

// ===== AVERAGING MODULE (for buying strategies) =====
async function checkAndAveragePosition({ tradeId, currentPrice, entryPrice, allocatedCapital, usedCapital }) {
  const downPercent = ((entryPrice - currentPrice) / entryPrice) * 100
  
  if (downPercent >= 10) {
    // Position is down 10% - trigger averaging
    const remainingCapital = allocatedCapital - usedCapital
    const firstEntryUsed = allocatedCapital * 0.4 // 40% used in first entry
    const averagingCapital = allocatedCapital * 0.6 // 60% reserved for averaging
    
    if (remainingCapital >= averagingCapital * 0.33) { // Can add at least one more position
      // Calculate average entry price and add position
      // TODO: Implement actual order placement for averaging
      return { shouldAverage: true, averagingAmount: averagingCapital / 3 } // Split into 3 additions
    }
  }
  
  return { shouldAverage: false }
}

// ===== MAIN EXECUTION FUNCTIONS =====
// These will be implemented based on the full requirements
// For now, this is the skeleton structure

const port = process.env.PORT || 4000
app.listen(port, () => {
  console.log(`trading-worker listening on http://0.0.0.0:${port}`)
  console.log('Enhanced features: Scheduler, Market Intelligence, Order Management enabled')
})

// Export for testing
module.exports = { app, analyzeMarketIntelligence, placeOrder, calculateTrailingSL }

