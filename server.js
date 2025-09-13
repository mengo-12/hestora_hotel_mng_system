import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors"; // 📌 استيراد cors

const app = express();
const server = createServer(app);

const io = new Server(server, {
    path: "/api/socket",
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

// 🔹 السماح بالـ CORS لكل الطلبات من أي أصل
app.use(cors({
    origin: "http://localhost:3002", // أو "*" للسماح لكل الأصول
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
}));

io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);
    socket.on("disconnect", () => console.log("User disconnected:", socket.id));
});

// endpoint للبث
app.use(express.json());
app.post("/api/broadcast", (req, res) => {
    const { event, data } = req.body;
    console.log("📢 Broadcasting:", event, data);
    io.emit(event, data);
    res.send({ success: true });
});

server.listen(3001, () => {
    console.log("Socket.io server running on port 3001");
});
