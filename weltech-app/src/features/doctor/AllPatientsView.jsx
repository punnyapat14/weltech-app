import React, { useState, useEffect, useMemo } from 'react';
import { Users, Search, UserCheck, UserX, Stethoscope, Activity } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { supabase } from '../../supabaseClient';

ChartJS.register(ArcElement, Tooltip, Legend);

const AllPatientsView = ({ patientsList = [], userProfile, theme }) => {
    const [doctorsMap, setDoctorsMap] = useState({});
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const { data, error } = await supabase.from('profiles').select('id, title_th, first_name_th, last_name_th').eq('role', 'doctor');
                if (error) throw error;
                const map = {};
                data.forEach(doc => {
                    map[doc.id] = `${doc.title_th || ''}${doc.first_name_th} ${doc.last_name_th}`.trim();
                });
                setDoctorsMap(map);
            } catch (err) {
                console.error("Error fetching doctors:", err);
            }
        };
        fetchDoctors();
    }, []);

    const ageChartData = useMemo(() => {
        const ageGroups = { '0-10 ปี': 0, '11-20 ปี': 0, '21-30 ปี': 0, '31-40 ปี': 0, '41-50 ปี': 0, '51-60 ปี': 0, '61-70 ปี': 0, '71-80 ปี': 0, '80 ปีขึ้นไป': 0 };
        patientsList.forEach(p => {
            if (p.dob) {
                const age = new Date().getFullYear() - new Date(p.dob).getFullYear();
                if (age <= 10) ageGroups['0-10 ปี']++;
                else if (age <= 20) ageGroups['11-20 ปี']++;
                else if (age <= 30) ageGroups['21-30 ปี']++;
                else if (age <= 40) ageGroups['31-40 ปี']++;
                else if (age <= 50) ageGroups['41-50 ปี']++;
                else if (age <= 60) ageGroups['51-60 ปี']++;
                else if (age <= 70) ageGroups['61-70 ปี']++;
                else if (age <= 80) ageGroups['71-80 ปี']++;
                else ageGroups['80 ปีขึ้นไป']++;
            }
        });
        return {
            labels: Object.keys(ageGroups),
            datasets: [{
                data: Object.values(ageGroups),
                backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16', '#64748b'],
                borderWidth: 0,
                hoverOffset: 15
            }]
        };
    }, [patientsList]);

    const filteredPatients = patientsList.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (p.idCard && p.idCard.includes(searchTerm)) ||
        (p.hn && p.hn.includes(searchTerm))
    );

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%', 
        rotation: -90, 
        animation: {
            duration: 2500, 
            easing: 'easeOutQuart',
            animateRotate: true,
            animateScale: true
        },
        plugins: {
            legend: {
                position: 'right',
                labels: {
                    boxWidth: 12,
                    usePointStyle: true,
                    pointStyle: 'circle',
                    color: theme === 'dark' ? '#ccc' : '#777',
                    font: { size: 11, family: 'Prompt' }
                }
            }
        }
    };

    
    const renderedChart = useMemo(() => {
        if (patientsList.length === 0) return <div className="text-gray-400">ไม่มีข้อมูล</div>;
        return <Doughnut data={ageChartData} options={chartOptions} />;
    }, [ageChartData, theme]); 

    return (
        <div className="flex flex-col h-full gap-6 p-2 overflow-y-auto custom-scroll">
            <h2 className={`text-2xl font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                <Users className="text-blue-500"/> ผู้ป่วยทั้งหมดในระบบ ({patientsList.length} คน)
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                 <div className={`lg:col-span-1 p-6 rounded-[2rem] border shadow-sm flex flex-col items-center ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
                    <h3 className={`text-lg font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>สถิติช่วงอายุผู้ป่วย</h3>
                    <div className="h-64 w-full flex justify-center relative">
                        {renderedChart}
                    </div>
                </div>

                <div className={`lg:col-span-2 p-6 rounded-[2rem] border shadow-sm flex flex-col h-full ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
                     <div className="flex justify-between items-center mb-4">
                        <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>รายชื่อผู้ป่วย</h3>
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                                type="text" 
                                placeholder="ค้นหา (ชื่อ, HN, เลขบัตร)..." 
                                className={`pl-10 pr-4 py-2 rounded-xl border outline-none text-sm transition-all ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-100'}`}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                     </div>

                     <div className="overflow-x-auto flex-1">
                        <table className={`w-full text-left text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                            <thead className={`text-xs uppercase ${theme === 'dark' ? 'bg-slate-700 text-gray-300' : 'bg-gray-50 text-gray-700'}`}>
                                <tr>
                                    <th className="px-4 py-3 rounded-tl-lg">ชื่อ-นามสกุล</th>
                                    <th className="px-4 py-3">HN</th>
                                    <th className="px-4 py-3 rounded-tr-lg">แพทย์เจ้าของไข้</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPatients.length > 0 ? (
                                    filteredPatients.map((p, index) => {
                                        const isMyPatient = p.doctor_id === userProfile?.id || p.doctor_id === userProfile?.user_id;
                                        const doctorName = doctorsMap[p.doctor_id] || 'ไม่ระบุชื่อแพทย์';
                                        return (
                                            <tr key={p.id || index} className={`border-b ${theme === 'dark' ? 'border-slate-700 hover:bg-slate-700/50' : 'border-gray-100 hover:bg-gray-50'}`}>
                                                <td className="px-4 py-3">
                                                    <div className="font-medium">{p.name}</div>
                                                    <div className="text-[10px] opacity-50">{p.idCard}</div>
                                                </td>
                                                <td className="px-4 py-3 font-mono">{p.hn}</td>
                                                <td className="px-4 py-3">
                                                    {!p.doctor_id ? (
                                                        <span className="flex items-center gap-1 text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded-md w-fit text-[10px]"><UserX size={12}/> ยังไม่มีแพทย์</span>
                                                    ) : isMyPatient ? (
                                                        <span className="flex items-center gap-1 text-teal-600 font-bold bg-teal-50 px-2 py-0.5 rounded-md w-fit text-[10px]"><UserCheck size={12}/> ท่านดูแล</span>
                                                    ) : (
                                                        <span className="flex items-center gap-1 text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md w-fit text-[10px]"><Stethoscope size={12}/> {doctorName}</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr><td colSpan="3" className="px-4 py-8 text-center text-gray-400 italic">ไม่พบข้อมูลผู้ป่วย</td></tr>
                                )}
                            </tbody>
                        </table>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default AllPatientsView;