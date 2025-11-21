# AI-Powered Market Intelligence System

## Overview

The enhanced market intelligence system provides accurate market assessment and AI-powered strategy recommendations with automatic execution capabilities.

## Key Features

### 1. **Comprehensive Market Analysis**
- **Multiple Indicators**: VIX, NIFTY, BANKNIFTY, FINNIFTY spot prices
- **Technical Analysis**: Price position, momentum, volume, support/resistance levels
- **Trend Analysis**: Bullish, bearish, or sideways with strength indicators
- **Volatility Assessment**: 5-level volatility classification (very_low to very_high)

### 2. **AI-Powered Strategy Recommendations**
- **Weighted Scoring System**: Each strategy gets a score based on market conditions
- **Confidence Levels**: High, Medium, Low based on signal strength
- **Top 3 Recommendations**: Only the best strategies are recommended
- **Reasoning**: Human-readable explanations for each recommendation

### 3. **Smart Caching**
- **15-Minute Assessment Interval**: Optimal balance between accuracy and API rate limits
- **Automatic Cache Refresh**: Updates every 15 minutes during market hours
- **Reduced API Calls**: Prevents excessive requests to Angel One API

### 4. **Auto-Execution Logic**
- **Capital Verification**: Checks available funds before execution
- **Duplicate Prevention**: Avoids multiple executions of same strategy per day
- **Strategy Matching**: Only executes strategies user has configured
- **Confidence Filtering**: Only high-confidence recommendations are auto-executed

## Assessment Interval: 15 Minutes

**Why 15 minutes?**
- **5 minutes**: Too frequent, causes API rate limit issues and high CPU usage
- **15 minutes**: Optimal - captures market changes without overwhelming the system
- **1 hour**: Too slow, misses important market movements

The system runs assessments every 15 minutes during market hours (9 AM - 3:30 PM IST).

## Market Indicators Analyzed

### Primary Indicators
1. **VIX (Volatility Index)**
   - Very High (≥25): Strong premium collection opportunity
   - High (20-25): Good for selling strategies
   - Medium (15-20): Balanced market
   - Low (10-15): Potential breakout, good for buying
   - Very Low (<10): Strong buying opportunity

2. **NIFTY Trend**
   - Spot price, change, change percentage
   - Daily range (high/low)
   - Volume analysis

3. **BANKNIFTY Correlation**
   - Cross-validation with NIFTY trend
   - Sector-specific insights

### Technical Indicators
- **Price Position**: Where price is within daily range (0-100%)
- **Momentum**: Rate of price change
- **Support/Resistance**: Key price levels
- **Volume Indicator**: Trading volume analysis

## Strategy Recommendation Logic

### Scoring System
Each strategy receives points based on:
- **VIX Level**: Higher VIX = more points for selling strategies
- **Trend Direction**: Bullish trend = points for bullish strategies
- **Volatility**: High volatility = premium collection strategies
- **Technical Signals**: Support/resistance, momentum

### Strategy Categories

#### Premium Collection (Selling Strategies)
- **Short Strangle**: Best for high VIX (≥20), sideways markets
- **Iron Condor**: High VIX (≥18), range-bound markets
- **Short Straddle**: Very high VIX (≥22), neutral bias
- **Bull Put Spread**: High VIX (≥18), bullish trend

#### Directional (Buying Strategies)
- **Long Straddle**: Low VIX (<15), potential breakout
- **Bull Call Spread**: Low VIX (<15), bullish trend
- **Covered Call**: Any VIX, bullish trend

## Auto-Execution Flow

1. **Market Assessment** (Every 15 minutes)
   - Fetch market data
   - Calculate indicators
   - Generate recommendations

2. **User Matching**
   - Find users with auto-execute enabled
   - Match recommendations to user's configured strategies

3. **Capital Verification**
   - Check available funds
   - Verify capital allocation

4. **Execution**
   - Create execution run record
   - Execute strategy (if implementation available)
   - Monitor and manage positions

## API Endpoints

### Get Market Intelligence
```bash
POST /api/trading-worker/
{
  "action": "getMarketIntelligence"
}
```

**Response:**
```json
{
  "success": true,
  "conditions": {
    "vix": 18.5,
    "niftySpot": 24750.75,
    "trend": "sideways",
    "trendStrength": "moderate",
    "volatilityLevel": "medium",
    "technicalIndicators": { ... }
  },
  "recommendations": [
    {
      "strategy": "Short Strangle",
      "confidence": "high",
      "score": 65,
      "reason": "High VIX (18.5) provides excellent premium collection opportunity. Sideways market ideal for range-bound premium collection.",
      "priority": 1
    }
  ],
  "assessmentInterval": 15,
  "nextAssessment": "2025-11-21T10:15:00.000Z"
}
```

## Configuration

### Environment Variables
- `ANGEL_ONE_API_KEY`: Required for market data
- `ANGEL_ONE_CLIENT_ID`: Required for authentication
- `ANGEL_ONE_PASSWORD`: Required for authentication
- `ANGEL_ONE_TOTP_SECRET`: Required for TOTP generation

### Strategy Configuration
Users must:
1. Enable auto-execute for strategies
2. Configure capital allocation
3. Set strategy parameters (strike gap, premium thresholds, etc.)

## Future Enhancements

1. **Machine Learning**: Train models on historical data for better predictions
2. **Pattern Recognition**: Identify recurring market patterns
3. **Sentiment Analysis**: Incorporate news and social media sentiment
4. **Multi-Timeframe Analysis**: Analyze multiple timeframes (5min, 15min, 1hr, daily)
5. **Risk-Adjusted Scoring**: Factor in risk metrics for each strategy

## Monitoring

Check logs for:
- `[MarketIntel]` - Market intelligence updates
- `[Scheduler] Market intelligence assessment` - Scheduled assessments
- `[MarketIntel] Executing` - Strategy executions

## Performance

- **API Calls**: ~4 calls per 15 minutes (market data fetch)
- **CPU Usage**: Minimal (cached results reduce computation)
- **Accuracy**: High (multiple indicators + AI scoring)

