'use client';
import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line
} from "recharts";

export default function DashboardPage() {
  const [propertyId, setPropertyId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    roomsSold: 0,
    occupancy: 0,
    adr: 0,
    revpar: 0,
    totalRevenue: 0,
    roomsRevenue: 0,
    revenueBreakdown: { roomRevenue: 0, extrasRevenue: 0, taxes: 0, adjustments: 0 }
  });
  const [bookings, setBookings] = useState([]);
  const [revenueChart, setRevenueChart] = useState([]);
  const [folioData, setFolioData] = useState({ bookings: [], groups: [], companies: [] });

  useEffect(() => {
    async function fetchData() {
      try {
        // جلب property المستخدم
        const resProperty = await fetch("/api/properties/me");
        const dataProperty = await resProperty.json();
        if (!dataProperty.property) return;
        setPropertyId(dataProperty.property.id);

        const today = new Date().toISOString().split("T")[0];

        // جلب night audit summary و bookings
        const resAudit = await fetch(`/api/night-audit?propertyId=${dataProperty.property.id}&date=${today}`);
        const dataAudit = await resAudit.json();

        if (dataAudit.summary) setSummary(dataAudit.summary);
        if (dataAudit.bookings) {
          setBookings(dataAudit.bookings);
          const chartData = dataAudit.bookings.map(b => {
            const charges = b.folio?.charges || [];
            const revenue = charges.reduce((sum, c) => sum + Number(c.amount || 0) + Number(c.tax || 0), 0);
            return { day: b.room?.name || `Room ${b.roomId}`, revenue };
          });
          setRevenueChart(chartData);
        }

        // إعداد بيانات Folio Summary لكل نوع
        setFolioData({
          bookings: dataAudit.bookings || [],
          groups: dataAudit.groups || [],       // إذا لديك API Groups
          companies: dataAudit.companies || []  // إذا لديك API Companies
        });

      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div className="text-center py-10 text-gray-500 dark:text-gray-300">Loading dashboard...</div>;

  const renderFolioCard = (folio, title) => (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 flex flex-col gap-1 w-full sm:w-64">
      <h4 className="font-semibold text-gray-700 dark:text-gray-200">{title}</h4>
      <div className="flex justify-between text-gray-500 dark:text-gray-300"><span>Subtotal:</span><span>${folio.subtotal || 0}</span></div>
      <div className="flex justify-between text-gray-500 dark:text-gray-300"><span>Taxes:</span><span>${folio.taxTotal || 0}</span></div>
      <div className="flex justify-between text-gray-500 dark:text-gray-300"><span>Total Charges:</span><span>${folio.totalCharges || 0}</span></div>
      <div className="flex justify-between text-gray-500 dark:text-gray-300"><span>Payments:</span><span>${folio.totalPayments || 0}</span></div>
      <div className="flex justify-between font-bold"><span>Balance:</span><span>${folio.balance || 0}</span></div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 p-4">

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 flex flex-col items-center">
          <span className="text-gray-500 dark:text-gray-300">Rooms Occupied</span>
          <span className="text-2xl font-bold">{summary.roomsSold}</span>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 flex flex-col items-center">
          <span className="text-gray-500 dark:text-gray-300">Occupancy</span>
          <span className="text-2xl font-bold">{summary.occupancy}%</span>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 flex flex-col items-center">
          <span className="text-gray-500 dark:text-gray-300">ADR</span>
          <span className="text-2xl font-bold">${summary.adr}</span>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 flex flex-col items-center">
          <span className="text-gray-500 dark:text-gray-300">RevPAR</span>
          <span className="text-2xl font-bold">${summary.revpar}</span>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
          <h3 className="font-semibold mb-2 text-gray-700 dark:text-gray-200">Revenue Breakdown</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[summary.revenueBreakdown]}>
              <XAxis dataKey="name" stroke="#8884d8" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="roomRevenue" fill="#4f46e5" name="Room Revenue"/>
              <Bar dataKey="extrasRevenue" fill="#10b981" name="Extras"/>
              <Bar dataKey="taxes" fill="#f59e0b" name="Taxes"/>
              <Bar dataKey="adjustments" fill="#ef4444" name="Adjustments"/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
          <h3 className="font-semibold mb-2 text-gray-700 dark:text-gray-200">Bookings Revenue</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={revenueChart}>
              <XAxis dataKey="day" stroke="#8884d8" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Folio Summary Section */}
      <div className="flex flex-col gap-6">

        {/* Booking Folios */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200">Booking Folios</h3>
          <div className="flex flex-wrap gap-4">
            {folioData.bookings.map(b => b.folio && renderFolioCard(b.folio, `Booking #${b.id}`))}
          </div>
        </div>

        {/* Group Folios */}
        {folioData.groups.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200">Group Folios</h3>
            <div className="flex flex-wrap gap-4">
              {folioData.groups.map(g => g.folio && renderFolioCard(g.folio, `Group: ${g.name}`))}
            </div>
          </div>
        )}

        {/* Company Folios */}
        {folioData.companies.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200">Company Folios</h3>
            <div className="flex flex-wrap gap-4">
              {folioData.companies.map(c => c.folio && renderFolioCard(c.folio, `Company: ${c.name}`))}
            </div>
          </div>
        )}
      </div>

      {/* Recent Bookings */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
        <h3 className="font-semibold mb-2 text-gray-700 dark:text-gray-200">Recent Bookings</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-2">Guest</th>
                <th className="px-4 py-2">Room</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b.id} className="border-b border-gray-200 dark:border-gray-700">
                  <td className="px-4 py-2">{b.guest?.firstName} {b.guest?.lastName}</td>
                  <td className="px-4 py-2">{b.room?.name}</td>
                  <td className="px-4 py-2">{b.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button className="bg-blue-600 text-white rounded-lg py-2 shadow hover:bg-blue-700 transition">New Booking</button>
        <button className="bg-green-600 text-white rounded-lg py-2 shadow hover:bg-green-700 transition">Add Guest</button>
        <button className="bg-yellow-500 text-white rounded-lg py-2 shadow hover:bg-yellow-600 transition">Manage Rooms</button>
        <button className="bg-red-600 text-white rounded-lg py-2 shadow hover:bg-red-700 transition">Check Out</button>
      </div>
    </div>
  );
}
