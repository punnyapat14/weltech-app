import React from 'react';
import { ClipboardList, FileText, Activity, AlertCircle, Stethoscope } from 'lucide-react';
import { formatThaiDateFull } from '../../utils/helpers';
import { getRefRange } from '../../utils/referenceRanges'; 

const PatientHistory = ({ patientProfile, treatmentHistory, theme }) => {
    const displayHistory = treatmentHistory || [];

    const calculateAge = (dob) => {
        if (!dob) return 0;
        const diff = Date.now() - new Date(dob).getTime();
        return Math.abs(new Date(diff).getUTCFullYear() - 1970);
    };

    const patientAge = calculateAge(patientProfile?.dob);
    const patientGender = patientProfile?.gender || 'female'; 

    return (
        <div className="space-y-6">
            <h2 className={`font-bold text-2xl flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                <ClipboardList className="text-teal-500" size={28}/> ประวัติการตรวจสุขภาพและผลแล็บ
            </h2>
            
            <div className="space-y-6">
                {displayHistory.length > 0 ? displayHistory.map((item) => {

                    const isLabResult = !!item.lab_data; 
                    const isPregnant = item.vitals_data?.is_pregnant || false;

                    return (
                        <div key={item.id} className={`p-6 border-t-4 rounded-xl shadow-md transition-all ${theme === 'dark' ? 'bg-slate-800 border-slate-600' : 'bg-white border-teal-500'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className={`font-bold text-lg block ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>

                                        {isLabResult 
                                            ? `ผลการตรวจวิเคราะห์เลือด (Ver. ${item.version})` 
                                            : (item.disease || 'ประวัติการรับบริการ')}
                                    </span>
                                    <span className="text-xs text-gray-400">

                                        {isLabResult 
                                            ? `ผู้รายงานผล: ${item.reporter_name || '-'}` 
                                            : `แพทย์ผู้ตรวจ: ${item.doctor_name || '-'}`}
                                    </span>
                                </div>
                                <span className={`text-xs px-3 py-1 rounded-full font-bold ${theme === 'dark' ? 'bg-slate-700 text-gray-300' : 'bg-teal-50 text-teal-700'}`}>
                                    {formatThaiDateFull(item.created_at || item.date)}
                                </span>
                            </div>

                            {isLabResult && item.lab_data && (
                                <div className="overflow-x-auto mb-4 bg-gray-50/5 p-2 rounded-lg">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className={`text-left border-b ${theme === 'dark' ? 'border-slate-700 text-gray-400' : 'border-gray-100 text-gray-500'}`}>
                                                <th className="pb-2 font-medium">รายการ</th>
                                                <th className="pb-2 font-medium text-center">ผลตรวจ</th>
                                                <th className="pb-2 font-medium text-center">ค่าปกติ</th>
                                                <th className="pb-2 font-medium text-right">แปลผล</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                            {Object.entries(item.lab_data).map(([key, value]) => {
                                                if (!value) return null;
                                                
                                                const refInfo = getRefRange(key, patientAge, patientGender, isPregnant);
                                                const numVal = parseFloat(value);
                                                
                                                let statusText = 'ปกติ';
                                                let statusColor = 'text-green-500';
                                                
                                                if (!isNaN(numVal)) {
                                                    if (numVal < refInfo.min) {
                                                        statusText = 'ต่ำ';
                                                        statusColor = 'text-red-500';
                                                    } else if (numVal > refInfo.max) {
                                                        statusText = 'สูง';
                                                        statusColor = 'text-red-500';
                                                    }
                                                }

                                                return (
                                                    <tr key={key} className="hover:bg-gray-50/5 transition-colors">
                                                        <td className="py-3 font-medium opacity-80">{refInfo.name || key}</td>
                                                        <td className="py-3 text-center font-bold">{value} <span className="text-[10px] font-normal opacity-60">{refInfo.unit}</span></td>
                                                        <td className="py-3 text-center text-xs opacity-50">{refInfo.ref}</td>
                                                        <td className={`py-3 text-right font-bold ${statusColor}`}>{statusText}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            <div className={`p-4 rounded-lg text-sm mb-4 ${theme === 'dark' ? 'bg-slate-900/50 text-gray-300' : 'bg-gray-50 text-gray-700'}`}>
                                <div className="flex items-center gap-1 font-bold mb-2 text-teal-600">
                                    <Activity size={16}/> {isLabResult ? 'บันทึกเพิ่มเติมจากแพทย์:' : 'รายละเอียดการตรวจรักษา:'}
                                </div> 
                                <div className="whitespace-pre-wrap leading-relaxed italic opacity-90">{item.note || 'ไม่มีบันทึกเพิ่มเติม'}</div>
                            </div>
                            
                            {item.file_url && (
                                <a href={item.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all text-xs font-bold shadow-md active:scale-95">
                                    <FileText size={16} /> {isLabResult ? 'ดาวน์โหลดใบรายงานผล (PDF)' : 'เปิดไฟล์แนบผลตรวจ'}
                                </a>
                            )}
                        </div>
                    );
                }) : (
                    <div className={`text-center p-12 rounded-2xl border-dashed border-2 ${theme === 'dark' ? 'border-slate-700 text-gray-500' : 'border-gray-200 text-gray-400'}`}>
                        <AlertCircle className="mx-auto mb-2 opacity-20" size={48}/>
                        <p>ไม่พบประวัติข้อมูลสุขภาพ</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PatientHistory;