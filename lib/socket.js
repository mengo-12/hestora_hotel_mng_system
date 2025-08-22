// lib/socket.js
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
            console.log("A user connected: ", socket.id);
            socket.on("disconnect", () => console.log("User disconnected:", socket.id));
        });
    }
    return io;
};

export const getIO = () => {
    if (!io) throw new Error("Socket.io not initialized!");
    return io;
};
