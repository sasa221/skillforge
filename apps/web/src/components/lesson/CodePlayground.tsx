'use client';

import * as React from 'react';
import { Play, RotateCcw, Copy, Check, Terminal, Eye, Code2, Sparkles, CheckCircle2, XCircle, Maximize2, Minimize2 } from 'lucide-react';
import { codeExecutionApi } from '@/lib/api/endpoints';

interface Props {
  initialCode?: string;
  language?: 'javascript' | 'python' | 'html' | 'sql';
  title?: string;
  testCases?: Array<{ input?: string; expectedOutput: string }>;
}

export function CodePlayground({
  initialCode = '// Write your JavaScript code here\nconsole.log("Hello from SkillForge!");',
  language = 'javascript',
  title = 'Interactive Code Sandbox',
  testCases = [],
}: Props) {
  const [code, setCode] = React.useState(initialCode);
  const [activeTab, setActiveTab] = React.useState<'editor' | 'output' | 'preview'>('editor');
  const [stdout, setStdout] = React.useState('');
  const [stderr, setStderr] = React.useState('');
  const [previewHtml, setPreviewHtml] = React.useState('');
  const [execTime, setExecTime] = React.useState<number | null>(null);
  const [isExecuting, setIsExecuting] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [testResults, setTestResults] = React.useState<any[]>([]);
  const [isFullScreen, setIsFullScreen] = React.useState(false);

  const handleRun = async () => {
    setIsExecuting(true);
    try {
      const res = await codeExecutionApi.execute({
        language,
        code,
        testCases,
      });

      setStdout(res.stdout || '');
      setStderr(res.stderr || '');
      setExecTime(res.executionTimeMs);
      setTestResults(res.testResults || []);
      if (res.previewHtml) setPreviewHtml(res.previewHtml);

      if (language === 'html' || res.previewHtml) {
        setActiveTab('preview');
      } else {
        setActiveTab('output');
      }
    } catch (err: any) {
      setStderr(err.message || 'Execution error');
      setActiveTab('output');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setCode(initialCode);
    setStdout('');
    setStderr('');
    setExecTime(null);
    setTestResults([]);
  };

  return (
    <div
      className={
        isFullScreen
          ? 'fixed inset-0 z-50 overflow-auto bg-zinc-950 flex flex-col'
          : 'my-8 overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl'
      }
    >
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-900/80 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
            <Code2 className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold tracking-wide text-zinc-100">{title}</h4>
            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">{language}</span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 rounded-xl bg-zinc-950 p-1 border border-zinc-800/80">
          <button
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'editor' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            Editor
          </button>
          <button
            onClick={() => setActiveTab('output')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'output' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Terminal className="h-3.5 w-3.5" />
            Output {stdout && <span className="h-2 w-2 rounded-full bg-emerald-400" />}
          </button>
          {language === 'html' && (
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === 'preview' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              Preview
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
            title="Copy code"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={handleReset}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
            title="Reset code"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={() => setIsFullScreen((prev) => !prev)}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
            title={isFullScreen ? 'Exit Full Screen' : 'Full Screen Mode'}
          >
            {isFullScreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={handleRun}
            disabled={isExecuting}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-violet-500/20 transition hover:opacity-90 active:scale-95 disabled:opacity-50"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            {isExecuting ? 'Executing...' : 'Run Code'}
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="relative min-h-[260px]">
        {activeTab === 'editor' && (
          <div className="relative flex">
            {/* Line numbers column */}
            <div className="select-none bg-zinc-950/80 px-3 py-4 text-right font-mono text-xs text-zinc-600">
              {code.split('\n').map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            {/* Code textarea */}
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full resize-none border-none bg-transparent p-4 font-mono text-xs leading-relaxed text-emerald-400 focus:outline-none focus:ring-0"
              rows={Math.max(8, code.split('\n').length)}
              spellCheck={false}
            />
          </div>
        )}

        {activeTab === 'output' && (
          <div className="p-5 font-mono text-xs space-y-4">
            {execTime !== null && (
              <div className="flex items-center justify-between text-[11px] text-zinc-400 border-b border-zinc-800/80 pb-2">
                <span>Console Output</span>
                <span className="text-emerald-400">⚡ Executed in {execTime}ms</span>
              </div>
            )}

            {stdout ? (
              <pre className="whitespace-pre-wrap text-emerald-300 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800/60">
                {stdout}
              </pre>
            ) : null}

            {stderr ? (
              <pre className="whitespace-pre-wrap text-rose-400 bg-rose-950/30 p-4 rounded-2xl border border-rose-900/50">
                {stderr}
              </pre>
            ) : null}

            {!stdout && !stderr && (
              <div className="py-12 text-center text-zinc-500">
                Click <span className="font-semibold text-violet-400">"Run Code"</span> above to view execution logs.
              </div>
            )}

            {/* Test cases results */}
            {testResults.length > 0 && (
              <div className="mt-4 pt-4 border-t border-zinc-800 space-y-2">
                <div className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">Test Suite Results</div>
                {testResults.map((tr) => (
                  <div
                    key={tr.id}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs ${
                      tr.passed
                        ? 'bg-emerald-950/20 border-emerald-800/50 text-emerald-300'
                        : 'bg-rose-950/20 border-rose-800/50 text-rose-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {tr.passed ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <XCircle className="h-4 w-4 text-rose-400" />
                      )}
                      <span>Test Case #{tr.id}</span>
                    </div>
                    <span className="text-[11px] font-mono opacity-80">Expected: "{tr.expected}"</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'preview' && (
          <div className="p-4">
            <div className="rounded-2xl border border-zinc-800 bg-white p-4 min-h-[220px]">
              <iframe
                title="HTML Preview"
                srcDoc={previewHtml || code}
                className="w-full h-56 border-none"
                sandbox="allow-scripts"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
