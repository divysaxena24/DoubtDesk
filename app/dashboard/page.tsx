"use client"

import { useEffect, useState } from "react"
import { TrendingUp, Target, Zap, MessageCircle, AlertCircle, Loader2, Sparkles, Brain, BookOpen } from "lucide-react"
import Sidebar from "@/components/Sidebar"

type AnalyticsData = {
    trendingDoubts: any[];
    mostAskedTopics: any[];
    weakTopics: any[];
}

export default function Dashboard() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchAnalytics = async () => {
        try {
            const res = await fetch('/api/analytics');
            const result = await res.json();
            setData(result);
        } catch (error) {
            console.error("Error loading analytics:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#020617]">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-8 lg:p-16 space-y-12 max-w-7xl mx-auto pb-24 text-slate-200">
            {/* Dashboard Heading */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-widest">
                        <Sparkles className="w-3.5 h-3.5" /> Neural Insights Live
                    </div>
                    <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic">
                        Dash<span className="text-blue-500">board</span>
                    </h1>
                    <p className="text-slate-400 text-lg font-medium tracking-tight">
                        Real-time intelligence on global doubt patterns.
                    </p>
                </div>
            </header>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Section 1: Trending Doubts */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                                <TrendingUp className="w-5 h-5 text-cyan-400" />
                            </div>
                            <h2 className="text-2xl font-black text-white tracking-tight">Trending Doubts</h2>
                        </div>
                    </div>
                    
                    <div className="grid gap-4">
                        {data?.trendingDoubts?.map((doubt, i) => (
                            <div key={doubt.id} className="group p-5 bg-white/5 border border-white/5 hover:border-cyan-500/30 rounded-2xl transition-all hover:bg-white/[0.08] backdrop-blur-xl flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                                        {doubt.subject}
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-bold">Recently asked</span>
                                </div>
                                <p className="text-slate-200 font-medium line-clamp-2 leading-relaxed italic">
                                    "{doubt.content}"
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Section 2: Subject Popularity */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20">
                            <Target className="w-5 h-5 text-blue-400" />
                        </div>
                        <h2 className="text-2xl font-black text-white tracking-tight">Global Topics</h2>
                    </div>

                    <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 space-y-6 backdrop-blur-md">
                        {data?.mostAskedTopics?.map((topic, i) => (
                            <div key={topic.subject} className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <span className="text-sm font-bold text-slate-300">{topic.subject}</span>
                                    <span className="text-xs font-black text-blue-400">{topic.count} Queries</span>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-1000"
                                        style={{ width: `${Math.min((topic.count / Math.max(...(data?.mostAskedTopics?.map(t => t.count) || [1]))) * 100, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Section 3: Weak Topics Insights */}
                    <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-3xl space-y-4">
                        <div className="flex items-center gap-2 text-red-400">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-xs font-black uppercase tracking-tighter text-red-400">Student Weak Points</span>
                        </div>
                        <div className="space-y-3">
                            {data?.weakTopics?.slice(0, 2).map((topic) => (
                                <div key={topic.subject} className="flex items-center gap-3 p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                                    <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                                        <BookOpen className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-[13px] font-bold text-white">{topic.subject}</p>
                                        <p className="text-[10px] text-red-400/70 font-medium">Critical intervention needed</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
