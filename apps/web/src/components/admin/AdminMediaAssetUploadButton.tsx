'use client';

import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Upload } from 'lucide-react';

import { useToast } from '@/components/toast/toast-provider';
import { adminApi } from '@/lib/api/endpoints';
import type { AdminMediaAsset } from '@/lib/content/types';

type Props = {
  kind: 'image' | 'video';
  onUploaded: (asset: AdminMediaAsset) => void;
  className?: string;
};

export function AdminMediaAssetUploadButton({ kind, onUploaded, className }: Props) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const upload = useMutation({
    mutationFn: async (file: File) =>
      adminApi.mediaAssets.upload({
        file,
        title: file.name.replace(/\.[^.]+$/, ''),
        altText: kind === 'image' ? file.name.replace(/\.[^.]+$/, '') : undefined,
        status: 'published',
      }),
    onSuccess: async (asset) => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'media-assets'] });
      onUploaded(asset);
      toast({
        title: `${kind === 'image' ? 'Image' : 'Video'} uploaded`,
        description: `${asset.title} is ready to use in this course.`,
      });
    },
    onError: (error) =>
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      }),
  });

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={kind === 'image' ? 'image/*' : 'video/*'}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          upload.mutate(file);
          event.currentTarget.value = '';
        }}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={upload.isPending}
        className={
          className ??
          'inline-flex h-11 items-center justify-center gap-2 rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 text-sm font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-primary-soft)] disabled:cursor-not-allowed disabled:opacity-70'
        }
      >
        {upload.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {upload.isPending ? 'Uploading...' : `Upload ${kind === 'image' ? 'image' : 'video'}`}
      </button>
    </>
  );
}
