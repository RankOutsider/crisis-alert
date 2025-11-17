import {
    Search, Zap, Send, FileText, Lock, DollarSign,
    Check, X, Shield, Crown, BookOpen
} from 'lucide-react'; 

const FeatureCard = ({ icon: Icon, title, description }) => (
    <div className="p-6 rounded-xl shadow-2xl bg-gray-900/70 backdrop-blur-sm border border-gray-700 hover:border-blue-500 transition-all duration-300 transform hover:scale-[1.02] cursor-default">
        <Icon className="w-8 h-8 text-cyan-400 mb-4" />
        <h3 className="font-bold text-xl mb-2 text-white">{title}</h3>
        <p className="text-gray-400 text-base">{description}</p>
    </div>
);

const SectionTitle = ({ children }) => (
    <h2 className="text-3xl md:text-5xl font-extrabold mb-10 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 text-center">
        {children}
    </h2>
);

const CheckItem = ({ children }) => (
    <li className="flex items-start gap-3">
        <Check className="text-green-400 shrink-0" size={20} />
        <span className="text-slate-200">{children}</span>
    </li>
);

const XItem = ({ children }) => (
    <li className="flex items-start gap-3">
        <X className="text-slate-600 shrink-0" size={20} />
        <span className="text-slate-500 line-through">{children}</span>
    </li>
);

export default function HomePage() {
    return (
        <div className="min-h-screen bg-gray-900 text-gray-200">
            {/* --- 1. Header (Navbar cố định) --- */}
            <header className="sticky top-0 z-10 w-full bg-gray-900/90 backdrop-blur-sm border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
                    <div className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                        Crisis Alert
                    </div>
                    <nav className="hidden md:flex space-x-6 text-sm font-medium">
                        <a href="#features" className="hover:text-cyan-300 transition-colors">Features</a>
                        <a href="#ai" className="hover:text-cyan-300 transition-colors">AI Technology</a>
                        <a href="#pricing" className="hover:text-cyan-300 transition-colors">Pricing</a>
                    </nav>
                    <div className="flex items-center space-x-4">
                        <a href="/login" className="text-sm font-medium hover:text-cyan-300 transition-colors hidden sm:block">
                            Login
                        </a>
                        <a href="/register">
                            <span className="h-9 px-4 text-sm font-semibold rounded-full text-white bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 transition-all duration-300 shadow-md flex items-center">
                                Get Started
                            </span>
                        </a>
                    </div>
                </div>
            </header>

            <main>
                {/* --- 2. Hero Section (Phần giới thiệu) --- */}
                <section className="py-20 md:py-32 bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900">
                    <div className="max-w-7xl mx-auto px-4 text-center">
                        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
                            Protect Your Brand with <br className="hidden md:inline" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                                Crisis Alert Technology
                            </span>
                        </h1>
                        <p className="text-xl md:text-2xl mb-12 text-gray-400 max-w-3xl mx-auto">
                            Monitor, analyze sentiment, and receive instant alerts across all social media platforms and news sources.
                        </p>

                        <div className="flex flex-col md:flex-row justify-center items-center gap-6">
                            <a href="/register">
                                <span className="flex items-center justify-center h-14 px-12 font-bold rounded-full text-white bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 transition-all duration-300 transform hover:scale-105 shadow-xl text-lg">
                                    Start Free Trial
                                </span>
                            </a>
                            <a href="#features" className="flex items-center justify-center h-14 px-12 font-bold rounded-full text-white bg-transparent border-2 border-blue-400 hover:bg-blue-400/20 transition-all duration-300 transform hover:scale-105 text-lg">
                                Explore Features
                            </a>
                        </div>
                    </div>
                </section>

                {/* --- 3. Feature Section (Các tính năng chính) --- */}
                <section id="features" className="py-20 md:py-28 bg-gray-800/50 border-t border-gray-800">
                    <div className="max-w-7xl mx-auto px-4">
                        <SectionTitle>
                            A Complete Solution for Crisis Management
                        </SectionTitle>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <FeatureCard
                                icon={Search}
                                title="Multi-Platform Monitoring"
                                description="Automatically scan and collect data from Facebook, X (Twitter), TikTok, News, Youtube, and major forums."
                            />
                            <FeatureCard
                                icon={Zap}
                                title="Real-time Alerts (Email & CC)"
                                description="Receive instant notifications via email when content matches your keywords. Support CC emails for stakeholders."
                            />
                            <FeatureCard
                                icon={FileText}
                                title="Tiered Reports (PDF & Excel)"
                                description="Export professional PDF reports (VIP/Pro) or full raw data via Excel (Pro) to integrate with your workflow."
                            />
                            <FeatureCard
                                icon={BookOpen}
                                title="Case Study Generation"
                                description="Generate detailed case studies from alerts (VIP/Pro) to analyze crisis impact and response."
                            />
                            <FeatureCard
                                icon={Lock}
                                title="Advanced Security (OTP)"
                                description="All accounts are protected with email verification and a completed OTP-based Forgot Password workflow."
                            />
                            <FeatureCard
                                icon={DollarSign}
                                title="Flexible Subscription Tiers"
                                description="Integrated business model with Free, VIP, and Pro plans. Includes a secure QR code purchase page."
                            />
                        </div>
                    </div>
                </section>

                {/* --- 4. AI Section (Điểm nhấn cho báo cáo) --- */}
                <section id="ai" className="py-20 md:py-28 bg-gray-900 border-t border-gray-800">
                    <div className="max-w-7xl mx-auto px-4">
                        <SectionTitle>
                            AI-Powered Sentiment Analysis
                        </SectionTitle>
                        <div className="flex flex-col md:flex-row items-center gap-12 bg-gray-800/50 p-8 md:p-12 rounded-2xl border border-blue-500/50">
                            <div className="md:w-1/2 text-left">
                                <h3 className="text-3xl font-bold text-white mb-4">
                                    Automatic Crisis Severity Rating
                                </h3>
                                <p className="text-lg text-gray-400 mb-6">
                                    This is the core value of the project: instead of just keyword matching, the system uses AI to label every post.
                                </p>
                                <ul className="space-y-3 text-gray-300">
                                    <li className="flex items-start">
                                        <span className="text-cyan-400 mr-3 text-2xl font-bold">1.</span>
                                        Classify each mention into **Positive, Negative, Neutral**.
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-cyan-400 mr-3 text-2xl font-bold">2.</span>
                                        Helps Admin & Users **easily filter** negative threats.
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-cyan-400 mr-3 text-2xl font-bold">3.</span>
                                        **Demonstrates the ability to integrate** machine learning into real applications.
                                    </li>
                                </ul>
                            </div>
                            <div className="md:w-1/2 mt-8 md:mt-0">
                                <div className="bg-gray-900 p-6 rounded-xl shadow-inner border border-gray-700">
                                    {/* MÔ PHỎNG PHÂN TÍCH SENTIMENT */}
                                    <div className="text-sm font-mono text-gray-500 mb-4">
                                        Function: analyzeSentiment(postContent)
                                    </div>
                                    <div className="p-4 rounded-lg bg-red-900/40 border border-red-700 mb-3">
                                        <p className="font-semibold text-red-300">Post #4578 (Twitter/X)</p>
                                        <p className="text-sm text-red-200 mt-1">"Project X is a disaster, the service quality is terrible!"</p>
                                        <div className="mt-2 text-xs font-bold text-red-500 bg-red-200 px-2 py-0.5 rounded inline-block">
                                            Sentiment: NEGATIVE
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-lg bg-green-900/40 border border-green-700">
                                        <p className="font-semibold text-green-300">Post #4579 (Blog)</p>
                                        <p className="text-sm text-green-200 mt-1">"The design of product Y is beautiful, delivery was fast."</p>
                                        <div className="mt-2 text-xs font-bold text-green-500 bg-green-200 px-2 py-0.5 rounded inline-block">
                                            Sentiment: POSITIVE
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- 5. Pricing Section --- */}
                <section id="pricing" className="py-20 md:py-28 bg-gray-800/50 border-t border-gray-800">
                    <div className="max-w-7xl mx-auto px-4">
                        <SectionTitle>
                            Subscription Plans
                        </SectionTitle>
                        <p className="text-center text-xl text-gray-400 mb-16 max-w-2xl mx-auto">
                            Our flexible subscription tiers are designed to scale with your needs, from basic monitoring to full crisis management.
                        </p>

                        {/* === GRID 3 CỘT === */}
                        <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">

                            {/* --- GÓI 1: Free --- */}
                            <div className="relative flex flex-col p-8 rounded-2xl bg-slate-800/50 border border-slate-700 hover:bg-slate-800 transition-all duration-300">
                                <div className="mb-6">
                                    <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-slate-700 text-slate-400">
                                        <Shield size={24} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
                                    <p className="text-slate-400 text-sm">Essential tools for small monitoring needs.</p>
                                </div>

                                <div className="mb-8">
                                    <span className="text-4xl font-bold text-white">$Free</span>
                                </div>

                                <ul className="space-y-4 mb-8 flex-1">
                                    <CheckItem>Up to 5 Alerts</CheckItem>
                                    <CheckItem>10 Keywords per Alert</CheckItem>
                                    <CheckItem>Email Support</CheckItem>
                                    <XItem>Sentiment Analysis</XItem>
                                    <XItem>PDF Report Export</XItem>
                                    <XItem>Excel Report Export</XItem>
                                    <XItem>Case Study Generation</XItem>
                                    <XItem>Real-time Alerts via Email</XItem>
                                    <XItem>Full API Access</XItem>
                                </ul>

                                <a href="/buy" className="block text-center w-full py-3 rounded-xl font-bold transition-all bg-slate-700 text-slate-400 cursor-default">
                                    Default Plan
                                </a>
                            </div>

                            {/* --- GÓI 2: VIP (POPULAR) --- */}
                            <div className="relative flex flex-col p-8 rounded-2xl transition-all duration-300 bg-slate-800 border-2 border-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.15)] transform hover:-translate-y-2 scale-[1.05]">
                                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                                    MOST POPULAR
                                </div>

                                <div className="mb-6">
                                    <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-blue-500/20 text-blue-400">
                                        <Zap size={24} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2">VIP</h3>
                                    <p className="text-slate-400 text-sm">For professionals and small teams.</p>
                                </div>

                                <div className="mb-8">
                                    <span className="text-4xl font-bold text-white">$20</span>
                                    <span className="text-slate-500"> /month</span>
                                </div>

                                <ul className="space-y-4 mb-8 flex-1">
                                    <CheckItem>Up to 50 Alerts</CheckItem>
                                    <CheckItem>150 Keywords per Alert</CheckItem>
                                    <CheckItem>Basic AI Sentiment</CheckItem>
                                    <CheckItem>Priority Email Support</CheckItem>
                                    <CheckItem>PDF Report Export</CheckItem>
                                    <CheckItem>Case Study Generation</CheckItem>
                                    <CheckItem>Real-time Alerts via Email</CheckItem>
                                    <XItem>Excel Report Export</XItem>
                                    <XItem>Full API Access</XItem>
                                </ul>

                                <a href="/buy" className="block text-center w-full py-3 rounded-xl font-bold transition-all bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-lg">
                                    Upgrade Now
                                </a>
                            </div>

                            {/* --- GÓI 3: PRO --- */}
                            <div className="relative flex flex-col p-8 rounded-2xl bg-slate-800/50 border border-slate-700 hover:bg-slate-800 transition-all duration-300">
                                <div className="mb-6">
                                    <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-yellow-500/20 text-yellow-400">
                                        <Crown size={24} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
                                    <p className="text-slate-400 text-sm">Full power for enterprise management.</p>
                                </div>

                                <div className="mb-8">
                                    <span className="text-4xl font-bold text-white">$50</span>
                                    <span className="text-slate-500"> /month</span>
                                </div>

                                <ul className="space-y-4 mb-8 flex-1">
                                    <CheckItem>Up to 500 Alerts</CheckItem>
                                    <CheckItem>2500 Keywords per Alert</CheckItem>
                                    <CheckItem>Advanced AI Sentiment</CheckItem>
                                    <CheckItem>Dedicated 24/7 Support</CheckItem>
                                    <CheckItem>PDF Report Export</CheckItem>
                                    <CheckItem>Excel Report Export</CheckItem>
                                    <CheckItem>Case Study Generation</CheckItem>
                                    <CheckItem>Real-time Alerts via Email</CheckItem>
                                    <CheckItem>Full API Access</CheckItem>
                                </ul>

                                <a href="/buy" className="block text-center w-full py-3 rounded-xl font-bold transition-all bg-slate-700 hover:bg-slate-600 text-white">
                                    Upgrade Now
                                </a>
                            </div>

                        </div>
                        <p className="text-center text-sm text-gray-500 mt-8">
                            *This section provides a visual demo. The actual payment and subscription logic is handled on the 'Buy' page.
                        </p>
                    </div>
                </section>
            </main>

            {/* --- 5. Footer --- */}
            <footer className="py-8 border-t border-gray-800 bg-gray-900">
                <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
                    &copy; {new Date().getFullYear()} Crisis Alert. Graduation Internship Project.
                </div>
            </footer>
        </div>
    );
}