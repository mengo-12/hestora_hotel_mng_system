// lib/socket.js
let io;

export const setIO = (newIO) => {
    io = newIO;
};

export const getIO = () => {
    if (!io) throw new Error("Socket.io not initialized!");
    return io;
};
