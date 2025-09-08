// 'use client';
// import { useEffect, useState } from "react";
// import { useSocket } from "@/app/components/SocketProvider";

// export default function RoomInventoryPage({ userProperties, session }) {
//     const socket = useSocket();
//     const role = session?.user?.role || "Guest";

//     const canModifyInventory = ["Admin", "FrontDesk"].includes(role);
//     const canView = ["Admin", "FrontDesk", "Manager"].includes(role);

//     const [selectedProperty, setSelectedProperty] = useState(userProperties?.[0]?.id || "");
//     const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
//     const [endDate, setEndDate] = useState(new Date(new Date().setDate(new Date().getDate() + 6)).toISOString().slice(0, 10));
//     const [dates, setDates] = useState([]);
//     const [rows, setRows] = useState([]);

//     if (!canView) return <p className="p-6 text-red-500">ليس لديك صلاحية عرض هذا القسم.</p>;

//     const fetchInventory = async () => {
//         if (!selectedProperty) return;
//         try {
//             const res = await fetch(`/api/inventory/rooms?propertyId=${selectedProperty}&start=${startDate}&end=${endDate}`);
//             const data = await res.json();
//             if (!data.rows || !data.dates) {
//                 setRows([]);
//                 setDates([]);
//                 return;
//             }
//             setRows(data.rows);
//             setDates(data.dates);
//         } catch (err) {
//             console.error("Inventory API error:", err);
//             setRows([]);
//             setDates([]);
//         }
//     };

//     useEffect(() => { fetchInventory(); }, [selectedProperty, startDate, endDate]);

//     // Socket update
//     useEffect(() => {
//         if (!socket) return;
//         const handler = () => fetchInventory();
//         ["ROOM_BOOKED", "ROOM_CHECKIN", "ROOM_CHECKOUT", "INVENTORY_UPDATED"].forEach(e => socket.on(e, handler));
//         return () => ["ROOM_BOOKED", "ROOM_CHECKIN", "ROOM_CHECKOUT", "INVENTORY_UPDATED"].forEach(e => socket.off(e, handler));
//     }, [socket, selectedProperty, startDate, endDate]);

//     const handleCellChange = async (roomTypeId, date, field, value) => {
//         if (!canModifyInventory) return;
//         try {
//             await fetch('/api/inventory/rooms', {
//                 method: 'PATCH',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ propertyId: selectedProperty, roomTypeId, date, field, value })
//             });
//             fetchInventory();
//         } catch (err) { console.error(err); }
//     };

//     const toggleStopSell = (roomTypeId, date) => {
//         const row = rows.find(r => r.roomTypeId === roomTypeId);
//         if (!row?.cells?.[date]) return;
//         handleCellChange(roomTypeId, date, 'stopSell', !row.cells[date].stopSell);
//     };

//     const groupedByFloor = rows.reduce((acc, r) => {
//         const floor = r.floor || "Unknown";
//         if (!acc[floor]) acc[floor] = [];
//         acc[floor].push(r);
//         return acc;
//     }, {});

//     // ترتيب الغرف داخل كل طابق حسب رقم الغرفة
//     Object.keys(groupedByFloor).forEach(floor => {
//         groupedByFloor[floor].sort((a, b) => {
//             const roomA = a.rooms?.[0]?.number || '';
//             const roomB = b.rooms?.[0]?.number || '';
//             // ترتيب رقمي إذا كانت الأرقام أرقام، أو ترتيب نصي
//             return isNaN(roomA) || isNaN(roomB) ? roomA.localeCompare(roomB) : Number(roomA) - Number(roomB);
//         });
//     });

//     return (
//         <div className="p-6 overflow-auto">
//             <h1 className="text-2xl font-bold mb-4">Room Inventory</h1>

//             {/* اختيار الفندق والفترة */}
//             <div className="mb-4 flex gap-2 flex-wrap items-end">
//                 <div>
//                     <label className="block mb-1 font-semibold">اختر الفندق:</label>
//                     <select value={selectedProperty} onChange={e => setSelectedProperty(e.target.value)} className="px-3 py-2 border rounded">
//                         {userProperties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
//                     </select>
//                 </div>
//                 <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border px-2 py-1 rounded" />
//                 <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border px-2 py-1 rounded" />
//                 <button onClick={fetchInventory} className="px-3 py-2 bg-blue-600 text-white rounded">تحديث</button>
//             </div>

//             {/* جدول */}
//             {Object.keys(groupedByFloor).sort((a, b) => a - b).map(floor => (
//                 <div key={floor} className="mb-6">
//                     <h2 className="text-lg font-bold mb-2 sticky top-0 z-10 p-1 shadow">Floor {floor}</h2>
//                     <div className="overflow-x-auto">
//                         <table className="min-w-full border-collapse border border-gray-300">
//                             <thead>
//                                 <tr>
//                                     <th className="border p-2">Room Type</th>
//                                     {dates.map(d => <th key={d} className="border p-2">{d}</th>)}
//                                 </tr>
//                             </thead>
//                             <tbody>
//                                 {groupedByFloor[floor].map(rt => (
//                                     rt.rooms.sort((a, b) => {
//                                         // ترتيب الغرف حسب الرقم
//                                         const numA = a.number || '';
//                                         const numB = b.number || '';
//                                         return isNaN(numA) || isNaN(numB) ? numA.localeCompare(numB) : Number(numA) - Number(numB);
//                                     }).map(room => (
//                                         <tr key={room.id}>
//                                             <td className="border p-2 font-semibold">{room.number}</td> {/* رقم الغرفة */}
//                                             {dates.map(d => {
//                                                 const cell = rt.cells?.[d] ?? { total: 0, sold: 0, stopSell: false };
//                                                 const occupancy = cell.total ? (cell.sold / cell.total) : 0;
//                                                 const bgColor = cell.stopSell
//                                                     ? "bg-red-500"
//                                                     : occupancy >= 1
//                                                         ? "bg-gray-400"
//                                                         : occupancy > 0.8
//                                                             ? "bg-yellow-400"
//                                                             : "bg-green-400";

//                                                 return (
//                                                     <td key={d} className={`border p-1 text-center ${bgColor} text-white`}>
//                                                         <div>
//                                                             <input
//                                                                 type="number"
//                                                                 value={cell.total}
//                                                                 className="w-12 text-center rounded text-black"
//                                                                 disabled={!canModifyInventory}
//                                                                 onChange={e => handleCellChange(rt.roomTypeId, d, 'allotment', parseInt(e.target.value))}
//                                                             />
//                                                             <div className="text-xs">Sold: {cell.sold}</div>
//                                                             <button
//                                                                 onClick={() => toggleStopSell(rt.roomTypeId, d)}
//                                                                 className={`mt-1 px-1 py-0.5 rounded text-white text-xs ${cell.stopSell ? 'bg-red-700' : 'bg-green-700'}`}
//                                                                 disabled={!canModifyInventory}
//                                                             >
//                                                                 {cell.stopSell ? 'Stop' : 'Open'}
//                                                             </button>
//                                                         </div>
//                                                     </td>
//                                                 );
//                                             })}
//                                         </tr>
//                                     ))
//                                 ))}
//                             </tbody>
//                         </table>
//                     </div>
//                 </div>
//             ))}
//         </div>
//     );
// }





'use client';
import { useEffect, useState } from "react";
import { useSocket } from "@/app/components/SocketProvider";

export default function RoomInventoryPage({ userProperties, session }) {
    const socket = useSocket();
    const role = session?.user?.role || "Guest";

    const canModifyInventory = ["Admin", "FrontDesk"].includes(role);
    const canView = ["Admin", "FrontDesk", "Manager"].includes(role);

    const [selectedProperty, setSelectedProperty] = useState(userProperties?.[0]?.id || "");
    const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
    const [endDate, setEndDate] = useState(new Date(new Date().setDate(new Date().getDate() + 6)).toISOString().slice(0, 10));
    const [dates, setDates] = useState([]);
    const [rows, setRows] = useState([]);

    if (!canView) return <p className="p-6 text-red-500">ليس لديك صلاحية عرض هذا القسم.</p>;

    // جلب البيانات من API
    const fetchInventory = async () => {
        if (!selectedProperty) return;
        try {
            const res = await fetch(`/api/inventory/rooms?propertyId=${selectedProperty}&start=${startDate}&end=${endDate}`);
            const data = await res.json();
            if (!data.rows || !data.dates) {
                setRows([]);
                setDates([]);
                return;
            }
            setRows(data.rows);
            setDates(data.dates);
        } catch (err) {
            console.error("Inventory API error:", err);
            setRows([]);
            setDates([]);
        }
    };

    useEffect(() => { fetchInventory(); }, [selectedProperty, startDate, endDate]);

    // Socket update
    useEffect(() => {
        if (!socket) return;
        const handler = () => fetchInventory();
        ["ROOM_BOOKED", "ROOM_CHECKIN", "ROOM_CHECKOUT", "INVENTORY_UPDATED"].forEach(e => socket.on(e, handler));
        return () => ["ROOM_BOOKED", "ROOM_CHECKIN", "ROOM_CHECKOUT", "INVENTORY_UPDATED"].forEach(e => socket.off(e, handler));
    }, [socket, selectedProperty, startDate, endDate]);

    // تحديث القيم
    const handleCellChange = async (roomTypeId, roomId, date, field, value) => {
        if (!canModifyInventory) return;
        try {
            await fetch('/api/inventory/rooms', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ propertyId: selectedProperty, roomTypeId, roomId, date, field, value })
            });
            fetchInventory();
        } catch (err) { console.error(err); }
    };

    const toggleStopSell = (roomId, date, roomTypeId) => {
        const rt = rows.find(r => r.roomTypeId === roomTypeId);
        if (!rt) return;

        const room = rt.rooms.find(rm => rm.id === roomId);
        if (!room) return;

        const cell = room.cells?.[date];
        if (!cell) return;

        handleCellChange(roomTypeId, roomId, date, 'stopSell', !cell.stopSell);
    };

    // تجميع حسب الطابق
    const groupedByFloor = rows.reduce((acc, r) => {
        const floor = r.floor || "Unknown";
        if (!acc[floor]) acc[floor] = [];
        acc[floor].push(r);
        return acc;
    }, {});

    // ترتيب الغرف حسب الرقم
    Object.keys(groupedByFloor).forEach(floor => {
        groupedByFloor[floor].sort((a, b) => {
            const roomA = a.rooms?.[0]?.number || '';
            const roomB = b.rooms?.[0]?.number || '';
            return isNaN(roomA) || isNaN(roomB) ? roomA.localeCompare(roomB) : Number(roomA) - Number(roomB);
        });
    });

    return (
        <div className="p-6 overflow-auto">
            <h1 className="text-2xl font-bold mb-4">Room Inventory</h1>

            {/* اختيار الفندق والفترة */}
            <div className="mb-4 flex gap-2 flex-wrap items-end">
                <div>
                    <label className="block mb-1 font-semibold">اختر الفندق:</label>
                    <select value={selectedProperty} onChange={e => setSelectedProperty(e.target.value)} className="px-3 py-2 border rounded">
                        {userProperties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border px-2 py-1 rounded" />
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border px-2 py-1 rounded" />
                <button onClick={fetchInventory} className="px-3 py-2 bg-blue-600 text-white rounded">تحديث</button>
            </div>

            {/* جدول */}
            {Object.keys(groupedByFloor).sort((a, b) => a - b).map(floor => (
                <div key={floor} className="mb-6">
                    <h2 className="text-lg font-bold mb-2 sticky top-0 z-10 p-1 shadow">Floor {floor}</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse border border-gray-300">
                            <thead>
                                <tr>
                                    <th className="border p-2">Room</th>
                                    {dates.map(d => <th key={d} className="border p-2">{d}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {groupedByFloor[floor].map(rt => (
                                    rt.rooms.sort((a, b) => {
                                        const numA = a.number || '';
                                        const numB = b.number || '';
                                        return isNaN(numA) || isNaN(numB) ? numA.localeCompare(numB) : Number(numA) - Number(numB);
                                    }).map(room => (
                                        <tr key={room.id}>
                                            <td className="border p-2 font-semibold">{room.number}</td>
                                            {dates.map(d => {
                                                const cell = room.cells?.[d] ?? { total: 0, sold: 0, stopSell: false };
                                                const occupancy = cell.total ? (cell.sold / cell.total) : 0;
                                                const bgColor = cell.stopSell
                                                    ? "bg-red-500"
                                                    : occupancy >= 1
                                                        ? "bg-gray-400"
                                                        : occupancy > 0.8
                                                            ? "bg-yellow-400"
                                                            : "bg-green-400";

                                                return (
                                                    <td key={d} className={`border p-1 text-center ${bgColor} text-white`}>
                                                        <div>
                                                            <input
                                                                type="number"
                                                                value={cell.total}
                                                                className="w-12 text-center rounded text-black"
                                                                disabled={!canModifyInventory}
                                                                onChange={e => handleCellChange(rt.roomTypeId, room.id, d, 'allotment', parseInt(e.target.value))}
                                                            />
                                                            <div className="text-xs">Sold: {cell.sold}</div>
                                                            <button
                                                                onClick={() => toggleStopSell(room.id, d, rt.roomTypeId)}
                                                                className={`mt-1 px-1 py-0.5 rounded text-white text-xs ${cell.stopSell ? 'bg-red-700' : 'bg-green-700'}`}
                                                                disabled={!canModifyInventory}
                                                            >
                                                                {cell.stopSell ? 'Stop' : 'Open'}
                                                            </button>
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
        </div>
    );
}




