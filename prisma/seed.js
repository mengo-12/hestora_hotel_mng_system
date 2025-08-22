import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    // 1️⃣ إنشاء Property
    const property = await prisma.property.create({
        data: {
            code: "HTL001",
            name: "Hestora Hotel",
            timezone: "UTC",
            currency: "USD",
        },
    });

    // 2️⃣ إنشاء Users
    const adminUser = await prisma.user.create({
        data: {
            email: "admin@hestora.com",
            password: "admin123",
            name: "Admin User",
            role: "Admin",
            propertyId: property.id,
        },
    });

    const frontDeskUser = await prisma.user.create({
        data: {
            email: "frontdesk@hestora.com",
            password: "frontdesk123",
            name: "Front Desk",
            role: "FrontDesk",
            propertyId: property.id,
        },
    });

    const hkUser = await prisma.user.create({
        data: {
            email: "hk@hestora.com",
            password: "hk123",
            name: "Housekeeping",
            role: "HK",
            propertyId: property.id,
        },
    });

    // 3️⃣ إنشاء RoomTypes
    const deluxeRoomType = await prisma.roomType.create({
        data: {
            code: "DELUXE",
            name: "Deluxe Room",
            capacity: 2,
            basePrice: 150,
            amenities: "WiFi, TV, AC",
            propertyId: property.id,
        },
    });

    const suiteRoomType = await prisma.roomType.create({
        data: {
            code: "SUITE",
            name: "Suite Room",
            capacity: 4,
            basePrice: 300,
            amenities: "WiFi, TV, AC, MiniBar",
            propertyId: property.id,
        },
    });

    // 4️⃣ إنشاء Rooms
    const rooms = [];
    for (let i = 1; i <= 5; i++) {
        rooms.push(
            await prisma.room.create({
                data: {
                    number: i < 3 ? `10${i}` : `20${i - 2}`,
                    propertyId: property.id,
                    roomTypeId: i < 3 ? deluxeRoomType.id : suiteRoomType.id,
                    status: "VACANT",
                    floor: i < 3 ? 1 : 2,
                },
            })
        );
    }

    // 5️⃣ إنشاء Guests
    const guests = [];
    guests.push(
        await prisma.guest.create({
            data: { firstName: "John", lastName: "Doe", email: "john@example.com" },
        })
    );
    guests.push(
        await prisma.guest.create({
            data: { firstName: "Jane", lastName: "Smith", email: "jane@example.com" },
        })
    );
    guests.push(
        await prisma.guest.create({
            data: { firstName: "Alice", lastName: "Brown", email: "alice@example.com" },
        })
    );

    // 6️⃣ إنشاء RatePlans
    const deluxeRatePlan = await prisma.ratePlan.create({
        data: {
            code: "DELUXE_STD",
            name: "Deluxe Standard",
            basePrice: 150,
            currency: "USD",
            isPublic: true,
            propertyId: property.id,
            roomTypeId: deluxeRoomType.id,
        },
    });

    const suiteRatePlan = await prisma.ratePlan.create({
        data: {
            code: "SUITE_STD",
            name: "Suite Standard",
            basePrice: 300,
            currency: "USD",
            isPublic: true,
            propertyId: property.id,
            roomTypeId: suiteRoomType.id,
        },
    });

    // 7️⃣ إنشاء RateRules لكل RatePlan
    const today = new Date();
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.rateRule.createMany({
        data: [
            { ratePlanId: deluxeRatePlan.id, date: today, priceOverride: 160, minLOS: 1, maxLOS: 5 },
            { ratePlanId: suiteRatePlan.id, date: today, priceOverride: 320, minLOS: 1, maxLOS: 5 },
            { ratePlanId: deluxeRatePlan.id, date: tomorrow, priceOverride: 155 },
            { ratePlanId: suiteRatePlan.id, date: tomorrow, priceOverride: 310 },
        ],
    });

    // 8️⃣ إنشاء Inventory
    await prisma.inventory.createMany({
        data: [
            { propertyId: property.id, roomTypeId: deluxeRoomType.id, date: today, allotment: 2, sold: 0, stopSell: false },
            { propertyId: property.id, roomTypeId: suiteRoomType.id, date: today, allotment: 3, sold: 0, stopSell: false },
        ],
    });

    // 9️⃣ إنشاء Bookings
    const bookings = [];
    bookings.push(
        await prisma.booking.create({
            data: {
                propertyId: property.id,
                guestId: guests[0].id,
                roomId: rooms[0].id,
                checkIn: today,
                checkOut: tomorrow,
                status: "Booked",
                ratePlanId: deluxeRatePlan.id,
                adults: 2,
                children: 0,
                specialRequests: "Near elevator",
            },
        })
    );

    bookings.push(
        await prisma.booking.create({
            data: {
                propertyId: property.id,
                guestId: guests[1].id,
                roomId: rooms[2].id,
                checkIn: today,
                checkOut: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                status: "Booked",
                ratePlanId: suiteRatePlan.id,
                adults: 2,
                children: 1,
            },
        })
    );

    // 10️⃣ إنشاء Folios + Charges + Payments
    for (let i = 0; i < bookings.length; i++) {
        const folio = await prisma.folio.create({
            data: { bookingId: bookings[i].id, guestId: bookings[i].guestId, status: "Open" },
        });

        await prisma.charge.create({
            data: {
                folioId: folio.id,
                code: "ROOM",
                description: "Room charge",
                amount: i === 0 ? 300 : 600,
                tax: i === 0 ? 15 : 30,
                postedById: adminUser.id,
            },
        });

        await prisma.payment.create({
            data: {
                folioId: folio.id,
                method: "Credit Card",
                amount: i === 0 ? 315 : 630,
                postedById: adminUser.id,
                ref: `CC1234${i}`,
            },
        });
    }

    // 11️⃣ إنشاء HousekeepingTasks
    for (let i = 0; i < 3; i++) {
        await prisma.housekeepingTask.create({
            data: {
                roomId: rooms[i].id,
                type: i === 0 ? "Clean" : i === 1 ? "Inspect" : "Maintenance",
                status: "Open",
                assignedToId: hkUser.id,
            },
        });
    }

    // 12️⃣ إنشاء RoomStatusLogs لكل غرفة
    for (const room of rooms) {
        await prisma.roomStatusLog.create({
            data: {
                roomId: room.id,
                oldStatus: "N/A",
                newStatus: room.status,
                changedById: adminUser.id,
            },
        });
    }

    console.log("✅ Full seed data for Opera-like Hotel PMS created successfully!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
