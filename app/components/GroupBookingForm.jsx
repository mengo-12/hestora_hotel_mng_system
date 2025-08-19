'use client';
import { useState, useEffect } from 'react';

export default function GroupBookingForm() {
    const [mainGuestId, setMainGuestId] = useState('');
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [source, setSource] = useState('Walk-in');
    const [notes, setNotes] = useState('');
    const [status, setStatus] = useState('CONFIRMED');

    const [guests, setGuests] = useState([]);
    const [availableRooms, setAvailableRooms] = useState([]);
    const [groupRooms, setGroupRooms] = useState([
        { guestId: '', roomId: '', adults: 1, children: 0, extraBeds: 0, extraServices: [] }
    ]);

    const [extraServicesList, setExtraServicesList] = useState([]);
    const [newServiceName, setNewServiceName] = useState('');
    const [newServicePrice, setNewServicePrice] = useState('');

    const [dailyPrices, setDailyPrices] = useState([]);
    const [subtotal, setSubtotal] = useState(0);
    const [discount, setDiscount] = useState(0);
    const [taxRate, setTaxRate] = useState(0); // بالنسبة المئوية
    const [totalPrice, setTotalPrice] = useState(0);

    useEffect(() => {
        async function fetchGuests() {
            try {
                const res = await fetch('/api/guests');
                const data = await res.json();
                setGuests(Array.isArray(data.items) ? data.items : []);
            } catch (err) { console.error(err); }
        }
        async function fetchRooms() {
            try {
                const res = await fetch('/api/rooms');
                const data = await res.json();
                setAvailableRooms(Array.isArray(data) ? data : []);
            } catch (err) { console.error(err); }
        }
        fetchGuests();
        fetchRooms();
    }, []);

    // حساب الأسعار
    useEffect(() => {
        if (!checkIn || !checkOut) return setDailyPrices([]);
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        const nights = Math.max(Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)), 0);

        let subtotalCalc = 0;

        groupRooms.forEach(room => {
            const roomData = availableRooms.find(r => r.id === room.roomId);
            if (!roomData) return;

            const basePrice = roomData.pricePerNight || 0;
            const extras = room.extraServices.reduce((sum, id) => {
                const s = extraServicesList.find(s => s.id === id);
                return sum + (s ? s.price : 0);
            }, 0);

            subtotalCalc += (basePrice + extras) * nights;
        });

        setSubtotal(subtotalCalc);

        const totalAfterDiscount = subtotalCalc - (discount || 0);
        const totalWithTax = totalAfterDiscount + (totalAfterDiscount * ((taxRate || 0) / 100));
        setTotalPrice(totalWithTax);

    }, [groupRooms, checkIn, checkOut, availableRooms, extraServicesList, discount, taxRate]);

    const handleRoomChange = (index, field, value) => {
        setGroupRooms(prev => {
            const updated = [...prev];
            updated[index][field] = value;
            return updated;
        });
    };

    const addRoom = () => setGroupRooms(prev => [...prev, { guestId: '', roomId: '', adults: 1, children: 0, extraBeds: 0, extraServices: [] }]);
    const removeRoom = (index) => setGroupRooms(prev => prev.filter((_, i) => i !== index));

    const addService = () => {
        if (!newServiceName || !newServicePrice) return;
        const id = `${newServiceName}-${Date.now()}`;
        setExtraServicesList(prev => [...prev, { id, name: newServiceName, price: parseFloat(newServicePrice) }]);
        setNewServiceName('');
        setNewServicePrice('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                mainGuestId,
                checkIn,
                checkOut,
                source,
                notes,
                status,
                discount,
                taxRate,
                groupRooms: groupRooms.map(room => ({
                    ...room,
                    extrasData: room.extraServices.map(id => {
                        const s = extraServicesList.find(x => x.id === id);
                        return s ? { name: s.name, price: s.price, quantity: 1 } : null;
                    }).filter(Boolean)
                }))
            };

            const res = await fetch('/api/group-bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok) {
                console.error(data.error || 'حدث خطأ');
                alert(data.error || 'فشل الحجز');
                return;
            }

                        // تحديث حالة كل غرفة تلقائيًا بعد الحجز الجماعي
            for (const room of groupRooms) {
                if (room.roomId) {
                    await fetch('/api/rooms/update-status', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            roomId: room.roomId,
                            newStatus: 'OCCUPIED',
                            changedBy: 'Reception',
                        }),
                    });
                }
            }

            alert('تم إنشاء الحجز الجماعي بنجاح!');
            setMainGuestId('');
            setCheckIn('');
            setCheckOut('');
            setSource('Walk-in');
            setNotes('');
            setStatus('CONFIRMED');
            setGroupRooms([{ guestId: '', roomId: '', adults: 1, children: 0, extraBeds: 0, extraServices: [] }]);
            setExtraServicesList([]);
            setDiscount(0);
            setTaxRate(0);
            setDailyPrices([]);
            setSubtotal(0);
            setTotalPrice(0);

        } catch (err) {
            console.error(err);
            alert('حدث خطأ أثناء إرسال الحجز');
        }

    };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">


            {/* بيانات المجموعة */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label>اسم المجموعة</label>
                    <input type="text" className="w-full border rounded p-2" />
                </div>
                <div>
                    <label>اسم صاحب المجموعة</label>
                    <input type="text" className="w-full border rounded p-2" />
                </div>
            </div>

            {/* صاحب الحجز */}
            <div>
                <label>النزيل الرئيسي / صاحب الحجز</label>
                <select value={mainGuestId} onChange={e => setMainGuestId(e.target.value)} required
                    className="w-full px-3 py-2 border rounded">
                    <option value="">اختر النزيل</option>
                    {guests.map(g => <option key={g.id} value={g.id}>{g.firstName} {g.lastName}</option>)}
                </select>
            </div>

            {/* بيانات الحجز العام */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                    <label>تاريخ الوصول</label>
                    <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} required className="w-full px-3 py-2 border rounded" />
                </div>
                <div>
                    <label>تاريخ المغادرة</label>
                    <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} required className="w-full px-3 py-2 border rounded" />
                </div>
                <div>
                    <label>مصدر الحجز</label>
                    <input type="text" value={source} onChange={e => setSource(e.target.value)} className="w-full px-3 py-2 border rounded" />
                </div>
                <div>
                    <label>حالة الحجز</label>
                    <select value={status} onChange={e => setStatus(e.target.value)} className="w-full px-3 py-2 border rounded">
                        <option value="CONFIRMED">مؤكد</option>
                        <option value="PENDING">قيد الانتظار</option>
                        <option value="CANCELLED">ملغي</option>
                    </select>
                </div>
            </div>

            {/* بيانات الخصم والضريبة */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label>الخصم (ر.س)</label>
                    <input type="number" min="0" value={discount} onChange={e => setDiscount(parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border rounded" />
                </div>
                <div>
                    <label>الضريبة (%)</label>
                    <input type="number" min="0" value={taxRate} onChange={e => setTaxRate(parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border rounded" />
                </div>
            </div>

            {/* خدمات إضافية (يضيفها المستخدم فقط) */}
            <div className="border p-3 rounded space-y-2">
                <h4 className="font-semibold">إضافة خدمة جديدة</h4>
                <div className="flex gap-2">
                    <input type="text" placeholder="اسم الخدمة" value={newServiceName} onChange={e => setNewServiceName(e.target.value)} className="flex-1 border rounded p-2" />
                    <input type="number" placeholder="السعر" value={newServicePrice} onChange={e => setNewServicePrice(e.target.value)} className="w-32 border rounded p-2" />
                    <button type="button" onClick={addService} className="bg-blue-600 text-white px-3 rounded">+</button>
                </div>
            </div>

            {/* غرف الحجز */}
            {groupRooms.map((room, idx) => (
                <div key={idx} className="border p-4 rounded space-y-2">
                    <div className="flex justify-between items-center">
                        <h4>الغرفة {idx + 1}</h4>
                        {groupRooms.length > 1 && <button type="button" onClick={() => removeRoom(idx)} className="text-red-600">حذف</button>}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                        <div>
                            <label>النزيل</label>
                            <select value={room.guestId} onChange={e => handleRoomChange(idx, 'guestId', e.target.value)} className="w-full px-2 py-1 border rounded">
                                <option value="">اختر النزيل</option>
                                {guests.map(g => <option key={g.id} value={g.id}>{g.firstName} {g.lastName}</option>)}
                            </select>
                        </div>
                        <div>
                            <label>الغرفة</label>
                            <select value={room.roomId} onChange={e => handleRoomChange(idx, 'roomId', e.target.value)} className="w-full px-2 py-1 border rounded">
                                <option value="">اختر الغرفة</option>
                                {availableRooms.map(r => <option key={r.id} value={r.id}>{r.roomNumber} - {r.roomType} - {r.pricePerNight}</option>)}
                            </select>
                        </div>
                        <div>
                            <label>بالغين</label>
                            <input type="number" min="1" value={room.adults} onChange={e => handleRoomChange(idx, 'adults', parseInt(e.target.value))} className="w-full px-2 py-1 border rounded" />
                        </div>
                        <div>
                            <label>أطفال</label>
                            <input type="number" min="0" value={room.children} onChange={e => handleRoomChange(idx, 'children', parseInt(e.target.value))} className="w-full px-2 py-1 border rounded" />
                        </div>
                        <div>
                            <label>أسرة إضافية</label>
                            <input type="number" min="0" value={room.extraBeds} onChange={e => handleRoomChange(idx, 'extraBeds', parseInt(e.target.value))} className="w-full px-2 py-1 border rounded" />
                        </div>
                    </div>

                    {/* اختيار الخدمات الإضافية (المضافة فقط) */}
                    {extraServicesList.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {extraServicesList.map(s => (
                                <label key={s.id} className="flex items-center gap-1">
                                    <input type="checkbox" checked={room.extraServices.includes(s.id)}
                                        onChange={e => {
                                            const newServices = e.target.checked
                                                ? [...room.extraServices, s.id]
                                                : room.extraServices.filter(id => id !== s.id);
                                            handleRoomChange(idx, 'extraServices', newServices);
                                        }} />
                                    {s.name} (+{s.price})
                                </label>
                            ))}
                        </div>
                    )}
                </div>
            ))}

            <button type="button" onClick={addRoom} className="py-2 px-4 bg-blue-600 text-white rounded">إضافة غرفة</button>

            {/* جدول الحسابات */}
            <div className="overflow-x-auto mt-4 border rounded">
                <table className="min-w-full table-auto border-collapse">
                    <thead className="bg-gray-200">
                        <tr>
                            <th className="px-3 py-2 border">الغرفة</th>
                            <th className="px-3 py-2 border">الخدمات</th>
                            <th className="px-3 py-2 border">السعر/ليلة</th>
                            <th className="px-3 py-2 border">الإجمالي</th>
                        </tr>
                    </thead>
                    <tbody>
                        {groupRooms.map((room, idx) => {
                            const roomData = availableRooms.find(r => r.id === room.roomId);
                            if (!roomData) return null;

                            const roomBasePrice = roomData.pricePerNight || 0;
                            const extrasTotal = room.extraServices.reduce((sum, id) => {
                                const s = extraServicesList.find(x => x.id === id);
                                return sum + (s ? s.price : 0);
                            }, 0);
                            const nights = Math.max(Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)), 0);
                            const roomTotal = (roomBasePrice + extrasTotal) * nights;

                            const baseRow = (
                                <tr key={`room-${idx}`}>
                                    <td className="px-3 py-2 border">{roomData.roomNumber}</td>
                                    <td className="px-3 py-2 border">الإقامة + خدمات</td>
                                    <td className="px-3 py-2 border">{roomBasePrice + extrasTotal}</td>
                                    <td className="px-3 py-2 border">{roomTotal}</td>
                                </tr>
                            );

                            return baseRow;
                        })}
                        <tr className="font-bold bg-gray-300">
                            <td colSpan={3} className="px-3 py-2 border">المجموع قبل الخصم والضريبة</td>
                            <td className="px-3 py-2 border">{subtotal.toFixed(2)}</td>
                        </tr>
                        <tr className="font-bold bg-gray-100">
                            <td colSpan={3} className="px-3 py-2 border">الخصم</td>
                            <td className="px-3 py-2 border">-{discount.toFixed(2)}</td>
                        </tr>
                        <tr className="font-bold bg-gray-100">
                            <td colSpan={3} className="px-3 py-2 border">الضريبة ({taxRate}%)</td>
                            <td className="px-3 py-2 border">{((subtotal - discount) * (taxRate / 100)).toFixed(2)}</td>
                        </tr>
                        <tr className="font-bold bg-green-200">
                            <td colSpan={3} className="px-3 py-2 border">الإجمالي النهائي</td>
                            <td className="px-3 py-2 border">{totalPrice.toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <button type="submit" className="w-full py-2 mt-4 bg-green-600 text-white rounded">إضافة الحجز الجماعي</button>
        </form>
    );
}
