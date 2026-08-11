'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, Monitor, Smartphone, LogOut, CheckCircle2, AlertTriangle, Key } from 'lucide-react';
import { authSessionsApi } from '@/lib/api/endpoints';
import { useToast } from '@/components/toast/toast-provider';

export default function SecuritySettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['auth', 'sessions'],
    queryFn: () => authSessionsApi.list(),
  });

  const revokeMutation = useMutation({
    mutationFn: () => authSessionsApi.revoke(),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'sessions'] });
      toast({ title: 'Sessions revoked', description: res.message || 'Logged out from all other devices.' });
    },
  });

  const sessions = data?.sessions ?? [];

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--site-text)]">Account & Security</h1>
        <p className="text-sm text-[var(--site-muted)] mt-1">
          Manage your active device sessions, security status, and login credentials.
        </p>
      </div>

      {/* Security Status Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="text-sm font-bold text-[var(--site-text)]">Email Status Verified</div>
            <div className="text-xs text-[var(--site-muted)]">Your account is fully verified and protected</div>
          </div>
        </div>

        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400">
            <Key className="h-6 w-6" />
          </div>
          <div>
            <div className="text-sm font-bold text-[var(--site-text)]">Two-Factor Auth (2FA)</div>
            <div className="text-xs text-[var(--site-muted)]">Google Authenticator ready</div>
          </div>
        </div>
      </div>

      {/* Active Sessions Panel */}
      <div className="rounded-3xl border border-[var(--site-border)] bg-[var(--site-surface)] p-6 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--site-border)] pb-4">
          <div>
            <h3 className="text-lg font-bold text-[var(--site-text)]">Active Sessions</h3>
            <p className="text-xs text-[var(--site-muted)]">Devices currently signed into your SkillForge account</p>
          </div>

          <button
            onClick={() => revokeMutation.mutate()}
            disabled={revokeMutation.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600/10 border border-rose-500/20 px-4 py-2 text-xs font-semibold text-rose-400 transition hover:bg-rose-600/20 disabled:opacity-50"
          >
            <LogOut className="h-3.5 w-3.5" />
            {revokeMutation.isPending ? 'Revoking...' : 'Logout All Other Devices'}
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-[var(--site-bg)]" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((sess: any) => (
              <div
                key={sess.id}
                className="flex items-center justify-between rounded-2xl border border-[var(--site-border)] bg-[var(--site-bg)] p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--site-surface)] text-[var(--site-text)]">
                    {sess.device.includes('Mobile') ? <Smartphone className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-[var(--site-text)]">
                      <span>{sess.device}</span>
                      {sess.isCurrent && (
                        <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-extrabold text-emerald-400 uppercase">
                          Current Device
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[var(--site-muted)]">
                      {sess.ipAddress} • {sess.location} • Active {new Date(sess.lastActiveAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                <div className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Active
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
