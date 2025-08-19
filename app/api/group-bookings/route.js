import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function POST(req) {
    try {
        const body = await req.json();
        const { mainGuestId, checkIn, checkOut, notes, groupRooms, discount = 0, taxRate = 0 } = body;

        // حساب إجمالي السعر لكل غرفة مع الخصم والضريبة
        const totalPrice = groupRooms.reduce((sum, room) => {
            const extrasTotal = room.extraServices
                .map(s => s.price || 0)
                .reduce((a, b) => a + b, 0);
            const roomTotal = (room.totalPrice || 0) + extrasTotal;
            return sum + roomTotal;
        }, 0);

        // تطبيق الخصم
        const discounted = totalPrice - discount;
        // إضافة الضريبة
        const finalTotal = discounted + (discounted * (taxRate / 100));

        const groupBooking = await prisma.groupBooking.create({
            data: {
                guestId: mainGuestId,
                checkIn: new Date(checkIn),
                checkOut: new Date(checkOut),
                notes,
                totalPrice: finalTotal,
                bookings: {
                    create: groupRooms.map(room => ({
                        guestId: room.guestId || mainGuestId,
                        checkIn: new Date(checkIn),
                        checkOut: new Date(checkOut),
                        roomId: room.roomId,
                        adults: room.adults || 1,
                        children: room.children || 0,
                        notes: room.notes || '',
                        totalPrice: room.totalPrice || 0,
                        status: room.status || 'CONFIRMED',
                        extrasData: room.extraServices
                            .filter(s => s.name && s.price)
                            .map(s => ({
                                name: s.name,
                                price: s.price,
                                quantity: 1
                            }))
                    }))
                }
            },
            include: {
                bookings: true,
                guest: true,
            },
        });

        return NextResponse.json(groupBooking);

    } catch (error) {
        console.error("Error creating group booking:", error);
        return NextResponse.json({ error: "فشل في إنشاء الحجز الجماعي" }, { status: 500 });
    }
}
