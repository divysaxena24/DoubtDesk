"use client"

import { useState, useRef } from 'react';
import {
    Send, Zap, BookOpen, Lightbulb, Loader2, RefreshCcw,
    ImagePlus, X, Type, Camera, ListOrdered, Brain, CheckCircle2, AlertCircle
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';

type SolveType = 'standard' | 'simple' | 'exam';

const SECTION_META: Record<string, { icon: React.ReactNode; color: string; badge: string }> = {
    'Step-by-step explanation': {
        icon: <ListOrdered className="w-5 h-5" />,
        color: 'from-blue-500 to-cyan-400',
        badge: 'bg-blue-500/15 border-blue-500/30 text-blue-400',
    },
    'Simplified explanation': {
        icon: <Brain className="w-5 h-5" />,
        color: 'from-purple-500 to-pink-400',
        badge: 'bg-purple-500/15 border-purple-500/30 text-purple-400',
    },
    'Final Answer': {
        icon: <CheckCircle2 className="w-5 h-5" />,
        color: 'from-emerald-500 to-teal-400',
        badge: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
    },
};

function parseSections(text: string): { title: string; content: string }[] {
    const parts = text.split(/^## /m).filter(Boolean);
    return parts.map(part => {
        const newline = part.indexOf('\n');
        const title = newline === -1 ? part.trim() : part.slice(0, newline).trim();
        const content = newline === -1 ? '' : part.slice(newline + 1).trim();
        return { title, content };
    });
}

const EXAMPLE_PROMPTS = [
    "Solve x² - 5x + 6 = 0 using the quadratic formula",
    "Explain Newton's Second Law of Motion",
    "What is Ohm's Law? Give an example.",
];

export default function AskAIView({ classroomId = null }: { classroomId?: number | null }) {
    const [inputMode, setInputMode] = useState<'text' | 'image'>('text');
    const [prompt, setPrompt] = useState('');
    const [imageBase64, setImageBase64] = useState<string | null>(null);
    const [response, setResponse] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [currentType, setCurrentType] = useState<SolveType>('standard');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => setImageBase64(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleAskAI = async (type: SolveType = 'standard') => {
        if (!prompt.trim() && !imageBase64) return;
        setIsLoading(true);
        setCurrentType(type);
        setErrorMsg(null);
        setResponse(null);
        try {
            const res = await fetch('/api/ask-ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, type, imageBase64, classroomId })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || "The AI couldn't process your request.");
            setResponse(data.reply);
        } catch (err: any) {
            setErrorMsg(err.message || "Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const sections = response ? parseSections(response) : [];

    return (
        <div className="space-y-8 text-left">
            <div className="bg-slate-900/60 border border-white/8 rounded-3xl overflow-hidden shadow-2xl">
                <div className="flex border-b border-white/5">
                    <button
                        onClick={() => { setInputMode('text'); setImageBase64(null); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs font-black uppercase tracking-widest transition-all ${inputMode === 'text' ? 'text-blue-400 border-b-2 border-blue-500 bg-blue-500/5' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <Type className="w-4 h-4" /> Type Question
                    </button>
                    <button
                        onClick={() => { setInputMode('image'); setPrompt(''); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs font-black uppercase tracking-widest transition-all ${inputMode === 'image' ? 'text-purple-400 border-b-2 border-purple-500 bg-purple-500/5' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <Camera className="w-4 h-4" /> Upload Image
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {inputMode === 'text' ? (
                        <>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Type your doubt here..."
                                rows={4}
                                className="w-full bg-slate-950/60 border border-white/8 rounded-2xl px-5 py-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all resize-none font-medium text-sm leading-relaxed"
                                disabled={isLoading}
                            />
                        </>
                    ) : (
                        <>
                            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                            {!imageBase64 ? (
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full h-44 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all group"
                                >
                                    <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-500/20">
                                        <ImagePlus className="w-6 h-6 text-purple-400" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-white font-bold text-xs uppercase tracking-widest">Select Image</p>
                                    </div>
                                </button>
                            ) : (
                                <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-slate-950">
                                    <img src={imageBase64} alt="Uploaded" className="w-full max-h-64 object-contain" />
                                    <button
                                        onClick={() => setImageBase64(null)}
                                        className="absolute top-3 right-3 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg"
                                    >
                                        <X className="w-4 h-4 text-white" />
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    <div className="flex justify-end">
                        <button
                            onClick={() => handleAskAI('standard')}
                            disabled={isLoading || (!prompt.trim() && !imageBase64)}
                            className="flex items-center gap-2.5 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl shadow-blue-600/20 disabled:opacity-40"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            Solve Scoped
                        </button>
                    </div>
                </div>
            </div>

            {errorMsg && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-xs font-bold">
                    <AlertCircle className="w-4 h-4" /> {errorMsg}
                </div>
            )}

            {response && (
                <div className="space-y-4">
                    {sections.map((sec, idx) => {
                        const meta = SECTION_META[sec.title];
                        return (
                            <div key={idx} className="bg-slate-900/60 border border-white/8 rounded-3xl overflow-hidden shadow-lg">
                                <div className={`flex items-center gap-3 px-6 py-4 border-b border-white/5`}>
                                    {meta && (
                                        <div className={`flex items-center justify-center w-8 h-8 rounded-xl bg-white/5 border ${meta.badge}`}>
                                            {meta.icon}
                                        </div>
                                    )}
                                    <h2 className="text-white font-black tracking-tight text-sm uppercase italic">{sec.title}</h2>
                                </div>
                                <div className="px-6 py-6 prose prose-invert max-w-none">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkMath, remarkGfm]}
                                        rehypePlugins={[rehypeKatex]}
                                    >
                                        {sec.content}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
