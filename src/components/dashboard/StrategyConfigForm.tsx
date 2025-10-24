import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";

interface StrategyConfigFormProps {
  userId: string;
  strategy: any;
  onClose: () => void;
}

const StrategyConfigForm = ({ userId, strategy, onClose }: StrategyConfigFormProps) => {
  const { toast } = useToast();
  const [config, setConfig] = useState({
    strategy_name: strategy?.strategy_name || "Short Strangle",
    entry_time: strategy?.entry_time || "15:10:00",
    exit_time: strategy?.exit_time || "15:00:00",
    strike_gap_points: strategy?.strike_gap_points || 150,
    minimum_premium_threshold: strategy?.minimum_premium_threshold || 80,
    profit_booking_percentage: strategy?.profit_booking_percentage || 1,
    max_loss_per_trade: strategy?.max_loss_per_trade || 5000,
    volatility_threshold: strategy?.volatility_threshold || 20,
    high_volatility_gap: strategy?.high_volatility_gap || 300,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (strategy?.id) {
        // Update existing strategy
        const { error } = await supabase
          .from("strategy_configs")
          .update(config)
          .eq("id", strategy.id);

        if (error) throw error;

        toast({
          title: "Strategy Updated",
          description: "Your strategy configuration has been updated successfully.",
        });
      } else {
        // Create new strategy
        const { error } = await supabase
          .from("strategy_configs")
          .insert({
            ...config,
            user_id: userId,
            is_active: true,
          });

        if (error) throw error;

        toast({
          title: "Strategy Created",
          description: "Your strategy has been configured successfully.",
        });
      }

      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <CardTitle>Configure {config.strategy_name}</CardTitle>
            <CardDescription>Set parameters for your trading strategy</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="entry_time">Entry Time</Label>
              <Input
                id="entry_time"
                type="time"
                value={config.entry_time}
                onChange={(e) => setConfig({ ...config, entry_time: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="exit_time">Exit Time</Label>
              <Input
                id="exit_time"
                type="time"
                value={config.exit_time}
                onChange={(e) => setConfig({ ...config, exit_time: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="strike_gap_points">Strike Gap (Points)</Label>
              <Input
                id="strike_gap_points"
                type="number"
                value={config.strike_gap_points}
                onChange={(e) => setConfig({ ...config, strike_gap_points: parseInt(e.target.value) })}
              />
            </div>

            <div>
              <Label htmlFor="minimum_premium_threshold">Minimum Premium (₹)</Label>
              <Input
                id="minimum_premium_threshold"
                type="number"
                value={config.minimum_premium_threshold}
                onChange={(e) => setConfig({ ...config, minimum_premium_threshold: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <Label htmlFor="profit_booking_percentage">Profit Booking (%)</Label>
              <Input
                id="profit_booking_percentage"
                type="number"
                step="0.1"
                value={config.profit_booking_percentage}
                onChange={(e) => setConfig({ ...config, profit_booking_percentage: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <Label htmlFor="max_loss_per_trade">Max Loss Per Trade (₹)</Label>
              <Input
                id="max_loss_per_trade"
                type="number"
                value={config.max_loss_per_trade}
                onChange={(e) => setConfig({ ...config, max_loss_per_trade: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <Label htmlFor="volatility_threshold">Volatility Threshold (VIX)</Label>
              <Input
                id="volatility_threshold"
                type="number"
                value={config.volatility_threshold}
                onChange={(e) => setConfig({ ...config, volatility_threshold: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <Label htmlFor="high_volatility_gap">High Volatility Gap (Points)</Label>
              <Input
                id="high_volatility_gap"
                type="number"
                value={config.high_volatility_gap}
                onChange={(e) => setConfig({ ...config, high_volatility_gap: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="flex space-x-2">
            <Button type="submit">
              {strategy?.id ? "Update Strategy" : "Create Strategy"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default StrategyConfigForm;
