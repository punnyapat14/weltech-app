import React from 'react';
import { 
    Menu, X, Home, User, ClipboardList, MessageCircle, 
    Users, Stethoscope, Shield, FileText, ArrowLeft, Microscope,
    BookOpen 
    // Edit3 เอาออกก็ได้ถ้าไม่ได้ใช้แล้ว
} from 'lucide-react';
import { ThemeToggle } from './UIComponents'; 
import logoImg from '../assets/logo.png'; 

// --- SIDEBAR COMPONENT ---
export const Sidebar = ({ 
    isSidebarOpen, 
    setIsSidebarOpen, 
    theme, 
    setTheme, 
    userProfile, 
    activeTab, 
    handleTabChange, 
    hasUnreadMsg, 
    onSignOut 
}) => {
    
    // กำหนดเมนูตาม Role
    const menuItems = {
        patient: [
            { id: 'home', label: 'หน้าหลัก', icon: Home },
            { id: 'profile', label: 'ประวัติส่วนตัว', icon: User },
            { id: 'history', label: 'ประวัติการรักษา', icon: ClipboardList }, 
            { id: 'consult', label: 'แพทย์อบอุ่น', icon: MessageCircle, hasBadge: true }, 
            { id: 'knowledge', label: 'เกร็ดความรู้สุขภาพ', icon: BookOpen }, 
        ],
        doctor: [
            { id: 'home', label: 'หน้าหลัก', icon: Home },
            { id: 'profile', label: 'ประวัติส่วนตัว', icon: User },
            { id: 'patients_all', label: 'ผู้ป่วยทั้งหมด', icon: Users },
            { id: 'patients_my', label: 'ผู้ป่วยในการดูแล', icon: Stethoscope },
            { id: 'consult', label: 'แพทย์อบอุ่น', icon: MessageCircle, hasBadge: true },
            // ✅ รวมเมนูสร้างบทความไว้ใน "เกร็ดความรู้สุขภาพ" แล้ว จึงลบเมนูแยกออก
            { id: 'knowledge', label: 'เกร็ดความรู้สุขภาพ', icon: BookOpen },
            { id: 'smart_lab', label: 'Smart Lab AI', icon: Microscope },
        ],
        admin: [
            { id: 'home', label: 'หน้าหลัก', icon: Home },
            { id: 'profile', label: 'ประวัติส่วนตัว', icon: User },
            { id: 'patients_info', label: 'ข้อมูลบัญชีผู้ป่วย', icon: Users },
            { id: 'doctors_info', label: 'ข้อมูลบัญชีแพทย์', icon: Stethoscope },
            { id: 'admins_info', label: 'ข้อมูลบัญชีแอดมิน', icon: Shield },
            { id: 'requests', label: 'คำร้องรหัสผ่าน', icon: FileText },
            // ✅ เหลือไว้แค่อันเดียว
            { id: 'knowledge', label: 'คลังความรู้', icon: BookOpen },
        ]
    };

    const currentMenu = menuItems[userProfile?.role] || menuItems['patient'];

    return (
        <>
            {/* Backdrop สำหรับ Mobile */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 z-20 bg-black/50 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsSidebarOpen(false)} 
                ></div>
            )}

            <aside className={`
                fixed inset-y-0 left-0 z-30 w-64 h-full flex flex-col shrink-0 border-r transition-transform duration-300 ease-in-out
                md:static md:translate-x-0 
                ${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}
                ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
            `}>
                <div className={`p-6 flex items-center justify-between border-b ${theme === 'dark' ? 'border-slate-800' : 'border-gray-100'}`}>
                    <div className="flex items-center gap-3">
                        <img src={logoImg} className="w-10 h-10 object-contain bg-transparent rounded-lg p-1" alt="Logo"/>
                        <div>
                            <h2 className="font-bold text-lg leading-none" style={{color: 'var(--theme-primary)'}}>WelTech</h2>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider">{userProfile?.role} Portal</span>
                        </div>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-red-500">
                        <X size={24} />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scroll">
                    {currentMenu.map(item => (
                        <button 
                            key={item.id} 
                            onClick={() => { handleTabChange(item.id); setIsSidebarOpen(false); }} 
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all font-medium relative group
                                ${activeTab === item.id 
                                    ? 'text-white shadow-lg' 
                                    : (theme === 'dark' ? 'text-gray-400 hover:bg-slate-800' : 'text-gray-500 hover:bg-gray-50')
                                }`} 
                            style={activeTab === item.id ? {backgroundColor: 'var(--theme-primary)'} : {}}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon size={20}/> {item.label}
                            </div>
                            {item.hasBadge && hasUnreadMsg && (
                                <span className="flex h-3 w-3 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white dark:border-slate-900"></span>
                                </span>
                            )}
                        </button>
                    ))}
                </nav>
                
                <div className={`p-4 border-t ${theme === 'dark' ? 'border-slate-800' : 'border-gray-100'}`}>
                    <div className={`flex items-center justify-between mb-4 p-3 rounded-xl ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}`}>
                        <span className="text-xs font-bold opacity-70">โหมดหน้าจอ</span>
                        <ThemeToggle theme={theme} setTheme={setTheme} style={{ position: 'relative', bottom: 'auto', right: 'auto', margin: 0, transform: 'scale(0.8)' }} />
                    </div>
                    <button onClick={onSignOut} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-red-500 hover:bg-red-500/10 font-bold transition-all">
                        <ArrowLeft size={18}/> ออกจากระบบ
                    </button>
                </div>
            </aside>
        </>
    );
};

// --- HEADER COMPONENT ---
export const Header = ({ theme, userProfile, setIsSidebarOpen }) => {
    const titlePrefix = userProfile?.title_th || 'คุณ';

    return (
        <header className={`flex flex-col md:flex-row md:justify-between md:items-start mb-6 pb-6 border-b transition-colors duration-300 ${theme === 'dark' ? 'border-slate-700' : 'border-gray-200'}`}>
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => setIsSidebarOpen(true)}
                    className="md:hidden p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-gray-300"
                >
                    <Menu size={24} />
                </button>

                <div>
                    <h1 className={`text-xl md:text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                        ยินดีต้อนรับ {titlePrefix} {userProfile?.first_name_th} {userProfile?.last_name_th}
                    </h1>
                    <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>โรงพยาบาลมหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ</p>
                </div>
            </div>
            
            <div className="mt-4 md:mt-0 text-left md:text-right pl-12 md:pl-0">
                <p className="text-xs text-gray-400 mb-1">
                    {userProfile?.role === 'doctor' ? 'เลขใบประกอบวิชาชีพ' : 'เลขประจำตัวประชาชน'}
                </p>
                <p className="font-mono font-bold text-lg tracking-wider" style={{color: 'var(--theme-primary)'}}>
                    {userProfile?.role === 'doctor' ? (userProfile?.medical_license_id || userProfile?.license_id || '-') : userProfile?.id_card}
                </p>
            </div>
        </header>
    );
};