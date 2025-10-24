import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Play, Pause, Settings, TrendingUp, Shield } from "lucide-react";
import StrategyConfigForm from "./StrategyConfigForm";

interface StrategyManagerProps {
  userId: string;
}

const StrategyManager = ({ userId }: StrategyManagerProps) => {
  const { toast } = useToast();
  const [strategies, setStrategies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<any>(null);

  const predefinedStrategies = [
    {
      name: "Short Strangle",
      description: "Sell OTM Call and Put options with predefined strike selection",
      riskLevel: "Medium",
      icon: <TrendingUp className="h-5 w-5" />,
    },
    {
      name: "Iron Condor",
      description: "Limited risk strategy with defined profit zone",
      riskLevel: "Low",
      icon: <Shield className="h-5 w-5" />,
    },
    {
      name: "Bull Call Spread",
      description: "Directional strategy for bullish market outlook",
      riskLevel: "Medium",
      icon: <TrendingUp className="h-5 w-5" />,
    },
    {
      name: "Covered Call",
      description: "Generate income on existing holdings",
      riskLevel: "Low",
      icon: <Shield className="h-5 w-5" />,
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

  const handleAddStrategy = (strategyName: string) => {
    setEditingStrategy({ strategy_name: strategyName });
    setShowConfigForm(true);
  };

  if (loading) {
    return <div>Loading strategies...</div>;
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
      {/* Active Strategies */}
      <Card>
        <CardHeader>
          <CardTitle>Your Active Strategies</CardTitle>
          <CardDescription>Manage and monitor your automated trading strategies</CardDescription>
        </CardHeader>
        <CardContent>
          {strategies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No strategies configured. Choose from predefined strategies below.
            </div>
          ) : (
            <div className="space-y-4">
              {strategies.map((strategy) => (
                <div key={strategy.id} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <TrendingUp className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold">{strategy.strategy_name}</div>
                      <div className="text-sm text-muted-foreground">
                        Entry: {strategy.entry_time} • Exit: {strategy.exit_time}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
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
          )}
        </CardContent>
      </Card>

      {/* Predefined Strategies */}
      <Card>
        <CardHeader>
          <CardTitle>Predefined Strategies</CardTitle>
          <CardDescription>Choose from popular trading strategies used by professionals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {predefinedStrategies.map((strategy, index) => (
              <div key={index} className="p-4 rounded-lg border hover:border-primary/50 transition-colors">
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
                  Configure Strategy
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
