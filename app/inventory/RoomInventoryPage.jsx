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
//     const [filterText, setFilterText] = useState("");
//     const [bulkDates, setBulkDates] = useState({ start: startDate, end: endDate });

//     const [localTotals, setLocalTotals] = useState({}); // key = roomId_date

//     if (!canView) return <p className="p-6 text-red-500">ليس لديك صلاحية عرض هذا القسم.</p>;

//     const fetchInventory = async () => {
//         if (!selectedProperty) return;
//         try {
//             const res = await fetch(`/api/inventory/rooms?propertyId=${selectedProperty}&start=${startDate}&end=${endDate}`);
//             const data = await res.json();
//             setRows(data.rows || []);
//             setDates(data.dates || []);
//         } catch (err) {
//             console.error("Inventory API error:", err);
//             setRows([]);
//             setDates([]);
//         }
//     };

//     useEffect(() => { fetchInventory(); }, [selectedProperty, startDate, endDate]);

//     const updateCell = ({ roomTypeId, roomId, date, field, value }) => {
//         setRows(prevRows =>
//             prevRows.map(rt => {
//                 if (rt.roomTypeId !== roomTypeId) return rt;
//                 return {
//                     ...rt,
//                     rooms: rt.rooms.map(rm => {
//                         if (rm.id !== roomId) return rm;
//                         return {
//                             ...rm,
//                             cells: {
//                                 ...rm.cells,
//                                 [date]: {
//                                     ...rm.cells?.[date],
//                                     [field]: value
//                                 }
//                             }
//                         };
//                     })
//                 };
//             })
//         );

//         if (field === 'allotment') {
//             const key = `${roomId}_${date}`;
//             setLocalTotals(prev => ({ ...prev, [key]: value }));
//         }
//     };

//     const updateSold = ({ roomTypeId, roomId, date, change }) => {
//         setRows(prevRows =>
//             prevRows.map(rt => {
//                 if (rt.roomTypeId !== roomTypeId) return rt;
//                 return {
//                     ...rt,
//                     rooms: rt.rooms.map(rm => {
//                         if (rm.id !== roomId) return rm;
//                         const oldCell = rm.cells?.[date] || {};
//                         return {
//                             ...rm,
//                             cells: {
//                                 ...rm.cells,
//                                 [date]: {
//                                     ...oldCell,
//                                     sold: (oldCell.sold || 0) + change
//                                 }
//                             }
//                         };
//                     })
//                 };
//             })
//         );
//     };

//     useEffect(() => {
//         if (!socket) return;

//         const handlers = {
//             ROOM_BOOKED: data => updateSold({ roomTypeId: data.roomTypeId, roomId: data.roomId, date: data.date, change: +1 }),
//             ROOM_CHECKIN: data => updateSold({ roomTypeId: data.roomTypeId, roomId: data.roomId, date: data.date, change: +1 }),
//             ROOM_CHECKOUT: data => updateSold({ roomTypeId: data.roomTypeId, roomId: data.roomId, date: data.date, change: -1 }),
//             INVENTORY_UPDATED: data => updateCell(data),
//             ROOM_STATUS_CHANGED: data => {
//                 setRows(prev => prev.map(rt => ({
//                     ...rt,
//                     rooms: rt.rooms.map(rm => rm.id === data.roomId ? { ...rm, status: data.newStatus } : rm)
//                 })));
//             },
//             HOUSEKEEPING_UPDATED: data => updateCell({ roomTypeId: data.roomTypeId, roomId: data.roomId, date: data.date, field: 'housekeeping', value: data.status }),
//         };

//         Object.entries(handlers).forEach(([event, fn]) => socket.on(event, fn));
//         return () => Object.entries(handlers).forEach(([event, fn]) => socket.off(event, fn));
//     }, [socket]);

//     const handleCellChange = async (roomTypeId, roomId, date, field, value, bulk = false) => {
//         if (!canModifyInventory) return;

//         const updateDates = bulk ? dates.filter(d => d >= bulkDates.start && d <= bulkDates.end) : [date];

//         for (const d of updateDates) {
//             updateCell({ roomTypeId, roomId, date: d, field, value });
//             try {
//                 await fetch('/api/inventory/rooms', {
//                     method: 'PATCH',
//                     headers: { 'Content-Type': 'application/json' },
//                     body: JSON.stringify({ propertyId: selectedProperty, roomTypeId, roomId, date: d, field, value })
//                 });
//             } catch (err) {
//                 console.error("Failed to PATCH inventory:", err);
//             }
//         }
//     };

//     const toggleStopSell = (roomId, date, roomTypeId) => {
//         const rt = rows.find(r => r.roomTypeId === roomTypeId);
//         if (!rt) return;
//         const room = rt.rooms.find(rm => rm.id === roomId);
//         if (!room) return;
//         const cell = room.cells?.[date] || { stopSell: false };
//         handleCellChange(roomTypeId, roomId, date, 'stopSell', !cell.stopSell);
//     };

//     const groupedByFloor = rows.reduce((acc, r) => {
//         const floor = r.rooms?.[0]?.floor || "Unknown";
//         if (!acc[floor]) acc[floor] = [];
//         acc[floor].push(r);
//         return acc;
//     }, {});

//     Object.keys(groupedByFloor).forEach(floor => {
//         groupedByFloor[floor].sort((a, b) => {
//             const numA = a.rooms?.[0]?.number || '';
//             const numB = b.rooms?.[0]?.number || '';
//             return isNaN(numA) || isNaN(numB) ? numA.localeCompare(numB) : Number(numA) - Number(numB);
//         });
//     });

//     const filteredRows = rows.filter(rt =>
//         rt.name.toLowerCase().includes(filterText.toLowerCase()) ||
//         rt.rooms.some(r => r.number.includes(filterText))
//     );

//     return (
//         <div className="p-4 overflow-auto">
//             <h1 className="text-2xl font-bold mb-4">Room Inventory</h1>

//             {/* Filters */}
//             <div className="mb-4 flex flex-wrap gap-2 items-end">
//                 <div>
//                     <label className="block mb-1 font-semibold">اختر الفندق:</label>
//                     <select value={selectedProperty} onChange={e => setSelectedProperty(e.target.value)} className="px-3 py-2 border rounded">
//                         {userProperties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
//                     </select>
//                 </div>
//                 <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border px-2 py-1 rounded" />
//                 <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border px-2 py-1 rounded" />
//                 <button onClick={fetchInventory} className="px-3 py-2 bg-blue-600 text-white rounded">تحديث</button>

//                 <input
//                     type="text"
//                     placeholder="بحث بالرقم أو النوع"
//                     className="border px-2 py-1 rounded"
//                     value={filterText}
//                     onChange={e => setFilterText(e.target.value)}
//                 />

//                 {canModifyInventory && (
//                     <div className="flex items-center gap-1">
//                         <label className="text-sm">Bulk Dates:</label>
//                         <input type="date" value={bulkDates.start} onChange={e => setBulkDates({ ...bulkDates, start: e.target.value })} className="border px-2 py-1 rounded" />
//                         <input type="date" value={bulkDates.end} onChange={e => setBulkDates({ ...bulkDates, end: e.target.value })} className="border px-2 py-1 rounded" />
//                     </div>
//                 )}
//             </div>

//             {/* Inventory Table */}
//             {Object.keys(groupedByFloor).sort((a, b) => a - b).map(floor => (
//                 <div key={floor} className="mb-6">
//                     <h2 className="text-lg font-bold mb-2 sticky top-0 z-10 p-1 shadow">Floor {floor}</h2>
//                     <div className="overflow-x-auto">
//                         <table className="min-w-full border-collapse border border-gray-300">
//                             <thead>
//                                 <tr>
//                                     <th className="border p-2">Room Type</th>
//                                     <th className="border p-2">Room</th>
//                                     {dates.map(d => <th key={d} className="border p-2">{d}</th>)}
//                                 </tr>
//                             </thead>
//                             <tbody>
//                                 {filteredRows.map(rt =>
//                                     rt.rooms.sort((a, b) => {
//                                         const numA = a.number || '';
//                                         const numB = b.number || '';
//                                         return isNaN(numA) || isNaN(numB) ? numA.localeCompare(numB) : Number(numA) - Number(numB);
//                                     }).map(room => (
//                                         <tr key={room.id}>
//                                             <td className="border p-2 font-semibold">{rt.name}</td>
//                                             <td className="border p-2 font-semibold">{room.number}</td>
//                                             {dates.map(d => {
//                                                 const cell = room.cells?.[d] ?? { total: 1, sold: 0, stopSell: false, housekeeping: '', notes: '' }; // تأكد من القيم الافتراضية
//                                                 const key = `${room.id}_${d}`;
//                                                 const localValue = localTotals[key] ?? cell.total;

//                                                 const occupancy = cell.total ? (cell.sold / cell.total) : 0;
//                                                 const bgColor = cell.stopSell
//                                                     ? "bg-red-500"
//                                                     : occupancy >= 1
//                                                         ? "bg-gray-400"
//                                                         : occupancy > 0.8
//                                                             ? "bg-yellow-400"
//                                                             : "bg-green-400";

//                                                 return (
//                                                     <td key={d} className={`border p-1 text-center relative group ${bgColor} text-white`}>
//                                                         <div>
//                                                             <input
//                                                                 type="number"
//                                                                 value={localValue}
//                                                                 className="w-12 text-center rounded text-black"
//                                                                 disabled={!canModifyInventory}
//                                                                 onChange={e => setLocalTotals(prev => ({ ...prev, [key]: parseInt(e.target.value) }))}
//                                                                 onBlur={() => handleCellChange(rt.roomTypeId, room.id, d, 'allotment', parseInt(localTotals[key] ?? cell.total), true)}
//                                                             />
//                                                             <div className="text-xs">Sold: {cell.sold}</div>
//                                                             <button
//                                                                 onClick={() => toggleStopSell(room.id, d, rt.roomTypeId)}
//                                                                 className={`mt-1 px-1 py-0.5 rounded text-white text-xs ${cell.stopSell ? 'bg-red-700' : 'bg-green-700'}`}
//                                                                 disabled={!canModifyInventory}
//                                                             >
//                                                                 {cell.stopSell ? 'Stop' : 'Open'}
//                                                             </button>
//                                                             {/* Tooltip */}
//                                                             <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-max max-w-xs p-1 text-xs bg-black text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
//                                                                 <div>Housekeeping: {cell.housekeeping || 'N/A'}</div>
//                                                                 <div>Notes: {cell.notes || 'N/A'}</div>
//                                                             </div>
//                                                         </div>
//                                                     </td>
//                                                 );
//                                             })}
//                                         </tr>
//                                     ))
//                                 )}
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
    const [filterText, setFilterText] = useState("");
    const [bulkDates, setBulkDates] = useState({ start: startDate, end: endDate });
    const [localTotals, setLocalTotals] = useState({});

    if (!canView) return <p className="p-6 text-red-500">ليس لديك صلاحية عرض هذا القسم.</p>;

    const fetchInventory = async () => {
        if (!selectedProperty) return;
        try {
            const res = await fetch(`/api/inventory/rooms?propertyId=${selectedProperty}&start=${startDate}&end=${endDate}`);
            const data = await res.json();
            setRows(data.rows || []);
            setDates(data.dates || []);
        } catch (err) { console.error(err); setRows([]); setDates([]); }
    };

    useEffect(() => { fetchInventory(); }, [selectedProperty, startDate, endDate]);

    const updateCell = ({ roomTypeId, roomId, date, field, value }) => {
        setRows(prevRows =>
            prevRows.map(rt => rt.roomTypeId !== roomTypeId ? rt : {
                ...rt,
                rooms: rt.rooms.map(rm => rm.id !== roomId ? rm : {
                    ...rm,
                    cells: { ...rm.cells, [date]: { ...rm.cells?.[date], [field]: value } }
                })
            })
        );
        if (field === 'allotment') setLocalTotals(prev => ({ ...prev, [`${roomId}_${date}`]: value }));
    };

    const updateSold = ({ roomTypeId, roomId, date, change }) => {
        setRows(prevRows =>
            prevRows.map(rt => rt.roomTypeId !== roomTypeId ? rt : {
                ...rt,
                rooms: rt.rooms.map(rm => rm.id !== roomId ? rm : {
                    ...rm,
                    cells: {
                        ...rm.cells,
                        [date]: { ...rm.cells?.[date], sold: (rm.cells?.[date]?.sold || 0) + change }
                    }
                })
            })
        );
    };

    useEffect(() => {
        if (!socket) return;

        const handlers = {
            ROOM_BOOKED: data => updateSold({ ...data, change: +1 }),
            ROOM_CHECKIN: data => updateSold({ ...data, change: +1 }),
            ROOM_CHECKOUT: data => updateSold({ ...data, change: -1 }),
            INVENTORY_UPDATED: data => updateCell(data),
            HOUSEKEEPING_UPDATED: data => updateCell({ ...data, field: 'housekeeping', value: data.value }),
            NOTES_UPDATED: data => updateCell({ ...data, field: 'notes', value: data.value }),
            ROOM_STATUS_CHANGED: data => {
                setRows(prev => prev.map(rt => ({
                    ...rt,
                    rooms: rt.rooms.map(rm => rm.id === data.roomId ? { ...rm, status: data.newStatus } : rm)
                })));
            }
        };

        Object.entries(handlers).forEach(([event, fn]) => socket.on(event, fn));
        return () => Object.entries(handlers).forEach(([event, fn]) => socket.off(event, fn));
    }, [socket]);

    const handleCellChange = async (roomTypeId, roomId, date, field, value, bulk=false) => {
        if (!canModifyInventory) return;
        const updateDates = bulk ? dates.filter(d => d >= bulkDates.start && d <= bulkDates.end) : [date];

        for (const d of updateDates) {
            updateCell({ roomTypeId, roomId, date: d, field, value });
            try {
                await fetch('/api/inventory/rooms', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ propertyId: selectedProperty, roomTypeId, roomId, date: d, field, value })
                });
            } catch(err) { console.error(err); }
        }
    };

    const toggleStopSell = (roomId, date, roomTypeId) => {
        const room = rows.find(r => r.roomTypeId === roomTypeId)?.rooms.find(rm => rm.id === roomId);
        if (!room) return;
        handleCellChange(roomTypeId, roomId, date, 'stopSell', !room.cells?.[date]?.stopSell);
    };

    const groupedByFloor = rows.reduce((acc, r) => {
        const floor = r.rooms?.[0]?.floor || "Unknown";
        if (!acc[floor]) acc[floor] = [];
        acc[floor].push(r);
        return acc;
    }, {});

    const filteredRows = rows.filter(rt =>
        rt.name.toLowerCase().includes(filterText.toLowerCase()) ||
        rt.rooms.some(r => r.number.includes(filterText))
    );

    return (
        <div className="p-4 overflow-auto">
            <h1 className="text-2xl font-bold mb-4">Room Inventory</h1>
            {/* Filters */}
            <div className="mb-4 flex flex-wrap gap-2 items-end">
                <div>
                    <label className="block mb-1 font-semibold">اختر الفندق:</label>
                    <select value={selectedProperty} onChange={e => setSelectedProperty(e.target.value)} className="px-3 py-2 border rounded">
                        {userProperties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border px-2 py-1 rounded"/>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border px-2 py-1 rounded"/>
                <button onClick={fetchInventory} className="px-3 py-2 bg-blue-600 text-white rounded">تحديث</button>
                <input type="text" placeholder="بحث بالرقم أو النوع" className="border px-2 py-1 rounded" value={filterText} onChange={e=>setFilterText(e.target.value)}/>
                {canModifyInventory && (
                    <div className="flex items-center gap-1">
                        <label className="text-sm">Bulk Dates:</label>
                        <input type="date" value={bulkDates.start} onChange={e=>setBulkDates({...bulkDates,start:e.target.value})} className="border px-2 py-1 rounded"/>
                        <input type="date" value={bulkDates.end} onChange={e=>setBulkDates({...bulkDates,end:e.target.value})} className="border px-2 py-1 rounded"/>
                    </div>
                )}
            </div>
            {/* Inventory Table */}
            {Object.keys(groupedByFloor).sort((a,b)=>a-b).map(floor=>(
                <div key={floor} className="mb-6">
                    <h2 className="text-lg font-bold mb-2 sticky top-0 z-10 p-1 shadow">Floor {floor}</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse border border-gray-300">
                            <thead>
                                <tr>
                                    <th className="border p-2">Room Type</th>
                                    <th className="border p-2">Room</th>
                                    {dates.map(d => <th key={d} className="border p-2">{d}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRows.map(rt => rt.rooms.sort((a,b)=>(Number(a.number)||0)-(Number(b.number)||0)).map(room => (
                                    <tr key={room.id}>
                                        <td className="border p-2 font-semibold">{rt.name}</td>
                                        <td className="border p-2 font-semibold">{room.number}</td>
                                        {dates.map(d => {
                                            const cell = room.cells?.[d] ?? { total:1, sold:0, stopSell:false, housekeeping:'', notes:'', status:'Vacant' };
                                            const key = `${room.id}_${d}`;
                                            const localValue = localTotals[key] ?? cell.total;
                                            const occupancy = cell.total ? (cell.sold/cell.total) : 0;
                                            const bgColor = cell.stopSell?"bg-red-500":occupancy>=1?"bg-gray-400":occupancy>0.8?"bg-yellow-400":"bg-green-400";
                                            return (
                                                <td key={d} className={`border p-1 text-center relative group ${bgColor} text-white`}>
                                                    <div>
                                                        <input type="number" value={localValue} className="w-12 text-center rounded text-black" disabled={!canModifyInventory}
                                                            onChange={e=>setLocalTotals(prev=>({...prev,[key]:parseInt(e.target.value)}))}
                                                            onBlur={()=>handleCellChange(rt.roomTypeId,room.id,d,'allotment',parseInt(localTotals[key]??cell.total),true)}
                                                        />
                                                        <div className="text-xs">Sold: {cell.sold}</div>
                                                        <div className="text-xs">Status: {cell.status}</div>
                                                        <button onClick={()=>toggleStopSell(room.id,d,rt.roomTypeId)}
                                                            className={`mt-1 px-1 py-0.5 rounded text-white text-xs ${cell.stopSell?'bg-red-700':'bg-green-700'}`} disabled={!canModifyInventory}>
                                                            {cell.stopSell?'Stop':'Open'}
                                                        </button>
                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-max max-w-xs p-1 text-xs bg-black text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                                                            <div>Housekeeping: {cell.housekeeping||'N/A'}</div>
                                                            <div>Notes: {cell.notes||'N/A'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                            )
                                        })}
                                    </tr>
                                )))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
        </div>
    );
}

