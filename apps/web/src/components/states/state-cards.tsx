'use client';

import * as React from 'react';

import { Button } from '@/components/ui/button';

export function ErrorCard({
  title,
  message,
  onRetry,
}: {
  title: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="text-sm font-medium">{title}</div>
      {message ? <div className="mt-2 text-sm text-muted-foreground">{message}</div> : null}
      {onRetry ? (
        <div className="mt-4">
          <Button size="sm" variant="outline" onClick={onRetry}>
            Retry
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function EmptyCard({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-xl border bg-card p-5 text-sm shadow-sm">
      <div className="font-medium">{title}</div>
      {description ? <div className="mt-2 text-muted-foreground">{description}</div> : null}
    </div>
  );
}

export function LoadingGrid({ items = 8 }: { items?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="h-24 rounded-xl border bg-card p-5 shadow-sm" />
      ))}
    </div>
  );
}

