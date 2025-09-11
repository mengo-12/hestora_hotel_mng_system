// app/contexts/AppDataContext.js
'use client';
import { createContext, useContext, useReducer, useEffect } from "react";
import { useSocket } from "@/app/components/SocketProvider";

const AppDataContext = createContext();

const initialState = {
    bookings: [],
    folios: [],
    rooms: [],
    inventory: [],
    housekeepingTasks: [],
    guests: [],
    ratePlans: [],
    users: [],
    property: null,
    extras: [],
    payments: [],
    reports: [],
    financialTransactions: [], // ✅ إضافة
};

function reducer(state, action) {
    switch (action.type) {
        // 🔹 BOOKINGS
        case "SET_BOOKINGS": return { ...state, bookings: action.payload };
        case "ADD_BOOKING": return { ...state, bookings: [...state.bookings, action.payload] };
        case "UPDATE_BOOKING": return {
            ...state,
            bookings: state.bookings.map(b => b.id === action.payload.id ? action.payload : b)
        };
        case "DELETE_BOOKING": return { ...state, bookings: state.bookings.filter(b => b.id !== action.payload) };

        // 🔹 FOLIOS
        case "SET_FOLIOS": return { ...state, folios: action.payload };
        case "UPDATE_FOLIO": return {
            ...state,
            folios: state.folios.map(f => f.id === action.payload.id ? action.payload : f)
        };

        // 🔹 ROOMS
        case "SET_ROOMS": return { ...state, rooms: action.payload };
        case "ADD_ROOM": return { ...state, rooms: [...state.rooms, action.payload] };
        case "UPDATE_ROOM": return {
            ...state,
            rooms: state.rooms.map(r => r.id === action.payload.id ? action.payload : r)
        };
        case "DELETE_ROOM": return { ...state, rooms: state.rooms.filter(r => r.id !== action.payload) };

        // 🔹 INVENTORY
        case "SET_INVENTORY": return { ...state, inventory: action.payload };
        case "UPDATE_INVENTORY": return {
            ...state,
            inventory: state.inventory.map(i => i.id === action.payload.id ? action.payload : i)
        };

        // 🔹 HOUSEKEEPING TASKS
        case "SET_HK_TASKS": return { ...state, housekeepingTasks: action.payload };
        case "ADD_HK_TASK": return { ...state, housekeepingTasks: [...state.housekeepingTasks, action.payload] };
        case "UPDATE_HK_TASK": return {
            ...state,
            housekeepingTasks: state.housekeepingTasks.map(t => t.id === action.payload.id ? action.payload : t)
        };
        case "DELETE_HK_TASK": return { ...state, housekeepingTasks: state.housekeepingTasks.filter(t => t.id !== action.payload) };

        // 🔹 GUESTS
        case "SET_GUESTS": return { ...state, guests: action.payload };
        case "ADD_GUEST": return { ...state, guests: [...state.guests, action.payload] };
        case "UPDATE_GUEST": return {
            ...state,
            guests: state.guests.map(g => g.id === action.payload.id ? action.payload : g)
        };
        case "DELETE_GUEST": return { ...state, guests: state.guests.filter(g => g.id !== action.payload) };

        // 🔹 RATE PLANS
        case "SET_RATEPLANS": return { ...state, ratePlans: action.payload };
        case "ADD_RATEPLAN": return { ...state, ratePlans: [...state.ratePlans, action.payload] };
        case "UPDATE_RATEPLAN": return {
            ...state,
            ratePlans: state.ratePlans.map(rp => rp.id === action.payload.id ? action.payload : rp)
        };
        case "DELETE_RATEPLAN": return { ...state, ratePlans: state.ratePlans.filter(rp => rp.id !== action.payload) };

        // 🔹 USERS
        case "SET_USERS": return { ...state, users: action.payload };
        case "ADD_USER": return { ...state, users: [...state.users, action.payload] };
        case "UPDATE_USER": return {
            ...state,
            users: state.users.map(u => u.id === action.payload.id ? action.payload : u)
        };
        case "DELETE_USER": return { ...state, users: state.users.filter(u => u.id !== action.payload) };

        // 🔹 PROPERTY
        case "SET_PROPERTY": return { ...state, property: action.payload };

        // 🔹 EXTRAS
        case "SET_EXTRAS": return { ...state, extras: action.payload };
        case "ADD_EXTRA": return { ...state, extras: [...state.extras, action.payload] };
        case "UPDATE_EXTRA": return {
            ...state,
            extras: state.extras.map(e => e.id === action.payload.id ? action.payload : e)
        };
        case "DELETE_EXTRA": return { ...state, extras: state.extras.filter(e => e.id !== action.payload) };

        // 🔹 PAYMENTS
        case "SET_PAYMENTS": return { ...state, payments: action.payload };
        case "ADD_PAYMENT": return { ...state, payments: [...state.payments, action.payload] };
        case "UPDATE_PAYMENT": return {
            ...state,
            payments: state.payments.map(p => p.id === action.payload.id ? action.payload : p)
        };
        case "DELETE_PAYMENT": return { ...state, payments: state.payments.filter(p => p.id !== action.payload) };

        // 🔹 REPORTS
        case "SET_REPORTS": return { ...state, reports: action.payload };

        // 🔹 FINANCIAL TRANSACTIONS
        case "SET_FINANCIAL_TRANSACTIONS":
            return { ...state, financialTransactions: action.payload };
        case "ADD_FINANCIAL_TRANSACTION":
            return { ...state, financialTransactions: [...state.financialTransactions, action.payload] };
        case "UPDATE_FINANCIAL_TRANSACTION":
            return {
                ...state,
                financialTransactions: state.financialTransactions.map(t =>
                    t.id === action.payload.id ? action.payload : t
                )
            };
        case "DELETE_FINANCIAL_TRANSACTION":
            return { ...state, financialTransactions: state.financialTransactions.filter(t => t.id !== action.payload) };

        default: return state;
    }
}

export function AppDataProvider({ children }) {
    const [state, dispatch] = useReducer(reducer, initialState);
    const socket = useSocket();

    useEffect(() => {
        if (!socket) return;

        // BOOKINGS
        socket.on("BOOKING_CREATED", (data) => dispatch({ type: "ADD_BOOKING", payload: data }));
        socket.on("BOOKING_UPDATED", (data) => dispatch({ type: "UPDATE_BOOKING", payload: data }));
        socket.on("BOOKING_DELETED", (id) => dispatch({ type: "DELETE_BOOKING", payload: id }));

        // FOLIOS
        socket.on("FOLIO_UPDATED", (data) => dispatch({ type: "UPDATE_FOLIO", payload: data }));

        // ROOMS
        socket.on("ROOM_CREATED", (data) => dispatch({ type: "ADD_ROOM", payload: data }));
        socket.on("ROOM_UPDATED", (data) => dispatch({ type: "UPDATE_ROOM", payload: data }));
        socket.on("ROOM_DELETED", (id) => dispatch({ type: "DELETE_ROOM", payload: id }));

        // INVENTORY
        socket.on("INVENTORY_UPDATED", (data) => dispatch({ type: "UPDATE_INVENTORY", payload: data }));

        // HOUSEKEEPING TASKS
        socket.on("HK_TASK_CREATED", (data) => dispatch({ type: "ADD_HK_TASK", payload: data }));
        socket.on("HK_TASK_UPDATED", (data) => dispatch({ type: "UPDATE_HK_TASK", payload: data }));
        socket.on("HK_TASK_DELETED", (id) => dispatch({ type: "DELETE_HK_TASK", payload: id }));

        // GUESTS
        socket.on("GUEST_CREATED", (data) => dispatch({ type: "ADD_GUEST", payload: data }));
        socket.on("GUEST_UPDATED", (data) => dispatch({ type: "UPDATE_GUEST", payload: data }));
        socket.on("GUEST_DELETED", (id) => dispatch({ type: "DELETE_GUEST", payload: id }));

        // RATE PLANS
        socket.on("RATEPLAN_CREATED", (data) => dispatch({ type: "ADD_RATEPLAN", payload: data }));
        socket.on("RATEPLAN_UPDATED", (data) => dispatch({ type: "UPDATE_RATEPLAN", payload: data }));
        socket.on("RATEPLAN_DELETED", (id) => dispatch({ type: "DELETE_RATEPLAN", payload: id }));

        // USERS
        socket.on("USER_CREATED", (data) => dispatch({ type: "ADD_USER", payload: data }));
        socket.on("USER_UPDATED", (data) => dispatch({ type: "UPDATE_USER", payload: data }));
        socket.on("USER_DELETED", (id) => dispatch({ type: "DELETE_USER", payload: id }));

        // PROPERTY
        socket.on("PROPERTY_UPDATED", (data) => dispatch({ type: "SET_PROPERTY", payload: data }));

        // EXTRAS
        socket.on("EXTRA_CREATED", (data) => dispatch({ type: "ADD_EXTRA", payload: data }));
        socket.on("EXTRA_UPDATED", (data) => dispatch({ type: "UPDATE_EXTRA", payload: data }));
        socket.on("EXTRA_DELETED", (id) => dispatch({ type: "DELETE_EXTRA", payload: id }));

        // PAYMENTS
        socket.on("PAYMENT_CREATED", (data) => dispatch({ type: "ADD_PAYMENT", payload: data }));
        socket.on("PAYMENT_UPDATED", (data) => dispatch({ type: "UPDATE_PAYMENT", payload: data }));
        socket.on("PAYMENT_DELETED", (id) => dispatch({ type: "DELETE_PAYMENT", payload: id }));

        // REPORTS
        socket.on("REPORTS_UPDATED", (data) => dispatch({ type: "SET_REPORTS", payload: data }));

        // FINANCIAL TRANSACTIONS
        socket.on("CHARGE_ADDED", data => dispatch({ type: "ADD_FINANCIAL_TRANSACTION", payload: data }));
        socket.on("PAYMENT_ADDED", data => dispatch({ type: "ADD_FINANCIAL_TRANSACTION", payload: data }));
        socket.on("CHARGE_DELETED", id => dispatch({ type: "DELETE_FINANCIAL_TRANSACTION", payload: id }));
        socket.on("PAYMENT_DELETED", id => dispatch({ type: "DELETE_FINANCIAL_TRANSACTION", payload: id }));
        socket.on("FOLIO_CLOSED", data => dispatch({ type: "UPDATE_FINANCIAL_TRANSACTION", payload: data }));

        return () => {
            socket.off("BOOKING_CREATED");
            socket.off("BOOKING_UPDATED");
            socket.off("BOOKING_DELETED");
            socket.off("FOLIO_UPDATED");
            socket.off("ROOM_CREATED");
            socket.off("ROOM_UPDATED");
            socket.off("ROOM_DELETED");
            socket.off("INVENTORY_UPDATED");
            socket.off("HK_TASK_CREATED");
            socket.off("HK_TASK_UPDATED");
            socket.off("HK_TASK_DELETED");
            socket.off("GUEST_CREATED");
            socket.off("GUEST_UPDATED");
            socket.off("GUEST_DELETED");
            socket.off("RATEPLAN_CREATED");
            socket.off("RATEPLAN_UPDATED");
            socket.off("RATEPLAN_DELETED");
            socket.off("USER_CREATED");
            socket.off("USER_UPDATED");
            socket.off("USER_DELETED");
            socket.off("PROPERTY_UPDATED");
            socket.off("EXTRA_CREATED");
            socket.off("EXTRA_UPDATED");
            socket.off("EXTRA_DELETED");
            socket.off("PAYMENT_CREATED");
            socket.off("PAYMENT_UPDATED");
            socket.off("PAYMENT_DELETED");
            socket.off("REPORTS_UPDATED");
            socket.off("CHARGE_ADDED");
            socket.off("PAYMENT_ADDED");
            socket.off("CHARGE_DELETED");
            socket.off("PAYMENT_DELETED");
            socket.off("FOLIO_CLOSED");

        };
    }, [socket]);

    return (
        <AppDataContext.Provider value={{ state, dispatch }}>
            {children}
        </AppDataContext.Provider>
    );
}

export function useAppData() {
    return useContext(AppDataContext);
}
