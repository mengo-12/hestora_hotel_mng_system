import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET(request) {
    // الكود السابق مع دعم البحث
    const { search } = Object.fromEntries(new URL(request.url).searchParams.entries());

    try {
        let guests;
        if (search && search.trim() !== "") {
            const term = search.trim();
            guests = await prisma.guest.findMany({
                where: {
                    OR: [
                        { firstName: { contains: term, mode: "insensitive" } },
                        { lastName: { contains: term, mode: "insensitive" } },
                        { idNumber: { contains: term, mode: "insensitive" } },
                        { phoneNumber: { contains: term, mode: "insensitive" } },
                    ],
                },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    idNumber: true,
                    phoneNumber: true,
                },
            });
        } else {
            guests = await prisma.guest.findMany({
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    idNumber: true,
                    phoneNumber: true,
                },
            });
        }

        return new Response(JSON.stringify(guests), { status: 200 });
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: "فشل في جلب الضيوف" }), { status: 500 });
    }
}

export async function POST(request) {
    try {
        const data = await request.json();

        // تحقق من الحقول المطلوبة (مثلاً: firstName, lastName)
        if (!data.firstName || !data.lastName) {
            return new Response(JSON.stringify({ error: "الاسم الأول والاسم الأخير مطلوبان" }), {
                status: 400,
            });
        }

        // إنشاء النزيل الجديد في قاعدة البيانات
        const newGuest = await prisma.guest.create({
            data: {
                firstName: data.firstName,
                middleName: data.middleName || null,
                lastName: data.lastName,
                familyName: data.familyName || null,
                birthDate: data.birthDate ? new Date(data.birthDate) : null,
                gender: data.gender || null,
                guestType: data.guestType || null,
                nationality: data.nationality || null,
                idType: data.idType || null,
                idNumber: data.idNumber || null,
                phoneNumber: data.phoneNumber || null,
                email: data.email || null,
                address: data.address || null,
            },
        });

        return new Response(JSON.stringify(newGuest), { status: 201 });
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: "فشل في إنشاء النزيل" }), { status: 500 });
    }
}
