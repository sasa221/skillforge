'use client';

import { cn } from '@/lib/utils';

type MediaVideoFrameProps = {
  url: string;
  title?: string | null;
  caption?: string | null;
  posterUrl?: string | null;
  className?: string;
};

type ResolvedSource =
  | { kind: 'iframe'; src: string }
  | { kind: 'video'; src: string };

function resolveVideoSource(url: string): ResolvedSource {
  const trimmed = url.trim();
  const youtubeMatch =
    trimmed.match(/youtube\.com\/watch\?v=([^&]+)/i) ??
    trimmed.match(/youtu\.be\/([^?&]+)/i) ??
    trimmed.match(/youtube\.com\/embed\/([^?&]+)/i);
  if (youtubeMatch?.[1]) {
    return { kind: 'iframe', src: `https://www.youtube.com/embed/${youtubeMatch[1]}` };
  }

  const vimeoMatch =
    trimmed.match(/vimeo\.com\/(\d+)/i) ??
    trimmed.match(/player\.vimeo\.com\/video\/(\d+)/i);
  if (vimeoMatch?.[1]) {
    return { kind: 'iframe', src: `https://player.vimeo.com/video/${vimeoMatch[1]}` };
  }

  const loomMatch =
    trimmed.match(/loom\.com\/share\/([^?&]+)/i) ??
    trimmed.match(/loom\.com\/embed\/([^?&]+)/i);
  if (loomMatch?.[1]) {
    return { kind: 'iframe', src: `https://www.loom.com/embed/${loomMatch[1]}` };
  }

  return { kind: 'video', src: trimmed };
}

export function MediaVideoFrame({
  url,
  title,
  caption,
  posterUrl,
  className,
}: MediaVideoFrameProps) {
  const source = resolveVideoSource(url);

  return (
    <div className={cn('space-y-3', className)}>
      <div className="overflow-hidden rounded-[1.6rem] border border-[var(--site-border,#dbe6f2)] bg-[var(--site-surface,#fff)] shadow-[0_18px_40px_var(--site-shadow,rgba(15,31,56,0.05))]">
        <div className="aspect-video bg-[var(--site-surface-alt,#f8fbff)]">
          {source.kind === 'iframe' ? (
            <iframe
              src={source.src}
              title={title ?? 'Video lesson'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="h-full w-full border-0"
            />
          ) : (
            <video
              controls
              preload="metadata"
              playsInline
              poster={posterUrl ?? undefined}
              className="h-full w-full bg-slate-950 object-cover"
            >
              <source src={source.src} />
            </video>
          )}
        </div>
      </div>

      {title || caption ? (
        <div className="rounded-[1.2rem] border border-[var(--site-border,#dbe6f2)] bg-[var(--site-surface-alt,#f8fbff)] px-4 py-3">
          {title ? <div className="text-sm font-semibold text-[var(--site-text,#10213c)]">{title}</div> : null}
          {caption ? <div className="mt-1 text-sm leading-7 text-[var(--site-muted,#6f86a6)]">{caption}</div> : null}
        </div>
      ) : null}
    </div>
  );
}
