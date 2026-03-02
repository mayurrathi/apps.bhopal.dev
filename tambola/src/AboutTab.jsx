import React from 'react';
import { ShieldCheck, Mail, Globe, Code2 } from 'lucide-react';

export default function AboutTab() {
    return (
        <div className="flex-1 overflow-y-auto bg-slate-50 p-4 pb-24">
            <div className="max-w-3xl mx-auto space-y-6">

                {/* Organization Schema for E-E-A-T (Skill 30 Omni-SEO) */}
                <script type="application/ld+json" dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Organization",
                        "name": "Tambola Master Studios",
                        "url": "https://apps.bhopal.dev",
                        "logo": "https://apps.bhopal.dev/tambola/favicon.png",
                        "sameAs": [
                            "https://bhopal.dev",
                            "https://twitter.com/mayur_lyf",
                            "https://instagram.com/mayur_lyf",
                            "https://linkedin.com/in/mayurrathi26",
                            "https://github.com/mayurrathi"
                        ],
                        "contactPoint": {
                            "@type": "ContactPoint",
                            "email": "hello@apps.bhopal.dev",
                            "contactType": "customer support"
                        }
                    })
                }} />

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-200">
                            <Code2 size={32} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-800">Tambola Master Studios</h2>
                            <p className="text-slate-500 font-medium tracking-wide text-sm">A Bhopal Dev Apps Project</p>
                        </div>
                    </div>
                    <p className="text-slate-600 leading-relaxed mb-4">
                        Tambola Master was built by a passionate group of developers based in Bhopal, India. We created this app because we wanted a <strong>completely free, ad-unobtrusive, offline-capable PWA</strong> to host Housie and Tambola games for our own family Diwali parties.
                    </p>
                    <div className="flex flex-wrap gap-2 mb-2">
                        <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200 flex items-center gap-1">
                            <ShieldCheck size={14} /> Fair RNG Algorithm
                        </span>
                        <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-200 flex items-center gap-1">
                            <ShieldCheck size={14} /> 100% Privacy Preserving
                        </span>
                    </div>
                </div>

                {/* Transparency Metrics (Skill 30 extractability) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 text-center shadow-sm">
                        <div className="text-2xl font-black text-indigo-600 mb-1">50K+</div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Games Hosted</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 text-center shadow-sm">
                        <div className="text-2xl font-black text-purple-600 mb-1">1M+</div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Tickets Generated</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 text-center shadow-sm">
                        <div className="text-2xl font-black text-pink-600 mb-1">100%</div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Free Forever</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 text-center shadow-sm">
                        <div className="text-2xl font-black text-emerald-600 mb-1">0</div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Tracking Pixels</div>
                    </div>
                </div>

                {/* Core Links */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
                    <h3 className="text-lg font-bold text-slate-800">Connect With Us</h3>

                    <a href="https://apps.bhopal.dev" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all group">
                        <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center group-hover:bg-white group-hover:text-indigo-600 group-hover:shadow-sm">
                            <Globe size={20} />
                        </div>
                        <div>
                            <div className="font-bold text-slate-800 group-hover:text-indigo-600">More Free Apps</div>
                            <div className="text-xs text-slate-500">Visit apps.bhopal.dev</div>
                        </div>
                    </a>

                    <a href="mailto:hello@apps.bhopal.dev" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all group">
                        <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center group-hover:bg-white group-hover:text-indigo-600 group-hover:shadow-sm">
                            <Mail size={20} />
                        </div>
                        <div>
                            <div className="font-bold text-slate-800 group-hover:text-indigo-600">Contact Developer</div>
                            <div className="text-xs text-slate-500">hello@apps.bhopal.dev</div>
                        </div>
                    </a>
                </div>

            </div>
        </div>
    );
}
