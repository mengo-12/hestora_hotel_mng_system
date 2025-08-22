// app/page.jsx
import Link from 'next/link';

export default function DashboardPage() {
    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link
                    href="/rooms"
                    className="bg-white shadow p-6 rounded hover:shadow-lg transition"
                >
                    <h2 className="text-xl font-semibold">Rooms</h2>
                    <p>View and manage all hotel rooms</p>
                </Link>

                <Link
                    href="/bookings"
                    className="bg-white shadow p-6 rounded hover:shadow-lg transition"
                >
                    <h2 className="text-xl font-semibold">Bookings</h2>
                    <p>Check reservations, check-ins and check-outs</p>
                </Link>

                <Link
                    href="/folios"
                    className="bg-white shadow p-6 rounded hover:shadow-lg transition"
                >
                    <h2 className="text-xl font-semibold">Folios</h2>
                    <p>Manage folios, charges, and payments</p>
                </Link>

                <Link
                    href="/housekeeping"
                    className="bg-white shadow p-6 rounded hover:shadow-lg transition"
                >
                    <h2 className="text-xl font-semibold">Housekeeping</h2>
                    <p>Track cleaning and maintenance tasks</p>
                </Link>

                <Link
                    href="/guests"
                    className="bg-white shadow p-6 rounded hover:shadow-lg transition"
                >
                    <h2 className="text-xl font-semibold">Guests</h2>
                    <p>View guest information</p>
                </Link>
            </div>
        </div>
    );
}
