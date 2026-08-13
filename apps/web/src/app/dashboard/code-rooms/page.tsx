'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Code2,
  MessageSquare,
  Play,
  Plus,
  Radio,
  RefreshCw,
  Send,
  Users,
  Terminal,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { codeExecutionApi } from '@/lib/api/endpoints';
import { useAuthStore } from '@/lib/auth/store';
import { cn } from '@/lib/utils';

export default function CodeRoomsPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const userName = user?.profile?.fullName || user?.email?.split('@')[0] || 'Peer Learner';

  const [activeTab, setActiveTab] = React.useState('All');
  const [selectedRoom, setSelectedRoom] = React.useState<any | null>(null);
  const [roomCode, setRoomCode] = React.useState('');
  const [chatMessage, setChatMessage] = React.useState('');
  const [chatMessages, setChatMessages] = React.useState<any[]>([]);
  const [isExecuting, setIsExecuting] = React.useState(false);
  const [executionOutput, setExecutionOutput] = React.useState<any | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [newRoomTitle, setNewRoomTitle] = React.useState('');
  const [newRoomLang, setNewRoomLang] = React.useState('javascript');

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['code-rooms'],
    queryFn: codeExecutionApi.rooms,
    refetchInterval: 5000,
  });

  const createRoomMutation = useMutation({
    mutationFn: codeExecutionApi.createRoom,
    onSuccess: (newRoom) => {
      queryClient.invalidateQueries({ queryKey: ['code-rooms'] });
      setIsCreateModalOpen(false);
      setNewRoomTitle('');
      joinRoom(newRoom);
    },
  });

  const syncMutation = useMutation({
    mutationFn: ({ roomId, code, message }: any) =>
      codeExecutionApi.syncRoom(roomId, { code, message }),
    onSuccess: (updatedRoom) => {
      if (updatedRoom && updatedRoom.chatMessages) {
        setChatMessages(updatedRoom.chatMessages);
      }
    },
  });

  const filteredRooms = rooms.filter(
    (r) => activeTab === 'All' || r.language.toLowerCase() === activeTab.toLowerCase(),
  );

  const joinRoom = (room: any) => {
    setSelectedRoom(room);
    setRoomCode(room.code);
    setChatMessages(room.chatMessages || []);
    setExecutionOutput(null);
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim() || !selectedRoom) return;
    const msgObj = { sender: userName, text: chatMessage.trim() };
    setChatMessages((prev) => [
      ...prev,
      { ...msgObj, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    ]);
    syncMutation.mutate({ roomId: selectedRoom.id, code: roomCode, message: msgObj });
    setChatMessage('');
  };

  const handleRunCode = async () => {
    if (!selectedRoom) return;
    setIsExecuting(true);
    try {
      const res = await codeExecutionApi.execute({
        language: selectedRoom.language,
        code: roomCode,
      });
      setExecutionOutput(res);
      syncMutation.mutate({ roomId: selectedRoom.id, code: roomCode });
    } catch (err: any) {
      setExecutionOutput({ stdout: '', stderr: err.message || 'Execution error' });
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-8 pb-12">
        {/* Header */}
        <div className="rounded-3xl border border-[var(--site-border)] bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-slate-900/40 p-8 backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400">
                <Radio className="h-3.5 w-3.5 animate-pulse text-emerald-400" />
                <span>Live Multiplayer Code Pairing</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-[var(--site-text)] md:text-4xl">
                Peer Code Rooms
              </h1>
              <p className="max-w-2xl text-sm text-[var(--site-muted)]">
                Create or join live multiplayer coding rooms, collaborate synchronously with peers in real-time, execute sandbox code, and exchange ideas.
              </p>
            </div>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-[var(--site-primary)] px-6 py-3.5 text-sm font-bold text-white shadow-xl hover:bg-[var(--site-primary-strong)] transition"
            >
              <Plus className="h-4 w-4" />
              Create Live Room
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto border-b border-[var(--site-border)] pb-4">
          {(['All', 'JavaScript', 'Python', 'HTML', 'SQL'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'rounded-xl px-4 py-2 text-sm font-semibold transition',
                activeTab === tab
                  ? 'bg-[var(--site-primary)] text-white shadow-md'
                  : 'bg-[var(--site-surface)] text-[var(--site-muted)] hover:bg-[var(--site-hover)] hover:text-[var(--site-text)]',
              )}
            >
              {tab === 'All' ? 'All Live Rooms' : tab}
            </button>
          ))}
        </div>

        {/* Rooms Grid */}
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
            {filteredRooms.map((room) => (
              <div
                key={room.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] p-6 shadow-sm transition hover:-translate-y-1 hover:border-[var(--site-primary)]/40 hover:shadow-xl"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                      Live Room
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-[var(--site-muted)]">
                      <Users className="h-3.5 w-3.5 text-indigo-400" />
                      {room.participantsCount} Online
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-[var(--site-text)] group-hover:text-[var(--site-primary)] transition">
                    {room.title}
                  </h3>

                  <p className="text-xs text-[var(--site-muted)]">
                    Hosted by <span className="font-semibold text-[var(--site-text)]">{room.hostName}</span> • Upper Language: <span className="uppercase font-mono text-indigo-400">{room.language}</span>
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[var(--site-border)] flex items-center justify-between">
                  <span className="text-[11px] font-mono text-[var(--site-subtle)]">
                    {new Date(room.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <button
                    onClick={() => joinRoom(room)}
                    className="inline-flex items-center gap-2 rounded-xl bg-[var(--site-primary)] px-4 py-2 text-xs font-bold text-white transition hover:bg-[var(--site-primary-strong)] shadow-md"
                  >
                    <Code2 className="h-3.5 w-3.5" />
                    Join Live Pairing
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Live Multiplayer Room Modal */}
        {selectedRoom && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
            <div className="flex h-[92vh] w-full max-w-6xl flex-col rounded-3xl border border-[var(--site-border)] bg-[var(--site-bg)] shadow-2xl overflow-hidden">
              {/* Top Room Header */}
              <div className="flex items-center justify-between border-b border-[var(--site-border)] bg-[var(--site-surface)] px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Radio className="h-5 w-5 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[var(--site-text)]">{selectedRoom.title}</h2>
                    <p className="text-xs text-[var(--site-muted)]">
                      Host: {selectedRoom.hostName} • Language: <span className="uppercase font-mono text-indigo-400">{selectedRoom.language}</span> • Live Peers: {selectedRoom.participantsCount}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedRoom(null)}
                  className="rounded-xl border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-2 text-xs font-semibold text-[var(--site-muted)] hover:bg-[var(--site-hover)] hover:text-[var(--site-text)]"
                >
                  Leave Room
                </button>
              </div>

              {/* Room Content Grid */}
              <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-3">
                {/* Code Editor & Console Output (2 cols) */}
                <div className="lg:col-span-2 flex flex-col bg-slate-950 p-4 space-y-4 font-mono text-xs overflow-hidden border-r border-slate-800">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400 flex items-center gap-2">
                      <Code2 className="h-4 w-4 text-emerald-400" />
                      Shared Buffer ({selectedRoom.language})
                    </span>
                    <button
                      onClick={handleRunCode}
                      disabled={isExecuting}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow hover:bg-emerald-500 transition"
                    >
                      <Play className="h-3.5 w-3.5" />
                      {isExecuting ? 'Running...' : 'Run Sandbox Code'}
                    </button>
                  </div>

                  <textarea
                    value={roomCode}
                    onChange={(e) => {
                      setRoomCode(e.target.value);
                      syncMutation.mutate({ roomId: selectedRoom.id, code: e.target.value });
                    }}
                    className="flex-1 w-full bg-transparent text-emerald-300 font-mono text-xs leading-relaxed outline-none resize-none p-3 border border-slate-800/80 rounded-xl focus:border-emerald-500/50"
                    spellCheck={false}
                  />

                  {/* Console Output */}
                  <div className="h-36 rounded-xl border border-slate-800 bg-slate-900/90 p-3 font-mono text-[11px] text-slate-300 overflow-y-auto space-y-2">
                    <div className="text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Terminal className="h-3.5 w-3.5 text-indigo-400" />
                      Console Output
                    </div>
                    {executionOutput ? (
                      <div>
                        {executionOutput.stdout && <pre className="text-emerald-400 whitespace-pre-wrap">{executionOutput.stdout}</pre>}
                        {executionOutput.stderr && <pre className="text-red-400 whitespace-pre-wrap">{executionOutput.stderr}</pre>}
                      </div>
                    ) : (
                      <div className="text-slate-600 italic">Click "Run Sandbox Code" to execute shared buffer code...</div>
                    )}
                  </div>
                </div>

                {/* Peer Chat & Activity Box (1 col) */}
                <div className="flex flex-col border-l border-[var(--site-border)] bg-[var(--site-surface)] overflow-hidden">
                  <div className="border-b border-[var(--site-border)] p-4 flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--site-text)] flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-[var(--site-primary)]" />
                      Live Room Chat
                    </span>
                    <span className="text-[10px] text-[var(--site-muted)]">Real-time sync</span>
                  </div>

                  {/* Messages Feed */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3">
                    {chatMessages.map((msg, i) => (
                      <div key={i} className="rounded-xl border border-[var(--site-border)] bg-[var(--site-bg-soft)] p-3 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[var(--site-primary)]">{msg.sender}</span>
                          <span className="text-[10px] text-[var(--site-subtle)]">{msg.time}</span>
                        </div>
                        <p className="text-[var(--site-text)]">{msg.text}</p>
                      </div>
                    ))}
                  </div>

                  {/* Message Input Form */}
                  <div className="p-3 border-t border-[var(--site-border)] flex items-center gap-2">
                    <input
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type a message to peers..."
                      className="flex-1 rounded-xl border border-[var(--site-border)] bg-[var(--site-bg)] px-3 py-2 text-xs text-[var(--site-text)] outline-none"
                    />
                    <button
                      onClick={handleSendMessage}
                      className="rounded-xl bg-[var(--site-primary)] p-2.5 text-white hover:bg-[var(--site-primary-strong)] transition"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Room Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl border border-[var(--site-border)] bg-[var(--site-surface)] p-6 shadow-2xl space-y-6">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-[var(--site-text)]">Create Live Code Room</h3>
                <p className="text-xs text-[var(--site-muted)]">Set up a room for live pair programming with your peers.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[var(--site-text)]">Room Title</label>
                  <input
                    value={newRoomTitle}
                    onChange={(e) => setNewRoomTitle(e.target.value)}
                    placeholder="e.g. Python Algorithm Practice"
                    className="w-full rounded-xl border border-[var(--site-border)] bg-[var(--site-bg)] px-4 py-2.5 text-sm text-[var(--site-text)] outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[var(--site-text)]">Primary Language</label>
                  <select
                    value={newRoomLang}
                    onChange={(e) => setNewRoomLang(e.target.value)}
                    className="w-full rounded-xl border border-[var(--site-border)] bg-[var(--site-bg)] px-4 py-2.5 text-sm text-[var(--site-text)] outline-none"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="html">HTML / CSS</option>
                    <option value="sql">SQL</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-[var(--site-border)]">
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 rounded-xl border border-[var(--site-border)] py-2.5 text-xs font-bold text-[var(--site-muted)] hover:bg-[var(--site-hover)]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!newRoomTitle.trim()) return;
                    createRoomMutation.mutate({
                      title: newRoomTitle.trim(),
                      language: newRoomLang as any,
                      hostName: userName,
                    });
                  }}
                  className="flex-1 rounded-xl bg-[var(--site-primary)] py-2.5 text-xs font-bold text-white shadow-lg hover:bg-[var(--site-primary-strong)]"
                >
                  Create & Join
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
