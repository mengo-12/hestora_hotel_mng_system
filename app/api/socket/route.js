import { Server } from "socket.io";

export const GET = async (req) => {
    return new Response("Socket server is running");
};

export const POST = async (req) => {
    // فقط لتوافق App Router
};

export const runtime = 'edge';

export default function SocketHandler(req) {
    if (!global.io) {
        const io = new Server({
            path: "/api/socket",
            cors: { origin: "*" },
        });
        global.io = io;
    }
    return new Response("Socket initialized");
}
