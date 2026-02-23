import React, { useState, useEffect } from 'react';

import { supabase } from '../../supabaseClient';

import { Search, Users, Stethoscope } from 'lucide-react';

import ProfileView from '../profile/ProfileView'; // ต้องแน่ใจว่า import ถูก path

import { calculateAge } from '../../utils/helpers'; // ดึง helper function มาใช้



const DoctorPatients = ({ filterType = 'all', setSelectedChatPatientId, patientsList = [], refetchData, userProfile, theme, fetchAppointments }) => {

    const [selectedPatient, setSelectedPatient] = useState(null);

    const [searchAddValue, setSearchAddValue] = useState('');

    const [selectedPatientToAdd, setSelectedPatientToAdd] = useState('');

    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    

    // ✅ 1. เพิ่ม State สำหรับเก็บประวัติการรักษาของผู้ป่วยที่กำลังดูอยู่

    const [currentPatientHistory, setCurrentPatientHistory] = useState([]);



    const myPatients = patientsList.filter(p => p.doctor_id === userProfile.user_id);

    const availableForConsult = patientsList.filter(p => !p.doctor_id);



    const listSource = filterType === 'my' ? myPatients : patientsList;

    const displayList = listSource.filter(p => p.name.includes(searchAddValue) || p.idCard.includes(searchAddValue));



    const stats = {

        total: myPatients.length,

        waiting_exam: myPatients.filter(p => p.treatment_status === 'waiting_exam').length,

        waiting_result: myPatients.filter(p => p.treatment_status === 'waiting_result').length,

        completed: myPatients.filter(p => p.treatment_status === 'completed').length,

    };



    // ✅ 2. เพิ่ม useEffect เพื่อดึงข้อมูลจากตาราง treatment_history เมื่อเลือกคนไข้

    useEffect(() => {

        const fetchHistory = async () => {

            if (!selectedPatient) {

                setCurrentPatientHistory([]); // ถ้าไม่ได้เลือกใคร ให้เคลียร์ค่า

                return;

            }



            try {

                // ดึงข้อมูลจากตาราง treatment_history

                const { data, error } = await supabase

                    .from('treatment_history')

                    .select('*')

                    .eq('patient_id', selectedPatient.user_id) // กรองเฉพาะคนไข้คนนี้

                    .order('date', { ascending: false }); // เรียงจากใหม่ไปเก่า



                if (error) throw error;

                setCurrentPatientHistory(data || []);

            } catch (err) {

                console.error("Error fetching history:", err);

            }

        };



        fetchHistory();

    }, [selectedPatient]); // รันใหม่ทุกครั้งที่ selectedPatient เปลี่ยน



    const handleAssignPatient = async () => {

        if (!selectedPatientToAdd) return;

        try {

            const { error } = await supabase

            .from('patients')

            .update({

                doctor_id: userProfile.user_id,

                treatment_status: 'waiting_exam', 

                updated_at: new Date().toISOString()

            })

            .eq('user_id', selectedPatientToAdd);



            if (error) throw error;

            alert("เพิ่มผู้ป่วยเข้าสู่การดูแลเรียบร้อยแล้ว");

            setSelectedPatientToAdd('');

            await refetchData(); 

        } catch (e) {

            console.error("Full Error Log:", e);

            alert("เกิดข้อผิดพลาด: " + (e.message || JSON.stringify(e)));

        }

    };



    const handleStatusChange = async (newStatus) => {

        if (!selectedPatient) return;

        setIsUpdatingStatus(true);

        try {

            const { error: patError } = await supabase

                .from('patients')

                .update({

                    treatment_status: newStatus,

                    updated_at: new Date().toISOString()

                })

                .eq('user_id', selectedPatient.user_id);



            if (patError) throw patError;



            let newTitle = "นัดตรวจเลือด";

            let apptStatus = "รอตรวจ";

            

            if (newStatus === 'waiting_result') {

                newTitle = "นัดฟังผล";

                apptStatus = "รอผล";

            } else if (newStatus === 'completed') {

                newTitle = "เสร็จสิ้น";

                apptStatus = "เสร็จสิ้น";

            }



            const todayStr = new Date().toISOString().split('T')[0];

            await supabase

                .from('appointments')

                .update({

                    title: newTitle,

                    status: apptStatus

                })

                .eq('patient_id', selectedPatient.user_id)

                .eq('date', todayStr);



            setSelectedPatient(prev => ({...prev, treatment_status: newStatus}));

            await refetchData();

            if (fetchAppointments) await fetchAppointments();

            

        } catch (e) {

            console.error(e);

            alert("อัปเดตสถานะไม่สำเร็จ: " + e.message);

        } finally {

            setIsUpdatingStatus(false);

        }

    };



    const getStatusText = (status) => {

        switch (status) {

            case 'waiting_exam': return 'รอตรวจ';

            case 'waiting_result': return 'รอฟังผล';

            case 'completed': return 'ส่งผลแล้ว';

            default: return status;

        }

    };



    const getStatusBadgeClass = (status) => {

        switch (status) {

            case 'waiting_exam': 

                return "bg-red-50 border-red-200 text-red-700 dark:bg-[#c62828] dark:text-white dark:border-red-900";

            case 'waiting_result': 

                return "bg-orange-50 border-orange-200 text-orange-800 dark:bg-[#ff8f00] dark:text-white dark:border-amber-900";

            case 'completed': 

                return "bg-green-50 border-green-200 text-green-800 dark:bg-[#2e7d32] dark:text-white dark:border-green-900";

            default: 

                return "bg-gray-50 border-gray-200 text-gray-700 dark:bg-gray-800 dark:text-white";

        }

    };



    // Sub-components ภายใน

    const StatCard = ({ title, count, unit = "คน", colorTheme }) => {

        let styleClass = "";

        switch (colorTheme) {

            case 'blue': styleClass = "bg-blue-50 border-blue-200 text-blue-700 dark:bg-[#0277bd] dark:text-white dark:border-blue-900"; break;

            case 'red': styleClass = "bg-red-50 border-red-200 text-red-700 dark:bg-[#c62828] dark:text-white dark:border-red-900"; break;

            case 'yellow': styleClass = "bg-orange-50 border-orange-200 text-orange-800 dark:bg-[#ff8f00] dark:text-white dark:border-amber-900"; break;

            case 'green': styleClass = "bg-green-50 border-green-200 text-green-800 dark:bg-[#2e7d32] dark:text-white dark:border-green-900"; break;

            default: styleClass = "bg-gray-50 border-gray-200 text-gray-700 dark:bg-gray-800 dark:text-white";

        }

        return (

            <div className={`w-full p-6 rounded-2xl border shadow-sm transition-all hover:shadow-md hover:scale-[1.01] flex justify-between items-center ${styleClass}`}>

                <div className="flex-1 text-left"><span className="text-lg font-bold opacity-90 tracking-wide block">{title}</span></div>

                <div className="flex items-baseline gap-2 text-right">

                    <span className="text-5xl font-black tracking-tight drop-shadow-sm leading-none">{count}</span>

                    <span className="text-lg font-medium opacity-80">{unit}</span>

                </div>

            </div>

        );

    };



    const AgeChart = ({ patients }) => {

        const buckets = [

            { label: '0-10 ปี', min: 0, max: 10, count: 0, color: '#42a5f5' },     

            { label: '11-20 ปี', min: 11, max: 20, count: 0, color: '#66bb6a' }, 

            { label: '21-30 ปี', min: 21, max: 30, count: 0, color: '#ffa726' }, 

            { label: '31-40 ปี', min: 31, max: 40, count: 0, color: '#ef5350' }, 

            { label: '41-50 ปี', min: 41, max: 50, count: 0, color: '#ab47bc' }, 

            { label: '51-60 ปี', min: 51, max: 60, count: 0, color: '#26c6da' }, 

            { label: '61-70 ปี', min: 61, max: 70, count: 0, color: '#ff7043' }, 

            { label: '71-80 ปี', min: 71, max: 80, count: 0, color: '#8d6e63' }, 

            { label: '80 ปีขึ้นไป', min: 81, max: 999, count: 0, color: '#78909c' } 

        ];



        patients.forEach(p => {

            const age = calculateAge(p.dob);

            if (age === '-' || age < 0) return;

            const bucket = buckets.find(b => age >= b.min && age <= b.max);

            if (bucket) bucket.count++;

        });



        const total = patients.length;

        let currentDeg = 0;

        const gradientParts = buckets.map(b => {

            if (total === 0) return '';

            const deg = (b.count / total) * 360;

            const str = `${b.color} ${currentDeg}deg ${currentDeg + deg}deg`;

            currentDeg += deg;

            return str;

        }).filter(s => s !== '');

        const gradientString = total > 0 ? `conic-gradient(${gradientParts.join(', ')})` : 'conic-gradient(#eee 0deg 360deg)';



        return (

            <div className={`flex flex-col items-center justify-center h-full p-6 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>

                <h3 className="text-xl font-bold mb-6">สถิติช่วงอายุผู้ป่วย ({total} คน)</h3>

                <div className="flex flex-col items-center gap-8 w-full">

                    <div className="relative w-64 h-64 rounded-full shadow-xl shrink-0 transition-transform hover:scale-105" style={{ background: gradientString }}></div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 text-sm w-full max-w-lg px-4">

                        {buckets.map((b, i) => (

                            <div key={i} className="flex items-center gap-2">

                                <span className="w-4 h-4 rounded-full shadow-sm shrink-0" style={{ backgroundColor: b.color }}></span>

                                <span className="opacity-80 whitespace-nowrap">{b.label}:</span>

                                <span className="font-bold">{b.count}</span>

                            </div>

                        ))}

                    </div>

                </div>

            </div>

        );

    };



    if (filterType === 'my') {

        return (

            <div className="flex h-full gap-6">

                <div className={`w-[35%] rounded-xl border overflow-hidden flex flex-col ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>

                    <div className={`p-4 border-b ${theme === 'dark' ? 'border-slate-700' : 'border-gray-200'}`}>

                        <h3 className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>รายชื่อผู้ป่วยในการดูแล</h3>

                    </div>

                    

                    <div className={`p-4 border-b space-y-3 ${theme === 'dark' ? 'bg-slate-900/50 border-slate-700' : 'bg-gray-50 border-gray-100'}`}>

                        <div className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>เพิ่มผู้ป่วยใหม่</div>

                        <div className="flex gap-2">

                            <select 

                                className={`flex-1 p-2.5 rounded-lg text-sm outline-none border transition-colors ${theme === 'dark' ? 'bg-slate-800 border-slate-600 text-white focus:border-blue-500' : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'}`}

                                value={selectedPatientToAdd}

                                onChange={(e) => setSelectedPatientToAdd(e.target.value)}

                            >

                                <option value="">-- เลือกรายชื่อผู้ป่วย --</option>

                                {availableForConsult.map(p => (

                                    <option key={p.id} value={p.id}>{p.name} ({p.idCard})</option>

                                ))}

                            </select>

                            <button 

                                onClick={handleAssignPatient} 

                                disabled={!selectedPatientToAdd} 

                                className="bg-[#03a9f4] text-white px-6 py-2 rounded-lg text-sm font-bold hover:brightness-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"

                            >

                                เพิ่ม

                            </button>

                        </div>

                    </div>



                    <div className={`p-3 border-b ${theme === 'dark' ? 'border-slate-700 bg-slate-900' : 'border-gray-100 bg-white'}`}>

                        <div className="relative">

                            <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}/>

                            <input 

                                value={searchAddValue} 

                                onChange={(e) => setSearchAddValue(e.target.value)} 

                                placeholder="ค้นหาชื่อ หรือ เลขบัตร..." 

                                className={`w-full pl-9 pr-3 py-2 rounded-lg border outline-none text-sm ${theme === 'dark' ? 'bg-slate-900 border-slate-600 text-white placeholder-gray-600' : 'bg-gray-50 border-gray-200 text-gray-900'}`}

                            />

                        </div>

                    </div>



                    <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scroll">

                        {displayList.length > 0 ? displayList.map((p, index) => (

                            <div key={p.id} 

                                onClick={() => setSelectedPatient(p)} 

                                className={`p-4 rounded-xl cursor-pointer transition-all border relative

                                    ${theme === 'dark' ? 'bg-slate-700/50 border-slate-600 hover:bg-slate-700' : 'bg-white border-gray-100 hover:border-blue-200 hover:shadow-md'}

                                    ${selectedPatient?.id === p.id ? 'ring-2 ring-[#03a9f4] border-transparent' : ''}

                                `}>

                                <div className="flex justify-between items-start">

                                    <div>

                                        <div className={`font-bold text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{index + 1}. {p.name}</div>

                                        <div className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500 opacity-60'}`}>{p.idCard}</div>

                                    </div>

                                    <div className={`text-xs font-bold px-3 py-1 rounded-full border ${getStatusBadgeClass(p.treatment_status)}`}>

                                        {getStatusText(p.treatment_status)}

                                    </div>

                                </div>

                            </div>

                        )) : (

                            <div className="flex flex-col items-center justify-center h-40 text-gray-400 opacity-60">

                                <Users size={40} className="mb-2"/>

                                <p className="text-sm">ไม่พบข้อมูลผู้ป่วย</p>

                            </div>

                        )}

                    </div>

                </div>

                

                <div className="w-[65%] flex flex-col gap-4 overflow-y-auto custom-scroll pr-1">

                    <StatCard title="จำนวนผู้ป่วยที่อยู่ในความดูแล" count={stats.total} colorTheme="blue" />

                    <StatCard title="จำนวนผู้ป่วยที่รอตรวจเลือด" count={stats.waiting_exam} colorTheme="red" />

                    <StatCard title="จำนวนผู้ป่วยที่รอฟังผล" count={stats.waiting_result} colorTheme="yellow" />

                    <StatCard title="จำนวนผู้ป่วยที่ส่งผลตรวจเสร็จสิ้น" count={stats.completed} colorTheme="green" />

                    

                    {selectedPatient && (

                        <div className={`mt-2 flex-1 rounded-2xl border p-6 animate-fade-in ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>

                            <div className="flex justify-between items-center mb-4 pb-2 border-b border-dashed border-gray-200 dark:border-gray-700">

                                <h4 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>รายละเอียดผู้ป่วย</h4>

                                

                                <div className="flex items-center gap-2">

                                    <span className="text-xs text-gray-500">เปลี่ยนสถานะ:</span>

                                    {isUpdatingStatus ? (

                                        <span className="text-xs text-blue-500 animate-pulse">กำลังบันทึก...</span>

                                    ) : (

                                        <select 

                                            value={selectedPatient.treatment_status} 

                                            onChange={(e) => handleStatusChange(e.target.value)}

                                            className={`text-xs font-bold px-2 py-1 rounded-lg border outline-none cursor-pointer ${getStatusBadgeClass(selectedPatient.treatment_status)}`}

                                        >

                                            <option value="waiting_exam">รอตรวจเลือด</option>

                                            <option value="waiting_result">รอฟังผล</option>

                                            <option value="completed">เสร็จสิ้น</option>

                                        </select>

                                    )}

                                </div>

                            </div>

                            

                            {/* ✅ 3. ส่ง treatmentHistory เข้าไปแสดงผลใน ProfileView */}

                            <ProfileView 

                                data={selectedPatient} 

                                isDoctorView={true} 

                                onSaveHealthData={() => {}} 

                                addressDB={[]} 

                                theme={theme}

                                treatmentHistory={currentPatientHistory} 

                            />

                        </div>

                    )}

                </div>

            </div>

        );

    }



    return (

        <div className="flex h-full gap-6">

            <div className={`w-[35%] rounded-xl border overflow-hidden flex flex-col ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>

                <div className={`p-4 border-b ${theme === 'dark' ? 'border-slate-700' : 'border-gray-200'}`}>

                    <h3 className={`font-bold ${theme === 'dark' ? 'text-white' : ''}`}>รายชื่อผู้ป่วยทั้งหมด</h3>

                </div>

                <div className={`p-3 border-b ${theme === 'dark' ? 'border-slate-700 bg-slate-900' : 'border-gray-100 bg-white'}`}>

                    <input 

                        value={searchAddValue} 

                        onChange={(e) => setSearchAddValue(e.target.value)} 

                        placeholder="ค้นหาชื่อ..." 

                        className={`w-full p-2 rounded border outline-none text-sm ${theme === 'dark' ? 'bg-slate-900 border-slate-600 text-white placeholder-gray-600' : 'bg-gray-50 border-gray-200 text-gray-900'}`}

                    />

                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">

                    {displayList.length > 0 ? displayList.map(p => (

                        <div key={p.id} 

                             className={`p-4 rounded-lg border relative

                                ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-gray-200' : 'bg-white border-gray-100 text-gray-900'}

                             `}>

                            <div className="flex justify-between items-start">

                                <div>

                                    <h4 className={`font-bold text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{p.name}</h4>

                                    <p className={`text-xs ${theme === 'dark' ? 'text-blue-300' : 'text-blue-500'}`}>{p.idCard}</p>

                                    <div className="mt-1 flex items-center gap-2">

                                        {p.doctor_id ? (

                                            <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1"><Stethoscope size={10}/> มีแพทย์ดูแล</span>

                                        ) : (

                                            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">ว่าง (ไม่มีแพทย์)</span>

                                        )}

                                    </div>

                                </div>

                            </div>

                        </div>

                    )) : <p className="text-center p-4 text-gray-400 text-sm">ไม่พบข้อมูลผู้ป่วย</p>}

                </div>

            </div>

            

            <div className={`w-[65%] rounded-xl border p-2 overflow-hidden ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>

                <AgeChart patients={patientsList} />

            </div>

        </div>

    );

};



export default DoctorPatients;