'use client';
import { useState } from "react";
import { useSocket } from "@/app/components/SocketProvider";

export default function CheckOutModal({ booking, onClose }) {
    const socket = useSocket();
    const [loading, setLoading] = useState(false);

    const handleCheckOut = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/bookings/${booking.id}/checkout`, { method: "POST" });
            if (!res.ok) throw new Error("Failed to check-out");

            const updatedBooking = await res.json();

            // البث عالمي عبر سيرفر خارجي
            try {
                await fetch("http://localhost:3001/api/broadcast", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ event: "BOOKING_CHECKOUT", data: updatedBooking.id }),
                });
            } catch (err) {
                console.error("Socket broadcast failed:", err);
            }

            onClose();
        } catch (err) {
            console.error(err);
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-96">
                <h2 className="text-xl font-bold mb-4">Check-Out</h2>
                <p>Are you sure you want to check-out <b>{booking.guest.firstName} {booking.guest.lastName}</b>?</p>
                <div className="mt-4 flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-500 text-white rounded"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCheckOut}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                        disabled={loading}
                    >
                        {loading ? "Checking Out..." : "Confirm"}
                    </button>
                </div>
            </div>
        </div>
    );
}
