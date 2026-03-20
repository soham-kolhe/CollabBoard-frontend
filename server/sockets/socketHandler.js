import jwt from 'jsonwebtoken';
import Board from '../models/Board.js';

const JWT_SECRET = process.env.JWT_SECRET || 'wb_super_secret_key_change_in_prod';

const users = {};      // socketId -> { userName, userId, roomId, role, canDraw }
const roomAdmins = {}; // roomId -> socketId of current admin

const getRoomUsers = (roomId) =>
  Object.entries(users)
    .filter(([, u]) => u.roomId === roomId)
    .map(([socketId, u]) => ({
      socketId,
      name: u.userName,
      role: u.role,
      canDraw: u.canDraw,
    }));

export const socketHandler = (io) => {
  // ─── JWT handshake auth (optional – gracefully skips if no token) ───
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        socket.userId = decoded.id;
        socket.jwtUserName = decoded.userName;
      } catch {
        // token invalid – allow connection, identity comes from join-room payload
      }
    }
    next();
  });

  io.on('connection', (socket) => {
    // ─── Join Room ──────────────────────────────────────────────────
    socket.on('join-room', async ({ userName, roomId }) => {
      const displayName = socket.jwtUserName || userName;

      // Prevent duplicate names in room
      const isDuplicate = Object.values(users).some(
        (u) => u.roomId === roomId && u.userName.toLowerCase() === displayName.toLowerCase(),
      );
      if (isDuplicate) {
        socket.emit('error', 'Username already taken in this room.');
        return;
      }

      socket.join(roomId);

      // Load persisted tldraw state for this board
      const board = await Board.findOne({ boardId: roomId });
      if (board?.tldrawState) {
        socket.emit('load-tldraw-state', board.tldrawState);
      }

      // Assign Admin role to first user in room
      let role = 'User';
      if (!roomAdmins[roomId]) {
        roomAdmins[roomId] = socket.id;
        role = 'Admin';
      }

      users[socket.id] = {
        userName: displayName,
        userId: socket.userId || null,
        roomId,
        role,
        canDraw: true,
      };

      socket.emit('joined', { role, userName: displayName, roomId });
      io.to(roomId).emit('user_list', getRoomUsers(roomId));
    });

    // ─── tldraw Real-time Sync ──────────────────────────────────────
    socket.on('tldraw-changes', ({ roomId, updates }) => {
      socket.to(roomId).emit('tldraw-changes', { updates, fromSocketId: socket.id });
    });

    // ─── Save tldraw State (persisted) ─────────────────────────────
    socket.on('save-tldraw-state', async ({ roomId, state }) => {
      try {
        await Board.findOneAndUpdate(
          { boardId: roomId },
          { tldrawState: state },
          { upsert: false }, // only update, board must be created via REST
        );
      } catch (err) {
        console.error('tldraw state save failed:', err);
      }
    });

    // ─── Permission Toggle (Admin only) ────────────────────────────
    socket.on('toggle-permission', ({ targetSocketId, roomId }) => {
      const admin = users[socket.id];
      if (!admin || admin.role !== 'Admin') return;

      const targetUser = users[targetSocketId];
      if (!targetUser || targetUser.roomId !== roomId) return;

      targetUser.canDraw = !targetUser.canDraw;
      io.to(targetSocketId).emit('permission-changed', targetUser.canDraw);
      io.to(roomId).emit('user_list', getRoomUsers(roomId));
    });

    // ─── Clear Canvas (Admin only) ──────────────────────────────────
    socket.on('clear_canvas', async ({ roomId }) => {
      const user = users[socket.id];
      if (!user || user.role !== 'Admin') return;

      try {
        await Board.findOneAndUpdate({ boardId: roomId }, { tldrawState: null });
        io.to(roomId).emit('clear_canvas');
      } catch (err) { console.error('Clear canvas error:', err); }
    });

    // ─── Disconnect ─────────────────────────────────────────────────
    socket.on('disconnect', () => {
      const user = users[socket.id];
      if (!user) return;

      const { roomId, role } = user;
      delete users[socket.id];

      if (role === 'Admin' && roomAdmins[roomId] === socket.id) {
        delete roomAdmins[roomId];
        const nextAdminId = Object.keys(users).find((id) => users[id].roomId === roomId);
        if (nextAdminId) {
          roomAdmins[roomId] = nextAdminId;
          users[nextAdminId].role = 'Admin';
          io.to(nextAdminId).emit('role-changed', 'Admin');
        }
      }

      io.to(roomId).emit('user_list', getRoomUsers(roomId));
    });
  });
};
