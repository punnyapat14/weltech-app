import React, { useState, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import { Users, Plus } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const MyPatientsView = ({ patientsList = [], userProfile, theme, fetchPatients }) => {
    
    const [selectedPatientId, setSelectedPatientId] = useState('');

    const myPatients = useMemo(() => {
        if (!userProfile || !patientsList) return [];
        return patientsList.filter(p => 
            p.doctor_id && (
                String(p.doctor_id) === String(userProfile.user_id) || 
                String(p.doctor_id) === String(userProfile.id)
            )
        );
    }, [patientsList, userProfile]);

    const availablePatients = useMemo(() => {
        return patientsList.filter(p => !p.doctor_id);
    }, [patientsList]);

    const handleAddPatient = async () => {
        if (!selectedPatientId) return alert("กรุณาเลือกผู้ป่วยก่อนกดเพิ่ม");
        
        try {
            const doctorUid = userProfile.user_id || userProfile.id;
            const { data, error } = await supabase
                .from('patients')
                .update({ doctor_id: doctorUid })
                .eq('user_id', selectedPatientId)
                .select(); 

            if (error) throw error;
            if (!data || data.length === 0) return alert("หาคนไข้ไม่พบ หรือไม่มีสิทธิ์แก้ไข");
            
            alert("เพิ่มผู้ป่วยเรียบร้อยแล้ว");
            setSelectedPatientId('');
            if (fetchPatients) await fetchPatients(); 
        } catch (error) {
            console.error("Error adding patient:", error);
            alert("เกิดข้อผิดพลาด: " + (error.code === '23503' ? "ไม่พบรหัสแพทย์ในระบบโปรไฟล์" : error.message));
        }
    };

    const handleUpdateStatus = async (patientUserId, newStatus) => {
        try {
            const { error } = await supabase
                .from('patients')
                .update({ treatment_status: newStatus })
                .eq('user_id', patientUserId);

            if (error) throw error;
            if (fetchPatients) await fetchPatients(); 
        } catch (error) {
            console.error("Error updating status:", error);
            alert("ไม่สามารถเปลี่ยนสถานะได้: " + error.message);
        }
    };

    const genderChartData = useMemo(() => {
        const maleCount = myPatients.filter(p => p.title_th === 'นาย' || p.gender === 'male' || p.gender === 'ชาย').length;
        const femaleCount = myPatients.length - maleCount;
        return {
            labels: ['ชาย', 'หญิง'],
            datasets: [{
                data: [maleCount, femaleCount],
                backgroundColor: ['#3b82f6', '#ec4899'],
                borderWidth: 0,
            }]
        };
    }, [myPatients]);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    usePointStyle: true,
                    color: theme === 'dark' ? '#ccc' : '#666',
                    font: { family: 'Prompt', size: 10 }
                }
            }
        }
    };

    return (
        <div className="flex flex-col h-full gap-4 md:gap-6 p-3 md:p-6 overflow-y-auto custom-scroll animate-fade-in pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className={`text-xl md:text-2xl font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                    <Users className="text-teal-500" size={24}/> ผู้ป่วยในการดูแล 
                    <span className="text-sm font-normal bg-teal-500/10 text-teal-500 px-3 py-1 rounded-full border border-teal-500/20">
                        {myPatients.length} คน
                    </span>
                </h2>
            </div>

            <div className={`p-4 md:p-6 rounded-2xl border shadow-sm ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                <h3 className={`font-bold mb-4 text-sm md:text-base ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>เพิ่มผู้ป่วยในความดูแล</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                    <select 
                        className={`flex-1 p-3 rounded-xl border text-sm ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-700'} focus:ring-2 focus:ring-teal-500 outline-none transition-all`}
                        value={selectedPatientId}
                        onChange={(e) => setSelectedPatientId(e.target.value)}
                    >
                        <option value="">-- เลือกรายชื่อผู้ป่วย (ที่ยังไม่มีแพทย์) --</option>
                        {availablePatients.map(p => (
                            <option key={p.user_id} value={p.user_id}> 
                                {p.name} (HN: {p.hn || '-'})
                            </option>
                        ))}
                    </select>
                    <button 
                        onClick={handleAddPatient}
                        disabled={!selectedPatientId}
                        className="px-6 py-3 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-400 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shrink-0 shadow-md active:scale-95 text-sm md:text-base"
                    >
                        <Plus size={18}/> เพิ่มรายชื่อ
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                <div className={`lg:col-span-8 p-4 md:p-6 rounded-2xl border shadow-sm overflow-hidden ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                    <h3 className={`font-bold mb-4 text-base md:text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>รายชื่อผู้ป่วยในการดูแลทั้งหมด</h3>
                    <div className="overflow-x-auto -mx-4 md:mx-0">
                        <table className={`w-full text-left text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                            <thead className={`text-xs uppercase ${theme === 'dark' ? 'bg-slate-700/50 text-gray-300' : 'bg-gray-50 text-gray-700'}`}>
                                <tr>
                                    <th className="px-4 py-3 min-w-[80px]">HN</th>
                                    <th className="px-4 py-3 min-w-[150px]">ชื่อ-นามสกุล</th>
                                    <th className="px-4 py-3 text-center min-w-[120px]">สถานะ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {myPatients.length > 0 ? myPatients.map((patient, index) => (
                                    <tr key={patient.user_id || index} className={`border-b ${theme === 'dark' ? 'border-slate-700 hover:bg-slate-700/50' : 'border-gray-100 hover:bg-gray-50'}`}>
                                        <td className="px-4 py-4 font-medium">{patient.hn || '-'}</td>
                                        <td className="px-4 py-4">{patient.name}</td>
                                        <td className="px-4 py-4 text-center">
                                            <select
                                                value={patient.treatment_status || 'waiting_exam'} 
                                                onChange={(e) => handleUpdateStatus(patient.user_id, e.target.value)}
                                                className={`px-3 py-1.5 rounded-full text-[10px] md:text-xs font-bold outline-none cursor-pointer transition-all duration-300 border-none text-center w-full max-w-[110px] ${
                                                    (patient.treatment_status === 'completed') 
                                                        ? '!bg-green-100 !text-green-600' 
                                                        : (patient.treatment_status === 'waiting_result') 
                                                            ? '!bg-orange-100 !text-orange-600' 
                                                            : '!bg-red-100 !text-red-600'
                                                }`}
                                            >
                                                <option value="waiting_exam" className="bg-white text-gray-800">รอตรวจ</option>
                                                <option value="waiting_result" className="bg-white text-gray-800">รอฟังผล</option>
                                                <option value="completed" className="bg-white text-gray-800">เสร็จสิ้น</option>
                                            </select>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="3" className="px-4 py-10 text-center text-gray-400 italic">ยังไม่มีผู้ป่วยในการดูแล</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="lg:col-span-4 flex flex-col gap-6 w-full">
                    <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 md:gap-4">
                        <div className="p-4 bg-blue-600 text-white rounded-xl shadow-md flex flex-col justify-center">
                            <span className="text-[10px] md:text-xs font-medium opacity-80 uppercase">ทั้งหมด</span>
                            <span className="text-xl md:text-2xl font-bold leading-none mt-1">{myPatients.length}</span>
                        </div>
                        <div className="p-4 bg-red-500 text-white rounded-xl shadow-md flex flex-col justify-center">
                            <span className="text-[10px] md:text-xs font-medium opacity-80 uppercase">รอตรวจ</span>
                            <span className="text-xl md:text-2xl font-bold leading-none mt-1">{myPatients.filter(p => p.treatment_status === 'waiting_exam' || !p.treatment_status).length}</span>
                        </div>
                        <div className="p-4 bg-orange-500 text-white rounded-xl shadow-md flex flex-col justify-center">
                            <span className="text-[10px] md:text-xs font-medium opacity-80 uppercase">รอฟังผล</span>
                            <span className="text-xl md:text-2xl font-bold leading-none mt-1">{myPatients.filter(p => p.treatment_status === 'waiting_result').length}</span>
                        </div>
                        <div className="p-4 bg-green-600 text-white rounded-xl shadow-md flex flex-col justify-center">
                            <span className="text-[10px] md:text-xs font-medium opacity-80 uppercase">เสร็จสิ้น</span>
                            <span className="text-xl md:text-2xl font-bold leading-none mt-1">{myPatients.filter(p => p.treatment_status === 'completed').length}</span>
                        </div>
                    </div>

                    <div className={`p-4 md:p-6 rounded-2xl border shadow-sm flex flex-col items-center ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                        <h3 className={`text-xs md:text-sm font-bold mb-4 uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>สัดส่วนเพศผู้ป่วย</h3>
                        <div className="h-44 md:h-52 w-full flex justify-center">
                            {myPatients.length > 0 ? (
                                <Pie data={genderChartData} options={chartOptions} />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400 text-xs italic">
                                    <Users size={32} className="mb-2 opacity-20"/>
                                    ไม่มีข้อมูลสถิติ
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyPatientsView;