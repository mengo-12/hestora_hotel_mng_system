'use client';
import { useEffect, useState } from "react";
import { useSocket } from "@/app/components/SocketProvider";
import AddGuestModal from "@/app/components/AddGuestModal";
import EditGuestModal from "@/app/components/EditGuestModal";

export default function GuestsPage({ session, userProperties }) {
    const [guests, setGuests] = useState([]);
    const [selectedGuest, setSelectedGuest] = useState(null);
    const [editGuest, setEditGuest] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [properties, setProperties] = useState([]);
    const [hotelGroups, setHotelGroups] = useState([]);
    const [filteredGuests, setFilteredGuests] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterProperty, setFilterProperty] = useState("");
    const [filterHotelGroup, setFilterHotelGroup] = useState("");
    const socket = useSocket();

    const role = session?.user?.role || "Guest";
    const canAddEdit = ["Admin", "FrontDesk"].includes(role);
    const canDelete = role === "Admin";
    const canView = ["Admin", "FrontDesk", "Manager"].includes(role);

    useEffect(() => {
        if (!canView) return;

        fetchGuests();
        fetchProperties();
        fetchHotelGroups();

        if (socket) {
            socket.on("GUEST_CREATED", (guest) => setGuests(prev => [...prev, guest]));
            socket.on("GUEST_UPDATED", (updatedGuest) => setGuests(prev => prev.map(g => g.id === updatedGuest.id ? updatedGuest : g)));
            socket.on("GUEST_DELETED", (guestId) => setGuests(prev => prev.filter(g => g.id !== guestId)));
        }

        return () => {
            if (socket) {
                socket.off("GUEST_CREATED");
                socket.off("GUEST_UPDATED");
                socket.off("GUEST_DELETED");
            }
        };
    }, [socket, canView]);

    useEffect(() => {
        const term = searchTerm.toLowerCase();
        const filtered = guests.filter(g =>
            (
                g.firstName.toLowerCase().includes(term) ||
                g.lastName.toLowerCase().includes(term) ||
                (g.passportNumber?.toLowerCase().includes(term)) ||
                (g.phone?.toLowerCase().includes(term))
            ) &&
            (filterProperty ? g.propertyId === filterProperty : true) &&
            (filterHotelGroup ? g.hotelGroupId === filterHotelGroup : true)
        );
        setFilteredGuests(filtered);
    }, [searchTerm, filterProperty, filterHotelGroup, guests]);

    const fetchGuests = async () => {
        const res = await fetch("/api/guests");
        const data = await res.json();
        setGuests(data);
    };

    const fetchProperties = async () => {
        const res = await fetch("/api/properties");
        const data = await res.json();
        setProperties(data);
    };

    const fetchHotelGroups = async () => {
        const res = await fetch("/api/hotelGroups");
        const data = await res.json();
        setHotelGroups(data);
    };

    if (!canView) return <p className="p-6 text-red-500">You do not have permission to view this page.</p>;

    return (
        <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Guests</h1>

                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <input
                        type="text"
                        placeholder="🔍 Search guests..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="flex-1 md:flex-none px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                    <select
                        value={filterProperty}
                        onChange={e => setFilterProperty(e.target.value)}
                        className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                    >
                        <option value="">All Properties</option>
                        {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <select
                        value={filterHotelGroup}
                        onChange={e => setFilterHotelGroup(e.target.value)}
                        className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                    >
                        <option value="">All Hotel Groups</option>
                        {hotelGroups.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                    </select>

                    {canAddEdit && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            + Add Guest
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredGuests.map(guest => (
                    <div
                        key={guest.id}
                        className="p-4 rounded-lg shadow cursor-pointer hover:scale-105 transition transform bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        onClick={() => setSelectedGuest(guest)}
                    >
                        <h2 className="text-lg font-semibold">{guest.firstName} {guest.lastName}</h2>
                    </div>
                ))}
            </div>

            {selectedGuest && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-96">
                        <div className="flex justify-between items-start">
                            <h2 className="text-xl font-bold mb-4">{selectedGuest.firstName} {selectedGuest.lastName}</h2>
                            <div className="flex gap-1">
                                {canAddEdit && (
                                    <button
                                        onClick={() => setEditGuest(selectedGuest)}
                                        className="bg-blue-600 text-white text-xs px-2 py-1 rounded hover:bg-blue-700"
                                    >
                                        ✏️ Edit
                                    </button>
                                )}
                                {canDelete && (
                                    <button
                                        onClick={async () => {
                                            if (!confirm(`Are you sure you want to delete ${selectedGuest.firstName} ${selectedGuest.lastName}?`)) return;
                                            try {
                                                const res = await fetch(`/api/guests/${selectedGuest.id}`, { method: "DELETE" });
                                                if (!res.ok) {
                                                    const data = await res.json();
                                                    throw new Error(data.error || "Failed to delete guest");
                                                }
                                                setGuests(prev => prev.filter(g => g.id !== selectedGuest.id));
                                                setSelectedGuest(null);
                                            } catch (err) {
                                                console.error(err);
                                                alert(err.message);
                                            }
                                        }}
                                        className="bg-red-500 text-white text-xs px-2 py-1 rounded hover:bg-red-600"
                                    >
                                        🗑 Delete
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <p><b>Phone:</b> {selectedGuest.phone || "N/A"}</p>
                            <p><b>Email:</b> {selectedGuest.email || "N/A"}</p>
                            <p><b>Nationality:</b> {selectedGuest.nationality || "N/A"}</p>
                            <p><b>Passport:</b> {selectedGuest.passportNumber || "N/A"}</p>
                            <p><b>Date of Birth:</b> {selectedGuest.dateOfBirth ? selectedGuest.dateOfBirth.slice(0, 10) : "N/A"}</p>
                            <p><b>Property:</b> {selectedGuest.property?.name || "N/A"}</p>
                            <p><b>Hotel Group:</b> {selectedGuest.hotelGroup?.name || "N/A"}</p>
                        </div>

                        <div className="mt-4 text-right">
                            <button onClick={() => setSelectedGuest(null)} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showAddModal && canAddEdit && (
                <AddGuestModal
                    isOpen={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    properties={properties}
                    hotelGroups={hotelGroups}
                    onSaved={() => setShowAddModal(false)}
                />
            )}

            {editGuest && canAddEdit && (
                <EditGuestModal
                    guest={editGuest}
                    isOpen={!!editGuest}
                    onClose={() => setEditGuest(null)}
                    properties={properties}
                    hotelGroups={hotelGroups}
                    onSaved={() => setEditGuest(null)}
                />
            )}
        </div>
    );
}
