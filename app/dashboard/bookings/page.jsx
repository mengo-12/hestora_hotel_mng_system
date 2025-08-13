"use client"


import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import NewBookingForm from "../../components/NewBookingForm";
import AddGuestModal from "../../components/AddGuestModal";

export default function BookingsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [bookings, setBookings] = useState([]);
    const [loadingBookings, setLoadingBookings] = useState(true);

    const [roomsStatus, setRoomsStatus] = useState([]);
    const [loadingRooms, setLoadingRooms] = useState(true);

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
            setBookings(await res.json());
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
            setRoomsStatus(await res.json());
        } catch (error) {
            alert(error.message);
        } finally {
            setLoadingRooms(false);
        }
    }

    function openBookingModal() {
        setShowBookingModal(true);
    }
    function closeBookingModal() {
        setShowBookingModal(false);
    }

    function openAddGuestModal() {
        setShowAddGuestModal(true);
    }
    function closeAddGuestModal() {
        setShowAddGuestModal(false);
    }

    async function handleBookingCreated() {
        await fetchBookings();
        closeBookingModal();
    }

    function handleGuestAdded() {
        closeAddGuestModal();
    }

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

            {/* حالة الغرف */}
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

            {/* جدول الحجوزات */}
            <section>
                {loadingBookings ? (
                    <p>جاري تحميل الحجوزات...</p>
                ) : bookings.length === 0 ? (
                    <p className="text-gray-700 dark:text-gray-300">لا يوجد حجوزات حاليا.</p>
                ) : (
                    <div className="overflow-x-auto shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
                        <table className="min-w-full text-sm text-right text-gray-800 dark:text-gray-200" dir="rtl">
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
                                        className={`${index % 2 === 0
                                            ? "bg-white dark:bg-gray-900"
                                            : "bg-gray-50 dark:bg-gray-800"} hover:bg-gray-200 dark:hover:bg-gray-700 transition`}
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

            {/* مودال الحجز */}
            {showBookingModal && (
                <div
                    className="fixed inset-0 bg-black/40 flex justify-center items-center z-50"
                    onClick={closeBookingModal}
                >
                    <div
                        className="bg-white dark:bg-gray-800 rounded shadow-lg w-[900px] max-h-[90vh] overflow-y-auto"
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
                            onAddGuestClick={openAddGuestModal}
                        />
                    </div>
                </div>
            )}

            {/* مودال النزيل */}
            {showAddGuestModal && (
                <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 overflow-auto" onClick={closeAddGuestModal}>
                    <div
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-[1000px] p-6"
                        onClick={e => e.stopPropagation()}
                    >
                        <AddGuestModal onClose={closeAddGuestModal} onGuestAdded={handleGuestAdded} />
                    </div>
                </div>
            )}
        </div>
    );
}
