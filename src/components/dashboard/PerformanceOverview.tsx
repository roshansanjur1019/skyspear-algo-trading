import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

interface PerformanceOverviewProps {
  userId: string;
}

const PerformanceOverview = ({ userId }: PerformanceOverviewProps) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPerformance();
  }, [userId]);

  const fetchPerformance = async () => {
    const { data, error } = await supabase
      .from("performance_metrics")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(30);

    if (!error && data && data.length > 0) {
      const totalPnl = data.reduce((sum, item) => sum + (item.total_pnl || 0), 0);
      const totalTrades = data.reduce((sum, item) => sum + (item.total_trades || 0), 0);
      const winningTrades = data.reduce((sum, item) => sum + (item.winning_trades || 0), 0);
      const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

      setMetrics({
        totalPnl,
        totalTrades,
        winRate,
        maxDrawdown: Math.min(...data.map(d => d.max_drawdown || 0)),
      });
    }
    setLoading(false);
  };

  if (loading) {
    return <div>Loading performance data...</div>;
  }

  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
          <CardDescription>No trading data available yet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Start trading to see your performance metrics
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>Total P&L</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${metrics.totalPnl >= 0 ? "text-profit" : "text-loss"}`}>
              ₹{metrics.totalPnl.toFixed(2)}
            </div>
            {metrics.totalPnl >= 0 ? (
              <TrendingUp className="h-4 w-4 text-profit mt-2" />
            ) : (
              <TrendingDown className="h-4 w-4 text-loss mt-2" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Trades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.totalTrades}</div>
            <p className="text-xs text-muted-foreground mt-2">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.winRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-2">Success rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Max Drawdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-loss">₹{Math.abs(metrics.maxDrawdown).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-2">Lowest point</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trade History</CardTitle>
          <CardDescription>Recent trading activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Detailed trade history coming soon
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceOverview;
