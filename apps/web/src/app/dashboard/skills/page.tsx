'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, Compass, CheckCircle2, ArrowRight, Zap, Target, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { skillsApi, progressApi } from '@/lib/api/endpoints';

type CategoryType = 'all' | 'data' | 'development' | 'management' | 'design';

export default function SkillMapPage() {
  const [selectedCategory, setSelectedCategory] = React.useState<CategoryType>('all');
  const [activeSkill, setActiveSkill] = React.useState<any | null>(null);

  const skillsQuery = useQuery({
    queryKey: ['skills'],
    queryFn: skillsApi.list,
  });

  const progressQuery = useQuery({
    queryKey: ['progress', 'profile-summary'],
    queryFn: progressApi.profileSummary,
  });

  const skills = skillsQuery.data ?? [];
  const profile = progressQuery.data;

  // Filter skills by category
  const filteredSkills = React.useMemo(() => {
    if (selectedCategory === 'all') return skills;
    return skills.filter((s: any) => {
      const cat = (s.category || '').toLowerCase();
      if (selectedCategory === 'data') return cat.includes('data') || cat.includes('excel') || cat.includes('sql') || cat.includes('python');
      if (selectedCategory === 'development') return cat.includes('dev') || cat.includes('code') || cat.includes('web') || cat.includes('api');
      if (selectedCategory === 'design') return cat.includes('design') || cat.includes('ui') || cat.includes('ux');
      if (selectedCategory === 'management') return cat.includes('management') || cat.includes('agile') || cat.includes('project');
      return true;
    });
  }, [skills, selectedCategory]);

  return (
    <main className="space-y-8 pb-12">
      {/* Header section */}
      <div className="rounded-[2.2rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-8 shadow-[0_20px_65px_var(--site-shadow)] relative overflow-hidden">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-[var(--site-primary)]/10 blur-3xl" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--site-border)] bg-[var(--site-bg-soft)] px-3 py-1 text-xs font-semibold text-[var(--site-primary)]">
            <Sparkles className="h-3.5 w-3.5" /> Interactive Skill Tree
          </div>
          <h1 className="mt-4 text-3xl font-extrabold text-[var(--site-text)] sm:text-4xl">
            Skill Competency Map
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--site-muted)] sm:text-base">
            Explore industry skills, track your mastery level across subjects, and unlock target learning paths.
          </p>

          {/* User overall stats summary */}
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-bg)] p-4 text-center">
              <Zap className="mx-auto h-5 w-5 text-amber-500 mb-1" />
              <div className="text-xl font-bold text-[var(--site-text)]">{profile?.totalXp ?? 0} XP</div>
              <div className="text-[11px] text-[var(--site-muted)] uppercase tracking-wider">Total XP</div>
            </div>
            <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-bg)] p-4 text-center">
              <Compass className="mx-auto h-5 w-5 text-blue-500 mb-1" />
              <div className="text-xl font-bold text-[var(--site-text)]">{skills.length}</div>
              <div className="text-[11px] text-[var(--site-muted)] uppercase tracking-wider">Skills Catalog</div>
            </div>
            <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-bg)] p-4 text-center">
              <Target className="mx-auto h-5 w-5 text-emerald-500 mb-1" />
              <div className="text-xl font-bold text-[var(--site-text)]">Level {profile?.level ?? 1}</div>
              <div className="text-[11px] text-[var(--site-muted)] uppercase tracking-wider">Learner Rank</div>
            </div>
            <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-bg)] p-4 text-center">
              <CheckCircle2 className="mx-auto h-5 w-5 text-purple-500 mb-1" />
              <div className="text-xl font-bold text-[var(--site-text)]">{profile?.completedLessonsCount ?? 0}</div>
              <div className="text-[11px] text-[var(--site-muted)] uppercase tracking-wider">Lessons Passed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'all', label: 'All Competencies' },
          { id: 'data', label: '📊 Data & Analytics' },
          { id: 'development', label: '💻 Software & Web' },
          { id: 'design', label: '🎨 Design & UI' },
          { id: 'management', label: '🚀 Management' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedCategory(tab.id as CategoryType)}
            className={`rounded-2xl px-4 py-2.5 text-xs font-semibold transition-all ${
              selectedCategory === tab.id
                ? 'bg-[var(--site-primary)] text-white shadow-md shadow-[var(--site-primary)]/20'
                : 'border border-[var(--site-border)] bg-[var(--site-surface)] text-[var(--site-muted)] hover:bg-[var(--site-hover)] hover:text-[var(--site-text)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Skill Grid */}
      {skillsQuery.isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-[1.8rem] border border-[var(--site-border)] bg-[var(--site-surface)]" />
          ))}
        </div>
      ) : filteredSkills.length === 0 ? (
        <div className="rounded-[1.8rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-12 text-center text-sm text-[var(--site-muted)]">
          No skills found in this category yet.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSkills.map((skill: any, idx: number) => {
            const isHighlighted = activeSkill?.id === skill.id;
            return (
              <div
                key={skill.id}
                onClick={() => setActiveSkill(skill)}
                className={`group cursor-pointer rounded-[1.8rem] border p-6 transition-all duration-300 ${
                  isHighlighted
                    ? 'border-[var(--site-primary)] bg-[var(--site-primary-soft)] shadow-xl'
                    : 'border-[var(--site-border)] bg-[var(--site-surface)] hover:border-[var(--site-primary)]/50 hover:shadow-[0_15px_45px_var(--site-shadow)]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--site-primary)]/10 text-xl font-bold text-[var(--site-primary)] group-hover:scale-110 transition-transform">
                    {skill.title.charAt(0)}
                  </div>
                  <span className="rounded-full bg-[var(--site-bg-soft)] px-2.5 py-1 text-[10px] font-bold text-[var(--site-subtle)] uppercase tracking-wider">
                    {skill.category || 'Core Skill'}
                  </span>
                </div>

                <h3 className="mt-4 text-lg font-bold text-[var(--site-text)] group-hover:text-[var(--site-primary)] transition-colors">
                  {skill.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs text-[var(--site-muted)]">
                  {skill.description || 'Master foundational and advanced concepts in this skill area.'}
                </p>

                <div className="mt-6 flex items-center justify-between border-t border-[var(--site-border)] pt-4">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--site-primary)]">
                    <BookOpen className="h-3.5 w-3.5" /> View Courses
                  </span>
                  <Link
                    href={`/courses?skillSlug=${skill.slug}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--site-border)] bg-[var(--site-bg)] text-[var(--site-text)] transition hover:bg-[var(--site-primary)] hover:text-white"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Active Skill Detail Modal / Sheet */}
      {activeSkill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg overflow-hidden rounded-[2.2rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-8 shadow-2xl animate-in fade-in zoom-in-95">
            <button
              onClick={() => setActiveSkill(null)}
              className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--site-bg-soft)] text-sm font-bold text-[var(--site-muted)] hover:text-[var(--site-text)]"
            >
              ✕
            </button>

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--site-primary)]/10 text-2xl font-bold text-[var(--site-primary)]">
              {activeSkill.title.charAt(0)}
            </div>

            <h2 className="mt-4 text-2xl font-bold text-[var(--site-text)]">{activeSkill.title}</h2>
            <div className="mt-1 text-xs text-[var(--site-primary)] font-semibold uppercase tracking-wider">
              {activeSkill.category || 'Skill Competency'}
            </div>

            <p className="mt-4 text-sm text-[var(--site-muted)] leading-relaxed">
              {activeSkill.description || 'Develop deep knowledge and practical expertise through targeted courses and hands-on exercises.'}
            </p>

            <div className="mt-6 rounded-2xl border border-[var(--site-border)] bg-[var(--site-bg)] p-4 space-y-2">
              <div className="text-xs font-bold text-[var(--site-text)] uppercase tracking-wider">Skill Details</div>
              <div className="flex justify-between text-xs text-[var(--site-muted)]">
                <span>Slug:</span>
                <span className="font-mono text-[var(--site-text)]">{activeSkill.slug}</span>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <Link
                href={`/courses?skillSlug=${activeSkill.slug}`}
                onClick={() => setActiveSkill(null)}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--site-primary)] px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:opacity-90"
              >
                Browse Skill Courses <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
