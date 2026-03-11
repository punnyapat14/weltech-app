import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient'; 
import { 
    User, Stethoscope, Shield, Search, Eye, EyeOff, ClipboardList 
} from 'lucide-react';

const AdminAccountTable = ({ roleType, title, theme }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [showPassMap, setShowPassMap] = useState({});

    const fetchUsers = async () => {
        setLoading(true);
        try {
            let { data: profiles, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', roleType)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(profiles || []);
        } catch (err) {
            console.error("Error fetching users:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [roleType]);

    const togglePass = (id) => {
        setShowPassMap(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleCopy = (text) => {
        if(!text) return alert("ไม่มีข้อมูลรหัสผ่าน");
        navigator.clipboard.writeText(text);
        alert(`คัดลอกรหัสเรียบร้อย`);
    };

    const filteredUsers = users.filter(u => 
        (u.first_name_th && u.first_name_th.includes(searchTerm)) || 
        (u.id_card && u.id_card.includes(searchTerm)) ||
        (u.phone && u.phone.includes(searchTerm))
    );

    return (
        <div className={`h-full flex flex-col p-2 sm:p-4 animate-fade-in ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                        {roleType === 'patient' && <User className="text-emerald-500" size={24}/>}
                        {roleType === 'doctor' && <Stethoscope className="text-blue-500" size={24}/>}
                        {roleType === 'admin' && <Shield className="text-purple-500" size={24}/>}
                        <span className="truncate">{title}</span>
                        <span className="text-sm font-normal opacity-50 ml-1 md:ml-2">({filteredUsers.length})</span>
                    </h2>
                </div>
                
                <div className="relative w-full md:w-64">
                    <input 
                        type="text" 
                        placeholder="ค้นหาชื่อ, บัตรประชาชน..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`w-full pl-9 pr-3 py-2.5 md:py-2 rounded-xl border outline-none text-sm transition-all focus:ring-2 ${
                            theme === 'dark' 
                            ? 'bg-slate-800 border-slate-700 focus:ring-purple-500' 
                            : 'bg-white border-gray-200 focus:ring-blue-200 shadow-sm'
                        }`}
                    />
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40"/>
                </div>
            </div>

            <div className={`flex-1 overflow-hidden rounded-2xl border shadow-sm ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                <div className="overflow-auto h-full custom-scroll">
                    <table className="hidden md:table w-full text-left border-collapse min-w-[800px]">
                        <thead className={`sticky top-0 z-10 text-xs uppercase font-bold tracking-wider ${theme === 'dark' ? 'bg-slate-900 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
                            <tr>
                                <th className="p-4 border-b border-inherit">ชื่อ-นามสกุล</th>
                                <th className="p-4 border-b border-inherit">เลขบัตรประชาชน</th>
                                <th className="p-4 border-b border-inherit">เบอร์โทรศัพท์</th>
                                <th className="p-4 border-b border-inherit text-center w-48">รหัสผ่าน (เดิม)</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-inherit border-inherit">
                            {loading ? (
                                <tr><td colSpan="4" className="p-10 text-center opacity-50">กำลังโหลดข้อมูล...</td></tr>
                            ) : filteredUsers.length > 0 ? (
                                filteredUsers.map((u) => {
                                    const isShow = showPassMap[u.id];
                                    const passwordToShow = u.password_text || "ไม่พบข้อมูล"; 
                                    return (
                                        <tr key={u.id} className={`transition-colors ${theme === 'dark' ? 'hover:bg-slate-700/50 border-slate-700' : 'hover:bg-blue-50/50 border-gray-100'}`}>
                                            <td className="p-4">
                                                <div className="font-bold">{u.title_th}{u.first_name_th} {u.last_name_th}</div>
                                                <div className="text-xs opacity-50 truncate max-w-[200px]">{u.email || '-'}</div>
                                            </td>
                                            <td className="p-4 font-mono opacity-80">{u.id_card}</td>
                                            <td className="p-4 font-mono opacity-80">{u.phone || '-'}</td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <div className={`flex items-center gap-1 text-xs rounded px-2 py-1.5 min-w-[100px] justify-center ${theme === 'dark' ? 'bg-black/30' : 'bg-gray-100'}`}>
                                                        {isShow ? (
                                                            <span className="font-mono text-green-600 font-bold">{passwordToShow}</span>
                                                        ) : (
                                                            <span className="opacity-50">********</span>
                                                        )}
                                                    </div>
                                                    <button 
                                                        onClick={() => togglePass(u.id)}
                                                        className="p-1.5 rounded hover:bg-black/10 transition-colors text-blue-500"
                                                        title={isShow ? "ซ่อน" : "แสดง"}
                                                    >
                                                        {isShow ? <EyeOff size={16}/> : <Eye size={16}/>}
                                                    </button>
                                                    {isShow && (
                                                        <button 
                                                            onClick={() => handleCopy(passwordToShow)}
                                                            className="p-1.5 rounded hover:bg-black/10 transition-colors text-gray-500 hover:text-gray-700"
                                                            title="คัดลอก"
                                                        >
                                                            <ClipboardList size={16}/>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr><td colSpan="4" className="p-10 text-center opacity-50">ไม่พบข้อมูล</td></tr>
                            )}
                        </tbody>
                    </table>

                    <div className="md:hidden flex flex-col divide-y divide-inherit">
                        {loading ? (
                            <div className="p-8 text-center opacity-50 text-sm">กำลังโหลดข้อมูล...</div>
                        ) : filteredUsers.length > 0 ? (
                            filteredUsers.map((u) => {
                                const isShow = showPassMap[u.id];
                                const passwordToShow = u.password_text || "ไม่พบข้อมูล"; 
                                return (
                                    <div key={u.id} className={`p-4 space-y-3 ${theme === 'dark' ? 'hover:bg-slate-700/30' : 'hover:bg-gray-50'}`}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="font-bold text-base">{u.title_th}{u.first_name_th} {u.last_name_th}</div>
                                                <div className="text-xs opacity-50">{u.email || '-'}</div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div>
                                                <span className="block opacity-40 uppercase font-bold">บัตรประชาชน</span>
                                                <span className="font-mono">{u.id_card}</span>
                                            </div>
                                            <div>
                                                <span className="block opacity-40 uppercase font-bold">เบอร์โทรศัพท์</span>
                                                <span className="font-mono">{u.phone || '-'}</span>
                                            </div>
                                        </div>
                                        <div className={`flex items-center justify-between p-2 rounded-lg ${theme === 'dark' ? 'bg-black/20' : 'bg-gray-50'}`}>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] opacity-40 uppercase font-bold">รหัสผ่าน:</span>
                                                <span className={`font-mono text-sm ${isShow ? 'text-green-600 font-bold' : 'opacity-40'}`}>
                                                    {isShow ? passwordToShow : '********'}
                                                </span>
                                            </div>
                                            <div className="flex gap-1">
                                                <button 
                                                    onClick={() => togglePass(u.id)}
                                                    className="p-2 rounded-md bg-blue-500/10 text-blue-500"
                                                >
                                                    {isShow ? <EyeOff size={16}/> : <Eye size={16}/>}
                                                </button>
                                                {isShow && (
                                                    <button 
                                                        onClick={() => handleCopy(passwordToShow)}
                                                        className="p-2 rounded-md bg-gray-500/10 text-gray-500"
                                                    >
                                                        <ClipboardList size={16}/>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="p-8 text-center opacity-50 text-sm">ไม่พบข้อมูล</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminAccountTable;