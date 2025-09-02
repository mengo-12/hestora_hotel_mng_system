// app/api/housekeeping/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const BROADCAST_URL = "http://localhost:3001/api/broadcast"; // رابط البث العالمي

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const propertyId = searchParams.get("propertyId");
        const date = searchParams.get("date");

        if (!propertyId) return NextResponse.json({ error: "PropertyId is required" }, { status: 400 });

        // جلب الغرف مع المهام للخاصية المحددة
        const rooms = await prisma.room.findMany({
            where: { propertyId },
            include: {
                roomType: true,
                housekeepingTasks: {
                    orderBy: { createdAt: "desc" },
                    where: {
                        // إذا أردت تحديد المهام بحسب تاريخ معين، يمكنك تعديل هذا الشرط
                        createdAt: date ? {
                            gte: new Date(date + "T00:00:00.000Z"),
                            lt: new Date(date + "T23:59:59.999Z")
                        } : undefined
                    }
                }
            },
            orderBy: { number: "asc" }
        });

        return NextResponse.json({ rooms });
    } catch (err) {
        console.error("GET /api/housekeeping failed:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();

        // --- إضافة مهمة جديدة ---
        if (body.roomId && body.type) {
            const task = await prisma.housekeepingTask.create({
                data: {
                    roomId: body.roomId,
                    propertyId: body.propertyId,
                    type: body.type,
                    priority: body.priority || "Medium",
                    notes: body.notes || null,
                    assignedToId: body.assignedToId || null,
                }
            });

            // البث المباشر لجميع العملاء
            try {
                await fetch(BROADCAST_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ event: "HOUSEKEEPING_UPDATED", data: { task, roomId: body.roomId } })
                });
            } catch (err) {
                console.error("Broadcast failed HOUSEKEEPING_UPDATED:", err);
            }

            return NextResponse.json({ success: true, task });
        }

        // --- تحديث مهمة موجودة ---
        if (body.taskId && body.status) {
            const task = await prisma.housekeepingTask.update({
                where: { id: body.taskId },
                data: {
                    status: body.status,
                    notes: body.notes || undefined
                }
            });

            // تحديث حالة الغرفة إذا تم تمرير roomStatus
            if (body.roomStatus) {
                await prisma.room.update({
                    where: { id: body.roomId },
                    data: { status: body.roomStatus }
                });
            }

            // بث مباشر لجميع العملاء
            try {
                await fetch(BROADCAST_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ event: "HOUSEKEEPING_UPDATED", data: { taskId: body.taskId, roomId: body.roomId } })
                });
            } catch (err) {
                console.error("Broadcast failed HOUSEKEEPING_UPDATED:", err);
            }

            return NextResponse.json({ success: true, task });
        }

        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    } catch (err) {
        console.error("POST /api/housekeeping failed:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
