// // app/api/guests/route.js
// import prisma from "../../../lib/prisma";
// import { getToken } from "next-auth/jwt";

// const secret = process.env.NEXTAUTH_SECRET;

// async function requireAuth(req) {
//     const token = await getToken({ req, secret });
//     if (!token) throw new Error("UNAUTHORIZED");
//     return token;
// }

// // GET /api/guests?q=&page=&limit=
// export async function GET(req) {
//     try {
//         await requireAuth(req);

//         const { searchParams } = new URL(req.url);
//         const q = (searchParams.get("q") || "").trim();
//         const page = parseInt(searchParams.get("page") || "1", 10);
//         const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
//         const skip = (page - 1) * limit;

//         const where = q
//             ? {
//                 OR: [
//                     { firstName: { contains: q, mode: "insensitive" } },
//                     { lastName: { contains: q, mode: "insensitive" } },
//                     { phone: { contains: q, mode: "insensitive" } },
//                     { passportNumber: { contains: q, mode: "insensitive" } },
//                     { nationality: { contains: q, mode: "insensitive" } },
//                 ],
//             }
//             : {};

//         const [items, total] = await Promise.all([
//             prisma.guest.findMany({
//                 where,
//                 orderBy: { createdAt: "desc" },
//                 skip,
//                 take: limit,
//             }),
//             prisma.guest.count({ where }),
//         ]);

//         return new Response(JSON.stringify({ items, total, page, limit }), {
//             status: 200,
//             headers: { "Content-Type": "application/json" },
//         });
//     } catch (err) {
//         const status = err.message === "UNAUTHORIZED" ? 401 : 500;
//         return new Response(JSON.stringify({ error: err.message || "Failed" }), {
//             status,
//             headers: { "Content-Type": "application/json" },
//         });
//     }
// }

// // POST /api/guests
// export async function POST(req) {
//     try {
//         await requireAuth(req);
//         const body = await req.json();

//         // دعم الشكل المبسط: fullName + birthDate
//         let firstName = body.firstName;
//         let lastName = body.lastName;

//         if (!firstName && !lastName && body.fullName) {
//             const parts = String(body.fullName).trim().split(/\s+/);
//             firstName = parts.shift() || "";
//             lastName = parts.join(" ") || "";
//         }

//         const payload = {
//             firstName: String(firstName || "").trim(),
//             lastName: String(lastName || "").trim(),
//             gender: body.gender ? String(body.gender) : "",
//             dateOfBirth: body.dateOfBirth
//                 ? new Date(body.dateOfBirth)
//                 : body.birthDate
//                     ? new Date(body.birthDate)
//                     : null,
//             nationality: body.nationality ? String(body.nationality) : "",
//             maritalStatus: body.maritalStatus || null,
//             phone: body.phone ? String(body.phone) : "",
//             email: body.email || null,
//             address: body.address || null,
//             passportNumber: body.passportNumber ? String(body.passportNumber) : "",
//             passportIssue: body.passportIssue ? new Date(body.passportIssue) : null,
//             passportExpiry: body.passportExpiry ? new Date(body.passportExpiry) : null,
//             passportPlace: body.passportPlace ? String(body.passportPlace) : "",
//             nationalId: body.nationalId || null,
//             notes: body.notes || null,
//             preferences: body.preferences || null,
//         };

//         // تحقق مبسط للحقول الأساسية
//         const required = [
//             "firstName",
//             "lastName",
//             "gender",
//             "dateOfBirth",
//             "nationality",
//             "phone",
//             "passportNumber",
//             "passportIssue",
//             "passportExpiry",
//             "passportPlace",
//         ];
//         for (const k of required) {
//             if (!payload[k]) {
//                 return new Response(
//                     JSON.stringify({ error: `Missing required field: ${k}` }),
//                     { status: 400, headers: { "Content-Type": "application/json" } }
//                 );
//             }
//         }

//         const created = await prisma.guest.create({ data: payload });

//         return new Response(JSON.stringify(created), {
//             status: 201,
//             headers: { "Content-Type": "application/json" },
//         });
//     } catch (err) {
//         const status = err.message === "UNAUTHORIZED" ? 401 : 500;
//         return new Response(JSON.stringify({ error: err.message || "Failed" }), {
//             status,
//             headers: { "Content-Type": "application/json" },
//         });
//     }
// }


import prisma from "../../../lib/prisma";
import { getToken } from "next-auth/jwt";

const secret = process.env.NEXTAUTH_SECRET;

async function requireAuth(req) {
    const token = await getToken({ req, secret });
    if (!token) throw new Error("UNAUTHORIZED");
    return token;
}

// GET /api/guests?q=&page=&limit=&sortField=&sortOrder=&status=
export async function GET(req) {
    try {
        await requireAuth(req);

        const { searchParams } = new URL(req.url);
        const q = (searchParams.get("q") || "").trim();
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
        const sortField = searchParams.get("sortField") || "createdAt";
        const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";
        const status = searchParams.get("status");

        const skip = (page - 1) * limit;

        let where = q
            ? {
                OR: [
                    { firstName: { contains: q, mode: "insensitive" } },
                    { lastName: { contains: q, mode: "insensitive" } },
                    { phone: { contains: q, mode: "insensitive" } },
                    { passportNumber: { contains: q, mode: "insensitive" } },
                    { nationality: { contains: q, mode: "insensitive" } },
                ],
            }
            : {};

        if (status) {
            const now = new Date();
            if (status === "current") {
                where = { ...where, checkIn: { lte: now }, checkOut: { gte: now } };
            } else if (status === "left") {
                where = { ...where, checkOut: { lt: now } };
            } else if (status === "upcoming") {
                where = { ...where, checkIn: { gt: now } };
            }
        }

        const allowedSortFields = {
            name: [{ firstName: sortOrder }, { lastName: sortOrder }],
            phone: { phone: sortOrder },
            nationality: { nationality: sortOrder },
            createdAt: { createdAt: sortOrder }
        };

        const orderBy = allowedSortFields[sortField] || { createdAt: "desc" };

        const [items, total] = await Promise.all([
            prisma.guest.findMany({ where, orderBy, skip, take: limit }),
            prisma.guest.count({ where }),
        ]);

        return new Response(JSON.stringify({ items, total, page, limit }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        const statusCode = err.message === "UNAUTHORIZED" ? 401 : 500;
        return new Response(JSON.stringify({ error: err.message || "Failed" }), {
            status: statusCode,
            headers: { "Content-Type": "application/json" },
        });
    }
}

// POST /api/guests
export async function POST(req) {
    try {
        await requireAuth(req);
        const body = await req.json();

        const payload = {
            firstName: body.firstName || "",
            lastName: body.lastName || "",
            gender: body.gender || "",
            dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
            nationality: body.nationality || "",
            maritalStatus: body.maritalStatus || null,
            phone: body.phone || "",
            email: body.email || null,
            address: body.address || null,
            passportNumber: body.passportNumber || "",
            passportIssue: body.passportIssue ? new Date(body.passportIssue) : null,
            passportExpiry: body.passportExpiry ? new Date(body.passportExpiry) : null,
            passportPlace: body.passportPlace || "",
            nationalId: body.nationalId || null,
            notes: body.notes || null,
            preferences: body.preferences || null,
            checkIn: body.checkIn ? new Date(body.checkIn) : null,
            checkOut: body.checkOut ? new Date(body.checkOut) : null,
        };

        const required = [
            "firstName", "lastName", "gender", "dateOfBirth",
            "nationality", "phone", "passportNumber",
            "passportIssue", "passportExpiry", "passportPlace"
        ];

        for (const k of required) {
            if (!payload[k]) {
                return new Response(JSON.stringify({ error: `Missing required field: ${k}` }), {
                    status: 400,
                    headers: { "Content-Type": "application/json" }
                });
            }
        }

        const created = await prisma.guest.create({ data: payload });

        return new Response(JSON.stringify(created), {
            status: 201,
            headers: { "Content-Type": "application/json" },
        });

    } catch (err) {
        const statusCode = err.message === "UNAUTHORIZED" ? 401 : 500;
        return new Response(JSON.stringify({ error: err.message || "Failed" }), {
            status: statusCode,
            headers: { "Content-Type": "application/json" },
        });
    }
}

// PUT /api/guests/:id
export async function PUT(req) {
    try {
        await requireAuth(req);
        const { pathname } = new URL(req.url);
        const id = pathname.split("/").pop(); // استخراج id من الرابط
        if (!id) throw new Error("Missing guest ID");

        const body = await req.json();

        const payload = {
            firstName: body.firstName || "",
            lastName: body.lastName || "",
            gender: body.gender || "",
            dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
            nationality: body.nationality || "",
            maritalStatus: body.maritalStatus || null,
            phone: body.phone || "",
            email: body.email || null,
            address: body.address || null,
            passportNumber: body.passportNumber || "",
            passportIssue: body.passportIssue ? new Date(body.passportIssue) : null,
            passportExpiry: body.passportExpiry ? new Date(body.passportExpiry) : null,
            passportPlace: body.passportPlace || "",
            nationalId: body.nationalId || null,
            notes: body.notes || null,
            preferences: body.preferences || null,
            checkIn: body.checkIn ? new Date(body.checkIn) : null,
            checkOut: body.checkOut ? new Date(body.checkOut) : null,
        };

        const updated = await prisma.guest.update({
            where: { id },
            data: payload,
        });

        return new Response(JSON.stringify(updated), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

    } catch (err) {
        const statusCode = err.message === "UNAUTHORIZED" ? 401 : 500;
        return new Response(JSON.stringify({ error: err.message || "Failed" }), {
            status: statusCode,
            headers: { "Content-Type": "application/json" },
        });
    }
}



