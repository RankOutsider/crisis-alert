import Link from 'next/link';

export default function HomePage() {
    return (
        <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-gray-200 p-8">
            <div className="text-center max-w-5xl">
                <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 mb-4">
                    Crisis Alert
                </h1>
                <p className="text-lg md:text-2xl mb-12 text-gray-300">
                    Monitor and alert brand crises across all social media platforms.
                </p>

                <div className="flex flex-col md:flex-row justify-center items-center gap-6 mt-8">
                    <Link href="/register">
                        <span className="flex items-center justify-center h-12 px-10 font-semibold rounded-full text-white bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 transition-all duration-300 transform hover:scale-105 shadow-lg text-lg">
                            Get Started
                        </span>
                    </Link>
                    <Link href="/login">
                        <span className="flex items-center justify-center h-12 px-10 font-semibold rounded-full text-white bg-transparent border-2 border-blue-400 hover:bg-blue-400/20 transition-all duration-300 transform hover:scale-105 text-lg">
                            Login
                        </span>
                    </Link>
                </div>

                <div className="grid md:grid-cols-3 gap-8 my-12 text-left">
                    <div className="p-6 rounded-lg shadow-lg bg-gray-900/60 border border-gray-700 transition-all duration-300 hover:border-blue-500 hover:scale-105">
                        <h3 className="font-bold text-xl mb-2 text-blue-400">Real-time Collection</h3>
                        <p className="text-gray-400">Automatically scan and collect discussions, posts, and comments related to your brand from millions of sources.</p>
                    </div>
                    <div className="p-6 rounded-lg shadow-lg bg-gray-900/60 border border-gray-700 transition-all duration-300 hover:border-blue-500 hover:scale-105">
                        <h3 className="font-bold text-xl mb-2 text-blue-400">Analysis & Alerts</h3>
                        <p className="text-gray-400">Use AI to analyze sentiment, identify potential risks, and send instant alerts at the first sign of a crisis.</p>
                    </div>
                    <div className="p-6 rounded-lg shadow-lg bg-gray-900/60 border border-gray-700 transition-all duration-300 hover:border-blue-500 hover:scale-105">
                        <h3 className="font-bold text-xl mb-2 text-blue-400">Visual Reports</h3>
                        <p className="text-gray-400">Provide detailed charts and statistics, helping you to easily grasp the situation and make accurate decisions.</p>
                    </div>
                </div>

            </div>
        </main>
    );
}