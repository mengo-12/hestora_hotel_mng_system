'use client';

import BookingForm from '../../components/BookingForm';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';

export default function NewBookingPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-[#1e1e1e] flex justify-center items-start pt-10">
            {/* نافذة شبيهة بالويندوز */}
                
                
                    <h2 className="text-white font-semibold text-lg">إضافة حجز جديد</h2>


                {/* محتوى النافذة */}
                <div className="p-6">
                    <BookingForm />
                </div>

        </div>
    );
}
