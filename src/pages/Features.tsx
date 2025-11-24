import { motion } from "framer-motion";
import Header from "@/components/Header";
import {
    Brain, Zap, Shield, Globe,
    BarChart2, Lock, Smartphone,
    Clock, ArrowRight
} from "lucide-react";

const features = [
    {
        title: "Neural Market Analysis",
        desc: "Our AI models process 50+ market indicators in real-time to identify high-probability setups.",
        icon: Brain,
        colSpan: "md:col-span-2",
        bg: "bg-primary/10"
    },
    {
        title: "Sub-ms Execution",
        desc: "Direct DMA access ensures your orders hit the exchange before the crowd.",
        icon: Zap,
        colSpan: "md:col-span-1",
        bg: "bg-accent/10"
    },
    {
        title: "Dynamic Risk Guard",
        desc: "Smart position sizing that adjusts based on market volatility (VIX).",
        icon: Shield,
        colSpan: "md:col-span-1",
        bg: "bg-orange-500/10"
    },
    {
        title: "Multi-Broker Support",
        desc: "Connect Angel One, Zerodha, and Upstox accounts simultaneously.",
        icon: Globe,
        colSpan: "md:col-span-2",
        bg: "bg-blue-500/10"
    },
    {
        title: "Backtesting Engine",
        desc: "Test your strategies against 5 years of historical tick data.",
        icon: Clock,
        colSpan: "md:col-span-1",
        bg: "bg-purple-500/10"
    },
    {
        title: "Mobile Command Center",
        desc: "Monitor and control your algos from anywhere with our PWA.",
        icon: Smartphone,
        colSpan: "md:col-span-1",
        bg: "bg-green-500/10"
    },
    {
        title: "Institutional Security",
        desc: "256-bit encryption and local credential storage.",
        icon: Lock,
        colSpan: "md:col-span-1",
        bg: "bg-red-500/10"
    }
];

const FeaturesPage = () => {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header onLogin={() => { }} onLogout={() => { }} />

            <main className="pt-24 pb-16">
                <div className="container px-4 mx-auto">
                    <div className="text-center mb-20">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl md:text-6xl font-bold mb-6"
                        >
                            Engineered for <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary-glow to-accent">
                                Dominance
                            </span>
                        </motion.h1>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Every feature is designed to give you a statistical edge in the market.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
                        {features.map((feature, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className={`${feature.colSpan} group relative overflow-hidden rounded-3xl border border-white/10 bg-card/30 backdrop-blur-xl p-8 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1`}
                            >
                                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-white/5 to-transparent`} />

                                <div className="relative z-10 h-full flex flex-col justify-between">
                                    <div>
                                        <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-6 text-foreground`}>
                                            <feature.icon className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                                        <p className="text-muted-foreground text-lg">{feature.desc}</p>
                                    </div>

                                    <div className="mt-8 flex items-center text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                                        Learn more <ArrowRight className="ml-2 w-4 h-4" />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default FeaturesPage;
