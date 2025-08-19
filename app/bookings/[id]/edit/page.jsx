"use client";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";

export default function EditBookingPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { id: bookingId } = useParams();

    const EXTRA_BED_PRICE = 50; // سعر السرير الإضافي لكل ليلة

    const [formData, setFormData] = useState({
        guestId: "",
        roomId: "",
        checkInDate: "",
        checkOutDate: "",
        adults: 1,
        children: 0,
        extraBeds: 0,
        status: "PENDING",
        paymentStatus: "UNPAID",
        source: "",
        notes: "",
        discountPercent: 0,
        taxPercent: 0,
        extraServices: [], // الخدمات الإضافية
    });

    const [guests, setGuests] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [extraServicesList, setExtraServicesList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [roomStatus, setRoomStatus] = useState("AVAILABLE");

    const [dailyPrices, setDailyPrices] = useState([]);
    const [roomPrice, setRoomPrice] = useState(0);
    const [totalPrice, setTotalPrice] = useState(0);

    // Calendar
    const [bookings, setBookings] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        if (status === "loading") return;
        if (!session) return router.push("/login");

        const userRole = (session?.user?.role || "").toUpperCase();
        if (!["ADMIN", "RECEPTIONIST"].includes(userRole)) {
            alert("غير مصرح لك بالدخول لهذه الصفحة");
            router.push("/dashboard");
            return;
        }

        fetchBooking();
        fetchGuests();
        fetchRooms();
        fetchExtraServices();
    }, [session, status]);

    async function fetchBooking() {
        try {
            const res = await fetch(`/api/bookings/${bookingId}`);
            if (!res.ok) throw new Error("فشل في جلب بيانات الحجز");
            const data = await res.json();
            setFormData(prev => ({
                ...prev,
                guestId: data.guestId || "",
                roomId: data.roomId || "",
                checkInDate: data.checkIn ? data.checkIn.slice(0, 10) : "",
                checkOutDate: data.checkOut ? data.checkOut.slice(0, 10) : "",
                adults: data.adults || 1,
                children: data.children || 0,
                extraBeds: data.extraBeds || 0,
                status: data.status || "PENDING",
                paymentStatus: data.paymentStatus || "UNPAID",
                source: data.source || "",
                notes: data.notes || "",
                discountPercent: data.discountPercent || 0,
                taxPercent: data.taxPercent || 0,
                extraServices: data.extraServices || [],
            }));
            setRoomStatus(data.room?.status || "AVAILABLE");
        } catch (error) {
            alert(error.message);
            router.push("/bookings");
        } finally {
            setLoading(false);
        }
    }

    async function fetchGuests() {
        try {
            const res = await fetch("/api/guests");
            if (!res.ok) throw new Error("فشل في جلب النزلاء");
            const data = await res.json();
            setGuests(data.items || []);
        } catch (error) {
            alert(error.message);
        }
    }

    async function fetchRooms() {
        try {
            const res = await fetch("/api/rooms");
            if (!res.ok) throw new Error("فشل في جلب الغرف");
            const data = await res.json();
            setRooms(Array.isArray(data) ? data : data.rooms || []);
        } catch (error) {
            alert(error.message);
        }
    }

    async function fetchExtraServices() {
        try {
            const res = await fetch("/api/extras");
            if (!res.ok) throw new Error("فشل في جلب الخدمات الإضافية");
            const data = await res.json();
            setExtraServicesList(data || []);
        } catch (error) {
            console.error(error);
        }
    }

    // حساب الأسعار اليومية مع الخدمات والأسرة الإضافية
    useEffect(() => {
        if (formData.roomId && formData.checkInDate && formData.checkOutDate) {
            const room = rooms.find((r) => String(r.id) === String(formData.roomId));
            const basePrice = room ? Number(room.pricePerNight) || 0 : 0;

            const discountPct = parseFloat(formData.discountPercent) || 0;
            const taxPct = parseFloat(formData.taxPercent) || 0;

            const checkInDate = new Date(formData.checkInDate);
            const checkOutDate = new Date(formData.checkOutDate);
            const nights = Math.max(Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)), 0);

            const dailyArr = [];
            let total = 0;

            for (let i = 0; i < nights; i++) {
                const current = new Date(checkInDate);
                current.setDate(current.getDate() + i);

                let extrasPrice = 0;
                formData.extraServices.forEach((sid) => {
                    const svc = extraServicesList.find((s) => String(s.id) === String(sid));
                    if (svc) extrasPrice += Number(svc.price) || 0;
                });

                const extraBedsPrice = (formData.extraBeds || 0) * EXTRA_BED_PRICE;

                const discount = ((basePrice + extrasPrice + extraBedsPrice) * discountPct) / 100;
                const tax = ((basePrice + extrasPrice + extraBedsPrice - discount) * taxPct) / 100;
                const net = basePrice + extrasPrice + extraBedsPrice - discount + tax;

                dailyArr.push({
                    date: current.toISOString().slice(0, 10),
                    base: Number(basePrice.toFixed(2)),
                    extras: Number(extrasPrice.toFixed(2)) + Number(extraBedsPrice.toFixed(2)),
                    discount: Number(discount.toFixed(2)),
                    tax: Number(tax.toFixed(2)),
                    net: Number(net.toFixed(2)),
                });

                total += net;
            }

            setRoomPrice(basePrice);
            setDailyPrices(dailyArr);
            setTotalPrice(Number(total.toFixed(2)));
        } else {
            setDailyPrices([]);
            setTotalPrice(0);
        }
    }, [
        formData.roomId,
        formData.checkInDate,
        formData.checkOutDate,
        formData.discountPercent,
        formData.taxPercent,
        formData.extraBeds,
        formData.extraServices,
        rooms,
        extraServicesList,
    ]);

    // تقويم الحجوزات
    useEffect(() => {
        async function fetchBookingsForRoom() {
            if (!formData.roomId) return;
            try {
                const res = await fetch(`/api/bookings?roomId=${formData.roomId}`);
                const data = await res.json();
                setBookings(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Failed to fetch room bookings:", err);
                setBookings([]);
            }
        }
        fetchBookingsForRoom();
    }, [formData.roomId]);

    const isBooked = (day) => {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        return bookings.some((b) => {
            const checkIn = new Date(b.checkIn);
            const checkOut = new Date(b.checkOut);
            return date >= checkIn && date <= checkOut;
        });
    };

    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                ...formData,
                checkIn: formData.checkInDate,
                checkOut: formData.checkOutDate,
                totalPrice,
                roomStatus,
            };
            delete payload.checkInDate;
            delete payload.checkOutDate;

            const res = await fetch(`/api/bookings/${bookingId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "خطأ في تحديث بيانات الحجز");
            }

            alert("تم تحديث بيانات الحجز بنجاح");
            router.push("/bookings");
        } catch (error) {
            alert(error.message);
        } finally {
            setSaving(false);
        }
    };

const handleCheckOut = async () => {
    if (!confirm("هل تريد إنهاء هذا الحجز وإنهاء إقامة النزيل؟")) return;
    setSaving(true);
    try {
        const payload = {
            status: "CHECKED_OUT",
            roomStatus: "MAINTENANCE",
            checkIn: formData.checkInDate,
            checkOut: formData.checkOutDate,
            totalPrice,
        };

        const res = await fetch(`/api/bookings/${bookingId}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "خطأ في إنهاء الحجز");
        }

        alert("تم إنهاء الحجز بنجاح. الغرفة الآن في الصيانة.");
        router.push("/bookings");
    } catch (error) {
        alert(error.message);
    } finally {
        setSaving(false);
    }
};


    if (status === "loading" || loading) {
        return <p className="text-center mt-10">جاري تحميل بيانات الحجز...</p>;
    }

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const daysInMonth = Array.from({ length: endOfMonth.getDate() }, (_, i) => i + 1);
    const startDay = startOfMonth.getDay();
    const weekDays = ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];



    return (
        <div className="max-w-4xl mx-auto p-6 rounded-lg shadow-md mt-8 bg-gray-900 text-white" dir="rtl">
            <h1 className="text-3xl font-bold mb-6 text-center">تعديل بيانات الحجز</h1>
            <form onSubmit={handleSubmit}>
                {/* الضيف */}
                <label className="flex flex-col text-right mb-4">
                    اختر الضيف <span className="text-red-500">*</span>
                    <select
                        required
                        name="guestId"
                        value={formData.guestId}
                        onChange={handleChange}
                        className="border p-2 rounded bg-gray-800 text-white border-gray-600"
                    >
                        <option value="">اختر ضيف</option>
                        {guests.map((g) => (
                            <option key={g.id} value={g.id}>
                                {g.firstName} {g.lastName} - {g.phone}
                            </option>
                        ))}
                    </select>
                </label>

                {/* الغرفة */}
                <label className="flex flex-col text-right mb-4">
                    اختر الغرفة <span className="text-red-500">*</span>
                    <select
                        required
                        name="roomId"
                        value={formData.roomId}
                        onChange={handleChange}
                        className="border p-2 rounded bg-gray-800 text-white border-gray-600"
                    >
                        <option value="">اختر غرفة</option>
                        {rooms.map((r) => (
                            <option key={r.id} value={r.id}>
                                {r.roomNumber || r.number} - {r.type}
                            </option>
                        ))}
                    </select>
                </label>

                {/* تواريخ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <label className="flex flex-col text-right">
                        تاريخ الدخول <span className="text-red-500">*</span>
                        <input
                            type="date"
                            name="checkInDate"
                            value={formData.checkInDate}
                            onChange={handleChange}
                            className="border p-2 rounded bg-gray-800 text-white border-gray-600"
                        />
                    </label>
                    <label className="flex flex-col text-right">
                        تاريخ الخروج <span className="text-red-500">*</span>
                        <input
                            type="date"
                            name="checkOutDate"
                            value={formData.checkOutDate}
                            onChange={handleChange}
                            className="border p-2 rounded bg-gray-800 text-white border-gray-600"
                        />
                    </label>
                </div>

                {/* عدد النزلاء والأسرة */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="block mb-1 font-medium">عدد البالغين</label>
                        <input
                            type="number"
                            min="1"
                            name="adults"
                            value={formData.adults}
                            onChange={handleChange}
                            className="w-full px-3 py-2 rounded border bg-gray-800 text-white border-gray-600"
                        />
                    </div>
                    <div>
                        <label className="block mb-1 font-medium">عدد الأطفال</label>
                        <input
                            type="number"
                            min="0"
                            name="children"
                            value={formData.children}
                            onChange={handleChange}
                            className="w-full px-3 py-2 rounded border bg-gray-800 text-white border-gray-600"
                        />
                    </div>
                    <div>
                        <label className="block mb-1 font-medium">عدد الأسرة الإضافية</label>
                        <input
                            type="number"
                            min="0"
                            name="extraBeds"
                            value={formData.extraBeds}
                            onChange={handleChange}
                            className="w-full px-3 py-2 rounded border bg-gray-800 text-white border-gray-600"
                        />
                    </div>
                </div>

                {/* حالة الحجز والدفع */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block mb-1 font-medium">حالة الحجز</label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="w-full px-3 py-2 rounded border bg-gray-800 text-white border-gray-600"
                        >
                            <option value="CONFIRMED">مؤكد</option>
                            <option value="PENDING">قيد الانتظار</option>
                            <option value="CANCELLED">ملغي</option>
                        </select>
                    </div>
                    <div>
                        <label className="block mb-1 font-medium">حالة الدفع</label>
                        <select
                            name="paymentStatus"
                            value={formData.paymentStatus}
                            onChange={handleChange}
                            className="w-full px-3 py-2 rounded border bg-gray-800 text-white border-gray-600"
                        >
                            <option value="UNPAID">غير مدفوع</option>
                            <option value="PAID">مدفوع</option>
                        </select>
                    </div>
                </div>

                {/* مصدر الحجز والملاحظات */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block mb-1 font-medium">مصدر الحجز</label>
                        <input
                            type="text"
                            name="source"
                            value={formData.source}
                            onChange={handleChange}
                            className="w-full px-3 py-2 rounded border bg-gray-800 text-white border-gray-600"
                        />
                    </div>
                    <div>
                        <label className="block mb-1 font-medium">ملاحظات الحجز</label>
                        <input
                            type="text"
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            className="w-full px-3 py-2 rounded border bg-gray-800 text-white border-gray-600"
                        />
                    </div>
                </div>

                {/* الخصم والضرائب */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label className="block mb-1 font-medium">الخصم %</label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            name="discountPercent"
                            value={formData.discountPercent}
                            onChange={handleChange}
                            className="w-full px-3 py-2 rounded border bg-gray-800 text-white border-gray-600"
                        />
                    </div>
                    <div>
                        <label className="block mb-1 font-medium">الضريبة %</label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            name="taxPercent"
                            value={formData.taxPercent}
                            onChange={handleChange}
                            className="w-full px-3 py-2 rounded border bg-gray-800 text-white border-gray-600"
                        />
                    </div>
                </div>

                {/* الخدمات الإضافية */}
                {extraServicesList.length > 0 && (
                    <div className="mt-4 mb-4">
                        <label className="block mb-1 text-gray-800 dark:text-gray-200 font-medium">الخدمات الإضافية</label>
                        <div className="flex flex-wrap gap-3">
                            {extraServicesList.map(service => (
                                <label
                                    key={service.id}
                                    className="flex items-center gap-2 border px-3 py-1 rounded cursor-pointer bg-white dark:bg-gray-700"
                                >
                                    <input
                                        type="checkbox"
                                        checked={formData.extraServices.includes(service.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    extraServices: [...prev.extraServices, service.id]
                                                }));
                                            } else {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    extraServices: prev.extraServices.filter(id => id !== service.id)
                                                }));
                                            }
                                        }}
                                    />
                                    {service.name} (+{service.price} ر.س)
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {/* زر الحفظ */}
                <button
                    type="submit"
                    disabled={saving}
                    className={`w-full py-3 rounded text-white font-bold ${saving ? "bg-gray-600" : "bg-blue-600 hover:bg-blue-700"
                        }`}
                >
                    {saving ? "جارٍ الحفظ..." : "تحديث بيانات الحجز"}
                </button>



                {/* قسم تغيير حالة الغرفة */}
                <div className="mb-6">
                    <label className="block mb-2 font-medium">حالة الغرفة</label>
                    <select
                        value={roomStatus}
                        onChange={(e) => setRoomStatus(e.target.value)}
                        className="w-full px-3 py-2 rounded border bg-gray-800 text-white border-gray-600"
                    >
                        <option value="AVAILABLE">متاحة</option>
                        <option value="OCCUPIED">مشغولة</option>
                        <option value="MAINTENANCE">صيانة / تنظيف</option>
                    </select>
                </div>

                {/* زر إنهاء الحجز */}
                <button
                    type="button"
                    onClick={handleCheckOut}
                    disabled={saving}
                    className="w-full mt-4 py-3 rounded bg-red-600 hover:bg-red-700 text-white font-bold"
                >
                    {saving ? "جارٍ المعالجة..." : "إنهاء الحجز"}
                </button>


            </form>

            {/* Calendar */}
            {formData.roomId && (
                <div className="mt-8">
                    <div className="flex justify-between items-center mb-2">
                        <button onClick={prevMonth} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
                            <ChevronLeftIcon className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                        </button>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {currentDate.toLocaleString("ar-SA", { month: "long", year: "numeric" })}
                        </h3>
                        <button onClick={nextMonth} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
                            <ChevronRightIcon className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                        </button>
                    </div>

                    {/* Week Days */}
                    <div className="grid grid-cols-7 text-center font-medium text-gray-700 dark:text-gray-200 mb-1">
                        {weekDays.map((day) => (
                            <div key={day}>{day}</div>
                        ))}
                    </div>

                    {/* Days */}
                    <div className="grid grid-cols-7 text-center gap-1">
                        {Array.from({ length: startDay }).map((_, i) => (
                            <div key={"empty-" + i}></div>
                        ))}

                        {daysInMonth.map((day) => (
                            <div
                                key={day}
                                className={`p-2 rounded cursor-default ${isBooked(day)
                                    ? "bg-red-500 text-white"
                                    : "bg-green-200 dark:bg-green-600 text-gray-900 dark:text-gray-100"
                                    }`}
                            >
                                {day}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Daily Price Table */}
            {dailyPrices.length > 0 && (
                <div className="overflow-x-auto border rounded bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 mt-6">
                    <table className="min-w-full table-auto">
                        <thead>
                            <tr className="bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100">
                                <th className="px-3 py-2 border">التاريخ</th>
                                <th className="px-3 py-2 border">سعر الغرفة</th>
                                <th className="px-3 py-2 border">الخصم</th>
                                <th className="px-3 py-2 border">الضرائب</th>
                                <th className="px-3 py-2 border">الصافي</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dailyPrices.map((d, idx) => (
                                <tr key={idx} className="text-gray-900 dark:text-gray-100">
                                    <td className="px-3 py-2 border">{d.date}</td>
                                    <td className="px-3 py-2 border">{d.base.toFixed(2)} ر.س</td>
                                    <td className="px-3 py-2 border">{d.discount.toFixed(2)} ر.س</td>
                                    <td className="px-3 py-2 border">{d.tax.toFixed(2)} ر.س</td>
                                    <td className="px-3 py-2 border font-semibold">{d.net.toFixed(2)} ر.س</td>
                                </tr>
                            ))}
                            <tr className="bg-gray-200 dark:bg-gray-600 font-bold text-gray-900 dark:text-gray-100">
                                <td className="px-3 py-2 border text-right" colSpan="4">
                                    الإجمالي
                                </td>
                                <td className="px-3 py-2 border">{totalPrice.toFixed(2)} ر.س</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
