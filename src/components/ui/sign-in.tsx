import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Chrome, ArrowRight, TrendingUp } from "lucide-react";

export interface Testimonial {
  avatarSrc: string;
  name: string;
  handle: string;
  text: string;
}

interface SignInPageProps {
  heroImageSrc: string;
  testimonials: Testimonial[];
  onSignIn: (event: React.FormEvent<HTMLFormElement>) => void;
  onGoogleSignIn?: () => void;
  onResetPassword?: () => void;
  onCreateAccount?: () => void;
  isLoading?: boolean;
}

export const SignInPage = ({
  heroImageSrc,
  testimonials,
  onSignIn,
  onGoogleSignIn,
  onResetPassword,
  onCreateAccount,
  isLoading = false
}: SignInPageProps) => {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left side - Hero with Testimonials */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 bg-card/50 backdrop-blur-sm border-r border-border/50">
        {/* Background image with overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroImageSrc}
            alt="Trading platform"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background/90 to-primary/10" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 rounded-lg bg-primary/20 border border-primary/30">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">
              <span className="bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">
                Skyspear
              </span>
            </h1>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-4xl font-bold text-foreground">
              Power and Simplicity
            </h2>
            <p className="text-xl text-muted-foreground">
              In One Trading Platform
            </p>
          </div>
        </div>

        {/* Testimonials */}
        <div className="relative z-10 space-y-6">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Trusted by Traders
          </p>
          <div className="space-y-4">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="group p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_30px_hsl(var(--primary)/0.15)]"
              >
                <div className="flex items-start gap-3">
                  <Avatar className="w-10 h-10 border-2 border-primary/20">
                    <AvatarImage src={testimonial.avatarSrc} alt={testimonial.name} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {testimonial.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm text-foreground">
                        {testimonial.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {testimonial.handle}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {testimonial.text}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Sign In Form */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden text-center">
            <h1 className="text-3xl font-bold">
              <span className="bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">
                Skyspear
              </span>
            </h1>
            <p className="text-muted-foreground mt-2">
              Welcome to automated trading
            </p>
          </div>

          {/* Form header */}
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-foreground">Sign in to your account</h2>
            <p className="text-muted-foreground">
              Enter your credentials to access your trading dashboard
            </p>
          </div>

          {/* Sign in form */}
          <form onSubmit={onSignIn} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">
                  Email address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  className="h-11 bg-card/50 border-border/50 focus:border-primary/50 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-foreground">
                    Password
                  </Label>
                  {onResetPassword && (
                    <button
                      type="button"
                      onClick={onResetPassword}
                      className="text-sm text-primary hover:text-primary-glow transition-colors"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="h-11 bg-card/50 border-border/50 focus:border-primary/50 focus:ring-primary/20"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-primary hover:bg-primary-glow text-primary-foreground shadow-[0_0_30px_hsl(var(--primary)/0.3)] hover:shadow-[0_0_50px_hsl(var(--primary)/0.5)] transition-all duration-300"
            >
              {isLoading ? "Signing in..." : "Sign in"}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </form>

          {/* Divider */}
          {onGoogleSignIn && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-background text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              {/* Google Sign In */}
              <Button
                type="button"
                variant="outline"
                onClick={onGoogleSignIn}
                disabled={isLoading}
                className="w-full h-11 border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all"
              >
                <Chrome className="mr-2 w-5 h-5" />
                Continue with Google
              </Button>
            </>
          )}

          {/* Sign up link */}
          {onCreateAccount && (
            <div className="text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <button
                type="button"
                onClick={onCreateAccount}
                className="text-primary hover:text-primary-glow font-medium transition-colors"
              >
                Create one now
              </button>
            </div>
          )}

          {/* Terms */}
          <p className="text-xs text-center text-muted-foreground">
            By signing in, you agree to our{" "}
            <a href="#" className="text-primary hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-primary hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
