"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function NewBookingForm({ onClose, onBookingCreated, onAddGuestClick }) {
    const [guests, setGuests] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        guestId: "",
        roomId: "",
        checkInDate: "",
        checkOutDate: "",
        status: "PENDING",
        paymentStatus: "UNPAID",
        notes: "",
        paymentMethod: "",
        bookingSource: "",
    });

    const [searchTerm, setSearchTerm] = useState("");
    const [showAddGuestModal, setShowAddGuestModal] = useState(false);

    // جلب النزلاء مع البحث
    async function fetchGuests(search = "") {
        try {
            const res = await fetch(`/api/guests?search=${encodeURIComponent(search)}`);
            if (!res.ok) throw new Error("فشل جلب الضيوف");
            const data = await res.json();
            setGuests(data);
        } catch (error) {
            alert(error.message);
        }
    }

    // جلب الغرف فقط مرة واحدة
    async function fetchRooms() {
        try {
            const res = await fetch("/api/rooms");
            if (!res.ok) throw new Error("فشل جلب الغرف");
            const data = await res.json();
            setRooms(data);
        } catch (error) {
            alert(error.message);
        }
    }

    useEffect(() => {
        fetchGuests();
        fetchRooms();
        setLoading(false);
    }, []);

    // البحث أثناء الكتابة
    function handleSearchChange(e) {
        const val = e.target.value;
        setSearchTerm(val);
        fetchGuests(val);
    }

    function handleChange(e) {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (!formData.guestId || !formData.roomId || !formData.checkInDate || !formData.checkOutDate) {
            alert("يرجى ملء جميع الحقول المطلوبة");
            return;
        }

        if (new Date(formData.checkOutDate) <= new Date(formData.checkInDate)) {
            alert("تاريخ الخروج يجب أن يكون بعد تاريخ الدخول");
            return;
        }

        try {
            const res = await fetch("/api/bookings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "فشل في إنشاء الحجز");
            }

            alert("تم إنشاء الحجز بنجاح");
            onBookingCreated();
            onClose();
        } catch (error) {
            alert(error.message);
        }
    }

    // بعد إضافة نزيل جديد، حدث القائمة واغلق المودال
    function handleGuestAdded(newGuest) {
        setGuests(prev => [newGuest, ...prev]);
        setFormData(prev => ({ ...prev, guestId: newGuest.id }));
        setShowAddGuestModal(false);
    }

    if (loading) return <p className="text-gray-700 dark:text-gray-300">جاري تحميل البيانات...</p>;

    return (
        <>
            <form onSubmit={handleSubmit} dir="rtl" className="p-4 bg-white dark:bg-gray-800 rounded-b-md max-h-[80vh] overflow-auto">
                {/* بحث النزلاء */}
                <div className="mb-3">
                    <label htmlFor="guestSearch" className="block mb-1 font-semibold text-gray-900 dark:text-gray-100">بحث النزيل</label>
                    <input
                        type="text"
                        id="guestSearch"
                        placeholder="ابحث بالاسم، رقم الهوية أو الجوال"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                </div>

                {/* اختيار النزيل */}
                <div className="mb-3 flex items-center gap-2">
                    <select
                        id="guestId"
                        name="guestId"
                        value={formData.guestId}
                        onChange={handleChange}
                        required
                        className="flex-grow border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                        <option value="">اختر النزيل</option>
                        {guests.map(g => (
                            <option key={g.id} value={g.id}>
                                {g.firstName} {g.lastName} — {g.idNumber || g.phoneNumber || ""}
                            </option>
                        ))}
                    </select>
                    <button
                        type="button"
                        onClick={onAddGuestClick}
                        className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                    >
                        إضافة نزيل جديد
                    </button>
                </div>

                {/* اختيار الغرفة */}
                <div className="mb-3">
                    <label htmlFor="roomId" className="block mb-1 font-semibold text-gray-900 dark:text-gray-100">اختر الغرفة</label>
                    <select
                        id="roomId"
                        name="roomId"
                        value={formData.roomId}
                        onChange={handleChange}
                        required
                        className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                        <option value="">اختر الغرفة</option>
                        {rooms.map(room => (
                            <option key={room.id} value={room.id}>
                                {room.roomNumber} - {room.type}
                            </option>
                        ))}
                    </select>
                </div>

                {/* تواريخ الدخول والخروج */}
                <div className="mb-3 flex gap-4">
                    <div className="flex-grow">
                        <label htmlFor="checkInDate" className="block mb-1 font-semibold text-gray-900 dark:text-gray-100">تاريخ الدخول</label>
                        <input
                            type="date"
                            id="checkInDate"
                            name="checkInDate"
                            value={formData.checkInDate}
                            onChange={handleChange}
                            required
                            className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                    </div>
                    <div className="flex-grow">
                        <label htmlFor="checkOutDate" className="block mb-1 font-semibold text-gray-900 dark:text-gray-100">تاريخ الخروج</label>
                        <input
                            type="date"
                            id="checkOutDate"
                            name="checkOutDate"
                            value={formData.checkOutDate}
                            onChange={handleChange}
                            required
                            className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                    </div>
                </div>

                {/* الحالة */}
                <div className="mb-3">
                    <label htmlFor="status" className="block mb-1 font-semibold text-gray-900 dark:text-gray-100">حالة الحجز</label>
                    <select
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        required
                        className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                        <option value="PENDING">قيد الانتظار</option>
                        <option value="CONFIRMED">مؤكد</option>
                        <option value="CANCELLED">ملغي</option>
                    </select>
                </div>

                {/* حالة الدفع */}
                <div className="mb-3">
                    <label htmlFor="paymentStatus" className="block mb-1 font-semibold text-gray-900 dark:text-gray-100">حالة الدفع</label>
                    <select
                        id="paymentStatus"
                        name="paymentStatus"
                        value={formData.paymentStatus}
                        onChange={handleChange}
                        required
                        className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                        <option value="UNPAID">غير مدفوع</option>
                        <option value="PAID">مدفوع</option>
                    </select>
                </div>

                {/* طريقة الدفع */}
                <div className="mb-3">
                    <label htmlFor="paymentMethod" className="block mb-1 font-semibold text-gray-900 dark:text-gray-100">طريقة الدفع</label>
                    <input
                        type="text"
                        id="paymentMethod"
                        name="paymentMethod"
                        value={formData.paymentMethod}
                        onChange={handleChange}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                </div>

                {/* مصدر الحجز */}
                <div className="mb-3">
                    <label htmlFor="bookingSource" className="block mb-1 font-semibold text-gray-900 dark:text-gray-100">مصدر الحجز</label>
                    <input
                        type="text"
                        id="bookingSource"
                        name="bookingSource"
                        value={formData.bookingSource}
                        onChange={handleChange}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                </div>

                {/* الملاحظات */}
                <div className="mb-3">
                    <label htmlFor="notes" className="block mb-1 font-semibold text-gray-900 dark:text-gray-100">ملاحظات</label>
                    <textarea
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        rows={3}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                </div>

                {/* أزرار الإلغاء والحفظ */}
                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded border border-gray-400 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                        إلغاء
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    >
                        حفظ
                    </button>
                </div>
            </form>

            {showAddGuestModal && (
                <AddGuestModal
                    onClose={() => setShowAddGuestModal(false)}
                    onGuestAdded={handleGuestAdded}
                />
            )}
        </>
    );
}





export default function BookingsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    // بيانات الحجوزات التفصيلية
    const [bookings, setBookings] = useState([]);
    const [loadingBookings, setLoadingBookings] = useState(true);

    // بيانات حالة الغرف (بطاقات)
    const [roomsStatus, setRoomsStatus] = useState([]);
    const [loadingRooms, setLoadingRooms] = useState(true);

    const [showModal, setShowModal] = useState(false);

    const [showBookingModal, setShowBookingModal] = useState(false);
    const [showAddGuestModal, setShowAddGuestModal] = useState(false);

    useEffect(() => {
        if (status === "loading") return;

        if (!session) {
            router.push("/login");
        } else if (!["ADMIN", "RECEPTIONIST"].includes(session.user.role)) {
            alert("غير مصرح لك بالدخول لهذه الصفحة");
            router.push("/dashboard");
        } else {
            fetchBookings();
            fetchRoomsStatus();
        }
    }, [session, status, router]);

    async function fetchBookings() {
        try {
            setLoadingBookings(true);
            const res = await fetch("/api/bookings");
            if (!res.ok) throw new Error("خطأ في جلب الحجوزات");
            const data = await res.json();
            setBookings(data);
        } catch (error) {
            alert(error.message);
        } finally {
            setLoadingBookings(false);
        }
    }

    async function fetchRoomsStatus() {
        try {
            setLoadingRooms(true);
            const res = await fetch("/api/bookings/rooms-status");
            if (!res.ok) throw new Error("خطأ في جلب حالة الغرف");
            const data = await res.json();
            setRoomsStatus(data);
        } catch (error) {
            alert(error.message);
        } finally {
            setLoadingRooms(false);
        }
    }

    function openModal() {
        setShowModal(true);
    }

    function closeModal() {
        setShowModal(false);
    }


    // فتح/إغلاق مودال الحجز
    function openBookingModal() {
        setShowBookingModal(true);
    }
    function closeBookingModal() {
        setShowBookingModal(false);
    }

    // فتح/إغلاق مودال إضافة النزيل
    function openAddGuestModal() {
        setShowAddGuestModal(true);
    }
    function closeAddGuestModal() {
        setShowAddGuestModal(false);
    }

    // تحديث الحجوزات بعد الإضافة
    async function handleBookingCreated() {
        await fetchBookings();
        closeBookingModal();
    }

    // إضافة نزيل جديد — تحديث القائمة بالمودال الحجز تلقائياً
    function handleGuestAdded(newGuest) {
        // هنا يمكنك استعمال إعادة جلب الضيوف لو أردت
        // أو تخبر NewBookingForm يضيف النزيل مباشرة (سنمرر الدالة)
        // لكن لأجل البساطة سنغلق مودال إضافة النزيل فقط
        closeAddGuestModal();
    }


    // ألوان الحالة
    const statusColors = {
        AVAILABLE: "bg-green-100 text-green-800",
        BOOKED: "bg-yellow-100 text-yellow-800",
        OCCUPIED: "bg-red-100 text-red-800",
    };

    return (
        <div className="p-6 bg-white dark:bg-gray-900 min-h-screen" dir="rtl">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">إدارة الحجوزات</h1>
                <button
                    onClick={openBookingModal}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                >
                    إضافة حجز جديد
                </button>
            </div>

            {/* قسم عرض حالة الغرف كـ بطاقات */}
            <section className="mb-10">
                <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">حالة الغرف</h2>

                {loadingRooms ? (
                    <p>جاري تحميل حالة الغرف...</p>
                ) : (
                    <div className="grid grid-cols-3 gap-6">
                        {roomsStatus.map(room => (
                            <div
                                key={room.id}
                                className={`p-4 rounded-lg shadow cursor-pointer ${statusColors[room.status]}`}
                                title={`رقم الغرفة: ${room.roomNumber}`}
                            >
                                <h3 className="text-xl font-semibold mb-2">الغرفة {room.roomNumber}</h3>
                                <p>
                                    الحالة:{" "}
                                    <span className="font-semibold">
                                        {room.status === "AVAILABLE"
                                            ? "فارغة"
                                            : room.status === "BOOKED"
                                                ? "محجوزة"
                                                : "مؤجرة"}
                                    </span>
                                </p>
                                {(room.status === "BOOKED" || room.status === "OCCUPIED") && (
                                    <p>النزيل: {room.guestName}</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* جدول الحجوزات التفصيلي */}
            <section>
                {loadingBookings ? (
                    <p>جاري تحميل الحجوزات...</p>
                ) : bookings.length === 0 ? (
                    <p className="text-gray-700 dark:text-gray-300">لا يوجد حجوزات حاليا.</p>
                ) : (
                    <div className="overflow-x-auto shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
                        <table
                            className="min-w-full text-sm text-right text-gray-800 dark:text-gray-200"
                            dir="rtl"
                        >
                            <thead className="bg-gray-100 dark:bg-gray-800">
                                <tr>
                                    <th className="px-4 py-3 border dark:border-gray-700">النزيل</th>
                                    <th className="px-4 py-3 border dark:border-gray-700">رقم الغرفة</th>
                                    <th className="px-4 py-3 border dark:border-gray-700">الموظف</th>
                                    <th className="px-4 py-3 border dark:border-gray-700">تاريخ الدخول</th>
                                    <th className="px-4 py-3 border dark:border-gray-700">تاريخ الخروج</th>
                                    <th className="px-4 py-3 border dark:border-gray-700">الحالة</th>
                                    <th className="px-4 py-3 border dark:border-gray-700">حالة الدفع</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bookings.map((booking, index) => (
                                    <tr
                                        key={booking.id}
                                        className={`cursor-pointer ${index % 2 === 0
                                            ? "bg-white dark:bg-gray-900"
                                            : "bg-gray-50 dark:bg-gray-800"
                                            } hover:bg-gray-200 dark:hover:bg-gray-700 transition`}
                                    >
                                        <td className="px-4 py-3 border dark:border-gray-700">
                                            {booking.guest?.firstName} {booking.guest?.lastName}
                                        </td>
                                        <td className="px-4 py-3 border dark:border-gray-700">
                                            {booking.room?.roomNumber || "-"}
                                        </td>
                                        <td className="px-4 py-3 border dark:border-gray-700">
                                            {booking.createdBy?.name || "-"}
                                        </td>
                                        <td className="px-4 py-3 border dark:border-gray-700">
                                            {new Date(booking.checkInDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 border dark:border-gray-700">
                                            {new Date(booking.checkOutDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 border dark:border-gray-700">{booking.status}</td>
                                        <td className="px-4 py-3 border dark:border-gray-700">
                                            {booking.paymentStatus}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* مودال إضافة الحجز */}
            {showBookingModal && (
                <div
                    className="fixed inset-0 bg-gray-900 bg-opacity-20 flex justify-center items-center z-50"
                    onClick={closeBookingModal}
                >
                    <div
                        className="bg-white dark:bg-gray-800 rounded shadow-lg max-w-md w-full"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="border-b px-4 py-2 flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">إضافة حجز جديد</h3>
                            <button onClick={closeBookingModal} className="text-gray-600 hover:text-gray-900 dark:hover:text-white text-xl">
                                &times;
                            </button>
                        </div>
                        <NewBookingForm
                            onClose={closeBookingModal}
                            onBookingCreated={handleBookingCreated}
                            onAddGuestClick={openAddGuestModal}  // مهم جداً لفتح مودال النزيل
                        />
                    </div>
                </div>
            )}

            {/* مودال إضافة نزيل */}
            {showAddGuestModal && (
                <AddGuestModal
                    onClose={closeAddGuestModal}
                    onGuestAdded={handleGuestAdded}
                />
            )}
        </div>
    );
}





function AddGuestModal({ onClose, onGuestAdded }) {
    const [guestData, setGuestData] = useState({
        firstName: "",
        middleName: "",
        lastName: "",
        familyName: "",
        birthDate: "",
        gender: "",
        guestType: "",
        nationality: "",
        idType: "",
        idNumber: "",
        phoneNumber: "",
        email: "",
        address: "",
    });

    function handleChange(e) {
        setGuestData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }

    async function handleSubmit(e) {
        e.preventDefault();

        // تحقق بسيط للحقل الإلزامي (يمكن توسعته لاحقاً)
        if (!guestData.firstName || !guestData.lastName || !guestData.email) {
            alert("يرجى ملء الحقول الإلزامية: الاسم الأول، الاسم الأخير، البريد الإلكتروني");
            return;
        }

        try {
            const res = await fetch("/api/guests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(guestData),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "فشل في إضافة النزيل");
            }

            const newGuest = await res.json();
            alert("تم إضافة النزيل بنجاح");
            onGuestAdded(newGuest);
            onClose();
        } catch (error) {
            alert(error.message);
        }
    }

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-start pt-10 z-50"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-gray-800 p-6 rounded shadow max-w-7xl w-full mx-4"
                onClick={e => e.stopPropagation()}
            >
                <h3 className="text-lg font-semibold mb-4">إضافة نزيل جديد</h3>
                <form onSubmit={handleSubmit} dir="rtl" className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input
                            name="firstName"
                            placeholder="الاسم الأول *"
                            value={guestData.firstName}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border rounded text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                        />
                        <input
                            name="middleName"
                            placeholder="الاسم الأوسط (اختياري)"
                            value={guestData.middleName}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border rounded text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                        />
                        <input
                            name="lastName"
                            placeholder="الاسم الأخير *"
                            value={guestData.lastName}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border rounded text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                        />
                        <input
                            name="familyName"
                            placeholder="لقب العائلة (اختياري)"
                            value={guestData.familyName}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border rounded text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                        />
                        <input
                            type="date"
                            name="birthDate"
                            placeholder="تاريخ الميلاد (اختياري)"
                            value={guestData.birthDate}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border rounded text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                        />
                        <select
                            name="gender"
                            value={guestData.gender}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border rounded text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                        >
                            <option value="">اختر الجنس (اختياري)</option>
                            <option value="MALE">ذكر</option>
                            <option value="FEMALE">أنثى</option>
                            <option value="OTHER">آخر</option>
                        </select>

                        <select
                            name="guestType"
                            value={guestData.guestType}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border rounded text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                        >
                            <option value="">تصنيف النزيل (اختياري)</option>
                            <option value="REGULAR">عادي</option>
                            <option value="VIP">VIP</option>
                            {/* عدّل القيم حسب enum الخاص بك */}
                        </select>

                        <input
                            name="nationality"
                            placeholder="الجنسية (اختياري)"
                            value={guestData.nationality}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border rounded text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                        />
                        <select
                            name="idType"
                            value={guestData.idType}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border rounded text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                        >
                            <option value="">نوع الهوية (اختياري)</option>
                            <option value="NATIONAL_ID">بطاقة شخصية</option>
                            <option value="PASSPORT">جواز سفر</option>
                            {/* عدّل حسب enum الخاص بك */}
                        </select>

                        <input
                            name="idNumber"
                            placeholder="رقم الهوية (اختياري)"
                            value={guestData.idNumber}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border rounded text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                        />
                        <input
                            name="phoneNumber"
                            placeholder="رقم الجوال (اختياري)"
                            value={guestData.phoneNumber}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border rounded text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                        />
                        <input
                            type="email"
                            name="email"
                            placeholder="البريد الإلكتروني *"
                            value={guestData.email}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border rounded text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                        />
                        <input
                            name="address"
                            placeholder="العنوان (اختياري)"
                            value={guestData.address}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border rounded text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                        >
                            إلغاء
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                        >
                            حفظ
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}