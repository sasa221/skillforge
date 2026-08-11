'use client';
import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, User } from 'lucide-react';
import { instructorWorkspaceApi } from '@/lib/api/endpoints';

export default function StudentInsightsPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['instructor', 'students'],
    queryFn: () => (instructorWorkspaceApi as any).students(),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-[var(--site-text)]">👨‍🎓 Student Insights</h1>
      <p className="text-[var(--site-muted)]">Monitor progress and identify students who might need help.</p>
      
      {isLoading ? (
        <div>Loading students...</div>
      ) : isError ? (
        <div className="text-[var(--site-danger)]">Error: {(error as Error).message}</div>
      ) : data?.students?.length === 0 ? (
        <div>No students enrolled yet.</div>
      ) : (
        <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] overflow-hidden">
          <table className="w-full text-left text-sm text-[var(--site-text)]">
            <thead className="bg-[var(--site-surface-alt)] uppercase text-[var(--site-subtle)] text-xs border-b border-[var(--site-border)]">
              <tr>
                <th className="px-6 py-4 font-semibold">Student</th>
                <th className="px-6 py-4 font-semibold">Course</th>
                <th className="px-6 py-4 font-semibold">Level</th>
                <th className="px-6 py-4 font-semibold">Progress</th>
                <th className="px-6 py-4 font-semibold">Last Active</th>
                <th className="px-6 py-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.students.map((student: any) => (
                <tr key={`${student.userId}-${student.courseName}`} className="border-b border-[var(--site-border)] last:border-0 hover:bg-[var(--site-surface-alt)]">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-[var(--site-primary-soft)] flex items-center justify-center text-[var(--site-primary)]">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-semibold">{student.fullName}</div>
                      <div className="text-xs text-[var(--site-subtle)]">{student.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[var(--site-muted)]">{student.courseName}</td>
                  <td className="px-6 py-4 font-semibold">{student.level}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-[var(--site-border)] rounded-full overflow-hidden">
                        <div className="h-full bg-[var(--site-primary)]" style={{ width: `${student.completionRate}%` }} />
                      </div>
                      <span className="text-xs">{student.completionRate}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[var(--site-muted)]">{new Date(student.lastActive).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    {student.isStruggling ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--site-warm-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--site-warm)]">
                        <AlertTriangle className="h-3.5 w-3.5" /> Struggling
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-[var(--site-success-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--site-success)]">
                        On track
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
