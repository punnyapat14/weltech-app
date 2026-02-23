import React, { useState, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import { Users, Plus } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const MyPatientsView = ({ patientsList = [], userProfile, theme, fetchPatients }) => {
    
    const [selectedPatientId, setSelectedPatientId] = useState('');

    // 🟢 แก้ไขจุดที่ 1: Filter รายชื่อผู้ป่วยที่อยู่ในความดูแลของหมอคนนี้
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

    // 🟢 แก้ไขจุดที่ 2: แก้ปัญหา Foreign Key Violation โดยเลือกใช้ user_id หรือ id ให้ถูกตัว
    const handleAddPatient = async () => {
        if (!selectedPatientId) return alert("กรุณาเลือกผู้ป่วยก่อนกดเพิ่ม");
        
        try {
            const doctorUid = userProfile.user_id || userProfile.id;
            console.log("พยายามเพิ่มคนไข้ด้วย Doctor ID:", doctorUid);

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

    // 🟢 แก้ไขจุดที่ 3: ฟังก์ชันสำหรับอัปเดตสถานะการตรวจจากตาราง
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
                    font: { family: 'Prompt', size: 12 }
                }
            }
        }
    };

    return (
        <div className="flex flex-col h-full gap-6 p-2 md:p-4 overflow-y-auto custom-scroll animate-fade-in">
            <h2 className={`text-xl md:text-2xl font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                <Users className="text-teal-500"/> ผู้ป่วยในการดูแล ({myPatients.length} คน)
            </h2>

            <div className={`p-4 md:p-6 rounded-2xl border shadow-sm ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                <h3 className={`font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>เพิ่มผู้ป่วยในความดูแล</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                    <select 
                        className={`flex-1 p-3 rounded-xl border ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-700'} focus:ring-2 focus:ring-teal-500 outline-none transition-all`}
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
                        className="px-6 py-3 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-400 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shrink-0 shadow-md active:scale-95"
                    >
                        <Plus size={20}/> เพิ่มรายชื่อ
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start pb-8">
                <div className={`lg:col-span-2 p-4 md:p-6 rounded-2xl border shadow-sm overflow-hidden ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                    <h3 className={`font-bold mb-4 text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>รายชื่อผู้ป่วยในการดูแลทั้งหมด</h3>
                    <div className="overflow-x-auto -mx-4 md:mx-0">
                        <table className={`w-full text-left text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                            <thead className={`text-xs uppercase ${theme === 'dark' ? 'bg-slate-700 text-gray-300' : 'bg-gray-50 text-gray-700'}`}>
                                <tr>
                                    <th className="px-4 py-3">HN</th>
                                    <th className="px-4 py-3">ชื่อ-นามสกุล</th>
                                    <th className="px-4 py-3 text-center">แก้ไขสถานะ</th>
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
    className={`px-4 py-1 rounded-full text-xs font-bold outline-none cursor-pointer transition-all duration-300 appearance-none border-none text-center min-w-[100px] ${
        (patient.treatment_status === 'completed') 
            ? '!bg-green-100 !text-green-600' 
            : (patient.treatment_status === 'waiting_result') 
                ? '!bg-orange-100 !text-orange-600' 
                : '!bg-red-100 !text-red-600' // สำหรับ waiting_exam หรือค่าว่าง
    }`}
>
    <option value="waiting_exam" className="bg-white text-gray-800">รอตรวจ</option>
    <option value="waiting_result" className="bg-white text-gray-800">รอฟังผล</option>
    <option value="completed" className="bg-white text-gray-800">เสร็จสิ้น</option>
</select>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="3" className="px-4 py-10 text-center text-gray-400">ยังไม่มีผู้ป่วยในการดูแล</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 md:gap-4">
                        <div className="p-4 bg-blue-600 text-white rounded-xl shadow-md flex justify-between items-center">
                            <span className="text-xs md:text-sm font-medium opacity-90">ทั้งหมด</span>
                            <span className="text-xl md:text-2xl font-bold">{myPatients.length}</span>
                        </div>
                        <div className="p-4 bg-red-500 text-white rounded-xl shadow-md flex justify-between items-center">
                            <span className="text-xs md:text-sm font-medium opacity-90">รอตรวจ</span>
                            <span className="text-xl md:text-2xl font-bold">{myPatients.filter(p => p.treatment_status === 'waiting_exam' || !p.treatment_status).length}</span>
                        </div>
                        <div className="p-4 bg-orange-500 text-white rounded-xl shadow-md flex justify-between items-center">
                            <span className="text-xs md:text-sm font-medium opacity-90">รอฟังผล</span>
                            <span className="text-xl md:text-2xl font-bold">{myPatients.filter(p => p.treatment_status === 'waiting_result').length}</span>
                        </div>
                        <div className="p-4 bg-green-600 text-white rounded-xl shadow-md flex justify-between items-center">
                            <span className="text-xs md:text-sm font-medium opacity-90">เสร็จสิ้น</span>
                            <span className="text-xl md:text-2xl font-bold">{myPatients.filter(p => p.treatment_status === 'completed').length}</span>
                        </div>
                    </div>

                    <div className={`p-6 rounded-2xl border shadow-sm flex flex-col items-center ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                        <h3 className={`text-sm font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>สัดส่วนเพศ</h3>
                        <div className="h-40 md:h-48 w-full flex justify-center">
                            {myPatients.length > 0 ? (
                                <Pie data={genderChartData} options={chartOptions} />
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-400 text-xs text-center">ไม่มีข้อมูลสถิติ</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyPatientsView;