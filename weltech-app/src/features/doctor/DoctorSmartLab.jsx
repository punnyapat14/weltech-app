import React, { useState, useEffect, useRef } from 'react';
import { 
    Microscope, Loader, FileText, Printer, Save, History, Edit3, Activity, Power, Settings, Camera
} from 'lucide-react';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import { supabase } from '../../supabaseClient'; 
import { getRefRange, REFERENCE_RANGES } from '../../utils/referenceRanges'; 
import logoImg from '../../assets/logo.png'; 

const DoctorSmartLab = ({ theme, patientsList, userProfile }) => {
    // --- UI & Data State ---
    const [activeSubTab, setActiveSubTab] = useState('form'); 
    const [isSaving, setIsSaving] = useState(false);
    const [historyList, setHistoryList] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState('');
    const [isPregnant, setIsPregnant] = useState(false); 
    const [logoBase64, setLogoBase64] = useState('');
    const [currentVersion, setCurrentVersion] = useState(1);
    const [rootId, setRootId] = useState(null);
    const [currentRecordId, setCurrentRecordId] = useState(null); 
    const [isSaved, setIsSaved] = useState(false);

    // --- AI Server & Network State ---
    const [isAiRunning, setIsAiRunning] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const serverIp = 'https://weltech-app.onrender.com'; // ล็อค URL ตามที่จองไว้
    const [cameraSource, setCameraSource] = useState('device'); 

    // --- Local Stream State สำหรับการ Monitor บนคอมพิวเตอร์ ---
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamIntervalRef = useRef(null);
    const [isLocalStreamActive, setIsLocalStreamActive] = useState(false);
    
    // State ใหม่สำหรับเก็บภาพที่รับกลับมาจาก AI Server
    const [aiProcessedImage, setAiProcessedImage] = useState(null);

    const [patientVitals, setPatientVitals] = useState({ idCard: '', bloodType: '', weight: '', height: '', bmi: '' });
    const [labData, setLabData] = useState({ hb: '', hct: '', mcv: '', plt: '', wbc: '', neut: '', lymph: '', mono: '', eo: '', baso: '' });
    const [note, setNote] = useState('');
    const [reporterName, setReporterName] = useState(''); 
    const [reportNumber, setReportNumber] = useState(''); 

    const inChargePatients = patientsList?.filter(p => 
        String(p.doctor_id) === String(userProfile?.id) || 
        String(p.assigned_doctor) === String(userProfile?.id)
    ) || [];

    // --- ฟังก์ชันค้นหา ID ของ DroidCam ในเครื่องคอมพิวเตอร์ ---
    const getDroidCamDeviceId = async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            
            const droidCam = videoDevices.find(d => d.label.toLowerCase().includes('droidcam'));
            if (droidCam) return droidCam.deviceId;
            
            return videoDevices.length > 0 ? videoDevices[0].deviceId : null;
        } catch (error) {
            console.error("Error searching for Camera:", error);
            return null;
        }
    };

    // ล้าง Interval และปิดสตรีมกล้องเมื่อปิดหน้าจอเพื่อไม่ให้กล้องค้าง
    useEffect(() => {
        return () => {
            if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
            if (videoRef.current && videoRef.current.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // --- ฟังก์ชันส่งภาพจากเบราว์เซอร์ไปยัง Server และรับภาพกลับมา ---
    const sendFrameToServer = async () => {
        if (!canvasRef.current || !videoRef.current) return;
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const ctx = canvas.getContext('2d');
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64Image = canvas.toDataURL('image/jpeg', 0.5); 

        try {
            // ส่งภาพไปให้โมเดล YOLOv26 บน Backend ประมวลผล
            const response = await fetch(`${serverIp}/process-frame`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: base64Image })
            });
            
            const data = await response.json();
            
            // อัปเดตภาพที่มีกรอบ Bounding Box กลับมาแสดงผล
            if (data && data.processed_image) {
                setAiProcessedImage(data.processed_image);
            }
        } catch (error) {
            console.error("Frame transmission error:", error);
        }
    };

    // --- ฟังก์ชัน toggleAiCamera ---
    const toggleAiCamera = async () => {
        setAiLoading(true);

        if (cameraSource === 'device') {
            if (!isLocalStreamActive) {
                try {
                    const droidCamId = await getDroidCamDeviceId();
                    const constraints = { 
                        video: droidCamId 
                            ? { deviceId: { exact: droidCamId }, width: { ideal: 1280 }, height: { ideal: 720 } }
                            : { width: { ideal: 1280 }, height: { ideal: 720 } } 
                    };

                    const stream = await navigator.mediaDevices.getUserMedia(constraints);
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        
                        videoRef.current.muted = true;
                        videoRef.current.setAttribute("playsinline", true);
                        
                        try {
                            await videoRef.current.play();
                        } catch (playErr) {
                            console.error("Video play error:", playErr);
                        }

                        setIsLocalStreamActive(true);
                        setIsAiRunning(true);
                        
                        // เริ่มส่งเฟรมและเคลียร์ภาพเก่า
                        setAiProcessedImage(null);
                        streamIntervalRef.current = setInterval(sendFrameToServer, 2000); 
                    }
                } catch (err) {
                    console.error("Camera access error:", err);
                    alert("ไม่พบกล้องภายนอก (DroidCam) โปรดตรวจสอบว่าคุณได้กด Start ในโปรแกรม DroidCam บนคอมพิวเตอร์แล้ว");
                }
            } else {
                if (videoRef.current && videoRef.current.srcObject) {
                    videoRef.current.srcObject.getTracks().forEach(track => track.stop());
                }
                clearInterval(streamIntervalRef.current);
                setIsLocalStreamActive(false);
                setIsAiRunning(false);
                setAiProcessedImage(null); // เคลียร์ภาพ AI เมื่อปิดกล้อง
            }
            setAiLoading(false);
            return;
        }

        const endpoint = isAiRunning 
            ? `${serverIp}/stop-smart-lab` 
            : `${serverIp}/start-smart-lab?source=${encodeURIComponent(cameraSource)}`;

        try {
            const response = await fetch(endpoint);
            const data = await response.json();
            if (data.status === 'success' || data.status === 'warning') {
                setIsAiRunning(!isAiRunning);
            }
        } catch (error) {
            alert("ไม่สามารถเชื่อมต่อกับ AI Server ได้ กรุณารอเซิร์ฟเวอร์ Render ตื่นประมาณ 1 นาที");
        } finally {
            setAiLoading(false);
        }
    };

    // --- Logic การจัดการข้อมูล ---
    const logActivity = async (action, patientObj, details = '') => {
        try {
            const actor = `${userProfile?.title_th || ''}${userProfile?.first_name_th || ''} ${userProfile?.last_name_th || ''}`.trim();
            await supabase.from('audit_logs').insert([{
                action_type: action, actor_id: userProfile?.id, actor_name: actor,
                patient_name: patientObj?.name || 'Unknown', patient_hn: patientObj?.hn || 'N/A', details: details
            }]);
        } catch (error) { console.error("Audit log failed:", error); }
    };

    const isFormComplete = selectedPatient && reportNumber.trim() !== '' && reporterName.trim() !== '' && 
        Object.values(labData).every(val => val !== undefined && val !== null && val.toString().trim() !== '');

    const getPatient = () => patientsList?.find(p => p.user_id === selectedPatient || p.id === selectedPatient);
    const checkIsFemale = () => getPatient()?.title_th?.includes('นาง') || getPatient()?.gender === 'female';

    useEffect(() => {
        const convertLogo = async () => {
            try {
                const response = await fetch(logoImg);
                const blob = await response.blob();
                const reader = new FileReader(); 
                reader.onloadend = () => setLogoBase64(reader.result); 
                reader.readAsDataURL(blob);
            } catch (e) { console.error(e); }
        };
        convertLogo();
    }, []);

    useEffect(() => {
        if (patientVitals.weight && patientVitals.height) {
            setPatientVitals(prev => ({ ...prev, bmi: (patientVitals.weight / ((patientVitals.height / 100) ** 2)).toFixed(2) }));
        }
    }, [patientVitals.weight, patientVitals.height]);

    useEffect(() => {
        if (!selectedPatient) return;
        const p = getPatient();
        setPatientVitals({ idCard: p?.id_card || '', bloodType: p?.blood_group || '', weight: p?.weight || '', height: p?.height || '', bmi: '' });
        setLabData(Object.keys(labData).reduce((acc, k) => ({ ...acc, [k]: '' }), {}));
        setReportNumber('');
        setIsSaved(false); 
        setRootId(null);
        setCurrentRecordId(null); 
        setCurrentVersion(1);
        fetchHistory(selectedPatient); 
    }, [selectedPatient]);

    const fetchHistory = async (id) => {
        if (!id) return;
        const { data } = await supabase.from('lab_results').select('*').eq('patient_id', id).order('created_at', { ascending: false });
        if (data) setHistoryList(data);
    };

    const generateBarcode = (text) => {
        const canvas = document.createElement("canvas");
        JsBarcode(canvas, text, { format: "CODE128", width: 2.2, height: 60, displayValue: false }); 
        return canvas.toDataURL("image/png");
    };

    const getInChargeDoctor = () => getPatient()?.doctor_name || getPatient()?.doctor_in_charge || 
        `${userProfile?.title_th || 'นพ.'} ${userProfile?.first_name_th || ''} ${userProfile?.last_name_th || ''}`.trim();

    // --- แก้ไขโครงสร้าง HTML ให้แสดงผลตารางได้ถูกต้อง ---
    const getReportHtml = (barcodeImg = '', qrCodeImg = '') => {
        const p = getPatient();
        const patientHN = p?.hn || 'Unknown';
        const patientName = p?.name || `${p?.title_th || ''} ${p?.first_name_th || ''} ${p?.last_name_th || ''}`.trim();
        const age = p?.dob ? Math.abs(new Date(Date.now() - new Date(p.dob).getTime()).getUTCFullYear() - 1970) : 0;
        const gender = checkIsFemale() ? 'หญิง' : 'ชาย';
        const today = new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
        const time = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
        const inChargeDoctor = getInChargeDoctor();

        const rows = Object.keys(labData).map(k => {
            const ref = getRefRange(k, age, checkIsFemale() ? 'female' : 'male', isPregnant);
            const num = parseFloat(labData[k]);
            const isOut = !isNaN(num) && (num < ref.min || num > ref.max);
            return `<tr style="font-size: 12pt;">
                <td style="padding: 5px; border-bottom: 1px dotted #ccc;">${REFERENCE_RANGES[k]?.name || k}</td>
                <td align="left" style="padding: 5px; border-bottom: 1px dotted #ccc;">${labData[k] || '-'}</td>
                <td align="left" style="padding: 5px; border-bottom: 1px dotted #ccc;">${ref.unit}</td>
                <td align="left" style="padding: 5px; border-bottom: 1px dotted #ccc; font-size: 12pt;">${ref.ref}</td>
                <td align="left" style="padding: 5px; border-bottom: 1px dotted #ccc; color: ${isOut ? 'red' : 'black'}; font-weight: bold;">${isOut ? (num < ref.min ? 'ต่ำ' : 'สูง') : 'ปกติ'}</td>
            </tr>`;
        }).join('');

        return `<html>
        <head>
            <meta charset="utf-8">
            <style>
                @page { size: A4; margin: 0; } 
                @media print { 
                    body { margin: 0; padding: 0; } 
                    .page-container { width: 210mm; height: 297mm; padding: 1.5cm 2.0cm 1.5cm 3.0cm; box-sizing: border-box; page-break-after: always; } 
                } 
                body { font-family: 'TH Sarabun New', sans-serif; background: #f0f0f0; margin: 0; display: flex; justify-content: center; } 
                .page-container { background: white; width: 210mm; min-height: 297mm; padding: 1.5cm 2.0cm 1.5cm 3.0cm; box-sizing: border-box; box-shadow: 0 0 10px rgba(0,0,0,0.1); } 
                table { width: 100%; border-collapse: collapse; } 
                .lab-table { width: 100%; margin-top: 20px; }
                .lab-table th { padding: 6px 4px; border-top: 1.5px solid #000; border-bottom: 1.5px solid #000; text-align: left; font-size: 12pt; background: #fafafa; } 
                .info-box { margin: 10px 0; font-size: 12.5pt; border: 0.5px solid #ccc; padding: 12px; border-radius: 4px; line-height: 1.3; } 
                .note-box { margin-top: 10px; border: 1px dashed #aaa; padding: 8px 12px; border-radius: 4px; font-size: 12pt; min-height: 50px; }
            </style>
        </head>
        <body>
            <div class="page-container">
                <table width="100%">
                    <tr>
                        <td width="15%" valign="middle">${logoBase64 ? `<img src="${logoBase64}" width="80"/>` : ''}</td>
                        <td width="55%" align="center" valign="middle">
                            <div style="font-size: 20pt; font-weight: bold;">รายงานผลการตรวจวิเคราะห์เลือด</div>
                            <div style="font-size: 16pt;">Hematology Laboratory Report</div>
                        </td>
                        <td width="30%" align="right" valign="top">
                            <div style="display: inline-block; text-align: center;">
                                <img src="${barcodeImg}" width="170"/>
                                <div style="font-size: 11pt; font-weight: bold; margin-top: 2px;">HN: ${patientHN}</div>
                            </div>
                        </td>
                    </tr>
                </table>
                <div class="info-box">
                    <p><strong>ชื่อ-สกุล:</strong> ${patientName} <strong>อายุ:</strong> ${age} ปี <strong>เพศ:</strong> ${gender}</p>
                    <p><strong>แพทย์ผู้ดูแล:</strong> ${inChargeDoctor}</p>
                    <p><strong>วันที่พิมพ์รายงาน:</strong> ${today} <strong>เวลา:</strong> ${time}</p>
                </div>
                <table class="lab-table">
                    <thead>
                        <tr>
                            <th>รายการตรวจ (Test)</th>
                            <th>ผลลัพธ์ (Result)</th>
                            <th>หน่วย (Unit)</th>
                            <th>ค่าอ้างอิง (Ref. Range)</th>
                            <th>แปลผล</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
                <div class="note-box">
                    <strong>บันทึกเพิ่มเติมจากแพทย์:</strong><br/>
                    ${note || '-'}
                </div>
            </div>
        </body>
        </html>`;
    };

    const handleAction = async (type) => {
        const p = getPatient();
        if (type === 'save') {
            setIsSaving(true);
            try {
                const payload = { 
                    patient_id: selectedPatient, 
                    reporter_name: reporterName, 
                    report_number: reportNumber,
                    lab_data: labData, 
                    vitals_data: patientVitals, 
                    note, 
                    version: currentVersion, 
                    root_id: rootId 
                };
                if (currentRecordId) payload.id = currentRecordId;

                const { data, error } = await supabase.from('lab_results').upsert(payload).select().single();
                if (error) throw error;
                if (!rootId && data) {
                    await supabase.from('lab_results').update({ root_id: data.id }).eq('id', data.id);
                    setRootId(data.id);
                }
                setCurrentRecordId(data.id); 
                await logActivity('SAVE_RESULT', p, `บันทึก Ver ${currentVersion} เลขที่ ${reportNumber}`);
                setIsSaved(true); 
                alert("บันทึกสำเร็จ ท่านสามารถพิมพ์รายงานได้");
                fetchHistory(selectedPatient); 
            } catch (err) {
                alert("เกิดข้อผิดพลาดในการบันทึก: " + err.message);
            } finally { setIsSaving(false); }
        } else {
            const barcode = generateBarcode(p?.hn || '000');
            const qr = await QRCode.toDataURL(`${window.location.origin}/patient/history?id=${selectedPatient}`, { width: 180 });
            const content = getReportHtml(barcode, qr);
            if (type === 'pdf') {
                const win = window.open('', '_blank');
                win.document.write(content); win.document.close();
                setTimeout(() => win.print(), 800);
            } else {
                const link = document.createElement('a');
                link.href = URL.createObjectURL(new Blob(['\ufeff', content], { type: 'application/msword' }));
                link.download = `LabReport_${p?.hn}_${reportNumber}.doc`; link.click();
            }
        }
    };

    return (
        <div className={`flex flex-col h-full gap-4 p-2 sm:p-4 overflow-y-auto transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
            <div className={`p-4 sm:p-6 rounded-2xl shadow-md border flex flex-col gap-4 transition-all ${theme === 'dark' ? 'bg-slate-800 border-slate-700 shadow-slate-950' : 'bg-white border-gray-100'}`}>
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                            <Microscope className="text-rose-500" size={24}/> Smart Lab AI (Monitor)
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`w-2 h-2 rounded-full ${isAiRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
                            <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'opacity-70'}`}>
                                {isAiRunning ? `Online: ระบบพร้อมทำงาน` : 'AI Service: Standby'}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                        <button 
                            onClick={toggleAiCamera}
                            disabled={aiLoading}
                            className={`flex-1 lg:flex-none px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-all border text-sm
                            ${isAiRunning ? 'bg-amber-100 border-amber-500 text-amber-700 hover:bg-amber-200' : 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-700 shadow-md'}`}
                        >
                            {aiLoading ? <Loader className="animate-spin" size={16}/> : <Power size={16}/>}
                            <span className="whitespace-nowrap">{isAiRunning ? 'ปิดกล้อง AI' : 'เปิดกล้อง AI'}</span>
                        </button>
                        <div className="flex bg-gray-100 dark:bg-slate-700 p-1 rounded-lg w-full sm:w-auto">
                            <button onClick={() => setActiveSubTab('history')} className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeSubTab === 'history' ? 'bg-blue-500 text-white shadow-md' : 'text-gray-500 dark:text-slate-400'}`}>ประวัติ</button>
                        </div>
                    </div>
                </div>

                {!isAiRunning && (
                    <div className="flex items-center gap-2 p-3 bg-blue-500/5 rounded-xl border border-blue-500/10">
                        <Camera size={14} className="text-indigo-500"/>
                        <span className="text-[10px] font-bold uppercase opacity-50">เลือกช่องทาง Monitor:</span>
                        <select 
                            value={cameraSource} 
                            onChange={e => setCameraSource(e.target.value)}
                            className="bg-transparent text-xs outline-none cursor-pointer font-bold flex-1"
                        >
                            <option value="device">กล้องมือถือ (DroidCam)</option>
                            <option value="1">กล้องจุลทรรศน์</option>
                            <option value="0">กล้องคอมพิวเตอร์</option>
                        </select>
                    </div>
                )}
            </div>

            {/* --- หน้าต่าง Preview ผลลัพธ์บนจอคอมพิวเตอร์ --- */}
                <div className={`relative w-full max-w-2xl mx-auto aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border-4 border-indigo-500/50 mb-4 ${isLocalStreamActive ? 'block' : 'hidden'}`}>
                
                {/* วิดีโอต้นฉบับ (เปลี่ยนจาก hidden เป็น opacity-0 และเพิ่ม absolute z-0) */}
                <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className={`w-full h-full object-cover absolute top-0 left-0 z-0 transition-opacity duration-300 ${aiProcessedImage ? 'opacity-0' : 'opacity-100'}`} 
                />
                
                {/* แสดงภาพที่ AI ประมวลผลและตีกรอบแล้ว (เพิ่ม z-10 ให้อยู่ด้านบน) */}
                {aiProcessedImage && (
                    <img 
                        src={aiProcessedImage} 
                        alt="AI Detected Cells" 
                        className="w-full h-full object-cover absolute top-0 left-0 z-10" 
                    />
                )}
                
                <canvas ref={canvasRef} width="640" height="480" className="hidden" />
                <div className="absolute top-4 left-4 bg-rose-600 text-white text-[10px] px-3 py-1 rounded-full animate-pulse font-bold z-20">
                    AI MONITORING ACTIVE
                </div>
            </div>

            {/* --- Main Content --- */}
            {activeSubTab === 'form' && (
                <div className="flex flex-col xl:flex-row gap-4 sm:gap-6 animate-fade-in pb-10">
                    <div className={`flex-1 p-4 sm:p-6 rounded-2xl border transition-all ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                        {/* ส่วนฟอร์มข้อมูลผู้ป่วย */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div className="w-full">
                                <label className={`text-xs font-bold block mb-1.5 ${theme === 'dark' ? 'text-teal-400' : 'text-teal-600'}`}>เลือกผู้ป่วยในการดูแล *</label>
                                <select 
                                    className={`w-full p-2.5 border rounded-lg font-bold outline-none text-sm ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} 
                                    value={selectedPatient} 
                                    onChange={e => setSelectedPatient(e.target.value)}
                                >
                                    <option value="">-- เลือกผู้ป่วย ({inChargePatients.length} รายชื่อ) --</option>
                                    {inChargePatients.map(p => <option key={p.id} value={p.id}>{p.name} (HN: {p.hn})</option>)}
                                </select>
                            </div>
                            <div className="w-full">
                                <label className={`text-xs font-bold block mb-1.5 ${theme === 'dark' ? 'text-teal-400' : 'text-teal-600'}`}>ใบรายงานผลหมายเลข *</label>
                                <input 
                                    placeholder="เช่น HT0003/69" 
                                    value={reportNumber} 
                                    onChange={e => setReportNumber(e.target.value)} 
                                    className={`w-full p-2.5 border rounded-lg font-bold outline-none text-sm ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                />
                            </div>
                        </div>

                        {/* ส่วนตารางผล Lab */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12">
                            <div className="space-y-3">
                                <h5 className="font-bold text-rose-500 border-b pb-2 text-sm flex items-center gap-2 border-rose-500/20"><Activity size={16}/> RBC Series</h5>
                                {['hb', 'hct', 'mcv', 'plt'].map(k => (
                                    <div key={k} className="flex justify-between items-center text-sm gap-4">
                                        <span className={theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}>{REFERENCE_RANGES[k]?.name}</span>
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="number" 
                                                value={labData[k]} 
                                                onChange={e => setLabData({...labData, [k]: e.target.value})} 
                                                className={`w-20 sm:w-24 p-2 border rounded-md text-center font-bold outline-none ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
                                            />
                                            <span className="text-[10px] text-gray-400 w-8">{REFERENCE_RANGES[k]?.unit}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-3">
                                <h5 className="font-bold text-indigo-500 border-b pb-2 text-sm flex items-center gap-2 border-indigo-500/20"><Activity size={16}/> WBC Series</h5>
                                {['wbc', 'neut', 'lymph', 'mono', 'eo', 'baso'].map(k => (
                                    <div key={k} className="flex justify-between items-center text-sm gap-4">
                                        <span className={theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}>{REFERENCE_RANGES[k]?.name}</span>
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="number" 
                                                value={labData[k]} 
                                                onChange={e => setLabData({...labData, [k]: e.target.value})} 
                                                className={`w-20 sm:w-24 p-2 border rounded-md text-center font-bold outline-none ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
                                            />
                                            <span className="text-[10px] text-gray-400 w-8">{REFERENCE_RANGES[k]?.unit}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={`text-xs font-bold block mb-1.5 ${theme === 'dark' ? 'text-slate-500' : 'text-gray-400'}`}>บันทึกเพิ่มเติมจากแพทย์</label>
                                <textarea 
                                    rows="2" 
                                    value={note} 
                                    onChange={e => setNote(e.target.value)} 
                                    className={`w-full p-2.5 border rounded-lg outline-none text-sm ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-rose-500 block mb-1.5">ผู้รายงานผล *</label>
                                <input 
                                    placeholder="ชื่อ-นามสกุล เจ้าหน้าที่" 
                                    value={reporterName} 
                                    onChange={e => setReporterName(e.target.value)} 
                                    className={`w-full p-2.5 border rounded-lg font-bold outline-none text-sm ${theme === 'dark' ? 'bg-slate-700 border-rose-900/50 text-white' : 'border-rose-300 bg-white'}`}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="xl:w-1/4 flex flex-col sm:flex-row xl:flex-col gap-3">
                        <button onClick={() => handleAction('save')} disabled={isSaving || !isFormComplete} 
                            className={`flex-1 w-full py-3 sm:py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all text-sm sm:text-base
                            ${isFormComplete ? 'bg-teal-600 text-white hover:bg-teal-700' : (theme === 'dark' ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed')}`}>
                            {isSaving ? <Loader className="animate-spin" size={18}/> : <Save size={18}/>} บันทึกผล
                        </button>
                        <button onClick={() => handleAction('doc')} disabled={!isSaved || !isFormComplete}
                            className={`flex-1 w-full py-3 sm:py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md transition-all text-sm sm:text-base
                            ${isSaved && isFormComplete ? 'bg-blue-600 text-white hover:bg-blue-700' : (theme === 'dark' ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed')}`}>
                            <FileText size={18}/> พิมพ์ผล Doc
                        </button>
                        <button onClick={() => handleAction('pdf')} disabled={!isSaved || !isFormComplete}
                            className={`flex-1 w-full py-3 sm:py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md transition-all text-sm sm:text-base
                            ${isSaved && isFormComplete ? 'bg-red-500 text-white hover:bg-red-600' : (theme === 'dark' ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed')}`}>
                            <Printer size={18}/> พิมพ์ผล PDF
                        </button>
                    </div>
                </div>
            )}

            {activeSubTab === 'history' && (
                <div className={`p-4 sm:p-6 rounded-2xl border min-h-[400px] shadow-sm transition-all ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                    <h3 className="font-bold text-lg mb-6 text-blue-500 flex items-center gap-2"><History /> ประวัติการตรวจ</h3>
                    {historyList.length === 0 ? <div className={`text-center py-20 italic ${theme === 'dark' ? 'text-slate-600' : 'opacity-30'}`}>ไม่พบประวัติการตรวจ</div> :
                        <div className="space-y-3">
                            {historyList.map((item, index) => {
                                const dateObj = new Date(item.created_at);
                                const isLatest = index === 0;
                                return (
                                    <div key={item.id} className={`p-4 border rounded-xl flex flex-row justify-between items-center transition-all ${isLatest 
                                        ? (theme === 'dark' ? 'border-blue-900 bg-blue-900/20' : 'border-blue-200 bg-blue-50/30') 
                                        : (theme === 'dark' ? 'border-slate-700 hover:bg-slate-700/50' : 'hover:bg-gray-50')}`}>
                                        <div className="min-w-0 flex-1">
                                            <div className={`font-bold text-sm sm:text-base flex items-center gap-2 truncate ${theme === 'dark' ? 'text-slate-100' : 'text-gray-800'}`}>
                                                {item.report_number} {isLatest && <span className="text-blue-500 text-[10px] font-black animate-pulse">(ล่าสุด)</span>}
                                            </div>
                                            <div className="text-[11px] sm:text-xs text-gray-500 mt-1 flex flex-wrap items-center gap-1">
                                                <span>{dateObj.toLocaleDateString('th-TH')}</span>
                                                <span className="text-gray-300">|</span>
                                                <span className="text-blue-500">{dateObj.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</span>
                                            </div>
                                            <div className={`text-[10px] mt-1 truncate ${theme === 'dark' ? 'text-slate-500' : 'text-gray-400'}`}>โดย: {item.reporter_name}</div>
                                        </div>
                                        <button 
                                            onClick={() => { 
                                                setLabData(item.lab_data); 
                                                setReportNumber(item.report_number); 
                                                setPatientVitals(item.vitals_data); 
                                                setNote(item.note); 
                                                setReporterName(item.reporter_name); 
                                                setRootId(item.root_id || item.id); 
                                                setCurrentRecordId(item.id); 
                                                setCurrentVersion(item.version + 1); 
                                                setActiveSubTab('form'); 
                                                setIsSaved(true); 
                                            }} 
                                            className={`ml-4 p-2.5 rounded-full transition-colors shadow-sm ${theme === 'dark' ? 'bg-slate-700 text-blue-400 hover:bg-slate-600' : 'bg-white text-blue-500 hover:bg-blue-100'}`}
                                        >
                                            <Edit3 size={18}/>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    }
                </div>
            )}
        </div>
    );
};

export default DoctorSmartLab;