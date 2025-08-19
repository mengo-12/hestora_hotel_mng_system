// 'use client';

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';

// export default function AddRoomPage() {
//     const router = useRouter();

//     const roomTypes = [
//         'Single',
//         'Double',
//         'Triple',
//         'Suite',
//         'Deluxe Suite',
//         'Family',
//         'Executive',
//     ];

//     const roomStatuses = ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE'];

//     const [formData, setFormData] = useState({
//         roomNumber: '',
//         roomType: roomTypes[0],
//         status: roomStatuses[0],
//         pricePerNight: '',
//         description: '',
//     });

//     const [error, setError] = useState('');
//     const [loading, setLoading] = useState(false);

//     const handleChange = (e) => {
//         const { name, value } = e.target;
//         setFormData((prev) => ({ ...prev, [name]: value }));
//     };

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         setError('');

//         if (!formData.roomNumber.trim()) {
//             setError('رقم الغرفة مطلوب.');
//             return;
//         }
//         if (!formData.pricePerNight || isNaN(formData.pricePerNight)) {
//             setError('سعر الليلة يجب أن يكون رقماً صحيحاً.');
//             return;
//         }

//         setLoading(true);

//         try {
//             const res = await fetch('/api/rooms', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({
//                     roomNumber: formData.roomNumber,
//                     roomType: formData.roomType,
//                     status: formData.status,
//                     pricePerNight: parseFloat(formData.pricePerNight),
//                     description: formData.description,
//                 }),
//             });

//             if (!res.ok) {
//                 const err = await res.json();
//                 throw new Error(err.error || 'فشل إضافة الغرفة');
//             }

//             router.push('/rooms');
//         } catch (err) {
//             setError(err.message);
//             setLoading(false);
//         }
//     };

//     return (
//         <div
//             className="
//         max-w-3xl mx-auto p-10 bg-white rounded-md
//         shadow-md
//         font-sans
//         border border-gray-300
//         dark:bg-[#1e1e1e] dark:border-gray-700
//         "
//             style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}
//         >
//             <h1 className="text-3xl font-semibold mb-8 text-gray-900 dark:text-gray-100 select-none">
//                 إضافة غرفة جديدة
//             </h1>

//             {error && (
//                 <div
//                     className="
//           mb-6 p-4 bg-red-100 text-red-800 rounded border border-red-300
//           dark:bg-red-900 dark:text-red-400 dark:border-red-700
//           select-text
//           "
//                     role="alert"
//                     aria-live="assertive"
//                 >
//                     {error}
//                 </div>
//             )}

//             <form onSubmit={handleSubmit} className="space-y-6">
//                 {/* رقم الغرفة */}
//                 <div>
//                     <label
//                         htmlFor="roomNumber"
//                         className="block mb-1 font-semibold text-gray-700 dark:text-gray-300 select-none"
//                     >
//                         رقم الغرفة
//                     </label>
//                     <input
//                         type="text"
//                         id="roomNumber"
//                         name="roomNumber"
//                         value={formData.roomNumber}
//                         onChange={handleChange}
//                         required
//                         autoFocus
//                         placeholder="أدخل رقم الغرفة"
//                         className="
//               w-full
//               border border-gray-400 rounded-md
//               px-4 py-2
//               focus:outline-none focus:ring-2 focus:ring-blue-500
//               shadow-sm
//               bg-white dark:bg-[#252526] dark:border-gray-600 dark:text-gray-100
//               transition
//               "
//                     />
//                 </div>

//                 {/* نوع الغرفة */}
//                 <div>
//                     <label
//                         htmlFor="roomType"
//                         className="block mb-1 font-semibold text-gray-700 dark:text-gray-300 select-none"
//                     >
//                         نوع الغرفة
//                     </label>
//                     <select
//                         id="roomType"
//                         name="roomType"
//                         value={formData.roomType}
//                         onChange={handleChange}
//                         className="
//               w-full
//               border border-gray-400 rounded-md
//               px-4 py-2
//               bg-white dark:bg-[#252526] dark:border-gray-600 dark:text-gray-100
//               focus:outline-none focus:ring-2 focus:ring-blue-500
//               shadow-sm
//               transition
//               cursor-pointer
//             "
//                     >
//                         {roomTypes.map((type) => (
//                             <option key={type} value={type}>
//                                 {type}
//                             </option>
//                         ))}
//                     </select>
//                 </div>

//                 {/* الحالة */}
//                 <div>
//                     <label
//                         htmlFor="status"
//                         className="block mb-1 font-semibold text-gray-700 dark:text-gray-300 select-none"
//                     >
//                         حالة الغرفة
//                     </label>
//                     <select
//                         id="status"
//                         name="status"
//                         value={formData.status}
//                         onChange={handleChange}
//                         className="
//               w-full
//               border border-gray-400 rounded-md
//               px-4 py-2
//               bg-white dark:bg-[#252526] dark:border-gray-600 dark:text-gray-100
//               focus:outline-none focus:ring-2 focus:ring-blue-500
//               shadow-sm
//               transition
//               cursor-pointer
//             "
//                     >
//                         {roomStatuses.map((status) => (
//                             <option key={status} value={status}>
//                                 {status === 'AVAILABLE'
//                                     ? 'متاحة'
//                                     : status === 'OCCUPIED'
//                                         ? 'مشغولة'
//                                         : 'تحت الصيانة'}
//                             </option>
//                         ))}
//                     </select>
//                 </div>

//                 {/* سعر الليلة */}
//                 <div>
//                     <label
//                         htmlFor="pricePerNight"
//                         className="block mb-1 font-semibold text-gray-700 dark:text-gray-300 select-none"
//                     >
//                         سعر الليلة (بالريال)
//                     </label>
//                     <input
//                         type="number"
//                         id="pricePerNight"
//                         name="pricePerNight"
//                         value={formData.pricePerNight}
//                         onChange={handleChange}
//                         min="0"
//                         step="0.01"
//                         required
//                         placeholder="أدخل سعر الليلة"
//                         className="
//               w-full
//               border border-gray-400 rounded-md
//               px-4 py-2
//               bg-white dark:bg-[#252526] dark:border-gray-600 dark:text-gray-100
//               focus:outline-none focus:ring-2 focus:ring-blue-500
//               shadow-sm
//               transition
//               "
//                     />
//                 </div>

//                 {/* وصف الغرفة */}
//                 <div>
//                     <label
//                         htmlFor="description"
//                         className="block mb-1 font-semibold text-gray-700 dark:text-gray-300 select-none"
//                     >
//                         وصف الغرفة (اختياري)
//                     </label>
//                     <textarea
//                         id="description"
//                         name="description"
//                         value={formData.description}
//                         onChange={handleChange}
//                         rows="4"
//                         placeholder="أدخل وصفًا موجزًا للغرفة"
//                         className="
//               w-full
//               border border-gray-400 rounded-md
//               px-4 py-2
//               bg-white dark:bg-[#252526] dark:border-gray-600 dark:text-gray-100
//               focus:outline-none focus:ring-2 focus:ring-blue-500
//               shadow-sm
//               transition
//               resize-none
//               "
//                     />
//                 </div>

//                 {/* زر الإرسال */}
//                 <button
//                     type="submit"
//                     disabled={loading}
//                     className="
//             w-full
//             bg-blue-600 hover:bg-blue-700 active:bg-blue-800
//             text-white font-semibold py-3 rounded-md
//             shadow-md
//             transition
//             disabled:opacity-60 disabled:cursor-not-allowed
//             select-none"
//                 >
//                     {loading ? 'جارٍ الإضافة...' : 'إضافة الغرفة'}
//                 </button>
//             </form>
//         </div>
//     );
// }


'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RoomForm({ onSuccess }) {
    const router = useRouter();

    const roomTypes = ['Single', 'Double', 'Triple', 'Suite', 'Deluxe Suite', 'Family', 'Executive'];

    const [formData, setFormData] = useState({
        roomNumber: '',
        roomType: roomTypes[0],
        status: 'AVAILABLE', // يبدأ دائمًا متاحة
        pricePerNight: '',
        description: '',
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.roomNumber.trim()) return setError('رقم الغرفة مطلوب.');
        if (!formData.pricePerNight || isNaN(formData.pricePerNight)) return setError('سعر الليلة يجب أن يكون رقماً صحيحاً.');

        setLoading(true);

        try {
            const res = await fetch('/api/rooms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomNumber: formData.roomNumber,
                    roomType: formData.roomType,
                    status: formData.status,
                    pricePerNight: parseFloat(formData.pricePerNight),
                    description: formData.description,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'فشل إضافة الغرفة');
            }

            if (onSuccess) onSuccess();
            else router.push('/rooms');
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-10 bg-white rounded-md shadow-md font-sans border border-gray-300 dark:bg-[#1e1e1e] dark:border-gray-700">
            <h1 className="text-3xl font-semibold mb-8 text-gray-900 dark:text-gray-100 select-none">إضافة غرفة جديدة</h1>

            {error && <div className="mb-6 p-4 bg-red-100 text-red-800 rounded border border-red-300 dark:bg-red-900 dark:text-red-400 dark:border-red-700 select-text" role="alert">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* رقم الغرفة */}
                <div>
                    <label htmlFor="roomNumber" className="block mb-1 font-semibold text-gray-700 dark:text-gray-300 select-none">رقم الغرفة</label>
                    <input type="text" id="roomNumber" name="roomNumber" value={formData.roomNumber} onChange={handleChange} required autoFocus placeholder="أدخل رقم الغرفة"
                        className="w-full border border-gray-400 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm bg-white dark:bg-[#252526] dark:border-gray-600 dark:text-gray-100 transition" />
                </div>

                {/* نوع الغرفة */}
                <div>
                    <label htmlFor="roomType" className="block mb-1 font-semibold text-gray-700 dark:text-gray-300 select-none">نوع الغرفة</label>
                    <select id="roomType" name="roomType" value={formData.roomType} onChange={handleChange}
                        className="w-full border border-gray-400 rounded-md px-4 py-2 bg-white dark:bg-[#252526] dark:border-gray-600 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition cursor-pointer">
                        {roomTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                    </select>
                </div>

                {/* سعر الليلة */}
                <div>
                    <label htmlFor="pricePerNight" className="block mb-1 font-semibold text-gray-700 dark:text-gray-300 select-none">سعر الليلة (بالريال)</label>
                    <input type="number" id="pricePerNight" name="pricePerNight" value={formData.pricePerNight} onChange={handleChange} min="0" step="0.01" required placeholder="أدخل سعر الليلة"
                        className="w-full border border-gray-400 rounded-md px-4 py-2 bg-white dark:bg-[#252526] dark:border-gray-600 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition" />
                </div>

                {/* وصف الغرفة */}
                <div>
                    <label htmlFor="description" className="block mb-1 font-semibold text-gray-700 dark:text-gray-300 select-none">وصف الغرفة (اختياري)</label>
                    <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows="4" placeholder="أدخل وصفًا موجزًا للغرفة"
                        className="w-full border border-gray-400 rounded-md px-4 py-2 bg-white dark:bg-[#252526] dark:border-gray-600 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition resize-none" />
                </div>

                <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3 rounded-md shadow-md transition disabled:opacity-60 disabled:cursor-not-allowed select-none">
                    {loading ? 'جارٍ الإضافة...' : 'إضافة الغرفة'}
                </button>
            </form>
        </div>
    );
}
