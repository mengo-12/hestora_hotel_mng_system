// 'use client';
// import { useState, useEffect } from "react";

// export default function EditLoyaltyMemberModal({ member, isOpen, onClose, onUpdated }) {
//     const [membershipLevel, setMembershipLevel] = useState(member?.membershipLevel || "");
//     const [loyaltyProgram, setLoyaltyProgram] = useState(member?.loyaltyProgram?.id || "");
//     const [pointsBalance, setPointsBalance] = useState(member?.pointsBalance || 0);

//     const levels = ["Bronze", "Silver", "Gold", "Platinum"];

//     useEffect(() => {
//         if (member) {
//             setMembershipLevel(member.membershipLevel || "");
//             setLoyaltyProgram(member.loyaltyProgram?.id || "");
//             setPointsBalance(member.pointsBalance || 0);
//         }
//     }, [member]);

//     if (!isOpen) return null;

//     const handleUpdate = async () => {
//         if (!membershipLevel) return alert("اختر المستوى");

//         try {
//             const res = await fetch(`/api/loyalty/members/${member.id}`, {
//                 method: "PUT",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({
//                     membershipLevel,
//                     loyaltyProgramId: loyaltyProgram || null,
//                     pointsBalance: Number(pointsBalance)
//                 }),
//             });

//             const data = await res.json();

//             if (res.ok) {
//                 alert("✅ تم تحديث العضو بنجاح");
//                 if (onUpdated) onUpdated(data); // إرسال العضو الجديد للـ parent
//                 onClose();
//             } else {
//                 alert(data.error || "❌ حدث خطأ أثناء التحديث");
//             }
//         } catch (err) {
//             console.error(err);
//             alert("⚠️ خطأ في الاتصال بالخادم");
//         }
//     };

//     return (
//         <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
//             <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-md shadow-lg border-t-4 border-yellow-500">
//                 <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white text-center">تعديل عضو الولاء</h2>

//                 {/* المستوى */}
//                 <div className="flex flex-col mb-4">
//                     <label className="mb-1 text-gray-600 dark:text-gray-300 font-medium">المستوى</label>
//                     <select
//                         value={membershipLevel}
//                         onChange={e => setMembershipLevel(e.target.value)}
//                         className="p-3 border rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-yellow-500"
//                     >
//                         {levels.map(level => (
//                             <option key={level} value={level}>{level}</option>
//                         ))}
//                     </select>
//                 </div>

//                 {/* النقاط */}
//                 <div className="flex flex-col mb-4">
//                     <label className="mb-1 text-gray-600 dark:text-gray-300 font-medium">النقاط</label>
//                     <input
//                         type="number"
//                         value={pointsBalance}
//                         onChange={e => setPointsBalance(e.target.value)}
//                         className="p-3 border rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-yellow-500"
//                     />
//                 </div>

//                 {/* البرنامج */}
//                 <div className="flex flex-col mb-6">
//                     <label className="mb-1 text-gray-600 dark:text-gray-300 font-medium">البرنامج</label>
//                     <input
//                         type="text"
//                         value={loyaltyProgram}
//                         onChange={e => setLoyaltyProgram(e.target.value)}
//                         placeholder="اسم البرنامج"
//                         className="p-3 border rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-yellow-500"
//                     />
//                 </div>

//                 {/* أزرار */}
//                 <div className="flex justify-end gap-3">
//                     <button
//                         onClick={onClose}
//                         className="px-5 py-2 bg-gray-300 dark:bg-gray-600 dark:text-white rounded-lg hover:bg-gray-400 transition"
//                     >
//                         إلغاء
//                     </button>
//                     <button
//                         onClick={handleUpdate}
//                         className="px-5 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
//                     >
//                         تحديث
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// }



'use client';
import { useState, useEffect } from "react";

export default function EditLoyaltyMemberModal({ member, isOpen, onClose, onUpdated }) {
    const [membershipLevel, setMembershipLevel] = useState(member?.membershipLevel || "");
    const [loyaltyProgram, setLoyaltyProgram] = useState(member?.loyaltyProgram?.id || "");
    const [programs, setPrograms] = useState([]);
    const [pointsBalance, setPointsBalance] = useState(member?.pointsBalance || 0);

    const levels = ["Bronze", "Silver", "Gold", "Platinum"];

    // تحديث الحالة عند تغيير العضو
    useEffect(() => {
        if (member) {
            setMembershipLevel(member.membershipLevel || "");
            setLoyaltyProgram(member.loyaltyProgram?.id || "");
            setPointsBalance(member.pointsBalance || 0);
        }
    }, [member]);

    // جلب برامج الولاء
    useEffect(() => {
        fetch("/api/loyalty/programs")
            .then(res => res.json())
            .then(setPrograms)
            .catch(err => console.error("Failed to fetch programs:", err));
    }, []);

    if (!isOpen) return null;

    const handleUpdate = async () => {
        if (!membershipLevel) return alert("اختر المستوى");

        try {
            const res = await fetch(`/api/loyalty/members/${member.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    membershipLevel,
                    loyaltyProgramId: loyaltyProgram || null,
                    pointsBalance: Number(pointsBalance),
                }),
            });

            const data = await res.json();

            if (res.ok) {
                alert("✅ تم تحديث العضو بنجاح");
                if (onUpdated) onUpdated(data); // ✅ إرسال العضو المحدث
                onClose();
            } else {
                alert(data.error || "❌ حدث خطأ أثناء التحديث");
            }
        } catch (err) {
            console.error("Update error:", err);
            alert("⚠️ خطأ في الاتصال بالخادم");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-md shadow-lg border-t-4 border-yellow-500">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white text-center">
                    تعديل عضو الولاء
                </h2>

                {/* المستوى */}
                <div className="flex flex-col mb-4">
                    <label className="mb-1 text-gray-600 dark:text-gray-300 font-medium">المستوى</label>
                    <select
                        value={membershipLevel}
                        onChange={(e) => setMembershipLevel(e.target.value)}
                        className="p-3 border rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-yellow-500"
                    >
                        {levels.map(level => (
                            <option key={level} value={level}>{level}</option>
                        ))}
                    </select>
                </div>

                {/* البرنامج */}
                <div className="flex flex-col mb-4">
                    <label className="mb-1 text-gray-600 dark:text-gray-300 font-medium">البرنامج</label>
                    <select
                        value={loyaltyProgram}
                        onChange={(e) => setLoyaltyProgram(e.target.value)}
                        className="p-3 border rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-yellow-500"
                    >
                        <option value="">اختر برنامج</option>
                        {programs.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>

                {/* الرصيد */}
                <div className="flex flex-col mb-6">
                    <label className="mb-1 text-gray-600 dark:text-gray-300 font-medium">النقاط</label>
                    <input
                        type="number"
                        value={pointsBalance}
                        onChange={e => setPointsBalance(Number(e.target.value))}
                        className="p-3 border rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-yellow-500"
                    />
                </div>

                {/* أزرار */}
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-gray-300 dark:bg-gray-600 dark:text-white rounded-lg hover:bg-gray-400 transition"
                    >
                        إلغاء
                    </button>
                    <button
                        onClick={handleUpdate}
                        className="px-5 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
                    >
                        تحديث
                    </button>
                </div>
            </div>
        </div>
    );
}

