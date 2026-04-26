import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import TldrawBoard from '../components/TldrawBoard';
import type { AppUser, RoomUser } from '../types';

interface BoardRoomProps {
  user: AppUser;
}

let socket: Socket | null = null;

function getSocket(token: string) {
  if (!socket) {
    socket = io(import.meta.env.VITE_BACKEND_URL, { auth: { token } });
  }
  return socket;
}

export default function BoardRoom({ user }: BoardRoomProps) {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const [usersInRoom, setUsersInRoom] = useState<RoomUser[]>([]);
  const [canDraw, setCanDraw] = useState(true);
  const [myRole, setMyRole] = useState<'Admin' | 'User'>('User');
  const [copyLabel, setCopyLabel] = useState('Copy Room ID');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showAdminLeftDialog, setShowAdminLeftDialog] = useState(false);
  const [errorDialogMsg, setErrorDialogMsg] = useState<string | null>(null);
  const editorRef = useRef<any>(null);
  const sock = getSocket(user.token);

  useEffect(() => {
    if (!boardId) return;

    sock.emit('join-room', { userName: user.userName, roomId: boardId });

    sock.on('joined', (data: { role: 'Admin' | 'User' }) => {
      setMyRole(data.role);
    });

    sock.on('user_list', (users: RoomUser[]) => {
      setUsersInRoom(users);
    });

    sock.on('permission-changed', (status: boolean) => {
      setCanDraw(status);
    });

    sock.on('role-changed', (role: 'Admin' | 'User') => {
      setMyRole(role);
    });

    sock.on('admin-left', () => {
      setShowAdminLeftDialog(true);
    });

    sock.on('error', (msg: string) => {
      console.error(msg);
      setErrorDialogMsg(msg);
    });

    return () => {
      sock.emit('leave-room', { roomId: boardId });
      sock.off('joined');
      sock.off('user_list');
      sock.off('permission-changed');
      sock.off('role-changed');
      sock.off('admin-left');
      sock.off('error');
    };
  }, [boardId, user.userName, sock, navigate]);

  const handleCopyLink = useCallback(() => {
    if (boardId) {
      navigator.clipboard.writeText(boardId);
    }
    setCopyLabel('Copied ID!');
    setTimeout(() => setCopyLabel('Copy Room ID'), 2000);
  }, [boardId]);

  const handleTogglePermission = useCallback((targetSocketId: string) => {
    sock.emit('toggle-permission', { targetSocketId, roomId: boardId });
  }, [sock, boardId]);

  const handleClearCanvas = useCallback(() => {
    if (myRole !== 'Admin') return;
    if (!window.confirm('Clear the entire board? All drawings will be lost.')) return;
    sock.emit('clear_canvas', { roomId: boardId });
  }, [sock, boardId, myRole]);

  if (!boardId) return null;

  return (
    <div className="relative w-screen h-screen bg-slate-50 overflow-hidden">
      {/* ─── Top Bar ─────────────────────────────────────────── */}
      <header className="absolute top-0 left-0 right-0 z-[3000] flex items-center justify-between px-4 py-2 bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowLeaveDialog(true)}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            Leave
          </button>
          <div className="w-px h-4 bg-slate-300" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" />
              </svg>
            </div>
            <code className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded-lg">{boardId}</code>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!canDraw && (
            <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
              View only
            </div>
          )}
          {myRole === 'Admin' && (
            <button
              onClick={handleClearCanvas}
              className="text-xs text-slate-500 hover:text-red-500 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-lg px-2.5 py-1 transition-all"
            >
              Clear Board
            </button>
          )}
          {canDraw && (
            <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-0.5 bg-slate-50">
              <button
                onClick={() => editorRef.current?.undo()}
                className="p-1 text-slate-500 hover:text-slate-800 hover:bg-white rounded transition-colors"
                title="Undo (Ctrl+Z)"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                   <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                </svg>
              </button>
              <div className="w-px h-4 bg-slate-200" />
              <button
                onClick={() => editorRef.current?.redo()}
                className="p-1 text-slate-500 hover:text-slate-800 hover:bg-white rounded transition-colors"
                title="Redo (Ctrl+Y)"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                   <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" />
                </svg>
              </button>
            </div>
          )}
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg px-3 py-1.5 font-semibold transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
            </svg>
            {copyLabel}
          </button>
        </div>
      </header>

      {/* ─── Collaborators Sidebar ───────────────────────────── */}
      <aside className="absolute top-14 left-4 z-[3000] w-60 bg-white/90 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-xl overflow-hidden transition-all">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">
              Online · {usersInRoom.length}
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-all"
            title="Toggle list"
          >
            <svg className={`w-4 h-4 transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        {sidebarOpen && (
          <div className="max-h-64 overflow-y-auto">
            {usersInRoom.map((u) => (
              <div
                key={u.socketId}
                className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-50 transition-colors group"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {u.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 font-medium truncate">
                    {u.name}
                    {u.name === user.userName && <span className="text-slate-400 ml-1">(you)</span>}
                  </p>
                  <p className="text-[10px] text-slate-400">{u.role} · {u.canDraw ? 'can draw' : 'view only'}</p>
                </div>
                {myRole === 'Admin' && u.name !== user.userName && (
                  <button
                    onClick={() => handleTogglePermission(u.socketId)}
                    className="opacity-0 group-hover:opacity-100 text-[10px] font-semibold px-2 py-0.5 rounded-lg border transition-all"
                    style={{
                      color: u.canDraw ? '#ef4444' : '#22c55e',
                      borderColor: u.canDraw ? '#fca5a5' : '#86efac',
                      background: u.canDraw ? '#fef2f2' : '#f0fdf4',
                    }}
                  >
                    {u.canDraw ? 'Revoke' : 'Allow'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </aside>

      {/* ─── tldraw Canvas ──────────────────────────────────── */}
      <div className="absolute inset-0 pt-12">
        <TldrawBoard
          boardId={boardId}
          user={user}
          socket={sock}
          usersInRoom={usersInRoom}
          canDraw={canDraw}
          onEditorMount={(editor) => { editorRef.current = editor; }}
        />
      </div>

      {/* ─── Leave Confirmation Dialog ─────────────────────── */}
      {showLeaveDialog && (
        <div className="absolute inset-0 z-[4000] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-2">Leave Board?</h3>
              <p className="text-sm text-slate-600">
                Are you sure you want to leave this board? You can always rejoin later.
              </p>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowLeaveDialog(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLeaveDialog(false);
                  if (boardId) sock.emit('leave-room', { roomId: boardId });
                  navigate('/');
                }}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors shadow-sm shadow-red-500/20"
              >
                Yes, Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Admin Left Confirmation Dialog ─────────────────────── */}
      {showAdminLeftDialog && (
        <div className="absolute inset-0 z-[4000] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-2">Admin Left</h3>
              <p className="text-sm text-slate-600">
                The admin has left the board. You are being redirected to the dashboard.
              </p>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowAdminLeftDialog(false);
                  navigate('/');
                }}
                className="px-4 py-2 text-sm font-semibold text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg transition-colors shadow-sm shadow-indigo-500/20"
              >
                Okay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Error / Admin Not Joined Dialog ─────────────────────── */}
      {errorDialogMsg && (
        <div className="absolute inset-0 z-[4000] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-lg font-bold text-red-600 mb-2">Access Notice</h3>
              <p className="text-sm text-slate-600">
                {errorDialogMsg}
              </p>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setErrorDialogMsg(null);
                  navigate('/');
                }}
                className="px-4 py-2 text-sm font-semibold text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg transition-colors shadow-sm shadow-indigo-500/20"
              >
                Okay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
