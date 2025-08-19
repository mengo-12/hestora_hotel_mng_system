'use client';

import { useState } from 'react';
import BookingForm from '../../components/BookingForm';
import GuestForm from '../../components/GuestForm';
import GroupBookingForm from '../../components/GroupBookingForm';

export default function NewBookingPage() {
    const [activeTab, setActiveTab] = useState('individual'); // individual, addGuest, group

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-[#1e1e1e] flex justify-center items-start pt-10">
            <div className="w-full max-w-5xl p-6 space-y-6 rounded-lg border shadow-md bg-gray-100 dark:bg-gray-800 border-gray-400 dark:border-gray-700">

                {/* Tabs */}
                <div className="flex border-b border-gray-300 dark:border-gray-600">
                    <button
                        className={`px-4 py-2 font-semibold ${activeTab === 'individual' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 dark:text-gray-300'}`}
                        onClick={() => setActiveTab('individual')}
                    >
                        حجز فردي
                    </button>
                    <button
                        className={`px-4 py-2 font-semibold ${activeTab === 'addGuest' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 dark:text-gray-300'}`}
                        onClick={() => setActiveTab('addGuest')}
                    >
                        إضافة نزيل
                    </button>
                    <button
                        className={`px-4 py-2 font-semibold ${activeTab === 'group' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 dark:text-gray-300'}`}
                        onClick={() => setActiveTab('group')}
                    >
                        حجز جماعي
                    </button>
                </div>

                {/* Tab Content */}
                <div>
                    {activeTab === 'individual' && <BookingForm />}
                    {activeTab === 'addGuest' && <GuestForm />}
                    {activeTab === 'group' && <GroupBookingForm />}
                </div>
            </div>
        </div>
    );
}
