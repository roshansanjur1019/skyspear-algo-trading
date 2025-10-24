import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Target, Shield, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";

const StrategyExplanation = () => {
  const strategySteps = [
    {
      title: "Market Analysis",
      time: "3:00 PM",
      icon: <TrendingUp className="h-5 w-5" />,
      description: "Check NIFTY current price and VIX levels for volatility assessment",
      color: "text-primary"
    },
    {
      title: "Strike Selection", 
      time: "3:05 PM",
      icon: <Target className="h-5 w-5" />,
      description: "Select CE and PE strikes 150 points OTM with minimum ₹80 premium",
      color: "text-chart-3"
    },
    {
      title: "Trade Execution",
      time: "3:10 PM", 
      icon: <CheckCircle className="h-5 w-5" />,
      description: "Sell both options simultaneously through connected broker API",
      color: "text-profit"
    },
    {
      title: "Risk Monitoring",
      time: "Continuous",
      icon: <Shield className="h-5 w-5" />,
      description: "Monitor positions with adjustment triggers at 150+ point moves",
      color: "text-chart-4"
    },
    {
      title: "Profit Booking",
      time: "Target Hit",
      icon: <Clock className="h-5 w-5" />,
      description: "Exit at 1% profit or next day at 3:00 PM with trailing stop-loss",
      color: "text-profit"
    }
  ];

  const keyFeatures = [
    {
      title: "Minimum Premium Check",
      description: "Both strikes must have ≥₹80 premium, otherwise check next expiry",
      icon: <Target className="h-4 w-4" />
    },
    {
      title: "Volatility Adjustment",
      description: "Use 300-500 point gaps during high VIX periods (>20)",
      icon: <AlertTriangle className="h-4 w-4" />
    },
    {
      title: "Position Adjustment",
      description: "Convert losing strike to equivalent premium on 150+ point moves",
      icon: <Shield className="h-4 w-4" />
    },
    {
      title: "Automated Execution",
      description: "No manual intervention required - fully automated workflow",
      icon: <CheckCircle className="h-4 w-4" />
    }
  ];

  return (
    <section id="strategy" className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">How Our Platform Works</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Automated trading strategies that execute trades based on proven algorithms and real-time market data.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Strategy Flow */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-6 w-6 text-primary" />
                Daily Execution Flow
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {strategySteps.map((step, index) => (
                  <div key={index} className="flex items-start space-x-4 p-4 bg-background/50 rounded-lg border border-border/50">
                    <div className={`${step.color} bg-background p-2 rounded-full border border-border`}>
                      {step.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{step.title}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {step.time}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Key Features */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-profit" />
                Advanced Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {keyFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="bg-primary/10 p-2 rounded-full">
                      {feature.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{feature.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-4 bg-gradient-to-r from-profit/10 to-primary/10 rounded-lg border border-profit/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-profit" />
                  <h4 className="font-semibold text-profit">Historical Performance</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Backtested strategy shows consistent monthly returns with managed drawdowns 
                  during volatile market conditions.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Example Trade */}
        <Card className="max-w-4xl mx-auto shadow-card">
          <CardHeader>
            <CardTitle>Example Trade Scenario</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-r from-background to-muted/20 p-6 rounded-lg border border-border">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary mb-2">24750</div>
                  <div className="text-sm text-muted-foreground">NIFTY Price at 3:10 PM</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-profit mb-2">₹160</div>
                  <div className="text-sm text-muted-foreground">Total Premium Collected</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    24900 CE (₹85) + 24600 PE (₹75)
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-chart-3 mb-2">₹1.60</div>
                  <div className="text-sm text-muted-foreground">Target Profit (1%)</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Exit when combined premium = ₹158.40
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default StrategyExplanation;