// 'use client';
// import { useState, useEffect } from "react";
// import { useSocket } from "@/app/components/SocketProvider";

// export default function POSSalesPage({ session, userProperties }) {
//     const [outlets, setOutlets] = useState([]);
//     const [items, setItems] = useState([]);
//     const [selectedOutlet, setSelectedOutlet] = useState("");
//     const [saleItems, setSaleItems] = useState([]);
//     const [sales, setSales] = useState([]);

//     const socket = useSocket();

//     const role = session?.user?.role || "Guest";
//     const canCreate = ["Admin", "Manager"].includes(role);

//     // Fetch outlets & items
// const fetchData = async () => {
//     try {
//         const outletsRes = await fetch("/api/pos/outlets");
//         setOutlets(await outletsRes.json() || []);
//         const itemsRes = await fetch("/api/pos/items");
//         setItems(await itemsRes.json() || []);
//     } catch {
//         setOutlets([]);
//         setItems([]);
//     }
// };

// useEffect(() => {
//     fetchData();
//     if (!socket) return;
//     // Broadcast listener
//     socket.on("POS_SALE_CREATED", (sale) => setSales(prev => [...prev, sale]));
//     return () => { socket.off("POS_SALE_CREATED"); };
// }, [socket]);

//     // Sale actions
//     const addItem = (item) => {
//         if (!saleItems.find(si => si.id === item.id)) setSaleItems([...saleItems, { ...item, quantity: 1 }]);
//     };
//     const updateQuantity = (id, qty) => setSaleItems(saleItems.map(si => si.id === id ? { ...si, quantity: qty } : si));
//     const removeItem = (id) => setSaleItems(saleItems.filter(si => si.id !== id));

//     const submitSale = async () => {
//         if (!canCreate) { alert("ليس لديك صلاحية إنشاء المبيعات."); return; }
//         if (!selectedOutlet || saleItems.length === 0) { alert("يرجى اختيار Outlet وإضافة الأصناف."); return; }

//         try {
//             const res = await fetch("/api/pos/sales", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({
//                     outletId: selectedOutlet,
//                     items: saleItems.map(si => ({
//                         id: si.id,
//                         name: si.name,
//                         price: si.price,
//                         tax: si.tax,
//                         quantity: si.quantity
//                     }))
//                 })
//             });
//             await res.json();
//             setSaleItems([]);
//             setSelectedOutlet("");
//         } catch { alert("فشل إنشاء المبيع."); }
//     };

//     // KPI
//     const kpis = {
//         totalSales: sales.length,
//         totalItems: saleItems.length,
//         totalRevenue: sales.reduce((sum, s) => sum + parseFloat(s.total), 0)
//     };

//     return (
//         <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100">

//             {/* KPI Cards */}
//             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//                 {[
//                     { title: "Total Sales", value: kpis.totalSales },
//                     { title: "Items in Sale", value: kpis.totalItems },
//                     { title: "Revenue", value: `${kpis.totalRevenue} SAR` }
//                 ].map((kpi, idx) => (
//                     <div key={idx} className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 flex flex-col items-center">
//                         <span className="text-gray-500 dark:text-gray-300">{kpi.title}</span>
//                         <span className="text-2xl font-bold">{kpi.value}</span>
//                     </div>
//                 ))}
//             </div>

//             {/* Filters */}
//             <div className="flex flex-col md:flex-row gap-3 flex-wrap md:flex-nowrap items-end bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
//                 <div className="flex flex-col w-full md:w-1/4">
//                     <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">Select Outlet</label>
//                     <select
//                         value={selectedOutlet}
//                         onChange={e => setSelectedOutlet(e.target.value)}
//                         className="p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
//                     >
//                         <option value="">اختر Outlet</option>
//                         {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
//                     </select>
//                 </div>

//                 <div className="flex w-full md:w-auto gap-2">
//                     {canCreate && (
//                         <button
//                             onClick={submitSale}
//                             className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg w-full md:w-auto"
//                         >
//                             إنشاء المبيع
//                         </button>
//                     )}
//                 </div>
//             </div>

//             {/* POS Items */}
//             <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
//                 {items.map(i => (
//                     <button
//                         key={i.id}
//                         onClick={() => addItem(i)}
//                         disabled={!canCreate}
//                         className={`border p-3 rounded-lg font-medium text-gray-700 dark:text-gray-200 ${canCreate ? "hover:bg-blue-100 dark:hover:bg-blue-800" : "opacity-50 cursor-not-allowed"}`}
//                     >
//                         {i.name} ({i.price} SAR)
//                     </button>
//                 ))}
//             </div>

//             {/* Sale Items Table */}
//             <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow rounded-2xl p-4">
//                 <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
//                     <thead className="bg-gray-100 dark:bg-gray-700">
//                         <tr>
//                             <th className="px-4 py-2 text-left">Name</th>
//                             <th className="px-4 py-2 text-left">Quantity</th>
//                             <th className="px-4 py-2 text-left">Price</th>
//                             <th className="px-4 py-2 text-left">Tax %</th>
//                             <th className="px-4 py-2 text-left">Action</th>
//                         </tr>
//                     </thead>
//                     <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
//                         {saleItems.map(si => (
//                             <tr key={si.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
//                                 <td className="px-4 py-2">{si.name}</td>
//                                 <td className="px-4 py-2">{si.quantity}</td>
//                                 <td className="px-4 py-2">{si.price}</td>
//                                 <td className="px-4 py-2">{si.tax}</td>
//                                 <td className="px-4 py-2">
//                                     <button
//                                         onClick={() => removeItem(si.id)}
//                                         className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg"
//                                         disabled={!canCreate}
//                                     >
//                                         حذف
//                                     </button>
//                                 </td>
//                             </tr>
//                         ))}
//                         {saleItems.length === 0 && (
//                             <tr>
//                                 <td colSpan="5" className="text-center py-6 text-gray-500 dark:text-gray-400">No items in sale</td>
//                             </tr>
//                         )}
//                     </tbody>
//                 </table>
//             </div>

//             {/* Sales Table */}
//             <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow rounded-2xl p-4">
//                 <h2 className="font-semibold text-lg mb-2">قائمة المبيعات</h2>
//                 <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
//                     <thead className="bg-gray-100 dark:bg-gray-700">
//                         <tr>
//                             <th className="px-4 py-2">ID</th>
//                             <th className="px-4 py-2">Outlet</th>
//                             <th className="px-4 py-2">Total</th>
//                             <th className="px-4 py-2">Tax</th>
//                             <th className="px-4 py-2">Items</th>
//                         </tr>
//                     </thead>
//                     <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
//                         {sales.map(s => (
//                             <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
//                                 <td className="px-4 py-2">{s.id}</td>
//                                 <td className="px-4 py-2">{s.outlet.name}</td>
//                                 <td className="px-4 py-2">{s.total}</td>
//                                 <td className="px-4 py-2">{s.tax}</td>
//                                 <td className="px-4 py-2">{s.items.map(i => `${i.item.name} x${i.quantity}`).join(", ")}</td>
//                             </tr>
//                         ))}
//                         {sales.length === 0 && (
//                             <tr>
//                                 <td colSpan="5" className="text-center py-6 text-gray-500 dark:text-gray-400">No sales yet</td>
//                             </tr>
//                         )}
//                     </tbody>
//                 </table>
//             </div>
//         </div>
//     );
// }






'use client';
import { useState, useEffect } from "react";
import { useSocket } from "@/app/components/SocketProvider";
import { Heart, Star, ShoppingCart, Trash2 } from "lucide-react";

export default function POSSalesPage({ session }) {
    const [items, setItems] = useState([]);
    const [outlets, setOutlets] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedOutlet, setSelectedOutlet] = useState("");
    const [saleItems, setSaleItems] = useState([]);
    const [cartOpen, setCartOpen] = useState(false);
    const [filter, setFilter] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [selectedOutletFilter, setSelectedOutletFilter] = useState("All");

    const socket = useSocket();
    const role = session?.user?.role || "Guest";
    const canCreate = ["Admin", "Manager"].includes(role);

    const fetchData = async () => {
        try {
            const outletsRes = await fetch("/api/pos/outlets");
            setOutlets(await outletsRes.json() || []);
            const itemsRes = await fetch("/api/pos/items");
            setItems(await itemsRes.json() || []);
        } catch {
            setOutlets([]);
            setItems([]);
        }
    };

    useEffect(() => {
        fetchData();
        if (!socket) return;
        // Broadcast listener
        socket.on("POS_SALE_CREATED", (sale) => setSales(prev => [...prev, sale]));
        return () => { socket.off("POS_SALE_CREATED"); };
    }, [socket]);

    const addToCart = (item, qty) => {
        const exist = saleItems.find(si => si.id === item.id);
        if (exist) {
            setSaleItems(saleItems.map(si =>
                si.id === item.id ? { ...si, quantity: si.quantity + qty } : si
            ));
        } else {
            setSaleItems([...saleItems, { ...item, quantity: qty }]);
        }
    };

    const updateQuantity = (id, qty) => {
        if (qty <= 0) return removeFromCart(id);
        setSaleItems(saleItems.map(si => si.id === id ? { ...si, quantity: qty } : si));
    };

    const removeFromCart = (id) => setSaleItems(saleItems.filter(si => si.id !== id));

    const total = saleItems.reduce((sum, si) => sum + si.price * si.quantity, 0);
    const totalTax = saleItems.reduce((sum, si) => sum + (si.price * si.quantity * (si.tax / 100)), 0);

    const [loading, setLoading] = useState(false);

    const submitSale = async () => {
        if (!canCreate) {
            alert("You do not have permission to create sales.");
            return;
        }
        if (!selectedOutlet || saleItems.length === 0) {
            alert("Please select an outlet and add items.");
            return;
        }

        try {
            setLoading(true);

            const res = await fetch("/api/pos/sales", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    outletId: selectedOutlet,
                    items: saleItems.map(si => ({
                        id: si.id,
                        name: si.name,
                        price: si.price,
                        tax: si.tax,
                        quantity: si.quantity
                    }))
                })
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.error || "Failed to create sale");
                setLoading(false);
                return;
            }

            // --- مسح السلة وإغلاق الكارت ---
            setSaleItems([]);
            setCartOpen(false);
            setSelectedOutlet("");


            // --- إشعار نجاح ---
            alert(`✅ Sale completed!\nTotal: ${(data.total + data.tax).toFixed(2)} SAR`);
        } catch (err) {
            console.error(err);
            alert("❌ Failed to complete sale");
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">

            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row gap-3 flex-wrap md:flex-nowrap items-end bg-white dark:bg-gray-800 p-4 rounded-lg shadow top-0 z-30">
                <div className="flex-1 flex flex-col md:flex-row gap-3 md:items-end">

                    {/* Search */}
                    <div className="flex-1">
                        <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">Search</label>
                        <input
                            type="text"
                            placeholder="🔍 Search items..."
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                            className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                    </div>

                    {/* Category */}
                    <div className="w-full md:w-1/4">
                        <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">Category</label>
                        <select
                            value={selectedCategory}
                            onChange={e => setSelectedCategory(e.target.value)}
                            className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    {/* Outlet */}
                    <div className="w-full md:w-1/4">
                        <label className="mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">Outlet Filter</label>
                        <select
                            value={selectedOutletFilter}
                            onChange={e => setSelectedOutletFilter(e.target.value)}
                            className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        >
                            <option value="All">All</option>
                            {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                        </select>
                    </div>
                </div>

                {/* Cart Button */}
                <div>
                    <button
                        onClick={() => setCartOpen(true)}
                        className="relative px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                        <ShoppingCart size={20} /> Cart
                        {saleItems.length > 0 && (
                            <span className="absolute -top-1 -right-2 bg-red-600 text-xs text-white px-2 py-0.5 rounded-full">
                                {saleItems.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Products Grid */}
            <main className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-4">
                {items
                    .filter(i => i.name.toLowerCase().includes(filter.toLowerCase()))
                    .filter(i => selectedCategory === "All" || i.category === selectedCategory)
                    .filter(i => selectedOutletFilter === "All" || i.outletId === selectedOutletFilter)
                    .map(item => (
                        <ProductCard key={item.id} item={item} addToCart={addToCart} />
                    ))
                }
            </main>

            {/* Cart Popup */}
            {cartOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 relative">

                        {/* Close Button */}
                        <button
                            onClick={() => setCartOpen(false)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-red-500"
                        >
                            ✕
                        </button>

                        {/* Cart Header */}
                        <h2 className="text-2xl font-bold mb-5 flex items-center gap-2">
                            <ShoppingCart size={24} /> Your Cart
                        </h2>

                        {/* Cart Items */}
                        <div className="flex flex-col gap-4 max-h-80 overflow-y-auto pr-2">
                            {saleItems.length > 0 ? saleItems.map(si => (
                                <div key={si.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm hover:shadow-md transition">

                                    {/* Item Info */}
                                    <div className="flex flex-col">
                                        <p className="font-semibold">{si.name}</p>
                                        <p className="text-sm text-gray-500">{si.price} SAR × {si.quantity}</p>
                                    </div>

                                    {/* Quantity Controls */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => updateQuantity(si.id, si.quantity - 1)}
                                            className="p-1 bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                                        >−</button>

                                        <span className="w-6 text-center">{si.quantity}</span>

                                        <button
                                            onClick={() => updateQuantity(si.id, si.quantity + 1)}
                                            className="p-1 bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                                        >+</button>

                                        <button
                                            onClick={() => removeFromCart(si.id)}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-gray-500 text-center py-10">Your cart is empty</p>
                            )}
                        </div>

                        {/* Outlet Selector if not selected */}
                        {saleItems.length > 0 && !selectedOutlet && (
                            <div className="mt-4">
                                <label className="block mb-1 font-medium text-gray-600 dark:text-gray-300">Select Outlet</label>
                                <select
                                    value={selectedOutlet}
                                    onChange={e => setSelectedOutlet(e.target.value)}
                                    className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select Outlet</option>
                                    {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                                </select>
                            </div>
                        )}

                        {/* Cart Footer */}
                        {saleItems.length > 0 && (
                            <div className="mt-5 border-t pt-4 space-y-2">
                                <p className="flex justify-between font-medium">
                                    Subtotal: <span>{total.toFixed(2)} SAR</span>
                                </p>
                                <p className="flex justify-between font-medium">
                                    Tax: <span>{totalTax.toFixed(2)} SAR</span>
                                </p>
                                <p className="flex justify-between font-bold text-lg">
                                    Total (incl. Tax): <span>{(total + totalTax).toFixed(2)} SAR</span>
                                </p>
                                <button
                                    onClick={submitSale}
                                    disabled={!canCreate || saleItems.length === 0 || !selectedOutlet || loading}
                                    className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg disabled:opacity-50 transition"
                                >
                                    {loading ? "Processing..." : "Checkout ✅"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
}

function ProductCard({ item, addToCart }) {
    const [qty, setQty] = useState(1);

    return (
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-4 flex flex-col justify-between hover:shadow-2xl transition transform hover:-translate-y-1">

            {/* Image */}
            <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4 flex items-center justify-center text-gray-500">
                Image
            </div>

            {/* Name & Price */}
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-lg">{item.name}</h3>
                <p className="font-semibold text-blue-600">{item.price} SAR</p>
            </div>

            {/* Rating & Favorite */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1">
                    {[...Array(item.rating || 5)].map((_, i) => (
                        <Star key={i} size={16} className="text-yellow-400" />
                    ))}
                </div>
                <button className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                    <Heart size={18} className="text-red-500" />
                </button>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-500 mb-3">{item.description || "No description"}</p>

            {/* Quantity & Add to Cart */}
            <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center gap-2">
                    <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">-</button>
                    <span className="w-5 text-center">{qty}</span>
                    <button onClick={() => setQty(qty + 1)} className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">+</button>
                </div>
                <button
                    onClick={() => addToCart(item, qty)}
                    className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
                >
                    <ShoppingCart size={16} /> Add to Cart
                </button>
            </div>
        </div>
    );
}

