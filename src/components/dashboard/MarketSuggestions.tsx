import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity, AlertCircle } from "lucide-react";

interface MarketSuggestionsProps {
  userId: string;
}

const MarketSuggestions = ({ userId }: MarketSuggestionsProps) => {
  const [marketCondition, setMarketCondition] = useState<string>("Neutral");
  const [vix, setVix] = useState<number>(15.2);
  const [trend, setTrend] = useState<string>("Sideways");
  
  // Fetch real market intelligence
  useEffect(() => {
    const fetchMarketIntelligence = async () => {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL;
        if (backendUrl) {
          const res = await fetch(`${backendUrl}/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'getMarketIntelligence' }),
          });
          
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.conditions) {
              setVix(data.conditions.vix || 15);
              setMarketCondition(
                data.conditions.volatilityLevel === 'high' ? 'High Volatility' :
                data.conditions.volatilityLevel === 'low' ? 'Low Volatility' : 'Moderate'
              );
              setTrend(
                data.conditions.trend === 'volatile' ? 'Trending' :
                data.conditions.trend === 'stable' ? 'Sideways' : 'Choppy'
              );
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch market intelligence:', error);
      }
    };

    fetchMarketIntelligence();
    const interval = setInterval(fetchMarketIntelligence, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const getSuggestedStrategy = () => {
    // Use market intelligence-based recommendations
    if (vix < 15) {
      return {
        name: "Long Straddle",
        reason: "Low VIX, potential breakout - buying strategies favored",
        confidence: "Medium",
        icon: <TrendingUp className="h-4 w-4" />,
      };
    } else if (vix < 20) {
      return {
        name: "Short Strangle",
        reason: "Normal volatility, range-bound - premium collection ideal",
        confidence: "Medium",
        icon: <TrendingDown className="h-4 w-4" />,
      };
    } else {
      return {
        name: "Iron Condor",
        reason: "High VIX favors premium collection with limited risk",
        confidence: "High",
        icon: <Activity className="h-4 w-4" />,
      };
    }
  };

  const suggestion = getSuggestedStrategy();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Market Intelligence
        </CardTitle>
        <CardDescription>Real-time analysis and strategy recommendations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Market Metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-xs text-muted-foreground mb-1">VIX</div>
            <div className="text-lg font-bold">{vix}</div>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-xs text-muted-foreground mb-1">Condition</div>
            <div className="text-sm font-semibold">{marketCondition}</div>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-xs text-muted-foreground mb-1">Trend</div>
            <div className="text-sm font-semibold">{trend}</div>
          </div>
        </div>

        {/* AI Suggestion */}
        <div className="p-4 rounded-lg border-2 border-primary/30 bg-primary/5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/20 mt-1">
              {suggestion.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold">Recommended: {suggestion.name}</span>
                <Badge variant="outline" className="text-xs">
                  {suggestion.confidence} Confidence
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{suggestion.reason}</p>
            </div>
          </div>
        </div>

        {/* Capital Check Notice */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30">
          <AlertCircle className="h-4 w-4 text-warning mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Strategy deployment considers your available broker capital and margin requirements
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketSuggestions;
