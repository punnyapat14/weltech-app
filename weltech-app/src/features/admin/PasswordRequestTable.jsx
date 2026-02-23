import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Key, Send, Clock, CheckCircle, Search, User } from 'lucide-react';

const PasswordRequestTable = ({ theme }) => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [respondingId, setRespondingId] = useState(null);
    const [adminInput, setAdminInput] = useState('');

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('password_requests')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRequests(data || []);
        } catch (err) {
            console.error("Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
        
        // เพิ่ม Real-time Subscription เพื่อให้แอดมินเห็นคำร้องใหม่ทันที
        const channel = supabase
            .channel('db_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'password_requests' }, () => {
                fetchRequests();
            })
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, []);

    const handleSendResponse = async (requestId) => {
        if (!adminInput) return alert("กรุณากรอกรหัสผ่านเพื่อส่งให้ผู้ป่วย");

        try {
            const { error } = await supabase
                .from('password_requests')
                .update({ 
                    admin_response: adminInput,
                    status: 'resolved',
                    resolved_at: new Date().toISOString()
                })
                .eq('id', requestId);

            if (error) throw error;

            alert("ส่งรหัสผ่านให้ผู้ป่วยเรียบร้อยแล้ว");
            setAdminInput('');
            setRespondingId(null);
            fetchRequests();
        } catch (err) {
            alert("เกิดข้อผิดพลาด: " + err.message);
        }
    };

    const filteredRequests = requests.filter(r => 
        r.id_card.includes(searchTerm) || r.phone.includes(searchTerm)
    );

    return (
        <div className={`h-full flex flex-col p-4 animate-fade-in ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Key className="text-purple-500" /> จัดการคำร้องขอรหัสผ่าน
                </h2>
                <div className="relative w-64">
                    <input 
                        type="text" placeholder="ค้นหาเลขบัตร/เบอร์โทร..." 
                        className={`w-full pl-9 pr-3 py-2 rounded-xl border outline-none text-sm ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40"/>
                </div>
            </div>

            <div className={`flex-1 overflow-auto rounded-2xl border shadow-sm ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                <table className="w-full text-left border-collapse">
                    <thead className={`sticky top-0 z-10 text-xs font-bold uppercase ${theme === 'dark' ? 'bg-slate-900 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
                        <tr>
                            <th className="p-4 border-b border-inherit">วันที่ร้องขอ</th>
                            <th className="p-4 border-b border-inherit">ข้อมูลผู้ป่วย</th>
                            <th className="p-4 border-b border-inherit text-center">สถานะ</th>
                            <th className="p-4 border-b border-inherit">การตอบกลับจากแอดมิน</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-inherit border-inherit">
                        {loading ? (
                            <tr><td colSpan="4" className="p-8 text-center opacity-50">กำลังโหลดคำร้อง...</td></tr>
                        ) : filteredRequests.length === 0 ? (
                            <tr><td colSpan="4" className="p-8 text-center opacity-50">ไม่พบรายการคำร้อง</td></tr>
                        ) : filteredRequests.map((req) => (
                            <tr key={req.id} className={`${theme === 'dark' ? 'hover:bg-slate-700/50' : 'hover:bg-gray-50'}`}>
                                <td className="p-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        <Clock size={14} className="text-gray-400" />
                                        {new Date(req.created_at).toLocaleString('th-TH')}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="font-bold">เลขบัตร: {req.id_card}</div>
                                    <div className="text-xs opacity-60">เบอร์โทร: {req.phone}</div>
                                </td>
                                <td className="p-4 text-center">
                                    {req.status === 'pending' ? (
                                        <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-[10px] font-bold">รอการตอบกลับ</span>
                                    ) : (
                                        <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-bold flex items-center justify-center gap-1 mx-auto w-fit">
                                            <CheckCircle size={10} /> ดำเนินการแล้ว
                                        </span>
                                    )}
                                </td>
                                <td className="p-4">
                                    {req.status === 'pending' ? (
                                        respondingId === req.id ? (
                                            <div className="flex items-center gap-2">
                                                <input 
                                                    type="text" placeholder="พิมพ์รหัสใหม่..."
                                                    className={`p-1.5 rounded border text-xs outline-none ${theme === 'dark' ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-300'}`}
                                                    value={adminInput} onChange={(e) => setAdminInput(e.target.value)}
                                                />
                                                <button 
                                                    onClick={() => handleSendResponse(req.id)}
                                                    className="p-1.5 rounded bg-purple-600 text-white hover:bg-purple-700"
                                                >
                                                    <Send size={14} />
                                                </button>
                                                <button onClick={() => setRespondingId(null)} className="text-[10px] underline opacity-50">ยกเลิก</button>
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => setRespondingId(req.id)}
                                                className="px-3 py-1.5 rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 text-xs font-bold transition-colors"
                                            >
                                                ตอบกลับคำร้อง
                                            </button>
                                        )
                                    ) : (
                                        <div className="text-xs font-mono text-green-600 font-bold bg-green-50 p-2 rounded border border-green-100">
                                            รหัสที่ส่งไป: {req.admin_response}
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PasswordRequestTable;