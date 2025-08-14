'use client';
import GuestForm from '../../components/GuestForm';

export default function NewGuestPage() {
    return (
        <div className="p-4">
            <GuestForm mode="add" />
        </div>
    );
}

