const express = require('express')
const bodyParser = require('body-parser')
const crypto = require('crypto')
const fetch = require('node-fetch')
const cron = require('node-cron')
const { createClient } = require('@supabase/supabase-js')

const app = express()
app.use(bodyParser.json())

// Supabase client for database access
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://blnphqmmsjlxlqnrmriw.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
const supabase = SUPABASE_SERVICE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY) : null

// Lot sizes configuration
const LOT_SIZES = {
  NIFTY: 75,
  BANKNIFTY: 35,
  SENSEX: 20
}

// Basic CORS support for browser calls
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.CORS_ALLOW_ORIGIN || '*')
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  )
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }
  next()
})

// Simple health + default route
app.get('/', (req, res) => {
  res.json({ ok: true, service: 'trading-worker' })
})

app.get('/health', (req, res) => {
  res.json({ ok: true })
})

// Enhanced Precheck endpoint with market intelligence and broker funds
app.post('/precheck', async (req, res) => {
  try {
    const { userId, strategy = 'Short Strangle', capital, lotSize = 1 } = req.body || {}

    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId required' })
    }

    // Fetch broker account
    let brokerAccount = null
    if (supabase) {
      const { data } = await supabase
        .from('broker_accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .eq('broker_type', 'angel_one')
        .single()
      brokerAccount = data
    }

    // Get market data (VIX and NIFTY spot)
    let vix = 15
    let niftySpot = 24750
    let marketConditions = null

    try {
      const apiKey = process.env.ANGEL_ONE_API_KEY
      const clientId = process.env.ANGEL_ONE_CLIENT_ID
      const mpin = process.env.ANGEL_ONE_PASSWORD
      const totpSecret = process.env.ANGEL_ONE_TOTP_SECRET
      const publicIp = process.env.ANGEL_ONE_PUBLIC_IP || '127.0.0.1'
      const localIp = process.env.ANGEL_ONE_LOCAL_IP || '127.0.0.1'
      const macAddress = process.env.ANGEL_ONE_MAC_ADDRESS || 'fe:ed:fa:ce:be:ef'

      if (apiKey && clientId && mpin && totpSecret) {
        const auth = await authenticateAngelOne({
          apiKey, clientId, mpin, totpSecret, publicIp, localIp, macAddress
        })

        if (auth.success && auth.token) {
          const marketData = await fetchMarketData({
            token: auth.token,
            apiKey, clientId, publicIp, localIp, macAddress,
            mode: 'LTP',
            exchangeTokens: {
              NSE: ['99926000', '99926017'] // NIFTY and VIX
            }
          })

          const vixData = marketData?.data?.fetched?.find(d => d.symbolToken === '99926017')
          const niftyData = marketData?.data?.fetched?.find(d => d.symbolToken === '99926000')
          vix = vixData?.ltp || 15
          niftySpot = niftyData?.ltp || 24750

          marketConditions = {
            vix,
            niftySpot,
            trend: vix > 20 ? 'volatile' : vix < 15 ? 'stable' : 'normal',
            volatilityLevel: vix > 20 ? 'high' : vix < 15 ? 'low' : 'medium'
          }
        }
      }
    } catch (err) {
      console.error('Market data fetch error in precheck:', err.message)
      // Continue with defaults if market data fails
    }

    // Calculate required capital
    const lotSizeValue = LOT_SIZES.NIFTY // For Short Strangle
    const sellAllocPct = 0.5 // 50% allocation for selling strategies
    const totalCapital = typeof capital === 'number' ? capital : 500000
    const requiredCapitalPerLot = Math.round(totalCapital * sellAllocPct)
    const requiredCapitalForLots = requiredCapitalPerLot * lotSize

    // Adjust strike gap based on VIX
    const baseStrikeGap = 250
    const strikeGap = vix > 20 ? 400 : vix < 15 ? 200 : baseStrikeGap

    // Fetch actual available funds from Angel One API
    let availableFunds = totalCapital * 0.8 // Default fallback
    try {
      if (apiKey && clientId && mpin && totpSecret) {
        const auth = await authenticateAngelOne({
          apiKey, clientId, mpin, totpSecret, publicIp, localIp, macAddress
        })
        if (auth.success && auth.token) {
          const funds = await getBrokerFunds({
            token: auth.token,
            apiKey, clientId, publicIp, localIp, macAddress
          })
          if (funds.success) {
            availableFunds = funds.availableFunds || availableFunds
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch broker funds, using estimate:', err.message)
    }
    const eligible = availableFunds >= requiredCapitalForLots

    // Calculate daily loss cap (1% of total capital)
    const dailyLossCap = Math.round(totalCapital * 0.01)

    res.json({
      success: true,
      strategy,
      vix,
      niftySpot,
      totalCapital,
      availableFunds,
      requiredCapitalPerLot,
      requiredCapitalForLots,
      strikeGap,
      lotSize,
      maxLots: Math.floor(availableFunds / requiredCapitalPerLot),
      eligible,
      dailyLossCap,
      reason: eligible ? undefined : 'Insufficient funds for selected lots',
      marketConditions,
      brokerConnected: !!brokerAccount
    })
  } catch (error) {
    console.error('Pre-check error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// ---- Angel One integration (proxy for frontend) ----

// Base32 decode (RFC 4648) – copied from Supabase function logic
function base32ToBytes (base32) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  const cleaned = (base32 || '').replace(/=+$/, '').replace(/\s+/g, '').toUpperCase()
  let bits = ''
  for (const c of cleaned) {
    const val = alphabet.indexOf(c)
    if (val === -1) continue
    bits += val.toString(2).padStart(5, '0')
  }
  const bytes = []
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2))
  }
  return Buffer.from(bytes)
}

// Generate TOTP code (30s window, 6 digits)
function generateTOTP (secret) {
  const epoch = Math.floor(Date.now() / 1000)
  const counter = Math.floor(epoch / 30)

  const buffer = Buffer.alloc(8)
  buffer.writeBigUInt64BE(BigInt(counter), 0)

  const keyBytes = base32ToBytes(secret)
  const hmac = crypto.createHmac('sha1', keyBytes)
  hmac.update(buffer)
  const hash = hmac.digest()

  const offset = hash[hash.length - 1] & 0xf
  const code =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff)

  return String(code % 1000000).padStart(6, '0')
}

async function authenticateAngelOne ({
  apiKey,
  clientId,
  mpin,
  totpSecret,
  publicIp,
  localIp,
  macAddress,
}) {
  try {
    console.log('=== Angel One Authentication Attempt (AWS backend) ===')
    console.log('Public IP header:', publicIp)
    console.log('Local IP header:', localIp)
    console.log('MAC Address header:', macAddress)
    console.log('Client ID:', clientId)

    const totp = generateTOTP(totpSecret)
    console.log('Generated TOTP:', totp)

    const response = await fetch('https://apiconnect.angelbroking.com/rest/auth/angelbroking/user/v1/loginByMpin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-UserType': 'USER',
        'X-SourceID': 'WEB',
        'X-ClientLocalIP': localIp,
        'X-ClientPublicIP': publicIp,
        'X-MACAddress': macAddress,
        'X-PrivateKey': apiKey,
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      body: JSON.stringify({
        clientcode: clientId,
        mpin,
        totp,
      }),
    })

    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text()
      console.error('Non-JSON auth response from Angel One:', text.substring(0, 400))
      return { success: false, error: `Non-JSON response from Angel One auth. Status: ${response.status}` }
    }

    const data = await response.json()
    console.log('Angel One auth response:', data)

    if (data?.status && data?.data?.jwtToken) {
      return { success: true, token: data.data.jwtToken, feedToken: data.data.feedToken }
    }

    return { success: false, error: data?.message || 'Authentication failed' }
  } catch (err) {
    console.error('Angel One authentication error:', err)
    return { success: false, error: err.message || 'Unknown error' }
  }
}

async function fetchMarketData ({
  token,
  apiKey,
  clientId,
  publicIp,
  localIp,
  macAddress,
  mode,
  exchangeTokens,
}) {
  try {
    const resolvedMode = mode || 'LTP'
    const resolvedExchangeTokens =
      exchangeTokens || { NSE: ['99926000', '99926009', '99926037', '99926017'], BSE: ['99919000'] }

    const response = await fetch(
      'https://apiconnect.angelbroking.com/rest/secure/angelbroking/market/v1/quote/',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
          'X-UserType': 'USER',
          'X-SourceID': 'WEB',
          'X-ClientLocalIP': localIp,
          'X-ClientPublicIP': publicIp,
          'X-MACAddress': macAddress,
          'X-PrivateKey': apiKey,
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        body: JSON.stringify({ mode: resolvedMode, exchangeTokens: resolvedExchangeTokens }),
      }
    )

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      const text = await response.text()
      console.error('Non-JSON market data response from Angel One:', text.substring(0, 400))
      return { status: false, message: 'Non-JSON response', raw: text }
    }

    const data = await response.json()
    console.log('Angel One market data response:', data)
    return data
  } catch (err) {
    console.error('Error fetching market data from Angel One:', err)
    throw err
  }
}

// ===== MARKET INTELLIGENCE MODULE =====
async function analyzeMarketIntelligence() {
  try {
    const apiKey = process.env.ANGEL_ONE_API_KEY
    const clientId = process.env.ANGEL_ONE_CLIENT_ID
    const mpin = process.env.ANGEL_ONE_PASSWORD
    const totpSecret = process.env.ANGEL_ONE_TOTP_SECRET
    const publicIp = process.env.ANGEL_ONE_PUBLIC_IP || '127.0.0.1'
    const localIp = process.env.ANGEL_ONE_LOCAL_IP || '127.0.0.1'
    const macAddress = process.env.ANGEL_ONE_MAC_ADDRESS || 'fe:ed:fa:ce:be:ef'

    if (!apiKey || !clientId || !mpin || !totpSecret) {
      return { conditions: null, recommendations: [], error: 'Missing Angel One credentials' }
    }

    const auth = await authenticateAngelOne({
      apiKey, clientId, mpin, totpSecret, publicIp, localIp, macAddress
    })

    if (!auth.success) {
      return { conditions: null, recommendations: [], error: 'Authentication failed' }
    }

    const marketData = await fetchMarketData({
      token: auth.token,
      apiKey, clientId, publicIp, localIp, macAddress,
      mode: 'LTP',
      exchangeTokens: {
        NSE: ['99926000', '99926017'] // NIFTY and VIX
      }
    })

    const vixData = marketData?.data?.fetched?.find(d => d.symbolToken === '99926017')
    const niftyData = marketData?.data?.fetched?.find(d => d.symbolToken === '99926000')
    const vix = vixData?.ltp || 15
    const niftySpot = niftyData?.ltp || 24750

    const conditions = {
      vix,
      niftySpot,
      trend: vix > 20 ? 'volatile' : vix < 15 ? 'stable' : 'normal',
      volatilityLevel: vix > 20 ? 'high' : vix < 15 ? 'low' : 'medium'
    }

    // Suggest strategies based on market intelligence
    const recommendations = []
    
    if (vix > 20) {
      recommendations.push({ strategy: 'Iron Condor', confidence: 'high', reason: 'High VIX favors premium collection' })
      recommendations.push({ strategy: 'Short Strangle', confidence: 'high', reason: 'High volatility premium' })
    } else if (vix < 15) {
      recommendations.push({ strategy: 'Long Straddle', confidence: 'medium', reason: 'Low VIX, potential breakout' })
      recommendations.push({ strategy: 'Bull Call Spread', confidence: 'medium', reason: 'Low volatility, bullish bias' })
    } else {
      recommendations.push({ strategy: 'Short Strangle', confidence: 'medium', reason: 'Normal volatility, range-bound' })
      recommendations.push({ strategy: 'Iron Condor', confidence: 'medium', reason: 'Stable premium collection' })
    }

    return { conditions, recommendations }
  } catch (error) {
    console.error('Market intelligence analysis error:', error)
    return { conditions: null, recommendations: [], error: error.message }
  }
}

// ===== ANGEL ONE ORDER & FUNDS APIS =====
async function getBrokerFunds({ token, apiKey, clientId, publicIp, localIp, macAddress }) {
  try {
    const response = await fetch('https://apiconnect.angelbroking.com/rest/secure/angelbroking/user/v1/getRMS', {
      method: 'GET',
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
      }
    })

    const data = await response.json()
    if (data?.status && data?.data) {
      return {
        success: true,
        availableFunds: parseFloat(data.data.availablecash) || 0,
        usedMargin: parseFloat(data.data.usedmargin) || 0,
        totalMargin: parseFloat(data.data.totalmargin) || 0
      }
    }
    return { success: false, error: data?.message || 'Failed to fetch funds' }
  } catch (error) {
    console.error('Get broker funds error:', error)
    return { success: false, error: error.message }
  }
}

async function getOptionChain({ token, apiKey, clientId, publicIp, localIp, macAddress, symbol, expiryDate }) {
  try {
    const response = await fetch('https://apiconnect.angelbroking.com/rest/secure/angelbroking/market/v1/getOptionChain', {
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
      body: JSON.stringify({
        symbol: symbol || 'NIFTY',
        expirydate: expiryDate || new Date().toISOString().split('T')[0]
      })
    })

    const data = await response.json()
    return { success: data?.status === true, data }
  } catch (error) {
    console.error('Get option chain error:', error)
    return { success: false, error: error.message }
  }
}

async function placeOrder({ token, apiKey, clientId, publicIp, localIp, macAddress, orderParams }) {
  try {
    // Try LIMIT order first
    const limitOrder = {
      ...orderParams,
      producttype: orderParams.producttype || 'INTRADAY',
      ordertype: 'LIMIT',
      price: orderParams.price || orderParams.ltp || 0,
      validity: 'DAY'
    }

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
      body: JSON.stringify(limitOrder)
    })

    const data = await response.json()
    
    if (data?.status && data?.data?.orderid) {
      return { success: true, data, orderId: data.data.orderid, orderType: 'LIMIT' }
    }

    // If LIMIT fails, try MARKET order
    if (data?.message?.includes('price') || data?.errorcode) {
      const marketOrder = {
        ...orderParams,
        producttype: orderParams.producttype || 'INTRADAY',
        ordertype: 'MARKET',
        validity: 'DAY'
      }

      const marketResponse = await fetch('https://apiconnect.angelbroking.com/rest/secure/angelbroking/order/v1/placeOrder', {
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
        body: JSON.stringify(marketOrder)
      })

      const marketData = await marketResponse.json()
      return {
        success: marketData?.status === true,
        data: marketData,
        orderId: marketData?.data?.orderid,
        orderType: 'MARKET'
      }
    }

    return { success: false, error: data?.message || 'Order placement failed', data }
  } catch (error) {
    console.error('Order placement error:', error)
    return { success: false, error: error.message }
  }
}

async function cancelOrder({ token, apiKey, clientId, publicIp, localIp, macAddress, orderId }) {
  try {
    const response = await fetch('https://apiconnect.angelbroking.com/rest/secure/angelbroking/order/v1/cancelOrder', {
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
      body: JSON.stringify({ orderid: orderId, variety: 'NORMAL' })
    })

    const data = await response.json()
    return { success: data?.status === true, data }
  } catch (error) {
    console.error('Cancel order error:', error)
    return { success: false, error: error.message }
  }
}

// ===== TRAILING STOP LOSS MODULE =====
function calculateTrailingSL(currentProfitPct, trailSLSteps) {
  if (!trailSLSteps || !Array.isArray(trailSLSteps) || trailSLSteps.length === 0) {
    return null
  }

  // Sort by profit_pct descending
  const sortedSteps = [...trailSLSteps].sort((a, b) => (b.profit_pct || 0) - (a.profit_pct || 0))

  for (const step of sortedSteps) {
    if (currentProfitPct >= (step.profit_pct || 0)) {
      return step.trail_to_pct || 0
    }
  }
  return null
}

function shouldExitOnTrailingSL(currentProfitPct, trailingSLPct) {
  if (trailingSLPct === null || trailingSLPct === undefined) return false
  return currentProfitPct <= trailingSLPct
}

// ===== AVERAGING MODULE (for buying strategies) =====
function checkAveragingTrigger({ currentPrice, entryPrice, allocatedCapital, usedCapital }) {
  if (!entryPrice || !currentPrice) return { shouldAverage: false }

  const downPercent = ((entryPrice - currentPrice) / entryPrice) * 100

  if (downPercent >= 10) {
    const remainingCapital = allocatedCapital - usedCapital
    const averagingCapital = allocatedCapital * 0.6 // 60% reserved for averaging

    if (remainingCapital >= averagingCapital * 0.33) {
      // Can add at least one more position
      const averagingAmount = averagingCapital / 3 // Split into 3 equal additions
      return {
        shouldAverage: true,
        averagingAmount,
        downPercent,
        newAveragePrice: null // Will be calculated after averaging
      }
    }
  }

  return { shouldAverage: false }
}

// Execute averaging for buying strategies
async function executeAveraging({ tradeId, legId, currentPrice, averagingAmount, auth, apiKey, clientId, publicIp, localIp, macAddress }) {
  try {
    if (!supabase) return { success: false, error: 'Supabase not initialized' }

    // Get the leg details
    const { data: leg } = await supabase
      .from('trade_legs')
      .select('*')
      .eq('id', legId)
      .single()

    if (!leg) {
      return { success: false, error: 'Leg not found' }
    }

    // Calculate quantity for averaging (40% first entry, now adding from 60% pool)
    const averagingQuantity = Math.floor(averagingAmount / currentPrice)
    if (averagingQuantity <= 0) {
      return { success: false, error: 'Insufficient capital for averaging' }
    }

    // Place buy order for averaging
    const avgOrder = await placeOrder({
      token: auth.token,
      apiKey, clientId, publicIp, localIp, macAddress,
      orderParams: {
        variety: 'NORMAL',
        tradingsymbol: leg.tradingsymbol || '',
        symboltoken: leg.symboltoken || '',
        transactiontype: 'BUY',
        exchange: 'NFO',
        ordertype: 'LIMIT',
        producttype: 'MIS',
        duration: 'DAY',
        price: currentPrice,
        quantity: averagingQuantity
      }
    })

    if (avgOrder.success) {
      // Create new leg entry for averaging
      const { data: newLeg } = await supabase
        .from('trade_legs')
        .insert({
          trade_id: tradeId,
          option_type: leg.option_type,
          strike_price: leg.strike_price,
          premium: currentPrice,
          quantity: averagingQuantity,
          entry_price: currentPrice,
          entry_order_id: avgOrder.orderId,
          averaging_entry_number: (leg.averaging_entry_number || 1) + 1,
          order_status: 'placed'
        })
        .select()
        .single()

      // Calculate new average entry price
      const { data: allLegs } = await supabase
        .from('trade_legs')
        .select('entry_price, quantity')
        .eq('trade_id', tradeId)
        .eq('option_type', leg.option_type)
        .eq('strike_price', leg.strike_price)

      const avgPrice = calculateAverageEntryPrice(allLegs || [])

      // Update trade with average entry price
      await supabase
        .from('trades')
        .update({ average_entry_price: avgPrice })
        .eq('id', tradeId)

      return { success: true, newLeg, averagePrice: avgPrice }
    }

    return { success: false, error: 'Averaging order failed' }
  } catch (error) {
    console.error('[Averaging] Error:', error)
    return { success: false, error: error.message }
  }
}

function calculateAverageEntryPrice(entries) {
  if (!entries || entries.length === 0) return 0
  const totalCost = entries.reduce((sum, e) => sum + (e.price * e.quantity), 0)
  const totalQuantity = entries.reduce((sum, e) => sum + e.quantity, 0)
  return totalQuantity > 0 ? totalCost / totalQuantity : 0
}

// ===== EXECUTION FUNCTIONS =====
async function executeShortStrangleEntry(userId, strategyConfig) {
  try {
    console.log(`[Execution] Starting Short Strangle entry for user ${userId}`)

    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }

    // Get broker account
    const { data: brokerAccount } = await supabase
      .from('broker_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .eq('broker_type', 'angel_one')
      .single()

    if (!brokerAccount) {
      throw new Error('No active broker account found')
    }

    // Authenticate
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
      throw new Error('Authentication failed')
    }

    // Get market data
    const marketData = await fetchMarketData({
      token: auth.token,
      apiKey, clientId, publicIp, localIp, macAddress,
      mode: 'LTP',
      exchangeTokens: { NSE: ['99926000', '99926017'] }
    })

    const vix = marketData?.data?.fetched?.find(d => d.symbolToken === '99926017')?.ltp || 15
    const niftySpot = marketData?.data?.fetched?.find(d => d.symbolToken === '99926000')?.ltp || 24750

    // Calculate strike gap
    const baseStrikeGap = strategyConfig.strike_gap_points || 250
    const strikeGap = vix > 20 ? (baseStrikeGap + 150) : vix < 15 ? (baseStrikeGap - 50) : baseStrikeGap

    const ceStrike = Math.ceil(niftySpot / 50) * 50 + strikeGap
    const peStrike = Math.floor(niftySpot / 50) * 50 - strikeGap

    // Get option chain and find strikes with >= ₹80 premium
    let selectedCE = null
    let selectedPE = null
    const minPremium = strategyConfig.minimum_premium_threshold || 80

    try {
      // Get current week expiry (Thursday)
      const today = new Date()
      const daysUntilThursday = (4 - today.getDay() + 7) % 7 || 7
      const expiryDate = new Date(today)
      expiryDate.setDate(today.getDate() + daysUntilThursday)
      const expiryStr = expiryDate.toISOString().split('T')[0]

      const optionChain = await getOptionChain({
        token: auth.token,
        apiKey, clientId, publicIp, localIp, macAddress,
        symbol: 'NIFTY',
        expiryDate: expiryStr
      })

      if (optionChain.success && optionChain.data?.data) {
        // Find CE with premium >= minPremium
        const ceOptions = optionChain.data.data.filter(opt => 
          opt.strikeprice >= ceStrike && opt.optiontype === 'CE'
        )
        selectedCE = ceOptions.find(opt => opt.ltp >= minPremium) || ceOptions[0]

        // Find PE with premium >= minPremium
        const peOptions = optionChain.data.data.filter(opt => 
          opt.strikeprice <= peStrike && opt.optiontype === 'PE'
        )
        selectedPE = peOptions.find(opt => opt.ltp >= minPremium) || peOptions[0]

        // If current expiry doesn't have both with >= ₹80, try next week
        if (!selectedCE || !selectedPE || selectedCE.ltp < minPremium || selectedPE.ltp < minPremium) {
          const nextExpiry = new Date(expiryDate)
          nextExpiry.setDate(expiryDate.getDate() + 7)
          const nextExpiryStr = nextExpiry.toISOString().split('T')[0]

          const nextWeekChain = await getOptionChain({
            token: auth.token,
            apiKey, clientId, publicIp, localIp, macAddress,
            symbol: 'NIFTY',
            expiryDate: nextExpiryStr
          })

          if (nextWeekChain.success && nextWeekChain.data?.data) {
            const nextCEOptions = nextWeekChain.data.data.filter(opt => 
              opt.strikeprice >= ceStrike && opt.optiontype === 'CE' && opt.ltp >= minPremium
            )
            const nextPEOptions = nextWeekChain.data.data.filter(opt => 
              opt.strikeprice <= peStrike && opt.optiontype === 'PE' && opt.ltp >= minPremium
            )
            if (nextCEOptions.length > 0 && nextPEOptions.length > 0) {
              selectedCE = nextCEOptions[0]
              selectedPE = nextPEOptions[0]
            }
          }
        }
      }
    } catch (err) {
      console.error('[Execution] Option chain fetch error:', err)
      // Fallback to calculated strikes if option chain fails
    }

    if (!selectedCE || !selectedPE) {
      throw new Error('Unable to find suitable strikes with minimum premium requirement')
    }

    // Create execution run
    const today = new Date().toISOString().split('T')[0]
    const { data: executionRun, error: runError } = await supabase
      .from('execution_runs')
      .insert({
        user_id: userId,
        strategy_config_id: strategyConfig.id,
        date: today,
        status: 'running',
        allocated_capital: strategyConfig.allocated_capital || 0,
        vix_at_entry: vix,
        nifty_spot_at_entry: niftySpot,
        strike_gap_used: strikeGap,
        entry_time: new Date().toISOString()
      })
      .select()
      .single()

    if (runError) {
      throw new Error(`Failed to create execution run: ${runError.message}`)
    }

    // Place actual orders for CE and PE
    const lotSize = strategyConfig.lot_size || 1
    const lotSizeValue = LOT_SIZES.NIFTY

    // Place CE sell order
    const ceOrder = await placeOrder({
      token: auth.token,
      apiKey, clientId, publicIp, localIp, macAddress,
      orderParams: {
        variety: 'NORMAL',
        tradingsymbol: selectedCE.tradingsymbol || `NIFTY${selectedCE.strikeprice}CE`,
        symboltoken: selectedCE.symboltoken,
        transactiontype: 'SELL',
        exchange: 'NFO',
        ordertype: 'LIMIT',
        producttype: 'MIS',
        duration: 'DAY',
        price: selectedCE.ltp || 0,
        squareoff: '0',
        stoploss: '0',
        quantity: lotSizeValue * lotSize
      }
    })

    // Place PE sell order
    const peOrder = await placeOrder({
      token: auth.token,
      apiKey, clientId, publicIp, localIp, macAddress,
      orderParams: {
        variety: 'NORMAL',
        tradingsymbol: selectedPE.tradingsymbol || `NIFTY${selectedPE.strikeprice}PE`,
        symboltoken: selectedPE.symboltoken,
        transactiontype: 'SELL',
        exchange: 'NFO',
        ordertype: 'LIMIT',
        producttype: 'MIS',
        duration: 'DAY',
        price: selectedPE.ltp || 0,
        squareoff: '0',
        stoploss: '0',
        quantity: lotSizeValue * lotSize
      }
    })

    // Create trade record
    const { data: trade, error: tradeError } = await supabase
      .from('trades')
      .insert({
        user_id: userId,
        strategy_config_id: strategyConfig.id,
        execution_run_id: executionRun.id,
        nifty_price_at_entry: niftySpot,
        entry_time: new Date().toISOString(),
        total_premium_received: ((selectedCE.ltp || 0) + (selectedPE.ltp || 0)) * lotSizeValue * lotSize,
        trade_status: 'executed',
        lot_size: lotSize
      })
      .select()
      .single()

    if (tradeError) {
      throw new Error(`Failed to create trade record: ${tradeError.message}`)
    }

    // Create trade legs
    const legs = []
    if (ceOrder.success) {
      const { data: ceLeg } = await supabase
        .from('trade_legs')
        .insert({
          trade_id: trade.id,
          option_type: 'CE',
          strike_price: selectedCE.strikeprice,
          premium: selectedCE.ltp || 0,
          quantity: lotSizeValue * lotSize,
          entry_price: selectedCE.ltp || 0,
          entry_order_id: ceOrder.orderId,
          order_status: 'placed'
        })
        .select()
        .single()
      legs.push(ceLeg)
    }

    if (peOrder.success) {
      const { data: peLeg } = await supabase
        .from('trade_legs')
        .insert({
          trade_id: trade.id,
          option_type: 'PE',
          strike_price: selectedPE.strikeprice,
          premium: selectedPE.ltp || 0,
          quantity: lotSizeValue * lotSize,
          entry_price: selectedPE.ltp || 0,
          entry_order_id: peOrder.orderId,
          order_status: 'placed'
        })
        .select()
        .single()
      legs.push(peLeg)
    }

    // Update execution run with used capital
    await supabase
      .from('execution_runs')
      .update({
        used_capital: ((selectedCE.ltp || 0) + (selectedPE.ltp || 0)) * lotSizeValue * lotSize
      })
      .eq('id', executionRun.id)

    console.log(`[Execution] Entry execution completed for run ${executionRun.id}`)
    return { success: true, executionRunId: executionRun.id, tradeId: trade.id, legs }
  } catch (error) {
    console.error('[Execution] Short Strangle entry error:', error)
    return { success: false, error: error.message }
  }
}

async function executeShortStrangleExit(userId, executionRunId) {
  try {
    console.log(`[Execution] Starting Short Strangle exit for run ${executionRunId}`)

    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }

    // Get open trades for this execution run
    const { data: trades } = await supabase
      .from('trades')
      .select('*, trade_legs(*)')
      .eq('execution_run_id', executionRunId)
      .eq('trade_status', 'executed')

    if (!trades || trades.length === 0) {
      console.log(`[Execution] No open trades found for run ${executionRunId}`)
      await supabase
        .from('execution_runs')
        .update({ status: 'completed', exit_time: new Date().toISOString(), reason: 'No open positions' })
        .eq('id', executionRunId)
      return { success: true }
    }

    // Authenticate for order placement
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
      throw new Error('Authentication failed')
    }

    // Close all legs at market
    for (const trade of trades) {
      for (const leg of trade.trade_legs || []) {
        if (leg.exit_price === null && leg.entry_order_id) {
          // Get current market price for the leg
          const currentPrice = await fetchMarketData({
            token: auth.token,
            apiKey, clientId, publicIp, localIp, macAddress,
            mode: 'LTP',
            exchangeTokens: {
              NFO: [leg.symboltoken || ''] // Need to store symboltoken in trade_legs
            }
          })

          const ltp = currentPrice?.data?.fetched?.[0]?.ltp || leg.entry_price

          // Place market order to close (opposite transaction)
          const closeOrder = await placeOrder({
            token: auth.token,
            apiKey, clientId, publicIp, localIp, macAddress,
            orderParams: {
              variety: 'NORMAL',
              tradingsymbol: leg.tradingsymbol || '',
              symboltoken: leg.symboltoken || '',
              transactiontype: 'BUY', // Opposite of SELL entry
              exchange: 'NFO',
              ordertype: 'MARKET', // Fast execution for exit
              producttype: 'MIS',
              duration: 'DAY',
              quantity: leg.quantity
            }
          })

          if (closeOrder.success) {
            // Update leg with exit details
            const pnl = (leg.entry_price - ltp) * leg.quantity // For selling: profit when exit < entry
            await supabase
              .from('trade_legs')
              .update({
                exit_price: ltp,
                exit_order_id: closeOrder.orderId,
                pnl: pnl,
                order_status: 'filled'
              })
              .eq('id', leg.id)
          }
        }
      }

      // Calculate final P/L
      const totalPnl = (trade.trade_legs || []).reduce((sum, leg) => sum + (leg.pnl || 0), 0)
      
      await supabase
        .from('trades')
        .update({
          exit_time: new Date().toISOString(),
          trade_status: 'executed',
          total_pnl: totalPnl
        })
        .eq('id', trade.id)
    }

    // Update execution run
    await supabase
      .from('execution_runs')
      .update({ status: 'completed', exit_time: new Date().toISOString() })
      .eq('id', executionRunId)

    return { success: true }
  } catch (error) {
    console.error('[Execution] Short Strangle exit error:', error)
    return { success: false, error: error.message }
  }
}

// Monitor and apply trailing SL for selling strategies
async function monitorTrailingSL() {
  try {
    if (!supabase) return

    // Get running execution runs for selling strategies with trailing SL enabled
    const { data: runningRuns } = await supabase
      .from('execution_runs')
      .select('*, strategy_configs!inner(strategy_type, trail_sl_enabled, trail_sl_steps)')
      .eq('status', 'running')
      .eq('strategy_configs.strategy_type', 'selling')
      .eq('strategy_configs.trail_sl_enabled', true)

    if (!runningRuns || runningRuns.length === 0) return

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

    if (!auth.success) return

    for (const run of runningRuns) {
      const { data: trades } = await supabase
        .from('trades')
        .select('*, trade_legs(*)')
        .eq('execution_run_id', run.id)
        .eq('trade_status', 'executed')

      if (!trades || trades.length === 0) continue

      for (const trade of trades) {
        const allocatedCapital = run.allocated_capital || trade.total_premium_received || 1
        let totalUnrealizedPnl = 0

        // Fetch current prices
        const symbolTokens = (trade.trade_legs || []).map(leg => leg.symboltoken).filter(Boolean)
        if (symbolTokens.length > 0) {
          const currentPrices = await fetchMarketData({
            token: auth.token,
            apiKey, clientId, publicIp, localIp, macAddress,
            mode: 'LTP',
            exchangeTokens: { NFO: symbolTokens }
          })

          for (const leg of trade.trade_legs || []) {
            const currentPrice = currentPrices?.data?.fetched?.find(p => p.symboltoken === leg.symboltoken)?.ltp
            if (currentPrice && leg.entry_price) {
              const legPnl = (leg.entry_price - currentPrice) * leg.quantity
              totalUnrealizedPnl += legPnl
            }
          }
        }

        const currentProfitPct = (totalUnrealizedPnl / allocatedCapital) * 100
        const trailSLSteps = run.strategy_configs?.trail_sl_steps || []
        const trailingSLPct = calculateTrailingSL(currentProfitPct, trailSLSteps)

        // Update trailing SL price if applicable
        if (trailingSLPct !== null) {
          const trailingSLPrice = allocatedCapital * (trailingSLPct / 100)
          await supabase
            .from('trades')
            .update({ trailing_sl_price: trailingSLPrice, max_profit_reached: Math.max(trade.max_profit_reached || 0, currentProfitPct) })
            .eq('id', trade.id)

          // Check if trailing SL hit
          if (shouldExitOnTrailingSL(currentProfitPct, trailingSLPct)) {
            // Exit the position
            for (const leg of trade.trade_legs || []) {
              if (leg.exit_price === null) {
                await placeOrder({
                  token: auth.token,
                  apiKey, clientId, publicIp, localIp, macAddress,
                  orderParams: {
                    variety: 'NORMAL',
                    tradingsymbol: leg.tradingsymbol || '',
                    symboltoken: leg.symboltoken || '',
                    transactiontype: 'BUY',
                    exchange: 'NFO',
                    ordertype: 'MARKET',
                    producttype: 'MIS',
                    duration: 'DAY',
                    quantity: leg.quantity
                  }
                })
              }
            }

            await supabase
              .from('execution_runs')
              .update({ status: 'completed', exit_time: new Date().toISOString(), reason: 'Trailing SL hit' })
              .eq('id', run.id)
          }
        }
      }
    }
  } catch (error) {
    console.error('[Trailing SL] Monitoring error:', error)
  }
}

// Monitor and exit strategies based on profit/loss criteria
async function monitorAndExitStrategies({ minProfitPct, breakeven, maxLossPct }) {
  try {
    if (!supabase) return

    // Get running execution runs for non-fixed-timing strategies
    const { data: runningRuns } = await supabase
      .from('execution_runs')
      .select('*, strategy_configs!inner(strategy_type, fixed_timing)')
      .eq('status', 'running')
      .eq('strategy_configs.fixed_timing', false)

    if (!runningRuns || runningRuns.length === 0) return

    // Also monitor trailing SL for selling strategies
    await monitorTrailingSL()

    for (const run of runningRuns) {
      // Get current P/L for the trade
      const { data: trades } = await supabase
        .from('trades')
        .select('*, trade_legs(*)')
        .eq('execution_run_id', run.id)
        .eq('trade_status', 'executed')

      if (!trades || trades.length === 0) continue

      for (const trade of trades) {
        // Calculate current unrealized P/L
        let totalUnrealizedPnl = 0
        const allocatedCapital = run.allocated_capital || trade.total_premium_received || 1

        // Authenticate for market data
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

        if (auth.success && auth.token) {
          // Fetch current prices for all legs
          const symbolTokens = (trade.trade_legs || []).map(leg => leg.symboltoken).filter(Boolean)
          if (symbolTokens.length > 0) {
            const currentPrices = await fetchMarketData({
              token: auth.token,
              apiKey, clientId, publicIp, localIp, macAddress,
              mode: 'LTP',
              exchangeTokens: { NFO: symbolTokens }
            })

            for (const leg of trade.trade_legs || []) {
              const currentPrice = currentPrices?.data?.fetched?.find(p => p.symboltoken === leg.symboltoken)?.ltp
              if (currentPrice && leg.entry_price) {
                // For selling: profit when current < entry
                const legPnl = (leg.entry_price - currentPrice) * leg.quantity
                totalUnrealizedPnl += legPnl
              }
            }
          }
        }

        const currentPnlPct = (totalUnrealizedPnl / allocatedCapital) * 100

        let shouldExit = false
        let exitReason = ''

        if (minProfitPct && currentPnlPct >= minProfitPct) {
          shouldExit = true
          exitReason = `Profit target reached: ${currentPnlPct.toFixed(2)}%`
        } else if (breakeven && currentPnlPct >= -0.001 && currentPnlPct <= 0.001) {
          shouldExit = true
          exitReason = 'Breakeven exit'
        } else if (maxLossPct && currentPnlPct <= -maxLossPct) {
          shouldExit = true
          exitReason = `Max loss limit: ${currentPnlPct.toFixed(2)}%`
        }

        if (shouldExit) {
          // Execute exit - place market orders to close positions
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

          if (auth.success && auth.token) {
            for (const leg of trade.trade_legs || []) {
              if (leg.exit_price === null) {
                await placeOrder({
                  token: auth.token,
                  apiKey, clientId, publicIp, localIp, macAddress,
                  orderParams: {
                    variety: 'NORMAL',
                    tradingsymbol: leg.tradingsymbol || '',
                    symboltoken: leg.symboltoken || '',
                    transactiontype: 'BUY',
                    exchange: 'NFO',
                    ordertype: 'MARKET',
                    producttype: 'MIS',
                    duration: 'DAY',
                    quantity: leg.quantity
                  }
                })
              }
            }
          }

          await supabase
            .from('execution_runs')
            .update({ status: 'completed', exit_time: new Date().toISOString(), reason: exitReason })
            .eq('id', run.id)
        }
      }
    }
  } catch (error) {
    console.error('[Monitor] Error monitoring strategies:', error)
  }
}

// Force exit all open positions
async function forceExitAllStrategies() {
  try {
    if (!supabase) return

    const { data: runningRuns } = await supabase
      .from('execution_runs')
      .select('*')
      .eq('status', 'running')

    if (!runningRuns || runningRuns.length === 0) return

    for (const run of runningRuns) {
      // Force exit all positions
      await supabase
        .from('execution_runs')
        .update({
          status: 'completed',
          exit_time: new Date().toISOString(),
          reason: 'Force exit at 3:25 PM'
        })
        .eq('id', run.id)
    }
  } catch (error) {
    console.error('[Force Exit] Error:', error)
  }
}

// Root POST – used by frontend via VITE_BACKEND_URL
app.post('/', async (req, res) => {
  const { action, mode, exchangeTokens } = req.body || {}

  if (!action) {
    return res.status(400).json({ success: false, error: 'Missing action in request body' })
  }

  if (action === 'fetchMarketData') {
    const apiKey = process.env.ANGEL_ONE_API_KEY
    const apiSecret = process.env.ANGEL_ONE_API_SECRET // currently unused but kept for parity
    const clientId = process.env.ANGEL_ONE_CLIENT_ID
    const mpin = process.env.ANGEL_ONE_PASSWORD
    const totpSecret = process.env.ANGEL_ONE_TOTP_SECRET

    if (!apiKey || !apiSecret || !clientId || !mpin || !totpSecret) {
      return res.status(500).json({ success: false, error: 'Missing Angel One credentials on backend' })
    }

    // Use whitelisted IP/MAC if provided; otherwise fall back to placeholders
    const publicIp = process.env.ANGEL_ONE_PUBLIC_IP || req.ip || '127.0.0.1'
    const localIp = process.env.ANGEL_ONE_LOCAL_IP || '127.0.0.1'
    const macAddress = process.env.ANGEL_ONE_MAC_ADDRESS || 'fe:ed:fa:ce:be:ef'

    const auth = await authenticateAngelOne({
      apiKey,
      clientId,
      mpin,
      totpSecret,
      publicIp,
      localIp,
      macAddress,
    })

    if (!auth.success || !auth.token) {
      return res.status(401).json({ success: false, error: auth.error || 'Authentication failed' })
    }

    try {
      const marketData = await fetchMarketData({
        token: auth.token,
        apiKey,
        clientId,
        publicIp,
        localIp,
        macAddress,
        mode,
        exchangeTokens,
      })
      return res.json({ success: true, data: marketData })
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to fetch market data from Angel One',
      })
    }
  }

  if (action === 'getMarketIntelligence') {
    try {
      const marketIntel = await analyzeMarketIntelligence()
      return res.json({ success: true, ...marketIntel })
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message })
    }
  }

  if (action === 'getBrokerFunds') {
    const { userId } = req.body
    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId required' })
    }

    try {
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
        return res.status(401).json({ success: false, error: auth.error })
      }

      const funds = await getBrokerFunds({
        token: auth.token,
        apiKey, clientId, publicIp, localIp, macAddress
      })

      return res.json(funds)
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message })
    }
  }

  return res.status(400).json({ success: false, error: 'Invalid action' })
})

// ===== WEBSOCKET ORDER MONITORING =====
// WebSocket connection for real-time order status updates
let wsConnections = new Map()

async function connectOrderWebSocket({ token, feedToken, apiKey, clientId }) {
  try {
    // Angel One WebSocket URL (example - verify actual URL from docs)
    const wsUrl = `wss://smartapis.angelone.in/ws?jwttoken=${token}&feedtoken=${feedToken}`
    
    const WebSocket = require('ws')
    const ws = new WebSocket(wsUrl)

    ws.on('open', () => {
      console.log('[WebSocket] Connected to Angel One order feed')
      // Subscribe to order updates
      ws.send(JSON.stringify({
        action: 'subscribe',
        mode: 'order'
      }))
    })

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString())
        
        if (message.type === 'order_update') {
          const { orderid, status, filledqty } = message
          
          // Update trade leg order status
          if (supabase) {
            await supabase
              .from('trade_legs')
              .update({
                order_status: status === 'FILLED' ? 'filled' : status === 'CANCELLED' ? 'cancelled' : 'pending'
              })
              .eq('entry_order_id', orderid)
              .or(`exit_order_id.eq.${orderid}`)
          }
        }
      } catch (err) {
        console.error('[WebSocket] Message processing error:', err)
      }
    })

    ws.on('error', (error) => {
      console.error('[WebSocket] Error:', error)
    })

    ws.on('close', () => {
      console.log('[WebSocket] Connection closed, reconnecting...')
      // Reconnect after 5 seconds
      setTimeout(() => {
        connectOrderWebSocket({ token, feedToken, apiKey, clientId })
      }, 5000)
    })

    return ws
  } catch (error) {
    console.error('[WebSocket] Connection error:', error)
    return null
  }
}

// Initialize WebSocket on startup (if credentials available)
if (process.env.ANGEL_ONE_API_KEY && process.env.ANGEL_ONE_TOTP_SECRET) {
  setTimeout(async () => {
    try {
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

      if (auth.success && auth.feedToken) {
        const ws = await connectOrderWebSocket({
          token: auth.token,
          feedToken: auth.feedToken,
          apiKey,
          clientId
        })
        if (ws) {
          wsConnections.set('default', ws)
          console.log('[WebSocket] Order monitoring initialized')
        }
      }
    } catch (error) {
      console.error('[WebSocket] Initialization error:', error)
    }
  }, 5000) // Wait 5 seconds after server start
}

// Initialize scheduler (only if cron is available)
let schedulerEnabled = false
try {
  const cron = require('node-cron')
  
  // Entry scheduler for Skyspear Short Strangle (3:10 PM IST daily)
  cron.schedule('10 15 * * *', async () => {
    console.log('[Scheduler] Entry time triggered for Short Strangle (3:10 PM IST)')
    try {
      if (!supabase) {
        console.error('[Scheduler] Supabase client not available')
        return
      }

      // Get all users with auto-execute enabled for Short Strangle
      const { data: strategies } = await supabase
        .from('strategy_configs')
        .select('*, user_id')
        .eq('strategy_name', 'Short Strangle')
        .eq('auto_execute_enabled', true)
        .eq('is_active', true)
        .eq('fixed_timing', true)

      if (!strategies || strategies.length === 0) {
        console.log('[Scheduler] No active Short Strangle strategies found')
        return
      }

      for (const strategy of strategies) {
        // Check if execution run already exists for today
        const today = new Date().toISOString().split('T')[0]
        const { data: existingRun } = await supabase
          .from('execution_runs')
          .select('id')
          .eq('user_id', strategy.user_id)
          .eq('strategy_config_id', strategy.id)
          .eq('date', today)
          .single()

        if (existingRun) {
          console.log(`[Scheduler] Execution run already exists for user ${strategy.user_id}`)
          continue
        }

        // Execute entry
        const result = await executeShortStrangleEntry(strategy.user_id, strategy)
        if (result.success) {
          console.log(`[Scheduler] Successfully executed entry for user ${strategy.user_id}`)
        } else {
          console.error(`[Scheduler] Entry failed for user ${strategy.user_id}:`, result.error)
        }
      }
    } catch (error) {
      console.error('[Scheduler] Entry execution error:', error)
    }
  })

  // Exit scheduler for Skyspear Short Strangle (3:00 PM IST next day)
  cron.schedule('0 15 * * *', async () => {
    console.log('[Scheduler] Exit time triggered for Short Strangle (3:00 PM IST)')
    try {
      if (!supabase) {
        console.error('[Scheduler] Supabase client not available')
        return
      }

      // Get all running execution runs for Short Strangle
      const { data: runningRuns } = await supabase
        .from('execution_runs')
        .select('*, strategy_configs!inner(strategy_name, fixed_timing)')
        .eq('status', 'running')
        .eq('strategy_configs.strategy_name', 'Short Strangle')
        .eq('strategy_configs.fixed_timing', true)

      if (!runningRuns || runningRuns.length === 0) {
        console.log('[Scheduler] No running Short Strangle positions to exit')
        return
      }

      for (const run of runningRuns) {
        const result = await executeShortStrangleExit(run.user_id, run.id)
        if (result.success) {
          console.log(`[Scheduler] Successfully exited position for run ${run.id}`)
        } else {
          console.error(`[Scheduler] Exit failed for run ${run.id}:`, result.error)
        }
      }
    } catch (error) {
      console.error('[Scheduler] Exit execution error:', error)
    }
  })

  // Monitoring scheduler for other strategies (2:30 PM - 3:25 PM)
  // Trailing SL monitoring (runs every 5 minutes during market hours)
  cron.schedule('*/5 9-15 * * *', async () => {
    await monitorTrailingSL()
  })

  // Market intelligence-driven execution (runs every hour during market hours)
  cron.schedule('0 9-15 * * *', async () => {
    console.log('[Scheduler] Market intelligence check for strategy suggestions')
    try {
      if (!supabase) return

      const marketIntel = await analyzeMarketIntelligence()
      if (!marketIntel.recommendations || marketIntel.recommendations.length === 0) return

      // Get users with auto-execute enabled
      const { data: users } = await supabase
        .from('strategy_configs')
        .select('user_id, strategy_name, auto_execute_enabled, allocated_capital')
        .eq('auto_execute_enabled', true)
        .eq('is_active', true)

      if (!users || users.length === 0) return

      // Check available capital and execute recommended strategies
      for (const user of users) {
        // Check if user has available capital for recommended strategies
        // TODO: Implement market intelligence-driven execution
        // This would check recommendations, verify capital, and execute
      }
    } catch (error) {
      console.error('[Scheduler] Market intelligence execution error:', error)
    }
  })

  cron.schedule('30 14 * * *', async () => {
    console.log('[Scheduler] Monitoring window started (2:30 PM IST) - Check for profit >= 0.5% exit')
    await monitorAndExitStrategies({ minProfitPct: 0.5 })
  })

  cron.schedule('15 15 * * *', async () => {
    console.log('[Scheduler] Late exit window started (3:15 PM IST) - Check for breakeven/0.3% loss exit')
    await monitorAndExitStrategies({ breakeven: true, maxLossPct: 0.3 })
  })

  cron.schedule('25 15 * * *', async () => {
    console.log('[Scheduler] Force exit time (3:25 PM IST) - Force exit all open positions')
    await forceExitAllStrategies()
  })

  schedulerEnabled = true
  console.log('[Scheduler] Cron jobs initialized successfully')
} catch (err) {
  console.warn('[Scheduler] node-cron not available, scheduler disabled:', err.message)
}

const port = process.env.PORT || 4000
app.listen(port, () => {
  console.log(`trading-worker listening on http://0.0.0.0:${port}`)
  console.log(`Scheduler: ${schedulerEnabled ? 'ENABLED' : 'DISABLED'}`)
})