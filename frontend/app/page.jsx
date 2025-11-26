// frontend/app/page.jsx
'use client';

import { useState, useEffect } from 'react'; // Cần import useEffect
import {
    Search, Zap, Send, FileText, Lock, DollarSign,
    Check, X, Shield, Crown, BookOpen, Menu, LogOut,
    User as UserIcon, Settings, AlertCircle // Icons mới cho MobileMenu
} from 'lucide-react';

// --- CÁC COMPONENT PHỤ ---

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

// --- COMPONENT MOBILE NAVIGATION ---

const MobileMenu = ({ isOpen, onClose, activeSection, onLinkClick }) => {

    // Dữ liệu menu cho Landing Page
    const menuItems = [
        { name: 'Features', href: 'features' },
        { name: 'AI Technology', href: 'ai' },
        { name: 'Pricing', href: 'pricing' },
    ];

    // Hàm xử lý click và ngăn hành vi mặc định của thẻ <a>
    const handleClick = (e, sectionId) => {
        e.preventDefault();
        onLinkClick(sectionId);
    };

    return (
        <>
            {/* 1. Overlay (Lớp phủ tối màu mờ nền) */}
            <div
                className={`fixed inset-0 z-40 md:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto bg-black/60' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={onClose}
            />

            {/* 2. Thanh Sidebar chính (Glassmorphism) */}
            <aside
                className={`
                    fixed inset-y-0 right-0 z-50 w-72 h-full 
                    bg-slate-800/80 backdrop-blur-md border-l border-slate-700/50
                    transform transition-transform duration-300 ease-in-out flex flex-col
                    ${isOpen ? 'translate-x-0' : 'translate-x-full'}
                `}
            >
                {/* Header (Logo + Close Btn) */}
                <div className="flex items-center justify-between p-6 shrink-0">
                    <div className="flex items-center gap-3">
                        {/* Logo Icon */}
                        <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-900/20">
                            <AlertCircle className="text-white" size={22} />
                        </div>
                        {/* Title */}
                        <h1 className="text-xl font-bold text-white tracking-tight">Crisis Alert</h1>
                    </div>
                    {/* Nút X chỉ hiện trên Mobile */}
                    <button
                        onClick={onClose}
                        className="p-2 md:hidden text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Navigation (Menu Items) */}
                <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1 custom-scrollbar">

                    {menuItems.map((item) => {
                        const isActive = item.href === activeSection; // Logic Active

                        return (
                            <a
                                key={item.name}
                                href={`#${item.href}`}
                                onClick={(e) => handleClick(e, item.href)} // Gọi hàm cuộn và set active
                                className={`
                                    flex items-center px-4 py-3 rounded-lg transition-all duration-200 group text-sm
                                    ${isActive
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20 font-bold' // ACTIVE CSS
                                        : 'text-slate-400 hover:bg-slate-700/50 hover:text-white' // INACTIVE CSS
                                    }
                                `}
                            >
                                <span className="font-medium">{item.name}</span>
                            </a>
                        );
                    })}
                </nav>

                {/* Footer (Login/Register) - Dạng nút nổi bật */}
                <div className="p-4 border-t border-slate-700/50 shrink-0 bg-slate-800/30">

                    {/* Nút Login (Dạng Inactive Link - Màu xám) */}
                    <a href="/login" onClick={onClose} className="w-full block mb-2">
                        <div className="flex items-center justify-center p-3 rounded-lg text-slate-400 hover:bg-slate-700/50 hover:text-white transition-colors text-sm font-medium">
                            <UserIcon size={18} className="mr-3" />
                            Login
                        </div>
                    </a>

                    {/* Nút Get Started (Dạng Active Link - Gradient) */}
                    <a href="/register" onClick={onClose} className="w-full block">
                        <div className="flex items-center justify-center gap-3 px-4 py-3 rounded-lg transition-colors bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/30">
                            <Zap size={18} />
                            Get Started Now
                        </div>
                    </a>
                </div>
            </aside>
        </>
    );
};

// --- COMPONENT CHÍNH HOMEPAGE (ĐÃ CHỈNH SỬA) ---

export default function HomePage() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    // Mặc định là features, sẽ thay đổi khi người dùng click vào menu
    const [activeSection, setActiveSection] = useState('features');

    // Hàm XỬ LÝ KHI BẤM VÀO LINK MENU (Đã sửa lại logic)
    const handleLinkClick = (sectionId) => {
        // Đặt mục đang active
        setActiveSection(sectionId);
        // Đóng menu
        setIsMenuOpen(false);
        // Cuộn đến phần tử tương ứng
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Dữ liệu gói dịch vụ (Giữ nguyên)
    const plans = [
        { name: 'Free', price: '$Free', period: '', icon: Shield, isPopular: false, buttonClass: 'bg-slate-700 text-slate-400 cursor-default', actionText: 'Default Plan' },
        { name: 'VIP', price: '$20', period: '/month', icon: Zap, isPopular: true, buttonClass: 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-lg', actionText: 'Upgrade Now' },
        { name: 'Pro', price: '$50', period: '/month', icon: Crown, isPopular: false, buttonClass: 'bg-slate-700 hover:bg-slate-600 text-white', actionText: 'Upgrade Now' }
    ];

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 overflow-x-hidden pt-16">
            {/* --- Header --- */}
            <header className="fixed top-0 z-10 w-full bg-gray-900/90 backdrop-blur-sm border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
                    <div className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                        Crisis Alert
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex space-x-6 text-sm font-medium">
                        {/* Cập nhật logic active cho Desktop nếu cần thiết, tạm thời giữ nguyên hover */}
                        <a href="#features" className="hover:text-cyan-300 transition-colors">Features</a>
                        <a href="#ai" className="hover:text-cyan-300 transition-colors">AI Technology</a>
                        <a href="#pricing" className="hover:text-cyan-300 transition-colors">Pricing</a>
                    </nav>

                    <div className="flex items-center space-x-4">
                        <a href="/login" className="text-sm font-medium hover:text-cyan-300 transition-colors hidden lg:block">
                            Login
                        </a>
                        <a href="/register" className="hidden sm:block">
                            <span className="h-9 px-4 text-sm font-semibold rounded-full text-white bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 transition-all duration-300 shadow-md flex items-center">
                                Get Started
                            </span>
                        </a>

                        {/* Mobile Hamburger Button */}
                        <button
                            onClick={() => setIsMenuOpen(true)}
                            className="lg:hidden p-2 rounded-lg text-white hover:bg-gray-700"
                            aria-label="Open menu"
                        >
                            <Menu size={24} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Cập nhật props truyền xuống MobileMenu */}
            <MobileMenu
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                activeSection={activeSection}
                onLinkClick={handleLinkClick}
            />

            <main>
                {/* --- Hero Section --- */}
                <section id="features" className="py-20 md:py-32 bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900">
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

                        <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
                            <a href="/register" className="w-full sm:w-auto">
                                <span className="flex items-center justify-center h-14 w-full px-12 font-bold rounded-full text-white bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 transition-all duration-300 transform hover:scale-105 shadow-xl text-lg">
                                    Start Free Trial
                                </span>
                            </a>
                            <a href="#features" className="w-full sm:w-auto" onClick={(e) => handleLinkClick('features')}>
                                <span className="flex items-center justify-center h-14 w-full px-12 font-bold rounded-full text-white bg-transparent border-2 border-blue-400 hover:bg-blue-400/20 transition-all duration-300 transform hover:scale-105 text-lg">
                                    Explore Features
                                </span>
                            </a>
                        </div>
                    </div>
                </section>

                {/* --- Feature Section --- */}
                <section id="features" className="py-20 md:py-28 bg-gray-800/50 border-t border-gray-800">
                    <div className="max-w-7xl mx-auto px-4">
                        <SectionTitle>
                            A Complete Solution for Crisis Management
                        </SectionTitle>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            <FeatureCard icon={Search} title="Multi-Platform Monitoring" description="Automatically scan and collect data from Facebook, X (Twitter), TikTok, News, Youtube, and major forums." />
                            <FeatureCard icon={Zap} title="Real-time Alerts (Email & CC)" description="Receive instant notifications via email when content matches your keywords. Support CC emails for stakeholders." />
                            <FeatureCard icon={FileText} title="Tiered Reports (PDF & Excel)" description="Export professional PDF reports (VIP/Pro) or full raw data via Excel (Pro) to integrate with your workflow." />
                            <FeatureCard icon={BookOpen} title="Case Study Generation" description="Generate detailed case studies from alerts (VIP/Pro) to analyze crisis impact and response." />
                            <FeatureCard icon={Lock} title="Advanced Security (OTP)" description="All accounts are protected with email verification and a completed OTP-based Forgot Password workflow." />
                            <FeatureCard icon={DollarSign} title="Flexible Subscription Tiers" description="Integrated business model with Free, VIP, and Pro plans. Includes a secure QR code purchase page." />
                        </div>
                    </div>
                </section>

                {/* --- AI Section --- */}
                <section id="ai" className="py-20 md:py-28 bg-gray-900 border-t border-gray-800">
                    <div className="max-w-7xl mx-auto px-4">
                        <SectionTitle>
                            AI-Powered Sentiment Analysis
                        </SectionTitle>
                        <div className="flex flex-col md:flex-row items-center gap-12 bg-gray-800/50 p-8 md:p-12 rounded-2xl border border-blue-500/50 overflow-hidden">
                            <div className="md:w-1/2 text-left w-full min-w-0">
                                <h3 className="text-3xl font-bold text-white mb-4">
                                    Automatic Crisis Severity Rating
                                </h3>
                                <p className="text-lg text-gray-400 mb-6">
                                    This is the core value of the project: instead of just keyword matching, the system uses AI to label every post.
                                </p>
                                <ul className="space-y-3 text-gray-300 break-words">
                                    <li className="flex items-start">
                                        <span className="text-cyan-400 mr-3 text-2xl font-bold shrink-0">1.</span>
                                        <span className="min-w-0 break-words">Classify each mention into **Positive, Negative, Neutral**.</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-cyan-400 mr-3 text-2xl font-bold shrink-0">2.</span>
                                        <span className="min-w-0 break-words">Helps Admin & Users **easily filter** negative threats.</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-cyan-400 mr-3 text-2xl font-bold shrink-0">3.</span>
                                        <span className="min-w-0 break-words">**Demonstrates the ability to integrate** machine learning into real applications.</span>
                                    </li>
                                </ul>
                            </div>
                            <div className="md:w-1/2 mt-8 md:mt-0 w-full min-w-0">
                                <div className="bg-gray-900 p-6 rounded-xl shadow-inner border border-gray-700">
                                    <div className="text-sm font-mono text-gray-500 mb-4 break-words">
                                        Function: analyzeSentiment(postContent)
                                    </div>
                                    <div className="p-4 rounded-lg bg-red-900/40 border border-red-700 mb-3 break-words">
                                        <p className="font-semibold text-red-300">Post #4578 (Twitter/X)</p>
                                        <p className="text-sm text-red-200 mt-1">"Project X is a disaster, the service quality is terrible!"</p>
                                        <div className="mt-2 text-xs font-bold text-red-500 bg-red-200 px-2 py-0.5 rounded inline-block">
                                            Sentiment: NEGATIVE
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-lg bg-green-900/40 border border-green-700 break-words">
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

                        {/* === PRICING GRID === */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">

                            {plans.map((plan, index) => {
                                const isPopularClass = plan.isPopular
                                    ? 'bg-slate-800 border-2 border-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.15)] transform hover:-translate-y-2'
                                    : 'bg-slate-800/50 border border-slate-700 hover:bg-slate-800';

                                return (
                                    <div
                                        key={index}
                                        className={`relative flex flex-col p-8 rounded-2xl transition-all duration-300 ${isPopularClass}`}
                                    >
                                        {/* Tag Popular */}
                                        {plan.isPopular && (
                                            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                                                MOST POPULAR
                                            </div>
                                        )}

                                        {/* Card Header */}
                                        <div className="mb-6">
                                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${plan.isPopular ? 'bg-blue-500/20 text-blue-400' : (plan.name === 'Pro' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-700 text-slate-400')}`}>
                                                <plan.icon size={24} />
                                            </div>
                                            <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                                            <p className="text-slate-400 text-sm">{plan.description}</p>
                                        </div>

                                        {/* Price */}
                                        <div className="mb-8">
                                            <span className="text-4xl font-bold text-white">{plan.price}</span>
                                            {plan.period && <span className="text-slate-500">{plan.period}</span>}
                                        </div>

                                        {/* Features List */}
                                        <ul className="space-y-4 mb-8 flex-1">
                                            <CheckItem>Up to 5 Alerts</CheckItem>

                                            <CheckItem>10 Keywords per Alert</CheckItem>

                                            <CheckItem>Email Support</CheckItem>

                                            {plan.name !== 'Free' ? <CheckItem>Sentiment Analysis</CheckItem> : <XItem>Sentiment Analysis</XItem>}

                                            {plan.name === 'Pro' ? (<CheckItem>PDF/Excel Report Export</CheckItem>) : plan.name === 'VIP' ? (<CheckItem>PDF Report Export</CheckItem>) : (<XItem>PDF Report Export</XItem>)}

                                            {plan.name !== 'Free' ? <CheckItem>Real-time Alerts via Email</CheckItem> : <XItem>Real-time Alerts via Email</XItem>}

                                            {plan.name !== 'Free' ? <CheckItem>Case Study Generation</CheckItem> : <XItem>Case Study Generation</XItem>}

                                            {plan.name === 'Pro' ? <CheckItem>Excel Report Export</CheckItem> : <XItem>Excel Report Export</XItem>}

                                            {plan.name === 'Pro' ? <CheckItem>Full API Access</CheckItem> : <XItem>Full API Access</XItem>}
                                        </ul>

                                        {/* Action Button */}
                                        <a href="/buy" className="block text-center w-full">
                                            <span className={`w-full py-2 px-4 rounded-xl font-semibold text-sm tracking-wide text-center leading-normal transition-all
                                                ${plan.name === 'Free' ? 'bg-slate-700 text-slate-400 cursor-default' : plan.buttonClass}`}>
                                                {plan.actionText}
                                            </span>
                                        </a>
                                    </div>
                                );
                            })}
                        </div>
                        <p className="text-center text-sm text-gray-500 mt-8">
                            *This section provides a visual demo. Actual purchase occurs on the secure checkout page.
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