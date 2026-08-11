'use client';

import * as React from 'react';
import { Share2, Printer, Linkedin, Twitter } from 'lucide-react';

interface Props {
  code: string;
  studentName: string;
  courseName: string;
}

export function ShareOnSocialButtons({ code, studentName, courseName }: Props) {
  const [copied, setCopied] = React.useState(false);

  const verifyUrl = typeof window !== 'undefined' ? window.location.href : `https://skillforge.io/certificates/verify/${code}`;
  const shareText = `I am proud to share that I earned a verified certificate for "${courseName}" on SkillForge! Check my credentials:`;

  const handleLinkedInShare = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verifyUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleTwitterShare = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(verifyUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-6">
      <div className="flex items-center gap-2">
        <button
          onClick={handleLinkedInShare}
          className="inline-flex items-center gap-2 rounded-xl border border-blue-800/30 bg-blue-950/20 px-4 py-2 text-xs font-semibold text-blue-400 transition hover:bg-blue-900/40"
        >
          <Linkedin className="h-4 w-4" />
          Share on LinkedIn
        </button>

        <button
          onClick={handleTwitterShare}
          className="inline-flex items-center gap-2 rounded-xl border border-sky-800/30 bg-sky-950/20 px-4 py-2 text-xs font-semibold text-sky-400 transition hover:bg-sky-900/40"
        >
          <Twitter className="h-4 w-4" />
          Post to X
        </button>
      </div>

      <button
        onClick={handlePrint}
        className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-800"
      >
        <Printer className="h-4 w-4" />
        Print / Save PDF
      </button>
    </div>
  );
}
