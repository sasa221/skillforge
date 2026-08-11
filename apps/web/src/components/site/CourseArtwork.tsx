import { BarChart3, BrainCircuit, Code2, Database, LayoutTemplate, type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

const artworkThemes: Array<{
  shell: string;
  accent: string;
  overlay: string;
  icon: LucideIcon;
}> = [
  {
    shell: 'bg-[linear-gradient(135deg,#0f2741_0%,#1f5d88_45%,#6dbff9_100%)]',
    accent: 'bg-white/18',
    overlay:
      'before:absolute before:inset-x-6 before:top-6 before:h-32 before:rounded-[1.4rem] before:border before:border-white/25 before:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_58%)]',
    icon: Code2,
  },
  {
    shell: 'bg-[linear-gradient(135deg,#3b2413_0%,#8e4d11_42%,#f4b762_100%)]',
    accent: 'bg-black/10',
    overlay:
      'before:absolute before:right-8 before:top-8 before:h-28 before:w-28 before:rounded-full before:border before:border-white/25 before:bg-[radial-gradient(circle,rgba(255,255,255,0.28),transparent_62%)]',
    icon: BrainCircuit,
  },
  {
    shell: 'bg-[linear-gradient(135deg,#12343d_0%,#1f6e74_45%,#80d2be_100%)]',
    accent: 'bg-white/14',
    overlay:
      'before:absolute before:left-6 before:top-8 before:h-24 before:w-40 before:rounded-[1.25rem] before:border before:border-white/20 before:bg-[linear-gradient(180deg,rgba(255,255,255,0.14),transparent)]',
    icon: BarChart3,
  },
  {
    shell: 'bg-[linear-gradient(135deg,#2f2453_0%,#5742a4_45%,#97b2ff_100%)]',
    accent: 'bg-white/16',
    overlay:
      'before:absolute before:left-8 before:bottom-8 before:h-28 before:w-28 before:rounded-[1.5rem] before:border before:border-white/24 before:bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.22),transparent_58%)]',
    icon: Database,
  },
  {
    shell: 'bg-[linear-gradient(135deg,#4a2a22_0%,#b86d50_45%,#ffd1b8_100%)]',
    accent: 'bg-black/10',
    overlay:
      'before:absolute before:right-7 before:bottom-7 before:h-24 before:w-24 before:rounded-full before:border before:border-white/25 before:bg-[radial-gradient(circle,rgba(255,255,255,0.26),transparent_62%)]',
    icon: LayoutTemplate,
  },
];

export function CourseArtwork({
  index,
  label,
  imageUrl,
  imageAlt,
  className,
}: {
  index: number;
  label: string;
  imageUrl?: string | null;
  imageAlt?: string;
  className?: string;
}) {
  const theme = artworkThemes[index % artworkThemes.length];
  const Icon = theme.icon;

  if (imageUrl) {
    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-[1.75rem] bg-slate-200 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]',
          className,
        )}
      >
        <img
          src={imageUrl}
          alt={imageAlt ?? `${label} course cover`}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,16,28,0.04)_0%,rgba(7,16,28,0.2)_56%,rgba(7,16,28,0.54)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,transparent,rgba(8,18,34,0.18))]" />

        <div className="relative flex h-full flex-col justify-between p-5">
          <div className="flex items-start justify-between gap-3">
            <span className="rounded-full bg-slate-950/55 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.22em] text-white backdrop-blur">
              {label}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[1.75rem] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]',
        theme.shell,
        theme.overlay,
        className,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.25),transparent_42%)]" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,transparent,rgba(8,18,34,0.28))]" />

      <div className="relative flex h-full flex-col justify-between p-5">
        <div className="flex items-start justify-between gap-3">
          <span className={cn('rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.22em]', theme.accent)}>
            {label}
          </span>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/14 backdrop-blur">
            <Icon className="h-5 w-5" />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 8 }).map((_, cellIndex) => (
            <div
              key={cellIndex}
              className={cn(
                'h-3 rounded-full',
                cellIndex % 3 === 0 ? 'bg-white/50' : 'bg-white/25',
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
