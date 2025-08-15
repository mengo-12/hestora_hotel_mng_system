'use client';

import { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

export default function RoomAvailabilityCalendar({ roomId }) {
    const [bookings, setBookings] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        async function fetchBookings() {
            try {
                const res = await fetch(`/api/bookings?roomId=${roomId}`);
                const data = await res.json();
                setBookings(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error('Failed to fetch room bookings:', err);
                setBookings([]);
            }
        }
        if (roomId) fetchBookings();
    }, [roomId]);

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const daysInMonth = Array.from({ length: endOfMonth.getDate() }, (_, i) => i + 1);

    const isBooked = (day) => {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        return bookings.some(b => {
            const checkIn = new Date(b.checkIn);
            const checkOut = new Date(b.checkOut);
            return date >= checkIn && date <= checkOut;
        });
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const weekDays = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

    // لحساب اليوم الذي يبدأ فيه الشهر (index)
    const startDay = startOfMonth.getDay(); 

    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm">
            <div className="flex justify-between items-center mb-2">
                <button onClick={prevMonth} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
                    <ChevronLeftIcon className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                </button>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {currentDate.toLocaleString('ar-SA', { month: 'long', year: 'numeric' })}
                </h3>
                <button onClick={nextMonth} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
                    <ChevronRightIcon className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                </button>
            </div>

            {/* عناوين الأيام */}
            <div className="grid grid-cols-7 text-center font-medium text-gray-700 dark:text-gray-200 mb-1">
                {weekDays.map(day => (
                    <div key={day}>{day}</div>
                ))}
            </div>

            {/* الأيام */}
            <div className="grid grid-cols-7 text-center gap-1">
                {/* الأيام الفارغة قبل بداية الشهر */}
                {Array.from({ length: startDay }).map((_, i) => (
                    <div key={'empty-' + i}></div>
                ))}

                {daysInMonth.map(day => (
                    <div
                        key={day}
                        className={`p-2 rounded cursor-default ${
                            isBooked(day)
                                ? 'bg-red-500 text-white'
                                : 'bg-green-200 dark:bg-green-600 text-gray-900 dark:text-gray-100'
                        }`}
                    >
                        {day}
                    </div>
                ))}
            </div>
        </div>
    );
}
