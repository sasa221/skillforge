'use client';

import * as React from 'react';
import { Award, CheckCircle2, Copy, Download, ExternalLink, ShieldCheck, Sparkles } from 'lucide-react';
import { Card3DTilt } from './Card3DTilt';

type CertificateData = {
  code: string;
  studentName: string;
  courseTitle: string;
  courseDifficulty?: string;
  issuedAt: string;
  instructorName?: string;
};

export function Certificate3DCard({ cert }: { cert: CertificateData }) {
  const [copied, setCopied] = React.useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(cert.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedDate = new Date(cert.issuedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="mx-auto w-full max-w-2xl py-6">
      <Card3DTilt maxTilt={15} glareOpacity={0.35}>
        <div className="relative overflow-hidden rounded-[2.2rem] border border-amber-500/30 bg-gradient-to-b from-[#0f172a] via-[#1e1b4b] to-[#090d16] p-8 text-white shadow-[0_30px_70px_rgba(245,158,11,0.18)] backdrop-blur-xl sm:p-10">
          {/* Ambient Glows */}
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-500/20 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-cyan-500/20 blur-3xl" />

          {/* Top Metallic Header */}
          <div className="relative flex items-center justify-between border-b border-white/10 pb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 shadow-[0_0_25px_rgba(245,158,11,0.5)]">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xl font-extrabold tracking-tight text-white">SkillForge</div>
                <div className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-400">
                  Verified Certificate
                </div>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-wider text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
              Verified
            </div>
          </div>

          {/* Certificate Body */}
          <div className="relative my-8 text-center space-y-4">
            <div className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">
              This is proudly presented to
            </div>

            <div className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-200 to-amber-400 sm:text-5xl">
              {cert.studentName}
            </div>

            <p className="mx-auto max-w-md text-sm leading-relaxed text-slate-300">
              for successfully mastering all modules, guided checkpoints, and practical assessments in
            </p>

            <div className="py-2 text-2xl font-extrabold text-cyan-300 sm:text-3xl">
              {cert.courseTitle}
            </div>
          </div>

          {/* Footer & Metadata */}
          <div className="relative flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs text-slate-400">Issued On</div>
              <div className="text-sm font-semibold text-white">{formattedDate}</div>
            </div>

            <div>
              <div className="text-xs text-slate-400">Lead Educator</div>
              <div className="text-sm font-semibold text-amber-300">
                {cert.instructorName ?? 'SkillForge Master Instructor'}
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-400">Credential ID</div>
              <div className="font-mono text-xs text-cyan-400">{cert.code.slice(0, 16)}...</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={copyCode}
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-white/10"
            >
              {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Code Copied!' : 'Copy Code'}
            </button>

            <button
              onClick={() => window.print()}
              type="button"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:from-amber-400 hover:to-amber-500"
            >
              <Download className="h-4 w-4" />
              Print / Save PDF
            </button>
          </div>
        </div>
      </Card3DTilt>
    </div>
  );
}
