import React, { useState, useEffect, useRef } from 'react';
import { 
    Microscope, Loader, FileText, Printer, Save, History, Edit3, Activity, Power, Settings, Camera,
    CheckCircle, Image as ImageIcon, Trash2, ArrowRight, Maximize, X, Upload
} from 'lucide-react';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import { supabase } from '../../supabaseClient'; 
import { getRefRange, REFERENCE_RANGES } from '../../utils/referenceRanges'; 
import logoImg from '../../assets/logo.png'; 

const DoctorSmartLab = ({ theme, patientsList, userProfile }) => {
    
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

    const [isAiRunning, setIsAiRunning] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const serverIp = 'https://punn1403-weltech-backend.hf.space'; 
    const [cameraSource, setCameraSource] = useState('device'); 

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);
    const streamIntervalRef = useRef(null);
    const [isLocalStreamActive, setIsLocalStreamActive] = useState(false);
    const [aiProcessedImage, setAiProcessedImage] = useState(null);

    const [snapHistory, setSnapHistory] = useState([]); 
    const [isReviewMode, setIsReviewMode] = useState(false); 
    const [totalSnappedWBC, setTotalSnappedWBC] = useState(0); 
    const [fullscreenImg, setFullscreenImg] = useState(null);

    const [patientVitals, setPatientVitals] = useState({ idCard: '', bloodType: '', weight: '', height: '', bmi: '' });
    const [labData, setLabData] = useState({ hb: '', hct: '', mcv: '', plt: '', wbc: '', neut: '', lymph: '', mono: '', eo: '', baso: '' });
    const [note, setNote] = useState('');
    const [reporterName, setReporterName] = useState(''); 
    const [reportNumber, setReportNumber] = useState(''); 

    const inChargePatients = patientsList?.filter(p => 
        String(p.doctor_id) === String(userProfile?.id) || 
        String(p.assigned_doctor) === String(userProfile?.id)
    ) || [];

    const getDroidCamDeviceId = async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            const droidCam = videoDevices.find(d => d.label.toLowerCase().includes('droidcam'));
            return droidCam ? droidCam.deviceId : (videoDevices.length > 0 ? videoDevices[0].deviceId : null);
        } catch (error) {
            console.error("Error searching for Camera:", error);
            return null;
        }
    };

    useEffect(() => {
        return () => {
            if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
            if (videoRef.current && videoRef.current.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const processAIResponse = (data) => {
        if (data && data.status === 'success') {
            setLabData(prev => ({
                ...prev,
                neut: (Number(prev.neut) || 0) + (data.wbc_details.Neutrophil || 0),
                lymph: (Number(prev.lymph) || 0) + (data.wbc_details.Lymphocyte || 0),
                mono: (Number(prev.mono) || 0) + (data.wbc_details.Monocyte || 0),
                eo: (Number(prev.eo) || 0) + (data.wbc_details.Eosinophil || 0),
                baso: (Number(prev.baso) || 0) + (data.wbc_details.Basophil || 0),
            }));

            const newTotalInFrame = data.total_wbc || 0;
            setTotalSnappedWBC(prev => prev + newTotalInFrame);

            setSnapHistory(prev => [...prev, {
                image: data.processed_image,
                wbc_count: newTotalInFrame,
                details: data.wbc_details,
                timestamp: new Date().toLocaleTimeString()
            }]);

            setAiProcessedImage(data.processed_image);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setAiLoading(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
            const base64Image = event.target.result;
            try {
                const response = await fetch(`${serverIp}/process-frame`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image: base64Image })
                });
                const data = await response.json();
                processAIResponse(data);
            } catch (error) {
                alert("ไม่สามารถเชื่อมต่อ AI Server ได้");
            } finally {
                setAiLoading(false);
                if (fileInputRef.current) fileInputRef.current.value = "";
            }
        };
        reader.readAsDataURL(file);
    };

    const sendFrameToServer = async () => {
        if (!canvasRef.current || !videoRef.current || aiLoading) return;
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64Image = canvas.toDataURL('image/jpeg', 0.5); 

        try {
            const response = await fetch(`${serverIp}/process-frame`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: base64Image })
            });
            const data = await response.json();
            if (data && data.processed_image) setAiProcessedImage(data.processed_image);
        } catch (error) { console.error("Frame transmission error:", error); }
    };

    const handleSnapAndProcess = async () => {
        if (!canvasRef.current || !videoRef.current) return;
        setAiLoading(true);
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64Image = canvas.toDataURL('image/jpeg', 0.8); 

        try {
            const response = await fetch(`${serverIp}/process-frame`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: base64Image })
            });
            const data = await response.json();
            processAIResponse(data);
        } catch (error) { alert("ไม่สามารถเชื่อมต่อ AI Server ได้"); }
        finally { setAiLoading(false); }
    };

    const resetSessionCount = () => {
        if (window.confirm("ต้องการล้างข้อมูลการนับปัจจุบันใช่หรือไม่?")) {
            setSnapHistory([]);
            setTotalSnappedWBC(0);
            setLabData(prev => ({ ...prev, neut: '', lymph: '', mono: '', eo: '', baso: '' }));
            setAiProcessedImage(null);
        }
    };

    const toggleAiCamera = async () => {
        setAiLoading(true);
        if (cameraSource === 'device') {
            if (!isLocalStreamActive) {
                try {
                    const droidCamId = await getDroidCamDeviceId();
                    const stream = await navigator.mediaDevices.getUserMedia({ 
                        video: droidCamId ? { deviceId: { exact: droidCamId }, width: 1280, height: 720 } : { width: 1280, height: 720 } 
                    });
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        videoRef.current.muted = true;
                        videoRef.current.setAttribute("playsinline", true);
                        await videoRef.current.play();
                        setIsLocalStreamActive(true); setIsAiRunning(true); setAiProcessedImage(null);
                        streamIntervalRef.current = setInterval(sendFrameToServer, 2000); 
                    }
                } catch (err) { alert("ไม่พบกล้อง DroidCam โปรดตรวจสอบการเชื่อมต่อ"); }
            } else {
                if (videoRef.current?.srcObject) videoRef.current.srcObject.getTracks().forEach(t => t.stop());
                clearInterval(streamIntervalRef.current);
                setIsLocalStreamActive(false); setIsAiRunning(false); setAiProcessedImage(null);
            }
            setAiLoading(false); return;
        }
        try {
            const endpoint = isAiRunning ? `${serverIp}/stop-smart-lab` : `${serverIp}/start-smart-lab?source=${encodeURIComponent(cameraSource)}`;
            const response = await fetch(endpoint);
            const data = await response.json();
            if (data.status === 'success' || data.status === 'warning') setIsAiRunning(!isAiRunning);
        } catch (error) { alert("AI Server ขัดข้อง กรุณาลองใหม่ในอีก 1 นาที"); }
        finally { setAiLoading(false); }
    };

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
        setReportNumber(''); setIsSaved(false); setRootId(null); setCurrentRecordId(null); setCurrentVersion(1);
        setSnapHistory([]); setTotalSnappedWBC(0); setIsReviewMode(false);
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
            
            const resultText = isOut ? (num < ref.min ? 'ต่ำ' : 'สูง') : 'ปกติ';
            const resultColor = isOut ? 'red' : 'black';

            return `<tr>
                <td style="padding: 3px 8px; border-bottom: 0.5px dotted #000; font-size: 12pt; font-weight: normal;">${REFERENCE_RANGES[k]?.name || k}</td>
                <td align="center" style="padding: 3px 8px; border-bottom: 0.5px dotted #000; font-size: 12pt; font-weight: normal;">${labData[k] || '-'}</td>
                <td align="center" style="padding: 3px 8px; border-bottom: 0.5px dotted #000; font-size: 12pt; font-weight: normal;">${ref.unit}</td>
                <td align="center" style="padding: 3px 8px; border-bottom: 0.5px dotted #000; font-size: 12pt; font-weight: normal;">${ref.ref}</td>
                <td align="center" style="padding: 3px 8px; border-bottom: 0.5px dotted #000; font-size: 12pt; font-weight: bold; color: ${resultColor};">
                    ${resultText}
                </td>
            </tr>`;
        }).join('');

        return `
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap');
                
                @page { size: A4; margin: 0; }
                * { box-sizing: border-box; }
                
                body { 
                    font-family: 'TH Sarabun New', 'Sarabun', sans-serif; 
                    margin: 0; padding: 0; background: #fff; 
                }

                .page {
                    width: 210mm;
                    height: 297mm;
                    padding: 10mm 15mm 10mm 20mm;
                    margin: 0 auto;
                    display: flex;
                    flex-direction: column;
                    background: white;
                }

                .header-table td { vertical-align: middle; }
                .report-title { font-size: 20pt; font-weight: bold; text-align: center; line-height: 1; }
                
                .info-card {
                    border: 1px solid #000;
                    padding: 8px 12px;
                    margin: 8px 0;
                    font-size: 13pt;
                    line-height: 1.3;
                }

                .lab-table { width: 100%; border-collapse: collapse; }
                .lab-table th { 
                    border-top: 2px solid #000; 
                    border-bottom: 2px solid #000; 
                    padding: 6px; 
                    font-size: 14pt; 
                    font-weight: bold;
                    background-color: #fcfcfc;
                }

                .reference-source {
                    font-size: 10pt;
                    font-style: italic;
                    color: #333;
                    margin: 5px 0;
                }

                .note-section { margin-top: 10px; font-size: 13pt; flex-grow: 1; }
                
                .footer-section { margin-top: auto; padding-bottom: 5mm; }

                .sig-area { font-size: 13pt; line-height: 1.6; }
                .dots { font-weight: normal; letter-spacing: -1px; }

                @media print {
                    body { background: none; }
                    .page { margin: 0; border: none; }
                }
            </style>
        </head>
        <body>
            <div class="page">
                <table class="header-table" width="100%">
                    <tr>
                        <td width="15%">${logoBase64 ? `<img src="${logoBase64}" width="75"/>` : ''}</td>
                        <td width="55%" align="center">
                            <div class="report-title">Hematology Laboratory Report</div>
                            <div style="font-size: 15pt; font-weight: bold;">รายงานผลการตรวจวิเคราะห์เลือด</div>
                        </td>
                        <td width="30%" align="right">
                            <img src="${barcodeImg}" width="140"/><br/>
                            <div style="font-size: 11pt; font-weight: bold; margin-right: 20px;">HN: ${patientHN}</div>
                        </td>
                    </tr>
                </table>

                <div class="info-card">
                    <table width="100%">
                        <tr>
                            <td width="55%"><b>ชื่อ-สกุล :</b> ${patientName}</td>
                            <td width="45%"><b>โรงพยาบาลเทคโนโลยีพระจอมเกล้าพระนครเหนือ</b></td>
                        </tr>
                        <tr>
                            <td><b>H.N. :</b> ${patientHN} &nbsp;&nbsp; <b>เลขบัตรประชาชน :</b> ${p?.id_card || '-'}</td>
                            <td>ห้องปฏิบัติการเทคนิคการแพทย์</td>
                        </tr>
                        <tr>
                            <td><b>อายุ :</b> ${age} ปี &nbsp; <b>เพศ :</b> ${gender} &nbsp; <b>หมู่เลือด :</b> ${p?.blood_group || '-'}</td>
                            <td><b>ใบรายงานผลหมายเลข :</b> ${reportNumber}</td>
                        </tr>
                        <tr>
                            <td><b>น้ำหนัก :</b> ${p?.weight || '-'} กก. &nbsp; <b>ส่วนสูง :</b> ${p?.height || '-'} ซม. &nbsp; <b>BMI :</b> ${(p?.weight / ((p?.height / 100) ** 2)).toFixed(2)}</td>
                            <td><b>วันที่ตรวจ :</b> ${today} &nbsp; <b>เวลา :</b> ${time} น.</td>
                        </tr>
                        <tr>
                            <td colspan="2"><b>แพทย์ผู้สั่งตรวจ :</b> ${inChargeDoctor}</td>
                        </tr>
                    </table>
                </div>

                <table class="lab-table">
                    <thead>
                        <tr>
                            <th align="left">รายการตรวจ (Test)</th>
                            <th width="15%">ผลตรวจ</th>
                            <th width="15%">หน่วย</th>
                            <th width="20%">ค่ามาตรฐาน</th>
                            <th width="15%">แปลผล</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>

                <div class="reference-source">
                    แหล่งอ้างอิงเกณฑ์มาตรฐาน: สมาคมโลหิตวิทยาแห่งประเทศไทย
                </div>
                
                <div class="note-section">
                    <b>บันทึกเพิ่มเติมจากแพทย์ :</b>
                    <div style="padding-left: 10px; padding-top: 2px; font-size: 12pt;">${note || '-'}</div>
                </div>

                <div class="footer-section">
                    <table width="100%">
                        <tr>
                            <td width="35%" align="center">
                                <img src="${qrCodeImg}" width="95"/><br/>
                                <span style="font-size: 10pt;">สแกนตรวจสอบออนไลน์</span>
                            </td>
                            <td align="right" class="sig-area">
                                <b>ผู้รายงานผล :</b> <span class="dots">.................................................................................</span><br/>
                                <span style="margin-right: 35px;">( ${reporterName} )</span><br/><br/>
                                <b>ผู้ตรวจสอบผล :</b> <span class="dots">.................................................................................</span><br/>
                                <span style="margin-right: 35px;">( ${userProfile?.title_th || 'นพ.'}${userProfile?.first_name_th || ''} ${userProfile?.last_name_th || ''} )</span>
                            </td>
                        </tr>
                    </table>
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
                    patient_id: selectedPatient, reporter_name: reporterName, report_number: reportNumber,
                    lab_data: labData, vitals_data: patientVitals, note, version: currentVersion, root_id: rootId 
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
                setIsSaved(true); alert("บันทึกสำเร็จ ท่านสามารถพิมพ์รายงานได้"); fetchHistory(selectedPatient); 
            } catch (err) { alert("เกิดข้อผิดพลาดในการบันทึก: " + err.message); } finally { setIsSaving(false); }
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
            
            {fullscreenImg && (
                <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
                    <button onClick={() => setFullscreenImg(null)} className="absolute top-6 right-6 p-3 bg-rose-600 text-white rounded-full shadow-xl hover:scale-110 transition-transform"><X size={28}/></button>
                    <img src={fullscreenImg} className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" alt="Zoom"/>
                </div>
            )}

            <div className={`p-4 sm:p-6 rounded-2xl shadow-md border flex flex-col gap-4 transition-all ${theme === 'dark' ? 'bg-slate-800 border-slate-700 shadow-slate-950' : 'bg-white border-gray-100'}`}>
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2"><Microscope className="text-rose-500" size={24}/> Smart Lab AI (Monitor)</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`w-2 h-2 rounded-full ${isAiRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
                            <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'opacity-70'}`}>{isAiRunning ? `Online: ระบบพร้อมทำงาน` : 'AI Service: Standby'}</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                        <button onClick={() => fileInputRef.current.click()} className="flex-1 lg:flex-none px-4 py-2 bg-[#B0075D] text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all text-sm border-none shadow-md">
                            <Upload size={18}/> นำเข้ารูปภาพ
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />

                        {isAiRunning && (
                            <button onClick={handleSnapAndProcess} disabled={aiLoading} className="flex-1 lg:flex-none px-6 py-2 bg-rose-600 text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-rose-700 shadow-lg animate-bounce text-sm"><Camera size={18}/> {aiLoading ? 'กำลังนับ...' : 'Snap & คำนวณยอด'}</button>
                        )}
                        <button onClick={toggleAiCamera} disabled={aiLoading} className={`flex-1 lg:flex-none px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-all border text-sm ${isAiRunning ? 'bg-amber-100 border-amber-500 text-amber-700 hover:bg-amber-200' : 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-700 shadow-md'}`}>
                            {aiLoading ? <Loader className="animate-spin" size={16}/> : <Power size={16}/>}
                            <span className="whitespace-nowrap">{isAiRunning ? 'ปิดกล้อง AI' : 'เปิดกล้อง AI'}</span>
                        </button>
                        <div className="flex bg-gray-100 dark:bg-slate-700 p-1 rounded-lg w-full sm:w-auto">
                            <button onClick={() => { setActiveSubTab('form'); setIsReviewMode(false); }} className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-bold transition-all ${(activeSubTab === 'form' && !isReviewMode) ? 'bg-blue-500 text-white shadow-md' : 'text-gray-500 dark:text-slate-400'}`}>หน้าหลัก</button>
                            <button onClick={() => setActiveSubTab('history')} className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeSubTab === 'history' ? 'bg-blue-500 text-white shadow-md' : 'text-gray-500 dark:text-slate-400'}`}>ประวัติ</button>
                        </div>
                    </div>
                </div>

                {snapHistory.length > 0 && (
                    <div className={`p-3 rounded-xl border flex flex-col sm:flex-row justify-between items-center gap-3 ${totalSnappedWBC >= 100 ? 'bg-green-500/10 border-green-500/30' : 'bg-indigo-500/5 border-indigo-500/10'}`}>
                        <div className="flex items-center gap-3">
                            <div className="text-sm font-bold">WBC Accumulation: <span className="text-lg text-rose-500">{totalSnappedWBC}</span> / 100</div>
                            {totalSnappedWBC >= 100 && <span className="flex items-center gap-1 text-[10px] font-black text-green-600 bg-white px-2 py-0.5 rounded-full uppercase"><CheckCircle size={10}/> Complete Standard</span>}
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <button onClick={() => setIsReviewMode(true)} className="flex-1 sm:flex-none px-3 py-1.5 bg-indigo-500 text-white rounded-md text-xs font-bold flex items-center gap-2"><ImageIcon size={14}/> ตรวจทานภาพ ({snapHistory.length})</button>
                            <button onClick={resetSessionCount} className="px-3 py-1.5 border border-rose-200 text-rose-500 rounded-md text-xs font-bold hover:bg-rose-50"><Trash2 size={14}/></button>
                        </div>
                    </div>
                )}

                {!isAiRunning && (
                    <div className="flex items-center gap-2 p-3 bg-blue-500/5 rounded-xl border border-blue-500/10">
                        <Camera size={14} className="text-indigo-500"/>
                        <span className="text-[10px] font-bold uppercase opacity-50">เลือกช่องทาง Monitor:</span>
                        <select value={cameraSource} onChange={e => setCameraSource(e.target.value)} className="bg-transparent text-xs outline-none cursor-pointer font-bold flex-1">
                            <option value="device">กล้องมือถือ (DroidCam)</option>
                            <option value="1">กล้องจุลทรรศน์</option>
                            <option value="0">กล้องคอมพิวเตอร์</option>
                        </select>
                    </div>
                )}
            </div>

            {!isReviewMode ? (
                <>
                    <div className={`relative w-full max-w-2xl mx-auto aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border-4 border-indigo-500/50 mb-4 ${isLocalStreamActive ? 'block' : (aiProcessedImage ? 'block' : 'hidden')}`}>
                        <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover absolute top-0 left-0 z-0 transition-opacity duration-300 ${aiProcessedImage ? 'opacity-0' : 'opacity-100'}`} />
                        {aiProcessedImage && (
                            <div className="absolute inset-0 z-10">
                                <img src={aiProcessedImage} alt="AI" className="w-full h-full object-cover" />
                                <button onClick={() => setFullscreenImg(aiProcessedImage)} className="absolute bottom-4 right-4 p-2 bg-black/50 text-white rounded-lg backdrop-blur-sm hover:bg-indigo-600 transition-colors"><Maximize size={20}/></button>
                            </div>
                        )}
                        <canvas ref={canvasRef} width="640" height="480" className="hidden" />
                        <div className="absolute top-4 left-4 bg-rose-600 text-white text-[10px] px-3 py-1 rounded-full animate-pulse font-bold z-20">AI MONITORING ACTIVE</div>
                    </div>

                    {activeSubTab === 'form' && (
                        <div className="flex flex-col xl:flex-row gap-4 sm:gap-6 animate-fade-in pb-10">
                            <div className={`flex-1 p-4 sm:p-6 rounded-2xl border transition-all ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div className="w-full">
                                        <label className={`text-xs font-bold block mb-1.5 ${theme === 'dark' ? 'text-teal-400' : 'text-teal-600'}`}>เลือกผู้ป่วยในการดูแล *</label>
                                        <select className={`w-full p-2.5 border rounded-lg font-bold outline-none text-sm ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} value={selectedPatient} onChange={e => setSelectedPatient(e.target.value)}>
                                            <option value="">-- เลือกผู้ป่วย ({inChargePatients.length} รายชื่อ) --</option>
                                            {inChargePatients.map(p => <option key={p.id} value={p.id}>{p.name} (HN: {p.hn})</option>)}
                                        </select>
                                    </div>
                                    <div className="w-full">
                                        <label className={`text-xs font-bold block mb-1.5 ${theme === 'dark' ? 'text-teal-400' : 'text-teal-600'}`}>ใบรายงานผลหมายเลข *</label>
                                        <input placeholder="เช่น HT0003/69" value={reportNumber} onChange={e => setReportNumber(e.target.value)} className={`w-full p-2.5 border rounded-lg font-bold outline-none text-sm ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}/>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12">
                                    <div className="space-y-3">
                                        <h5 className="font-bold text-rose-500 border-b pb-2 text-sm flex items-center gap-2 border-rose-500/20"><Activity size={16}/> RBC Series</h5>
                                        {['hb', 'hct', 'mcv', 'plt'].map(k => (
                                            <div key={k} className="flex justify-between items-center text-sm gap-4">
                                                <span className={theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}>{REFERENCE_RANGES[k]?.name}</span>
                                                <div className="flex items-center gap-2">
                                                    <input type="number" value={labData[k]} onChange={e => setLabData({...labData, [k]: e.target.value})} className={`w-20 sm:w-24 p-2 border rounded-md text-center font-bold outline-none ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}/>
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
                                                    <input type="number" value={labData[k]} onChange={e => setLabData({...labData, [k]: e.target.value})} className={`w-20 sm:w-24 p-2 border rounded-md text-center font-bold outline-none ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'} ${['neut','lymph','mono','eo','baso'].includes(k) ? 'border-indigo-200 bg-indigo-50/50' : ''}`}/>
                                                    <span className="text-[10px] text-gray-400 w-8">{REFERENCE_RANGES[k]?.unit}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className={`text-xs font-bold block mb-1.5 ${theme === 'dark' ? 'text-slate-500' : 'text-gray-400'}`}>บันทึกเพิ่มเติมจากแพทย์</label>
                                        <textarea rows="2" value={note} onChange={e => setNote(e.target.value)} className={`w-full p-2.5 border rounded-lg outline-none text-sm ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300'}`}/>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-rose-500 block mb-1.5">ผู้รายงานผล *</label>
                                        <input placeholder="ชื่อ-นามสกุล เจ้าหน้าที่" value={reporterName} onChange={e => setReporterName(e.target.value)} className={`w-full p-2.5 border rounded-lg font-bold outline-none text-sm ${theme === 'dark' ? 'bg-slate-700 border-rose-900/50 text-white' : 'border-rose-300 bg-white'}`}/>
                                    </div>
                                </div>
                            </div>

<div className="xl:w-1/4 flex flex-col sm:flex-row xl:flex-col gap-3 items-center xl:items-stretch">
    <button 
        onClick={() => handleAction('save')} 
        disabled={isSaving || !isFormComplete} 
        className={`w-full max-w-[200px] xl:max-w-none py-2 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all text-sm ${
            isFormComplete 
            ? 'bg-teal-600 text-white hover:bg-teal-700 active:scale-95' 
            : (theme === 'dark' ? 'bg-slate-800 text-slate-600 border border-slate-700' : 'bg-gray-200 text-gray-400')
        }`}
    >
        {isSaving ? <Loader className="animate-spin" size={16}/> : <Save size={16}/>} 
        <span>บันทึกผล</span>
    </button>
    
    <button 
        onClick={() => handleAction('doc')} 
        disabled={!isSaved || !isFormComplete} 
        className={`w-full max-w-[200px] xl:max-w-none py-2 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md transition-all text-sm ${
            isSaved && isFormComplete 
            ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95' 
            : (theme === 'dark' ? 'bg-slate-800 text-slate-600 border border-slate-700' : 'bg-gray-200 text-gray-400')
        }`}
    >
        <FileText size={16}/> <span>พิมพ์ผล Doc</span>
    </button>
    
    <button 
        onClick={() => handleAction('pdf')} 
        disabled={!isSaved || !isFormComplete} 
        className={`w-full max-w-[200px] xl:max-w-none py-2 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md transition-all text-sm ${
            isSaved && isFormComplete 
            ? 'bg-red-500 text-white hover:bg-red-600 active:scale-95' 
            : (theme === 'dark' ? 'bg-slate-800 text-slate-600 border border-slate-700' : 'bg-gray-200 text-gray-400')
        }`}
    >
        <Printer size={16}/> <span>พิมพ์ผล PDF</span>
    </button>

    {totalSnappedWBC >= 100 && (
        <button 
            onClick={() => setIsReviewMode(true)} 
            className="w-full max-w-[200px] xl:max-w-none py-2.5 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 animate-pulse shadow-xl text-xs"
        >
            <ImageIcon size={16}/> ตรวจทานภาพ WBC <ArrowRight size={14}/>
        </button>
    )}
</div>
                        </div>
                    )}
                </>
            ) : (
                <div className={`p-4 sm:p-6 rounded-2xl border animate-in slide-in-from-bottom-4 duration-300 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-xl'}`}>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold flex items-center gap-2 text-indigo-500"><ImageIcon /> ตรวจทานภาพ (Review Mode)</h3>
                        <button onClick={() => setIsReviewMode(false)} className="px-4 py-2 bg-gray-500 text-white rounded-lg font-bold">กลับสู่โหมดกล้อง</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                        {snapHistory.map((item, idx) => (
                            <div key={idx} className="group relative border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                <div className="absolute top-2 left-2 z-20 bg-black/60 text-white text-[10px] px-2 py-1 rounded backdrop-blur-sm">#{idx+1} | {item.timestamp} | พบ WBC: {item.wbc_count}</div>
                                <img src={item.image} className="w-full aspect-video object-cover" alt="History"/>
                                <button onClick={() => setFullscreenImg(item.image)} className="absolute inset-0 z-10 flex items-center justify-center bg-indigo-600/0 group-hover:bg-indigo-600/40 transition-all opacity-0 group-hover:opacity-100"><Maximize size={32} className="text-white"/></button>
                            </div>
                        ))}
                    </div>
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-2xl border border-indigo-100 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div><h4 className="font-bold text-indigo-600">สรุปการสะสมยอด: {totalSnappedWBC} เซลล์</h4><p className="text-xs opacity-50">ตรวจสอบชนิดเม็ดเลือดขาวในตารางฟอร์มหลักก่อนบันทึก</p></div>
                        <button onClick={() => { setIsReviewMode(false); setActiveSubTab('form'); }} className="px-8 py-2 bg-teal-600 text-white rounded-xl font-bold shadow-lg shadow-teal-600/20">ไปที่หน้าบันทึกผล</button>
                    </div>
                </div>
            )}

            {activeSubTab === 'history' && (
                <div className={`p-4 sm:p-6 rounded-2xl border min-h-[400px] shadow-sm transition-all ${theme === 'dark' ? 'bg-slate-800 border-slate-700 shadow-slate-950' : 'bg-white border-gray-100'}`}>
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
                                            <div className={`font-bold text-sm sm:text-base flex items-center gap-2 truncate ${theme === 'dark' ? 'text-slate-100' : 'text-gray-800'}`}>{item.report_number} {isLatest && <span className="text-blue-500 text-[10px] font-black animate-pulse">(ล่าสุด)</span>}</div>
                                            <div className="text-[11px] sm:text-xs text-gray-500 mt-1 flex flex-wrap items-center gap-1"><span>{dateObj.toLocaleDateString('th-TH')}</span><span className="text-gray-300">|</span><span className="text-blue-500">{dateObj.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</span></div>
                                            <div className={`text-[10px] mt-1 truncate ${theme === 'dark' ? 'text-slate-500' : 'text-gray-400'}`}>โดย: {item.reporter_name}</div>
                                        </div>
                                        <button onClick={() => { setLabData(item.lab_data); setReportNumber(item.report_number); setPatientVitals(item.vitals_data); setNote(item.note); setReporterName(item.reporter_name); setRootId(item.root_id || item.id); setCurrentRecordId(item.id); setCurrentVersion(item.version + 1); setActiveSubTab('form'); setIsSaved(true); }} className={`ml-4 p-2.5 rounded-full shadow-sm ${theme === 'dark' ? 'bg-slate-700 text-blue-400 hover:bg-slate-600' : 'bg-white text-blue-500 hover:bg-blue-100'}`}><Edit3 size={18}/></button>
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