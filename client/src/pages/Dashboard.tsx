import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchBoards, createBoard, deleteBoard } from '../api/boards';
import { clearSession } from '../api/auth';
import type { Board, AppUser } from '../types';

interface DashboardProps {
  user: AppUser;
  onLogout: () => void;
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const navigate = useNavigate();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [joinId, setJoinId] = useState('');
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadBoards = useCallback(async () => {
    try {
      const data = await fetchBoards();
      setBoards(data);
    } catch {
      setError('Failed to load boards');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadBoards(); }, [loadBoards]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const board = await createBoard(newName.trim());
      setBoards((prev) => [board, ...prev]);
      setNewName('');
      setShowCreate(false);
      navigate(`/board/${board.boardId}`);
    } catch {
      setError('Failed to create board');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (boardId: string) => {
    if (!window.confirm('Delete this board? This cannot be undone.')) return;
    setDeletingId(boardId);
    try {
      await deleteBoard(boardId);
      setBoards((prev) => prev.filter((b) => b.boardId !== boardId));
    } catch {
      setError('Failed to delete board');
    } finally {
      setDeletingId(null);
    }
  };

  const handleLogout = () => {
    clearSession();
    onLogout();
  };

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Background warm humanistic blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-400/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-rose-400/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative border-b border-slate-200 bg-white/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-950 flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" />
              </svg>
            </div>
            <span className="text-slate-900 font-bold text-lg tracking-tight">CollabBoard</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-500 rounded-xl px-3 py-1.5">
              <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center text-slate-700 text-xs font-bold uppercase">
                {user.userName[0]}
              </div>
              <span className="text-slate-700 text-sm font-medium">{user.userName}</span>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 w-20 h-10 text-red-500 border border-slate-500 hover:text-red-500 text-sm rounded-xl hover:bg-slate-100 transition-all"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="relative max-w-6xl mx-auto px-6 py-10">
        {/* Title + Create button */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Welcome back, {user.userName} 👋</h2>
            <p className="text-slate-500 text-sm mt-1">You have {boards.length} board{boards.length !== 1 ? 's' : ''} in your workspace.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setShowJoin(true); setShowCreate(false); }}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 font-medium rounded-xl transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
              </svg>
              Join Board
            </button>
            <button
              onClick={() => { setShowCreate(true); setShowJoin(false); }}
              className="flex items-center gap-2 px-4 py-2 bg-slate-950 hover:bg-slate-900 text-white font-medium rounded-xl transition-all shadow-lg shadow-slate-900/10 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              New Board
            </button>
          </div>
        </div>

        {/* Create Board Form */}
        {showCreate && (
          <div className="mb-8 bg-white border border-slate-300 rounded-2xl p-6 shadow-xl shadow-slate-200/50">
            <h3 className="text-slate-900 font-semibold mb-4">Create New Board</h3>
            <form onSubmit={handleCreate} className="flex gap-3">
              {/* Floating-style Input */}
              <input
                autoFocus
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Board name (e.g. Sprint Planning)"
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-all"
              />

              {/* Action Buttons */}
              <button
                type="submit"
                disabled={creating || !newName.trim()}
                className="px-5 py-2.5 bg-black text-white hover:bg-slate-800 font-semibold rounded-xl transition-all"
              >
                {creating ? 'Creating…' : 'Create Board'}
              </button>

              <button
                type="button"
                onClick={() => { setShowCreate(false); setNewName(''); }}
                className="px-4 py-2.5 text-black border border-slate-600 rounded-xl hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
            </form>
          </div>
        )}

        {/* Join Board Form */}
        {showJoin && (
          <div className="mb-8 bg-white border border-slate-300 rounded-2xl p-6 shadow-xl shadow-slate-200/50">
            <h3 className="text-slate-900 font-semibold mb-4">Join Existing Board</h3>
            <form onSubmit={(e) => { e.preventDefault(); if (joinId.trim()) navigate(`/board/${joinId.trim()}`); }} className="flex gap-3">
              <input
                autoFocus
                type="text"
                value={joinId}
                onChange={(e) => setJoinId(e.target.value)}
                placeholder="Paste Room ID here..."
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-all"
              />
              <button
                type="submit"
                disabled={!joinId.trim()}
                className="px-5 py-2.5 bg-black text-white hover:bg-slate-800 font-semibold rounded-xl transition-all"
              >
                Join Board
              </button>
              <button
                type="button"
                onClick={() => { setShowJoin(false); setJoinId(''); }}
                className="px-4 py-2.5 text-black border border-slate-600 rounded-xl hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
            </form>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm shadow-sm">
            {error}
          </div>
        )}

        {/* Board Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-white border border-slate-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-12">
            {/* My Workspace Section */}
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                </svg>
                Your Workspace
              </h3>
              {boards.filter(b => b.ownerId === user.id).length === 0 ? (
                <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl shadow-sm">
                  <p className="text-slate-500 text-sm mb-4">No boards yet. Create your first board!</p>
                  <button
                    onClick={() => setShowCreate(true)}
                    className="px-5 py-2.5 bg-slate-950 hover:bg-slate-900 text-white font-medium rounded-xl transition-all"
                  >
                    Create Board
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {boards.filter(b => b.ownerId === user.id).map((board) => (
                    <div
                      key={board._id}
                      className="group bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-slate-300/50 hover:-translate-y-1"
                      onClick={() => navigate(`/board/${board.boardId}`)}
                    >
                      <div className="h-28 rounded-xl bg-slate-900 border border-slate-800 mb-5 flex items-center justify-center overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
                        <svg className="w-8 h-8 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" />
                        </svg>
                      </div>

                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-semibold truncate text-lg tracking-tight">{board.name}</h3>
                          <p className="text-slate-400 text-sm mt-1">
                            Created {new Date(board.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(board.boardId);
                            }}
                            title="Copy Room ID"
                            className="p-1.5 text-slate-500 hover:text-white hover:bg-white/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(board.boardId); }}
                            disabled={deletingId === board.boardId}
                            title="Delete board"
                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Activity Section */}
            {boards.filter(b => b.ownerId !== user.id).length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <svg className="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Recent Activity (Joined Boards)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {boards.filter(b => b.ownerId !== user.id).map((board) => (
                    <div
                      key={board._id}
                      className="group bg-slate-50 hover:bg-white border border-slate-200 hover:border-indigo-200 rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 relative overflow-hidden"
                      onClick={() => navigate(`/board/${board.boardId}`)}
                    >
                      <div className="absolute top-0 right-0 px-2 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-wider rounded-bl-lg">
                        Collaborator
                      </div>
                      <div className="h-24 rounded-xl bg-slate-100 border border-slate-200/60 mb-4 flex items-center justify-center overflow-hidden">
                        <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                        </svg>
                      </div>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-slate-900 font-bold truncate tracking-tight">{board.name}</h3>
                          <p className="text-slate-500 text-xs mt-1">
                            Joined recently
                          </p>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(board.boardId);
                            }}
                            title="Copy Room ID"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
