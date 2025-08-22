import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// 🔹 Route اختبارية لفحص السيرفر
app.get("/", (req, res) => {
    res.send("Socket.io server running!");
});

const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: "*" },
});

io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("ROOM_UPDATED", (data) => io.emit("ROOM_UPDATED", data));
    socket.on("BOOKING_UPDATED", (data) => io.emit("BOOKING_UPDATED", data));
    socket.on("GUEST_UPDATED", (data) => io.emit("GUEST_UPDATED", data));
    socket.on("FOLIO_UPDATED", (data) => io.emit("FOLIO_UPDATED", data));
    socket.on("HK_UPDATED", (data) => io.emit("HK_UPDATED", data));
});

const PORT = 3001;
server.listen(PORT, () => console.log(`Socket.io server running on port ${PORT}`));
