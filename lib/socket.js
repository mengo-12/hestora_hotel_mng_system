// // lib/socket.js
// let io;

// export const setIO = (newIO) => {
//     io = newIO;
// };

// export const getIO = () => {
//     if (!io) throw new Error("Socket.io not initialized!");
//     return io;
// };



import { Server } from "socket.io";

let io;

export const initSocket = (server) => {
    if (!io) {
        io = new Server(server, {
            path: "/api/socket",
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            },
        });

        io.on("connection", (socket) => {
            console.log("✅ A user connected:", socket.id);
            socket.on("disconnect", () => console.log("⚡ User disconnected:", socket.id));
        });
    }

    return io;
};

export const getIO = (req) => {
    if (io) return io;

    if (req?.socket?.server) {
        io = new Server(req.socket.server, {
            path: "/api/socket",
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            },
        });

        io.on("connection", (socket) => {
            console.log("✅ A user connected:", socket.id);
            socket.on("disconnect", () => console.log("⚡ User disconnected:", socket.id));
        });

        // تخزين io في السيرفر لتجنب إعادة التهيئة
        req.socket.server.io = io;
        return io;
    }

    throw new Error("Socket.io not initialized!");
};
