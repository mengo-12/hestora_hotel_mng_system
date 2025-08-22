// app/folios/page.jsx
import { prisma } from '../../lib/prisma';

export default async function FoliosPage() {
    const folios = await prisma.folio.findMany({
        include: {
            booking: { include: { guest: true, room: true } },
            charges: true,
            payments: true,
        },
    });

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Folios</h1>
            <table className="min-w-full bg-white shadow rounded overflow-hidden">
                <thead className="bg-gray-200">
                    <tr>
                        <th className="p-2">Guest</th>
                        <th className="p-2">Room</th>
                        <th className="p-2">Balance</th>
                        <th className="p-2">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {folios.map((f) => {
                        const totalCharges = f.charges.reduce((a, c) => a + parseFloat(c.amount), 0);
                        const totalPayments = f.payments.reduce((a, p) => a + parseFloat(p.amount), 0);
                        const balance = totalCharges - totalPayments;
                        return (
                            <tr key={f.id} className="border-b">
                                <td className="p-2">{f.booking.guest.firstName} {f.booking.guest.lastName}</td>
                                <td className="p-2">{f.booking.room?.number || '-'}</td>
                                <td className="p-2">${balance.toFixed(2)}</td>
                                <td className="p-2">{f.status}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
