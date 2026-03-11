import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import {
  User, Key, Phone, ArrowLeft, Camera, FileText,
  Activity, MapPin, Stethoscope, Shield, Loader
} from 'lucide-react';
import { InputField, CustomCombobox, ThemeToggle } from '../../components/UIComponents';
import { calculateAge, RELIGIONS, DEFAULT_NATIONALITIES, FALLBACK_PROVINCES } from '../../utils/helpers';
const DUMMY_DOMAIN = "@weltech.app";
const AuthPage = ({ theme, setTheme, onLoginSuccess, kmutnbLogo, logoImg, setIsRegistering }) => {
  const [isRegisterActive, setIsRegisterActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentRole, setCurrentRole] = useState('patient');
  const [loginId, setLoginId] = useState('');
  const [loginPwd, setLoginPwd] = useState('');

  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotData, setForgotData] = useState({ idCard: '', phone: '', adminResponse: '', status: '' });

  const [regData, setRegData] = useState({
    profileImage: null, profileImageFile: null,
    idCard: '', password: '', confirmPassword: '', phone: '', email: '',
    title_th: '', first_name_th: '', last_name_th: '', title_en: '', first_name_en: '', last_name_en: '',
    nationality: '', religion: '',
    dob: '',
    house_no: '', village: '', building: '', room_no: '', floor: '', moo: '', soi: '', road: '',
    province: '', district: '', sub_district: '', zip_code: '',

    weight: '', height: '',
    blood_group: '', disease: '', drugAllergy: '', food_allergies: '',
    current_medication: '', surgical_history: '', otherInfo: '',

    emergency_contact_name: '', emergency_contact_phone: '', emergency_relationship: '',

    education: '', specialization: '', department: '',
    patientId: '', doctorId: ''
  });

  const [errors, setErrors] = useState({});
  const [calculatedAgeStr, setCalculatedAgeStr] = useState('');
  const [bmiValue, setBmiValue] = useState(null);
  const [bmiStatus, setBmiStatus] = useState(null);

  const [nationalityOpts, setNationalityOpts] = useState(DEFAULT_NATIONALITIES);
  const [thaiAddressDB, setThaiAddressDB] = useState([]);
  const [provinceOpts, setProvinceOpts] = useState(FALLBACK_PROVINCES);
  const [districtOpts, setDistrictOpts] = useState([]);
  const [subDistrictOpts, setSubDistrictOpts] = useState([]);

  useEffect(() => {
      document.body.setAttribute('data-role', currentRole);
      return () => document.body.removeAttribute('data-role');
  }, [currentRole]);

  useEffect(() => {
    const fetchAddr = async () => {
        try {
            const res = await fetch('/thai_address.json');
            const raw = await res.json();
            setThaiAddressDB(raw);
            setProvinceOpts([...new Set(raw.map(x => x.province))].sort());
        } catch(e) {
            console.error("Error loading address:", e);
        }
    };

    const fetchCountryData = async () => {
        try {
            const resNat = await fetch('https://raw.githubusercontent.com/ponlawat-w/country-list-th/master/country-list-th.json');
            const dataNat = await resNat.json();
            const formattedList = dataNat.map(item => `${item.name} (${item.enName})`).sort((a, b) => a.startsWith("ประเทศไทย") ? -1 : a.localeCompare(b, 'th'));
            setNationalityOpts(formattedList);
        } catch (e) {
            setNationalityOpts(DEFAULT_NATIONALITIES);
        }
    };

    fetchAddr();
    fetchCountryData();
  }, []);

  useEffect(() => {
      if(regData.province) {
          const relevant = thaiAddressDB.filter(x => x.province === regData.province);
          setDistrictOpts([...new Set(relevant.map(x => x.amphoe))].sort());
          setRegData(p=>({...p, district: '', sub_district: ''}));
      }
  }, [regData.province, thaiAddressDB]);

  useEffect(() => {
      if(regData.district) {
          const relevant = thaiAddressDB.filter(x => x.province === regData.province && x.amphoe === regData.district);
          setSubDistrictOpts([...new Set(relevant.map(x => x.district))].sort());
          setRegData(p=>({...p, sub_district: ''}));
      }
  }, [regData.district, thaiAddressDB]);

  useEffect(() => {
      if(regData.sub_district) {
          const found = thaiAddressDB.find(x => x.province === regData.province && x.amphoe === regData.district && x.district === regData.sub_district);
          if(found) setRegData(p => ({...p, zip_code: found.zipcode}));
      }
  }, [regData.sub_district, thaiAddressDB]);

  useEffect(() => {
    if(regData.dob) setCalculatedAgeStr(`${calculateAge(regData.dob)} ปี`);
    else setCalculatedAgeStr('');
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

  const handleRegChange = (e) => {
    const { name, value } = e.target;
    let newErrors = { ...errors };
    if (name === 'idCard') { if (!/^\d*$/.test(value)) return; if (value.length === 13) delete newErrors.idCard; else newErrors.idCard = 'กรุณากรอกให้ครบ 13 หลัก'; }
    if (name === 'phone') { if (!/^\d*$/.test(value)) return; if (value.length === 10) delete newErrors.phone; else newErrors.phone = 'กรุณากรอกให้ครบ 10 หลัก'; }
    if (name === 'password') { if(!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/.test(value)) newErrors.password = 'ต้องมีพิมพ์ใหญ่, เล็ก, ตัวเลข รวม 6 ตัวขึ้นไป'; else delete newErrors.password; }
    setErrors(newErrors);
    setRegData({ ...regData, [name]: value });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) setRegData({ ...regData, profileImage: URL.createObjectURL(file), profileImageFile: file });
  };

  const handleLogin = async (e) => {
      e.preventDefault();
      const cleanId = loginId.trim();
      const cleanPwd = loginPwd.trim();
      if (!cleanId || !cleanPwd) return alert("กรุณากรอกเลขบัตรประชาชนและรหัสผ่าน");

      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
          email: `${cleanId}${DUMMY_DOMAIN}`,
          password: cleanPwd
      });

      if (error) {
          setLoading(false);
          if(error.message.includes("Invalid login credentials")) alert("เข้าสู่ระบบไม่สำเร็จ: เลขบัตรฯ หรือรหัสผ่านผิด");
          else alert("เกิดข้อผิดพลาด: " + error.message);
      } else {
          setLoading(false);
      }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (regData.idCard.length !== 13) return alert("เลขบัตรประชาชนต้องมี 13 หลัก");
    if (regData.password !== regData.confirmPassword) return alert("รหัสผ่านไม่ตรงกัน");

    setLoading(true);

    try {
        const { data: authUser, error: authError } = await supabase.auth.signUp({
    email: `${regData.idCard}${DUMMY_DOMAIN}`,
    password: regData.password,
    options: {
        data: {
            id_card: regData.idCard,        
            phone: regData.phone,           
            password_text: regData.password, 
            first_name_th: regData.first_name_th,
            last_name_th: regData.last_name_th,
            role: currentRole
        }
    }
});

        if (authError) {
            if (authError.message.includes("already registered")) {
                throw new Error("เลขบัตรประชาชนนี้เคยลงทะเบียนไว้แล้ว");
            }
            throw authError;
        }

        const userId = authUser.user.id;
        
        let avatarUrl = null;
        if (regData.profileImageFile) {
            const fileName = `${userId}.${regData.profileImageFile.name.split('.').pop()}`;
            await supabase.storage.from('avatars').upload(fileName, regData.profileImageFile);
            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
            avatarUrl = publicUrl;
        }

        const { error: updateError } = await supabase.from('profiles').update({
            id_card: regData.idCard,
            phone: regData.phone,
            password_text: regData.password, 
            contact_email: regData.email,
            avatar_url: avatarUrl,
            title_th: regData.title_th, first_name_th: regData.first_name_th, last_name_th: regData.last_name_th,
            title_en: regData.title_en, first_name_en: regData.first_name_en, last_name_en: regData.last_name_en,
            nationality: regData.nationality, religion: regData.religion, dob: regData.dob,
            house_no: regData.house_no, village: regData.village, building: regData.building,
            room_no: regData.room_no, floor: regData.floor, moo: regData.moo, soi: regData.soi, road: regData.road,
            province: regData.province, district: regData.district, 
            sub_district: regData.sub_district, zip_code: regData.zip_code,
            weight: parseFloat(regData.weight || 0),
            height: parseFloat(regData.height || 0),
            blood_group: regData.blood_group,
            emergency_contact_name: regData.emergency_contact_name,
            emergency_contact_phone: regData.emergency_contact_phone,
            emergency_relationship: regData.emergency_relationship
        }).eq('id', userId);

        if (updateError) throw updateError;

        if (currentRole === 'patient') {
            const { error: patientErr } = await supabase.from('patients').insert([{
                user_id: userId,
                hn_number: regData.patientId || null,
                weight: parseFloat(regData.weight || 0),
                height: parseFloat(regData.height || 0),
                blood_group: regData.blood_group,
                treatment_status: 'waiting_exam',
                emergency_contact_name: regData.emergency_contact_name,
                emergency_contact_phone: regData.emergency_contact_phone,
                emergency_relationship: regData.emergency_relationship
            }]);
            if (patientErr) throw patientErr;
        } 
        else if (currentRole === 'doctor') {
            const { error: doctorErr } = await supabase.from('doctors').insert([{
                user_id: userId,
                license_id: regData.doctorId,
                specialization: regData.specialization,
                department: regData.department,
                education: regData.education
            }]);
            if (doctorErr) throw doctorErr;
        }
        else if (currentRole === 'admin') {
            const { error: adminErr } = await supabase.from('admins').insert([{
                user_id: userId,
                department: regData.department
            }]);
            if (adminErr) throw adminErr;
        }

        alert("ลงทะเบียนสำเร็จ!");
        
        if (onLoginSuccess) {
            onLoginSuccess(userId);
        }

    } catch (error) {
        console.error("Reg Error:", error.message);
        alert("เกิดข้อผิดพลาด: " + error.message);
    } finally {
        setLoading(false);
    }
  };
  
  const handleForgotSubmit = async (e) => {
      e.preventDefault();
      const currentHour = new Date().getHours();
      if (currentHour < 8 || currentHour >= 22) {
          return alert("❌ ไม่สามารถทำรายการได้\nระบบให้บริการขอรหัสผ่านช่วงเวลา 08:00 - 22:00 น. เท่านั้น");
      }
      if (!forgotData.idCard || forgotData.idCard.length !== 13) return alert("กรุณากรอกเลขบัตร 13 หลัก");
      if (!forgotData.phone || forgotData.phone.length !== 10) return alert("กรุณากรอกเบอร์โทรศัพท์ 10 หลัก");

      setLoading(true);
      try {
          const { data: userExist, error: userErr } = await supabase
              .from('profiles')
              .select('id')
              .eq('id_card', forgotData.idCard)
              .eq('phone', forgotData.phone)
              .single();

          if (!userExist) throw new Error("ไม่พบข้อมูลผู้ป่วยที่ตรงกับเลขบัตรและเบอร์โทรศัพท์นี้");

          const { error: reqErr } = await supabase
          .from('password_requests')
           .upsert([{ 
         id_card: forgotData.idCard, 
         phone: forgotData.phone, 
         status: 'pending',
         admin_response: null,       
         resolved_at: null           
         }], { onConflict: 'id_card' }); 
 
          if (reqErr) throw reqErr;

          alert("ส่งคำร้องไปยังแอดมินเรียบร้อยแล้ว\nกรุณารอสักครู่ ระบบจะตรวจสอบข้อมูลตอบกลับอัตโนมัติ");

          const checkResponse = setInterval(async () => {
              const { data, error } = await supabase
                  .from('password_requests')
                  .select('admin_response, status')
                  .eq('id_card', forgotData.idCard)
                  .single();

              if (data?.admin_response) {
                  setForgotData(prev => ({ 
                      ...prev, 
                      adminResponse: data.admin_response,
                      status: data.status 
                  }));
                  clearInterval(checkResponse);
                  setLoading(false);
              }
          }, 3000);

      } catch (err) {
          alert(err.message);
          setLoading(false);
      }
  };

  return (
    <>
      <ThemeToggle theme={theme} setTheme={setTheme} />
      <div className={`auth-wrapper ${theme === 'dark' ? 'dark' : ''}`}>
        <div className={`container ${isRegisterActive ? 'active' : ''} ${theme === 'dark' ? 'dark' : ''}`}>

          <div className="form-box login">
              {!isForgotPassword ? (
                  <form onSubmit={handleLogin} className="w-full max-w-xs flex flex-col items-center px-4 md:px-0">
                    <img src={logoImg} alt="WelTech Logo" className="w-20 h-20 md:w-24 md:h-24 mb-4 object-contain" />
                    <h1 className="mb-2 text-xl md:text-2xl font-bold">เข้าสู่ระบบ</h1>
                    <p className="mb-6 opacity-70 text-center text-sm md:text-base">
                        WelTech Website <br />
                        <span className="text-base md:text-lg font-bold">
                            {currentRole === 'patient' ? 'สำหรับผู้ป่วย' : (currentRole === 'doctor' ? 'สำหรับแพทย์' : 'สำหรับแอดมิน')}
                        </span>
                    </p>
                    <div className="w-full space-y-3">
                      <InputField theme={theme} placeholder="เลขบัตรประชาชน" icon={User} value={loginId} onChange={(e) => setLoginId(e.target.value)} required />
                      <InputField theme={theme} type="password" placeholder="รหัสผ่าน" icon={Key} value={loginPwd} onChange={(e) => setLoginPwd(e.target.value)} required />
                    </div>
                    <div className="w-full text-right mt-2">
                        <span onClick={() => setIsForgotPassword(true)} className="text-xs text-blue-500 cursor-pointer hover:underline">ลืมรหัสผ่าน?</span>
                    </div>
                    
                    <button type="submit" className="btn mt-6 shadow-lg w-full md:w-auto">
                        {loading ? 'Loading...' : 'เข้าสู่ระบบ'}
                    </button>

                    <div className="md:hidden text-center mt-6 w-full pt-4 border-t border-dashed border-gray-300">
                        <p className="text-gray-600 text-sm">ยังไม่มีบัญชีใช่หรือไม่?</p>
                        <button 
                          type="button" 
                          onClick={() => setIsRegisterActive(true)} 
                          className="font-bold underline mt-1 transition-colors"
                          style={{ color: 'var(--theme-primary)' }}
                        >
                          สมัครสมาชิกใหม่ที่นี่
                        </button>
                    </div>

                    <div className="mt-8 pt-6 border-t border-dashed border-gray-300 w-full text-center">
                        {currentRole === 'patient' ? (
                            <div className="flex flex-col items-center">
                              <p className="text-xs mb-3 opacity-60">สำหรับเจ้าหน้าที่</p>
                              <div className="flex justify-center gap-3">
                                  <button type="button" onClick={()=>setCurrentRole('doctor')} className={`text-[10px] md:text-xs px-5 md:px-6 py-2 rounded-full font-bold transition-all text-white ${currentRole === 'doctor' ? 'bg-blue-700 shadow-md' : 'bg-blue-500 hover:bg-blue-600'}`}>แพทย์</button>
                                  <button type="button" onClick={()=>setCurrentRole('admin')} className={`text-[10px] md:text-xs px-5 md:px-6 py-2 rounded-full font-bold transition-all text-white ${currentRole === 'admin' ? 'bg-purple-900 shadow-md' : 'bg-purple-700 hover:bg-purple-800'}`}>แอดมิน</button>
                              </div>
                            </div>
                        ) : (
                            <button type="button" onClick={()=>setCurrentRole('patient')} className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"><ArrowLeft size={16}/> กลับสู่หน้าผู้ป่วย</button>
                        )}
                    </div>

                    <div className="relative z-10 w-full pt-10 md:pt-20 pb-4 flex flex-col items-center justify-center">
                        <img src={kmutnbLogo} alt="KMUTNB Logo" className="h-10 md:h-12 object-contain" />
                    </div>
                  </form>
              ) : (
                  <form onSubmit={handleForgotSubmit} className="w-full max-w-xs flex flex-col items-center animate-fade-in px-4">
                    <div className="w-full mb-4">
                        <button type="button" onClick={() => { setIsForgotPassword(false); setForgotData({ idCard: '', phone: '', adminResponse: '' }); }} className="text-gray-400 hover:text-gray-600 flex items-center gap-1">
                            <ArrowLeft size={20}/> <span className="text-xs">ย้อนกลับ</span>
                        </button>
                    </div>
                    <h1 className="mb-2 text-xl md:text-2xl font-bold text-red-500">ลืมรหัสผ่าน</h1>
                    <div className="w-full space-y-3">
                        <InputField theme={theme} label="เลขบัตรประชาชน" icon={User} value={forgotData.idCard} onChange={(e) => setForgotData({...forgotData, idCard: e.target.value})} maxLength={13} required placeholder="เลขบัตร 13 หลัก" />
                        <InputField theme={theme} label="เบอร์โทรศัพท์" icon={Phone} value={forgotData.phone} onChange={(e) => setForgotData({...forgotData, phone: e.target.value})} maxLength={10} required placeholder="เบอร์โทรศัพท์ที่ลงทะเบียน" />
                    </div>
                    <button type="submit" className="btn mt-6 shadow-lg bg-red-500 hover:bg-red-600 border-none text-white w-full" disabled={loading}>
                        {loading ? 'กำลังส่งข้อมูลและรอตอบกลับ...' : 'ส่งคำร้องขอรหัสผ่าน'}
                    </button>
                    <div className={`mt-6 w-full p-4 rounded-xl border-2 border-dashed text-center ${forgotData.adminResponse ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                        <p className="text-xs text-gray-500 font-bold mb-1">-- รหัสผ่านของท่าน --</p>
                        {forgotData.adminResponse ? (
                            <div className="text-xl md:text-2xl font-mono font-bold text-green-600 tracking-widest animate-fade-in">{forgotData.adminResponse}</div>
                        ) : (
                            <div className="text-xs text-gray-400 flex flex-col items-center gap-1">
                                <Loader size={16} className={loading ? 'animate-spin' : 'hidden'}/>
                                {loading ? 'กำลังรอการตรวจสอบจากแอดมิน...' : 'รอแอดมินส่งรหัส...'}
                            </div>
                        )}
                    </div>
                  </form>
              )}
          </div>

          <div className="form-box register">
              <form onSubmit={handleRegister} className="w-full h-full flex flex-col items-center p-4 md:p-0">
                <div className="md:hidden w-full mb-4">
                    <button 
                      type="button" 
                      onClick={() => setIsRegisterActive(false)} 
                      className="flex items-center gap-1 font-bold transition-colors"
                      style={{ color: 'var(--theme-primary)' }}
                    >
                      <ArrowLeft size={20}/> <span>กลับหน้าเข้าสู่ระบบ</span>
                    </button>
                </div>

                <h1 className="text-xl md:text-2xl font-bold mb-1" style={{color: 'var(--theme-primary)'}}>ลงทะเบียน{currentRole === 'patient' ? 'ผู้ป่วย' : (currentRole === 'doctor' ? 'แพทย์' : 'แอดมิน')}</h1>
                <p className="text-xs text-gray-400 mb-4">กรอกข้อมูลให้ครบถ้วนเพื่อสร้างบัญชี</p>
                
                <div className="w-full flex-1 overflow-y-auto custom-scroll pr-2 text-left pb-4">
                    <div className="text-center mb-6 mt-2">
                        <label htmlFor="upload-avatar" className="profile-upload inline-block relative group">
                            <div className="w-[80px] h-[80px] md:w-[90px] md:h-[90px] rounded-full border-4 overflow-hidden flex items-center justify-center transition-transform group-hover:scale-105"
                                 style={{ borderColor: 'var(--theme-primary)', backgroundColor: 'var(--input-bg-light)' }}>
                                {regData.profileImage ? <img src={regData.profileImage} alt="Profile" className="w-full h-full object-cover" /> : <User size={40} className="text-gray-300" />}
                            </div>
                            <div className="upload-icon absolute bottom-0 right-0 rounded-full p-1.5 border-2 border-white shadow-sm" style={{ backgroundColor: 'var(--theme-primary)', color: 'white' }}>
                                <Camera size={14}/>
                            </div>
                        </label>
                        <input id="upload-avatar" type="file" accept="image/*" hidden onChange={handleImageUpload} />
                    </div>

                    <div className="mb-5 pb-5 border-b border-gray-100">
                        <p className="text-sm font-bold mb-3 flex items-center gap-2" style={{color: 'var(--theme-primary)'}}><User size={16}/> ข้อมูลบัญชี</p>
                        <InputField theme={theme} label="เลขบัตรประชาชน (13 หลัก)" name="idCard" value={regData.idCard} onChange={handleRegChange} maxLength={13} required error={errors.idCard} />
                        {currentRole !== 'admin' && (
                            <InputField theme={theme} label={currentRole === 'patient' ? "เลขประจำตัวผู้ป่วย (HN) (ถ้ามี)" : "เลขใบประกอบวิชาชีพเวชกรรม (ถ้ามี)"} name={currentRole === 'patient' ? 'patientId' : 'doctorId'} value={currentRole === 'patient' ? regData.patientId : regData.doctorId} onChange={handleRegChange} />
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <InputField theme={theme} type="password" label="รหัสผ่าน" name="password" value={regData.password} onChange={handleRegChange} required error={errors.password} hint="6 ตัวขึ้นไป" />
                            <InputField theme={theme} type="password" label="ยืนยันรหัสผ่าน" name="confirmPassword" value={regData.confirmPassword} onChange={handleRegChange} required />
                        </div>
                    </div>

                    <div className="mb-5 pb-5 border-b border-gray-100">
                        <p className="text-sm font-bold mb-3 flex items-center gap-2" style={{color: 'var(--theme-primary)'}}><FileText size={16}/> ข้อมูลส่วนตัว</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <InputField theme={theme} label="เบอร์โทรศัพท์" name="phone" value={regData.phone} onChange={handleRegChange} maxLength={10} required error={errors.phone} />
                            <InputField theme={theme} label="อีเมล (ถ้ามี)" name="email" value={regData.email} onChange={handleRegChange} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 mt-2">
                             <div className="md:col-span-3"><CustomCombobox theme={theme} label="คำนำหน้า" name="title_th" value={regData.title_th} options={currentRole === 'doctor' ? ['นพ.', 'พญ.', 'ดร.', 'ทนพ.', 'ทนพญ.'] : ['นาย', 'นาง', 'นางสาว', 'ด.ช.', 'ด.ญ.']} onChange={handleRegChange} required /></div>
                             <div className="md:col-span-5"><InputField theme={theme} label="ชื่อ (ไทย)" name="first_name_th" value={regData.first_name_th} onChange={handleRegChange} required placeholder="ภาษาไทย" /></div>
                             <div className="md:col-span-4"><InputField theme={theme} label="นามสกุล (ไทย)" name="last_name_th" value={regData.last_name_th} onChange={handleRegChange} required /></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                             <div className="md:col-span-3"><CustomCombobox theme={theme} label="Title" name="title_en" value={regData.title_en} options={currentRole === 'doctor' ? ['Dr.', 'Mr.', 'Mrs.', 'Ms.'] : ['Mr.', 'Mrs.', 'Ms.', 'Master', 'Miss']} onChange={handleRegChange} required /></div>
                             <div className="md:col-span-5"><InputField theme={theme} label="Name (Eng)" name="first_name_en" value={regData.first_name_en} onChange={handleRegChange} required placeholder="English" /></div>
                             <div className="md:col-span-4"><InputField theme={theme} label="Surname (Eng)" name="last_name_en" value={regData.last_name_en} onChange={handleRegChange} required /></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                           <CustomCombobox theme={theme} label="สัญชาติ" name="nationality" value={regData.nationality} options={nationalityOpts} onChange={handleRegChange} required />
                           <CustomCombobox theme={theme} label="ศาสนา" name="religion" value={regData.religion} options={RELIGIONS} onChange={handleRegChange} required />
                        </div>
                        <div className="mt-3">
                            <label className="label-text">วันเดือนปีเกิด <span className="required-star">*</span></label>
                            <InputField type="date" name="dob" value={regData.dob} onChange={handleRegChange} required theme={theme} />
                        </div>
                    </div>

                    {currentRole === 'patient' && (
                        <div className="mb-5 pb-5 border-b border-gray-100">
                            <p className="text-sm font-bold mb-3 flex items-center gap-2" style={{color: 'var(--theme-primary)'}}><Activity size={16}/> ข้อมูลสุขภาพ (สำคัญ)</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-2">
                                <InputField theme={theme} label="น้ำหนัก (กก.)" name="weight" value={regData.weight} onChange={handleRegChange} required />
                                <InputField theme={theme} label="ส่วนสูง (ซม.)" name="height" value={regData.height} onChange={handleRegChange} required />
                                <div className="col-span-2 md:col-span-1">
                                    <CustomCombobox theme={theme} label="กรุ๊ปเลือด" name="blood_group" value={regData.blood_group} options={['A', 'B', 'O', 'AB']} onChange={handleRegChange} required />
                                </div>
                            </div>
                            {bmiStatus && <div className={`bmi-box mb-3 p-2 rounded-lg text-center font-bold ${bmiStatus.color}`}>BMI: {bmiValue} — {bmiStatus.text}</div>}
                            <div className="space-y-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    <InputField theme={theme} label="โรคประจำตัว" name="disease" value={regData.disease} onChange={handleRegChange} placeholder="-" />
                                    <InputField theme={theme} label="ประวัติผ่าตัด" name="surgical_history" value={regData.surgical_history} onChange={handleRegChange} placeholder="-" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    <InputField theme={theme} label="ยาที่แพ้" name="drugAllergy" value={regData.drugAllergy} onChange={handleRegChange} placeholder="-" />
                                    <InputField theme={theme} label="อาหารที่แพ้" name="food_allergies" value={regData.food_allergies} onChange={handleRegChange} placeholder="-" />
                                </div>
                                <InputField theme={theme} label="ยาที่รับประทานปัจจุบัน" name="current_medication" value={regData.current_medication} onChange={handleRegChange} placeholder="ชื่อยา, ปริมาณ" />
                            </div>
                            <div className="mt-4 pt-4 border-t border-dashed border-gray-200">
                                <label className="label-text mb-2 text-red-500 font-bold block">ข้อมูลติดต่อฉุกเฉิน *</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    <InputField theme={theme} label="ชื่อ-นามสกุล" name="emergency_contact_name" value={regData.emergency_contact_name} onChange={handleRegChange} required />
                                    <InputField theme={theme} label="เบอร์โทรศัพท์" name="emergency_contact_phone" value={regData.emergency_contact_phone} onChange={handleRegChange} required maxLength={10}/>
                                </div>
                                <div className="mt-2">
                                    <CustomCombobox theme={theme} label="ความสัมพันธ์" name="emergency_relationship" value={regData.emergency_relationship} options={['บิดา', 'มารดา', 'บุตร', 'ผู้ปกครอง', 'พี่', 'น้อง', 'ญาติ', 'คู่สมรส', 'เพื่อน']} onChange={handleRegChange} required />
                                </div>
                            </div>
                        </div>
                    )}

                    {currentRole === 'doctor' && (
                        <div className="mb-5 pb-5 border-b border-gray-100">
                             <p className="text-sm font-bold mb-3 flex items-center gap-2" style={{color: 'var(--theme-primary)'}}><Stethoscope size={16}/> ข้อมูลแพทย์</p>
                             <InputField theme={theme} label="ประวัติการศึกษา (เช่น พ.บ., ว.ว.)" name="education" value={regData.education} onChange={handleRegChange} required />
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                 <InputField theme={theme} label="ความเชี่ยวชาญ" name="specialization" value={regData.specialization} onChange={handleRegChange} required />
                                 <InputField theme={theme} label="แผนกที่สังกัด" name="department" value={regData.department} onChange={handleRegChange} required />
                             </div>
                        </div>
                    )}

                    {currentRole === 'admin' && (
                        <div className="mb-5 pb-5 border-b border-gray-100">
                             <p className="text-sm font-bold mb-3 flex items-center gap-2" style={{color: 'var(--theme-primary)'}}><Shield size={16}/> ข้อมูลผู้ดูแลระบบ</p>
                             <InputField theme={theme} label="สังกัด/ฝ่ายงาน" name="department" value={regData.department} onChange={handleRegChange} required placeholder="ฝ่ายไอที" />
                        </div>
                    )}

                    <div>
                        <p className="text-sm font-bold mb-3 flex items-center gap-2" style={{color: 'var(--theme-primary)'}}><MapPin size={16}/> ที่อยู่ปัจจุบัน</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            <InputField theme={theme} label="บ้านเลขที่" name="house_no" value={regData.house_no} onChange={handleRegChange} required />
                            <InputField theme={theme} label="หมู่ที่" name="moo" value={regData.moo} onChange={handleRegChange} />
                            <InputField theme={theme} label="อาคาร/หมู่บ้าน" name="village" value={regData.village} onChange={handleRegChange} />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            <InputField theme={theme} label="ชั้น" name="floor" value={regData.floor} onChange={handleRegChange} />
                            <InputField theme={theme} label="ห้อง" name="room_no" value={regData.room_no} onChange={handleRegChange} />
                            <InputField theme={theme} label="ซอย" name="soi" value={regData.soi} onChange={handleRegChange} />
                        </div>
                        <InputField theme={theme} label="ถนน" name="road" value={regData.road} onChange={handleRegChange} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <CustomCombobox theme={theme} label="จังหวัด" name="province" value={regData.province} options={provinceOpts} onChange={handleRegChange} required />
                            <CustomCombobox theme={theme} label="อำเภอ/เขต" name="district" value={regData.district} options={districtOpts} onChange={handleRegChange} required disabled={!regData.province}/>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <CustomCombobox theme={theme} label="ตำบล/แขวง" name="sub_district" value={regData.sub_district} options={subDistrictOpts} onChange={handleRegChange} required disabled={!regData.district}/>
                            <InputField theme={theme} label="รหัสไปรษณีย์" name="zip_code" value={regData.zip_code} onChange={handleRegChange} required disabled />
                        </div>
                    </div>
                </div>

                <button type="submit" className="btn mt-2 w-full md:w-auto px-10 py-3 font-bold text-white bg-[#00897b] rounded-xl">
                    {loading ? 'กำลังบันทึก...' : 'ลงทะเบียน'}
                </button>
              </form>
          </div>

          {/* TOGGLE BOX */}
          <div className="toggle-box hidden md:block">
             <div className="toggle-panel toggle-left">
                <h1 className="text-3xl font-bold mb-2">สร้างบัญชีใหม่</h1>
                <p>กรอกข้อมูลส่วนตัวเพื่อเริ่มใช้งาน WelTech</p>
                <button className="btn" onClick={() => setIsRegisterActive(true)}>สมัครสมาชิก</button>
             </div>
             <div className="toggle-panel toggle-right">
                <h1 className="text-3xl font-bold mb-2">เข้าสู่ระบบ</h1>
                <p>เชื่อมต่อกับบริการสุขภาพของคุณได้ทันที</p>
                <button className="btn" onClick={() => setIsRegisterActive(false)}>เข้าสู่ระบบ</button>
             </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default AuthPage;