// Multi-Source Market Data Integration
// Fetches data from US markets, news, gap analysis, etc.

const fetch = require('node-fetch')

/**
 * Get US market data (S&P 500, Dow Jones, NASDAQ)
 * Used to predict Indian market reaction
 */
async function getUSMarketData() {
  try {
    // Using Alpha Vantage free API (requires API key) or alternative free source
    // For now, using a free alternative: Yahoo Finance API (unofficial but free)
    const symbols = ['^GSPC', '^DJI', '^IXIC'] // S&P 500, Dow Jones, NASDAQ
    
    const usData = {}
    
    for (const symbol of symbols) {
      try {
        // Using yahoo finance API (free, no key required)
        const response = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`,
          { timeout: 5000 }
        )
        
        if (response.ok) {
          const data = await response.json()
          const result = data.chart?.result?.[0]
          if (result) {
            const meta = result.meta
            const previousClose = meta.previousClose
            const currentPrice = meta.regularMarketPrice
            const change = currentPrice - previousClose
            const changePercent = (change / previousClose) * 100

            usData[symbol] = {
              name: symbol === '^GSPC' ? 'S&P 500' : symbol === '^DJI' ? 'Dow Jones' : 'NASDAQ',
              price: currentPrice,
              change: parseFloat(change.toFixed(2)),
              changePercent: parseFloat(changePercent.toFixed(2)),
              timestamp: new Date().toISOString()
            }
          }
        }
      } catch (error) {
        console.warn(`[MarketData] Failed to fetch ${symbol}:`, error.message)
      }
    }

    return {
      success: Object.keys(usData).length > 0,
      data: usData,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('[MarketData] US market data error:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Analyze gap (overnight change)
 * Compares previous day close with current day open
 */
function analyzeGap(currentOpen, previousClose) {
  if (!previousClose || previousClose === 0) return null

  const gap = currentOpen - previousClose
  const gapPercent = (gap / previousClose) * 100

  return {
    gap: parseFloat(gap.toFixed(2)),
    gapPercent: parseFloat(gapPercent.toFixed(2)),
    type: gap > 0 ? 'gap_up' : gap < 0 ? 'gap_down' : 'no_gap',
    magnitude: Math.abs(gapPercent) < 0.3 ? 'small' : 
               Math.abs(gapPercent) < 0.8 ? 'medium' : 'large',
    interpretation: getGapInterpretation(gapPercent)
  }
}

/**
 * Get gap interpretation
 */
function getGapInterpretation(gapPercent) {
  const absGap = Math.abs(gapPercent)
  
  if (absGap < 0.3) {
    return 'Minimal gap - normal market opening'
  } else if (absGap < 0.8) {
    return gapPercent > 0 
      ? 'Moderate gap up - positive sentiment, may continue or fill'
      : 'Moderate gap down - negative sentiment, may continue or bounce'
  } else {
    return gapPercent > 0
      ? 'Large gap up - strong positive sentiment, watch for gap fill or continuation'
      : 'Large gap down - strong negative sentiment, watch for gap fill or further decline'
  }
}

/**
 * Get financial news headlines (free sources)
 * Using RSS feeds and free news APIs
 */
async function getMarketNews() {
  try {
    const newsSources = [
      // Economic Times RSS
      'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms',
      // MoneyControl RSS
      'https://www.moneycontrol.com/rss/marketreports.xml'
    ]

    const allNews = []

    for (const source of newsSources) {
      try {
        const response = await fetch(source, { timeout: 5000 })
        if (response.ok) {
          const text = await response.text()
          // Simple RSS parsing (for production, use proper RSS parser)
          const items = text.match(/<item>[\s\S]*?<\/item>/g) || []
          
          for (const item of items.slice(0, 5)) { // Top 5 from each source
            const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || 
                             item.match(/<title>(.*?)<\/title>/)
            const linkMatch = item.match(/<link>(.*?)<\/link>/)
            const pubDateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/)
            
            if (titleMatch) {
              allNews.push({
                title: titleMatch[1],
                link: linkMatch ? linkMatch[1] : null,
                pubDate: pubDateMatch ? pubDateMatch[1] : null,
                source: source.includes('economictimes') ? 'Economic Times' : 'MoneyControl'
              })
            }
          }
        }
      } catch (error) {
        console.warn(`[MarketData] Failed to fetch news from ${source}:`, error.message)
      }
    }

    return {
      success: allNews.length > 0,
      news: allNews.slice(0, 10), // Top 10 news items
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('[MarketData] News fetch error:', error.message)
    return { success: false, error: error.message, news: [] }
  }
}

/**
 * Predict Indian market reaction based on US market
 */
function predictIndianMarketReaction(usMarketData, currentIndianConditions) {
  const predictions = []

  // S&P 500 impact (most correlated with NIFTY)
  if (usMarketData['^GSPC']) {
    const sp500 = usMarketData['^GSPC']
    if (sp500.changePercent > 1) {
      predictions.push({
        source: 'S&P 500',
        impact: 'positive',
        strength: 'strong',
        reason: `S&P 500 up ${sp500.changePercent.toFixed(2)}% - Indian markets likely to open positive`
      })
    } else if (sp500.changePercent < -1) {
      predictions.push({
        source: 'S&P 500',
        impact: 'negative',
        strength: 'strong',
        reason: `S&P 500 down ${Math.abs(sp500.changePercent).toFixed(2)}% - Indian markets likely to open negative`
      })
    } else if (sp500.changePercent > 0.5) {
      predictions.push({
        source: 'S&P 500',
        impact: 'positive',
        strength: 'moderate',
        reason: `S&P 500 up ${sp500.changePercent.toFixed(2)}% - Mild positive impact expected`
      })
    } else if (sp500.changePercent < -0.5) {
      predictions.push({
        source: 'S&P 500',
        impact: 'negative',
        strength: 'moderate',
        reason: `S&P 500 down ${Math.abs(sp500.changePercent).toFixed(2)}% - Mild negative impact expected`
      })
    }
  }

  // Dow Jones impact
  if (usMarketData['^DJI']) {
    const dow = usMarketData['^DJI']
    if (Math.abs(dow.changePercent) > 1.5) {
      predictions.push({
        source: 'Dow Jones',
        impact: dow.changePercent > 0 ? 'positive' : 'negative',
        strength: 'moderate',
        reason: `Dow Jones ${dow.changePercent > 0 ? 'up' : 'down'} ${Math.abs(dow.changePercent).toFixed(2)}% - May influence Indian market sentiment`
      })
    }
  }

  return {
    predictions,
    overallSentiment: predictions.length > 0 
      ? predictions.filter(p => p.impact === 'positive').length > predictions.filter(p => p.impact === 'negative').length
        ? 'positive' : 'negative'
      : 'neutral',
    confidence: predictions.length > 0 ? 'medium' : 'low'
  }
}

/**
 * Detect major market events from news
 */
function detectEventsFromNews(news) {
  const events = []
  const keywords = {
    budget: ['budget', 'union budget', 'fiscal'],
    rbi: ['rbi', 'reserve bank', 'monetary policy', 'repo rate'],
    election: ['election', 'poll', 'voting', 'results'],
    gdp: ['gdp', 'growth', 'economy'],
    inflation: ['inflation', 'cpi', 'wpi'],
    fii: ['fii', 'foreign investment', 'fdi'],
    earnings: ['earnings', 'results', 'quarterly']
  }

  for (const item of news) {
    const title = item.title.toLowerCase()
    
    for (const [eventType, eventKeywords] of Object.entries(keywords)) {
      if (eventKeywords.some(keyword => title.includes(keyword))) {
        events.push({
          type: eventType,
          title: item.title,
          source: item.source,
          date: item.pubDate || new Date().toISOString()
        })
      }
    }
  }

  return events
}

module.exports = {
  getUSMarketData,
  analyzeGap,
  getMarketNews,
  predictIndianMarketReaction,
  detectEventsFromNews
}

