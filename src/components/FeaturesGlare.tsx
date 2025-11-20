import { GlareCard } from "@/components/ui/glare-card";
import { TrendingUp, Shield, Zap } from "lucide-react";

export function FeaturesGlare() {
  return (
    <section className="py-20 px-6 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Why Choose Skyspear?
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Experience automated trading with institutional-grade risk management
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 justify-items-center">
          <GlareCard className="flex flex-col items-center justify-center p-8">
            <TrendingUp className="h-14 w-14 text-primary mb-4" strokeWidth={1.5} />
            <h3 className="font-bold text-white text-xl mb-2">Proven Strategy</h3>
            <p className="text-neutral-300 text-center text-sm">
              Short Strangle strategy with daily execution at optimal market timing
            </p>
          </GlareCard>

          <GlareCard className="flex flex-col items-center justify-center p-8">
            <Shield className="h-14 w-14 text-primary mb-4" strokeWidth={1.5} />
            <h3 className="font-bold text-white text-xl mb-2">Risk Management</h3>
            <p className="text-neutral-300 text-center text-sm">
              Advanced capital allocation with daily loss caps and trailing stop-loss
            </p>
          </GlareCard>

          <GlareCard className="flex flex-col items-center justify-center p-8">
            <Zap className="h-14 w-14 text-primary mb-4" strokeWidth={1.5} />
            <h3 className="font-bold text-white text-xl mb-2">Auto-Execute</h3>
            <p className="text-neutral-300 text-center text-sm">
              Fully automated entry and exit with real-time monitoring and WebSocket updates
            </p>
          </GlareCard>
        </div>
      </div>
    </section>
  );
}
