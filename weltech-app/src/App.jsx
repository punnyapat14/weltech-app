import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient'; 
import { Loader } from 'lucide-react';

import kmutnbLogo from './assets/kmutnb.png';
import projectLogo from './assets/logo.png';

import WelcomePage from './WelcomePage'; 
import GlobalStyles from './components/GlobalStyles';
import { Sidebar, Header } from './components/Layout';

import AuthPage from './features/auth/AuthPage'; 
import PatientHome from './features/patient/PatientHome'; 
import ProfileView from './features/profile/ProfileView'; 
import PatientHistory from './features/history/PatientHistory'; 
import ConsultSection from './features/chat/ConsultSection'; 
import DoctorDashboard from './features/doctor/DoctorDashboard'; 
import DoctorSmartLab from './features/doctor/DoctorSmartLab'; 
import AdminDashboard from './features/admin/AdminDashboard'; 
import AdminAccountTable from './features/admin/AdminAccountTable'; 
import PasswordRequestTable from './features/admin/PasswordRequestTable'; 
import AllPatientsView from './features/doctor/AllPatientsView';
import MyPatientsView from './features/doctor/MyPatientsView';
import DoctorHealthTips from "./features/doctoradmin/DoctorHealthTips";
import KnowledgeFeed from './features/patient/KnowledgeFeed'; 

import { Chart as ChartJS } from 'chart.js';
ChartJS.defaults.font.family = 'Prompt'; 

const App = () => {
  const [showWelcome, setShowWelcome] = useState(localStorage.getItem('hasEnteredApp') !== 'true');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState(localStorage.getItem('activeTab') || 'home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hasUnreadMsg, setHasUnreadMsg] = useState(false);
  
  const [patientsList, setPatientsList] = useState([]); 
  const [appointments, setAppointments] = useState([]); 
  const [treatmentHistory, setTreatmentHistory] = useState([]); 
  const [thaiAddressDB, setThaiAddressDB] = useState([]);
  const [selectedChatPatientId, setSelectedChatPatientId] = useState(null);

  const notificationAudio = useRef(null);
  const currentUserIdRef = useRef(null);
  const isRegisteringRef = useRef(false);

  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);


  useEffect(() => {
    notificationAudio.current = new Audio('/alert.mp3');
    const fetchAddr = async () => {
        try {
            const res = await fetch('/thai_address.json'); 
            const raw = await res.json();
            setThaiAddressDB(raw); 
        } catch(e) { console.error("Error loading address:", e); }
    };
    fetchAddr();

    const passwordChannel = supabase
      .channel('public:password_requests')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'password_requests' }, payload => {
          if (payload.new.admin_response && notificationAudio.current) {
              notificationAudio.current.play().catch(e => {});
          }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(passwordChannel);
    };
  }, []);

  useEffect(() => { 
      if (userProfile?.role) {
          document.body.setAttribute('data-role', userProfile.role); 
      } else {
          document.body.removeAttribute('data-role');
      }
  }, [userProfile?.role]);

  const fetchProfile = async (userId) => { 
    if (isRegisteringRef.current) return;
    setProfileLoading(true);
    try {
        const { data: basicProfile, error: fetchError } = await supabase
            .from('profiles')
            .select('*') 
            .eq('id', userId)
            .maybeSingle();

        if (fetchError) throw fetchError;

        if (basicProfile) { 
            let fullProfile = { ...basicProfile }; 

            if (basicProfile.role === 'patient') {
                 const { data: patientData } = await supabase.from('patients').select('*').eq('user_id', userId).maybeSingle();
                 
                 if(patientData) {
                     const validPatientData = Object.fromEntries(
                         Object.entries(patientData).filter(([_, v]) => v !== null && v !== '')
                     );

                     fullProfile = { 
                         ...fullProfile, 
                         ...validPatientData 
                     };
                 }
                 
                 const { data: historyData } = await supabase.from('treatment_history').select('*').eq('patient_id', userId).order('date', { ascending: false });
                 setTreatmentHistory(historyData || []);
            } else if (basicProfile.role === 'doctor') {
                 const { data: doctorData } = await supabase.from('doctors').select('*').eq('user_id', userId).maybeSingle();
                 if(doctorData) fullProfile = { ...fullProfile, ...doctorData };
            } else if (basicProfile.role === 'admin') {
                 const { data: adminData } = await supabase.from('admins').select('*').eq('user_id', userId).maybeSingle();
                 if(adminData) fullProfile = { ...fullProfile, ...adminData };
            }
            
            fullProfile.id = basicProfile.id;
            fullProfile.user_id = basicProfile.id;
            fullProfile.contact_email = basicProfile.contact_email || "";

            setUserProfile(fullProfile); 
        } else {
            await supabase.auth.signOut();
        }
    } catch (err) {
        console.error("Fetch Profile Error:", err);
    } finally {
        setProfileLoading(false);
    }
  };

  const handleSaveHealthData = async (userId, cleanedData, imageFile) => {
    try {
        setProfileLoading(true);
        let avatarUrl = userProfile.avatar_url;

        if (imageFile) {
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${userId}-${Date.now()}.${fileExt}`; 
            const filePath = `avatars/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, imageFile);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);
            
            avatarUrl = publicUrl;
        }

        const { error: profileError = null } = await supabase
            .from('profiles')
            .update({ 
                ...cleanedData, 
                avatar_url: avatarUrl,
                updated_at: new Date().toISOString() 
            })
            .eq('id', userId);

        if (profileError) throw profileError;

        if (userProfile.role === 'patient') {
            const patientFields = {
                weight: cleanedData.weight,
                height: cleanedData.height,
                blood_group: cleanedData.blood_group,
                disease: cleanedData.disease,
                allergy: cleanedData.allergy,
                food_allergies: cleanedData.food_allergies,
                current_medication: cleanedData.current_medication,
                surgical_history: cleanedData.surgical_history,
                emergency_contact_name: cleanedData.emergency_contact_name,
                emergency_contact_phone: cleanedData.emergency_contact_phone,
                emergency_relationship: cleanedData.emergency_relationship
            };

            const cleanedPatientData = Object.fromEntries(
                Object.entries(patientFields).filter(([_, v]) => v !== undefined)
            );

            if (Object.keys(cleanedPatientData).length > 0) {
                const { error: patientError } = await supabase
                    .from('patients')
                    .update(cleanedPatientData)
                    .eq('user_id', userId);
                
                if (patientError) throw patientError;
            }
        }

        await fetchProfile(userId); 
        if (userProfile.role === 'doctor') {
            await fetchPatientsForDoctor();
        }
        
        alert("บันทึกข้อมูลเรียบร้อยแล้ว");

    } catch (error) {
        console.error("Save Error:", error);
        alert("เกิดข้อผิดพลาดในการบันทึก: " + error.message);
    } finally {
        setProfileLoading(false);
    }
  };

  useEffect(() => {
      const initAuth = async () => {
          const { data: { session } } = await supabase.auth.getSession();
          setSession(session);
          if (session) {
              setShowWelcome(false); 
              localStorage.setItem('hasEnteredApp', 'true');
              currentUserIdRef.current = session.user.id;
              await fetchProfile(session.user.id);
          } else {
              setProfileLoading(false);
          }
      };
      initAuth();

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          if (isRegisteringRef.current) return; 
          setSession(session);
          if (session) {
            setShowWelcome(false); 
            localStorage.setItem('hasEnteredApp', 'true');
            if (currentUserIdRef.current !== session.user.id) {
                  currentUserIdRef.current = session.user.id; 
                  fetchProfile(session.user.id);   
              }
          } else {
              currentUserIdRef.current = null;
              setUserProfile(null);
              setProfileLoading(false); 
              setActiveTab('home'); 
              localStorage.removeItem('activeTab');
              localStorage.removeItem('hasEnteredApp');
          }
      });
      return () => subscription.unsubscribe();
  }, []);

  const handleEnterApp = () => {
    setShowWelcome(false);
    localStorage.setItem('hasEnteredApp', 'true');
  };

  const fetchPatientsForDoctor = async () => {
    try {
        const { data: profiles, error: pError } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'patient');
          
        const { data: patientsData, error: pdError } = await supabase
          .from('patients')
          .select('*');

        if (pError || pdError) throw pError || pdError;

        if (profiles) {
            const formattedPatients = profiles.map(p => {
                const pData = patientsData?.find(pd => String(pd.user_id) === String(p.id));
                
                return { 
                    ...p,
                    user_id: p.id,
                    doctor_id: pData?.doctor_id || null, 
                    name: `${p.title_th || ''}${p.first_name_th || ''} ${p.last_name_th || ''}`,
                    hn: pData?.hn_number || '-',
                    treatment_status: pData?.treatment_status || 'waiting_exam' 
                };
            });
            setPatientsList(formattedPatients);
        }
    } catch (err) { 
        console.error("Error fetching patients:", err); 
    }
  };

  const fetchAppointments = async () => {
      const { data } = await supabase.from('appointments').select('*').order('date', { ascending: true }).order('time', { ascending: true });
      if (data) setAppointments(data);
  };

  useEffect(() => {
      if (userProfile?.role === 'doctor') {
          fetchPatientsForDoctor();
          fetchAppointments();
      } else if (userProfile?.role === 'patient') {
          fetchAppointments();
      }
  }, [userProfile]);

  const handleTabChange = (tabId) => {
      setActiveTab(tabId);
      if (tabId === 'consult') setHasUnreadMsg(false);
      if (userProfile?.role === 'doctor' && (tabId === 'smart_lab' || tabId === 'home')) {
          fetchPatientsForDoctor();
          fetchAppointments();
      }
  };

  if (profileLoading) {
    return (
      <div className={`w-screen h-screen flex flex-col items-center justify-center transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>
         <Loader className="animate-spin mb-4" size={48} color="#f43f5e" />
         <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>กำลังดึงข้อมูลเซสชันล่าสุด...</p>
      </div>
    );
  }

  if (showWelcome && !session) return <WelcomePage onEnter={handleEnterApp} />;

  if (!session || !userProfile) {
      return (
        <>
            <GlobalStyles />
            <AuthPage 
                theme={theme} setTheme={setTheme} 
                onLoginSuccess={(id) => {
                    handleEnterApp(); 
                    fetchProfile(id);
                }}
                kmutnbLogo={kmutnbLogo} logoImg={projectLogo}
                setIsRegistering={(val) => { isRegisteringRef.current = val; }} 
            />
        </>
      );
  }

  return (
    <>
      <GlobalStyles />
      <div className={`w-screen h-screen font-sans transition-colors duration-300 flex overflow-hidden ${theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-white text-gray-800'}`}>
        
        <Sidebar 
            isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}
            theme={theme} setTheme={setTheme}
            userProfile={userProfile} 
            activeTab={activeTab} handleTabChange={handleTabChange}
            hasUnreadMsg={hasUnreadMsg}
            onSignOut={() => {
                localStorage.removeItem('activeTab');
                localStorage.removeItem('hasEnteredApp');
                supabase.auth.signOut();
            }}
        />

        <main className={`flex-1 flex flex-col h-full relative transition-all duration-300 ${isSidebarOpen ? 'ml-0 md:ml-64' : 'ml-0'}`}>
            <div className={`p-4 md:p-8 pb-4 sticky top-0 z-10 transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>
              <Header theme={theme} userProfile={userProfile} setIsSidebarOpen={setIsSidebarOpen} />
            </div>

            <div className={`flex-1 p-4 md:p-8 pt-0 overflow-y-auto custom-scroll transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>
                
                <div key={activeTab} className="animate-fade-in">
                    
                    {userProfile.role === 'patient' && (
                        <>
                            {activeTab === 'home' && <PatientHome theme={theme} userProfile={userProfile} appointments={appointments} />}
                            {activeTab === 'profile' && <ProfileView data={userProfile} addressDB={thaiAddressDB} theme={theme} onSaveHealthData={handleSaveHealthData} treatmentHistory={treatmentHistory} />} 
                            {activeTab === 'history' && <PatientHistory theme={theme} treatmentHistory={treatmentHistory} />}
                            {activeTab === 'consult' && <ConsultSection theme={theme} userProfile={userProfile} />}
                            {activeTab === 'knowledge' && <KnowledgeFeed theme={theme} userProfile={userProfile} />}
                        </>
                    )}

                    {userProfile.role === 'doctor' && (
                        <>
                            {activeTab === 'home' && (
                              <DoctorDashboard 
                                userProfile={userProfile} 
                                patientsList={patientsList} 
                                appointments={appointments} 
                                fetchAppointments={fetchAppointments} 
                                fetchPatients={fetchPatientsForDoctor} 
                                theme={theme} 
                              />
                            )}
                            {activeTab === 'smart_lab' && <DoctorSmartLab theme={theme} patientsList={patientsList} userProfile={userProfile} />}
                            {activeTab === 'profile' && <ProfileView data={userProfile} addressDB={thaiAddressDB} theme={theme} onSaveHealthData={handleSaveHealthData} />} 
                            {activeTab === 'patients_all' && <AllPatientsView patientsList={patientsList} theme={theme} />}
                            {activeTab === 'patients_my' && <MyPatientsView patientsList={patientsList} userProfile={userProfile} theme={theme} fetchPatients={fetchPatientsForDoctor} />}
                            {activeTab === 'consult' && <ConsultSection theme={theme} userProfile={userProfile} patientsList={patientsList} targetPatientId={selectedChatPatientId} />}
                            {activeTab === 'knowledge' && <DoctorHealthTips userProfile={userProfile} theme={theme} />}
                        </>
                    )}


                    {userProfile.role === 'admin' && (
                        <>
                            {activeTab === 'home' && <AdminDashboard theme={theme} />}
                            {activeTab === 'patients_info' && <AdminAccountTable roleType="patient" title="ข้อมูลบัญชีผู้ป่วย" theme={theme} />}
                            {activeTab === 'doctors_info' && <AdminAccountTable roleType="doctor" title="ข้อมูลบัญชีแพทย์" theme={theme} />}
                            {activeTab === 'admins_info' && <AdminAccountTable roleType="admin" title="ข้อมูลบัญชีแอดมิน" theme={theme} />}
                            {activeTab === 'profile' && <ProfileView data={userProfile} addressDB={thaiAddressDB} theme={theme} onSaveHealthData={handleSaveHealthData} />}
                            {activeTab === 'knowledge' && <DoctorHealthTips userProfile={userProfile} theme={theme} />}

                            {activeTab === 'password_requests' && <PasswordRequestTable theme={theme} />}
                        </>
                    )}

                </div> 
            </div>
        </main>
      </div>
    </>
  );
};

export default App;