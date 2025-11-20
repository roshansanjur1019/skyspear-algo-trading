import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Clock, DollarSign, TrendingUp, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AutoExecuteBannerProps {
  userId: string;
}

export default function AutoExecuteBanner({ userId }: AutoExecuteBannerProps) {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        // Fetch active auto-execute strategies
        const { data: strategies } = await supabase
          .from('strategy_configs')
          .select('*')
          .eq('user_id', userId)
          .eq('auto_execute_enabled', true)
          .eq('is_active', true);

        if (!strategies || strategies.length === 0) {
          setStatus({ hasActive: false });
          setLoading(false);
          return;
        }

        // Get latest execution run
        const { data: latestRun } = await supabase
          .from('execution_runs')
          .select('*')
          .eq('user_id', userId)
          .order('date', { ascending: false })
          .limit(1)
          .single();

        // Run precheck for status
        const url = backendUrl ? `${backendUrl}/precheck` : '/precheck';
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, strategy: 'Short Strangle' }),
        });

        const precheckData = res.ok ? await res.json() : null;

        setStatus({
          hasActive: true,
          strategies,
          latestRun,
          precheck: precheckData,
        });
      } catch (error) {
        console.error('Error fetching auto-execute status:', error);
        setStatus({ hasActive: false, error: true });
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [userId, backendUrl]);

  if (loading) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm">Loading auto-execute status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status?.hasActive) {
    return (
      <Card className="border-muted">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-semibold">Auto-Execute Not Active</div>
                <div className="text-sm text-muted-foreground">
                  Enable auto-execute on a strategy to see status here
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const primaryStrategy = status.strategies?.find((s: any) => s.strategy_name === 'Short Strangle') || status.strategies?.[0];
  const isEligible = status.precheck?.eligible;
  const nextEntryTime = new Date();
  nextEntryTime.setHours(15, 10, 0, 0);
  if (nextEntryTime < new Date()) {
    nextEntryTime.setDate(nextEntryTime.getDate() + 1);
  }

  return (
    <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              {isEligible ? (
                <CheckCircle2 className="h-5 w-5 text-profit" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-warning" />
              )}
              <div className="font-semibold text-lg">
                Auto-Execute Status: {primaryStrategy?.strategy_name || 'Active Strategy'}
              </div>
              <Badge variant={isEligible ? "default" : "secondary"}>
                {isEligible ? "Eligible" : "Not Eligible"}
              </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">Next Entry</div>
                  <div className="text-sm font-semibold">
                    {nextEntryTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">Required Capital</div>
                  <div className="text-sm font-semibold">
                    ₹{((status.precheck?.requiredCapitalPerLot || 0) * (primaryStrategy?.lot_size || 1)).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">VIX</div>
                  <div className="text-sm font-semibold">
                    {status.precheck?.vix?.toFixed(2) || 'N/A'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">Daily Loss Cap</div>
                  <div className="text-sm font-semibold">
                    ₹{(status.precheck?.dailyLossCap || 0).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>

            {status.latestRun && (
              <div className="text-xs text-muted-foreground">
                Last execution: {new Date(status.latestRun.date).toLocaleDateString('en-IN')} - 
                Status: <Badge variant="outline" className="ml-1">{status.latestRun.status}</Badge>
              </div>
            )}

            {!isEligible && status.precheck?.reason && (
              <Alert variant="destructive" className="mt-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  {status.precheck.reason}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

