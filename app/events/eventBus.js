// app/events/eventBus.js

export const EVENTS = {
    BOOKING: {
        CREATED: "BOOKING_CREATED",
        UPDATED: "BOOKING_UPDATED",
        STATUS_CHANGED: "BOOKING_STATUS_CHANGED",
        ENDED: "ROOM_BOOKING_ENDED",
    },
    FOLIO: {
        CHARGE_ADDED: "CHARGE_ADDED",
        CHARGE_DELETED: "CHARGE_DELETED",
        PAYMENT_ADDED: "PAYMENT_ADDED",
        PAYMENT_DELETED: "PAYMENT_DELETED",
        CLOSED: "FOLIO_CLOSED",
    },
    ROOM: {
        CREATED: "ROOM_CREATED",
        UPDATED: "ROOM_UPDATED",
        DELETED: "ROOM_DELETED",
        STATUS_CHANGED: "ROOM_STATUS_CHANGED",
        RATE_CHANGED: "RATE_CHANGED",
    },
    INVENTORY: {
        UPDATED: "INVENTORY_UPDATED",
        AVAILABILITY_CHECKED: "ROOM_AVAILABILITY_CHECKED",
    },
    GUEST: {
        CREATED: "GUEST_CREATED",
        UPDATED: "GUEST_UPDATED",
    },
    HOUSEKEEPING: {
        UPDATED: "HOUSEKEEPING_UPDATED",
    },
    RATE_PLAN: {
        CREATED: "RATE_PLAN_CREATED",
        UPDATED: "RATE_PLAN_UPDATED",
        DELETED: "RATE_PLAN_DELETED",
    },
    RATE_RULE: {
        CREATED: "RATE_RULE_CREATED",
        UPDATED: "RATE_RULE_UPDATED",
        DELETED: "RATE_RULE_DELETED",
    },
    PROPERTY: {
        CREATED: "PROPERTY_CREATED",
    },
    USER: {
        UPDATED: "USERS_UPDATED",
        SINGLE_UPDATED: "USER_UPDATED",
    },
    EXTRA: {
        UPDATED: "EXTRA_UPDATED",
    },
    NIGHT_AUDIT: {
        ROOM_CHARGE_POSTED: "ROOM_CHARGE_POSTED",
        COMPLETED: "NIGHT_AUDIT_COMPLETED",
        ADMIN_ROOM_CHARGE_POSTED: "ADMIN_ROOM_CHARGE_POSTED",
        ADMIN_AUDIT_STEP_COMPLETED: "ADMIN_AUDIT_STEP_COMPLETED",
    }
};

// دالة بث موحدة
export const BROADCAST_URL = "http://localhost:3001/api/broadcast";

export async function broadcast(event, data) {
    try {
        await fetch(BROADCAST_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ event, data }),
        });
    } catch (err) {
        console.error(`Broadcast failed: ${event}`, err);
    }
}
