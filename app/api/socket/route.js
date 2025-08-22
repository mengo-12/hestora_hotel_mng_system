// app/api/socket/route.js
import { Server } from "socket.io";
import { setIO } from "@/lib/socket";

let io;

export async function GET(req) {
    if (!io) {
        const httpServer = req?.socket?.server;

        if (httpServer?.io) {
            io = httpServer.io;
        } else {
            io = new Server(httpServer, {
                path: "/api/socket",
                cors: { origin: "*" },
            });

            httpServer.io = io;
            setIO(io);

            io.on("connection", (socket) => {
                console.log("User connected:", socket.id);

                socket.on("disconnect", () => {
                    console.log("User disconnected:", socket.id);
                });
            });
        }
    }

    return new Response("Socket.io server is running", { status: 200 });
}
