// scripts/createAdmin.js
import bcrypt from 'bcrypt'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const hashedPassword = await bcrypt.hash('admin123', 10) // غير كلمة السر حسب رغبتك

    const admin = await prisma.user.create({
        data: {
            name: 'Admin',
            email: 'admin@example.com', // غير البريد إذا تريد
            password: hashedPassword,
            role: 'ADMIN',
        },
    })

    console.log('تم إنشاء حساب أدمن:', admin)
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
