import prisma from "@/lib/prisma";

// --- جلب حجز حسب ID ---
export async function GET(req, { params }) {
    try {
        const booking = await prisma.booking.findUnique({
            where: { id: params.id },
            include: { guest: true, room: true, ratePlan: true, company: true },
        });
        if (!booking) return new Response(JSON.stringify({ error: "Booking not found" }), { status: 404 });
        return new Response(JSON.stringify(booking), { status: 200 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: "Failed to fetch booking" }), { status: 500 });
    }
}

// --- تحديث الحجز ---
export async function PUT(req, { params }) {
    try {
        const { id } = params;
        const {
            propertyId,
            guestId,
            roomId,
            checkIn,
            checkOut,
            ratePlanId,
            adults,
            children,
            specialRequests,
            companyId,
            status
        } = await req.json();

        // === جلب الحجز الحالي ===
        const currentBooking = await prisma.booking.findUnique({
            where: { id },
            include: { room: true }
        });

        if (!currentBooking) return new Response(JSON.stringify({ error: "Booking not found" }), { status: 404 });

        // === التحقق من توفر الغرفة إذا تم تحديد roomId أو تغير checkIn/checkOut ===
        if (roomId && (checkIn || checkOut)) {
            const checkInDate = checkIn ? new Date(checkIn) : currentBooking.checkIn;
            const checkOutDate = checkOut ? new Date(checkOut) : currentBooking.checkOut;

            // تحقق من كل يوم في الفترة
            const dayCount = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
            for (let i = 0; i < dayCount; i++) {
                const date = new Date(checkInDate);
                date.setDate(date.getDate() + i);

                const inventory = await prisma.inventory.findUnique({
                    where: {
                        propertyId_roomTypeId_date: {
                            propertyId,
                            roomTypeId: currentBooking.roomId ? currentBooking.room.roomTypeId : roomId, 
                            date
                        }
                    }
                });

                if (!inventory || inventory.stopSell || inventory.sold >= inventory.allotment) {
                    return new Response(JSON.stringify({ error: `Room not available on ${date.toDateString()}` }), { status: 400 });
                }
            }
        }

        // === تحديث الحجز ===
        const updatedBooking = await prisma.booking.update({
            where: { id },
            data: {
                propertyId,
                guestId,
                roomId: roomId || null,
                checkIn: checkIn ? new Date(checkIn) : undefined,
                checkOut: checkOut ? new Date(checkOut) : undefined,
                ratePlanId: ratePlanId || null,
                adults,
                children,
                specialRequests: specialRequests || null,
                companyId: companyId || null,
                status: status || undefined
            },
            include: { guest: true, room: true, ratePlan: true, company: true }
        });

        // === تحديث حالة الغرفة إذا تم check-in أو check-out ===
        if (updatedBooking.roomId) {
            if (status === "InHouse") {
                await prisma.room.update({ where: { id: updatedBooking.roomId }, data: { status: "OCCUPIED" } });
            } else if (status === "CheckedOut") {
                await prisma.room.update({ where: { id: updatedBooking.roomId }, data: { status: "VACANT" } });
            }
        }

        // === بث عالمي ===
        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "BOOKING_UPDATED", data: updatedBooking }),
            });
            if (updatedBooking.roomId) {
                const roomStatus = status === "InHouse" ? "OCCUPIED" : status === "CheckedOut" ? "VACANT" : undefined;
                if (roomStatus) {
                    await fetch("http://localhost:3001/api/broadcast", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ event: "ROOM_STATUS_CHANGED", data: { roomId: updatedBooking.roomId, newStatus: roomStatus } }),
                    });
                }
            }
        } catch (err) { console.error("Socket broadcast failed:", err); }

        return new Response(JSON.stringify(updatedBooking), { status: 200 });

    } catch (err) {
        console.error("Booking update failed:", err);
        return new Response(JSON.stringify({ error: "Failed to update booking" }), { status: 500 });
    }
}


// --- حذف الحجز ---
export async function DELETE(req, { params }) {
    try {
        const id = params.id;

        // حذف Folio والسجلات المرتبطة
        await prisma.folio.deleteMany({ where: { bookingId: id } });

        // حذف الحجز نفسه
        await prisma.booking.delete({ where: { id } });

        // Broadcast عالمي
        try {
            await fetch("http://localhost:3001/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: "BOOKING_DELETED", data: { id } }),
            });
        } catch (err) { console.error("Socket broadcast failed:", err); }

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: "Failed to delete booking" }), { status: 500 });
    }
}
