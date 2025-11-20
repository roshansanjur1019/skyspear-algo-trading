// Angel One SmartAPI SDK Wrapper
// This module provides a clean interface using the official smartapi-javascript SDK
// Reference: https://github.com/angel-one/smartapi-javascript

const { SmartAPI, WebSocket, WebSocketV2 } = require('smartapi-javascript')

/**
 * Create and authenticate SmartAPI client for a user
 * @param {Object} credentials - User's Angel One credentials
 * @param {string} credentials.apiKey - API Key
 * @param {string} credentials.clientId - Client ID (Client Code)
 * @param {string} credentials.password - Password (preferred, as per Angel One recommendation)
 * @param {string} credentials.mpin - MPIN (fallback if password not available)
 * @param {string} credentials.totpSecret - TOTP Secret (Base32)
 * @returns {Promise<Object>} - { success: boolean, client?: SmartAPI, token?: string, feedToken?: string, error?: string }
 */
async function createAuthenticatedClient(credentials) {
  try {
    const { apiKey, clientId, password, mpin, totpSecret } = credentials

    if (!apiKey || !clientId || !totpSecret) {
      return { success: false, error: 'Missing required credentials: apiKey, clientId, or totpSecret' }
    }

    // Use password if available, otherwise fallback to MPIN
    // Angel One recommends using password (loginByPassword) instead of MPIN (loginByMpin)
    const authPassword = password || mpin
    if (!authPassword) {
      return { success: false, error: 'Missing password or MPIN' }
    }

    // Create SmartAPI instance
    const smartApi = new SmartAPI({
      api_key: apiKey
    })

    // Generate TOTP
    const totp = generateTOTP(totpSecret)

    // Authenticate using generateSession
    // SDK's generateSession uses loginByPassword internally (recommended by Angel One)
    // If only MPIN is provided, it will still work but password is preferred
    const sessionData = await smartApi.generateSession(clientId, authPassword, totp)

    if (!sessionData || !sessionData.data) {
      return { success: false, error: 'Authentication failed: Invalid response' }
    }

    const { jwtToken, refreshToken, feedToken } = sessionData.data

    if (!jwtToken) {
      return { success: false, error: 'Authentication failed: No JWT token received' }
    }

    // Store tokens in the client instance
    smartApi.setAccessToken(jwtToken)
    smartApi.setRefreshToken(refreshToken)

    return {
      success: true,
      client: smartApi,
      token: jwtToken,
      feedToken: feedToken,
      refreshToken: refreshToken
    }
  } catch (error) {
    console.error('SmartAPI authentication error:', error)
    return {
      success: false,
      error: error.message || 'Authentication failed'
    }
  }
}

/**
 * Generate TOTP from Base32 secret (Node.js compatible)
 * @param {string} secret - Base32 encoded TOTP secret
 * @returns {string} - 6-digit TOTP code
 */
function generateTOTP(secret) {
  const crypto = require('crypto')

  try {
    // Base32 decode (RFC 4648)
    function base32ToBytes(base32) {
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

    // Decode base32 secret
    const key = base32ToBytes(secret)

    // Get current time step (30 seconds)
    const timeStep = Math.floor(Date.now() / 1000 / 30)

    // Create time buffer (8 bytes, big-endian)
    const timeBuffer = Buffer.allocUnsafe(8)
    timeBuffer.writeUInt32BE(timeStep, 4)

    // Calculate HMAC-SHA1 using Node.js crypto
    const hmac = crypto.createHmac('sha1', key)
    hmac.update(timeBuffer)
    const hash = hmac.digest()

    // Dynamic truncation
    const offset = hash[hash.length - 1] & 0x0f
    const code = ((hash[offset] & 0x7f) << 24) |
                 ((hash[offset + 1] & 0xff) << 16) |
                 ((hash[offset + 2] & 0xff) << 8) |
                 (hash[offset + 3] & 0xff)

    // Return 6-digit code
    return String(code % 1000000).padStart(6, '0')
  } catch (error) {
    console.error('TOTP generation error:', error)
    throw new Error('Failed to generate TOTP')
  }
}

/**
 * Get market data using SmartAPI SDK
 * @param {SmartAPI} client - Authenticated SmartAPI client
 * @param {Object} options - Market data options
 * @param {string} options.mode - 'LTP', 'OHLC', or 'FULL'
 * @param {Object} options.exchangeTokens - { NSE: ['token1', 'token2'], NFO: ['token3'] }
 * @returns {Promise<Object>} - Market data response
 */
async function getMarketData(client, options) {
  try {
    const { mode = 'LTP', exchangeTokens } = options

    // SmartAPI SDK method - check available methods
    let response
    
    try {
      // Try getMarketData method (most common)
      if (typeof client.getMarketData === 'function') {
        response = await client.getMarketData(exchangeTokens, mode)
      } 
      // Try quote method (alternative name)
      else if (typeof client.quote === 'function') {
        response = await client.quote(exchangeTokens, mode)
      }
      // Try getQuote method
      else if (typeof client.getQuote === 'function') {
        response = await client.getQuote(exchangeTokens, mode)
      }
      else {
        // Log available methods for debugging
        console.error('[SDK] Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(client)))
        throw new Error('SDK does not have getMarketData, quote, or getQuote method')
      }
    } catch (sdkError) {
      console.error('[SDK] Method call error:', sdkError.message)
      throw sdkError
    }

    // SDK returns: { status: true, message: 'SUCCESS', data: { fetched: [...], unfetched: [...] } }
    if (response && response.status !== false) {
      return {
        success: true,
        data: response.data || { fetched: [], unfetched: [] }
      }
    }

    return {
      success: false,
      error: response?.message || 'Failed to fetch market data',
      data: { fetched: [], unfetched: [] }
    }
  } catch (error) {
    console.error('[SDK] Market data fetch error:', error.message || error)
    return {
      success: false,
      error: error.message || 'Failed to fetch market data',
      data: { fetched: [], unfetched: [] }
    }
  }
}

/**
 * Get broker funds using SmartAPI SDK
 * @param {SmartAPI} client - Authenticated SmartAPI client
 * @returns {Promise<Object>} - { success: boolean, availableFunds?: number, error?: string }
 */
async function getBrokerFunds(client) {
  try {
    // SmartAPI SDK provides getRMS() method for funds
    const rmsData = await client.getRMS()

    if (rmsData && rmsData.data) {
      // Extract available funds from RMS data
      // The structure may vary, adjust based on actual response
      const availableFunds = rmsData.data.availablecash || rmsData.data.available || 0

      return {
        success: true,
        availableFunds: parseFloat(availableFunds) || 0,
        rmsData: rmsData.data
      }
    }

    return {
      success: false,
      error: 'Invalid RMS response'
    }
  } catch (error) {
    console.error('Broker funds fetch error:', error)
    return {
      success: false,
      error: error.message || 'Failed to fetch broker funds'
    }
  }
}

/**
 * Place order using SmartAPI SDK with LIMIT/MARKET fallback
 * @param {SmartAPI} client - Authenticated SmartAPI client
 * @param {Object} orderParams - Order parameters
 * @returns {Promise<Object>} - { success: boolean, orderId?: string, orderType?: string, data?: Object, error?: string }
 */
async function placeOrder(client, orderParams) {
  try {
    // Try LIMIT order first if price is provided
    if (orderParams.ordertype === 'LIMIT' && orderParams.price) {
      const limitOrder = {
        ...orderParams,
        ordertype: 'LIMIT',
        price: orderParams.price || orderParams.ltp || 0
      }

      try {
        const response = await client.placeOrder(limitOrder)

        if (response && response.data && response.data.orderid) {
          return {
            success: true,
            orderId: response.data.orderid,
            orderType: 'LIMIT',
            data: response.data
          }
        }
      } catch (limitError) {
        // If LIMIT fails, try MARKET order
        console.log('[Order] LIMIT order failed, trying MARKET:', limitError.message)
      }
    }

    // Try MARKET order (either as fallback or if explicitly requested)
    const marketOrder = {
      ...orderParams,
      ordertype: 'MARKET'
    }
    delete marketOrder.price // Remove price for MARKET orders

    const response = await client.placeOrder(marketOrder)

    if (response && response.data && response.data.orderid) {
      return {
        success: true,
        orderId: response.data.orderid,
        orderType: 'MARKET',
        data: response.data
      }
    }

    return {
      success: false,
      error: response.message || 'Order placement failed'
    }
  } catch (error) {
    console.error('Order placement error:', error)
    return {
      success: false,
      error: error.message || 'Failed to place order'
    }
  }
}

/**
 * Cancel order using SmartAPI SDK
 * @param {SmartAPI} client - Authenticated SmartAPI client
 * @param {string} orderId - Order ID to cancel
 * @param {string} variety - Order variety (NORMAL, AMO, etc.)
 * @returns {Promise<Object>} - { success: boolean, error?: string }
 */
async function cancelOrder(client, orderId, variety = 'NORMAL') {
  try {
    const response = await client.cancelOrder({
      variety: variety,
      orderid: orderId
    })

    return {
      success: response.status === true,
      error: response.status === false ? (response.message || 'Cancel failed') : null
    }
  } catch (error) {
    console.error('Order cancellation error:', error)
    return {
      success: false,
      error: error.message || 'Failed to cancel order'
    }
  }
}

/**
 * Get order book using SmartAPI SDK
 * @param {SmartAPI} client - Authenticated SmartAPI client
 * @returns {Promise<Object>} - Order book data
 */
async function getOrderBook(client) {
  try {
    const response = await client.getOrderBook()
    return {
      success: true,
      data: response
    }
  } catch (error) {
    console.error('Order book fetch error:', error)
    return {
      success: false,
      error: error.message || 'Failed to fetch order book'
    }
  }
}

/**
 * Get trade book using SmartAPI SDK
 * @param {SmartAPI} client - Authenticated SmartAPI client
 * @returns {Promise<Object>} - Trade book data
 */
async function getTradeBook(client) {
  try {
    const response = await client.getTradeBook()
    return {
      success: true,
      data: response
    }
  } catch (error) {
    console.error('Trade book fetch error:', error)
    return {
      success: false,
      error: error.message || 'Failed to fetch trade book'
    }
  }
}

/**
 * Get option chain (not in SDK, using direct API call with SDK token)
 * @param {SmartAPI} client - Authenticated SmartAPI client
 * @param {string} symbol - Symbol (e.g., 'NIFTY')
 * @param {string} expiryDate - Expiry date (YYYY-MM-DD)
 * @returns {Promise<Object>} - Option chain data
 */
async function getOptionChain(client, symbol, expiryDate) {
  try {
    const fetch = require('node-fetch')
    const token = client.getAccessToken()
    const apiKey = client.api_key

    if (!token || !apiKey) {
      return { success: false, error: 'Missing token or API key' }
    }

    const response = await fetch(
      'https://apiconnect.angelbroking.com/rest/secure/angelbroking/market/v1/getOptionChain',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-UserType': 'USER',
          'X-SourceID': 'WEB',
          'X-PrivateKey': apiKey
        },
        body: JSON.stringify({
          exchseg: 'NFO',
          symbol: symbol,
          expirydate: expiryDate
        })
      }
    )

    const data = await response.json()
    return { success: data?.status === true, data }
  } catch (error) {
    console.error('Get option chain error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Create WebSocket connection for order updates
 * @param {Object} params - WebSocket parameters
 * @param {string} params.clientCode - Client code
 * @param {string} params.feedToken - Feed token from authentication
 * @param {Function} onTick - Callback for tick data
 * @returns {Promise<WebSocket>} - WebSocket instance
 */
async function createOrderWebSocket(params, onTick) {
  try {
    const { clientCode, feedToken } = params

    const webSocket = new WebSocket({
      client_code: clientCode,
      feed_token: feedToken
    })

    webSocket.on('tick', onTick)

    await webSocket.connect()

    return webSocket
  } catch (error) {
    console.error('WebSocket creation error:', error)
    throw error
  }
}

/**
 * Refresh JWT token using refresh token (as per Angel One documentation)
 * @param {SmartAPI} client - Authenticated SmartAPI client
 * @returns {Promise<Object>} - { success: boolean, token?: string, refreshToken?: string, feedToken?: string, error?: string }
 */
async function refreshToken(client) {
  try {
    const refreshToken = client.getRefreshToken()
    if (!refreshToken) {
      return { success: false, error: 'No refresh token available' }
    }

    // SDK's refreshToken method should handle this
    const response = await client.refreshToken()

    if (response && response.data) {
      const { jwtToken, refreshToken: newRefreshToken, feedToken } = response.data

      // Update tokens in client
      client.setAccessToken(jwtToken)
      client.setRefreshToken(newRefreshToken)

      return {
        success: true,
        token: jwtToken,
        refreshToken: newRefreshToken,
        feedToken: feedToken
      }
    }

    return { success: false, error: 'Token refresh failed' }
  } catch (error) {
    console.error('Token refresh error:', error)
    return {
      success: false,
      error: error.message || 'Failed to refresh token'
    }
  }
}

/**
 * Logout from Angel One (as per Angel One best practice - logout daily)
 * @param {SmartAPI} client - Authenticated SmartAPI client
 * @param {string} clientCode - Client code
 * @returns {Promise<Object>} - { success: boolean, error?: string }
 */
async function logout(client, clientCode) {
  try {
    // SDK's logout method should handle this
    const response = await client.logout(clientCode)

    return {
      success: response?.status === true,
      error: response?.status === false ? (response?.message || 'Logout failed') : null
    }
  } catch (error) {
    console.error('Logout error:', error)
    return {
      success: false,
      error: error.message || 'Failed to logout'
    }
  }
}

module.exports = {
  createAuthenticatedClient,
  getMarketData,
  getBrokerFunds,
  placeOrder,
  cancelOrder,
  getOrderBook,
  getTradeBook,
  getOptionChain,
  createOrderWebSocket,
  generateTOTP,
  refreshToken,
  logout
}

