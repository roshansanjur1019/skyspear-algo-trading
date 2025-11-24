import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Shield } from "lucide-react";

import { motion } from "framer-motion";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setUser(session.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = () => navigate("/auth");
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };
  const handleGetStarted = () => navigate(user ? "/dashboard" : "/auth");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-background text-foreground overflow-x-hidden"
    >
      <Header user={user} onLogin={handleLogin} onLogout={handleLogout} />

      <main>
        <Hero onGetStarted={handleGetStarted} />
        <Features />
      </main>

      <footer className="relative bg-black/40 backdrop-blur-xl border-t border-white/5 py-16">
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="md:col-span-2">
              <h3 className="text-2xl font-bold mb-6">
                <span className="bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
                  Skyspear
                </span>
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md leading-relaxed">
                Professional automated options trading platform for consistent profits
                with advanced risk management and real-time execution.
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground/60 bg-white/5 px-4 py-2 rounded-full w-fit">
                <Shield className="w-4 h-4 text-primary/70" />
                <p>Trading involves market risk.</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-6 text-foreground">Platform</h4>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li><button onClick={() => navigate("/features")} className="hover:text-primary transition-colors">Features</button></li>
                <li><button onClick={() => navigate("/pricing")} className="hover:text-primary transition-colors">Pricing</button></li>
                <li><a href="#" className="hover:text-primary transition-colors">API Docs</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Status</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-6 text-foreground">Support</h4>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 mt-16 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 Skyspear. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </motion.div>
  );
};

export default Index;
