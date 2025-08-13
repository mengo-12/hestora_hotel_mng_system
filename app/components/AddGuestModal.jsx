"use client";
import { useState } from "react";
import { Dialog } from "@headlessui/react";

export default function AddGuestModal({ isOpen, onClose, onSave, onGuestAdded }) {
    const [formData, setFormData] = useState({
        firstName: "",
        middleName: "",
        lastName: "",
        familyName: "",
        birthDate: "",
        gender: "",
        guestType: "",
        nationality: "",
        idType: "",
        idNumber: "",
        phoneNumber: "",
        email: "",
        address: "",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            className="relative z-50"
        >
            {/* خلفية شفافة مع تأثير */}
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />

            {/* المحتوى */}
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="w-full max-w-5xl rounded-xl bg-white dark:bg-gray-900 shadow-lg p-6">
                    <Dialog.Title className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
                        إضافة نزيل جديد
                    </Dialog.Title>

                    <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-4">
                        {Object.entries({
                            firstName: "الاسم الأول",
                            middleName: "الاسم الأوسط",
                            lastName: "الاسم الأخير",
                            familyName: "لقب العائلة",
                            birthDate: "تاريخ الميلاد",
                            gender: "الجنس",
                            guestType: "تصنيف العميل",
                            nationality: "الجنسية",
                            idType: "نوع الهوية",
                            idNumber: "رقم الهوية",
                            phoneNumber: "رقم الجوال",
                            email: "البريد الإلكتروني",
                            address: "العنوان",
                        }).map(([key, label]) => (
                            <div key={key} className="flex flex-col">
                                <label className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {label}
                                </label>
                                <input
                                    type={key === "birthDate" ? "date" : "text"}
                                    name={key}
                                    value={formData[key]}
                                    onChange={handleChange}
                                    required
                                    className="rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        ))}

                        <div className="col-span-3 flex justify-end mt-4 space-x-2 rtl:space-x-reverse">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                            >
                                إلغاء
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                حفظ
                            </button>
                        </div>
                    </form>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
}
