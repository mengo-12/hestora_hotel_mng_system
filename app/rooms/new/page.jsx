'use client';
import RoomForm from '../../components/RoomForm';

export default function NewRoomPage() {
    return (
        <div className="max-w-md mx-auto mt-10">
            <h1 className="text-2xl font-bold mb-6 text-center">إضافة غرفة جديدة</h1>
            <RoomForm onSuccess={() => window.location.replace('/rooms')} />
        </div>
    );
}