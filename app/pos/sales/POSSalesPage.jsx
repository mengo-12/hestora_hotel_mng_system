'use client';
import { useState, useEffect } from "react";
import { useSocket } from "@/app/components/SocketProvider";
import { Heart, Star, ShoppingCart, Trash2, Printer, Percent } from "lucide-react";

export default function POSSalesPage({ session }) {
    const [items, setItems] = useState([]);
    const [outlets, setOutlets] = useState([]);
    const [categories, setCategories] = useState([]);
    const [folios, setFolios] = useState([]);
    const [selectedOutlet, setSelectedOutlet] = useState("");
    const [saleItems, setSaleItems] = useState([]);
    const [cartOpen, setCartOpen] = useState(false);
    const [filter, setFilter] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [selectedOutletFilter, setSelectedOutletFilter] = useState("All");
    const [selectedFolio, setSelectedFolio] = useState("");
    const [selectedProperty, setSelectedProperty] = useState("");
    const [properties, setProperties] = useState([]);


    const [discount, setDiscount] = useState(0); // الخصم
    const [paymentMethod, setPaymentMethod] = useState("Cash"); // طريقة الدفع

    const socket = useSocket();
    const role = session?.user?.role || "Guest";
    const canCreate = ["Admin", "Manager"].includes(role);


    const fetchData = async () => {
        try {
            const outletsRes = await fetch("/api/pos/outlets");
            const outletsData = await outletsRes.json();
            setOutlets(outletsData || []);

            const itemsRes = await fetch("/api/pos/items");
            setItems(await itemsRes.json() || []);


        } catch (err) {
            console.error(err);
            setItems([]);
            setFolios([]);

        }
    };


    // جلب العقارات عند تحميل الصفحة
    useEffect(() => {
        const fetchProperties = async () => {
            try {
                const res = await fetch("/api/properties"); // افترض وجود API يعيد العقارات
                const data = await res.json();
                setProperties(data || []);
                if (data?.length > 0) setSelectedProperty(data[0].id); // اختيار أول عقار تلقائياً
            } catch (err) {
                console.error("Failed to fetch properties:", err);
                setProperties([]);
            }
        };
        fetchProperties();
    }, []);


    useEffect(() => {
        if (!selectedProperty) {
            setFolios([]);
            setSelectedFolio("");
            return;
        }

        const fetchFolios = async () => {
            try {
                const res = await fetch(`/api/folios/active?propertyId=${selectedProperty}`);
                const data = await res.json();
                setFolios(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error(err);
                setFolios([]);
            }
        };

        fetchFolios();
    }, [selectedProperty]);

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

    const subtotal = saleItems.reduce((sum, si) => sum + si.price * si.quantity, 0);
    const totalTax = saleItems.reduce((sum, si) => sum + (si.price * si.quantity * (si.tax / 100)), 0);
    const discountAmount = (subtotal * discount) / 100;
    const total = subtotal + totalTax - discountAmount;

    const [loading, setLoading] = useState(false);



    const submitSale = async () => {
        if (!canCreate) return alert("You do not have permission to create sales.");
        if (!selectedOutlet || saleItems.length === 0) return alert("Please select an outlet and add items.");
        if (paymentMethod === "Room" && !selectedFolio) return alert("Please select a guest / room for Room charge.");
        if (!selectedProperty) return alert("Please select a property.");

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
                    })),
                    folioId: paymentMethod === "Room" ? selectedFolio : undefined, // استخدم undefined بدل null
                    paymentMethod,
                    discount,
                    userId: session?.user?.id
                })
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.error || "Failed to create sale");
                return;
            }

            // مسح السلة وإعادة الإعدادات
            setSaleItems([]);
            setCartOpen(false);
            setSelectedOutlet("");
            setSelectedFolio("");
            setDiscount(0);
            setPaymentMethod("Cash");

            alert(`✅ Sale completed!\nTotal: ${data.total.toFixed(2)} SAR`);
        } catch (err) {
            console.error(err);
            alert("❌ Failed to complete sale");
        } finally {
            setLoading(false);
        }
    };




    const cancelSale = () => {
        setSaleItems([]);
        setDiscount(0);
        setPaymentMethod("Cash");
        setCartOpen(false);
        alert("❌ Sale canceled");
    };

    const printReceipt = () => {
        const receipt = `
        ====== POS Receipt ======
        Outlet: ${outlets.find(o => o.id === selectedOutlet)?.name || "-"}
        --------------------------
        ${saleItems.map(si => `${si.name} x ${si.quantity} = ${(si.price * si.quantity).toFixed(2)} SAR`).join("\n")}
        --------------------------
        Subtotal: ${subtotal.toFixed(2)} SAR
        Discount: -${discountAmount.toFixed(2)} SAR
        Tax: +${totalTax.toFixed(2)} SAR
        --------------------------
        Total: ${total.toFixed(2)} SAR
        Payment: ${paymentMethod}
        ==========================
        `;

        const newWindow = window.open("", "", "width=400,height=600");
        newWindow.document.write(`<pre>${receipt}</pre>`);
        newWindow.print();
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
                        >✕</button>

                        <h2 className="text-2xl font-bold mb-5 flex items-center gap-2">
                            <ShoppingCart size={24} /> Your Cart
                        </h2>

                        {/* Cart Items */}
                        <div className="flex flex-col gap-4 max-h-80 overflow-y-auto pr-2">
                            {saleItems.length > 0 ? saleItems.map(si => (
                                <div key={si.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <div>
                                        <p className="font-semibold">{si.name}</p>
                                        <p className="text-sm text-gray-500">{si.price} SAR × {si.quantity}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => updateQuantity(si.id, si.quantity - 1)} className="px-2 bg-gray-300">−</button>
                                        <span>{si.quantity}</span>
                                        <button onClick={() => updateQuantity(si.id, si.quantity + 1)} className="px-2 bg-gray-300">+</button>
                                        <button onClick={() => removeFromCart(si.id)} className="text-red-600"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-gray-500 text-center py-10">Your cart is empty</p>
                            )}
                        </div>

                        {/* Extra Options */}
                        {saleItems.length > 0 && (
                            <div className="mt-5 border-t pt-4 space-y-3">

                                {/* // في Cart Popup: Dropdown لتغيير property */}
                                <div>
                                    <label className="block mb-1 text-gray-500 dark:text-gray-300 text-sm font-medium">Property</label>
                                    <select
                                        value={selectedProperty}
                                        onChange={e => setSelectedProperty(e.target.value)}
                                        className="w-full p-2 border rounded"
                                    >
                                        <option value="">Select Property</option>
                                        {properties.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Outlet */}
                                {!selectedOutlet && (
                                    <select value={selectedOutlet} onChange={e => setSelectedOutlet(e.target.value)}
                                        className="w-full p-2 border rounded">
                                        <option value="">Select Outlet</option>
                                        {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                                    </select>
                                )}

                                {/* Discount */}
                                <div>
                                    <label className="block mb-1">Discount (%)</label>
                                    <input type="number" min="0" max="100" value={discount}
                                        onChange={e => setDiscount(Number(e.target.value))}
                                        className="w-full p-2 border rounded" />
                                </div>

                                {/* Payment Method */}
                                <div>
                                    <label className="block mb-1">Payment Method</label>
                                    <select
                                        value={paymentMethod}
                                        onChange={e => setPaymentMethod(e.target.value)}
                                        className="w-full p-2 border rounded"
                                    >
                                        <option value="Cash">Cash</option>
                                        <option value="Card">Card</option>
                                        <option value="Room">Room (Charge to Folio)</option>
                                        <option value="Mixed">Mixed</option>
                                    </select>
                                </div>

                                {/* Select guest/room - يظهر فقط لو الدفع Room */}
                                {paymentMethod === "Room" && (
                                    <div>
                                        <label className="block mb-1">Guest / Room</label>
                                        <select
                                            value={selectedFolio}
                                            onChange={e => setSelectedFolio(e.target.value)}
                                            className="w-full p-2 border rounded"
                                        >
                                            <option value="">Select Guest / Room</option>
                                            {Array.isArray(folios) && folios.map(f => (
                                                <option key={f.id} value={f.id}>
                                                    {f.guestName} - Room {f.roomNumber}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Totals */}
                                <p>Subtotal: {subtotal.toFixed(2)} SAR</p>
                                <p>Tax: {totalTax.toFixed(2)} SAR</p>
                                <p>Discount: -{discountAmount.toFixed(2)} SAR</p>
                                <p className="font-bold text-lg">Total: {total.toFixed(2)} SAR</p>

                                {/* Buttons */}
                                <div className="flex gap-3">
                                    <button onClick={submitSale} className="flex-1 bg-green-600 text-white py-2 rounded">
                                        {loading ? "Processing..." : "Checkout ✅"}
                                    </button>
                                    <button onClick={cancelSale} className="flex-1 bg-red-600 text-white py-2 rounded">
                                        Cancel
                                    </button>
                                    <button onClick={printReceipt} className="flex-1 bg-blue-600 text-white py-2 rounded flex items-center justify-center gap-2">
                                        <Printer size={16} /> Print
                                    </button>
                                </div>
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
            {/* <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4 flex items-center justify-center text-gray-500">
                Image
            </div> */}

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

