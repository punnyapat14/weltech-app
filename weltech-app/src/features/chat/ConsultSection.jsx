import React, { useState, useEffect, useMemo } from 'react';
import { Search, MessageCircle, User, Stethoscope, ArrowLeft } from 'lucide-react';
import ChatWindow from './ChatWindow'; 

const ConsultSection = ({ theme, userProfile, patientsList = [], targetPatientId }) => {
    const [selectedPatientId, setSelectedPatientId] = useState(targetPatientId || null);
    const [searchTerm, setSearchTerm] = useState('');
    const [unreadCounts, setUnreadCounts] = useState({});

    useEffect(() => {
        if(targetPatientId) {
            setSelectedPatientId(targetPatientId);
            setUnreadCounts(prev => ({...prev, [targetPatientId]: 0}));
        }
    }, [targetPatientId]);

    if (userProfile.role === 'patient') {
        return (
            <div className={`h-[calc(100vh-140px)] md:h-[calc(100vh-250px)] rounded-2xl overflow-hidden border shadow-sm ${theme === 'dark' ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-white'}`}>
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
        (p.hn && p.hn.includes(searchTerm))
    );
    
    const currentPatient = myPatients.find(p => p.user_id === selectedPatientId);
    
    const handleSelectPatient = (pid) => {
        setSelectedPatientId(pid);
        setUnreadCounts(prev => ({...prev, [pid]: 0}));
    };

    return (
        <div className={`flex h-[calc(100vh-140px)] md:h-[calc(100vh-250px)] rounded-2xl overflow-hidden border shadow-sm relative ${theme === 'dark' ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-white'}`}>
            
            <div className={`
                ${selectedPatientId ? 'hidden md:flex' : 'flex'} 
                w-full md:w-80 border-r flex-col z-10 ${theme === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-gray-100 bg-white'}
            `}>
                 <div className="p-4 border-b border-inherit">
                    <h3 className={`font-bold mb-3 text-sm md:text-base ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}>รายการแชท</h3>
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="ค้นหาชื่อ หรือ HN..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full pl-9 pr-3 py-2.5 rounded-xl text-sm border outline-none transition-all ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-transparent focus:bg-white focus:border-teal-500'}`}
                        />
                        <Search size={18} className="absolute left-3 top-3 text-gray-400"/>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scroll p-2 space-y-1">
                    {filteredPatients.length > 0 ? filteredPatients.map((patient) => (
                        <div 
                            key={patient.id}
                            onClick={() => handleSelectPatient(patient.user_id)}
                            className={`p-3 rounded-xl cursor-pointer flex items-center gap-3 transition-all active:scale-[0.98] ${
                                selectedPatientId === patient.user_id 
                                ? 'bg-teal-600 text-white shadow-md' 
                                : (theme === 'dark' ? 'hover:bg-slate-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700')
                            }`}
                        >
                            <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-base shrink-0 relative ${selectedPatientId === patient.user_id ? 'bg-white/20 text-white' : 'bg-teal-50 text-teal-600'}`}>
                                {patient.name.charAt(0)}
                                {unreadCounts[patient.user_id] > 0 && (
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-[10px] text-white font-bold animate-pulse">
                                        {unreadCounts[patient.user_id]}
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-sm truncate">{patient.name}</h4>
                                <p className={`text-[11px] truncate opacity-70`}>
                                    HN: {patient.hn || '-'}
                                </p>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-12 opacity-40">
                            <User size={40} className="mx-auto mb-2 text-gray-400" />
                            <p className="text-xs">ไม่พบรายการแชท</p>
                        </div>
                    )}
                </div>
            </div>

            <div className={`
                ${!selectedPatientId ? 'hidden md:flex' : 'flex'} 
                flex-1 flex-col relative z-20 h-full
            `}>
                {selectedPatientId ? (
                    <ChatWindow 
                        roomId={selectedPatientId}
                        userProfile={userProfile} 
                        theme={theme}
                        targetName={currentPatient?.name || 'ผู้ป่วย'}
                        patientNameForBot={currentPatient?.name || 'ผู้ป่วย'} 
                        onBack={() => setSelectedPatientId(null)} 
                    />
                ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-30 p-6 text-center">
                        <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mb-4">
                            <MessageCircle size={40} className="text-teal-600"/>
                        </div>
                        <h4 className="font-bold mb-1">ยินดีต้อนรับสู่ศูนย์ให้คำปรึกษา</h4>
                        <p className="text-xs">เลือกรายชื่อผู้ป่วยจากแถบด้านข้างเพื่อเริ่มการสนทนา</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConsultSection;