import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import {
  User, Key, Moon, Sun, ChevronDown, 
  Loader, MapPin, Mail, Activity, 
  FileText, Stethoscope, Camera, ArrowLeft,
  Home, Calendar, MessageCircle, Users, Clock, Plus, File, Shield, ArrowRight, ClipboardList, Search, Save, Edit2, Phone, Lock, Briefcase, UserCheck, AlertTriangle, Info, CheckCircle, X
} from 'lucide-react';

import projectLogo from './assets/logo.png';
const logoImg = projectLogo;

// --- 0. STYLE INJECTION ---
const fontStyle = document.createElement('style');
fontStyle.innerHTML = `
  @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap');
   
  :root { --font-prompt: 'Prompt', sans-serif; }
   
  * { margin: 0; padding: 0; box-sizing: border-box; font-family: "Prompt", sans-serif !important; text-decoration: none; list-style: none; }
  body, button, input, select, textarea { font-family: "Prompt", sans-serif !important; }

  /* --- THEME COLORS --- */
  :root {
    --theme-primary: #00897B;
    --theme-primary-hover: #00695C;
    --auth-bg-light: #F0FDFA;
    --theme-bg-dark: #0f172a;
    
    --content-bg-light: #ffffff;
    --content-bg-dark: #1e293b;

    --text-light: #334155;
    --text-dark: #f1f5f9;
    
    --input-bg-light: #ffffff;
    --input-border-light: #cbd5e1;
    --input-bg-dark: #334155;
    --input-border-dark: #475569;
    
    --toggle-bg-light: #e2e8f0;
    --toggle-bg-dark: #0f172a;
  }

  body[data-role="doctor"] {
    --theme-primary: #2563eb;
    --theme-primary-hover: #1d4ed8;
    --auth-bg-light: #EFF6FF;
  }

  body[data-role="admin"] {
    --theme-primary: #6b21a8;
    --theme-primary-hover: #581c87;
    --auth-bg-light: #FAF5FF;
  }

  body {
    margin: 0; padding: 0; height: 100vh; width: 100vw;
    overflow-x: hidden;
    background: var(--content-bg-light);
    transition: background-color 0.3s ease, color 0.3s ease;
  }
  body.dark { background: var(--theme-bg-dark); }

  /* FIX: Inputs Colors */
  input, select, textarea {
      color: var(--text-light) !important;
      background-color: var(--input-bg-light) !important;
      border: 1px solid var(--input-border-light) !important;
      transition: all 0.3s ease;
  }
  
  body.dark input, body.dark select, body.dark textarea {
      color: var(--text-dark) !important;
      background-color: var(--input-bg-dark) !important;
      border: 1px solid var(--input-border-dark) !important;
  }
  
  /* Custom Scrollbar for Dropdown */
  .custom-dropdown-scroll::-webkit-scrollbar { width: 6px; }
  .custom-dropdown-scroll::-webkit-scrollbar-track { background: transparent; }
  .custom-dropdown-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
  .custom-dropdown-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

  /* Wrapper & Containers */
  .auth-wrapper {
    display: flex; justify-content: center; align-items: center; min-height: 100vh;
    background: var(--auth-bg-light); transition: background 0.3s ease;
    padding: 20px;
  }
  .auth-wrapper.dark { background: var(--theme-bg-dark); }

  .container {
    position: relative; width: 900px !important; height: 720px !important;
    min-width: 900px; min-height: 720px; flex-shrink: 0;
    background: var(--content-bg-light); border-radius: 30px;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.1); overflow: hidden;
    transition: background-color 0.3s ease;
  }
  .container.dark { background: var(--content-bg-dark); color: var(--text-dark); }

  /* Login/Register Form Logic */
  .form-box {
    position: absolute; right: 0; width: 50%; height: 100%;
    background: var(--content-bg-light); display: flex; flex-direction: column;
    justify-content: center; align-items: center; color: var(--text-light);
    text-align: center; padding: 40px; z-index: 1;
    transition: all 0.6s ease-in-out, background-color 0.3s ease; 
  }
  .container.dark .form-box { background: var(--content-bg-dark); color: var(--text-dark); }
  .container.active .form-box { right: 50%; }

  .form-box.login { opacity: 1; visibility: visible; pointer-events: auto; z-index: 2; }
  .container.active .form-box.login { opacity: 0; visibility: hidden; pointer-events: none; transform: translateX(-20%); }

  .form-box.register { opacity: 0; visibility: hidden; pointer-events: none; z-index: 1; }
  .container.active .form-box.register { opacity: 1; visibility: visible; pointer-events: auto; z-index: 5; }

  .container h1 { font-size: 32px; margin-bottom: 5px; font-weight: 700; }
  .container p { font-size: 14px; margin-bottom: 15px; }

  /* INPUT STYLES */
  .input-box { position: relative; margin: 8px 0; width: 100%; }
  .input-box input {
    width: 100%; padding: 10px 40px 10px 15px;
    border-radius: 10px; 
    outline: none; font-size: 13px; font-weight: 400;
  }
  .input-box input:focus { border-color: var(--theme-primary); box-shadow: 0 0 0 3px rgba(0,0,0,0.05); }
   
  .input-box.has-icon input { padding-left: 40px; }
  .input-box i {
    position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
    font-size: 18px; color: #94a3b8; transition: color 0.2s;
  }
  .input-box input:focus ~ i { color: var(--theme-primary); }

  /* SELECT & SEARCHABLE INPUT */
  .select-wrapper { position: relative; width: 100%; margin: 8px 0; }
  .select-wrapper select, .select-wrapper input {
    width: 100%; padding: 10px 12px;
    border-radius: 10px;
    outline: none; font-size: 13px;
    cursor: pointer;
  }
  .select-wrapper select:focus, .select-wrapper input:focus { border-color: var(--theme-primary); box-shadow: 0 0 0 3px rgba(0,0,0,0.05); }
  
  .select-arrow { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); pointer-events: none; color: #94a3b8; }

  .label-text { font-size: 12px; font-weight: 600; margin-bottom: 4px; display: block; text-align: left; opacity: 0.9; color: var(--text-light); }
  .container.dark .label-text { color: #cbd5e1; }
  .required-star { color: #ef4444; margin-left: 2px; }

  .btn {
    width: 100%; height: 48px; background: var(--theme-primary);
    border-radius: 12px; border: none; cursor: pointer;
    font-size: 15px; color: #fff; font-weight: 600; margin-top: 15px;
    transition: all 0.3s; box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
  .btn:hover { background: var(--theme-primary-hover); transform: translateY(-2px); box-shadow: 0 6px 15px rgba(0,0,0,0.15); }

  /* TOGGLE SLIDER */
  .toggle-box { position: absolute; width: 100%; height: 100%; pointer-events: none; }
  .toggle-box::before {
    content: ''; position: absolute; left: -250%; width: 300%; height: 100%;
    background: var(--theme-primary); border-radius: 150px; z-index: 10;
    transition: left 1.8s ease-in-out, background-color 0.3s;
  }
  .container.active .toggle-box::before { left: 50%; }

  .toggle-panel {
    position: absolute; width: 50%; height: 100%; color: #fff;
    display: flex; flex-direction: column; justify-content: center; align-items: center;
    z-index: 11; transition: left 0.6s ease-in-out, right 0.6s ease-in-out; pointer-events: auto;
  }
  .toggle-panel.toggle-left { left: 0; transition-delay: 1.2s; }
  .container.active .toggle-panel.toggle-left { left: -50%; transition-delay: .6s; }
  .toggle-panel.toggle-right { right: -50%; transition-delay: .6s; }
  .container.active .toggle-panel.toggle-right { right: 0; transition-delay: 1.2s; }
   
  .toggle-panel .btn { width: 140px; height: 40px; background: transparent; border: 2px solid #fff; box-shadow: none; margin-top: 5px; }
  .toggle-panel .btn:hover { background: rgba(255,255,255,0.2); transform: none; }

  /* THEME SWITCH */
  .theme-switch {
    position: fixed; bottom: 25px; right: 25px; width: 80px; height: 40px; 
    border-radius: 40px; background: var(--toggle-bg-light); border: 2px solid #cbd5e1;
    cursor: pointer; display: flex; align-items: center; justify-content: space-between;
    padding: 0 6px; z-index: 100; transition: all 0.3s; box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  }
  .theme-switch.dark { background: var(--toggle-bg-dark); border-color: #475569; }
   
  .theme-knob {
    position: absolute; width: 30px; height: 30px; background: white; border-radius: 50%;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2); transition: transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
    display: flex; align-items: center; justify-content: center;
  }
  .theme-switch.light .theme-knob { transform: translateX(0); background: #fb923c; }
  .theme-switch.dark .theme-knob { transform: translateX(38px); background: #6366f1; }

  /* UTILS */
  .custom-scroll::-webkit-scrollbar { width: 5px; }
  .custom-scroll::-webkit-scrollbar-track { background: transparent; }
  .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
  .custom-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

  .profile-upload { position: relative; width: 90px; height: 90px; margin: 0 auto 15px; cursor: pointer; transition: transform 0.2s; }
  .profile-upload:hover { transform: scale(1.05); }
  .profile-upload img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; border: 3px solid var(--theme-primary); background: #f1f5f9; }
  .profile-upload .upload-icon {
    position: absolute; bottom: 0; right: 0; background: var(--theme-primary);
    color: white; border-radius: 50%; padding: 6px; border: 2px solid white;
  }

  .bmi-box { font-size: 11px; padding: 10px; border-radius: 10px; text-align: center; margin-top: 8px; font-weight: 700; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }

  /* Animation */
  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }

  @media screen and (max-width: 920px){
    .container { width: 100% !important; height: 100vh !important; min-width: 320px !important; border-radius: 0; margin: 0; }
    .form-box { width: 100%; height: 70%; bottom: 0; right: 0 !important; top: auto; }
    .container.active .form-box { bottom: 30%; height: 70%; }
    .form-box.login { top: 0; }
    .container.active .form-box.login { top: -100%; opacity: 0; }
    .form-box.register { bottom: 0; } 
    .toggle-box::before { left: 0; top: -270%; width: 100%; height: 300%; border-radius: 20vw; }
    .container.active .toggle-box::before { top: 70%; }
    .toggle-panel { width: 100%; height: 30%; }
    .toggle-panel.toggle-left { top: 0; }
    .toggle-panel.toggle-right { right: 0; bottom: -30%; }
    .container.active .toggle-panel.toggle-right { bottom: 0; }
  }
`;
document.head.appendChild(fontStyle);

// --- CONSTANTS ---
const DUMMY_DOMAIN = "@weltech.app";
const DAYS = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));
const THAI_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
const CURRENT_YEAR_BE = new Date().getFullYear() + 543;
const YEARS = Array.from({ length: 100 }, (_, i) => (CURRENT_YEAR_BE - i).toString());

const DEFAULT_NATIONALITIES = ["ไทย (Thailand)", "ลาว (Laos)", "พม่า (Myanmar)", "กัมพูชา (Cambodia)", "เวียดนาม (Vietnam)", "จีน (China)", "ญี่ปุ่น (Japan)", "สหรัฐอเมริกา (USA)", "อังกฤษ (UK)", "อื่นๆ (Other)"];
const RELIGIONS = ["พุทธ", "คริสต์", "อิสลาม", "ฮินดู", "ซิกข์", "ไม่นับถือ", "อื่นๆ"];
const FALLBACK_PROVINCES = ["กรุงเทพมหานคร", "กระบี่", "กาญจนบุรี", "ขอนแก่น", "จันทบุรี", "ฉะเชิงเทรา", "ชลบุรี", "ชัยนาท", "ชัยภูมิ", "เชียงราย", "เชียงใหม่", "ตรัง", "ตราด", "ตาก", "นครนายก", "นครปฐม", "นครราชสีมา", "นครศรีธรรมราช", "นครสวรรค์", "นนทบุรี", "ปทุมธานี", "ประจวบคีรีขันธ์", "ปราจีนบุรี", "พระนครศรีอยุธยา", "พังงา", "พัทลุง", "พิจิตร", "พิษณุโลก", "เพชรบุรี", "เพชรบูรณ์", "แพร่", "พะเยา", "ภูเก็ต", "มหาสารคาม", "แม่ฮ่องสอน", "ระยอง", "ราชบุรี", "ลพบุรี", "ลำปาง", "ลำพูน", "เลย", "สมุทรปราการ", "สมุทรสงคราม", "สมุทรสาคร", "สระบุรี", "สิงห์บุรี", "สุโขทัย", "สุพรรณบุรี", "สุราษฎร์ธานี", "สุรินทร์", "หนองคาย", "อ่างทอง", "อุดรธานี", "อุตรดิตถ์", "อุบลราชธานี"];

// --- HELPER FUNCTIONS ---
const formatThaiDateFull = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; 
    const THAI_DAYS = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
    return `วัน${THAI_DAYS[date.getDay()]} ที่ ${date.getDate()} ${THAI_MONTHS[date.getMonth()]} พ.ศ. ${date.getFullYear() + 543}`;
};

const calculateAge = (dobString) => {
    if (!dobString) return '-';
    const birthDate = new Date(dobString);
    if (isNaN(birthDate.getTime())) return '-';
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

// --- COMPONENTS ---
const InputField = ({ label, name, value, type="text", onChange, placeholder, required, maxLength, icon: Icon, error, disabled, hint }) => (
  <div className={`input-box ${Icon ? 'has-icon' : ''}`}>
    {label && <label className="label-text">{label} {required && <span className="required-star">*</span>}</label>}
    <div className="relative">
      <input 
        type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} maxLength={maxLength} required={required} disabled={disabled}
        className={error ? 'border-red-500 bg-red-50' : ''}
      />
      {Icon && <i><Icon size={18} /></i>}
    </div>
    {hint && !error && <p className="text-[10px] text-gray-400 mt-1 text-left">{hint}</p>}
    {error && <p className="text-red-500 text-[10px] mt-1 font-medium text-left">{error}</p>}
  </div>
);

// CUSTOM COMBOBOX: SEARCHABLE + SELECTABLE + THEME AWARE
const CustomCombobox = ({ label, name, value, onChange, options, placeholder, required, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef(null);

    // Filter options based on user input
    const filteredOptions = options.filter(opt => 
        opt.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Handle outside click to close dropdown
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    // Handle Input Change (Allow typing)
    const handleInputChange = (e) => {
        setSearchTerm(e.target.value);
        setIsOpen(true);
        onChange(e); // Propagate change to parent
    };

    // Handle Selection from Dropdown
    const handleSelect = (optionValue) => {
        onChange({ target: { name, value: optionValue } });
        setSearchTerm(''); // Clear local search to show full list next time
        setIsOpen(false);
    };

    return (
        <div className="select-wrapper" ref={wrapperRef}>
             {label && <label className="label-text">{label} {required && <span className="required-star">*</span>}</label>}
             <div className="relative">
                 <input
                    type="text"
                    name={name}
                    value={value}
                    onChange={handleInputChange}
                    onClick={() => !disabled && setIsOpen(true)}
                    placeholder={placeholder || "พิมพ์หรือเลือก..."}
                    required={required}
                    disabled={disabled}
                    autoComplete="off"
                    className="w-full p-2.5 rounded-xl border outline-none text-sm pr-8"
                 />
                 <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-slate-400">
                     <ChevronDown size={14}/>
                 </div>

                 {/* Custom Dropdown List */}
                 {isOpen && !disabled && (
                     <div className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto custom-dropdown-scroll rounded-lg border shadow-lg"
                          style={{
                              backgroundColor: 'var(--content-bg-light)', // Use theme vars
                              borderColor: 'var(--input-border-light)',
                          }}>
                          {/* Force dark mode styles via inline to ensure override if needed, or rely on CSS classes */}
                          <div className="bg-white dark:bg-slate-800 text-slate-700 dark:text-gray-200">
                              {filteredOptions.length > 0 ? (
                                  filteredOptions.map((opt, i) => (
                                      <div 
                                        key={i} 
                                        onClick={() => handleSelect(opt)}
                                        className="px-3 py-2 cursor-pointer hover:bg-teal-50 dark:hover:bg-slate-700 text-sm transition-colors"
                                      >
                                          {opt}
                                      </div>
                                  ))
                              ) : (
                                  <div className="px-3 py-2 text-sm text-gray-400 text-center">ไม่พบข้อมูล</div>
                              )}
                          </div>
                     </div>
                 )}
             </div>
        </div>
    );
};

const ThemeToggle = ({ theme, setTheme }) => {
  const toggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme); document.body.className = newTheme; 
  };
  return (
    <div className={`theme-switch ${theme}`} onClick={toggle}>
      <Sun size={18} className="text-slate-400 ml-1" />
      <Moon size={18} className="text-slate-400 mr-1" />
      <div className="theme-knob">
        {theme === 'light' ? <Sun size={16} className="text-white"/> : <Moon size={16} className="text-white"/>}
      </div>
    </div>
  );
};

// --- MAIN APP ---
const App = () => {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [theme, setTheme] = useState('light');
  const [isRegisterActive, setIsRegisterActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  
  const [currentRole, setCurrentRole] = useState('patient'); 
  const [loginId, setLoginId] = useState('');
  const [loginPwd, setLoginPwd] = useState('');

  // --- FORGOT PASSWORD STATE ---
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotData, setForgotData] = useState({ idCard: '', phone: '', adminResponse: '' });
  
  const [regData, setRegData] = useState({
    profileImage: null, profileImageFile: null,
    idCard: '', password: '', confirmPassword: '', phone: '', email: '',
    title_th: '', first_name_th: '', last_name_th: '', title_en: '', first_name_en: '', last_name_en: '', 
    nationality: '', religion: '', 
    dob: '', 
    house_no: '', village: '', building: '', room_no: '', floor: '', moo: '', soi: '', road: '', 
    province: '', district: '', sub_district: '', zip_code: '',
    weight: '', height: '', disease: '', drugAllergy: '', chemicalAllergy: '', otherInfo: '', 
    education: '', specialization: '', department: '', 
    patientId: '', doctorId: '' 
  });

  const [errors, setErrors] = useState({});
  const [calculatedAge, setCalculatedAge] = useState('');
  const [bmiValue, setBmiValue] = useState(null);
  const [bmiStatus, setBmiStatus] = useState(null);

  const [nationalityOpts, setNationalityOpts] = useState(DEFAULT_NATIONALITIES);
  const [thaiAddressDB, setThaiAddressDB] = useState([]);
  const [provinceOpts, setProvinceOpts] = useState(FALLBACK_PROVINCES);
  const [districtOpts, setDistrictOpts] = useState([]);
  const [subDistrictOpts, setSubDistrictOpts] = useState([]);

  // Mock Data
  const [patientsList, setPatientsList] = useState([
    { id: 1, name: 'นาย สมชาย ใจดี', idCard: '1100012345678', status: 'pending_appoint', lastAppt: '2025-12-01', owner_doctor: 'นพ. สมศักดิ์ รักษาดี', weight: 70, height: 170, disease: 'ความดันโลหิตสูง', drugAllergy: '-' },
    { id: 2, name: 'นาง สมหญิง รักเรียน', idCard: '1100087654321', status: 'pending_result', lastAppt: '2025-12-05', owner_doctor: 'พญ. สุดา สวยงาม', weight: 55, height: 160, disease: '-', drugAllergy: 'Penicillin' },
    { id: 3, name: 'นาย แดง มั่งมี', idCard: '1100055555555', status: 'completed', lastAppt: '2025-11-20', owner_doctor: 'นพ. สมศักดิ์ รักษาดี', weight: 80, height: 175, disease: 'เบาหวาน', drugAllergy: '-' },
    { id: 4, name: 'ด.ช. เก่ง กล้าหาญ', idCard: '1200011111111', status: 'pending_appoint', lastAppt: '2025-12-08', owner_doctor: 'นพ. วิชัย เก่งมาก', weight: 35, height: 140, disease: 'หอบหืด', drugAllergy: '-' }
  ]);

  const [registeredUsersPool] = useState([
      { id: 101, name: 'นางสาว สวยใส ไร้สิว', idCard: '1999900001111', weight: 48, height: 158 },
      { id: 102, name: 'นาย มั่นคง ยั่งยืน', idCard: '1888877776666', weight: 65, height: 172 },
  ]);

  const [appointments, setAppointments] = useState([
    { id: 1, date: '2025-12-10', time: '09:00', type: 'นัดตรวจ', doctor: 'นพ. สมศักดิ์ รักษาดี', patient: 'นาย สมชาย ใจดี' },
    { id: 2, date: '2025-12-10', time: '09:30', type: 'นัดฟังผล', doctor: 'พญ. สุดา สวยงาม', patient: 'นาง สมหญิง รักเรียน' }
  ]);

  const [messages] = useState([
    { id: 1, sender: 'doctor', text: 'สวัสดีครับ อาการเป็นอย่างไรบ้างครับ', time: '10:00' },
    { id: 2, sender: 'patient', text: 'ดีขึ้นแล้วครับคุณหมอ', time: '10:05' }
  ]);
  const [treatmentHistory, setTreatmentHistory] = useState([
      { id: 1, patient: 'นาย สมชาย ใจดี', date: '2025-11-20', disease: 'ไข้หวัดใหญ่ (Influenza)', doctor: 'นพ. วิชัย เก่งมาก', hospital: 'รพ. มจพ.', note: 'จ่ายยา Tamiflu, พักผ่อน 3 วัน' },
      { id: 2, patient: 'นาง สมหญิง รักเรียน', date: '2025-10-15', disease: 'ภูมิแพ้อากาศ', doctor: 'พญ. สุดา สวยงาม', hospital: 'รพ. มจพ.', note: 'ยาแก้แพ้ Loratadine' },
      { id: 3, patient: 'นาย แดง มั่งมี', date: '2025-08-05', disease: 'ตรวจสุขภาพประจำปี', doctor: 'นพ. สมชาย ใจดี', hospital: 'รพ. มจพ.', note: 'ผลเลือดปกติ แนะนำลดของหวาน' },
  ]);

  // --- EFFECTS ---
  useEffect(() => { document.body.setAttribute('data-role', currentRole); }, [currentRole]);
  
  useEffect(() => {
      supabase.auth.getSession().then(({ data: { session } }) => { 
          setSession(session); 
          if (session) fetchProfile(session.user.id); 
          else setProfileLoading(false); 
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          setSession(session);
          if (session) {
              fetchProfile(session.user.id);
          } else {
              setUserProfile(null);
              setProfileLoading(false); 
          }
      });

      return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchAddr = async () => {
        try {
            const res = await fetch('https://raw.githubusercontent.com/earthchie/jquery.Thailand.js/master/jquery.Thailand.js/database/raw_database/raw_database.json');
            const raw = await res.json();
            setThaiAddressDB(raw); 
            setProvinceOpts([...new Set(raw.map(x => x.province))].sort());
        } catch(e) {}
    };
    const fetchAllData = async () => {
        try {
            const resNat = await fetch('https://raw.githubusercontent.com/ponlawat-w/country-list-th/master/country-list-th.json');
            const dataNat = await resNat.json();
            const formattedList = dataNat.map(item => `${item.name} (${item.enName})`).sort((a, b) => a.startsWith("ประเทศไทย") ? -1 : a.localeCompare(b, 'th'));
            setNationalityOpts(formattedList);
        } catch (e) { setNationalityOpts(DEFAULT_NATIONALITIES); }
    };
    fetchAddr(); fetchAllData();
  }, []);

  useEffect(() => { if(regData.province) { const relevant = thaiAddressDB.filter(x => x.province === regData.province); setDistrictOpts([...new Set(relevant.map(x => x.amphoe))].sort()); setRegData(p=>({...p, district: '', sub_district: ''})); } }, [regData.province]);
  useEffect(() => { if(regData.district) { const relevant = thaiAddressDB.filter(x => x.province === regData.province && x.amphoe === regData.district); setSubDistrictOpts([...new Set(relevant.map(x => x.district))].sort()); setRegData(p=>({...p, sub_district: ''})); } }, [regData.district]);
  useEffect(() => { if(regData.sub_district) { const found = thaiAddressDB.find(x => x.province === regData.province && x.amphoe === regData.district && x.district === regData.sub_district); if(found) setRegData(p => ({...p, zip_code: found.zipcode})); } }, [regData.sub_district]);

  useEffect(() => {
    if(regData.dob) {
        setCalculatedAge(`${calculateAge(regData.dob)} ปี`);
    } else { setCalculatedAge(''); }
  }, [regData.dob]);

  useEffect(() => {
    if(regData.weight && regData.height && currentRole === 'patient') {
        const w = parseFloat(regData.weight);
        const h = parseFloat(regData.height) / 100;
        if(w > 0 && h > 0) {
            const bmi = w / (h * h);
            setBmiValue(bmi.toFixed(2));
            if(bmi < 18.5) setBmiStatus({text: 'ผอมเกินไป', color: 'bg-blue-100 text-blue-600'});
            else if(bmi < 23) setBmiStatus({text: 'น้ำหนักปกติ (สมส่วน)', color: 'bg-green-100 text-green-600'});
            else if(bmi < 25) setBmiStatus({text: 'น้ำหนักเกิน (ท้วม)', color: 'bg-yellow-100 text-yellow-700'});
            else setBmiStatus({text: 'อ้วน', color: 'bg-red-100 text-red-600'});
        }
    } else { setBmiValue(null); setBmiStatus(null); }
  }, [regData.weight, regData.height, currentRole]);

  const fetchProfile = async (userId) => { 
    setProfileLoading(true);
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single(); 
    if (data) { 
        setUserProfile(data); 
        setCurrentRole(data.role); 
        setActiveTab('home');
    }
    setProfileLoading(false);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setRegData({ ...regData, profileImage: URL.createObjectURL(file), profileImageFile: file });
    }
  };

  const handleRegChange = (e) => {
    const { name, value } = e.target;
    let newErrors = { ...errors };
    if (name === 'idCard') { if (!/^\d*$/.test(value)) return; if (value.length === 13) delete newErrors.idCard; else newErrors.idCard = 'กรุณากรอกให้ครบ 13 หลัก'; }
    if (name === 'phone') { if (!/^\d*$/.test(value)) return; if (value.length === 10) delete newErrors.phone; else newErrors.phone = 'กรุณากรอกให้ครบ 10 หลัก'; }
    if (name === 'password') { if(!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/.test(value)) newErrors.password = 'ต้องมีพิมพ์ใหญ่, เล็ก, ตัวเลข รวม 6 ตัวขึ้นไป'; else delete newErrors.password; }
    setErrors(newErrors);
    setRegData({ ...regData, [name]: value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (regData.idCard.length !== 13) return alert("เลขบัตรประชาชนต้องมี 13 หลัก");
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/.test(regData.password)) return alert("รหัสผ่านไม่ถูกต้อง");
    if (regData.password !== regData.confirmPassword) return alert("รหัสผ่านไม่ตรงกัน");

    setLoading(true);
    try {
        const { data: authUser, error: authError } = await supabase.auth.signUp({ email: `${regData.idCard}${DUMMY_DOMAIN}`, password: regData.password });
        if (authError) throw authError;
        const { error: profileError } = await supabase.from('profiles').insert([{
            id: authUser.user.id, email: regData.email, id_card: regData.idCard, phone: regData.phone,
            title_th: regData.title_th, first_name_th: regData.first_name_th, last_name_th: regData.last_name_th,
            title_en: regData.title_en, first_name_en: regData.first_name_en, last_name_en: regData.last_name_en,
            nationality: regData.nationality, religion: regData.religion, dob: regData.dob,
            house_no: regData.house_no, village: regData.village, building: regData.building, room_no: regData.room_no, floor: regData.floor,
            moo: regData.moo, soi: regData.soi, road: regData.road, 
            province: regData.province, district: regData.district, sub_district: regData.sub_district, zip_code: regData.zip_code,
            role: currentRole,
            patient_custom_id: currentRole === 'patient' ? regData.patientId : null,
            doctor_license_id: currentRole === 'doctor' ? regData.doctorId : null,
            education: currentRole === 'doctor' ? regData.education : null,
            specialization: currentRole === 'doctor' ? regData.specialization : null,
            department: currentRole === 'doctor' ? regData.department : null,
            weight: currentRole === 'patient' ? parseFloat(regData.weight || 0) : null,
            height: currentRole === 'patient' ? parseFloat(regData.height || 0) : null,
        }]);
        if (profileError) throw profileError;
        alert("ลงทะเบียนสำเร็จ!"); setIsRegisterActive(false);
    } catch (error) { alert("เกิดข้อผิดพลาด: " + error.message); } finally { setLoading(false); }
  };

  const handleLogin = async (e) => {
      e.preventDefault();
      const cleanId = loginId.trim();
      const cleanPwd = loginPwd.trim();
      if (!cleanId || !cleanPwd) return alert("กรุณากรอกเลขบัตรประชาชนและรหัสผ่าน");
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({ email: `${cleanId}${DUMMY_DOMAIN}`, password: cleanPwd });
      if (error) {
          if(error.message.includes("Invalid login credentials")) {
             alert("เข้าสู่ระบบไม่สำเร็จ: เลขบัตรประชาชน หรือ รหัสผ่านไม่ถูกต้อง\n(หากยังไม่เคยใช้งาน กรุณากดสมัครสมาชิกก่อน)");
          } else {
             alert("เกิดข้อผิดพลาด: " + error.message);
          }
      }
      setLoading(false);
  };

  const handleForgotSubmit = (e) => {
      e.preventDefault();
      if (!forgotData.idCard || forgotData.idCard.length !== 13) return alert("กรุณากรอกเลขบัตรประชาชน 13 หลัก");
      if (!forgotData.phone || forgotData.phone.length !== 10) return alert("กรุณากรอกเบอร์โทรศัพท์ 10 หลัก");
      setLoading(true);
      setTimeout(() => {
          setLoading(false);
          setForgotData(prev => ({...prev, adminResponse: 'คำร้องของคุณถูกส่งแล้ว! กรุณารอเจ้าหน้าที่ตรวจสอบ\nรหัสชั่วคราวของคุณคือ: WEL-9999'}));
      }, 1500);
  };

  // --- DASHBOARD COMPONENTS ---
  const renderSidebar = () => {
    const menuItems = {
        patient: [
            { id: 'home', label: 'หน้าหลัก', icon: Home },
            { id: 'profile', label: 'ประวัติส่วนตัว', icon: User },
            { id: 'history', label: 'ประวัติการรักษา', icon: ClipboardList }, 
            { id: 'consult', label: 'แพทย์อบอุ่น', icon: MessageCircle },
        ],
        doctor: [
            { id: 'home', label: 'หน้าหลัก', icon: Home },
            { id: 'profile', label: 'ประวัติส่วนตัว', icon: User },
            { id: 'patients_all', label: 'ผู้ป่วยทั้งหมด', icon: Users },
            { id: 'patients_my', label: 'ผู้ป่วยในการดูแล', icon: Stethoscope },
            { id: 'calendar', label: 'นัดหมาย', icon: Calendar },
            { id: 'consult', label: 'แพทย์อบอุ่น', icon: MessageCircle },
        ],
        admin: [
            { id: 'home', label: 'หน้าหลัก', icon: Home },
            { id: 'requests', label: 'คำร้อง', icon: FileText },
        ]
    };
    const currentMenu = menuItems[userProfile.role] || menuItems['patient'];
    return (
        <aside className={`w-64 border-r h-full shrink-0 flex flex-col transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}>
            <div className={`p-6 flex items-center gap-3 border-b ${theme === 'dark' ? 'border-slate-800' : 'border-gray-100'}`}>
                {/* FIX: Made Logo Background Transparent */}
                <img src={logoImg} className="w-10 h-10 object-contain bg-transparent rounded-lg p-1" alt="Logo"/>
                <div>
                    <h2 className="font-bold text-lg leading-none" style={{color: 'var(--theme-primary)'}}>WelTech</h2>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider">{userProfile?.role} Portal</span>
                </div>
            </div>
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scroll">
                {currentMenu.map(item => (
                    <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === item.id ? 'text-white shadow-lg' : (theme === 'dark' ? 'text-gray-400 hover:bg-slate-800' : 'text-gray-500 hover:bg-gray-50')}`} style={activeTab === item.id ? {backgroundColor: 'var(--theme-primary)'} : {}}>
                        <item.icon size={20}/> {item.label}
                    </button>
                ))}
            </nav>
            <div className={`p-4 border-t ${theme === 'dark' ? 'border-slate-800' : 'border-gray-100'}`}>
                <button onClick={() => supabase.auth.signOut()} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-red-500 hover:bg-red-500/10 font-bold transition-all">
                    <ArrowLeft size={18}/> ออกจากระบบ
                </button>
            </div>
        </aside>
    );
  };

  const Header = () => (
    <header className={`flex justify-between items-start mb-6 pb-6 border-b transition-colors duration-300 ${theme === 'dark' ? 'border-slate-700' : 'border-gray-200'}`}>
        <div>
            <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>ยินดีต้อนรับคุณ {userProfile?.first_name_th} {userProfile?.last_name_th}</h1>
            <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>โรงพยาบาลมหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ</p>
        </div>
        <div className="text-right">
            <p className="text-xs text-gray-400 mb-1">เลขประจำตัวประชาชน</p>
            <p className="font-mono font-bold text-lg tracking-wider" style={{color: 'var(--theme-primary)'}}>{userProfile?.id_card}</p>
        </div>
    </header>
  );

  const PatientHome = () => (
    <div className="space-y-6">
        <div className="rounded-3xl p-6 text-white shadow-xl relative overflow-hidden" style={{backgroundColor: 'var(--theme-primary)'}}>
            <div className="relative z-10">
                <h2 className="font-bold text-xl mb-4 flex items-center gap-2"><Calendar className="text-white"/> นัดหมายที่จะมาถึง</h2>
                {appointments.filter(a => a.patient.includes(userProfile.first_name_th)).length > 0 ? (
                    appointments.filter(a => a.patient.includes(userProfile.first_name_th)).map(appt => (
                        <div key={appt.id} className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 text-sm opacity-90 mb-1"><Clock size={16}/> {formatThaiDateFull(appt.date)} เวลา {appt.time} น.</div>
                                <div className="text-2xl font-bold mb-1">{appt.type}</div>
                                <div className="flex items-center gap-2 cursor-pointer hover:underline" onClick={()=>alert("ข้อมูลแพทย์: " + appt.doctor)}>
                                    <Stethoscope size={16}/> {appt.doctor}
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-3 ${appt.type === 'นัดฟังผล' ? 'bg-orange-400' : 'bg-green-400'}`}>{appt.type}</span>
                                <div className="flex gap-2">
                                    <button className="px-4 py-2 bg-white rounded-xl font-bold text-sm hover:bg-gray-100" style={{color: 'var(--theme-primary)'}}>ยืนยัน</button>
                                    <button className="px-4 py-2 bg-white/20 text-white rounded-xl font-bold text-sm hover:bg-white/30">ขอเลื่อนนัด</button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : <p className="text-white/80">ไม่มีนัดหมายเร็วๆ นี้</p>}
            </div>
        </div>
        
        <h3 className={`font-bold text-lg ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>บริการด่วน</h3>
        <div className="grid grid-cols-2 gap-4">
            <button className={`p-6 rounded-2xl shadow-sm border hover:shadow-md transition-all flex flex-col items-center gap-3 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white" style={{backgroundColor: 'var(--theme-primary)'}}><FileText/></div>
                <span className={`font-bold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>ประวัติผลการรักษา</span>
            </button>
            <button onClick={() => setActiveTab('consult')} className={`p-6 rounded-2xl shadow-sm border hover:shadow-md transition-all flex flex-col items-center gap-3 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white" style={{backgroundColor: 'var(--theme-primary)'}}><MessageCircle/></div>
                <span className={`font-bold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>ปรึกษาแพทย์</span>
            </button>
        </div>
    </div>
  );

  const PatientHistory = ({ patientName }) => {
      const filteredHistory = treatmentHistory.filter(h => !patientName || h.patient === patientName);
      return (
          <div className="space-y-4">
              <h2 className={`font-bold text-xl flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                  <ClipboardList style={{color: 'var(--theme-primary)'}}/> ประวัติการรักษา
              </h2>
              <div className="space-y-4">
                  {filteredHistory.map((item) => (
                      <div key={item.id} className={`p-6 border-l-4 rounded-r-xl shadow-sm hover:shadow-md transition-all ${theme === 'dark' ? 'bg-slate-800 border-slate-600' : 'bg-white border-teal-500'}`}>
                          <div className="flex justify-between items-start mb-2">
                              <span className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{item.disease}</span>
                              {/* FIX: Lighter background for date badge in light mode */}
                              <span className={`text-xs px-2 py-1 rounded-lg ${theme === 'dark' ? 'bg-slate-700 text-gray-300' : 'bg-blue-50 text-blue-700'}`}>
                                  {formatThaiDateFull(item.date)}
                              </span>
                          </div>
                          <div className={`text-sm mb-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                              <p><span className="font-semibold">ผู้ป่วย:</span> {item.patient}</p>
                              <p><span className="font-semibold">แพทย์ผู้รักษา:</span> {item.doctor}</p>
                              <p><span className="font-semibold">สถานพยาบาล:</span> {item.hospital}</p>
                          </div>
                          <div className={`p-3 rounded-lg text-sm ${theme === 'dark' ? 'bg-slate-700 text-gray-300' : 'bg-gray-50 text-gray-700'}`}>
                              <span className="font-bold">ผลการตรวจ/การรักษา:</span> {item.note}
                          </div>
                      </div>
                  ))}
                  {filteredHistory.length === 0 && <p className="text-gray-400">ยังไม่มีประวัติการรักษา</p>}
              </div>
          </div>
      );
  };

  const ProfileView = ({ data = userProfile, isDoctorView = false, onSaveHealthData, addressDB = [] }) => {
    const profile = data;
    const [isEditing, setIsEditing] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    
    // Edit State with FULL profile data
    const [editData, setEditData] = useState({
        ...profile,
        // Fallback checks to ensure fields are controlled inputs (not undefined)
        title_th: profile.title_th || '', first_name_th: profile.first_name_th || '', last_name_th: profile.last_name_th || '',
        title_en: profile.title_en || '', first_name_en: profile.first_name_en || '', last_name_en: profile.last_name_en || '',
        dob: profile.dob || '', nationality: profile.nationality || '', religion: profile.religion || '',
        phone: profile.phone || '', email: profile.email || '',
        house_no: profile.house_no || '', village: profile.village || '', building: profile.building || '', room_no: profile.room_no || '', floor: profile.floor || '', moo: profile.moo || '', soi: profile.soi || '', road: profile.road || '',
        sub_district: profile.sub_district || '', district: profile.district || '', province: profile.province || '', zip_code: profile.zip_code || '',
        weight: profile.weight || '', height: profile.height || '', 
        disease: profile.disease || '', drugAllergy: profile.drugAllergy || '', chemicalAllergy: profile.chemicalAllergy || '', otherInfo: profile.otherInfo || ''
    });

    // Address Logic for Profile Edit (Similar to Registration)
    const [provOpts, setProvOpts] = useState([]);
    const [distOpts, setDistOpts] = useState([]);
    const [subDistOpts, setSubDistOpts] = useState([]);

    useEffect(() => {
        if (addressDB.length > 0) {
            setProvOpts([...new Set(addressDB.map(x => x.province))].sort());
        } else {
            // Fallback if DB not loaded yet
            setProvOpts(FALLBACK_PROVINCES);
        }
    }, [addressDB]);

    useEffect(() => {
        if(editData.province && addressDB.length > 0) { 
            const relevant = addressDB.filter(x => x.province === editData.province); 
            setDistOpts([...new Set(relevant.map(x => x.amphoe))].sort()); 
        } 
    }, [editData.province, addressDB]);

    useEffect(() => { 
        if(editData.district && addressDB.length > 0) { 
            const relevant = addressDB.filter(x => x.province === editData.province && x.amphoe === editData.district); 
            setSubDistOpts([...new Set(relevant.map(x => x.district))].sort()); 
        } 
    }, [editData.district, addressDB]);

    useEffect(() => { 
        if(editData.sub_district && addressDB.length > 0) { 
            const found = addressDB.find(x => x.province === editData.province && x.amphoe === editData.district && x.district === editData.sub_district); 
            if(found) setEditData(prev => ({...prev, zip_code: found.zipcode})); 
        } 
    }, [editData.sub_district, addressDB]);


    const handleSave = async () => {
        setSaveLoading(true);
        // Simulate API saving delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        onSaveHealthData(profile.id, editData);
        setSaveLoading(false);
        setIsEditing(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditData(prev => ({ ...prev, [name]: value }));
    };

    // Permission Check: Patient cannot edit health data, only doctors can.
    const canEditHealth = isDoctorView; 

    return (
    <div className="flex flex-col gap-8 h-full">
        {/* Profile Card Header */}
        <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className={`w-32 h-32 rounded-full border-4 shadow-lg overflow-hidden shrink-0 ${theme === 'dark' ? 'bg-slate-700 border-slate-600' : 'bg-white border-white'}`}>
                {profile.avatar_url ? (
                    <img 
                        src={profile.avatar_url} 
                        className="w-full h-full object-cover" 
                        onError={(e) => {e.target.style.display='none'}} 
                    />
                ) : null}
                <div className={`w-full h-full flex items-center justify-center ${theme === 'dark' ? 'bg-slate-800 text-gray-500' : 'bg-gray-50 text-gray-300'}`}>
                    <User size={48} />
                </div>
            </div>
            
            <div className="flex-1 w-full space-y-6">
                <div className="flex justify-between items-start">
                    <div>
                         {isEditing ? (
                            <div className="space-y-2">
                                <div className="grid grid-cols-3 gap-2">
                                    <CustomCombobox name="title_th" value={editData.title_th} onChange={handleChange} options={['นาย', 'นาง', 'นางสาว', 'ด.ช.', 'ด.ญ.']} placeholder="คำนำหน้า" />
                                    <InputField name="first_name_th" value={editData.first_name_th} onChange={handleChange} placeholder="ชื่อ (ไทย)" />
                                    <InputField name="last_name_th" value={editData.last_name_th} onChange={handleChange} placeholder="สกุล (ไทย)" />
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <CustomCombobox name="title_en" value={editData.title_en} onChange={handleChange} options={['Mr.', 'Mrs.', 'Ms.', 'Master', 'Miss']} placeholder="Title" />
                                    <InputField name="first_name_en" value={editData.first_name_en} onChange={handleChange} placeholder="Name" />
                                    <InputField name="last_name_en" value={editData.last_name_en} onChange={handleChange} placeholder="Surname" />
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
                        <p className="text-xs text-gray-400 mt-1">ID: {profile.idCard}</p>
                    </div>
                    
                    {/* EDIT TOGGLE BUTTON */}
                    <button onClick={() => isEditing ? handleSave() : setIsEditing(true)} 
                        className={`px-4 py-2 border rounded-xl text-sm font-bold flex items-center gap-2
                        ${isEditing ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700' : (theme === 'dark' ? 'border-slate-600 text-gray-300 hover:bg-slate-700' : 'border-gray-300 hover:bg-gray-50')}`}>
                        {isEditing ? (saveLoading ? 'กำลังบันทึก...' : <><Save size={16}/> บันทึก</>) : <><Edit2 size={16}/> แก้ไขข้อมูล</>}
                    </button>
                </div>
                
                {/* --- PERSONAL INFO (ALL FIELDS) --- */}
                <div className={`p-4 rounded-xl space-y-2 border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
                    <h4 className={`font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}><UserCheck size={18}/> ข้อมูลส่วนตัว</h4>
                    {isEditing ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                             <div className="space-y-1">
                                <label className="text-xs text-gray-500">วันเดือนปีเกิด</label>
                                <InputField type="date" name="dob" value={editData.dob} onChange={handleChange} />
                                <p className="text-[10px] text-blue-500">อายุ: {calculateAge(editData.dob)} ปี</p>
                             </div>
                             <div className="space-y-1"><label className="text-xs text-gray-500">สัญชาติ</label><CustomCombobox name="nationality" value={editData.nationality} onChange={handleChange} options={nationalityOpts} /></div>
                             <div className="space-y-1"><label className="text-xs text-gray-500">ศาสนา</label><CustomCombobox name="religion" value={editData.religion} onChange={handleChange} options={RELIGIONS} /></div>
                             <div className="space-y-1"><label className="text-xs text-gray-500">เบอร์โทรศัพท์</label><InputField name="phone" value={editData.phone} onChange={handleChange} maxLength={10} /></div>
                             <div className="space-y-1"><label className="text-xs text-gray-500">อีเมล</label><InputField name="email" value={editData.email} onChange={handleChange} /></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 text-sm">
                            <div><span className="text-gray-500 w-24 inline-block">วันเกิด:</span> <span className={`${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{formatThaiDateFull(profile.dob)} (อายุ {calculateAge(profile.dob)} ปี)</span></div>
                            <div><span className="text-gray-500 w-24 inline-block">สัญชาติ:</span> <span className={`${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{profile.nationality || '-'}</span></div>
                            <div><span className="text-gray-500 w-24 inline-block">ศาสนา:</span> <span className={`${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{profile.religion || '-'}</span></div>
                            <div><span className="text-gray-500 w-24 inline-block">เบอร์โทรศัพท์:</span> <span className={`${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{profile.phone || '-'}</span></div>
                            <div><span className="text-gray-500 w-24 inline-block">อีเมล:</span> <span className={`${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{profile.email || '-'}</span></div>
                        </div>
                    )}
                </div>

                {/* --- ADDRESS INFO --- */}
                <div className={`p-4 rounded-xl space-y-2 border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
                    <h4 className={`font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}><MapPin size={18}/> ที่อยู่ปัจจุบัน</h4>
                    {isEditing ? (
                        <div className="grid grid-cols-3 gap-2 text-sm">
                            <InputField name="house_no" value={editData.house_no} onChange={handleChange} placeholder="บ้านเลขที่" />
                            <InputField name="moo" value={editData.moo} onChange={handleChange} placeholder="หมู่" />
                            <InputField name="village" value={editData.village} onChange={handleChange} placeholder="หมู่บ้าน" />
                            <InputField name="building" value={editData.building} onChange={handleChange} placeholder="อาคาร" />
                            <InputField name="floor" value={editData.floor} onChange={handleChange} placeholder="ชั้น" />
                            <InputField name="room_no" value={editData.room_no} onChange={handleChange} placeholder="ห้อง" />
                            <InputField name="soi" value={editData.soi} onChange={handleChange} placeholder="ซอย" />
                            <InputField name="road" value={editData.road} onChange={handleChange} placeholder="ถนน" />
                            <div/> {/* Spacer */}
                            
                            <CustomCombobox name="province" value={editData.province} onChange={handleChange} options={provOpts} placeholder="จังหวัด" />
                            <CustomCombobox name="district" value={editData.district} onChange={handleChange} options={distOpts} placeholder="อำเภอ" disabled={!editData.province} />
                            <CustomCombobox name="sub_district" value={editData.sub_district} onChange={handleChange} options={subDistOpts} placeholder="ตำบล" disabled={!editData.district} />
                            <InputField name="zip_code" value={editData.zip_code} onChange={handleChange} placeholder="รหัสไปรษณีย์" disabled />
                        </div>
                    ) : (
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {profile.house_no} {profile.moo ? ` หมู่ ${profile.moo}` : ''} {profile.village} {profile.building} {profile.room_no ? `ห้อง ${profile.room_no}` : ''} {profile.floor ? `ชั้น ${profile.floor}` : ''} {profile.soi ? `ซ. ${profile.soi}` : ''} {profile.road ? `ถ. ${profile.road}` : ''} {profile.sub_district} {profile.district} {profile.province} {profile.zip_code}
                        </p>
                    )}
                </div>

                {/* --- HEALTH INFO --- */}
                {(profile.role === 'patient' || isDoctorView) && (
                    <div className={`p-4 rounded-xl space-y-2 border ${theme === 'dark' ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50/20 border-blue-100'}`}>
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="font-bold flex items-center gap-2" style={{color: 'var(--theme-primary)'}}><Activity size={18}/> ข้อมูลสุขภาพ</h4>
                            {isEditing && !canEditHealth && <span className="text-xs text-orange-500 flex items-center gap-1"><AlertTriangle size={12}/> แพทย์เท่านั้นที่แก้ไขส่วนนี้ได้</span>}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                             <div className="space-y-1">
                                <label className="text-gray-500">น้ำหนัก (กก.)</label>
                                {isEditing ? <input type="number" name="weight" className="w-full p-2 border rounded" value={editData.weight} onChange={handleChange} disabled={!canEditHealth} /> : 
                                <div className={`${theme === 'dark' ? 'text-white' : ''} font-medium`}>{profile.weight || '-'}</div>}
                            </div>
                            <div className="space-y-1">
                                <label className="text-gray-500">ส่วนสูง (ซม.)</label>
                                {isEditing ? <input type="number" name="height" className="w-full p-2 border rounded" value={editData.height} onChange={handleChange} disabled={!canEditHealth} /> :
                                <div className={`${theme === 'dark' ? 'text-white' : ''} font-medium`}>{profile.height || '-'}</div>}
                            </div>
                            <div className="col-span-2 space-y-1">
                                <label className="text-gray-500">โรคประจำตัว</label>
                                {isEditing ? <input type="text" name="disease" className="w-full p-2 border rounded" value={editData.disease} onChange={handleChange} disabled={!canEditHealth} /> :
                                <div className={`${theme === 'dark' ? 'text-white' : ''} font-medium`}>{profile.disease || '-'}</div>}
                            </div>
                            <div className="space-y-1">
                                <label className="text-gray-500">ยาที่แพ้</label>
                                {isEditing ? <input type="text" name="drugAllergy" className="w-full p-2 border rounded text-red-500" value={editData.drugAllergy} onChange={handleChange} disabled={!canEditHealth} /> :
                                <div className="font-medium text-red-500">{profile.drugAllergy || '-'}</div>}
                            </div>
                            <div className="space-y-1">
                                <label className="text-gray-500">สารเคมีที่แพ้</label>
                                {isEditing ? <input type="text" name="chemicalAllergy" className="w-full p-2 border rounded text-red-500" value={editData.chemicalAllergy} onChange={handleChange} disabled={!canEditHealth} /> :
                                <div className="font-medium text-red-500">{profile.chemicalAllergy || '-'}</div>}
                            </div>
                            <div className="col-span-2 space-y-1">
                                <label className="text-gray-500">ข้อมูลอื่นๆ (เช่น แพ้อาหาร)</label>
                                {isEditing ? <textarea name="otherInfo" className="w-full p-2 border rounded" rows="2" value={editData.otherInfo} onChange={handleChange} disabled={!canEditHealth} /> :
                                <div className={`${theme === 'dark' ? 'text-white' : ''}`}>{profile.otherInfo || '-'}</div>}
                            </div>
                        </div>
                    </div>
                )}
                
                {/* --- PROFESSIONAL INFO (DOCTOR) --- */}
                {(profile.role === 'doctor' && !isDoctorView) && (
                    <div className="p-4 rounded-xl space-y-2 border bg-purple-50 border-purple-100">
                        <h4 className="font-bold text-purple-700 flex items-center gap-2"><Briefcase size={18}/> ข้อมูลแพทย์</h4>
                        {isEditing ? (
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <InputField name="doctor_license_id" value={editData.doctor_license_id} onChange={handleChange} placeholder="เลขใบประกอบฯ" />
                                <InputField name="department" value={editData.department} onChange={handleChange} placeholder="แผนก" />
                                <InputField name="specialization" value={editData.specialization} onChange={handleChange} placeholder="ความเชี่ยวชาญ" />
                                <InputField name="education" value={editData.education} onChange={handleChange} placeholder="การศึกษา" />
                            </div>
                        ) : (
                            <div className="text-sm text-gray-600 space-y-1">
                                <div><span className="text-gray-500">เลขใบประกอบฯ:</span> {profile.doctor_license_id || '-'}</div>
                                <div><span className="text-gray-500">แผนก:</span> {profile.department || '-'}</div>
                                <div><span className="text-gray-500">ความเชี่ยวชาญ:</span> {profile.specialization || '-'}</div>
                                <div><span className="text-gray-500">การศึกษา:</span> {profile.education || '-'}</div>
                            </div>
                        )}
                        <button className="w-full mt-2 py-1 bg-white text-purple-500 text-xs font-bold rounded shadow-sm">ตั้งค่าตารางงาน</button>
                    </div>
                )}
            </div>
        </div>

        {/* Treatment History Section (Visible for Doctors) */}
        {isDoctorView && (
            <div className="mt-4 pt-6 border-t border-dashed border-gray-200">
                <PatientHistory patientName={profile.name || `${profile.title_th} ${profile.first_name_th} ${profile.last_name_th}`} treatmentHistory={treatmentHistory} theme={theme} />
            </div>
        )}
    </div>
    );
  };

  const DoctorHome = () => {
    // Determine the current doctor's full name for filtering
    const currentDocName = `${userProfile.title_th} ${userProfile.first_name_th} ${userProfile.last_name_th}`;
    
    // Counts
    const allPatientsCount = patientsList.length;
    const myPatientsCount = patientsList.filter(p => p.owner_doctor === currentDocName).length;
    const todaysAppointmentsCount = appointments.filter(a => a.doctor === currentDocName && a.date === '2025-12-10').length; 

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`p-6 rounded-3xl shadow-sm border cursor-pointer hover:shadow-md transition-all ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`} onClick={() => setActiveTab('patients_all')}>
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><Users size={24}/></div>
                    <div><h3 className="text-gray-500 text-sm">ผู้ป่วยทั้งหมดในแผนก</h3><span className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : ''}`}>{allPatientsCount}</span></div>
                </div>
                <p className="text-xs text-gray-400 text-right">คลิกเพื่อดูรายชื่อทั้งหมด</p>
            </div>
            
            <div className={`p-6 rounded-3xl shadow-sm border cursor-pointer hover:shadow-md transition-all ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`} onClick={() => setActiveTab('patients_my')}>
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-purple-100 text-purple-600 rounded-xl"><User size={24}/></div>
                    <div><h3 className="text-gray-500 text-sm">ผู้ป่วยในการดูแล</h3><span className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : ''}`}>{myPatientsCount}</span></div>
                </div>
                <p className="text-xs text-gray-400 text-right">เฉพาะผู้ป่วยของคุณ</p>
            </div>
            
            <div className={`p-6 rounded-3xl shadow-sm border cursor-pointer hover:shadow-md transition-all ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`} onClick={() => setActiveTab('calendar')}>
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-orange-100 text-orange-600 rounded-xl"><Calendar size={24}/></div>
                    <div><h3 className="text-gray-500 text-sm">นัดหมายวันนี้</h3><span className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : ''}`}>{todaysAppointmentsCount}</span></div>
                </div>
                <p className="text-xs text-gray-400 text-right">ดูตารางงานและเพิ่มนัดหมาย</p>
            </div>
        </div>
    );
  };

  // Modified DoctorPatients to handle 'all' and 'my' modes + Adding Patients Logic
  const DoctorPatients = ({ filterType = 'all' }) => {
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [searchAddValue, setSearchAddValue] = useState('');
    const currentDocName = `${userProfile.title_th} ${userProfile.first_name_th} ${userProfile.last_name_th}`;

    const filteredPatients = filterType === 'my' 
        ? patientsList.filter(p => p.owner_doctor === currentDocName)
        : patientsList;

    // Logic for "Add Patient" Searchable Select
    // If 'my': show patients in department NOT assigned to me (or anyone, depending on rule). Let's say allow picking anyone to re-assign or pick unassigned.
    // If 'all': show users from "registeredUsersPool" (Supabase mock) who are NOT in patientsList yet.
    
    const availableToAdd = filterType === 'my'
        ? patientsList.filter(p => p.owner_doctor !== currentDocName).map(p => p.name) // Available to lock
        : registeredUsersPool.filter(u => !patientsList.some(p => p.idCard === u.idCard)).map(u => u.name); // Available to admit

    const handleAddPatient = () => {
        if (!searchAddValue) return;

        if (filterType === 'my') {
            // Find patient in list and update owner_doctor
            const target = patientsList.find(p => p.name === searchAddValue);
            if (target) {
                const updatedList = patientsList.map(p => p.id === target.id ? { ...p, owner_doctor: currentDocName } : p);
                setPatientsList(updatedList);
                alert(`เพิ่มคุณ ${target.name} เข้าสู่การดูแลเรียบร้อยแล้ว`);
                setSearchAddValue('');
            }
        } else {
            // 'all': Add from pool to department list
            const target = registeredUsersPool.find(u => u.name === searchAddValue);
            if (target) {
                const newPatient = { 
                    ...target, 
                    id: patientsList.length + 1, 
                    status: 'new', 
                    lastAppt: '-', 
                    owner_doctor: '-' // Initially no owner
                };
                setPatientsList([...patientsList, newPatient]);
                alert(`เพิ่มคุณ ${target.name} เข้าสู่ทะเบียนแผนกเรียบร้อยแล้ว`);
                setSearchAddValue('');
            }
        }
    };

    const handleSaveHealthData = (id, newData) => {
        // Update local state mock
        const updatedList = patientsList.map(p => p.id === id ? { ...p, ...newData } : p);
        setPatientsList(updatedList);
        if (selectedPatient && selectedPatient.id === id) {
            setSelectedPatient({ ...selectedPatient, ...newData });
        }
        
        // Also update own profile if editing self
        if (id === userProfile.id) {
             setUserProfile({ ...userProfile, ...newData });
        }
        
        alert('บันทึกข้อมูลเรียบร้อยแล้ว');
    };

    return (
        <div className="flex h-full gap-6">
            <div className={`w-1/3 rounded-xl border overflow-hidden flex flex-col ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                <div className={`p-4 border-b ${theme === 'dark' ? 'border-slate-700' : 'border-gray-200'}`}>
                    <h3 className={`font-bold ${theme === 'dark' ? 'text-white' : ''}`}>
                        {filterType === 'my' ? 'รายชื่อผู้ป่วยของคุณ' : 'รายชื่อผู้ป่วยทั้งหมด'}
                    </h3>
                </div>
                
                {/* --- ADD PATIENT SECTION --- */}
                <div className={`p-3 border-b ${theme === 'dark' ? 'border-slate-700 bg-slate-900' : 'border-gray-100 bg-white'}`}>
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <CustomCombobox 
                                value={searchAddValue} 
                                onChange={(e) => setSearchAddValue(e.target.value)}
                                options={availableToAdd}
                                placeholder={filterType === 'my' ? "เลือกผู้ป่วยเพื่อดูแล..." : "เพิ่มชื่อจากทะเบียน..."}
                            />
                        </div>
                        <button onClick={handleAddPatient} className="px-3 rounded-lg bg-green-500 text-white hover:bg-green-600 flex items-center justify-center">
                            <Plus size={18}/>
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {filteredPatients.length > 0 ? filteredPatients.map(p => (
                        <div key={p.id} onClick={() => setSelectedPatient(p)} 
                             className={`p-4 rounded-lg cursor-pointer transition-all border 
                             ${selectedPatient?.id === p.id 
                                ? (theme === 'dark' ? 'bg-slate-700 border-slate-500' : 'bg-blue-50 border-blue-200 shadow-sm') // FIX: Selected State Light/Dark
                                : (theme === 'dark' ? 'border-transparent hover:bg-slate-700' : 'bg-white border-transparent hover:bg-gray-50')
                             }
                             ${theme === 'dark' && selectedPatient?.id === p.id ? '!bg-slate-700 !border-slate-500' : ''}`}>
                            
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className={`font-bold text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{p.name}</h4>
                                    <p className="text-xs text-gray-400">{p.idCard}</p>
                                    {filterType === 'all' && (
                                        <p className="text-[10px] text-blue-500 mt-1"><Stethoscope size={10} className="inline"/> {p.owner_doctor}</p>
                                    )}
                                </div>
                                <div className={`w-3 h-3 rounded-full ${p.status === 'pending_appoint' ? 'bg-orange-400' : (p.status === 'pending_result' ? 'bg-yellow-400' : 'bg-green-400')}`}></div>
                            </div>
                        </div>
                    )) : (
                        <div className="p-4 text-center text-gray-400 text-sm">ไม่พบรายชื่อผู้ป่วย</div>
                    )}
                </div>
            </div>
            <div className={`flex-1 rounded-xl border p-6 overflow-y-auto custom-scroll ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                {selectedPatient ? (
                    <ProfileView 
                        data={selectedPatient} 
                        isDoctorView={true} 
                        onSaveHealthData={handleSaveHealthData}
                        addressDB={thaiAddressDB}
                        theme={theme}
                        treatmentHistory={treatmentHistory}
                    />
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-400 flex-col gap-4">
                        <Users size={48} className="opacity-20"/>
                        <p>เลือกผู้ป่วยเพื่อดูรายละเอียด</p>
                    </div>
                )}
            </div>
        </div>
    );
  };

  const DoctorSchedule = () => {
      const currentDocName = `${userProfile.title_th} ${userProfile.first_name_th} ${userProfile.last_name_th}`;
      // Filter appointments for this doctor
      const myAppointments = appointments.filter(a => a.doctor === currentDocName).sort((a,b) => (a.date + a.time).localeCompare(b.date + b.time));
      // My Patients for dropdown
      const myPatients = patientsList.filter(p => p.owner_doctor === currentDocName);

      const [newAppt, setNewAppt] = useState({ patientName: '', date: '', time: '', type: 'นัดตรวจ', note: '' });

      const handleAddAppointment = (e) => {
          e.preventDefault();
          alert(`เพิ่มนัดหมายสำเร็จ!\nผู้ป่วย: ${newAppt.patientName}\nวันเวลา: ${newAppt.date} ${newAppt.time}\nประเภท: ${newAppt.type}`);
          // In real app, this would update database
          setNewAppt({ patientName: '', date: '', time: '', type: 'นัดตรวจ', note: '' });
      };

      return (
          <div className="flex gap-6 h-full">
              {/* Left: Schedule List */}
              <div className={`flex-1 rounded-xl border p-6 overflow-y-auto ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
                  <h2 className={`text-xl font-bold mb-6 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : ''}`}>
                      <Calendar className="text-orange-500"/> ตารางงานของคุณ
                  </h2>
                  <div className="space-y-3">
                      {myAppointments.length > 0 ? myAppointments.map(appt => (
                          <div key={appt.id} className={`p-4 rounded-xl border flex justify-between items-center ${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-100 shadow-sm'}`}>
                              <div className="flex items-center gap-4">
                                  <div className={`p-3 rounded-lg font-bold text-center min-w-[60px] ${theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-700'}`}>
                                      <div className="text-xs opacity-70">{formatThaiDateFull(appt.date).split(' ')[0]}</div>
                                      <div className="text-lg">{appt.time}</div>
                                  </div>
                                  <div>
                                      <h4 className={`font-bold ${theme === 'dark' ? 'text-white' : ''}`}>{appt.patient}</h4>
                                      <p className="text-sm text-gray-400">{formatThaiDateFull(appt.date)}</p>
                                  </div>
                              </div>
                              <div>
                                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${appt.type === 'นัดฟังผล' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                                      {appt.type}
                                  </span>
                              </div>
                          </div>
                      )) : <p className="text-gray-400 text-center mt-10">ไม่มีนัดหมายในรายการ</p>}
                  </div>
              </div>

              {/* Right: Add Appointment Form */}
              <div className={`w-1/3 rounded-xl border p-6 ${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                  <h3 className={`font-bold mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : ''}`}><Plus size={20}/> ลงนัดหมายใหม่</h3>
                  <form onSubmit={handleAddAppointment} className="space-y-4">
                      <div>
                          <label className={`text-xs font-bold mb-1 block ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>ผู้ป่วย (ในความดูแลของคุณ)</label>
                          <select 
                              className={`w-full p-2 rounded-lg border outline-none text-sm ${theme === 'dark' ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
                              value={newAppt.patientName}
                              onChange={(e) => setNewAppt({...newAppt, patientName: e.target.value})}
                              required
                          >
                              <option value="" disabled>เลือกผู้ป่วย</option>
                              {myPatients.map(p => (
                                  <option key={p.id} value={p.name}>{p.name}</option>
                              ))}
                          </select>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                          <div>
                              <label className={`text-xs font-bold mb-1 block ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>วันที่</label>
                              <input 
                                  type="date" 
                                  className={`w-full p-2 rounded-lg border outline-none text-sm ${theme === 'dark' ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
                                  value={newAppt.date}
                                  onChange={(e) => setNewAppt({...newAppt, date: e.target.value})}
                                  required
                              />
                          </div>
                          <div>
                              <label className={`text-xs font-bold mb-1 block ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>เวลา</label>
                              <input 
                                  type="time" 
                                  className={`w-full p-2 rounded-lg border outline-none text-sm ${theme === 'dark' ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
                                  value={newAppt.time}
                                  onChange={(e) => setNewAppt({...newAppt, time: e.target.value})}
                                  required
                              />
                          </div>
                      </div>

                      <div>
                          <label className={`text-xs font-bold mb-1 block ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>ประเภทนัด</label>
                          <select 
                              className={`w-full p-2 rounded-lg border outline-none text-sm ${theme === 'dark' ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
                              value={newAppt.type}
                              onChange={(e) => setNewAppt({...newAppt, type: e.target.value})}
                          >
                              <option value="นัดตรวจ">นัดตรวจ (Check-up)</option>
                              <option value="นัดฟังผล">นัดฟังผล (Follow-up)</option>
                          </select>
                      </div>

                      <div>
                          <label className={`text-xs font-bold mb-1 block ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>บันทึกเพิ่มเติม (หมายเหตุ)</label>
                          <textarea 
                              rows="3"
                              className={`w-full p-2 rounded-lg border outline-none text-sm ${theme === 'dark' ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-gray-300'}`}
                              placeholder="รายละเอียดการนัด..."
                              value={newAppt.note}
                              onChange={(e) => setNewAppt({...newAppt, note: e.target.value})}
                          ></textarea>
                      </div>

                      <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md transition-all">บันทึกนัดหมาย</button>
                  </form>
              </div>
          </div>
      );
  };

  const AdminDashboard = () => (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`p-6 rounded-3xl shadow-sm border text-center ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
                <h3 className="text-gray-500 text-sm mb-2">User ทั้งหมด</h3>
                <div className="text-4xl font-bold" style={{color: 'var(--theme-primary)'}}>2,543</div>
            </div>
            <div className={`p-6 rounded-3xl shadow-sm border text-center ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
                <h3 className="text-gray-500 text-sm mb-2">ผู้ป่วย</h3>
                <div className="text-4xl font-bold text-green-500">2,400</div>
                <button className={`mt-4 text-xs px-3 py-1 rounded-lg ${theme === 'dark' ? 'bg-slate-700 text-white' : 'bg-gray-100 text-gray-700'}`}>ดูรายชื่อ</button>
            </div>
            <div className={`p-6 rounded-3xl shadow-sm border text-center ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
                <h3 className="text-gray-500 text-sm mb-2">แพทย์</h3>
                <div className="text-4xl font-bold text-blue-500">143</div>
                <button className={`mt-4 text-xs px-3 py-1 rounded-lg ${theme === 'dark' ? 'bg-slate-700 text-white' : 'bg-gray-100 text-gray-700'}`}>ดูรายชื่อ</button>
            </div>
        </div>
    </div>
  );

  const AdminRequests = () => (
    <div className={`rounded-xl border overflow-hidden ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
         <div className={`p-6 border-b ${theme === 'dark' ? 'border-slate-700' : 'border-gray-100'}`}><h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : ''}`}>คำร้องลืมรหัสผ่าน</h2></div>
         <div className="p-6">
             <table className={`w-full text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>
                 <thead className={`text-gray-500 ${theme === 'dark' ? 'bg-slate-900' : 'bg-gray-50'}`}>
                     <tr>
                         <th className="p-3 text-left rounded-l-xl">เวลา</th>
                         <th className="p-3 text-left">เลขบัตรปชช.</th>
                         <th className="p-3 text-left">เบอร์โทร</th>
                         <th className="p-3 text-right rounded-r-xl">ดำเนินการ</th>
                     </tr>
                 </thead>
                 <tbody>
                     <tr className={`border-b ${theme === 'dark' ? 'border-slate-700' : 'border-gray-50'}`}>
                         <td className="p-3">09:15 น.</td>
                         <td className="p-3 font-mono">1100012345678</td>
                         <td className="p-3">0891234567</td>
                         <td className="p-3 text-right">
                             <button className="px-3 py-1 bg-blue-500 text-white rounded-lg text-xs font-bold hover:bg-blue-600">ส่งรหัส</button>
                         </td>
                     </tr>
                 </tbody>
             </table>
         </div>
    </div>
  );

  // --- RENDER ---
  if (session && userProfile) {
     return (
        <div className={`w-screen h-screen font-sans transition-colors duration-300 flex overflow-hidden ${theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-white text-gray-800'}`}>
            {renderSidebar()}
            <main className="flex-1 flex flex-col h-full relative">
                <div className={`p-8 pb-4 bg-${theme === 'dark' ? 'slate-900' : 'white'} sticky top-0 z-10`}>
                    <Header />
                </div>
                <div className={`flex-1 p-8 pt-0 overflow-y-auto custom-scroll bg-${theme === 'dark' ? 'slate-900' : 'white'}`}>
                    {userProfile.role === 'patient' && (
                        <>
                            {activeTab === 'home' && <PatientHome />}
                            {activeTab === 'profile' && <ProfileView addressDB={thaiAddressDB} theme={theme} treatmentHistory={treatmentHistory} />}
                            {activeTab === 'history' && <PatientHistory theme={theme} />}
                            {activeTab === 'consult' && <ConsultationView userProfile={userProfile} theme={theme} />}
                        </>
                    )}
                    {userProfile.role === 'doctor' && (
                        <>
                            {activeTab === 'home' && <DoctorHome />}
                            {activeTab === 'profile' && <ProfileView addressDB={thaiAddressDB} theme={theme} treatmentHistory={treatmentHistory} />}
                            {/* Reuse DoctorPatients component with different filterType */}
                            {activeTab === 'patients_all' && <DoctorPatients filterType="all" />}
                            {activeTab === 'patients_my' && <DoctorPatients filterType="my" />}
                            {activeTab === 'calendar' && <DoctorSchedule />}
                            {activeTab === 'consult' && <ConsultationView userProfile={userProfile} theme={theme} />}
                        </>
                    )}
                    {userProfile.role === 'admin' && (
                        <>
                            {activeTab === 'home' && <AdminDashboard />}
                            {activeTab === 'requests' && <AdminRequests />}
                        </>
                    )}
                </div>
            </main>
            <ThemeToggle theme={theme} setTheme={setTheme} />
        </div>
     );
  }

  return (
    <>
      <ThemeToggle theme={theme} setTheme={setTheme} />
      <div className={`auth-wrapper ${theme === 'dark' ? 'dark' : ''}`}>
        <div className={`container ${isRegisterActive ? 'active' : ''} ${theme === 'dark' ? 'dark' : ''}`}>
          
          {/* LOGIN FORM */}
          <div className="form-box login">
             {/* CONDITIONAL RENDERING: LOGIN vs FORGOT PASSWORD */}
             {!isForgotPassword ? (
                 <form onSubmit={handleLogin} className="w-full max-w-xs flex flex-col items-center">
                    
                    <img src={logoImg} alt="WelTech Logo" className="w-24 h-24 mb-4 object-contain" />

                    <h1 className="mb-2">เข้าสู่ระบบ</h1>
                    <p className="mb-6 opacity-70">
                      WelTech : {currentRole === 'patient' ? 'ผู้ป่วย' : (currentRole === 'doctor' ? 'แพทย์' : 'แอดมิน')}
                    </p>
                    
                    <div className="w-full space-y-3">
                      <InputField theme={theme} placeholder="เลขบัตรประชาชน" icon={User} value={loginId} onChange={(e) => setLoginId(e.target.value)} required />
                      <InputField theme={theme} type="password" placeholder="รหัสผ่าน" icon={Key} value={loginPwd} onChange={(e) => setLoginPwd(e.target.value)} required />
                    </div>
                    
                    <div className="w-full text-right mt-2">
                        <span onClick={() => setIsForgotPassword(true)} className="text-xs text-blue-500 cursor-pointer hover:underline">ลืมรหัสผ่าน?</span>
                    </div>

                    <button type="submit" className="btn mt-6 shadow-lg">{loading ? 'Loading...' : 'เข้าสู่ระบบ'}</button>
                    
                    <div className="mt-8 pt-6 border-t border-dashed border-gray-300 w-full text-center">
                        
                        {currentRole === 'patient' ? (
                            <>
                              <p className="text-xs mb-3 opacity-60">สำหรับเจ้าหน้าที่</p>
                              <div className="flex justify-center gap-3">
                                  <button 
                                      type="button" 
                                      onClick={()=>setCurrentRole('doctor')} 
                                      className={`text-xs px-6 py-2 rounded-full font-bold transition-all text-white ${currentRole === 'doctor' ? 'bg-blue-700 shadow-md' : 'bg-blue-500 hover:bg-blue-600'}`}
                                  >
                                      แพทย์
                                  </button>
                                  <button 
                                      type="button" 
                                      onClick={()=>setCurrentRole('admin')} 
                                      className={`text-xs px-6 py-2 rounded-full font-bold transition-all text-white ${currentRole === 'admin' ? 'bg-purple-900 shadow-md' : 'bg-purple-700 hover:bg-purple-800'}`}
                                  >
                                      แอดมิน
                                  </button>
                              </div>
                            </>
                        ) : (
                            <button type="button" onClick={()=>setCurrentRole('patient')} className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors">
                                <ArrowLeft size={16}/> กลับสู่หน้าผู้ป่วย
                            </button>
                        )}

                    </div>
                 </form>
             ) : (
                 /* FORGOT PASSWORD FORM */
                 <form onSubmit={handleForgotSubmit} className="w-full max-w-xs flex flex-col items-center animate-fade-in">
                    <div className="w-full mb-6">
                        <button type="button" onClick={() => setIsForgotPassword(false)} className="text-gray-400 hover:text-gray-600"><ArrowLeft size={24}/></button>
                    </div>
                    <h1 className="mb-2 text-2xl font-bold text-red-500">ลืมรหัสผ่าน</h1>
                    <p className="mb-6 opacity-70 text-sm">กรอกข้อมูลเพื่อยื่นคำร้องขอรหัสใหม่</p>

                    <div className="w-full space-y-4">
                        <InputField theme={theme} label="เลขบัตรประชาชน" icon={User} value={forgotData.idCard} onChange={(e) => setForgotData({...forgotData, idCard: e.target.value})} maxLength={13} required />
                        <InputField theme={theme} label="เบอร์โทรศัพท์" icon={Phone} value={forgotData.phone} onChange={(e) => setForgotData({...forgotData, phone: e.target.value})} maxLength={10} required />
                    </div>

                    <button type="submit" className="btn mt-6 shadow-lg bg-red-500 hover:bg-red-600">
                        {loading ? 'กำลังส่ง...' : 'ส่งคำร้องขอรหัส'}
                    </button>

                    <div className="w-full mt-6">
                        <label className="text-xs font-bold text-gray-500 mb-1 block">ข้อความจากระบบ/แอดมิน</label>
                        <textarea 
                            className="w-full p-3 rounded-xl border bg-gray-50 text-sm text-gray-600 outline-none resize-none" 
                            rows="3" 
                            readOnly 
                            value={forgotData.adminResponse}
                            placeholder="รอการตอบกลับ..."
                        ></textarea>
                    </div>
                 </form>
             )}
          </div>

          {/* REGISTER FORM */}
          <div className="form-box register">
             <form onSubmit={handleRegister} className="w-full h-full flex flex-col items-center">
                <h1 className="text-2xl font-bold mb-1" style={{color: 'var(--theme-primary)'}}>ลงทะเบียน{currentRole === 'patient' ? 'ผู้ป่วย' : (currentRole === 'doctor' ? 'แพทย์' : 'แอดมิน')}</h1>
                <p className="text-xs text-gray-400 mb-4">กรอกข้อมูลให้ครบถ้วนเพื่อสร้างบัญชี</p>
                
                <div className="w-full flex-1 overflow-y-auto custom-scroll pr-2 text-left pb-4">
                    
                    <div className="text-center mb-6 mt-2">
                        <label htmlFor="upload-avatar" className="profile-upload inline-block">
                            <img src={regData.profileImage || null} alt="Profile" />
                            <div className="upload-icon"><Camera size={16}/></div>
                        </label>
                        <input id="upload-avatar" type="file" accept="image/*" hidden onChange={handleImageUpload} />
                    </div>

                    {/* 1. Account Info */}
                    <div className="mb-5 pb-5 border-b border-gray-100">
                        <p className="text-sm font-bold mb-3 flex items-center gap-2" style={{color: 'var(--theme-primary)'}}><User size={16}/> ข้อมูลบัญชี</p>
                        <InputField theme={theme} label="เลขบัตรประชาชน (13 หลัก)" name="idCard" value={regData.idCard} onChange={handleRegChange} maxLength={13} required error={errors.idCard} />
                        
                        {currentRole !== 'admin' && (
                            <InputField 
                                theme={theme} 
                                label={currentRole === 'patient' ? "เลขประจำตัวผู้ป่วย (HN) (ถ้ามี)" : "เลขใบประกอบวิชาชีพเวชกรรม (ถ้ามี)"} 
                                name={currentRole === 'patient' ? 'patientId' : 'doctorId'} 
                                value={currentRole === 'patient' ? regData.patientId : regData.doctorId} 
                                onChange={handleRegChange} 
                                // required removed
                            />
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <InputField theme={theme} type="password" label="รหัสผ่าน" name="password" value={regData.password} onChange={handleRegChange} required error={errors.password} hint="6 ตัวขึ้นไป (A-Z, a-z, 0-9)" />
                            <InputField theme={theme} type="password" label="ยืนยันรหัสผ่าน" name="confirmPassword" value={regData.confirmPassword} onChange={handleRegChange} required />
                        </div>
                    </div>

                    {/* 2. Personal Info */}
                    <div className="mb-5 pb-5 border-b border-gray-100">
                        <p className="text-sm font-bold mb-3 flex items-center gap-2" style={{color: 'var(--theme-primary)'}}><FileText size={16}/> ข้อมูลส่วนตัว</p>
                        <div className="grid grid-cols-2 gap-3">
                            <InputField theme={theme} label="เบอร์โทรศัพท์" name="phone" value={regData.phone} onChange={handleRegChange} maxLength={10} required error={errors.phone} />
                            <InputField theme={theme} label="อีเมล (ถ้ามี)" name="email" value={regData.email} onChange={handleRegChange} />
                        </div>
                        
                        <div className="grid grid-cols-12 gap-2 mt-2">
                            <div className="col-span-3"><CustomCombobox theme={theme} label="คำนำหน้า" name="title_th" value={regData.title_th} options={['นาย', 'นาง', 'นางสาว', 'ด.ช.', 'ด.ญ.']} onChange={handleRegChange} required /></div>
                            <div className="col-span-5"><InputField theme={theme} label="ชื่อ (ไทย)" name="first_name_th" value={regData.first_name_th} onChange={handleRegChange} required placeholder="ภาษาไทย" /></div>
                            <div className="col-span-4"><InputField theme={theme} label="นามสกุล (ไทย)" name="last_name_th" value={regData.last_name_th} onChange={handleRegChange} required /></div>
                        </div>

                        <div className="grid grid-cols-12 gap-2">
                            <div className="col-span-3"><CustomCombobox theme={theme} label="Title" name="title_en" value={regData.title_en} options={['Mr.', 'Mrs.', 'Ms.', 'Master', 'Miss']} onChange={handleRegChange} required /></div>
                            <div className="col-span-5"><InputField theme={theme} label="Name (Eng)" name="first_name_en" value={regData.first_name_en} onChange={handleRegChange} required placeholder="English" /></div>
                            <div className="col-span-4"><InputField theme={theme} label="Surname (Eng)" name="last_name_en" value={regData.last_name_en} onChange={handleRegChange} required /></div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-2">
                           <CustomCombobox theme={theme} label="สัญชาติ" name="nationality" value={regData.nationality} options={nationalityOpts} onChange={handleRegChange} required />
                           <CustomCombobox theme={theme} label="ศาสนา" name="religion" value={regData.religion} options={RELIGIONS} onChange={handleRegChange} required />
                        </div>

                        <div className="mt-3">
                            <label className="label-text">วันเดือนปีเกิด <span className="required-star">*</span></label>
                            {/* UPDATED: Single Date Input */}
                            <InputField type="date" name="dob" value={regData.dob} onChange={handleRegChange} required />
                            {calculatedAge && <p className="text-[11px] font-bold mt-2 text-right" style={{color: 'var(--theme-primary)'}}>อายุ: {calculatedAge}</p>}
                        </div>
                    </div>

                    {/* 3. Physical Info (Patient Only) */}
                    {currentRole === 'patient' && (
                        <div className="mb-5 pb-5 border-b border-gray-100">
                            <p className="text-sm font-bold mb-3 flex items-center gap-2" style={{color: 'var(--theme-primary)'}}><Activity size={16}/> ข้อมูลสุขภาพ (BMI)</p>
                            <div className="grid grid-cols-2 gap-3">
                                <InputField theme={theme} label="น้ำหนัก (กก.)" name="weight" value={regData.weight} onChange={handleRegChange} required />
                                <InputField theme={theme} label="ส่วนสูง (ซม.)" name="height" value={regData.height} onChange={handleRegChange} required />
                            </div>
                            {bmiStatus && (
                                <div className={`bmi-box ${bmiStatus.color}`}>
                                    BMI: {bmiValue} — {bmiStatus.text}
                                </div>
                            )}
                             <div className="mt-2 space-y-2">
                                <InputField theme={theme} label="โรคประจำตัว" name="disease" value={regData.disease} onChange={handleRegChange} placeholder="ไม่มีขีด -" />
                                <InputField theme={theme} label="ยาที่แพ้" name="drugAllergy" value={regData.drugAllergy} onChange={handleRegChange} placeholder="ไม่มีขีด -" />
                                {/* NEW FIELDS */}
                                <InputField theme={theme} label="สารเคมีที่แพ้" name="chemicalAllergy" value={regData.chemicalAllergy} onChange={handleRegChange} placeholder="ไม่มีขีด -" />
                                <InputField theme={theme} label="ข้อมูลอื่นๆ" name="otherInfo" value={regData.otherInfo} onChange={handleRegChange} placeholder="เช่น แพ้อาหาร..." />
                            </div>
                        </div>
                    )}

                    {/* 4. Professional Info (Doctor Only) */}
                    {currentRole === 'doctor' && (
                        <div className="mb-5 pb-5 border-b border-gray-100">
                             <p className="text-sm font-bold mb-3 flex items-center gap-2" style={{color: 'var(--theme-primary)'}}><Stethoscope size={16}/> ข้อมูลแพทย์</p>
                             <InputField theme={theme} label="ประวัติการศึกษา (เช่น พ.บ., ว.ว.)" name="education" value={regData.education} onChange={handleRegChange} required />
                             <div className="grid grid-cols-2 gap-3">
                                 <InputField theme={theme} label="ความเชี่ยวชาญ" name="specialization" value={regData.specialization} onChange={handleRegChange} required />
                                 <InputField theme={theme} label="แผนกที่สังกัด" name="department" value={regData.department} onChange={handleRegChange} required />
                             </div>
                        </div>
                    )}

                    {/* 5. Address */}
                    <div>
                        <p className="text-sm font-bold mb-3 flex items-center gap-2" style={{color: 'var(--theme-primary)'}}><MapPin size={16}/> ที่อยู่ปัจจุบัน</p>
                        <div className="grid grid-cols-3 gap-2">
                            <InputField theme={theme} label="บ้านเลขที่" name="house_no" value={regData.house_no} onChange={handleRegChange} required />
                            <InputField theme={theme} label="หมู่ที่" name="moo" value={regData.moo} onChange={handleRegChange} />
                            <InputField theme={theme} label="อาคาร/หมู่บ้าน" name="village" value={regData.village} onChange={handleRegChange} />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <InputField theme={theme} label="ชั้น" name="floor" value={regData.floor} onChange={handleRegChange} />
                            <InputField theme={theme} label="ห้อง" name="room_no" value={regData.room_no} onChange={handleRegChange} />
                            <InputField theme={theme} label="ซอย" name="soi" value={regData.soi} onChange={handleRegChange} />
                        </div>
                        <InputField theme={theme} label="ถนน" name="road" value={regData.road} onChange={handleRegChange} />
                        
                        <div className="grid grid-cols-2 gap-2">
                            <CustomCombobox theme={theme} label="จังหวัด" name="province" value={regData.province} options={provinceOpts} onChange={handleRegChange} required />
                            <CustomCombobox theme={theme} label="อำเภอ/เขต" name="district" value={regData.district} options={districtOpts} onChange={handleRegChange} required disabled={!regData.province}/>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <CustomCombobox theme={theme} label="ตำบล/แขวง" name="sub_district" value={regData.sub_district} options={subDistrictOpts} onChange={handleRegChange} required disabled={!regData.district}/>
                            <InputField theme={theme} label="รหัสไปรษณีย์" name="zip_code" value={regData.zip_code} onChange={handleRegChange} required disabled />
                        </div>
                    </div>

                </div>
                
                <button type="submit" className="btn mt-2">{loading ? 'กำลังบันทึก...' : 'ลงทะเบียน'}</button>
             </form>
          </div>

          {/* SLIDER OVERLAY */}
          <div className="toggle-box">
             <div className="toggle-panel toggle-left">
                <h1 className="text-3xl font-bold mb-2">สวัสดีครับ!</h1>
                <p>กรอกข้อมูลส่วนตัวเพื่อเริ่มใช้งาน WelTech</p>
                <button className="btn" onClick={() => setIsRegisterActive(true)}>สมัครสมาชิก</button>
             </div>
             <div className="toggle-panel toggle-right">
                <h1 className="text-3xl font-bold mb-2">ยินดีต้อนรับกลับ!</h1>
                <p>เชื่อมต่อกับบริการสุขภาพของคุณได้ทันที</p>
                <button className="btn" onClick={() => setIsRegisterActive(false)}>เข้าสู่ระบบ</button>
             </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default App;