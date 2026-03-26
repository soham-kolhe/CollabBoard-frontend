import jwt from 'jsonwebtoken';
import Board from '../models/Board.js';
import User from '../models/User.js';

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

      if (socket.userId) {
        // Kick ghost socket for the authenticated user reconnecting
        const oldSocketEntry = Object.entries(users).find(
          ([, u]) => u.roomId === roomId && u.userId === socket.userId
        );
        if (oldSocketEntry) {
          const oldSocketId = oldSocketEntry[0];
          io.to(oldSocketId).emit('error', 'You joined from another tab or reconnected.');
          io.sockets.sockets.get(oldSocketId)?.leave(roomId);
          handleLeave(oldSocketId, roomId);
        }
      } else {
        // Prevent duplicate names for guests
        const isDuplicate = Object.values(users).some(
          (u) => u.roomId === roomId && u.userName.toLowerCase() === displayName.toLowerCase(),
        );
        if (isDuplicate) {
          socket.emit('error', 'Username already taken in this room.');
          return;
        }
      }

      // 1. Fetch Board
      const board = await Board.findOne({ boardId: roomId });
      if (!board) {
        socket.emit('error', 'Board not found.');
        return;
      }

      // 2. Check Ownership & Admin presence
      const isOwner = socket.userId && socket.userId === board.ownerId.toString();
      if (!isOwner && !roomAdmins[roomId]) {
        socket.emit('error', 'The admin has not joined the board yet.');
        return;
      }

      // 3. Actually join the room
      socket.join(roomId);

      // 4. Track this board in the user's recent activity if they aren't the owner
      if (socket.userId && !isOwner) {
        try {
          await User.findByIdAndUpdate(socket.userId, { $addToSet: { joinedBoards: roomId } });
        } catch (err) {
          console.error('Failed to update joined boards:', err);
        }
      }

      // 5. Load persisted tldraw state for this board
      if (board.tldrawState) {
        socket.emit('load-tldraw-state', board.tldrawState);
      }

      // 6. Assign Admin role to the owner
      let role = 'User';
      if (isOwner) {
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

    // ─── Disconnect or Leave Room ──────────────────────────────────
    const handleLeave = (socketId, explicitRoomId = null) => {
      const user = users[socketId];
      if (!user) return;

      const roomId = explicitRoomId || user.roomId;
      const role = user.role;
      delete users[socketId];

      if (role === 'Admin' && roomAdmins[roomId] === socketId) {
        delete roomAdmins[roomId];
        io.to(roomId).emit('admin-left');
      }

      io.to(roomId).emit('user_list', getRoomUsers(roomId));
    };

    socket.on('leave-room', ({ roomId }) => {
      socket.leave(roomId);
      handleLeave(socket.id, roomId);
    });

    socket.on('disconnect', () => {
      handleLeave(socket.id);
    });
  });
};
