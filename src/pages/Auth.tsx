import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SignInPage, Testimonial } from "@/components/ui/sign-in";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { loginSchema } from "@/lib/validation";

const testimonials: Testimonial[] = [
  {
    avatarSrc: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    name: "Sarah Chen",
    handle: "@sarahtrader",
    text: "Skyspear transformed my trading. Consistent profits with automated strategies and excellent risk management."
  },
  {
    avatarSrc: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus",
    name: "Marcus Johnson",
    handle: "@marcusfinance",
    text: "The auto-execute feature is a game changer. Set it and forget it - wake up to profits every day."
  },
  {
    avatarSrc: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
    name: "David Martinez",
    handle: "@davidoptions",
    text: "Real-time execution with Angel One integration. Best algo trading platform I've used. Highly recommended!"
  },
];

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(event.currentTarget);
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;

      // Validate input using zod schema
      const validatedData = loginSchema.parse({ email, password });

      const { error } = await supabase.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password,
      });

      if (error) {
        // Handle specific error cases
        if (error.message.includes("Invalid login credentials")) {
          throw new Error("Invalid email or password. Please check your credentials and try again.");
        }
        if (error.message.includes("Email not confirmed")) {
          throw new Error("Please verify your email address before signing in.");
        }
        throw error;
      }

      toast({
        title: "Welcome back!",
        description: "You've successfully signed in to Skyspear.",
      });

      navigate("/dashboard");
    } catch (error: any) {
      console.error("Sign in error:", error);
      toast({
        title: "Sign in failed",
        description: error.message || "An error occurred during sign in. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      console.error("Google sign in error:", error);
      toast({
        title: "Google sign in failed",
        description: error.message || "Unable to sign in with Google. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const email = prompt("Please enter your email address:");
    if (!email) return;

    try {
      // Validate email format
      loginSchema.pick({ email: true }).parse({ email });

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;

      toast({
        title: "Password reset email sent",
        description: "Check your email for instructions to reset your password.",
      });
    } catch (error: any) {
      toast({
        title: "Password reset failed",
        description: error.message || "Unable to send password reset email.",
        variant: "destructive",
      });
    }
  };

  const handleCreateAccount = () => {
    // For now, show a toast. You can expand this to a signup modal/page
    toast({
      title: "Sign up coming soon",
      description: "Account creation will be available in the signup tab. For now, please contact support.",
    });
  };

  return (
    <SignInPage
      heroImageSrc="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=2160&q=80"
      testimonials={testimonials}
      onSignIn={handleSignIn}
      onGoogleSignIn={handleGoogleSignIn}
      onResetPassword={handleResetPassword}
      onCreateAccount={handleCreateAccount}
      isLoading={isLoading}
    />
  );
};

export default Auth;
