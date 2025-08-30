import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// --- تعديل حجز حسب ID ---
export async function PUT(req, { params }) {
    try {
        // ✅ Next 13+ App Router: params يمكن أن يكون Promise
        const { id } = await params;

        const session = await getServerSession(authOptions);
        const currentUserId = session?.user?.id || "SYSTEM_USER_ID";

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
            status,
            extras = [],
            deletedIds = []
        } = await req.json();

        const currentBooking = await prisma.booking.findUnique({
            where: { id },
            include: { room: true, folio: true, extras: true }
        });

        if (!currentBooking)
            return new Response(JSON.stringify({ error: "Booking not found" }), { status: 404 });

        // --- تحديث الحجز ---
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
            include: { guest: true, room: true, ratePlan: true, company: true, folio: true, extras: true }
        });

        const folioId = updatedBooking.folio?.id;

        if (folioId) {
            // حذف Extras المحددة
            if (deletedIds.length > 0) {
                for (const exId of deletedIds) {
                    const ex = await prisma.extra.findUnique({ where: { id: exId } });
                    if (ex) {
                        await prisma.charge.deleteMany({ where: { folioId, description: ex.name } });
                        await prisma.extra.delete({ where: { id: exId } });
                    }
                }
            }


            for (const ex of extras) {
                const price = new Prisma.Decimal(ex.price || 0);
                const qty = new Prisma.Decimal(ex.quantity || 1);
                const taxRate = new Prisma.Decimal(ex.tax || 0);

                const subTotal = price.times(qty);
                const taxAmount = taxRate.greaterThan(1)
                    ? subTotal.times(taxRate.dividedBy(100)) // لو الضريبة نسبة (15)
                    : subTotal.times(taxRate); // لو الضريبة 0.15

                const amount = subTotal; // السعر الأساسي فقط

                if (ex.id) {
                    await prisma.extra.update({
                        where: { id: ex.id },
                        data: {
                            name: ex.name,
                            description: ex.description || "",
                            unitPrice: price,
                            quantity: qty,
                            tax: taxAmount,
                            status: ex.status || "Unpaid"
                        }
                    });

                    await prisma.charge.updateMany({
                        where: { folioId, description: ex.name },
                        data: { amount, tax: taxAmount }
                    });
                } else {
                    const newExtra = await prisma.extra.create({
                        data: {
                            bookingId: id,
                            folioId,
                            guestId,
                            name: ex.name,
                            description: ex.description || "",
                            unitPrice: price,
                            quantity: qty,
                            tax: taxAmount,
                            status: ex.status || "Unpaid"
                        }
                    });

                    await prisma.charge.create({
                        data: {
                            folioId,
                            code: "EXTRA",
                            description: newExtra.name,
                            amount, // السعر الأساسي
                            tax: taxAmount, // الضريبة منفصلة
                            postedById: currentUserId
                        }
                    });
                }
            }
        }



            // --- تحديث حالة الغرفة ---
            if (updatedBooking.roomId) {
                if (status === "InHouse") {
                    await prisma.room.update({ where: { id: updatedBooking.roomId }, data: { status: "OCCUPIED" } });
                } else if (status === "CheckedOut") {
                    await prisma.room.update({ where: { id: updatedBooking.roomId }, data: { status: "VACANT" } });
                }
            }

            // --- جلب نسخة جديدة محدثة بعد التعديلات ---
            const freshBooking = await prisma.booking.findUnique({
                where: { id },
                include: { guest: true, room: { include: { roomType: true } }, ratePlan: true, company: true, folio: { include: { charges: true, extras: true } }, extras: true }
            });

            // --- بث عالمي بعد أي تعديل ---
            try {
                await fetch("http://localhost:3001/api/broadcast", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ event: "BOOKING_UPDATED", data: freshBooking }),
                });
            } catch (err) {
                console.error("Socket broadcast failed:", err);
            }

            return new Response(JSON.stringify(freshBooking), { status: 200 });
        } catch (err) {
            console.error("Booking update failed:", err);
            return new Response(JSON.stringify({ error: "Failed to update booking" }), { status: 500 });
        }
    }








// --- حذف الحجز ---
export async function DELETE(req, { params }) {
        const id = params.id;
        if (!id) return new Response(JSON.stringify({ error: "Booking ID is required" }), { status: 400 });

        try {
            // حذف Extras المرتبطة
            await prisma.extra.deleteMany({ where: { bookingId: id } });

            // حذف Charges و Payments المرتبطة بكل Folio
            const folios = await prisma.folio.findMany({ where: { bookingId: id } });
            for (const f of folios) {
                await prisma.charge.deleteMany({ where: { folioId: f.id } });
                await prisma.payment.deleteMany({ where: { folioId: f.id } });
            }

            // حذف Folios
            await prisma.folio.deleteMany({ where: { bookingId: id } });

            // حذف الحجز نفسه
            await prisma.booking.delete({ where: { id } });

            // --- Broadcast عالمي ---
            try {
                await fetch("http://localhost:3001/api/broadcast", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ event: "BOOKING_DELETED", data: { id } }),
                });
            } catch (err) { console.error("Socket broadcast failed:", err); }


            return new Response(JSON.stringify({ message: "Booking deleted successfully" }), { status: 200 });
            // return new Response(JSON.stringify({ success: true }), { status: 200 });

        } catch (err) {
            console.error("Failed to delete booking:", err);
            return new Response(JSON.stringify({ error: "Failed to delete booking" }), { status: 500 });
        }
    }



