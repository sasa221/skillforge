'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Award,
  CheckCircle2,
  Code2,
  Play,
  RotateCcw,
  Swords,
  Trophy,
  XCircle,
  Zap,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { codeExecutionApi } from '@/lib/api/endpoints';
import { cn } from '@/lib/utils';

export default function ChallengesPage() {
  const [activeFilter, setActiveFilter] = React.useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
  const [selectedChallenge, setSelectedChallenge] = React.useState<any | null>(null);
  const [userCode, setUserCode] = React.useState('');
  const [isRunning, setIsRunning] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [executionOutput, setExecutionOutput] = React.useState<any | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = React.useState<any | null>(null);

  const { data: challenges = [], isLoading } = useQuery({
    queryKey: ['code-challenges'],
    queryFn: codeExecutionApi.challenges,
  });

  const filteredChallenges = challenges.filter(
    (c) => activeFilter === 'All' || c.difficulty === activeFilter,
  );

  const openChallengeModal = (c: any) => {
    setSelectedChallenge(c);
    setUserCode(c.starterCode);
    setExecutionOutput(null);
    setSubmissionSuccess(null);
  };

  const handleRunCode = async () => {
    if (!selectedChallenge) return;
    setIsRunning(true);
    try {
      const res = await codeExecutionApi.execute({
        language: selectedChallenge.language,
        code: userCode,
        testCases: selectedChallenge.testCases,
      });
      setExecutionOutput(res);
    } catch (err: any) {
      setExecutionOutput({
        stdout: '',
        stderr: err.message || 'Execution error',
        passed: false,
        testResults: [],
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitSolution = async () => {
    if (!selectedChallenge) return;
    setIsSubmitting(true);
    try {
      const res = await codeExecutionApi.submitChallenge(
        selectedChallenge.id,
        userCode,
        selectedChallenge.language,
      );
      setSubmissionSuccess(res);
      setExecutionOutput({
        stdout: res.stdout,
        stderr: res.stderr,
        passed: res.ok,
        testResults: res.testResults,
      });
    } catch (err: any) {
      setSubmissionSuccess({ ok: false, error: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-8 pb-12">
        {/* Header */}
        <div className="rounded-3xl border border-[var(--site-border)] bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900/40 p-8 backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1 text-xs font-semibold text-indigo-400">
                <Swords className="h-3.5 w-3.5" />
                <span>Speed Coding Battles & Peer Challenges</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-[var(--site-text)] md:text-4xl">
                Code Challenge Arena
              </h1>
              <p className="max-w-2xl text-sm text-[var(--site-muted)]">
                Test your algorithmic speed, pass hidden test cases, compete against peers, and earn bonus XP rewards.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] px-5 py-3 shadow-lg">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs text-[var(--site-muted)]">Total Battles</div>
                  <div className="text-lg font-bold text-[var(--site-text)]">{challenges.length} Available</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto border-b border-[var(--site-border)] pb-4">
          {(['All', 'Easy', 'Medium', 'Hard'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={cn(
                'rounded-xl px-4 py-2 text-sm font-semibold transition',
                activeFilter === filter
                  ? 'bg-[var(--site-primary)] text-white shadow-md'
                  : 'bg-[var(--site-surface)] text-[var(--site-muted)] hover:bg-[var(--site-hover)] hover:text-[var(--site-text)]',
              )}
            >
              {filter === 'All' ? 'All Challenges' : `${filter} Mode`}
            </button>
          ))}
        </div>

        {/* Challenge Cards Grid */}
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-48 animate-pulse rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] p-6"
              />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredChallenges.map((challenge) => (
              <div
                key={challenge.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] p-6 shadow-sm transition hover:-translate-y-1 hover:border-[var(--site-primary)]/40 hover:shadow-xl"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        'rounded-lg px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider',
                        challenge.difficulty === 'Easy' && 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
                        challenge.difficulty === 'Medium' && 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
                        challenge.difficulty === 'Hard' && 'bg-red-500/10 text-red-400 border border-red-500/20',
                      )}
                    >
                      {challenge.difficulty}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400">
                      <Zap className="h-3.5 w-3.5 fill-amber-400" />
                      +{challenge.xpAward} XP
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-[var(--site-text)] group-hover:text-[var(--site-primary)] transition">
                    {challenge.title}
                  </h3>

                  <p className="text-xs text-[var(--site-muted)] line-clamp-3 leading-relaxed">
                    {challenge.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[var(--site-border)] flex items-center justify-between">
                  <span className="text-xs font-mono text-[var(--site-subtle)] uppercase">
                    {challenge.language}
                  </span>
                  <button
                    onClick={() => openChallengeModal(challenge)}
                    className="inline-flex items-center gap-2 rounded-xl bg-[var(--site-primary)]/10 px-4 py-2 text-xs font-semibold text-[var(--site-primary)] transition hover:bg-[var(--site-primary)] hover:text-white"
                  >
                    <Play className="h-3.5 w-3.5" />
                    Enter Battle
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Battle Workspace Modal */}
        {selectedChallenge && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
            <div className="flex h-[90vh] w-full max-w-5xl flex-col rounded-3xl border border-[var(--site-border)] bg-[var(--site-bg)] shadow-2xl overflow-hidden">
              {/* Modal Top Bar */}
              <div className="flex items-center justify-between border-b border-[var(--site-border)] bg-[var(--site-surface)] px-6 py-4">
                <div className="flex items-center gap-3">
                  <Code2 className="h-5 w-5 text-[var(--site-primary)]" />
                  <div>
                    <h2 className="text-base font-bold text-[var(--site-text)]">{selectedChallenge.title}</h2>
                    <p className="text-xs text-[var(--site-muted)]">{selectedChallenge.category} • {selectedChallenge.difficulty} • +{selectedChallenge.xpAward} XP</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedChallenge(null)}
                  className="rounded-xl border border-[var(--site-border)] bg-[var(--site-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--site-muted)] hover:bg-[var(--site-hover)] hover:text-[var(--site-text)]"
                >
                  Close
                </button>
              </div>

              {/* Modal Body */}
              <div className="grid flex-1 grid-cols-1 overflow-hidden md:grid-cols-2">
                {/* Left Panel: Problem Statement & Controls */}
                <div className="flex flex-col border-r border-[var(--site-border)] p-6 overflow-y-auto space-y-6">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--site-muted)]">Problem Statement</h4>
                    <p className="mt-2 text-sm text-[var(--site-text)] leading-relaxed">{selectedChallenge.description}</p>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--site-muted)]">Test Cases Required</h4>
                    <div className="mt-2 space-y-2">
                      {selectedChallenge.testCases?.map((tc: any, i: number) => (
                        <div key={i} className="rounded-xl border border-[var(--site-border)] bg-[var(--site-surface)] p-3 text-xs">
                          <div className="font-mono text-[var(--site-muted)]">Input: {tc.input}</div>
                          <div className="font-mono text-emerald-400 font-semibold mt-1">Expected Output: {tc.expectedOutput}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Submission Status Alert */}
                  {submissionSuccess && (
                    <div
                      className={cn(
                        'rounded-2xl border p-4 text-xs font-medium',
                        submissionSuccess.ok
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                          : 'border-red-500/30 bg-red-500/10 text-red-400',
                      )}
                    >
                      {submissionSuccess.ok ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 shrink-0" />
                          <div>
                            <div className="font-bold text-sm">Challenge Solved! 🎉</div>
                            <div>You passed all test cases and earned +{submissionSuccess.xpAwarded} XP!</div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <XCircle className="h-5 w-5 shrink-0" />
                          <div>
                            <div className="font-bold text-sm">Solution Incomplete</div>
                            <div>Some test cases failed. Review console output and try again.</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-auto flex items-center gap-3 pt-4 border-t border-[var(--site-border)]">
                    <button
                      onClick={handleRunCode}
                      disabled={isRunning}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--site-border)] bg-[var(--site-surface)] py-3 text-xs font-bold text-[var(--site-text)] hover:bg-[var(--site-hover)] transition"
                    >
                      <Play className="h-4 w-4" />
                      {isRunning ? 'Executing...' : 'Run Test Code'}
                    </button>

                    <button
                      onClick={handleSubmitSolution}
                      disabled={isSubmitting}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--site-primary)] py-3 text-xs font-bold text-white shadow-lg hover:bg-[var(--site-primary-strong)] transition"
                    >
                      <Trophy className="h-4 w-4" />
                      {isSubmitting ? 'Submitting...' : 'Submit Battle'}
                    </button>
                  </div>
                </div>

                {/* Right Panel: Code Editor & Output Console */}
                <div className="flex flex-col bg-slate-950 p-4 space-y-4 font-mono text-xs overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400">Solution Editor ({selectedChallenge.language})</span>
                    <button
                      onClick={() => setUserCode(selectedChallenge.starterCode)}
                      className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-300"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Reset Code
                    </button>
                  </div>

                  <textarea
                    value={userCode}
                    onChange={(e) => setUserCode(e.target.value)}
                    className="flex-1 w-full bg-transparent text-emerald-300 font-mono text-xs leading-relaxed outline-none resize-none p-2 border border-slate-800/80 rounded-xl focus:border-indigo-500/50"
                    spellCheck={false}
                  />

                  {/* Console Output */}
                  <div className="h-36 rounded-xl border border-slate-800 bg-slate-900/90 p-3 text-[11px] font-mono text-slate-300 overflow-y-auto space-y-2">
                    <div className="text-slate-500 font-bold uppercase tracking-wider">Console Output</div>
                    {executionOutput ? (
                      <div>
                        {executionOutput.stdout && <pre className="text-emerald-400 whitespace-pre-wrap">{executionOutput.stdout}</pre>}
                        {executionOutput.stderr && <pre className="text-red-400 whitespace-pre-wrap">{executionOutput.stderr}</pre>}
                        {executionOutput.testResults?.map((tr: any) => (
                          <div key={tr.id} className="mt-1 flex items-center gap-2">
                            {tr.passed ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <XCircle className="h-3.5 w-3.5 text-red-400" />}
                            <span>Test #{tr.id}: {tr.passed ? 'PASSED' : `FAILED (Expected: ${tr.expected})`}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-slate-600 italic">Click "Run Test Code" to see stdout and test evaluations here...</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
