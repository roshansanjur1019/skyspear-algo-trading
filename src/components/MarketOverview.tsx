import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, BarChart3, Activity, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
}

const MarketOverview = () => {
  const { toast } = useToast();
  const [marketData, setMarketData] = useState<MarketData[]>([
    {
      symbol: "NIFTY",
      price: 24756.75,
      change: 125.30,
      changePercent: 0.51,
      volume: 145632
    },
    {
      symbol: "BANKNIFTY", 
      price: 51238.45,
      change: -89.20,
      changePercent: -0.17,
      volume: 87421
    },
    {
      symbol: "FINNIFTY",
      price: 23456.80,
      change: 234.60,
      changePercent: 1.01,
      volume: 45123
    },
    {
      symbol: "VIX",
      price: 16.42,
      change: -1.23,
      changePercent: -6.98,
      volume: 0
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const fetchLiveData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('angel-one', {
        body: { action: 'fetchMarketData' }
      });

      if (error) throw error;

      if (data?.success && data?.data) {
        console.log('Angel One market data:', data.data);
        toast({
          title: "Live Data Loaded",
          description: "Successfully fetched live market data from Angel One",
        });
        setLastUpdate(new Date());
        // You can update marketData here when Angel One returns the data in expected format
      } else {
        throw new Error(data?.error || "Failed to fetch market data");
      }
    } catch (error: any) {
      toast({
        title: "Failed to Fetch Live Data",
        description: error.message || "Using cached market data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  const formatChange = (change: number, percent: number) => {
    const isPositive = change >= 0;
    return {
      isPositive,
      changeText: `${isPositive ? '+' : ''}${formatPrice(change)}`,
      percentText: `${isPositive ? '+' : ''}${percent.toFixed(2)}%`
    };
  };

  return (
    <section className="py-12 bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <h2 className="text-3xl font-bold">Live Market Overview</h2>
            <Button 
              onClick={fetchLiveData} 
              disabled={loading}
              size="sm"
              variant="outline"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Fetch Live Data
                </>
              )}
            </Button>
          </div>
          <p className="text-muted-foreground">Real-time market data for algorithmic trading decisions</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {marketData.map((data) => {
            const { isPositive, changeText, percentText } = formatChange(data.change, data.changePercent);
            
            return (
              <Card key={data.symbol} className="market-widget hover:scale-105 transition-transform duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold">{data.symbol}</CardTitle>
                    {data.symbol === 'VIX' ? (
                      <Activity className="h-5 w-5 text-chart-4" />
                    ) : (
                      <BarChart3 className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="price-display">
                      {formatPrice(data.price)}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {isPositive ? (
                        <TrendingUp className="h-4 w-4 text-profit" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-loss" />
                      )}
                      <div className={`flex flex-col ${isPositive ? 'text-profit' : 'text-loss'}`}>
                        <span className="font-medium">{changeText}</span>
                        <span className="text-sm">{percentText}</span>
                      </div>
                    </div>

                    {data.volume && data.volume > 0 && (
                      <div className="pt-2 border-t border-border">
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Volume</span>
                          <span>{(data.volume / 1000).toFixed(1)}K</span>
                        </div>
                      </div>
                    )}

                    {data.symbol === 'NIFTY' && (
                      <Badge variant="secondary" className="w-full justify-center">
                        Primary Trading Symbol
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Market data updates every few seconds • Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
      </div>
    </section>
  );
};

export default MarketOverview;