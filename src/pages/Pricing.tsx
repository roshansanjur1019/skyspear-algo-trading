import { motion } from "framer-motion";
import { Check, Shield, Zap, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";

const plans = [
    {
        name: "Starter",
        price: "₹0",
        description: "Perfect for beginners exploring algo-trading.",
        features: [
            "Basic NIFTY Strategies",
            "Paper Trading",
            "Standard Support",
            "Daily Market Analysis"
        ],
        cta: "Get Started Free",
        popular: false,
        gradient: "from-blue-500/10 to-transparent"
    },
    {
        name: "Pro",
        price: "₹2,999",
        period: "/month",
        description: "For serious traders requiring speed and precision.",
        features: [
            "All Starter Features",
            "Advanced AI Strategies",
            "Real-time Execution",
            "Priority Support",
            "Risk Guard™ Protection"
        ],
        cta: "Start Pro Trial",
        popular: true,
        gradient: "from-primary/20 to-primary/5"
    },
    {
        name: "Institutional",
        price: "Custom",
        description: "Tailored solutions for high-volume desks.",
        features: [
            "All Pro Features",
            "Dedicated Server",
            "Custom Strategy Development",
            "API Access",
            "24/7 Account Manager"
        ],
        cta: "Contact Sales",
        popular: false,
        gradient: "from-accent/20 to-accent/5"
    }
];

const Pricing = () => {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header onLogin={() => { }} onLogout={() => { }} />

            <main className="pt-24 pb-16">
                <div className="container px-4 mx-auto">
                    <div className="text-center mb-16">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl md:text-6xl font-bold mb-6"
                        >
                            Simple, Transparent <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary-glow to-accent">
                                Pricing
                            </span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-muted-foreground max-w-2xl mx-auto text-lg"
                        >
                            Choose the plan that fits your trading style. No hidden fees, just pure performance.
                        </motion.p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {plans.map((plan, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 + 0.2 }}
                                className={`relative group rounded-3xl border ${plan.popular ? 'border-primary/50 shadow-[0_0_30px_rgba(var(--primary-rgb),0.2)]' : 'border-white/10'} bg-card/30 backdrop-blur-xl p-8 hover:border-primary/30 transition-all duration-300 hover:-translate-y-2`}
                            >
                                {/* Popular Badge */}
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-lg">
                                        Most Popular
                                    </div>
                                )}

                                {/* Gradient Background */}
                                <div className={`absolute inset-0 bg-gradient-to-b ${plan.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl`} />

                                <div className="relative z-10">
                                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                                    <div className="flex items-baseline gap-1 mb-4">
                                        <span className="text-4xl font-bold">{plan.price}</span>
                                        {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                                    </div>
                                    <p className="text-muted-foreground mb-8">{plan.description}</p>

                                    <ul className="space-y-4 mb-8">
                                        {plan.features.map((feature, j) => (
                                            <li key={j} className="flex items-center gap-3 text-sm">
                                                <div className="p-1 rounded-full bg-primary/10 text-primary">
                                                    <Check className="w-3 h-3" />
                                                </div>
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>

                                    <Button
                                        className={`w-full h-12 rounded-xl text-lg ${plan.popular ? 'bg-primary hover:bg-primary/90' : 'bg-white/10 hover:bg-white/20'}`}
                                        variant={plan.popular ? 'default' : 'outline'}
                                    >
                                        {plan.cta}
                                    </Button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Pricing;
