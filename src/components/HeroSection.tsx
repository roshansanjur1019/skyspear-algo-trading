import Hero from "@/components/ui/animated-shader-hero";
import { TrendingUp, Shield, Zap } from "lucide-react";

interface HeroSectionProps {
  onGetStarted: () => void;
}

const HeroSection = ({ onGetStarted }: HeroSectionProps) => {
  return (
    <>
      <Hero
        trustBadge={{
          text: "AI-Powered Trading Platform",
          icons: ["🚀", "📈"]
        }}
        headline={{
          line1: "Power and Simplicity",
          line2: "In One Trading Platform"
        }}
        subtitle="A powerful dashboard to manage, track, and optimize your options trading in real-time. Combining security, speed, and elegant simplicity with automated execution."
        buttons={{
          primary: {
            text: "Get Started for Free",
            onClick: onGetStarted
          },
          secondary: {
            text: "View Demo",
            onClick: () => console.log('View Demo clicked')
          }
        }}
      />

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
