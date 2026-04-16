// ============================================================
// Shared Types for Collaborative Whiteboard
// ============================================================

/** Authenticated user stored in application state */
export interface AppUser {
  id: string;
  userName: string;
  token: string;
  role: 'Admin' | 'User';
}

/** A collaborator visible in the user list panel */
export interface RoomUser {
  socketId: string;
  name: string;
  role: 'Admin' | 'User';
  canDraw: boolean;
}

/** A board document returned from the server */
export interface Board {
  _id: string;
  boardId: string;
  name: string;
  ownerId: string;
  adminName?: string;
  createdAt: string;
  updatedAt: string;
}

/** Auth API response */
export interface AuthResponse {
  token: string;
  user: {
    id: string;
    userName: string;
  };
}

/** Board create/list API response */
export interface BoardListResponse {
  boards: Board[];
}

/** Drawing tool names (legacy — now handled by tldraw) */
export type DrawingTool = 'pencil' | 'eraser' | 'rectangle' | 'circle' | 'line' | 'text' | 'select';

/** Remote cursor position */
export interface RemoteCursor {
  x: number;
  y: number;
  name?: string;
}

/** tldraw store change event emitted over WebSocket */
export interface TldrawSyncEvent {
  boardId: string;
  updates: unknown; // Raw tldraw store diff
}

/** API error shape */
export interface ApiError {
  message: string;
  status?: number;
}
