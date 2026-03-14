"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Upload, File } from "lucide-react";

interface AskDoubtProps {
    defaultSubject?: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    doubtToEdit?: any;
    classroomId?: number | null;
}

export default function AskDoubt({ defaultSubject = "", isOpen, onClose, onSuccess, doubtToEdit, classroomId = null }: AskDoubtProps) {
    const [content, setContent] = useState(doubtToEdit?.content || "");
    const [subject, setSubject] = useState(doubtToEdit?.subject || defaultSubject);
    const [imageUrl, setImageUrl] = useState(doubtToEdit?.imageUrl || "");
    const [fileName, setFileName] = useState(doubtToEdit?.imageUrl ? "Existing Image" : "");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [userName, setUserName] = useState("");

    useEffect(() => {
        if (doubtToEdit) {
            setContent(doubtToEdit.content || "");
            setSubject(doubtToEdit.subject || defaultSubject);
            setImageUrl(doubtToEdit.imageUrl || "");
            setFileName(doubtToEdit.imageUrl ? "Existing Image" : "");
        } else {
            setSubject(defaultSubject);
        }
    }, [defaultSubject, doubtToEdit]);

    useEffect(() => {
        let savedName = localStorage.getItem("anonymous_user");
        if (!savedName) {
            savedName = `Student_${Math.floor(Math.random() * 900) + 100}`;
            localStorage.setItem("anonymous_user", savedName);
        }
        setUserName(savedName);
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFileName(file.name);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!content.trim() && !imageUrl) || !subject.trim()) return;

        setIsSubmitting(true);
        try {
            const url = doubtToEdit ? `/api/doubts/action/${doubtToEdit.id}` : "/api/doubts";
            const method = doubtToEdit ? "PATCH" : "POST";
            const body = doubtToEdit 
                ? { action: "edit", content, subject, imageUrl }
                : { userName, subject, content, imageUrl, classroomId };

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                onSuccess();
            }
        } catch (error) {
            console.error("Submission failed:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight uppercase italic">
                            {doubtToEdit ? "Edit" : "Ask a"} <span className="text-blue-500">Doubt</span>
                        </h2>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">
                            Collaborative • Anonymous • {userName}
                        </p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-full text-slate-400 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 px-1">Subject / Topic</label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="e.g. Quantum Mechanics, React Hooks, etc."
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-blue-500/50 font-bold text-sm"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 px-1">Your Question (Optional if attachment added)</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Type your question here..."
                            className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all resize-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 px-1">Attach Image or File</label>
                        <div className="relative group">
                            <input
                                type="file"
                                onChange={handleFileChange}
                                accept="image/*"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="w-full py-8 border-2 border-dashed border-white/10 rounded-2xl bg-white/[0.02] flex flex-col items-center justify-center gap-3 group-hover:bg-white/[0.05] group-hover:border-blue-500/30 transition-all">
                                {fileName ? (
                                    <>
                                        <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center">
                                            <File className="w-6 h-6 text-blue-500" />
                                        </div>
                                        <span className="text-xs text-white font-bold">{fileName}</span>
                                        <button 
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); setFileName(""); setImageUrl(""); }}
                                            className="text-[10px] text-red-400 font-black uppercase tracking-widest hover:text-red-300"
                                        >
                                            Remove
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center">
                                            <Upload className="w-6 h-6 text-slate-500" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs text-slate-300 font-bold uppercase tracking-widest">Click or Drag to Upload</p>
                                            <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-1">Image files supported</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold transition-all border border-white/5"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || (!content.trim() && !imageUrl) || !subject.trim()}
                            className="flex-[2] py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    {doubtToEdit ? "Saving..." : "Posting..."}
                                </>
                            ) : (
                                doubtToEdit ? "Save Changes" : "Post Doubt"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
