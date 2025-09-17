'use client';
import { useState, useEffect, useMemo } from "react";
import { useSocket } from "@/app/components/SocketProvider";
import AddRoomBlockModal from "@/app/components/AddRoomBlockModal";
import EditRoomBlockModal from "@/app/components/EditRoomBlockModal";
import { useTable, useSortBy, usePagination, useGlobalFilter } from "react-table";

export default function RoomBlocksPage({ session, userProperties }) {
    const socket = useSocket();

    // --- State ---
    const [roomBlocks, setRoomBlocks] = useState([]);
    const [groups, setGroups] = useState([]);
    const [roomTypes, setRoomTypes] = useState([]);
    const [loading, setLoading] = useState(true);

    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedRoomBlock, setSelectedRoomBlock] = useState(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    // --- Roles & Permissions ---
    const role = session?.user?.role || "Guest";
    const canAdd = ["Admin", "FrontDesk"].includes(role);
    const canEdit = ["Admin", "FrontDesk"].includes(role);
    const canDelete = ["Admin"].includes(role);

    // --- Fetch Data ---
    const fetchRoomBlocks = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/roomBlocks");
            const data = await res.json();
            setRoomBlocks(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchGroups = async () => {
        try {
            const res = await fetch("/api/groups");
            const data = await res.json();
            setGroups(data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchRoomTypes = async () => {
        try {
            const res = await fetch("/api/roomTypes");
            const data = await res.json();
            setRoomTypes(data || []);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchRoomBlocks();
        fetchGroups();
        fetchRoomTypes();

        if (!socket) return;

        // 🔔 Socket events
        socket.on("ROOMBLOCK_CREATED", (block) => setRoomBlocks(prev => [block, ...prev]));
        socket.on("ROOMBLOCK_UPDATED", (block) =>
            setRoomBlocks(prev => prev.map(b => b.id === block.id ? block : b))
        );
        socket.on("ROOMBLOCK_DELETED", ({ id }) =>
            setRoomBlocks(prev => prev.filter(b => b.id !== id))
        );

        return () => {
            socket.off("ROOMBLOCK_CREATED");
            socket.off("ROOMBLOCK_UPDATED");
            socket.off("ROOMBLOCK_DELETED");
        };
    }, [socket]);

    // --- Debounce search ---
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 300);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    // --- Table Columns ---
    const columns = useMemo(() => [
        { Header: "Date", accessor: row => new Date(row.blockDate).toLocaleDateString() },
        { Header: "Group", accessor: row => row.group?.name || "-" },
        { Header: "Room Type", accessor: row => row.roomType?.name || "-" },
        { Header: "Property", accessor: row => userProperties.find(p => p.id === row.propertyId)?.name || "-" },
        { Header: "Rooms Blocked", accessor: "roomsBlocked" },
        { Header: "Rooms Picked", accessor: "roomsPicked" },
        {
            Header: "Actions",
            accessor: "actions",
            Cell: ({ row }) => (
                <div className="flex gap-2">
                    {canEdit && (
                        <button
                            onClick={() => { setSelectedRoomBlock(row.original); setEditModalOpen(true); }}
                            className="px-2 py-1 bg-yellow-400 rounded hover:bg-yellow-500"
                        >
                            Edit
                        </button>
                    )}
                    {canDelete && (
                        <button
                            onClick={() => handleDelete(row.original.id)}
                            className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                            Delete
                        </button>
                    )}
                </div>
            )
        }
    ], [userProperties]);

    // --- Filtered Data ---
    const data = useMemo(() => {
        if (!debouncedSearch) return roomBlocks;
        return roomBlocks.filter(b =>
            (b.group?.name || "").toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            (b.roomType?.name || "").toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            (userProperties.find(p => p.id === b.propertyId)?.name || "").toLowerCase().includes(debouncedSearch.toLowerCase())
        );
    }, [roomBlocks, debouncedSearch, userProperties]);

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        page,
        prepareRow,
        canPreviousPage,
        canNextPage,
        pageOptions,
        state: { pageIndex, pageSize },
        previousPage,
        nextPage,
        setPageSize
    } = useTable({ columns, data, initialState: { pageIndex: 0, pageSize: 10 } }, useGlobalFilter, useSortBy, usePagination);

    // --- Handlers ---
    const handleRoomBlockAdded = (newBlock) => {
        setRoomBlocks(prev => [newBlock, ...prev]);
        setAddModalOpen(false);
        if (socket) socket.emit("ROOMBLOCK_CREATED", newBlock);
    };

    const handleRoomBlockUpdated = (updatedBlock) => {
        setRoomBlocks(prev => prev.map(b => b.id === updatedBlock.id ? updatedBlock : b));
        setEditModalOpen(false);
        if (socket) socket.emit("ROOMBLOCK_UPDATED", updatedBlock);
    };

    const handleDelete = async (blockId) => {
        if (!confirm("Are you sure you want to delete this Room Block?")) return;
        try {
            const res = await fetch(`/api/roomBlocks/${blockId}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete Room Block");
            setRoomBlocks(prev => prev.filter(b => b.id !== blockId));
            if (socket) socket.emit("ROOMBLOCK_DELETED", { id: blockId });
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    };

    return (
        <div className="p-4 space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Room Blocks</h2>
                <div className="flex gap-2 items-center">
                    <input
                        type="text"
                        placeholder="Search by group, room type, or property..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="border rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {canAdd && (
                        <button
                            onClick={() => setAddModalOpen(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Add Room Block
                        </button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border rounded">
                <table {...getTableProps()} className="min-w-full divide-y divide-gray-200">
                    <thead>
                        {headerGroups.map(headerGroup => (
                            <tr {...headerGroup.getHeaderGroupProps()}>
                                {headerGroup.headers.map(column => (
                                    <th
                                        {...column.getHeaderProps(column.getSortByToggleProps())}
                                        className="px-3 py-2 text-left text-sm font-medium text-gray-700"
                                    >
                                        {column.render("Header")}
                                        <span>{column.isSorted ? (column.isSortedDesc ? " 🔽" : " 🔼") : ""}</span>
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody {...getTableBodyProps()} className="divide-y divide-gray-200">
                        {page.map(row => {
                            prepareRow(row);
                            return (
                                <tr {...row.getRowProps()}>
                                    {row.cells.map(cell => (
                                        <td {...cell.getCellProps()} className="px-3 py-2 text-sm">{cell.render("Cell")}</td>
                                    ))}
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-2">
                <span className="text-sm">Page {pageIndex + 1} of {pageOptions.length}</span>
                <div className="flex gap-2 items-center">
                    <button onClick={() => previousPage()} disabled={!canPreviousPage} className="px-2 py-1 border rounded">Previous</button>
                    <button onClick={() => nextPage()} disabled={!canNextPage} className="px-2 py-1 border rounded">Next</button>
                    <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))} className="border rounded px-2 py-1">
                        {[5, 10, 20, 50].map(size => <option key={size} value={size}>{size}</option>)}
                    </select>
                </div>
            </div>

            {/* Modals */}
            {addModalOpen && (
                <AddRoomBlockModal
                    isOpen={addModalOpen}
                    onClose={() => setAddModalOpen(false)}
                    groups={groups}
                    roomTypes={roomTypes}
                    properties={userProperties}
                    onRoomBlockAdded={handleRoomBlockAdded}
                />
            )}
            {selectedRoomBlock && (
                <EditRoomBlockModal
                    isOpen={editModalOpen}
                    onClose={() => setEditModalOpen(false)}
                    block={selectedRoomBlock}
                    groups={groups}
                    roomTypes={roomTypes}
                    properties={userProperties}
                    onRoomBlockUpdated={handleRoomBlockUpdated}
                />
            )}
        </div>
    );
}
