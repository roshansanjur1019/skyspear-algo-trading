import { motion } from "framer-motion";
import Header from "@/components/Header";
import { Target, Users, Lightbulb } from "lucide-react";

const About = () => {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header onLogin={() => { }} onLogout={() => { }} />

            <main>
                {/* Hero Section */}
                <section className="relative py-32 overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background opacity-50" />

                    <div className="container px-4 mx-auto relative z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="max-w-4xl mx-auto text-center"
                        >
                            <h1 className="text-4xl md:text-6xl font-bold mb-8">
                                Democratizing <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary-glow to-accent">
                                    Institutional Intelligence
                                </span>
                            </h1>
                            <p className="text-xl text-muted-foreground leading-relaxed">
                                Skyspear was born from a simple belief: sophisticated trading tools shouldn't be reserved for Wall Street.
                                We're building the bridge between retail traders and algorithmic precision.
                            </p>
                        </motion.div>
                    </div>
                </section>

                {/* Values Grid */}
                <section className="py-24 bg-card/20 border-y border-white/5">
                    <div className="container px-4 mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                            {[
                                {
                                    icon: Target,
                                    title: "Precision First",
                                    desc: "We believe in data over gut feeling. Every feature we build is backed by rigorous backtesting."
                                },
                                {
                                    icon: Users,
                                    title: "Trader Centric",
                                    desc: "Built by traders, for traders. We understand the psychological challenges of the market."
                                },
                                {
                                    icon: Lightbulb,
                                    title: "Continuous Innovation",
                                    desc: "The market never sleeps, and neither do we. Our AI models evolve with market conditions."
                                }
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.2 }}
                                    className="text-center"
                                >
                                    <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                        <item.icon className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                                    <p className="text-muted-foreground">{item.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Story Section */}
                <section className="py-32">
                    <div className="container px-4 mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                            <motion.div
                                initial={{ opacity: 0, x: -50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                            >
                                <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Journey</h2>
                                <div className="space-y-6 text-muted-foreground text-lg">
                                    <p>
                                        Started in 2023, Skyspear began as a private tool for a small group of options traders in Mumbai.
                                        We were frustrated with the limitations of existing retail platforms—slow execution, lack of automation, and poor risk management.
                                    </p>
                                    <p>
                                        After seeing consistent results with our internal tools, we decided to open up the platform to the wider Indian trading community.
                                    </p>
                                    <p>
                                        Today, we process over ₹500 Crores in daily volume, helping thousands of traders reclaim their time and mental peace.
                                    </p>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                className="relative h-[500px] rounded-3xl overflow-hidden border border-white/10 bg-card/50"
                            >
                                {/* Abstract visualization of growth */}
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-9xl font-bold text-white/5">2024</div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default About;
