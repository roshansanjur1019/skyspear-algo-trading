import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Play, Pause, Settings, TrendingUp, Shield, TrendingDown, Sparkles, Zap } from "lucide-react";
import StrategyConfigForm from "./StrategyConfigForm";
import MarketSuggestions from "./MarketSuggestions";
import AutoExecuteDialog from "./AutoExecuteDialog";
import AutoExecuteBanner from "./AutoExecuteBanner";

interface StrategyManagerProps {
  userId: string;
}

const StrategyManager = ({ userId }: StrategyManagerProps) => {
  const { toast } = useToast();
  const [strategies, setStrategies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<any>(null);
  const [autoExecuteEnabled, setAutoExecuteEnabled] = useState(false);
  const [showAutoDialog, setShowAutoDialog] = useState(false);

  const optionSellingStrategies = [
    {
      name: "Short Strangle",
      description: "Skyspear's flagship strategy - Automated execution at 3:10 PM daily",
      riskLevel: "Medium",
      icon: <Sparkles className="h-5 w-5" />,
      featured: true,
      fixedTiming: true,
    },
    {
      name: "Iron Condor",
      description: "Limited risk strategy with defined profit zone",
      riskLevel: "Low",
      icon: <Shield className="h-5 w-5" />,
      featured: false,
    },
    {
      name: "Short Straddle",
      description: "Sell ATM Call and Put for higher premium collection",
      riskLevel: "High",
      icon: <TrendingDown className="h-5 w-5" />,
      featured: false,
    },
    {
      name: "Covered Call",
      description: "Generate income on existing holdings",
      riskLevel: "Low",
      icon: <Shield className="h-5 w-5" />,
      featured: false,
    },
  ];

  const optionBuyingStrategies = [
    {
      name: "Bull Call Spread",
      description: "Directional strategy for bullish market outlook",
      riskLevel: "Medium",
      icon: <TrendingUp className="h-5 w-5" />,
      featured: false,
    },
    {
      name: "Long Straddle",
      description: "Buy ATM options for high volatility plays",
      riskLevel: "High",
      icon: <Zap className="h-5 w-5" />,
      featured: false,
    },
    {
      name: "Bull Put Spread",
      description: "Limited risk bullish strategy with credit received",
      riskLevel: "Medium",
      icon: <TrendingUp className="h-5 w-5" />,
      featured: false,
    },
  ];

  useEffect(() => {
    fetchStrategies();
  }, [userId]);

  const fetchStrategies = async () => {
    const { data, error } = await supabase
      .from("strategy_configs")
      .select("*")
      .eq("user_id", userId);

    if (!error && data) {
      setStrategies(data);
    }
    setLoading(false);
  };

  const handleToggleStrategy = async (strategyId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("strategy_configs")
        .update({ is_active: !currentStatus })
        .eq("id", strategyId);

      if (error) throw error;

      toast({
        title: currentStatus ? "Strategy Paused" : "Strategy Activated",
        description: `Strategy has been ${currentStatus ? "paused" : "activated"} successfully.`,
      });

      fetchStrategies();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAddStrategy = (strategyName: string, fixedTiming?: boolean) => {
    const strategyData: any = { strategy_name: strategyName };
    if (fixedTiming) {
      strategyData.entry_time = "15:10:00";
      strategyData.exit_time = "15:00:00";
      strategyData.fixed_timing = true;
    }
    setEditingStrategy(strategyData);
    setShowConfigForm(true);
  };

  const handleAutoExecuteToggle = async (enabled: boolean) => {
    if (enabled) {
      setShowAutoDialog(true);
    } else {
      // Disable auto-execute
      try {
        const { data: strategyConfig } = await supabase
          .from('strategy_configs')
          .select('id')
          .eq('user_id', userId)
          .eq('strategy_name', 'Short Strangle')
          .single();

        if (strategyConfig) {
          const { error } = await supabase
            .from('strategy_configs')
            .update({ auto_execute_enabled: false })
            .eq('id', strategyConfig.id);

          if (error) throw error;
        }

        setAutoExecuteEnabled(false);
        toast({
          title: "Auto-Execution Disabled",
          description: "Auto-execution has been disabled",
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to disable auto-execute",
          variant: "destructive",
        });
      }
    }
  };

  const handleAutoExecuteEnabled = (lotSize: number) => {
    setAutoExecuteEnabled(true);
    fetchStrategies(); // Refresh to show updated status
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }

  if (showConfigForm) {
    return (
      <StrategyConfigForm
        userId={userId}
        strategy={editingStrategy}
        onClose={() => {
          setShowConfigForm(false);
          setEditingStrategy(null);
          fetchStrategies();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Auto-Execute Status Banner */}
      <AutoExecuteBanner userId={userId} />

      {/* Market Intelligence & Auto-Execute */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MarketSuggestions userId={userId} />
        </div>
        
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Auto-Execute
            </CardTitle>
            <CardDescription>
              Let AI choose the best strategy based on market conditions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Enable Auto-Execution</span>
              <Switch 
                checked={autoExecuteEnabled}
                onCheckedChange={handleAutoExecuteToggle}
              />
            </div>
            {autoExecuteEnabled && (
              <div className="text-xs text-muted-foreground p-3 rounded-lg bg-background/50">
                System will analyze market volatility, trend, and your available capital to automatically deploy the optimal strategy.
              </div>
            )}
          </CardContent>
        </Card>
        <AutoExecuteDialog 
          open={showAutoDialog} 
          onClose={() => setShowAutoDialog(false)} 
          userId={userId}
          strategyName="Short Strangle"
          onEnable={handleAutoExecuteEnabled}
        />
      </div>

      {/* Featured Strategy - Skyspear Short Strangle */}
      <Card className="border-2 border-primary/50 bg-gradient-to-br from-primary/5 via-background to-background shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/20">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  Skyspear Short Strangle
                  <Badge className="bg-primary text-primary-foreground">Featured</Badge>
                </CardTitle>
                <CardDescription>Our flagship automated options selling strategy</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-background/50 border">
              <div className="text-sm text-muted-foreground mb-1">Entry Time</div>
              <div className="text-lg font-bold">3:10 PM Daily</div>
            </div>
            <div className="p-4 rounded-lg bg-background/50 border">
              <div className="text-sm text-muted-foreground mb-1">Exit Time</div>
              <div className="text-lg font-bold">3:00 PM Next Day</div>
            </div>
            <div className="p-4 rounded-lg bg-background/50 border">
              <div className="text-sm text-muted-foreground mb-1">Risk Level</div>
              <div className="text-lg font-bold text-warning">Medium</div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Fully automated execution at market close with predefined exit parameters. System handles strike selection, premium collection, and exit management.
          </p>
          <Button 
            size="lg" 
            className="w-full"
            onClick={() => handleAddStrategy("Short Strangle", true)}
          >
            <Plus className="h-5 w-5 mr-2" />
            Deploy Skyspear Strategy
          </Button>
        </CardContent>
      </Card>

      {/* Active Strategies */}
      {strategies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Active Strategies</CardTitle>
            <CardDescription>Monitor and manage deployed strategies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {strategies.map((strategy) => (
                <div key={strategy.id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold">{strategy.strategy_name}</div>
                      <div className="text-sm text-muted-foreground">
                        Entry: {strategy.entry_time} • Exit: {strategy.exit_time}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {strategy.is_active ? (
                      <Badge className="bg-profit/10 text-profit border-profit/20">Active</Badge>
                    ) : (
                      <Badge variant="outline">Paused</Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStrategy(strategy.id, strategy.is_active)}
                    >
                      {strategy.is_active ? (
                        <>
                          <Pause className="h-4 w-4 mr-1" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-1" />
                          Activate
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingStrategy(strategy);
                        setShowConfigForm(true);
                      }}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Option Selling Strategies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Option Selling Strategies
          </CardTitle>
          <CardDescription>Premium collection strategies for range-bound markets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {optionSellingStrategies.filter(s => !s.featured).map((strategy, index) => (
              <div key={index} className="p-4 rounded-lg border hover:border-primary/50 transition-all hover:shadow-md">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    {strategy.icon}
                  </div>
                  <Badge variant="outline">{strategy.riskLevel} Risk</Badge>
                </div>
                <h3 className="font-semibold mb-2">{strategy.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{strategy.description}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleAddStrategy(strategy.name)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Configure
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Option Buying Strategies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Option Buying Strategies
          </CardTitle>
          <CardDescription>Directional strategies for trending markets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {optionBuyingStrategies.map((strategy, index) => (
              <div key={index} className="p-4 rounded-lg border hover:border-primary/50 transition-all hover:shadow-md">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    {strategy.icon}
                  </div>
                  <Badge variant="outline">{strategy.riskLevel} Risk</Badge>
                </div>
                <h3 className="font-semibold mb-2">{strategy.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{strategy.description}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleAddStrategy(strategy.name)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Configure
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StrategyManager;
