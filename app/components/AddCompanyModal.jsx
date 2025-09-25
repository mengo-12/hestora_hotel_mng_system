// 'use client';
// import { useState, useEffect } from "react";

// export default function AddCompanyModal({ isOpen, onClose, onCompanyAdded }) {
//     const [selectedProperty, setSelectedProperty] = useState("");
//     const [properties, setProperties] = useState([]);
//     const [companyName, setCompanyName] = useState("");
//     const [companyCode, setCompanyCode] = useState(""); // ← حقل جديد للكود
//     const [creditLimit, setCreditLimit] = useState("");
//     const [rateAgreement, setRateAgreement] = useState("");

//     // --- Fetch properties from API ---
//     useEffect(() => {
//         const fetchProperties = async () => {
//             try {
//                 const res = await fetch("/api/properties");
//                 const data = await res.json();
//                 setProperties(data || []);
//             } catch (err) {
//                 console.error("Failed to fetch properties:", err);
//             }
//         };
//         fetchProperties();
//     }, []);

//     const handleSubmit = async () => {
//         if (!companyName || !selectedProperty || !companyCode) {
//             alert("Please fill company name, code and select property.");
//             return;
//         }

//         try {
//             const payload = {
//                 name: companyName,
//                 code: companyCode, // ← إرسال الكود
//                 propertyId: selectedProperty,
//                 creditLimit: creditLimit ? Number(creditLimit) : null,
//                 rateAgreement: rateAgreement || null
//             };

//             const res = await fetch("/api/companies", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify(payload)
//             });

//             if (!res.ok) throw new Error("Failed to create company");

//             const newCompany = await res.json();
//             if (onCompanyAdded) onCompanyAdded(newCompany);
//             onClose();
//         } catch (err) {
//             console.error(err);
//             alert(err.message);
//         }
//     };

//     if (!isOpen) return null;

//     return (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//             <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-[400px] max-h-[90vh] overflow-y-auto">
//                 <h2 className="text-xl font-bold mb-4">Add Company</h2>

//                 <div className="mb-3">
//                     <label className="block mb-1">Company Name *</label>
//                     <input
//                         type="text"
//                         value={companyName}
//                         onChange={e => setCompanyName(e.target.value)}
//                         className="w-full border rounded p-2"
//                     />
//                 </div>

//                 <div className="mb-3">
//                     <label className="block mb-1">Company Code *</label>
//                     <input
//                         type="text"
//                         value={companyCode}
//                         onChange={e => setCompanyCode(e.target.value)}
//                         className="w-full border rounded p-2"
//                     />
//                 </div>

//                 <div className="mb-3">
//                     <label className="block mb-1">Property *</label>
//                     <select
//                         value={selectedProperty}
//                         onChange={e => setSelectedProperty(e.target.value)}
//                         className="w-full border rounded p-2"
//                     >
//                         <option value="">Select Property</option>
//                         {properties.map(p => (
//                             <option key={p.id} value={p.id}>{p.name}</option>
//                         ))}
//                     </select>
//                 </div>

//                 <div className="mb-3">
//                     <label className="block mb-1">Credit Limit</label>
//                     <input
//                         type="number"
//                         value={creditLimit}
//                         onChange={e => setCreditLimit(e.target.value)}
//                         className="w-full border rounded p-2"
//                     />
//                 </div>

//                 <div className="mb-3">
//                     <label className="block mb-1">Rate Agreement</label>
//                     <input
//                         type="text"
//                         value={rateAgreement}
//                         onChange={e => setRateAgreement(e.target.value)}
//                         className="w-full border rounded p-2"
//                     />
//                 </div>

//                 <div className="flex justify-end space-x-2 mt-4">
//                     <button onClick={onClose} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
//                         Cancel
//                     </button>
//                     <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
//                         Add Company
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// }





'use client';
import { useState, useEffect } from "react";
import { FaBuilding, FaRegAddressCard, FaMoneyBillWave, FaFileContract } from "react-icons/fa";

export default function AddCompanyModal({ isOpen, onClose, onCompanyAdded }) {
    const [form, setForm] = useState({
        propertyId: "",
        name: "",
        code: "",
        creditLimit: "",
        rateAgreement: ""
    });

    const [properties, setProperties] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setForm({ propertyId: "", name: "", code: "", creditLimit: "", rateAgreement: "" });
            setError(null);

            fetch("/api/properties")
                .then(res => res.json())
                .then(data => setProperties(Array.isArray(data) ? data : []))
                .catch(err => setProperties([]));
        }
    }, [isOpen]);

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

            const res = await fetch("/api/companies", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            setLoading(false);

            if (res.ok) {
                onCompanyAdded && onCompanyAdded(data);
                onClose();
            } else {
                setError(data.error || "Failed to add company");
            }
        } catch {
            setLoading(false);
            setError("Failed to add company");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md p-6 animate-fadeIn">
                <h2 className="text-2xl font-bold mb-5 text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <FaRegAddressCard /> Add New Company
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
                            placeholder="Enter company name"
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
                            placeholder="Enter company code"
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
                            placeholder="Enter credit limit"
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
                            placeholder="Enter rate agreement"
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
                            {loading ? "Saving..." : "Add Company"}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
