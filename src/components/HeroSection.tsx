import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, Shield, Zap } from "lucide-react";
import heroImage from "@/assets/hero-trading.jpg";

interface HeroSectionProps {
  onGetStarted: () => void;
}

const HeroSection = ({ onGetStarted }: HeroSectionProps) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="Professional trading platform"
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/70" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-primary/10 p-3 rounded-full shadow-primary">
              <TrendingUp className="h-12 w-12 text-primary" />
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Automated Options Trading <br />
            <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Made Simple
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            Professional algo trading platform for executing automated strategies 
            with intelligent risk management and real-time market execution.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg" 
              variant="primary"
              onClick={onGetStarted}
              className="text-lg px-8 py-6 shadow-primary hover:shadow-primary/60 transition-all duration-300"
            >
              Start Trading Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-8 py-6 border-primary/30 hover:border-primary transition-all duration-300"
            >
              View Demo
            </Button>
          </div>

          {/* Key features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="flex flex-col items-center text-center p-6 bg-card/50 rounded-lg backdrop-blur-sm border border-border/50">
              <div className="bg-profit/10 p-3 rounded-full mb-4">
                <TrendingUp className="h-8 w-8 text-profit" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Daily Profits</h3>
              <p className="text-muted-foreground">
                Automated short strangle strategy executed at 3:10 PM daily with proven profit booking logic
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 bg-card/50 rounded-lg backdrop-blur-sm border border-border/50">
              <div className="bg-primary/10 p-3 rounded-full mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Risk Management</h3>
              <p className="text-muted-foreground">
                Advanced adjustment logic and stop-loss mechanisms to protect your capital in volatile markets
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 bg-card/50 rounded-lg backdrop-blur-sm border border-border/50">
              <div className="bg-chart-3/10 p-3 rounded-full mb-4">
                <Zap className="h-8 w-8 text-chart-3" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-time Execution</h3>
              <p className="text-muted-foreground">
                Connect with Zerodha & Angel One for instant order execution with live market data integration
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;