// app/api/houseKeeping/[taskId]/route.js
import prisma from "@/lib/prisma";


export async function PUT(req, { params }) {
    const taskId = params.taskId;
    if (!taskId) {
        return new Response(JSON.stringify({ success: false, error: "Missing taskId" }), { status: 400 });
    }

    try {
        const { status } = await req.json();
        const updatedTask = await prisma.housekeepingTask.update({
            where: { id: taskId },
            data: { status },
        });

        // بث المهمة المحدثة لجميع العملاء
        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "HOUSEKEEPING_UPDATED", data: { task: updatedTask, roomId: updatedTask.roomId } }),
            });
        } catch (err) {
            console.error("Broadcast failed HOUSEKEEPING_UPDATED:", err);
        }

        return new Response(JSON.stringify({ success: true, task: updatedTask }), { status: 200 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
}
