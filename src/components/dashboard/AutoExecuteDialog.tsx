import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, TrendingUp, DollarSign, Shield, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  open: boolean;
  onClose: () => void;
  userId: string;
  strategyName?: string;
  onEnable?: (lotSize: number) => void;
}

export default function AutoExecuteDialog({ open, onClose, userId, strategyName = 'Short Strangle', onEnable }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [lotSize, setLotSize] = useState(1);
  const [consentGiven, setConsentGiven] = useState(false);
  const [enabling, setEnabling] = useState(false);
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    if (!open) {
      setResult(null);
      setLotSize(1);
      setConsentGiven(false);
      return;
    }
    
    const run = async () => {
      setLoading(true);
      try {
        // Fetch user's total capital from profile or broker account
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        const url = backendUrl ? `${backendUrl}/precheck` : '/precheck';
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId, 
            strategy: strategyName,
            capital: 500000 // TODO: Fetch from broker account or user profile
          }),
        });
        
        if (!res.ok) {
          throw new Error(`Precheck failed: ${res.statusText}`);
        }
        
        const data = await res.json();
        setResult(data);
        if (data.maxLots) {
          setLotSize(Math.min(1, data.maxLots));
        }
      } catch (error: any) {
        toast({
          title: "Pre-check Failed",
          description: error.message || "Unable to verify funds and market conditions",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [open, userId, strategyName, backendUrl, toast]);

  const handleLotChange = (newLot: number) => {
    if (!result) return;
    const maxLots = result.maxLots || 1;
    if (newLot >= 1 && newLot <= maxLots) {
      setLotSize(newLot);
    }
  };

  const handleEnable = async () => {
    if (!result || !consentGiven) return;
    
    setEnabling(true);
    try {
      // Update strategy config to enable auto-execute
      const { data: strategyConfig } = await supabase
        .from('strategy_configs')
        .select('id')
        .eq('user_id', userId)
        .eq('strategy_name', strategyName)
        .single();

      if (strategyConfig) {
        const { error } = await supabase
          .from('strategy_configs')
          .update({
            auto_execute_enabled: true,
            lot_size: lotSize,
            allocated_capital: result.requiredCapitalForLots || (result.requiredCapitalPerLot * lotSize),
            daily_loss_cap_absolute: result.dailyLossCap,
          })
          .eq('id', strategyConfig.id);

        if (error) throw error;
      }

      toast({
        title: "Auto-Execute Enabled",
        description: `${strategyName} will execute automatically at 3:10 PM with ${lotSize} lot(s)`,
      });

      if (onEnable) {
        onEnable(lotSize);
      }
      onClose();
    } catch (error: any) {
      toast({
        title: "Failed to Enable Auto-Execute",
        description: error.message || "Unable to save configuration",
        variant: "destructive",
      });
    } finally {
      setEnabling(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Enable Auto-Execute</DialogTitle>
          <DialogDescription>
            Configure automated execution for {strategyName}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-muted-foreground">Checking funds and market conditions...</span>
          </div>
        ) : result ? (
          <div className="space-y-6">
            {/* Market Conditions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-muted/50 border">
                <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  VIX
                </div>
                <div className="text-xl font-bold">{result.vix?.toFixed(2) || 'N/A'}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {result.marketConditions?.volatilityLevel || 'Normal'}
                </div>
              </div>
              
              <div className="p-4 rounded-lg bg-muted/50 border">
                <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Available Funds
                </div>
                <div className="text-xl font-bold">{formatCurrency(result.availableFunds || 0)}</div>
              </div>

              <div className="p-4 rounded-lg bg-muted/50 border">
                <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Strike Gap
                </div>
                <div className="text-xl font-bold">{result.strikeGap || 250} pts</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {result.vix > 20 ? 'High VIX' : result.vix < 15 ? 'Low VIX' : 'Normal'}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted/50 border">
                <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Entry Time
                </div>
                <div className="text-xl font-bold">3:10 PM</div>
                <div className="text-xs text-muted-foreground mt-1">Daily</div>
              </div>
            </div>

            {/* Lot Size Selector */}
            <div className="space-y-3">
              <Label htmlFor="lotSize">Number of Lots</Label>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleLotChange(lotSize - 1)}
                  disabled={lotSize <= 1 || !result.eligible}
                >
                  -
                </Button>
                <Input
                  id="lotSize"
                  type="number"
                  min={1}
                  max={result.maxLots || 1}
                  value={lotSize}
                  onChange={(e) => handleLotChange(parseInt(e.target.value) || 1)}
                  className="w-24 text-center text-lg font-bold"
                  disabled={!result.eligible}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleLotChange(lotSize + 1)}
                  disabled={lotSize >= (result.maxLots || 1) || !result.eligible}
                >
                  +
                </Button>
                <div className="flex-1 text-sm text-muted-foreground">
                  Max: {result.maxLots || 0} lots ({formatCurrency((result.requiredCapitalPerLot || 0) * (result.maxLots || 0))})
                </div>
              </div>
            </div>

            {/* Capital Summary */}
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Required Capital ({lotSize} lot{lotSize > 1 ? 's' : ''}):</span>
                  <span className="font-semibold">{formatCurrency((result.requiredCapitalPerLot || 0) * lotSize)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Available Funds:</span>
                  <span className="font-semibold">{formatCurrency(result.availableFunds || 0)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold border-t pt-2">
                  <span>Remaining Capital:</span>
                  <span className={result.availableFunds - ((result.requiredCapitalPerLot || 0) * lotSize) < 0 ? 'text-destructive' : 'text-profit'}>
                    {formatCurrency((result.availableFunds || 0) - ((result.requiredCapitalPerLot || 0) * lotSize))}
                  </span>
                </div>
              </div>
            </div>

            {/* Daily Loss Cap */}
            <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                <div className="flex-1">
                  <div className="font-semibold mb-1">Daily Loss Cap</div>
                  <div className="text-sm text-muted-foreground">
                    Maximum loss per day: <span className="font-semibold text-foreground">{formatCurrency(result.dailyLossCap || 0)}</span> (1% of total capital)
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Auto-execution will halt if daily loss cap is reached
                  </div>
                </div>
              </div>
            </div>

            {/* Eligibility Warning */}
            {!result.eligible && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {result.reason || 'Insufficient funds for the selected strategy'}
                </AlertDescription>
              </Alert>
            )}

            {/* Consent Checkbox */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30 border">
              <input
                type="checkbox"
                id="consent"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="mt-1"
                disabled={!result.eligible}
              />
              <Label htmlFor="consent" className="text-sm cursor-pointer">
                I understand and consent to:
                <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                  <li>Automated trade execution at 3:10 PM daily (entry) and 3:00 PM next day (exit)</li>
                  <li>Daily loss cap enforcement ({formatCurrency(result.dailyLossCap || 0)})</li>
                  <li>Trailing stop-loss activation at 1% profit (trail to cost) and 5% profit (trail to 3.5-4%)</li>
                  <li>Capital allocation of {formatCurrency((result.requiredCapitalPerLot || 0) * lotSize)} for this strategy</li>
                </ul>
              </Label>
            </div>
          </div>
        ) : (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>Unable to load pre-check data. Please try again.</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={enabling}>
            Cancel
          </Button>
          <Button
            onClick={handleEnable}
            disabled={!result?.eligible || !consentGiven || enabling || loading}
          >
            {enabling ? 'Enabling...' : 'Enable Auto-Execute'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}