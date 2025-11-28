// frontend/app/buy/page.jsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    Check, X, Loader2, Shield,
    Zap, Crown, ArrowLeft,
    Clock
} from 'lucide-react';
import { useAuth } from '@/app/providers.jsx';
import { createSubRequest } from '@/utils/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

// --- Payment Modal ---
function PaymentModal({ plan, onClose }) {
    const [isLoading, setIsLoading] = useState(false);

    const qrData = `Payment for ${plan.name} Plan: $${plan.price} USD`;
    const qrLink = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;

    // Hàm xử lý khi bấm nút xác nhận thanh toán
    const handlePaymentCompleted = async () => {
        if (isLoading) return;
        setIsLoading(true);

        try {
            // Gọi API gửi yêu cầu duyệt
            await createSubRequest({
                plan: plan.name,
                amount: plan.price
            });

            // 1. Thêm Toast Success Confirmation
            toast.success(`Upgrade request for ${plan.name} sent! Please wait for Admin approval.`, {
                autoClose: 5000,
                containerId: "dashboard-toast" // Dùng container ID từ GlobalToast
            });

            onClose(); // Đóng modal
        } catch (error) {
            console.error(error);
            // 2. Thêm Toast Error
            toast.error(error.message || 'Failed to send request. Please try again.', {
                containerId: "dashboard-toast"
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-slate-800 border border-slate-600 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-5 border-b border-slate-700 bg-slate-900/50 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        {plan.name === 'VIP' ?
                            <Zap className="text-blue-400" size={24} /> :
                            <Crown className="text-yellow-400" size={24} />
                        }
                        Upgrade to {plan.name}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Body: QR Code */}
                <div className="p-6 flex flex-col items-center text-center space-y-6">
                    <div className="space-y-2">
                        <p className="text-slate-300 text-sm">Scan QR code to pay via Banking App</p>
                        <p className="text-2xl font-bold text-green-400">
                            ${plan.price} USD
                            <span className="text-sm text-slate-400"> / month</span>
                        </p>
                    </div>

                    <div className="relative bg-white p-4 rounded-xl shadow-lg group">
                        <img
                            src={qrLink}
                            alt="Payment QR Code"
                            className="w-48 h-48 object-contain"
                        />
                        {/* Hiệu ứng quét */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-scan"></div>
                    </div>

                    <div className="text-sm text-slate-400 bg-slate-900/50 p-3 rounded-lg w-full">
                        <p><strong>Content:</strong> {plan.name} [Your_Email]</p>
                        <p className="mt-1 text-xs">System will auto-upgrade after Admin approval (1-5 mins).</p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-700 bg-slate-900/50 flex justify-center">
                    <button
                        onClick={handlePaymentCompleted}
                        disabled={isLoading}
                        className={`px-6 py-2 rounded-full font-medium transition-all flex items-center gap-2
                            ${isLoading
                                ? 'bg-slate-600 cursor-not-allowed text-slate-300'
                                : 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20'
                            }`}
                    >
                        {isLoading && <Loader2 className="animate-spin" size={18} />}
                        {isLoading ? 'Processing...' : 'I have completed payment'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- Main Page ---
export default function BuyPage() {
    const [modalPlan, setModalPlan] = useState(null);
    const { user, isLoading: isAuthLoading } = useAuth();

    const plans = [
        {
            name: 'Free',
            price: 'Free',
            description: 'Essential tools for small monitoring needs.',
            icon: Shield,
            features: [
                { text: 'Up to 5 Alerts', included: true },
                { text: '10 Keywords per Alert', included: true },
                { text: 'Email Support', included: true },
                { text: 'Sentiment Analysis', included: false },
                { text: 'PDF Report Export', included: false },
                { text: 'Excel Report Export', included: false },
                { text: 'Case Study Generation', included: false },
            ],
            buttonText: 'Default Plan',
            isPopular: false,
            action: null
        },
        {
            name: 'VIP',
            price: '20',
            period: '/month',
            description: 'For professionals and small teams.',
            icon: Zap,
            features: [
                { text: 'Up to 50 Alerts', included: true },
                { text: '150 Keywords per Alert', included: true },
                { text: 'Basic AI Sentiment', included: true },
                { text: 'Priority Email Support', included: true },
                { text: 'PDF Report Export', included: true },
                { text: 'Case Study Generation', included: true },
                { text: 'Real-time Alerts via Email', included: true },
                { text: 'Excel Report Export', included: false },
            ],
            buttonText: 'Upgrade Now',
            isPopular: true,
            action: () => setModalPlan({ name: 'VIP', price: '20' })
        },
        {
            name: 'Pro',
            price: '50',
            period: '/month',
            description: 'Full power for enterprise management.',
            icon: Crown,
            features: [
                { text: 'Up to 500 Alerts', included: true },
                { text: '2500 Keywords per Alert', included: true },
                { text: 'Advanced AI Sentiment', included: true },
                { text: 'Dedicated 24/7 Support', included: true },
                { text: 'PDF Report Export', included: true },
                { text: 'Excel Report Export', included: true },
                { text: 'Case Study Generation', included: true },
                { text: 'Real-time Alerts via Email', included: true },
                { text: 'Full API Access', included: true },
            ],
            buttonText: 'Upgrade Now',
            isPopular: false,
            action: () => setModalPlan({ name: 'Pro', price: '50' })
        }
    ];

    return (
        <div className="min-h-screen p-4 sm:p-8 text-gray-200 flex flex-col items-center">

            {/* --- Nút Back --- */}
            <div className="w-full max-w-7xl mb-4">
                <Link href="/dashboard" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors">
                    <ArrowLeft size={20} />
                    Back to Dashboard
                </Link>
            </div>

            {/* Header Section */}
            <div className="text-center max-w-2xl mb-12 mt-4">
                <h1 className="text-3xl sm:text-5xl font-bold text-white mb-4">
                    Simple, Transparent Pricing
                </h1>
                <p className="text-slate-400 text-lg">
                    Choose the plan that fits your brand's safety needs. Upgrade anytime.
                </p>
            </div>

            {/* Hiển thị gói hiện tại & ngày hết hạn */}
            {!isAuthLoading && user && (
                <div className="w-full max-w-7xl text-center mb-8 animate-fadeIn">
                    <div className="inline-block bg-slate-800/80 border border-slate-700 rounded-xl p-4 shadow-lg backdrop-blur-sm">
                        <p className="text-lg text-slate-300">
                            Your current plan:
                            <span className={`font-bold ml-2 text-xl ${user.subscriptionTier === 'Pro' ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]' :
                                user.subscriptionTier === 'VIP' ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]' :
                                    'text-slate-400'
                                }`}>
                                {user.subscriptionTier}
                            </span>
                        </p>

                        {/* Hiển thị ngày hết hạn (Local Time) */}
                        {user.subscriptionExpiresAt ? (
                            <p className="text-sm text-red-300 mt-2 flex items-center justify-center gap-2 bg-red-900/20 px-3 py-1 rounded-md border border-red-500/20">
                                <Clock size={16} />
                                Expires on: <strong>{format(new Date(user.subscriptionExpiresAt), 'PPP p')}</strong>
                            </p>
                        ) : (
                            user.subscriptionTier !== 'Free' && (
                                <p className="text-sm text-green-400 mt-2 flex items-center justify-center gap-2">
                                    <Check size={16} />
                                    No expiration date (Lifetime / Free)
                                </p>
                            )
                        )}
                    </div>
                </div>
            )}

            {/* Pricing Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-7xl">
                {plans.map((plan, index) => {
                    const isCurrentPlan = !isAuthLoading && user && user.subscriptionTier === plan.name;
                    // Khóa: Đang là Pro và cố gắng mua VIP (Hạ cấp)
                    const isDowngradeToVIP = !isAuthLoading && user && user.subscriptionTier === 'Pro' && plan.name === 'VIP';
                    // Điều kiện Khóa chung:
                    const isDisabled = !plan.action || isCurrentPlan || isDowngradeToVIP;


                    return (
                        <div
                            key={index}
                            className={`relative flex flex-col p-8 rounded-2xl transition-all duration-300 ${isCurrentPlan
                                ? 'bg-slate-800 border-2 border-green-500 shadow-[0_0_40px_rgba(74,222,128,0.15)]'
                                : plan.isPopular
                                    ? 'bg-slate-800 border-2 border-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.15)] transform hover:-translate-y-2'
                                    : 'bg-slate-800/50 border border-slate-700 hover:bg-slate-800'
                                }`}
                        >

                            {isCurrentPlan && (
                                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                                    CURRENT PLAN
                                </div>
                            )}

                            {plan.isPopular && !isCurrentPlan && (
                                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                                    MOST POPULAR
                                </div>
                            )}

                            {/* Card Header */}
                            <div className="mb-6">
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${plan.isPopular ? 'bg-blue-500/20 text-blue-400' : (plan.name === 'Pro' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-700 text-slate-400')
                                    }`}>
                                    <plan.icon size={24} />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                                <p className="text-slate-400 text-sm">{plan.description}</p>
                            </div>

                            {/* Price */}
                            <div className="mb-8">
                                <span className="text-4xl font-bold text-white">${plan.price}</span>
                                {plan.period && <span className="text-slate-500">{plan.period}</span>}
                            </div>

                            {/* Features List */}
                            <ul className="space-y-4 mb-8 flex-1">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        {feature.included ? (
                                            <Check className="text-green-400 shrink-0" size={20} />
                                        ) : (
                                            <X className="text-slate-600 shrink-0" size={20} />
                                        )}
                                        <span className={feature.included ? 'text-slate-200' : 'text-slate-500 line-through'}>
                                            {feature.text}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            {/* Action Button */}
                            <button
                                onClick={plan.action}
                                disabled={isDisabled} // Sử dụng biến isDisabled
                                className={`w-full py-3 rounded-xl font-bold transition-all ${isDisabled
                                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                    : plan.action
                                        ? (plan.isPopular
                                            ? 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-lg'
                                            : 'bg-slate-700 hover:bg-slate-600 text-white')
                                        : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                    }`}
                            >
                                {isCurrentPlan
                                    ? 'Your Current Plan'
                                    : isDowngradeToVIP
                                        ? 'Downgrade Not Allowed' // Nội dung khi khóa nút Downgrade
                                        : plan.buttonText}
                            </button>
                        </div>
                    )
                })}
            </div>

            {/* Payment Modal */}
            {modalPlan && <PaymentModal plan={modalPlan} onClose={() => setModalPlan(null)} />}
        </div>
    );
}