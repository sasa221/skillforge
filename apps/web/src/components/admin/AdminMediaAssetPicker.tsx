'use client';

import * as React from 'react';
import Link from 'next/link';
import { Check, ChevronDown, Film, ImageIcon, Search, X } from 'lucide-react';

import type { AdminMediaAsset } from '@/lib/content/types';
import { cn } from '@/lib/utils';

type Props = {
  kind: 'image' | 'video';
  assets: AdminMediaAsset[];
  value: string;
  onChange: (id: string) => void;
  emptyLabel?: string;
  buttonLabel?: string;
};

export function AdminMediaAssetPicker({
  kind,
  assets,
  value,
  onChange,
  emptyLabel = 'Use direct URL instead',
  buttonLabel,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const filteredAssets = React.useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return assets.filter((asset) => {
      if (asset.type !== kind) return false;
      if (!normalized) return true;
      return [asset.title, asset.altText ?? '', asset.url]
        .join(' ')
        .toLowerCase()
        .includes(normalized);
    });
  }, [assets, kind, search]);

  const selectedAsset = assets.find((asset) => asset.id === value) ?? null;
  const usageCount = selectedAsset?.usage?.totalLinks ?? 0;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="inline-flex h-14 min-w-[240px] items-center justify-between gap-3 rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 text-left text-base text-[var(--site-text)] transition hover:bg-[var(--site-primary-soft)]"
        >
          <span className="min-w-0">
            <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--site-subtle)]">
              {buttonLabel ?? (kind === 'image' ? 'Image library' : 'Video library')}
            </span>
            <span className="mt-1 block truncate font-medium">
              {selectedAsset ? selectedAsset.title : emptyLabel}
            </span>
          </span>
          <ChevronDown className={cn('h-5 w-5 shrink-0 transition', open ? 'rotate-180' : '')} />
        </button>

        {selectedAsset ? (
          <button
            type="button"
            onClick={() => onChange('')}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface)] px-4 text-sm font-semibold text-[var(--site-muted)] transition hover:bg-[var(--site-surface-alt)] hover:text-[var(--site-text)]"
          >
            <X className="h-4 w-4" />
            Clear selection
          </button>
        ) : null}

        <Link
          href="/admin/media-assets"
          className="inline-flex h-11 items-center justify-center rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface)] px-4 text-sm font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-primary-soft)]"
        >
          Open media library
        </Link>
      </div>

      {selectedAsset ? (
        <div className="rounded-[1.1rem] border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-3 text-sm text-[var(--site-muted)]">
          <div className="font-medium text-[var(--site-text)]">{selectedAsset.title}</div>
          <div className="mt-1">
            {usageCount > 0
              ? `Already linked in ${usageCount} place${usageCount === 1 ? '' : 's'}.`
              : 'Ready to link. This asset is not used anywhere yet.'}
          </div>
        </div>
      ) : null}

      {open ? (
        <div className="space-y-4 rounded-[1.4rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-4 shadow-[0_18px_44px_var(--site-shadow)]">
          <div className="flex items-center gap-3 rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 py-3">
            <Search className="h-4 w-4 text-[var(--site-subtle)]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={kind === 'image' ? 'Search images...' : 'Search videos...'}
              className="w-full bg-transparent text-sm text-[var(--site-text)] outline-none placeholder:text-[var(--site-subtle)]"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                onChange('');
                setOpen(false);
              }}
              className={cn(
                'rounded-[1.2rem] border p-4 text-left transition',
                !selectedAsset
                  ? 'border-primary/25 bg-primary/10'
                  : 'border-[var(--site-border)] bg-[var(--site-surface-alt)] hover:bg-[var(--site-primary-soft)]',
              )}
            >
              <div className="text-sm font-semibold text-[var(--site-text)]">{emptyLabel}</div>
              <div className="mt-1 text-sm leading-6 text-[var(--site-muted)]">
                Keep this field empty and rely on the direct URL field instead.
              </div>
            </button>

            {filteredAssets.map((asset) => {
              const isSelected = asset.id === selectedAsset?.id;
              return (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => {
                    onChange(asset.id);
                    setOpen(false);
                  }}
                  className={cn(
                    'overflow-hidden rounded-[1.2rem] border text-left transition',
                    isSelected
                      ? 'border-primary/25 bg-primary/10'
                      : 'border-[var(--site-border)] bg-[var(--site-surface-alt)] hover:bg-[var(--site-primary-soft)]',
                  )}
                >
                  <div className="border-b border-[var(--site-border)] bg-[var(--site-surface)] p-3">
                    {asset.type === 'image' ? (
                      <div className="overflow-hidden rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)]">
                        <img
                          src={asset.url}
                          alt={asset.altText ?? asset.title}
                          className="h-36 w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="overflow-hidden rounded-[1rem] border border-[var(--site-border)] bg-slate-950">
                        <video
                          preload="metadata"
                          muted
                          playsInline
                          className="h-36 w-full object-cover"
                        >
                          <source src={asset.url} />
                        </video>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-base font-semibold text-[var(--site-text)]">
                          {asset.title}
                        </div>
                        <div className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--site-subtle)]">
                          {asset.sourceType} {asset.type === 'video' && asset.durationSeconds ? `• ${asset.durationSeconds}s` : ''}
                        </div>
                      </div>
                      {isSelected ? (
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
                          <Check className="h-4 w-4" />
                        </span>
                      ) : asset.type === 'image' ? (
                        <ImageIcon className="h-5 w-5 shrink-0 text-[var(--site-subtle)]" />
                      ) : (
                        <Film className="h-5 w-5 shrink-0 text-[var(--site-subtle)]" />
                      )}
                    </div>
                    <div className="text-sm leading-6 text-[var(--site-muted)]">
                      {asset.usage?.totalLinks
                        ? `${asset.usage.totalLinks} linked record${asset.usage.totalLinks === 1 ? '' : 's'}`
                        : 'Not linked yet'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {filteredAssets.length === 0 ? (
            <div className="rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 py-5 text-sm text-[var(--site-muted)]">
              No matching {kind} assets yet. Upload one from this form or open the media library.
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
