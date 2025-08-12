const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    const hashed = bcrypt.hashSync('Admin123!', 10);
    await prisma.user.upsert({
        where: { email: 'admin@hotel.test' },
        update: {},
        create: {
            name: 'Admin',
            email: 'admin@hotel.test',
            password: hashed,
            role: 'ADMIN',
        },
    });

    // بعض الغرف التجريبية
    await prisma.room.createMany({
        data: [
            { roomNumber: '101', floor: 1, type: 'SINGLE', pricePerNight: 100.0 },
            { roomNumber: '102', floor: 1, type: 'DOUBLE', pricePerNight: 150.0 },
            { roomNumber: '201', floor: 2, type: 'SUITE', pricePerNight: 300.0 },
        ],
        skipDuplicates: true,
    });
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
