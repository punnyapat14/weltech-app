import React, { useState, useEffect, useMemo } from 'react';
import { Search, MessageCircle, User, Stethoscope, ArrowLeft } from 'lucide-react';
import ChatWindow from './ChatWindow'; 

const ConsultSection = ({ theme, userProfile, patientsList = [], targetPatientId }) => {
    const [selectedPatientId, setSelectedPatientId] = useState(targetPatientId || null);
    const [searchTerm, setSearchTerm] = useState('');
    
    // State สำหรับเก็บจำนวนข้อความที่ยังไม่ได้อ่านแยกตามรายชื่อผู้ป่วย
    const [unreadCounts, setUnreadCounts] = useState({});

    // อัปเดตเมื่อมีการเปลี่ยนผ่าน Props จากหน้าอื่นๆ
    useEffect(() => {
        if(targetPatientId) {
            setSelectedPatientId(targetPatientId);
            // เมื่อถูกเลือกจากหน้าอื่น ให้เคลียร์แจ้งเตือนของคนนั้นด้วย
            setUnreadCounts(prev => ({...prev, [targetPatientId]: 0}));
        }
    }, [targetPatientId]);

    if (userProfile.role === 'patient') {
        return (
            <div className={`h-[calc(100vh-250px)] rounded-2xl overflow-hidden border shadow-sm ${theme === 'dark' ? 'border-slate-700' : 'border-gray-200'}`}>
                <ChatWindow 
                    roomId={userProfile.user_id}
                    userProfile={userProfile} 
                    theme={theme}
                    targetName="แพทย์ผู้เชี่ยวชาญ (WelTech Team)"
                    patientNameForBot={userProfile.first_name_th}
                />
            </div>
        );
    }

    // --- ส่วนของหมอ (Doctor View) ---

    // กรองเฉพาะผู้ป่วยที่อยู่ในความดูแล
    const myPatients = useMemo(() => {
        return patientsList.filter(p => 
            p.doctor_id && (
                String(p.doctor_id) === String(userProfile.user_id) || 
                String(p.doctor_id) === String(userProfile.id)
            )
        );
    }, [patientsList, userProfile]);

    const filteredPatients = myPatients.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (p.idCard && p.idCard.includes(searchTerm)) ||
        (p.hn && p.hn.includes(searchTerm))
    );
    
    const currentPatient = myPatients.find(p => p.user_id === selectedPatientId);
    
    // ฟังก์ชันเลือกคนไข้และเคลียร์สถานะข้อความที่ยังไม่อ่าน
    const handleSelectPatient = (pid) => {
        setSelectedPatientId(pid);
        // เมื่อคลิกอ่านแล้ว ให้ไฟแจ้งเตือนสีแดงหายไป (Reset count เป็น 0)
        setUnreadCounts(prev => ({...prev, [pid]: 0}));
    };

    return (
        <div className={`flex h-[calc(100vh-250px)] rounded-2xl overflow-hidden border shadow-sm ${theme === 'dark' ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-white'}`}>
            {/* Sidebar รายชื่อคนไข้ */}
            <div className={`
                ${selectedPatientId ? 'hidden md:flex' : 'flex'} 
                w-full md:w-80 border-r flex-col ${theme === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-gray-100 bg-white'}
            `}>
                 <div className="p-4 border-b border-inherit">
                    <h3 className={`font-bold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}>รายการแชท (ผู้ป่วยในการดูแล)</h3>
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="ค้นหาชื่อ หรือ HN..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full pl-9 pr-3 py-2 rounded-lg text-sm border outline-none ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`}
                        />
                        <Search size={16} className="absolute left-3 top-2.5 text-gray-400"/>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scroll p-2 space-y-1">
                    {filteredPatients.length > 0 ? filteredPatients.map((patient) => (
                        <div 
                            key={patient.id}
                            onClick={() => handleSelectPatient(patient.user_id)}
                            className={`p-3 rounded-xl cursor-pointer flex items-center gap-3 transition-all relative ${
                                selectedPatientId === patient.user_id 
                                ? 'bg-teal-600 text-white shadow-md' 
                                : (theme === 'dark' ? 'hover:bg-slate-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700')
                            }`}
                        >
                            {/* ส่วนของรูปโปรไฟล์และจุดแจ้งเตือนไฟสีแดง */}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 relative ${selectedPatientId === patient.user_id ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                {patient.name.charAt(0)}
                                
                                {/* 🔴 ไฟสีแดงแจ้งเตือน: แสดงผลเมื่อมีข้อความที่ยังไม่ได้อ่าน > 0 */}
                                {unreadCounts[patient.user_id] > 0 && (
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-[10px] text-white font-bold animate-pulse shadow-sm">
                                        {unreadCounts[patient.user_id]}
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-sm truncate">{patient.name}</h4>
                                <p className={`text-xs truncate ${selectedPatientId === patient.user_id ? 'text-teal-100' : 'text-gray-400'}`}>
                                    HN: {patient.hn || '-'}
                                </p>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center p-8 opacity-60">
                            <User size={32} className="mx-auto mb-2 text-gray-400" />
                            <p className="text-xs">ไม่พบรายชื่อผู้ป่วยในความดูแล</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className={`
                ${!selectedPatientId ? 'hidden md:flex' : 'flex'} 
                flex-1 flex-col bg-pattern relative
            `}>
                {selectedPatientId ? (
                    <>
                        <div className="md:hidden absolute top-2.5 left-2 z-20">
                            <button 
                                onClick={() => setSelectedPatientId(null)}
                                className={`p-2 rounded-full shadow-sm border ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-200 text-gray-600'}`}
                            >
                                <ArrowLeft size={18} />
                            </button>
                        </div>

                        <ChatWindow 
                            roomId={selectedPatientId}
                            userProfile={userProfile} 
                            theme={theme}
                            targetName={`คุณ ${currentPatient?.name || 'ผู้ป่วย'}`}
                            patientNameForBot={currentPatient?.name || 'ผู้ป่วย'} 
                        />
                    </>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-40">
                        <MessageCircle size={64} className="mb-4 text-gray-400"/>
                        <p className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}>เลือกแชทผู้ป่วยเพื่อเริ่มสนทนา</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConsultSection;