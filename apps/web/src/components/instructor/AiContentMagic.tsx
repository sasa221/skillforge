'use client';

import React, { useState } from 'react';
import { Sparkles, X, ChevronDown, Wand2, BookOpen, HelpCircle, FileText, Check, Copy } from 'lucide-react';
import { aiInstructorApi } from '@/lib/api/endpoints';

type ActiveTab = 'outline' | 'quiz' | 'improve' | null;

export function AiContentMagic() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // Form states
  const [outlineForm, setOutlineForm] = useState({ topic: '', level: 'beginner', durationMinutes: 30 });
  const [quizForm, setQuizForm] = useState({ lessonContent: '', questionCount: 3 });
  const [improveForm, setImproveForm] = useState({ text: '', instruction: 'simplify' });

  const handleOpen = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsOpen(true);
    setResult(null);
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      setActiveTab(null);
      setResult(null);
    }, 200);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const submitOutline = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);
    try {
      const res = await aiInstructorApi.generateOutline(outlineForm);
      setResult(res.outline);
    } catch (err) {
      console.error(err);
      alert('Error generating outline');
    } finally {
      setIsLoading(false);
    }
  };

  const submitQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);
    try {
      const res = await aiInstructorApi.generateQuiz(quizForm);
      setResult(res.questions);
    } catch (err) {
      console.error(err);
      alert('Error generating quiz questions');
    } finally {
      setIsLoading(false);
    }
  };

  const submitImprove = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);
    try {
      const res = await aiInstructorApi.improveText(improveForm);
      setResult(res.improvedText);
    } catch (err) {
      console.error(err);
      alert('Error improving text');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative inline-block text-left">
      {/* Dropdown Trigger */}
      <div className="group relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-lg shadow-sm hover:from-purple-700 hover:to-indigo-700 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        >
          <Sparkles className="w-4 h-4" />
          ✨ AI Magic
          <ChevronDown className="w-4 h-4 ml-1" />
        </button>

        {/* Dropdown Menu (only if modal is closed and hovered/clicked) */}
        {!isOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 transform origin-top-right">
            <div className="p-1">
              <button
                onClick={() => handleOpen('outline')}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 rounded-md transition-colors"
              >
                <BookOpen className="w-4 h-4 text-purple-600" />
                Generate Outline
              </button>
              <button
                onClick={() => handleOpen('quiz')}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 rounded-md transition-colors"
              >
                <HelpCircle className="w-4 h-4 text-indigo-600" />
                Generate Quiz Questions
              </button>
              <button
                onClick={() => handleOpen('improve')}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 rounded-md transition-colors"
              >
                <FileText className="w-4 h-4 text-pink-600" />
                Improve Text
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Overlay */}
      {isOpen && activeTab && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col relative animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-lg text-gray-800">
                  {activeTab === 'outline' && 'Generate Lesson Outline'}
                  {activeTab === 'quiz' && 'Generate Quiz Questions'}
                  {activeTab === 'improve' && 'Improve Text'}
                </h3>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* OUTLINE TAB */}
              {activeTab === 'outline' && !result && (
                <form onSubmit={submitOutline} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
                    <input
                      type="text"
                      required
                      value={outlineForm.topic}
                      onChange={(e) => setOutlineForm({ ...outlineForm, topic: e.target.value })}
                      placeholder="e.g. Introduction to Machine Learning"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                      <select
                        value={outlineForm.level}
                        onChange={(e) => setOutlineForm({ ...outlineForm, level: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Duration (mins)</label>
                      <input
                        type="number"
                        required
                        min="5"
                        max="180"
                        value={outlineForm.durationMinutes}
                        onChange={(e) => setOutlineForm({ ...outlineForm, durationMinutes: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-70 transition-colors flex items-center justify-center gap-2 mt-4"
                  >
                    {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {isLoading ? 'Generating...' : 'Generate Outline'}
                  </button>
                </form>
              )}

              {/* QUIZ TAB */}
              {activeTab === 'quiz' && !result && (
                <form onSubmit={submitQuiz} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lesson Content</label>
                    <textarea
                      required
                      rows={6}
                      value={quizForm.lessonContent}
                      onChange={(e) => setQuizForm({ ...quizForm, lessonContent: e.target.value })}
                      placeholder="Paste the lesson text here..."
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Number of Questions (1-10)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="10"
                      value={quizForm.questionCount}
                      onChange={(e) => setQuizForm({ ...quizForm, questionCount: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-70 transition-colors flex items-center justify-center gap-2 mt-4"
                  >
                    {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {isLoading ? 'Generating...' : 'Generate Quiz'}
                  </button>
                </form>
              )}

              {/* IMPROVE TEXT TAB */}
              {activeTab === 'improve' && !result && (
                <form onSubmit={submitImprove} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Text to Improve</label>
                    <textarea
                      required
                      rows={6}
                      value={improveForm.text}
                      onChange={(e) => setImproveForm({ ...improveForm, text: e.target.value })}
                      placeholder="Paste text here..."
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Improvement Style</label>
                    <select
                      value={improveForm.instruction}
                      onChange={(e) => setImproveForm({ ...improveForm, instruction: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none bg-white"
                    >
                      <option value="simplify">Simplify for beginners</option>
                      <option value="expand">Expand with detail</option>
                      <option value="formal">Make formal & academic</option>
                      <option value="engaging">Make engaging & conversational</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 bg-pink-600 text-white font-medium rounded-lg hover:bg-pink-700 disabled:opacity-70 transition-colors flex items-center justify-center gap-2 mt-4"
                  >
                    {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {isLoading ? 'Improving...' : 'Improve Text'}
                  </button>
                </form>
              )}

              {/* RESULTS AREA */}
              {result && (
                <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-green-700 flex items-center gap-2">
                      <Check className="w-5 h-5" />
                      Generation Complete
                    </h4>
                    <button
                      onClick={() => handleCopy(typeof result === 'string' ? result : JSON.stringify(result, null, 2))}
                      className="text-sm flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copied!' : 'Copy Result'}
                    </button>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 max-h-[60vh] overflow-y-auto font-mono text-sm whitespace-pre-wrap text-gray-800">
                    {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
                  </div>
                  
                  <button
                    onClick={() => setResult(null)}
                    className="w-full py-2 border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Start Over
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
