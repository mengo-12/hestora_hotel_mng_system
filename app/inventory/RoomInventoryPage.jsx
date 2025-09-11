'use client';
import { useEffect, useState, useRef } from "react";
import { useSocket } from "@/app/components/SocketProvider";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

export default function RoomInventoryPage({ userProperties = [], session }) {
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
    const [selectedCell, setSelectedCell] = useState(null);
    const [clipboard, setClipboard] = useState(null);
    const draggingRef = useRef(null);

    if (!canView) return <p className="p-6 text-red-500">ليس لديك صلاحية عرض هذا القسم.</p>;

    // ----- Fetch inventory -----
    const fetchInventory = async () => {
        if (!selectedProperty) return;
        try {
            const res = await fetch(`/api/inventory/rooms?propertyId=${selectedProperty}&start=${startDate}&end=${endDate}`);
            const data = await res.json();
            setRows(data.rows || []);
            setDates(data.dates || []);
        } catch (err) {
            console.error("Inventory API error:", err);
            setRows([]);
            setDates([]);
        }
    };

    useEffect(() => { fetchInventory(); }, [selectedProperty, startDate, endDate]);

    // ----- Helpers -----
    const updateCellLocal = ({ roomTypeId, roomId, date, field, value }) => {
        setRows(prev => prev.map(rt => {
            if (rt.roomTypeId !== roomTypeId) return rt;
            return {
                ...rt,
                rooms: rt.rooms.map(rm => {
                    if (rm.id !== roomId) return rm;
                    const oldCell = rm.cells?.[date] || {};
                    return { ...rm, cells: { ...rm.cells, [date]: { ...oldCell, [field]: value } } };
                })
            };
        }));
    };

    const handleCellChange = async (roomTypeId, roomId, date, field, value, bulk = false) => {
        if (!canModifyInventory) return;
        const applyDates = bulk ? dates.filter(d => d >= bulkDates.start && d <= bulkDates.end) : [date];
        for (const d of applyDates) {
            updateCellLocal({ roomTypeId, roomId, date: d, field, value });
            try {
                await fetch('/api/inventory/rooms', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ propertyId: selectedProperty, roomTypeId, roomId, date: d, field, value })
                });
            } catch (err) { console.error("PATCH failed:", err); }
        }
    };

    // ----- Copy/Paste -----
    const copyCell = (roomTypeId, roomId, date) => {
        const rt = rows.find(r => r.roomTypeId === roomTypeId);
        const rm = rt?.rooms.find(r => r.id === roomId);
        const cell = rm?.cells?.[date] || {};
        setClipboard({ ...cell });
    };

    const pasteCell = (roomTypeId, roomId, date) => {
        if (!clipboard) return;
        ['allotment', 'sold', 'stopSell', 'housekeeping', 'notes', 'extraPrices', 'baseRate', 'taxes', 'cta', 'ctd'].forEach(f => {
            if (clipboard[f] !== undefined) handleCellChange(roomTypeId, roomId, date, f, clipboard[f], false);
        });
    };

    // ----- Export Excel -----
    const exportExcel = () => {
        const data = [];
        rows.forEach(rt => {
            rt.rooms.forEach(rm => {
                const row = { RoomType: rt.name, Room: rm.number };
                dates.forEach(d => {
                    const c = rm.cells?.[d] || {};
                    row[d] = `Allot:${c.allotment || 0} Sold:${c.sold || 0} Stop:${c.stopSell ? 'Yes' : 'No'} Rate:${c.baseRate || 0} Tax:${c.taxes || 0}`;
                });
                data.push(row);
            });
        });
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Inventory");
        const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        saveAs(new Blob([buf], { type: "application/octet-stream" }), `inventory_${selectedProperty}.xlsx`);
    };

    // ----- Occupancy color -----
    const occupancyClass = (cell) => {
        const total = cell?.allotment || 1;
        const sold = cell?.sold || 0;
        const occ = sold / total;
        if (cell?.stopSell) return "bg-red-500 text-white";
        if (occ <= 0.2) return "bg-green-200 text-black";
        if (occ <= 0.5) return "bg-green-400 text-white";
        if (occ <= 0.8) return "bg-yellow-200 text-black";
        if (occ < 1) return "bg-yellow-600 text-white";
        return "bg-gray-400 text-white";
    };

    // ----- Filtered rows -----
    const filteredRows = rows.filter(rt =>
        rt.name.toLowerCase().includes(filterText.toLowerCase()) ||
        rt.rooms.some(r => r.number.includes(filterText)) ||
        rt.rooms.some(r => Object.values(r.cells || {}).some(c =>
            (c.notes?.toLowerCase().includes(filterText.toLowerCase()) || c.housekeeping?.toLowerCase().includes(filterText.toLowerCase()))
        ))
    );

    // ----- Socket handlers -----
    useEffect(() => {
        if (!socket || !selectedProperty) return;
        const handleInventoryUpdated = (data) => {
            if (data.propertyId !== selectedProperty) return;
            updateCellLocal(data);
        };
        const handleHousekeeping = (data) => {
            if (data.propertyId !== selectedProperty) return;
            updateCellLocal({ roomTypeId: data.roomTypeId, roomId: data.roomId, date: data.date, field: 'housekeeping', value: data.value ?? data.status });
        };
        socket.on("INVENTORY_UPDATED", handleInventoryUpdated);
        socket.on("HOUSEKEEPING_UPDATED", handleHousekeeping);
        socket.on("RATE_UPDATED", handleInventoryUpdated);
        socket.on("TAX_UPDATED", handleInventoryUpdated);
        socket.on("CTA_UPDATED", handleInventoryUpdated);
        socket.on("CTD_UPDATED", handleInventoryUpdated);
        return () => {
            socket.off("INVENTORY_UPDATED", handleInventoryUpdated);
            socket.off("HOUSEKEEPING_UPDATED", handleHousekeeping);
            socket.off("RATE_UPDATED", handleInventoryUpdated);
            socket.off("TAX_UPDATED", handleInventoryUpdated);
            socket.off("CTA_UPDATED", handleInventoryUpdated);
            socket.off("CTD_UPDATED", handleInventoryUpdated);
        };
    }, [socket, selectedProperty, dates, rows, bulkDates]);



    // ----- Render -----
    return (
        <div className="p-4">
            <div className="flex items-center gap-3 mb-4">
                <h1 className="text-2xl font-bold">Room Inventory</h1>
                <div className="ml-auto flex gap-2">
                    <button onClick={exportExcel} className="bg-green-600 text-white px-3 py-1 rounded">Export</button>
                </div>
            </div>

            {/* Filters */}
            <div className="mb-4 flex flex-wrap gap-2 items-end">
                <div>
                    <label className="block mb-1">Property</label>
                    <select value={selectedProperty} onChange={e => setSelectedProperty(e.target.value)} className="border px-2 py-1 rounded">
                        {userProperties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block mb-1">Start</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border px-2 py-1 rounded" />
                </div>
                <div>
                    <label className="block mb-1">End</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border px-2 py-1 rounded" />
                </div>
                <div>
                    <label className="block mb-1">&nbsp;</label>
                    <button onClick={fetchInventory} className="bg-blue-600 text-white px-3 py-1 rounded">Refresh</button>
                </div>
                <div className="ml-4">
                    <label className="block mb-1">Search</label>
                    <input type="text" value={filterText} onChange={e => setFilterText(e.target.value)} placeholder="room, type, notes..." className="border px-2 py-1 rounded" />
                </div>

                {canModifyInventory && (
                    <div className="flex items-center gap-2 ml-auto">
                        <div>
                            <label className="block mb-1 text-sm">Bulk start</label>
                            <input type="date" value={bulkDates.start} onChange={e => setBulkDates(prev => ({ ...prev, start: e.target.value }))} className="border px-2 py-1 rounded" />
                        </div>
                        <div>
                            <label className="block mb-1 text-sm">Bulk end</label>
                            <input type="date" value={bulkDates.end} onChange={e => setBulkDates(prev => ({ ...prev, end: e.target.value }))} className="border px-2 py-1 rounded" />
                        </div>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="space-y-6">
                {filteredRows.map(rt => (
                    <div key={rt.roomTypeId} className="overflow-auto border rounded">
                        <div className="sticky top-0 bg-white p-2 border-b font-semibold">{rt.name}</div>
                        <table className="min-w-full border-collapse">
                            <thead>
                                <tr>
                                    <th className="border p-2">Room</th>
                                    {dates.map(d => <th key={d} className="border p-2 text-xs">{d}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {rt.rooms.map(rm => (
                                    <tr key={rm.id} className="align-top">
                                        <td className="border p-2 font-medium w-36">{rm.number}</td>
                                        {dates.map(d => {
                                            const cell = rm.cells?.[d] || {};
                                            return (
                                                <td key={d} className={`border p-1 text-center ${occupancyClass(cell)} cursor-pointer`}
                                                    onDoubleClick={() => canModifyInventory && setSelectedCell({ ...cell, roomId: rm.id, roomNumber: rm.number, roomTypeId: rt.roomTypeId, date: d })}
                                                    onContextMenu={e => { e.preventDefault(); const choice = window.confirm("Copy this cell? OK=copy, Cancel=Paste"); if (choice) copyCell(rt.roomTypeId, rm.id, d); else pasteCell(rt.roomTypeId, rm.id, d); }}
                                                >
                                                    <div className="text-xs">
                                                        <div>Allot: {cell.allotment || 0}</div>
                                                        <div>Sold: {cell.sold || 0}</div>
                                                        <div>{cell.stopSell ? 'Stop' : 'Open'}</div>
                                                        <div>Rate: {cell.baseRate || 0}</div>
                                                        <div>Tax: {cell.taxes || 0}</div>
                                                        <div>CTA: {cell.cta ? 'Yes' : 'No'} | CTD: {cell.ctd ? 'Yes' : 'No'}</div>
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}
            </div>

            {/* Modal for editing */}
            {selectedCell && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white p-4 rounded w-[480px] max-w-full">
                        <h3 className="font-semibold mb-2">Edit {selectedCell.roomNumber} — {selectedCell.date}</h3>
                        {/* All editable fields */}
                        {["allotment", "stopSell", "housekeeping", "notes", "extraPrices", "baseRate", "taxes", "cta", "ctd"].map(f => (
                            <div key={f} className="mb-2">
                                <label className="block text-sm">{f}</label>
                                {f === "stopSell" ? (
                                    <input type="checkbox" checked={!!selectedCell.stopSell} onChange={e => setSelectedCell(s => ({ ...s, stopSell: e.target.checked }))} />
                                ) : f === "housekeeping" ? (
                                    <select value={selectedCell.housekeeping || ""} onChange={e => setSelectedCell(s => ({ ...s, housekeeping: e.target.value }))} className="border p-1 rounded w-full">
                                        <option value="">---</option>
                                        <option value="Cleaned">Cleaned</option>
                                        <option value="Dirty">Dirty</option>
                                        <option value="Inspection">Inspection</option>
                                    </select>
                                ) : f === "notes" ? (
                                    <textarea value={selectedCell.notes || ""} onChange={e => setSelectedCell(s => ({ ...s, notes: e.target.value }))} className="border p-1 rounded w-full" rows={2} />
                                ) : f === "extraPrices" ? (
                                    <textarea value={JSON.stringify(selectedCell.extraPrices || {})} onChange={e => { try { setSelectedCell(s => ({ ...s, extraPrices: JSON.parse(e.target.value || "{}") })) } catch { } }} className="border p-1 rounded w-full" rows={2} />
                                ) : (
                                    <input type="number" value={selectedCell[f] || 0} onChange={e => setSelectedCell(s => ({ ...s, [f]: parseFloat(e.target.value || 0) }))} className="border p-1 rounded w-full" />
                                )}
                            </div>
                        ))}
                        <div className="flex justify-end gap-2 mt-2">
                            <button className="px-3 py-1 rounded bg-gray-300" onClick={() => setSelectedCell(null)}>Cancel</button>
                            <button className="px-3 py-1 rounded bg-blue-600 text-white" onClick={() => {
                                const isBulk = !!(bulkDates.start && bulkDates.end);
                                ['allotment', 'stopSell', 'housekeeping', 'notes', 'extraPrices', 'baseRate', 'taxes', 'cta', 'ctd'].forEach(f => {
                                    handleCellChange(selectedCell.roomTypeId, selectedCell.roomId, selectedCell.date, f, selectedCell[f], isBulk);
                                });
                                setSelectedCell(null);
                            }}>Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
