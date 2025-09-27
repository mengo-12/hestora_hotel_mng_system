// import { NextResponse } from "next/server";
// import prisma from "@/lib/prisma"; // تأكد من مسار ملف prisma client

// export async function GET(req) {
//     try {
//         const { searchParams } = new URL(req.url);

//         const type = searchParams.get("type"); // Booking, Folio, Payment, Extra, Housekeeping
//         const propertyId = searchParams.get("propertyId");
//         const hotelGroupId = searchParams.get("hotelGroupId");
//         const from = searchParams.get("from"); // YYYY-MM-DD
//         const to = searchParams.get("to");     // YYYY-MM-DD
//         const search = searchParams.get("search") || "";
//         const page = parseInt(searchParams.get("page") || "1");
//         const limit = parseInt(searchParams.get("limit") || "20");

//         const skip = (page - 1) * limit;

//         let whereClause = {};

//         // فلترة حسب النوع
//         if (type === "Booking") {
//             whereClause = {
//                 propertyId: propertyId || undefined,
//                 ...(from && { checkIn: { gte: new Date(from) } }),
//                 ...(to && { checkOut: { lte: new Date(to) } }),
//             };
//             if (hotelGroupId) {
//                 whereClause.guest = { hotelGroupId };
//             }
//         } else if (type === "Folio") {
//             whereClause = {
//                 booking: propertyId ? { propertyId } : undefined,
//                 ...(from && { createdAt: { gte: new Date(from) } }),
//                 ...(to && { createdAt: { lte: new Date(to) } }),
//             };
//         } else if (type === "Payment") {
//             whereClause = {
//                 folio: propertyId ? { booking: { propertyId } } : undefined,
//                 ...(from && { postedAt: { gte: new Date(from) } }),
//                 ...(to && { postedAt: { lte: new Date(to) } }),
//             };
//         } else if (type === "Housekeeping") {
//             whereClause = {
//                 propertyId: propertyId || undefined,
//                 ...(from && { createdAt: { gte: new Date(from) } }),
//                 ...(to && { createdAt: { lte: new Date(to) } }),
//             };
//         } else if (type === "Extra") {
//             whereClause = {
//                 propertyId: propertyId || undefined,
//                 ...(from && { createdAt: { gte: new Date(from) } }),
//                 ...(to && { createdAt: { lte: new Date(to) } }),
//             };
//         }

//         // جلب البيانات مع الفلاتر
//         let reports = [];
//         let total = 0;

//         if (type === "Booking") {
//             total = await prisma.booking.count({ where: whereClause });
//             reports = await prisma.booking.findMany({
//                 where: whereClause,
//                 include: {
//                     guest: true,
//                     property: true,
//                     room: true,
//                     ratePlan: true,
//                     extras: true,
//                 },
//                 skip,
//                 take: limit,
//                 orderBy: { createdAt: "desc" },
//             });
//         } else if (type === "Folio") {
//             total = await prisma.folio.count({ where: whereClause });
//             reports = await prisma.folio.findMany({
//                 where: whereClause,
//                 include: {
//                     booking: { include: { guest: true, property: true } },
//                     guest: true,
//                     charges: true,
//                     payments: true,
//                     extras: true,
//                 },
//                 skip,
//                 take: limit,
//                 orderBy: { createdAt: "desc" },
//             });
//         } else if (type === "Payment") {
//             total = await prisma.payment.count({ where: whereClause });
//             reports = await prisma.payment.findMany({
//                 where: whereClause,
//                 include: {
//                     folio: { include: { booking: true, guest: true, property: true } },
//                     postedBy: true
//                 },
//                 skip,
//                 take: limit,
//                 orderBy: { postedAt: "desc" },
//             });
//         } else if (type === "Housekeeping") {
//             total = await prisma.housekeepingTask.count({ where: whereClause });
//             reports = await prisma.housekeepingTask.findMany({
//                 where: whereClause,
//                 include: {
//                     room: true,
//                     assignedTo: true,
//                     property: true
//                 },
//                 skip,
//                 take: limit,
//                 orderBy: { createdAt: "desc" },
//             });
//         } else if (type === "Extra") {
//             total = await prisma.extra.count({ where: whereClause });
//             reports = await prisma.extra.findMany({
//                 where: whereClause,
//                 include: {
//                     booking: true,
//                     guest: true,
//                     folio: true
//                 },
//                 skip,
//                 take: limit,
//                 orderBy: { createdAt: "desc" },
//             });
//         } else {
//             return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
//         }

//         // فلترة البحث داخل التفاصيل
//         if (search) {
//             const searchLower = search.toLowerCase();
//             reports = reports.filter(r => JSON.stringify(r).toLowerCase().includes(searchLower));
//         }

//         return NextResponse.json({
//             page,
//             limit,
//             total,
//             totalPages: Math.ceil(total / limit),
//             reports
//         });

//     } catch (err) {
//         console.error("Error fetching reports:", err);
//         return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
//     }
// }


// الكود الاعلى نسخة اصلية

// import { NextResponse } from "next/server";
// import prisma from "@/lib/prisma";

// export async function GET(req) {
//     try {
//         const { searchParams } = new URL(req.url);

//         const type = searchParams.get("type");
//         const propertyId = searchParams.get("propertyId");
//         const hotelGroupId = searchParams.get("hotelGroupId");
//         const from = searchParams.get("from");
//         const to = searchParams.get("to");
//         const search = searchParams.get("search") || "";
//         const page = parseInt(searchParams.get("page") || "1");
//         const limit = parseInt(searchParams.get("limit") || "20");

//         const skip = (page - 1) * limit;
//         let whereClause = {};
//         let reports = [];
//         let total = 0;
//         let summaries = {}; // 🟢 ملخصات

//         // فلترة WHERE حسب النوع
//         if (type === "Booking") {
//             whereClause = {
//                 propertyId: propertyId || undefined,
//                 ...(from && { checkIn: { gte: new Date(from) } }),
//                 ...(to && { checkOut: { lte: new Date(to) } }),
//             };
//             if (hotelGroupId) whereClause.guest = { hotelGroupId };
//         } else if (type === "Folio") {
//             whereClause = {
//                 booking: propertyId ? { propertyId } : undefined,
//                 ...(from && { createdAt: { gte: new Date(from) } }),
//                 ...(to && { createdAt: { lte: new Date(to) } }),
//             };
//         } else if (type === "Payment") {
//             whereClause = {
//                 folio: propertyId ? { booking: { propertyId } } : undefined,
//                 ...(from && { postedAt: { gte: new Date(from) } }),
//                 ...(to && { postedAt: { lte: new Date(to) } }),
//             };
//         } else if (type === "Housekeeping") {
//             whereClause = {
//                 propertyId: propertyId || undefined,
//                 ...(from && { createdAt: { gte: new Date(from) } }),
//                 ...(to && { createdAt: { lte: new Date(to) } }),
//             };
//         } else if (type === "Extra") {
//             whereClause = {
//                 propertyId: propertyId || undefined,
//                 ...(from && { createdAt: { gte: new Date(from) } }),
//                 ...(to && { createdAt: { lte: new Date(to) } }),
//             };
//         } else if (type === "Group") {
//             whereClause = {
//                 ...(propertyId && { propertyId }),
//                 ...(from && { createdAt: { gte: new Date(from) } }),
//                 ...(to && { createdAt: { lte: new Date(to) } }),
//             };
//         } else if (type === "RoomBlock") {
//             whereClause = {
//                 ...(propertyId && { propertyId }),
//                 ...(from && { createdAt: { gte: new Date(from) } }),
//                 ...(to && { createdAt: { lte: new Date(to) } }),
//             };
//         } else if (type === "Company") {
//             whereClause = {
//                 ...(from && { createdAt: { gte: new Date(from) } }),
//                 ...(to && { createdAt: { lte: new Date(to) } }),
//             };
//         }

//         // =================== استعلامات ===================
//         if (type === "Booking") {
//             total = await prisma.booking.count({ where: whereClause });
//             reports = await prisma.booking.findMany({
//                 where: whereClause,
//                 include: { guest: true, property: true, room: true, ratePlan: true, extras: true },
//                 skip, take: limit,
//                 orderBy: { createdAt: "desc" },
//             });
//             // 🟢 Summaries
//             summaries = {
//                 totalBookings: total,
//                 totalGuests: reports.reduce((acc, r) => acc + (r.adults || 0) + (r.children || 0), 0),
//             };
//         } else if (type === "Folio") {
//             total = await prisma.folio.count({ where: whereClause });
//             reports = await prisma.folio.findMany({
//                 where: whereClause,
//                 include: {
//                     booking: { include: { guest: true, property: true } },
//                     guest: true, charges: true, payments: true, extras: true,
//                 },
//                 skip, take: limit,
//                 orderBy: { createdAt: "desc" },
//             });
//             summaries = {
//                 totalFolios: total,
//                 totalCharges: reports.reduce((acc, r) => acc + r.charges.reduce((s, c) => s + c.amount, 0), 0),
//                 totalPayments: reports.reduce((acc, r) => acc + r.payments.reduce((s, p) => s + p.amount, 0), 0),
//             };
//         } else if (type === "Payment") {
//             total = await prisma.payment.count({ where: whereClause });
//             reports = await prisma.payment.findMany({
//                 where: whereClause,
//                 include: { folio: { include: { booking: true, guest: true, property: true } }, postedBy: true },
//                 skip, take: limit,
//                 orderBy: { postedAt: "desc" },
//             });
//             summaries = {
//                 totalPayments: total,
//                 amountPaid: reports.reduce((acc, p) => acc + (p.amount || 0), 0),
//             };
//         } else if (type === "Housekeeping") {
//             total = await prisma.housekeepingTask.count({ where: whereClause });
//             reports = await prisma.housekeepingTask.findMany({
//                 where: whereClause,
//                 include: { room: true, assignedTo: true, property: true },
//                 skip, take: limit,
//                 orderBy: { createdAt: "desc" },
//             });
//             summaries = {
//                 totalTasks: total,
//                 byStatus: reports.reduce((acc, t) => {
//                     acc[t.status] = (acc[t.status] || 0) + 1;
//                     return acc;
//                 }, {}),
//             };
//         } else if (type === "Extra") {
//             total = await prisma.extra.count({ where: whereClause });
//             reports = await prisma.extra.findMany({
//                 where: whereClause,
//                 include: { booking: true, guest: true, folio: true },
//                 skip, take: limit,
//                 orderBy: { createdAt: "desc" },
//             });
//             summaries = {
//                 totalExtras: total,
//                 totalValue: reports.reduce((acc, e) => acc + (e.price || 0), 0),
//             };
//         } else if (type === "Group") {
//             total = await prisma.groupMaster.count({ where: whereClause });
//             reports = await prisma.groupMaster.findMany({
//                 where: whereClause,
//                 include: { property: true, company: true, leader: true, bookings: true },
//                 skip, take: limit,
//                 orderBy: { createdAt: "desc" },
//             });
//             summaries = {
//                 totalGroups: total,
//                 totalBookings: reports.reduce((acc, g) => acc + g.bookings.length, 0),
//             };
//         } else if (type === "RoomBlock") {
//             total = await prisma.roomBlock.count({ where: whereClause });
//             reports = await prisma.roomBlock.findMany({
//                 where: whereClause,
//                 include: { property: true, group: true, company: true },
//                 skip, take: limit,
//                 orderBy: { createdAt: "desc" },
//             });
//             summaries = {
//                 totalBlocks: total,
//                 totalRooms: reports.reduce((acc, b) => acc + (b.totalRooms || 0), 0),
//             };
//         } else if (type === "Company") {
//             total = await prisma.company.count({ where: whereClause });
//             reports = await prisma.company.findMany({
//                 where: whereClause,
//                 include: { groups: true, bookings: true },
//                 skip, take: limit,
//                 orderBy: { createdAt: "desc" },
//             });
//             summaries = {
//                 totalCompanies: total,
//                 totalBookings: reports.reduce((acc, c) => acc + c.bookings.length, 0),
//             };
//         } else {
//             return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
//         }

//         // فلترة البحث داخل النتائج
//         if (search) {
//             const searchLower = search.toLowerCase();
//             reports = reports.filter(r => JSON.stringify(r).toLowerCase().includes(searchLower));
//         }

//         return NextResponse.json({
//             page, limit, total,
//             totalPages: Math.ceil(total / limit),
//             reports,
//             summaries, // 🟢 إضافة الملخصات هنا
//         });

//     } catch (err) {
//         console.error("Error fetching reports:", err);
//         return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
//     }
// }



import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const type = searchParams.get("type");
    const propertyId = searchParams.get("propertyId");
    const hotelGroupId = searchParams.get("hotelGroupId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const skip = (page - 1) * limit;
    let whereClause = {};
    let reports = [];
    let total = 0;
    let summaries = {};

    // دالة لإنشاء فلترة التاريخ بشكل صحيح (لتغطي أي نوع)
    const dateFilter = (startField, endField) => {
      const filters = [];
      if (from) filters.push({ [endField]: { gte: new Date(from) } });
      if (to) filters.push({ [startField]: { lte: new Date(to) } });
      return filters.length > 0 ? { AND: filters } : {};
    };

    // =================== إعداد whereClause لكل نوع ===================
    switch (type) {
      case "Booking":
        whereClause = {
          propertyId: propertyId || undefined,
          ...(hotelGroupId ? { guest: { hotelGroupId } } : {}),
          ...dateFilter("checkIn", "checkOut"),
        };
        break;

      case "Folio":
        whereClause = {
          booking: propertyId ? { propertyId } : undefined,
          ...dateFilter("createdAt", "createdAt"),
        };
        break;

      case "Payment":
        whereClause = {
          folio: propertyId ? { booking: { propertyId } } : undefined,
          ...dateFilter("postedAt", "postedAt"),
        };
        break;

      case "Housekeeping":
        whereClause = {
          propertyId: propertyId || undefined,
          ...dateFilter("createdAt", "createdAt"),
        };
        break;

      case "Extra":
        whereClause = {
          propertyId: propertyId || undefined,
          ...dateFilter("createdAt", "createdAt"),
        };
        break;

      case "Group":
        whereClause = {
          ...(propertyId && { propertyId }),
          ...dateFilter("createdAt", "createdAt"),
        };
        break;

      case "RoomBlock":
        whereClause = {
          ...(propertyId && { propertyId }),
          ...dateFilter("createdAt", "createdAt"),
        };
        break;

      case "Company":
        whereClause = {
          ...dateFilter("createdAt", "createdAt"),
        };
        break;

      default:
        return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
    }

    // =================== الاستعلامات ===================
    if (type === "Booking") {
      total = await prisma.booking.count({ where: whereClause });
      reports = await prisma.booking.findMany({
        where: whereClause,
        include: { guest: true, property: true, room: true, ratePlan: true, extras: true },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      });
      summaries = {
        totalBookings: total,
        totalGuests: reports.reduce((acc, r) => acc + (r.adults || 0) + (r.children || 0), 0),
      };
    } else if (type === "Folio") {
      total = await prisma.folio.count({ where: whereClause });
      reports = await prisma.folio.findMany({
        where: whereClause,
        include: {
          booking: { include: { guest: true, property: true } },
          guest: true,
          charges: true,
          payments: true,
          extras: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      });
      summaries = {
        totalFolios: total,
        totalCharges: reports.reduce((acc, r) => acc + r.charges.reduce((s, c) => s + c.amount, 0), 0),
        totalPayments: reports.reduce((acc, r) => acc + r.payments.reduce((s, p) => s + p.amount, 0), 0),
      };
    } else if (type === "Payment") {
      total = await prisma.payment.count({ where: whereClause });
      reports = await prisma.payment.findMany({
        where: whereClause,
        include: { folio: { include: { booking: true, guest: true, property: true } }, postedBy: true },
        skip,
        take: limit,
        orderBy: { postedAt: "desc" },
      });
      summaries = {
        totalPayments: total,
        amountPaid: reports.reduce((acc, p) => acc + (p.amount || 0), 0),
      };
    } else if (type === "Housekeeping") {
      total = await prisma.housekeepingTask.count({ where: whereClause });
      reports = await prisma.housekeepingTask.findMany({
        where: whereClause,
        include: { room: true, assignedTo: true, property: true },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      });
      summaries = {
        totalTasks: total,
        byStatus: reports.reduce((acc, t) => {
          acc[t.status] = (acc[t.status] || 0) + 1;
          return acc;
        }, {}),
      };
    } else if (type === "Extra") {
      total = await prisma.extra.count({ where: whereClause });
      reports = await prisma.extra.findMany({
        where: whereClause,
        include: { booking: true, guest: true, folio: true },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      });
      summaries = {
        totalExtras: total,
        totalValue: reports.reduce((acc, e) => acc + (e.price || 0), 0),
      };
    } else if (type === "Group") {
      total = await prisma.groupMaster.count({ where: whereClause });
      reports = await prisma.groupMaster.findMany({
        where: whereClause,
        include: { property: true, company: true, leader: true, bookings: true },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      });
      summaries = {
        totalGroups: total,
        totalBookings: reports.reduce((acc, g) => acc + g.bookings.length, 0),
      };
    } else if (type === "RoomBlock") {
      total = await prisma.roomBlock.count({ where: whereClause });
      reports = await prisma.roomBlock.findMany({
        where: whereClause,
        include: { property: true, group: true, company: true },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      });
      summaries = {
        totalBlocks: total,
        totalRooms: reports.reduce((acc, b) => acc + (b.totalRooms || 0), 0),
      };
    } else if (type === "Company") {
      total = await prisma.company.count({ where: whereClause });
      reports = await prisma.company.findMany({
        where: whereClause,
        include: { groups: true, bookings: true },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      });
      summaries = {
        totalCompanies: total,
        totalBookings: reports.reduce((acc, c) => acc + c.bookings.length, 0),
      };
    }

    // فلترة البحث داخل النتائج
    if (search) {
      const searchLower = search.toLowerCase();
      reports = reports.filter(r => JSON.stringify(r).toLowerCase().includes(searchLower));
    }

    return NextResponse.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      reports,
      summaries,
    });

  } catch (err) {
    console.error("Error fetching reports:", err);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}
