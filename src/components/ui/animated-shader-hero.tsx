import React from 'react';
import { Button } from './button';

interface TrustBadge {
  text: string;
  icons?: string[];
}

interface Headline {
  line1: string;
  line2: string;
}

interface ButtonConfig {
  text: string;
  onClick: () => void;
}

interface Buttons {
  primary: ButtonConfig;
  secondary: ButtonConfig;
}

interface HeroProps {
  trustBadge: TrustBadge;
  headline: Headline;
  subtitle: string;
  buttons: Buttons;
  className?: string;
}

const Hero: React.FC<HeroProps> = ({
  trustBadge,
  headline,
  subtitle,
  buttons,
  className = ''
}) => {
  return (
    <section className={`relative min-h-[90vh] flex items-center justify-center overflow-hidden ${className}`}>
      {/* Animated background with shader-like effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-primary/5 to-background">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary)/0.15),transparent_50%)]" />
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-glow/10 rounded-full blur-[150px] animate-float" />
      </div>

      {/* Animated grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_110%)] opacity-20" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm animate-fade-in">
            {trustBadge.icons && trustBadge.icons.map((icon, idx) => (
              <span key={idx} className="text-sm">{icon}</span>
            ))}
            <span className="text-sm font-medium text-primary">{trustBadge.text}</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <span className="block text-foreground mb-2">{headline.line1}</span>
            <span className="block bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent animate-gradient">
              {headline.line2}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {subtitle}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Button 
              size="lg" 
              onClick={buttons.primary.onClick}
              className="group bg-primary hover:bg-primary-glow text-primary-foreground shadow-[0_0_30px_hsl(var(--primary)/0.3)] hover:shadow-[0_0_50px_hsl(var(--primary)/0.5)] transition-all duration-300 text-base px-8 py-6"
            >
              {buttons.primary.text}
              <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={buttons.secondary.onClick}
              className="border-primary/30 hover:bg-primary/10 hover:border-primary/50 text-foreground backdrop-blur-sm text-base px-8 py-6"
            >
              {buttons.secondary.text}
            </Button>
          </div>

          {/* Floating particles effect */}
          <div className="absolute top-1/4 left-10 w-2 h-2 bg-primary/40 rounded-full animate-float" style={{ animationDelay: '0s', animationDuration: '3s' }} />
          <div className="absolute top-1/3 right-20 w-3 h-3 bg-primary-glow/30 rounded-full animate-float" style={{ animationDelay: '1s', animationDuration: '4s' }} />
          <div className="absolute bottom-1/4 left-1/4 w-2 h-2 bg-accent/40 rounded-full animate-float" style={{ animationDelay: '2s', animationDuration: '5s' }} />
          <div className="absolute bottom-1/3 right-1/3 w-3 h-3 bg-primary/30 rounded-full animate-float" style={{ animationDelay: '1.5s', animationDuration: '3.5s' }} />
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default Hero;
