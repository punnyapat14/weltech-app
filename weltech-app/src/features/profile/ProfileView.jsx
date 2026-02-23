import React, { useState, useEffect } from 'react';
import { 
    User, Camera, Save, Edit2, UserCheck, MapPin, Activity, 
    AlertTriangle, Briefcase, Clock 
} from 'lucide-react';
import { InputField, CustomCombobox } from '../../components/UIComponents';
import { formatThaiDateFull, calculateAge, FALLBACK_PROVINCES } from '../../utils/helpers';
import PatientHistory from '../history/PatientHistory';

const ProfileView = ({ data, isDoctorView = false, onSaveHealthData, addressDB = [], theme, treatmentHistory = [], hideAddress = false }) => {
    if (!data) return null;
    const profile = data;
    const [isEditing, setIsEditing] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [imgError, setImgError] = useState(false);

    // --- ส่วนเสริมสำหรับการจัดการเวลาออกตรวจ (Schedule Selector) ---
    const DAYS = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];
    const TIME_SLOTS = [
        { label: '08:00 - 09:00', value: '08:00-09:00' }, { label: '09:00 - 10:00', value: '09:00-10:00' },
        { label: '10:00 - 11:00', value: '10:00-11:00' }, { label: '11:00 - 12:00', value: '11:00-12:00' },
        { label: '12:00 - 13:00', value: '12:00-13:00' }, { label: '13:00 - 14:00', value: '13:00-14:00' },
        { label: '14:00 - 15:00', value: '14:00-15:00' }, { label: '15:00 - 16:00', value: '15:00-16:00' },
        { label: '16:00 - 17:00', value: '16:00-17:00' }, { label: '17:00 - 18:00', value: '17:00-18:00' },
        { label: '18:00 - 19:00', value: '18:00-19:00' }, { label: '19:00 - 20:00', value: '19:00-20:00' },
    ];

    const sanitizeData = (obj) => {
        const sanitized = { ...obj };
        const requiredFields = [
            'emergency_contact_name', 
            'emergency_contact_phone', 
            'emergency_relationship',
            'contact_email',
            'work_schedule'
        ];
        
        requiredFields.forEach(field => {
            if (sanitized[field] === null || sanitized[field] === undefined) {
                sanitized[field] = '';
            }
        });

        Object.keys(sanitized).forEach(key => {
            if (sanitized[key] === null || sanitized[key] === undefined) {
                sanitized[key] = '';
            }
        });
        return sanitized;
    };

    const [editData, setEditData] = useState(sanitizeData(profile));

    const [provOpts, setProvOpts] = useState([]);
    const [distOpts, setDistOpts] = useState([]);
    const [subDistOpts, setSubDistOpts] = useState([]);

    useEffect(() => {
        if (data) {
            setEditData(sanitizeData(data));
        }
    }, [data]);

    const toggleScheduleSlot = (day, slotValue) => {
        let currentSchedule = editData.work_schedule || "";
        const slotText = `${day}(${slotValue})`;
        
        if (currentSchedule.includes(slotText)) {
            currentSchedule = currentSchedule.replace(slotText, "").replace(/,\s*,/g, ",").replace(/^,|,$/g, "").trim();
        } else {
            currentSchedule = currentSchedule ? `${currentSchedule}, ${slotText}` : slotText;
        }
        
        setEditData(prev => ({ ...prev, work_schedule: currentSchedule }));
    };

    useEffect(() => {
        if (addressDB && addressDB.length > 0) setProvOpts([...new Set(addressDB.map(x => x.province))].sort());
        else setProvOpts(FALLBACK_PROVINCES);
    }, [addressDB]);

    useEffect(() => {
        if(editData.province && addressDB && addressDB.length > 0) { 
            const relevant = addressDB.filter(x => x.province === editData.province); 
            setDistOpts([...new Set(relevant.map(x => x.amphoe))].sort()); 
        } 
    }, [editData.province, addressDB]);

    useEffect(() => { 
        if(editData.district && addressDB && addressDB.length > 0) { 
            const relevant = addressDB.filter(x => x.province === editData.province && x.amphoe === editData.district); 
            setSubDistOpts([...new Set(relevant.map(x => x.district))].sort()); 
        } 
    }, [editData.district, addressDB, editData.province]);

    useEffect(() => { 
        if(editData.sub_district && addressDB && addressDB.length > 0) { 
            const found = addressDB.find(x => x.province === editData.province && x.amphoe === editData.district && x.district === editData.sub_district); 
            if(found) setEditData(prev => ({...prev, zip_code: found.zipcode})); 
        } 
    }, [editData.sub_district, addressDB, editData.province, editData.district]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setPreviewImage(URL.createObjectURL(file));
            setImgError(false); 
        }
    };

    const handleSave = async () => {
        setSaveLoading(true);
        const allowedFields = [
            'title_th', 'first_name_th', 'last_name_th', 'title_en', 'first_name_en', 'last_name_en',
            'dob', 'nationality', 'religion', 'phone', 
            'contact_email', 
            'house_no', 'village', 'building', 'room_no', 'floor', 'moo', 'soi', 'road',
            'sub_district', 'district', 'province', 'zip_code',
            'weight', 'height', 'blood_group', 'disease', 'allergy', 'food_allergies',
            'current_medication', 'surgical_history', 'emergency_contact_name', 
            'emergency_contact_phone', 'emergency_relationship',
            'license_id', 'education', 'department', 'specialization', 'work_schedule'
        ];

        const cleanedData = {};
        allowedFields.forEach(field => {
            const val = editData[field];
            if (val !== undefined) {
                if (typeof val === 'string' && val.trim() === '') {
                    cleanedData[field] = null;
                } else {
                    cleanedData[field] = val;
                }
            }
        });

        try {
            const userId = profile.user_id || profile.id;
            if (!userId) throw new Error("Missing User ID");

            await onSaveHealthData(userId, cleanedData, imageFile);
            setIsEditing(false);
            setImageFile(null);
            setPreviewImage(null);
        } catch (error) {
            console.error("Save failed:", error);
            alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล: " + (error.message || "กรุณาตรวจสอบการเชื่อมต่อ"));
        } finally {
            setSaveLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (['weight', 'height'].includes(name)) {
            setEditData(prev => ({ ...prev, [name]: value === '' ? null : parseFloat(value) }));
        } else {
            setEditData(prev => ({ ...prev, [name]: value }));
        }
    };

    const canEditGeneral = !isDoctorView; 
    const canEditHealth = isDoctorView; 
    const showImage = (previewImage || profile.avatar_url) && !imgError;

    const renderScheduleTable = (isEditable) => (
        <div className="bg-white/10 p-4 rounded-xl border border-white/20">
            <label className="block text-sm font-bold mb-4 flex items-center gap-2 text-white">
                <Clock size={16}/> {isEditable ? 'จัดการเวลาออกตรวจ' : 'ตารางเวลาออกตรวจ'}
            </label>

            {/* --- Mobile View: กางออกเป็นรายการรายวัน (แสดงเฉพาะหน้าจอมือถือ) --- */}
            <div className="md:hidden space-y-3">
                {DAYS.map(day => {
                    const daySlots = TIME_SLOTS.filter(ts => 
                        (editData.work_schedule || "").includes(`${day}(${ts.value})`)
                    );
                    if (!isEditable && daySlots.length === 0) return null;

                    return (
                        <div key={day} className="bg-white/5 rounded-lg p-3 border border-white/10">
                            <div className="text-xs font-bold text-blue-200 mb-2 border-b border-white/10 pb-1">วัน{day}</div>
                            <div className="grid grid-cols-2 gap-2">
                                {isEditable ? (
                                    TIME_SLOTS.map(ts => {
                                        const slotId = `${day}(${ts.value})`;
                                        const isActive = (editData.work_schedule || "").includes(slotId);
                                        return (
                                            <button
                                                key={ts.value}
                                                type="button"
                                                onClick={() => toggleScheduleSlot(day, ts.value)}
                                                className={`text-[10px] p-2 rounded-md transition-all border ${
                                                    isActive 
                                                    ? 'bg-white text-blue-600 font-bold border-white' 
                                                    : 'bg-transparent text-white/60 border-white/20'
                                                }`}
                                            >
                                                {ts.value} {isActive && '✓'}
                                            </button>
                                        );
                                    })
                                ) : (
                                    daySlots.map(ts => (
                                        <div key={ts.value} className="text-[11px] bg-white/20 text-white p-1.5 rounded-md text-center">
                                            {ts.value}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* --- Desktop View: ตารางแบบดั้งเดิม (แสดงตั้งแต่จอขนาดกลางขึ้นไป) --- */}
            <div className="hidden md:block overflow-hidden rounded-lg border border-white/10">
                <div className="overflow-x-auto custom-scroll">
                    <table className="w-full text-xs text-center border-collapse">
                        <thead>
                            <tr className="bg-black/20">
                                <th className="p-3 text-left text-white sticky left-0 bg-[#5677fc] z-10 shadow-[2px_0_5px_rgba(0,0,0,0.1)]">วัน / เวลา</th>
                                {TIME_SLOTS.map(ts => (
                                    <th key={ts.value} className="p-3 font-bold whitespace-nowrap text-white border-l border-white/5">{ts.value}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {DAYS.map(day => (
                                <tr key={day} className="border-t border-white/10 hover:bg-white/5 transition-colors">
                                    <td className="p-3 text-left font-bold text-white sticky left-0 bg-[#5677fc] z-10 shadow-[2px_0_5px_rgba(0,0,0,0.1)]">{day}</td>
                                    {TIME_SLOTS.map(ts => {
                                        const slotId = `${day}(${ts.value})`;
                                        const isActive = (editData.work_schedule || "").includes(slotId);
                                        return (
                                            <td key={ts.value} className="p-1 border-l border-white/5">
                                                {isEditable ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleScheduleSlot(day, ts.value)}
                                                        className={`w-full h-9 rounded-md transition-all flex items-center justify-center border ${
                                                            isActive 
                                                            ? 'bg-white text-blue-600 shadow-inner' 
                                                            : 'hover:bg-white/10 text-transparent border-transparent hover:border-white/20'
                                                        }`}
                                                    >
                                                        {isActive ? <span className="font-bold">✓</span> : ''}
                                                    </button>
                                                ) : (
                                                    <div className={`w-full h-9 flex items-center justify-center rounded-md ${isActive ? 'bg-white/20 text-white font-bold' : 'opacity-10'}`}>
                                                        {isActive ? '✓' : '-'}
                                                    </div>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {isEditable && (
                <div className="mt-3 text-[10px] opacity-70 italic border-t border-white/10 pt-2 text-white flex items-center gap-1">
                    <AlertTriangle size={12}/> * คลิกที่ช่องเพื่อจัดการเวลาออกตรวจ ข้อมูลจะถูกสรุปเป็นข้อความโดยอัตโนมัติ
                </div>
            )}
        </div>
    );

    return (
    <div className="flex flex-col gap-8 h-full animate-fade-in overflow-y-auto custom-scroll pr-2">
        <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="relative group shrink-0">
                <div className={`w-32 h-32 rounded-full border-4 shadow-lg overflow-hidden flex items-center justify-center ${theme === 'dark' ? 'bg-slate-700 border-slate-600' : 'bg-white border-white'}`}>
                    {showImage ? (
                        <img src={previewImage || profile.avatar_url} className="w-full h-full object-cover" onError={() => setImgError(true)} alt="Profile" />
                    ) : (
                        <div className={`w-full h-full flex items-center justify-center ${theme === 'dark' ? 'bg-slate-800 text-gray-500' : 'bg-gray-100 text-gray-400'}`}>
                            <User size={64} />
                        </div>
                    )}
                </div>
                {isEditing && canEditGeneral && (
                    <label className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full cursor-pointer hover:bg-blue-700 shadow-md transition-all">
                        <Camera size={16} />
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    </label>
                )}
            </div>
            
            <div className="flex-1 w-full space-y-6">
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                          {isEditing ? (
                            <div className="space-y-2">
                                <div className="grid grid-cols-3 gap-2">
                                    <CustomCombobox name="title_th" value={editData.title_th ?? ''} onChange={handleChange} options={profile.role === 'doctor' 
                                        ? ['นพ.', 'พญ.', 'ดร.', 'ทนพ.', 'ทนพญ.', 'นาย', 'นาง', 'นางสาว'] 
                                        : ['นาย', 'นาง', 'นางสาว', 'ด.ช.', 'ด.ญ.']
                                    } placeholder="คำนำหน้า" theme={theme} disabled={!canEditGeneral} />
                                    <InputField name="first_name_th" value={editData.first_name_th ?? ''} onChange={handleChange} placeholder="ชื่อ (ไทย)" theme={theme} disabled={!canEditGeneral} />
                                    <InputField name="last_name_th" value={editData.last_name_th ?? ''} onChange={handleChange} placeholder="สกุล (ไทย)" theme={theme} disabled={!canEditGeneral} />
                                </div>
                            </div>
                          ) : (
                            <>
                                <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                                    {profile.title_th} {profile.first_name_th} {profile.last_name_th}
                                </h2>
                                <p className="text-gray-500">{profile.title_en} {profile.first_name_en} {profile.last_name_en}</p>
                            </>
                          )}
                        {!hideAddress && <p className="text-xs text-gray-400 mt-1">ID: {profile.id_card}</p>}
                    </div>
                    
                    {!hideAddress && (
                        <button onClick={() => isEditing ? handleSave() : setIsEditing(true)} 
                            disabled={saveLoading}
                            className={`ml-4 px-4 py-2 border rounded-xl text-sm font-bold flex items-center gap-2
                            ${isEditing ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700' : (theme === 'dark' ? 'border-slate-600 text-gray-300 hover:bg-slate-700' : 'border-gray-300 hover:bg-gray-50')}`}>
                            {isEditing ? (saveLoading ? 'กำลังบันทึก...' : <><Save size={16}/> บันทึก</>) : <><Edit2 size={16}/> แก้ไขข้อมูล</>}
                        </button>
                    )}
                </div>
                
                <div className={`p-4 rounded-xl space-y-2 border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
                    <h4 className={`font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}><UserCheck size={18}/> ข้อมูลทั่วไป</h4>
                    {isEditing ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                             <div className="space-y-1"><label className="text-xs text-gray-500">เบอร์โทรศัพท์</label><InputField name="phone" value={editData.phone ?? ''} onChange={handleChange} maxLength={10} theme={theme} disabled={!canEditGeneral} /></div>
                             <div className="space-y-1"><label className="text-xs text-gray-500">อีเมล</label><InputField name="contact_email" value={editData.contact_email ?? ''} onChange={handleChange} theme={theme} disabled={!canEditGeneral} /></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 text-sm">
                            {!hideAddress && (
                                <div>
                                    <span className="text-gray-500 w-fit inline-block mr-2">วันเกิด:</span> 
                                    <span className={`${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                                        {formatThaiDateFull(profile.dob)} (อายุ {calculateAge(profile.dob)} ปี)
                                    </span>
                                </div>
                            )}
                            <div>
                                <span className="text-gray-500 w-fit inline-block mr-2">เบอร์โทรศัพท์:</span> 
                                <span className={`${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                                    {profile.phone || '-'}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-500 w-fit inline-block mr-2">อีเมล:</span> 
                                <span className={`${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                                    {profile.contact_email || '-'}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {!hideAddress && (
                    <div className={`p-4 rounded-xl space-y-2 border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
                        <h4 className={`font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}><MapPin size={18}/> ที่อยู่ปัจจุบัน</h4>
                        {isEditing ? (
                            <div className="grid grid-cols-3 gap-2 text-sm">
                                <InputField name="house_no" value={editData.house_no ?? ''} onChange={handleChange} placeholder="บ้านเลขที่" theme={theme} disabled={!canEditGeneral} />
                                <InputField name="moo" value={editData.moo ?? ''} onChange={handleChange} placeholder="หมู่" theme={theme} disabled={!canEditGeneral} />
                                <InputField name="soi" value={editData.soi ?? ''} onChange={handleChange} placeholder="ซอย" theme={theme} disabled={!canEditGeneral} />
                                <CustomCombobox name="province" value={editData.province ?? ''} onChange={handleChange} options={provOpts} placeholder="จังหวัด" theme={theme} disabled={!canEditGeneral} />
                            </div>
                        ) : (
                            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                {profile.house_no} {profile.moo ? ` หมู่ ${profile.moo}` : ''} {profile.village} {profile.soi ? `ซ. ${profile.soi}` : ''} {profile.road ? `ถ. ${profile.road}` : ''} {profile.sub_district} {profile.district} {profile.province} {profile.zip_code}
                            </p>
                        )}
                    </div>
                )}

                {(profile.role === 'patient' || isDoctorView) && !hideAddress && (
                    <div className={`p-4 rounded-xl space-y-2 border ${theme === 'dark' ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50/20 border-blue-100'}`}>
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="font-bold flex items-center gap-2" style={{color: 'var(--theme-primary)'}}><Activity size={18}/> ข้อมูลสุขภาพ</h4>
                            {isEditing && !canEditHealth && <span className="text-xs text-orange-500 flex items-center gap-1"><AlertTriangle size={12}/> แพทย์เท่านั้นที่แก้ไขส่วนนี้ได้</span>}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                             <div className="space-y-1"><label className="text-gray-500 text-xs">น้ำหนัก (กก.)</label>
                                {isEditing ? <input type="number" name="weight" className="w-full p-2 border rounded bg-white dark:bg-slate-800 dark:text-white" value={editData.weight ?? ''} onChange={handleChange} disabled={!canEditHealth} /> : <div className="font-medium">{profile.weight || '-'}</div>}
                             </div>
                             <div className="space-y-1"><label className="text-gray-500 text-xs">ส่วนสูง (ซม.)</label>
                                {isEditing ? <input type="number" name="height" className="w-full p-2 border rounded bg-white dark:bg-slate-800 dark:text-white" value={editData.height ?? ''} onChange={handleChange} disabled={!canEditHealth} /> : <div className="font-medium">{profile.height || '-'}</div>}
                             </div>
                             <div className="space-y-1"><label className="text-gray-500 text-xs">กรุ๊ปเลือด</label>
                                {isEditing ? <CustomCombobox name="blood_group" value={editData.blood_group ?? ''} onChange={handleChange} options={['A', 'B', 'O', 'AB']} disabled={!canEditHealth} theme={theme}/> : <div className="font-medium">{profile.blood_group || '-'}</div>}
                             </div>
                             <div className="space-y-1"><label className="text-gray-500 text-xs">โรคประจำตัว</label>
                                {isEditing ? <input type="text" name="disease" className="w-full p-2 border rounded bg-white dark:bg-slate-800 dark:text-white" value={editData.disease ?? ''} onChange={handleChange} disabled={!canEditHealth} /> : <div className="font-medium text-red-500">{profile.disease || '-'}</div>}
                             </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-3 pt-3 border-t border-blue-200/50">
                             <div className="space-y-1"><label className="text-gray-500 text-xs">แพ้ยา</label>
                                {isEditing ? <input type="text" name="allergy" className="w-full p-2 border rounded bg-white dark:bg-slate-800 dark:text-white" value={editData.allergy ?? ''} onChange={handleChange} disabled={!canEditHealth} /> : <div className="font-medium text-red-500">{profile.allergy || '-'}</div>}
                             </div>
                             <div className="space-y-1"><label className="text-gray-500 text-xs">แพ้อาหาร</label>
                                {isEditing ? <input type="text" name="food_allergies" className="w-full p-2 border rounded bg-white dark:bg-slate-800 dark:text-white" value={editData.food_allergies ?? ''} onChange={handleChange} disabled={!canEditHealth} /> : <div className="font-medium text-red-500">{profile.food_allergies || '-'}</div>}
                             </div>
                             <div className="space-y-1"><label className="text-gray-500 text-xs">ยาที่ทานปัจจุบัน</label>
                                {isEditing ? <input type="text" name="current_medication" className="w-full p-2 border rounded bg-white dark:bg-slate-800 dark:text-white" value={editData.current_medication ?? ''} onChange={handleChange} disabled={!canEditHealth} /> : <div className="font-medium">{profile.current_medication || '-'}</div>}
                             </div>
                             <div className="space-y-1"><label className="text-gray-500 text-xs">ประวัติการผ่าตัด</label>
                                {isEditing ? <input type="text" name="surgical_history" className="w-full p-2 border rounded bg-white dark:bg-slate-800 dark:text-white" value={editData.surgical_history ?? ''} onChange={handleChange} disabled={!canEditHealth} /> : <div className="font-medium">{profile.surgical_history || '-'}</div>}
                             </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-blue-200/50">
                             <label className="text-xs font-bold text-gray-500 mb-2 block">ข้อมูลผู้ติดต่อฉุกเฉิน</label>
                             {isEditing ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                                    <InputField name="emergency_contact_name" value={editData.emergency_contact_name ?? ''} onChange={handleChange} placeholder="ชื่อ-สกุล ญาติ" theme={theme} disabled={!canEditHealth}/>
                                    <InputField name="emergency_contact_phone" value={editData.emergency_contact_phone ?? ''} onChange={handleChange} placeholder="เบอร์โทร" theme={theme} disabled={!canEditHealth}/>
                                    <CustomCombobox name="emergency_relationship" value={editData.emergency_relationship ?? ''} onChange={handleChange} options={['บิดา', 'มารดา', 'บุตร', 'ผู้ปกครอง', 'พี่', 'น้อง', 'ญาติ', 'คู่สมรส', 'เพื่อน']} placeholder="ความสัมพันธ์" theme={theme} disabled={!canEditHealth}/>
                                </div>
                                 ) : (
                                <div className="text-sm">
                                    คุณ {profile.emergency_contact_name || '-'} ({profile.emergency_relationship || '-'}) โทร: {profile.emergency_contact_phone || '-'}
                                </div>
                            )}
                        </div>
                    </div>
                )}
                
                {(profile.role === 'doctor' && !isDoctorView) && (
                    <div className="p-4 rounded-xl space-y-4 border shadow-md" style={{ backgroundColor: '#5677fc', color: 'white', borderColor: '#4a6cf0' }}>
                        <h4 className="font-bold flex items-center gap-2"><Briefcase size={18}/> ข้อมูลแพทย์</h4>
                        {isEditing ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3 text-sm text-gray-800">
                                    <InputField name="license_id" value={editData.license_id ?? ''} onChange={handleChange} placeholder="เลขใบประกอบฯ" theme="light" />
                                    <InputField name="department" value={editData.department ?? ''} onChange={handleChange} placeholder="แผนก" theme="light" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-800">
                                    <InputField name="specialization" value={editData.specialization ?? ''} onChange={handleChange} placeholder="ความเชี่ยวชาญ" theme="light" />
                                    <InputField name="education" value={editData.education ?? ''} onChange={handleChange} placeholder="ประวัติการศึกษา" theme="light" />
                                </div>
                                {renderScheduleTable(true)}
                            </div>
                        ) : (
                            <div className="text-sm space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    <div><span className="opacity-70">เลขใบประกอบฯ:</span> {profile.license_id || '-'}</div>
                                    <div><span className="opacity-70">แผนก:</span> {profile.department || '-'}</div>
                                    <div><span className="opacity-70">ความเชี่ยวชาญ:</span> {profile.specialization || '-'}</div>
                                    <div><span className="opacity-70">ประวัติการศึกษา:</span> {profile.education || '-'}</div>
                                </div>
                                <div className="mt-2 pt-2 border-t border-white/20">
                                    {renderScheduleTable(false)}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
        {isDoctorView && !hideAddress && (
            <div className="mt-4 pt-6 border-t border-dashed border-gray-200">
                < PatientHistory patientName={`${profile.title_th} ${profile.first_name_th} ${profile.last_name_th}`} treatmentHistory={treatmentHistory} theme={theme} />
            </div>
        )}
    </div>
    );
};

export default ProfileView;