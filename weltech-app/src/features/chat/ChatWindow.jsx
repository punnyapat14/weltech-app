import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient'; 
import {
  User, Stethoscope, MessageCircle, FileText, Download,
  BellRing, ClipboardList, CheckCheck, ImageIcon, Paperclip, FileUp, Loader, ArrowLeft
} from 'lucide-react';

const ChatWindow = ({ roomId, userProfile, theme, targetName, patientNameForBot, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const chatEndRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    audioRef.current = new Audio('/alert.mp3');
  }, []);

  useEffect(() => {
    if (!roomId) return;
    
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });
      if (data) setMessages(data);
      
      if(data && data.length > 0) {
         const unreadIds = data.filter(m => m.sender_id !== userProfile.user_id && !m.read).map(m => m.id);
         if(unreadIds.length > 0) {
            await supabase.from('messages').update({ read: true }).in('id', unreadIds);
         }
      }
    };
    fetchMessages();

    const channel = supabase
      .channel(`room_${roomId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` }, 
      (payload) => {
        setMessages((prev) => [...prev, payload.new]);
        
        if (payload.new.sender_id !== userProfile.user_id) {
            if(audioRef.current) audioRef.current.play().catch(e => console.log("Audio play error:", e));
            supabase.from('messages').update({ read: true }).eq('id', payload.new.id);
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
      (payload) => {
         setMessages(prev => prev.map(msg => msg.id === payload.new.id ? payload.new : msg));
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [roomId, userProfile.user_id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSendMedicalResult = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const confirmSend = window.confirm(`ยืนยันการส่งผลตรวจ "${file.name}" ให้กับ ${patientNameForBot} และบันทึกประวัติ?`);
      if (!confirmSend) return;

      setIsUploading(true);
      try {
          const fileExt = file.name.split('.').pop();
          const uniqueFileName = `RESULT_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `${roomId}/${uniqueFileName}`;

          const { error: uploadError } = await supabase.storage
                .from('chat-files')
                .upload(filePath, file);
            
          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
                .from('chat-files')
                .getPublicUrl(filePath);

          const doctorName = `${userProfile.title_th || ''}${userProfile.first_name_th} ${userProfile.last_name_th}`;
          const dateNow = new Date();
          const dateStr = dateNow.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'});
          
          const botMessage = `**แจ้งเตือนผลการตรวจ**\n---------------------------\n📋 ผลตรวจเลือดของ: ${patientNameForBot}\n📅 ณ วันที่: ${dateStr}\n👨‍⚕️ แพทย์ผู้อนุมัติ: ${doctorName}\n---------------------------\nสามารถดูได้ที่ไฟล์แนบด้านล่างนี้`;

          const { error: msgError } = await supabase.from('messages').insert([{
            room_id: roomId,
            sender_id: userProfile.user_id,
            role: 'bot', 
            message: botMessage,
            file_url: publicUrl,
            file_type: file.type,
            file_name: file.name,
            read: false
          }]);
          if (msgError) throw msgError;

          const historyData = {
              patient_id: roomId, 
              patient_name: patientNameForBot,
              doctor_name: doctorName,
              disease: "ตรวจสุขภาพ/ผลเลือด",
              note: `ผลการตรวจเลือดของ ${patientNameForBot}\nแพทย์ผู้ดูแล: ${doctorName}\nวันที่: ${dateStr}`,
              file_url: publicUrl,
              date: dateNow.toISOString()
          };

          const { error: historyError } = await supabase.from('treatment_history').insert([historyData]);
          
          if (historyError) {
              console.error("History Insert Error:", historyError);
              alert("ส่งแชทสำเร็จ แต่บันทึกประวัติล้มเหลว");
          } else {
              alert("ส่งผลตรวจและบันทึกประวัติเรียบร้อยแล้ว");
          }

      } catch (error) {
          alert("เกิดข้อผิดพลาด: " + error.message);
      } finally {
          setIsUploading(false);
      }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() && !selectedFile) return;

    setIsUploading(true);
    try {
        let fileUrl = null;
        let fileType = null;
        let fileName = null;

        if (selectedFile) {
            const fileExt = selectedFile.name.split('.').pop();
            const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${roomId}/${uniqueFileName}`;
            const { error: uploadError } = await supabase.storage.from('chat-files').upload(filePath, selectedFile);
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from('chat-files').getPublicUrl(filePath);
            fileUrl = publicUrl;
            fileType = selectedFile.type;
            fileName = selectedFile.name;
        }

        const { error } = await supabase.from('messages').insert([{
            room_id: roomId,
            sender_id: userProfile.user_id,
            role: userProfile.role,
            message: input,
            file_url: fileUrl,
            file_type: fileType,
            file_name: fileName,
            read: false
        }]);

        if (error) throw error;
        setInput('');
        setSelectedFile(null);
    } catch (error) {
        alert("ส่งข้อความไม่สำเร็จ: " + error.message);
    } finally {
        setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-full relative w-full overflow-hidden bg-pattern">
      <div className={`p-3 border-b flex items-center gap-3 shrink-0 z-30 ${theme === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-gray-100 bg-white'}`}>
        {onBack && (
          <button 
            onClick={onBack}
            className={`md:hidden p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-slate-700 text-white' : 'hover:bg-gray-100 text-gray-600'}`}
          >
            <ArrowLeft size={22} />
          </button>
        )}
        <div className="flex items-center gap-2 flex-1 min-w-0">
           <div className={`p-1.5 md:p-2 rounded-full shrink-0 ${theme === 'dark' ? 'bg-slate-700 text-teal-400' : 'bg-teal-50 text-teal-600'}`}>
              {userProfile.role === 'doctor' ? <User size={20}/> : <Stethoscope size={20}/>}
           </div>
           <div className="min-w-0">
              <h3 className={`font-bold text-sm md:text-base truncate ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{targetName}</h3>
              <span className="text-[10px] md:text-xs text-green-500 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> ออนไลน์
              </span>
           </div>
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto p-3 md:p-6 space-y-4 custom-scroll ${theme === 'dark' ? 'bg-slate-900/50' : 'bg-gray-50/50'}`}>
        {messages.map((msg, idx) => {
          const isMyMessage = msg.sender_id === userProfile.user_id;
          const isBot = msg.role === 'bot';
          const alignRight = isMyMessage || (userProfile.role === 'doctor' && isBot);
          const isBotStyle = isBot || msg.message.startsWith('🤖') || msg.message.startsWith('🔔');

          return (
            <div key={idx} className={`flex flex-col ${alignRight ? 'items-end' : 'items-start'} w-full`}>
              {isBotStyle ? (
                  <div className={`max-w-[92%] md:max-w-[80%] p-3 md:p-4 rounded-2xl shadow-sm border-l-4 mb-1 
                      ${theme === 'dark' ? 'bg-slate-800 border-teal-500 text-gray-200' : 'bg-white border-teal-500 text-gray-700'}
                  `}>
                      <div className="flex items-start gap-3">
                          <div className="p-2 bg-teal-50 text-teal-600 rounded-full shrink-0 hidden sm:block">
                              {msg.message.includes('นัดหมาย') ? <BellRing size={18}/> : <ClipboardList size={18}/>}
                          </div>
                          <div className="flex-1 min-w-0 text-xs md:text-sm">
                              <div className="whitespace-pre-wrap leading-relaxed">{msg.message}</div>
                              {msg.file_url && (
                                  <div className="mt-3 pt-3 border-t border-dashed border-gray-100">
                                      <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded bg-teal-50 text-teal-700 font-bold hover:bg-teal-100 transition-all">
                                        <FileText size={16} /> 
                                        <span className="truncate flex-1">ผลตรวจ: {msg.file_name}</span>
                                        <Download size={14}/>
                                      </a>
                                  </div>
                              )}
                          </div>
                      </div>
                  </div>
              ) : (
                  <div className={`max-w-[85%] md:max-w-[70%] p-3 rounded-2xl text-sm shadow-sm ${
                    alignRight 
                    ? 'bg-teal-600 text-white rounded-tr-none' 
                    : (theme === 'dark' ? 'bg-slate-700 text-white rounded-tl-none' : 'bg-white text-gray-800 border rounded-tl-none')
                  }`}>
                    {msg.file_url && (
                        <div className="mb-2">
                            {msg.file_type?.startsWith('image/') ? (
                                <img src={msg.file_url} alt="attach" className="max-w-full h-auto rounded-lg" />
                            ) : (
                                <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 p-2 rounded ${alignRight ? 'bg-white/20 text-white' : 'bg-gray-100'}`}>
                                    <FileText size={18} />
                                    <span className="underline truncate flex-1">{msg.file_name}</span>
                                    <Download size={14} />
                                </a>
                            )}
                        </div>
                    )}
                    <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                  </div>
              )}
              <div className="flex items-center gap-1 mt-1 px-1">
                 <span className="text-[9px] text-gray-400">
                    {new Date(msg.created_at).toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'})}
                 </span>
                 {alignRight && !isBotStyle && ( 
                    <span className={`text-[9px] font-bold ${msg.read ? 'text-teal-500' : 'text-gray-300'}`}>
                        {msg.read ? 'อ่านแล้ว' : 'ส่งแล้ว'}
                    </span>
                 )}
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      <div className={`p-3 md:p-4 border-t z-30 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
        {selectedFile && (
            <div className={`flex justify-between items-center p-2 mb-2 rounded-lg text-xs ${theme === 'dark' ? 'bg-slate-700 text-white' : 'bg-gray-50'}`}>
                <span className="truncate flex-1 pr-2">{selectedFile.name}</span>
                <button onClick={() => setSelectedFile(null)} className="text-red-500 font-bold px-2 text-lg">×</button>
            </div>
        )}
        <div className="flex gap-2 items-center">
             {userProfile.role === 'doctor' && (
                <label className="cursor-pointer p-2.5 rounded-full bg-teal-50 text-teal-600 hover:bg-teal-100 shrink-0 shadow-sm transition-all active:scale-90">
                    <input type="file" className="hidden" onChange={handleSendMedicalResult} />
                    <ClipboardList size={22} />
                </label>
             )}
            <label className={`cursor-pointer p-2.5 rounded-full shrink-0 transition-all active:scale-90 ${theme === 'dark' ? 'bg-slate-700 text-gray-300' : 'bg-gray-100 text-gray-500'}`}>
                <input type="file" className="hidden" onChange={handleFileChange} />
                <FileUp size={22} />
            </label>
            <form onSubmit={handleSend} className="flex-1 flex gap-2">
                <input 
                  type="text" 
                  value={input} 
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isUploading ? "กำลังโหลด..." : "พิมพ์ข้อความ..."}
                  disabled={isUploading}
                  className={`flex-1 px-4 py-2.5 rounded-2xl border outline-none text-sm transition-all ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-transparent focus:bg-white focus:border-teal-500 text-gray-800'}`}
                />
                <button type="submit" disabled={(!input.trim() && !selectedFile) || isUploading} className="p-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl transition-all shadow-md active:scale-95 disabled:opacity-50 shrink-0">
                  {isUploading ? <Loader size={22} className="animate-spin"/> : <MessageCircle size={22} />}
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;