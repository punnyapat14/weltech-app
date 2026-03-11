import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient'; 
import { Users, User, Stethoscope, Shield } from 'lucide-react';

const AdminDashboard = ({ theme }) => {
  const [stats, setStats] = useState({ total: 0, patient: 0, doctor: 0, admin: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data, error } = await supabase.from('profiles').select('role');
        if (error) throw error;
        if (data) {
          const total = data.length;
          const patient = data.filter(u => u.role === 'patient').length;
          const doctor = data.filter(u => u.role === 'doctor').length;
          const admin = data.filter(u => u.role === 'admin').length;
          setStats({ total, patient, doctor, admin });
        }
      } catch (err) { 
          console.error("Error fetching stats:", err); 
      } finally { 
          setLoading(false); 
      }
    };
    fetchStats();
  }, []);

  const getPieChartStyle = () => {
    const { total, patient, doctor, admin } = stats;
    if (total === 0) return { background: 'conic-gradient(#e2e8f0 0% 100%)' };
    
    const pDeg = (patient / total) * 360;
    const dDeg = (doctor / total) * 360;
    return {
      background: `conic-gradient(
        #10b981 0deg ${pDeg}deg, 
        #3b82f6 ${pDeg}deg ${pDeg + dDeg}deg, 
        #7e22ce ${pDeg + dDeg}deg 360deg
      )`
    };
  };

  const StatCard = ({ title, count, icon: Icon, colorClass }) => (
    <div className={`p-6 rounded-2xl border shadow-sm flex items-center justify-between hover:shadow-md transition-shadow ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
      <div>
        <p className="text-sm text-gray-400 mb-1">{title}</p>
        <h3 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{loading ? '-' : count}</h3>
        <p className="text-xs text-gray-400 mt-1">บัญชีในระบบ</p>
      </div>
      <div className={`p-4 rounded-xl ${colorClass}`}><Icon size={28} /></div>
    </div>
  );

  return (
    <div className="h-full flex flex-col gap-6">
      <div>
        <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Dashboard ภาพรวมระบบ</h2>
        <p className="text-gray-400 text-sm">สถิติผู้ใช้งานทั้งหมดในระบบ Hospital Platform</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start h-full">
        
        <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatCard title="บัญชีทั้งหมด" count={stats.total} icon={Users} colorClass={theme === 'dark' ? 'bg-slate-700 text-gray-300' : 'bg-gray-100 text-gray-600'} />
            <StatCard title="ผู้ป่วย (Patient)" count={stats.patient} icon={User} colorClass="bg-emerald-100 text-emerald-600" />
            <StatCard title="แพทย์ (Doctor)" count={stats.doctor} icon={Stethoscope} colorClass="bg-blue-100 text-blue-600" />
            <StatCard title="แอดมิน (Admin)" count={stats.admin} icon={Shield} colorClass="bg-purple-100 text-purple-600" />
        </div>

        <div className={`w-full lg:w-[35%] p-6 rounded-2xl border flex flex-col items-center justify-center shadow-sm ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
            <h3 className={`font-bold mb-6 text-lg self-start ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>สัดส่วนบัญชี</h3>
            
            <div className="relative w-56 h-56 rounded-full shadow-inner transition-transform hover:scale-105" style={getPieChartStyle()}>
               <div className={`absolute inset-0 m-auto w-32 h-32 rounded-full flex flex-col items-center justify-center shadow-sm ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}>
                  <span className={`text-3xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{stats.total}</span>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider">Users</span>
               </div>
            </div>

            <div className="mt-8 w-full space-y-3 px-2">
                <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-3"><span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm"></span><span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>ผู้ป่วย</span></div>
                    <span className="font-bold text-emerald-600">{stats.patient} คน</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-3"><span className="w-3 h-3 rounded-full bg-blue-500 shadow-sm"></span><span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>แพทย์</span></div>
                    <span className="font-bold text-blue-600">{stats.doctor} คน</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-3"><span className="w-3 h-3 rounded-full bg-purple-600 shadow-sm"></span><span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>แอดมิน</span></div>
                    <span className="font-bold text-purple-600">{stats.admin} คน</span>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;