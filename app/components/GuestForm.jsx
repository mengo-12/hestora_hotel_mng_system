'use client';

import { useState, useEffect } from 'react';

export default function GuestForm({ mode = 'add', guestData = {}, onSuccess }) {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        gender: '',
        dateOfBirth: '',
        nationality: '',
        maritalStatus: '',
        phone: '',
        email: '',
        address: '',
        passportNumber: '',
        passportIssue: '',
        passportExpiry: '',
        passportPlace: '',
        nationalId: '',
        notes: '',
        preferences: '',
        checkIn: '',
        checkOut: '',
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const nationalities = [
        '', 'أفغانستان', 'ألبانيا', 'الجزائر', 'أندورا', 'أنغولا', 'أنتيغوا وبربودا', 'الأرجنتين', 'أرمينيا', 'أستراليا', 'النمسا',
        'أذربيجان', 'البهاما', 'البحرين', 'بنغلاديش', 'باربادوس', 'بيلاروس', 'بلجيكا', 'بليز', 'بنين', 'بوتان', 'بوليفيا', 'البوسنة والهرسك',
        'بوتسوانا', 'البرازيل', 'بروناي', 'بلغاريا', 'بوركينا فاسو', 'بوروندي', 'كابو فيردي', 'كمبوديا', 'الكاميرون', 'كندا', 'جمهورية أفريقيا الوسطى',
        'تشاد', 'تشيلي', 'الصين', 'كولومبيا', 'جزر القمر', 'الكونغو', 'جمهورية الكونغو الديمقراطية', 'كوستاريكا', 'كوت ديفوار', 'كرواتيا', 'كوبا',
        'قبرص', 'التشيك', 'الدنمارك', 'جيبوتي', 'دومينيكا', 'جمهورية الدومينيكان', 'تيمور الشرقية', 'الإكوادور', 'مصر', 'السلفادور', 'غينيا الاستوائية',
        'إريتريا', 'إستونيا', 'إسواتيني', 'إثيوبيا', 'فيجي', 'فنلندا', 'فرنسا', 'الغابون', 'غامبيا', 'جورجيا', 'ألمانيا', 'غانا', 'اليونان', 'غرينادا',
        'غواتيمالا', 'غينيا', 'غينيا بيساو', 'غيانا', 'هايتي', 'هندوراس', 'المجر', 'أيسلندا', 'الهند', 'إندونيسيا', 'إيران', 'العراق', 'أيرلندا', 
        'إسرائيل', 'إيطاليا', 'جامايكا', 'اليابان', 'الأردن', 'كازاخستان', 'كينيا', 'كيريباتي', 'الكويت', 'قيرغيزستان', 'لاوس', 'لاتفيا', 'لبنان',
        'ليسوتو', 'ليبيريا', 'ليبيا', 'ليختنشتاين', 'ليتوانيا', 'لوكسمبورغ', 'مدغشقر', 'مالاوي', 'ماليزيا', 'المالديف', 'مالي', 'مالطا', 'جزر مارشال',
        'موريتانيا', 'موريشيوس', 'المكسيك', 'مايكروونيزيا', 'مولدوفا', 'موناكو', 'منغوليا', 'مونتينيغرو', 'المغرب', 'موزمبيق', 'ميانمار', 'ناميبيا',
        'ناورو', 'نيبال', 'هولندا', 'نيوزيلندا', 'نيكاراغوا', 'النيجر', 'نيجيريا', 'كوريا الشمالية', 'النرويج', 'عمان', 'باكستان', 'بالاو', 'فلسطين',
        'بنما', 'بابوا غينيا الجديدة', 'باراغواي', 'بيرو', 'الفلبين', 'بولندا', 'البرتغال', 'قطر', 'رومانيا', 'روسيا', 'رواندا', 'سانت كيتس ونيفيس',
        'سانت لوسيا', 'سانت فنسنت والغرينادين', 'ساموا', 'سان مارينو', 'ساو تومي وبرينسيبي', 'السعودية', 'السنغال', 'صربيا', 'سيشيل', 'سيراليون',
        'سنغافورة', 'سلوفاكيا', 'سلوفينيا', 'جزر سليمان', 'الصومال', 'جنوب أفريقيا', 'كوريا الجنوبية', 'جنوب السودان', 'إسبانيا', 'سريلانكا', 'السودان',
        'سورينام', 'السويد', 'سويسرا', 'سوريا', 'طاجيكستان', 'تنزانيا', 'تايلاند', 'توغو', 'تونغا', 'ترينيداد وتوباغو', 'تونس', 'تركيا', 'تركمانستان',
        'توفالو', 'أوغندا', 'أوكرانيا', 'الإمارات', 'المملكة المتحدة', 'الولايات المتحدة', 'أوروغواي', 'أوزبكستان', 'فانواتو', 'الفاتيكان', 'فنزويلا', 'فيتنام',
        'اليمن', 'زامبيا', 'زيمبابوي'
    ];

    useEffect(() => {
        if (mode === 'edit' && guestData) {
            setFormData(prev => ({
                ...prev,
                ...guestData,
                dateOfBirth: guestData.dateOfBirth?.slice(0,10) || '',
                passportIssue: guestData.passportIssue?.slice(0,10) || '',
                passportExpiry: guestData.passportExpiry?.slice(0,10) || '',
                checkIn: guestData.checkIn?.slice(0,10) || '',
                checkOut: guestData.checkOut?.slice(0,10) || ''
            }));
        }
    }, [mode, guestData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');
        setLoading(true);

        try {
            const url = mode === 'add' ? '/api/guests' : `/api/guests/${guestData.id}`;
            const method = mode === 'add' ? 'POST' : 'PUT';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'فشل العملية');

            setSuccessMsg(mode === 'add' ? 'تم إضافة النزيل بنجاح' : 'تم تحديث بيانات النزيل بنجاح');

            // إذا كان onSuccess موجود، أرسل النزيل الجديد
            if (onSuccess && mode === 'add') onSuccess(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-4 p-6 w-full max-w-3xl mx-auto rounded-lg border shadow-md 
                 bg-gray-100 dark:bg-gray-800 border-gray-400 dark:border-gray-700"
        >
            {error && <div className="p-3 border rounded text-red-900 bg-red-200 border-red-400 dark:bg-red-900 dark:text-red-200 dark:border-red-700">{error}</div>}
            {successMsg && <div className="p-3 border rounded text-green-900 bg-green-200 border-green-400 dark:bg-green-900 dark:text-green-200 dark:border-green-700">{successMsg}</div>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[ 
                    { label: 'الاسم الأول', name: 'firstName', type: 'text', required: true },
                    { label: 'اسم العائلة', name: 'lastName', type: 'text', required: true },
                    { label: 'الجنسية', name: 'nationality', type: 'select', options: nationalities, required: true },
                    { label: 'الجنس', name: 'gender', type: 'select', options: ['', 'Male', 'Female'] },
                    { label: 'تاريخ الميلاد', name: 'dateOfBirth', type: 'date' },
                    { label: 'رقم الجواز', name: 'passportNumber', type: 'text' },
                    { label: 'تاريخ إصدار الجواز', name: 'passportIssue', type: 'date' },
                    { label: 'تاريخ انتهاء الجواز', name: 'passportExpiry', type: 'date' },
                    { label: 'مكان إصدار الجواز', name: 'passportPlace', type: 'text' },
                    { label: 'رقم الهوية الوطنية', name: 'nationalId', type: 'text' },
                    { label: 'الهاتف', name: 'phone', type: 'text' },
                    { label: 'البريد الإلكتروني', name: 'email', type: 'email' },
                    { label: 'تاريخ الوصول (Check-in)', name: 'checkIn', type: 'date' },
                    { label: 'تاريخ المغادرة (Check-out)', name: 'checkOut', type: 'date' },
                ].map((field, idx) => (
                    <div key={idx}>
                        <label className="block mb-1 text-gray-800 dark:text-gray-200 font-medium">{field.label}</label>
                        {field.type === 'select' ? (
                            <select name={field.name} value={formData[field.name]} onChange={handleChange} required={field.required} 
                                className="w-full px-3 py-2 rounded border border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500">
                                {field.options.map((opt, i) => (
                                    <option key={i} value={opt}>{opt === '' ? 'اختر' : opt}</option>
                                ))}
                            </select>
                        ) : (
                            <input type={field.type} name={field.name} value={formData[field.name]} onChange={handleChange} required={field.required}
                                className="w-full px-3 py-2 rounded border border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        )}
                    </div>
                ))}

                {[{ label: 'العنوان', name: 'address' }, { label: 'ملاحظات', name: 'notes' }, { label: 'تفضيلات النزيل', name: 'preferences' }].map((field, idx) => (
                    <div className="sm:col-span-2" key={idx}>
                        <label className="block mb-1 text-gray-800 dark:text-gray-200 font-medium">{field.label}</label>
                        <textarea name={field.name} value={formData[field.name]} onChange={handleChange} rows={field.name === 'address' ? 2 : 3}
                            className="w-full px-3 py-2 rounded border border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                ))}
            </div>

            <button type="submit" disabled={loading} 
                className="w-full py-2 mt-4 rounded-md bg-blue-600 text-white font-semibold shadow-md hover:bg-blue-700 active:shadow-inner transition disabled:opacity-50">
                {loading ? (mode === 'add' ? 'جارٍ الإضافة...' : 'جارٍ التحديث...') : mode === 'add' ? 'إضافة النزيل' : 'تحديث بيانات النزيل'}
            </button>
        </form>
    );
}
