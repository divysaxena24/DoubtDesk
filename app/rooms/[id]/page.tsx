"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppUser } from "../../provider";
import { 
    Brain, 
    MessageSquare, 
    TrendingUp, 
    Users, 
    Settings, 
    Plus, 
    Loader2, 
    Sparkles, 
    ChevronLeft,
    School,
    GraduationCap,
    Copy,
    Check,
    Calendar,
    ArrowRight
} from "lucide-react";
import AskDoubt from "@/components/AskDoubt";
import DoubtCard from "@/components/DoubtCard";
import Dashboard from "@/app/dashboard/page"; // We can reuse or adapt the Analytics view
import AskAIView from "@/components/AskAIView"; // We'll need to create this or adapt AskAI logic
import { toast } from "sonner";

interface Classroom {
    id: number;
    name: string;
    university: string;
    year: string;
    teacherEmail: string;
    inviteCode: string;
    role: string;
}

export default function ClassroomPage() {
    const { id } = useParams();
    const router = useRouter();
    const { appUser } = useAppUser();
    
    const [classroom, setClassroom] = useState<Classroom | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("ask-ai");
    const [doubts, setDoubts] = useState([]);
    const [doubtsLoading, setDoubtsLoading] = useState(false);
    const [isAskModalOpen, setIsAskModalOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetchClassroom();
    }, [id]);

    const fetchClassroom = async () => {
        try {
            const res = await fetch(`/api/rooms`);
            const data = await res.json();
            
            // Search in joined rooms first
            let currentRoom = data.joined?.find((r: Classroom) => r.id === Number(id));
            
            // If not found, check recommended (though access might be limited)
            if (!currentRoom) {
                currentRoom = data.recommended?.find((r: Classroom) => r.id === Number(id));
            }

            if (currentRoom) {
                setClassroom(currentRoom);
            } else {
                toast.error("Classroom not found or access denied");
                router.push("/rooms");
            }
        } catch (err) {
            toast.error("Error loading classroom");
        } finally {
            setLoading(false);
        }
    };

    const fetchScopedDoubts = async () => {
        setDoubtsLoading(true);
        try {
            const userName = localStorage.getItem("anonymous_user");
            const res = await fetch(`/api/doubts?classroomId=${id}&userName=${userName}`);
            const data = await res.json();
            setDoubts(data);
        } catch (err) {
            toast.error("Failed to load doubts");
        } finally {
            setDoubtsLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === "community") {
            fetchScopedDoubts();
        }
    }, [activeTab]);

    const copyCode = () => {
        if (classroom?.inviteCode) {
            navigator.clipboard.writeText(classroom.inviteCode);
            setCopied(true);
            toast.success("Invite code copied!");
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#020617] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            </div>
        );
    }

    if (!classroom) return null;

    return (
        <div className="min-h-screen bg-[#020617] text-white">
            {/* Header / Banner */}
            <div className="bg-white/[0.02] border-b border-white/5 pt-12 pb-8 px-6 md:px-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/5 blur-[120px] rounded-full translate-x-1/3 -translate-y-1/3" />
                
                <div className="max-w-7xl mx-auto relative z-10">
                    <button 
                        onClick={() => router.push("/rooms")}
                        className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-8 text-xs font-black uppercase tracking-widest"
                    >
                        <ChevronLeft className="w-4 h-4" /> Back to Campus
                    </button>

                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center text-3xl font-black italic">
                                    {classroom.name.charAt(0)}
                                </div>
                                <div>
                                    <h1 className="text-5xl font-black uppercase italic tracking-tighter">
                                        {classroom.name}
                                    </h1>
                                    <div className="flex items-center gap-4 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">
                                        <span className="flex items-center gap-1.5"><School className="w-3.5 h-3.5" /> {classroom.university}</span>
                                        <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {classroom.year}</span>
                                        <span className="flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded-md border border-white/10">{classroom.role}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {classroom.role === 'teacher' && (
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-2 min-w-[200px]">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Access Key</span>
                                <div className="flex items-center justify-between gap-4">
                                    <code className="text-xl font-black text-blue-400 tracking-[0.2em]">{classroom.inviteCode}</code>
                                    <button 
                                        onClick={copyCode}
                                        className="p-2 hover:bg-white/10 rounded-lg transition-colors border border-white/5"
                                    >
                                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex items-center gap-4 mt-12 overflow-x-auto pb-1 scrollbar-hide">
                        {[
                            { id: "ask-ai", label: "Ask AI", icon: Brain },
                            { id: "community", label: "Community", icon: MessageSquare },
                            { id: "insights", label: "Insights", icon: TrendingUp }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border shrink-0 ${
                                    activeTab === tab.id 
                                    ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20" 
                                    : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white"
                                }`}
                            >
                                <tab.icon className="w-4 h-4" /> {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-7xl mx-auto p-6 md:p-12">
                {activeTab === "ask-ai" && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* We'll use a modified AskAIView here */}
                        <div className="bg-white/5 border border-white/10 rounded-[3rem] p-8 md:p-16 text-center space-y-6">
                            <div className="w-20 h-20 bg-blue-500/10 border border-blue-500/20 rounded-3xl flex items-center justify-center mx-auto">
                                <Brain className="w-10 h-10 text-blue-500" />
                            </div>
                            <h2 className="text-3xl font-black uppercase tracking-tight italic">Neural Resolve Scoped</h2>
                            <p className="text-slate-500 max-w-md mx-auto font-medium">
                                Ask Doubts directly to the AI. All queries and solutions will be saved specifically to this classroom for future reference by everyone.
                            </p>
                            <div className="pt-8">
                                <AskAIView classroomId={Number(id)} />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "community" && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-black uppercase italic tracking-tight">Classroom <span className="text-blue-500">Board</span></h2>
                            <button 
                                onClick={() => setIsAskModalOpen(true)}
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" /> New Post
                            </button>
                        </div>

                        {doubtsLoading ? (
                            <div className="h-[300px] flex items-center justify-center">
                                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                            </div>
                        ) : doubts.length === 0 ? (
                            <div className="py-24 text-center space-y-4 bg-white/5 border border-dashed border-white/10 rounded-[2.5rem]">
                                <MessageSquare className="w-12 h-12 text-slate-700 mx-auto" />
                                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No community posts yet.</p>
                                <button onClick={() => setIsAskModalOpen(true)} className="text-blue-500 font-black uppercase tracking-widest text-[10px] hover:underline underline-offset-4">Be the first to ask</button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {doubts.map((doubt: any) => (
                                    <DoubtCard key={doubt.id} doubt={doubt} onUpdate={fetchScopedDoubts} />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "insights" && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                         {/* We can pass classroomId to the dashboard view */}
                         <ClassroomInsightsView classroomId={Number(id)} />
                    </div>
                )}
            </div>

            {isAskModalOpen && (
                <AskDoubt 
                    isOpen={isAskModalOpen}
                    onClose={() => setIsAskModalOpen(false)}
                    onSuccess={() => {
                        setIsAskModalOpen(false);
                        fetchScopedDoubts();
                    }}
                    classroomId={Number(id)}
                    defaultSubject="General"
                />
            )}
        </div>
    );
}

// Simple implementations for sub-views or we can extract them later
function ClassroomInsightsView({ classroomId }: { classroomId: number }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/analytics?classroomId=${classroomId}`)
            .then(res => res.json())
            .then(d => {
                setData(d);
                setLoading(false);
            });
    }, [classroomId]);

    if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-12">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 space-y-6">
                    <h3 className="text-xl font-black uppercase italic tracking-tight flex items-center gap-3">
                        <TrendingUp className="w-5 h-5 text-blue-500" /> Trending in Class
                    </h3>
                    <div className="space-y-4">
                        {data?.trendingDoubts.map((d: any) => (
                            <div key={d.id} className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                <p className="text-sm font-bold text-slate-300">"{d.content}"</p>
                                <span className="text-[9px] font-black uppercase text-blue-500 mt-2 block tracking-widest">{d.subject}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 space-y-6">
                    <h3 className="text-xl font-black uppercase italic tracking-tight flex items-center gap-3">
                        <GraduationCap className="w-5 h-5 text-cyan-500" /> Topic Proficiency
                    </h3>
                    <div className="space-y-6">
                        {data?.mostAskedTopics.map((t: any) => (
                            <div key={t.subject} className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-400">{t.subject}</span>
                                    <span className="text-xs font-black text-white">{t.count} doubts</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500" style={{ width: `${(t.count / 10) * 100}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
             </div>
        </div>
    );
}

