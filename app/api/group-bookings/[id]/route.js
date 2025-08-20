import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function PUT(req, { params }) {
    try {
        const { id } = params;
        const data = await req.json();

        const updatedGroup = await prisma.$transaction(async (tx) => {
            // إذا أرسلنا غرف جديدة مع التعديل
            let updatedBookings = [];

            if (data.groupRooms && Array.isArray(data.groupRooms)) {
                for (const room of data.groupRooms) {
                    // حساب سعر الغرفة
                    const extrasTotal = room.extraServices
                        ?.map(s => s.price || 0)
                        .reduce((a, b) => a + b, 0) || 0;

                    const roomBaseTotal = (room.totalPrice || 0) + extrasTotal;
                    const roomDiscounted = roomBaseTotal - (room.discount || 0);
                    const roomFinal = roomDiscounted + (roomDiscounted * ((data.taxRate || 0) / 100));

                    // تحديث بيانات الحجز الفردي
                    const updatedBooking = await tx.booking.update({
                        where: { id: room.id },
                        data: {
                            guestId: room.guestId || data.mainGuestId,
                            checkIn: data.checkIn ? new Date(data.checkIn) : undefined,
                            checkOut: data.checkOut ? new Date(data.checkOut) : undefined,
                            roomId: room.roomId,
                            adults: room.adults || 1,
                            children: room.children || 0,
                            notes: room.notes || '',
                            totalPrice: roomFinal, // ✅ تحديث السعر النهائي للغرفة
                            status: room.status || 'CONFIRMED',
                            extrasData: room.extraServices
                                ?.filter(s => s.name && s.price)
                                .map(s => ({
                                    name: s.name,
                                    price: s.price,
                                    quantity: 1
                                })) || []
                        }
                    });

                    updatedBookings.push(updatedBooking);
                }
            }

            // حساب إجمالي السعر للحجز الجماعي بعد تحديث الغرف
            let groupTotal = 0;
            if (updatedBookings.length > 0) {
                groupTotal = updatedBookings.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);
            }

            const discounted = groupTotal - (data.discount || 0);
            const finalTotal = discounted + (discounted * ((data.taxRate || 0) / 100));

            // تحديث بيانات الحجز الجماعي
            const group = await tx.groupBooking.update({
                where: { id },
                data: {
                    checkIn: data.checkIn ? new Date(data.checkIn) : undefined,
                    checkOut: data.checkOut ? new Date(data.checkOut) : undefined,
                    notes: data.notes ?? undefined,
                    totalPrice: finalTotal || data.totalPrice,
                    status: data.status ?? undefined,
                },
                include: { bookings: true }
            });

            // إذا الحجز انتهى أو ألغي -> اجعل الغرف MAINTENANCE
            if (group.status === "CANCELLED" || new Date(group.checkOut) < new Date()) {
                for (const booking of group.bookings) {
                    await tx.room.update({
                        where: { id: booking.roomId },
                        data: { status: "MAINTENANCE" }
                    });

                    await tx.roomStatusLog.create({
                        data: {
                            roomId: booking.roomId,
                            oldStatus: "OCCUPIED",
                            newStatus: "MAINTENANCE",
                            changedBy: "System (Group Booking End)"
                        }
                    });
                }
            }

            return group;
        });

        return NextResponse.json(updatedGroup);

    } catch (error) {
        console.error("Error updating group booking:", error);
        return NextResponse.json({ error: "فشل في تحديث الحجز الجماعي" }, { status: 500 });
    }
}
