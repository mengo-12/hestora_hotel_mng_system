// 'use client';
// import { useState, useEffect } from "react";
// import { useSocket } from "@/app/components/SocketProvider";

// export default function EditCompanyModal({ isOpen, onClose, company, properties, onCompanyUpdated }) {
//     const socket = useSocket();

//     const [code, setCode] = useState(company?.code || "");
//     const [name, setName] = useState(company?.name || "");
//     const [propertyId, setPropertyId] = useState(company?.propertyId || "");
//     const [creditLimit, setCreditLimit] = useState(company?.creditLimit || "");
//     const [rateAgreement, setRateAgreement] = useState(company?.rateAgreement || "");

//     useEffect(() => {
//         if (company) {
//             setCode(company.code || "");
//             setName(company.name || "");
//             setPropertyId(company.propertyId || "");
//             setCreditLimit(company.creditLimit || "");
//             setRateAgreement(company.rateAgreement || "");
//         }
//     }, [company]);

//     const handleSubmit = async () => {
//         if (!code || !name || !propertyId) {
//             alert("Please fill all required fields.");
//             return;
//         }

//         const payload = {
//             code,
//             name,
//             propertyId,
//             creditLimit: creditLimit || null,
//             rateAgreement: rateAgreement || null,
//         };

//         try {
//             const res = await fetch(`/api/companies/${company.id}`, {
//                 method: "PUT",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify(payload),
//             });

//             if (!res.ok) {
//                 const data = await res.json().catch(() => ({}));
//                 throw new Error(data.error || "Failed to update company");
//             }

//             const updatedCompany = await res.json();
//             onCompanyUpdated(updatedCompany);

//             // بث عالمي فقط عبر socket
//             if (socket) socket.emit("COMPANY_UPDATED", updatedCompany);

//             onClose();
//         } catch (err) {
//             console.error(err);
//             alert(err.message);
//         }
//     };

//     if (!isOpen) return null;

//     return (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//             <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6 rounded-lg shadow-lg w-[95%] max-w-md">
//                 <h2 className="text-xl font-bold mb-4">Edit Company</h2>

//                 <div className="space-y-3">
//                     <div>
//                         <label>Code *</label>
//                         <input
//                             type="text"
//                             value={code}
//                             onChange={e => setCode(e.target.value)}
//                             className="w-full border rounded p-2"
//                         />
//                     </div>

//                     <div>
//                         <label>Name *</label>
//                         <input
//                             type="text"
//                             value={name}
//                             onChange={e => setName(e.target.value)}
//                             className="w-full border rounded p-2"
//                         />
//                     </div>

//                     <div>
//                         <label>Property *</label>
//                         <select
//                             value={propertyId}
//                             onChange={e => setPropertyId(e.target.value)}
//                             className="w-full border rounded p-2"
//                         >
//                             <option value="">Select Property</option>
//                             {properties.map(p => (
//                                 <option key={p.id} value={p.id}>{p.name}</option>
//                             ))}
//                         </select>
//                     </div>

//                     <div>
//                         <label>Credit Limit</label>
//                         <input
//                             type="number"
//                             value={creditLimit}
//                             onChange={e => setCreditLimit(e.target.value)}
//                             className="w-full border rounded p-2"
//                         />
//                     </div>

//                     <div>
//                         <label>Rate Agreement</label>
//                         <input
//                             type="text"
//                             value={rateAgreement}
//                             onChange={e => setRateAgreement(e.target.value)}
//                             className="w-full border rounded p-2"
//                         />
//                     </div>

//                     <div className="flex justify-end space-x-2 mt-4">
//                         <button
//                             onClick={onClose}
//                             className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
//                         >
//                             Cancel
//                         </button>
//                         <button
//                             onClick={handleSubmit}
//                             className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
//                         >
//                             Save
//                         </button>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }






'use client';
import { useState, useEffect } from "react";
import { FaBuilding, FaRegAddressCard, FaMoneyBillWave, FaFileContract } from "react-icons/fa";
import { useSocket } from "@/app/components/SocketProvider";

export default function EditCompanyModal({ isOpen, onClose, company, properties, onCompanyUpdated }) {
    const socket = useSocket();

    const [form, setForm] = useState({
        name: "",
        code: "",
        propertyId: "",
        creditLimit: "",
        rateAgreement: ""
    });

    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (company) {
            setForm({
                name: company.name || "",
                code: company.code || "",
                propertyId: company.propertyId || "",
                creditLimit: company.creditLimit || "",
                rateAgreement: company.rateAgreement || ""
            });
        }
    }, [company]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) return setError("Company Name is required");
        if (!form.code.trim()) return setError("Company Code is required");
        if (!form.propertyId) return setError("Property is required");

        setLoading(true);
        try {
            const payload = {
                name: form.name,
                code: form.code,
                propertyId: form.propertyId,
                creditLimit: form.creditLimit ? Number(form.creditLimit) : null,
                rateAgreement: form.rateAgreement || null
            };

            const res = await fetch(`/api/companies/${company.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            setLoading(false);

            if (res.ok) {
                onCompanyUpdated && onCompanyUpdated(data);
                if (socket) socket.emit("COMPANY_UPDATED", data);
                onClose();
            } else {
                setError(data.error || "Failed to update company");
            }
        } catch {
            setLoading(false);
            setError("Failed to update company");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md p-6 animate-fadeIn">
                <h2 className="text-2xl font-bold mb-5 text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <FaRegAddressCard /> Edit Company
                </h2>

                {error && (
                    <div className="mb-3 p-2 text-sm text-red-600 bg-red-100 dark:bg-red-900/40 dark:text-red-300 rounded-lg">
                        {error}
                    </div>
                )}

                <form className="space-y-4" onSubmit={handleSubmit}>

                    {/* Company Name */}
                    <div className="flex flex-col">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                            <FaRegAddressCard /> Company Name *
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            className="w-full p-2 mt-1 border rounded-lg bg-gray-50 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                        />
                    </div>

                    {/* Company Code */}
                    <div className="flex flex-col">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                            <FaRegAddressCard /> Company Code *
                        </label>
                        <input
                            type="text"
                            name="code"
                            value={form.code}
                            onChange={handleChange}
                            className="w-full p-2 mt-1 border rounded-lg bg-gray-50 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                        />
                    </div>

                    {/* Property */}
                    <div className="flex flex-col">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                            <FaBuilding /> Property *
                        </label>
                        <select
                            name="propertyId"
                            value={form.propertyId}
                            onChange={handleChange}
                            className="w-full p-2 mt-1 border rounded-lg bg-gray-50 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                        >
                            <option value="">Select Property</option>
                            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>

                    {/* Credit Limit */}
                    <div className="flex flex-col">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                            <FaMoneyBillWave /> Credit Limit
                        </label>
                        <input
                            type="number"
                            name="creditLimit"
                            value={form.creditLimit}
                            onChange={handleChange}
                            className="w-full p-2 mt-1 border rounded-lg bg-gray-50 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                        />
                    </div>

                    {/* Rate Agreement */}
                    <div className="flex flex-col">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                            <FaFileContract /> Rate Agreement
                        </label>
                        <input
                            type="text"
                            name="rateAgreement"
                            value={form.rateAgreement}
                            onChange={handleChange}
                            className="w-full p-2 mt-1 border rounded-lg bg-gray-50 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                        <button type="button" onClick={onClose}
                            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading}
                            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
                            {loading ? "Saving..." : "Save"}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
