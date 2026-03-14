"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppUser } from "../provider";
import { GraduationCap, School, Mail, UserCircle, Loader2, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function OnboardingPage() {
    const { appUser, refresh } = useAppUser();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        university: "",
        year: "1st Year",
        role: "student",
        collegeEmail: ""
    });

    useEffect(() => {
        if (appUser?.onboarded) {
            router.push("/rooms");
        }
    }, [appUser, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await fetch("/api/user/onboard", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                toast.success("Welcome aboard!");
                await refresh();
                router.push("/rooms");
            } else {
                toast.error("Failed to save details. Please try again.");
            }
        } catch (error) {
            toast.error("Something went wrong.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="w-full max-w-xl relative animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="text-center mb-10 space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-widest">
                        <Sparkles className="w-3.5 h-3.5" /> Initialize Experience
                    </div>
                    <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic">
                        Academic<span className="text-blue-500"> Identity</span>
                    </h1>
                    <p className="text-slate-400 font-medium text-lg">
                        Tailoring DoubtDesk for your specific learning ecosystem.
                    </p>
                </div>

                <div className="bg-white/5 border border-white/10 p-8 md:p-10 rounded-[2.5rem] backdrop-blur-2xl shadow-2xl space-y-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Role Selection */}
                        <div className="grid grid-cols-3 gap-3">
                            {['student', 'teacher', 'admin'].map((role) => (
                                <button
                                    key={role}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: role as any })}
                                    className={`py-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${
                                        formData.role === role 
                                        ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20" 
                                        : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                                    }`}
                                >
                                    {role === 'student' && <GraduationCap className="w-5 h-5" />}
                                    {role === 'teacher' && <UserCircle className="w-5 h-5" />}
                                    {role === 'admin' && <ShieldCheck className="w-5 h-5" />}
                                    <span className="text-[10px] font-black uppercase tracking-widest">{role}</span>
                                </button>
                            ))}
                        </div>

                        {/* University Name */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 px-1 flex items-center gap-2">
                                <School className="w-3 h-3" /> University / College Name
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.university}
                                onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                                placeholder="e.g. Stanford University"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-all font-medium"
                            />
                        </div>

                        {/* College Email & Year */}
                        <div className={`grid grid-cols-1 ${formData.role === 'student' ? 'md:grid-cols-2' : ''} gap-6`}>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 px-1 flex items-center gap-2">
                                    <Mail className="w-3 h-3" /> College Email
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={formData.collegeEmail}
                                    onChange={(e) => setFormData({ ...formData, collegeEmail: e.target.value })}
                                    placeholder="yourname@college.edu"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-all font-medium"
                                />
                            </div>

                            {formData.role === 'student' && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 px-1">Your Year</label>
                                    <select
                                        value={formData.year}
                                        onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-blue-500/50 transition-all font-medium appearance-none cursor-pointer"
                                    >
                                        <option className="bg-[#020617]" value="1st Year">1st Year</option>
                                        <option className="bg-[#020617]" value="2nd Year">2nd Year</option>
                                        <option className="bg-[#020617]" value="3rd Year">3rd Year</option>
                                        <option className="bg-[#020617]" value="Final Year">Final Year</option>
                                        <option className="bg-[#020617]" value="Alumni/Other">Other</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-3xl font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-blue-600/30 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <>
                                    Complete Setup <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                        Your identity helps us connect you with relevant classmates & classrooms.
                    </p>
                </div>
            </div>
        </div>
    );
}
