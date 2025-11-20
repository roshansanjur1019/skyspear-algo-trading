import { AnimatedContainer, BgGradient, Hero, TextStagger } from "@/components/blocks/hero-animated";
import { Button } from "@/components/ui/button";
import { TrendingUp, Shield, Zap, ArrowRight, Globe } from "lucide-react";

interface HeroSectionProps {
  onGetStarted: () => void;
}

const HeroSection = ({ onGetStarted }: HeroSectionProps) => {
  return (
    <>
      <Hero className="space-y-6 px-6 py-12 text-foreground md:px-10 lg:px-12">
        <BgGradient gradientColors="teal" gradientSize="lg" />
        
        {/* Trust Badge */}
        <AnimatedContainer 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm mx-auto"
          transition={{ delay: 0.2 }}
        >
          <span className="text-sm">🚀</span>
          <span className="text-sm">📈</span>
          <span className="text-sm font-medium text-primary">AI-Powered Trading Platform</span>
        </AnimatedContainer>

        {/* Main Headline with Stagger Animation */}
        <TextStagger
          className="text-5xl font-bold tracking-tight md:text-6xl lg:text-7xl"
          text="Power and Simplicity In One"
          stagger={0.03}
        />
        
        <TextStagger
          className="text-5xl font-bold tracking-tight md:text-6xl lg:text-7xl bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent"
          text="Trading Platform"
          stagger={0.05}
        />

        {/* Subtitle */}
        <AnimatedContainer 
          className="mx-auto w-4/5 text-muted-foreground md:w-1/2 text-base md:text-lg"
          transition={{ delay: 0.4 }}
        >
          <p>
            A powerful dashboard to manage, track, and optimize your options trading in real-time. 
            Combining security, speed, and elegant simplicity with automated execution.
          </p>
        </AnimatedContainer>

        {/* CTA Buttons */}
        <AnimatedContainer
          className="flex items-center justify-center gap-4"
          transition={{ delay: 0.6 }}
        >
          <Button 
            size="lg" 
            onClick={onGetStarted}
            className="rounded-full bg-primary hover:bg-primary-glow text-primary-foreground shadow-[0_0_30px_hsl(var(--primary)/0.3)] hover:shadow-[0_0_50px_hsl(var(--primary)/0.5)] transition-all duration-300"
          >
            Get Started Free
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="rounded-full bg-transparent border-primary/30 hover:bg-primary/10 hover:border-primary/50"
          >
            <Globe className="mr-2 w-4 h-4" />
            View Demo
          </Button>
        </AnimatedContainer>
      </Hero>

      {/* Feature highlights below hero */}
      <div className="relative py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { icon: TrendingUp, title: "Daily Profits", desc: "Consistent returns with proven strategies" },
              { icon: Shield, title: "Risk Management", desc: "Advanced protection with automated stops" },
              { icon: Zap, title: "Real-time Execution", desc: "Lightning-fast order placement" }
            ].map((feature, idx) => (
              <div 
                key={idx}
                className="group relative p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_30px_hsl(var(--primary)/0.2)]"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <feature.icon className="w-8 h-8 text-primary mb-3 mx-auto group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-foreground mb-2 text-center">{feature.title}</h3>
                <p className="text-sm text-muted-foreground text-center">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default HeroSection;
