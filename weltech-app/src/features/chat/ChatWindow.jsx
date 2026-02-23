import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient'; 
import {
  User, Stethoscope, MessageCircle, FileText, Download,
  BellRing, ClipboardList, CheckCheck, ImageIcon, Paperclip, FileUp, Loader
} from 'lucide-react';

const ChatWindow = ({ roomId, userProfile, theme, targetName, patientNameForBot }) => {
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
              alert("ส่งแชทสำเร็จ แต่บันทึกประวัติล้มเหลว (กรุณาเช็ค Table Database)");
          } else {
              alert("ส่งผลตรวจและบันทึกประวัติเรียบร้อยแล้ว");
          }

      } catch (error) {
          console.error("Process Error:", error);
          alert("เกิดข้อผิดพลาด: " + error.message);
      } finally {
          setIsUploading(false);
      }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() && !selectedFile) return;

    let fileUrl = null;
    let fileType = null;
    let fileName = null;

    setIsUploading(true);

    try {
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
    <div className="flex flex-col h-full relative w-full overflow-hidden">
      {/* Header Chat */}
      <div className={`p-3 border-b flex justify-between items-center shrink-0 ${theme === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-gray-100 bg-white'}`}>
        <div className="flex items-center gap-2">
           <div className={`p-1.5 md:p-2 rounded-full ${theme === 'dark' ? 'bg-slate-700' : 'bg-teal-50 text-teal-600'}`}>
              {userProfile.role === 'doctor' ? <User size={18} className="md:w-5 md:h-5"/> : <Stethoscope size={18} className="md:w-5 md:h-5"/>}
           </div>
           <div>
              <h3 className={`font-bold text-xs md:text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{targetName}</h3>
              <span className="text-[9px] md:text-[10px] text-green-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-500 animate-pulse"></span> ออนไลน์
              </span>
           </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 overflow-y-auto p-3 md:p-4 space-y-3 custom-scroll ${theme === 'dark' ? 'bg-slate-900' : 'bg-gray-50'}`}>
        {messages.map((msg, idx) => {
          const isMyMessage = msg.sender_id === userProfile.user_id;
          const isBot = msg.role === 'bot' || msg.sender_id === 'SYSTEM_BOT';
          
          let alignRight = isMyMessage;
          if (userProfile.role === 'doctor' && isBot) {
              alignRight = true; 
          }

          const isImage = msg.file_type && msg.file_type.startsWith('image/');
          const isBotStyle = isBot || msg.message.startsWith('🤖') || msg.message.startsWith('🔔');

          return (
            <div key={idx} className={`flex flex-col ${alignRight ? 'items-end' : 'items-start'} animate-fade-in w-full`}>
              
              {isBotStyle ? (
                  // 🟢 แก้ไข: ปรับ max-w ให้เหมาะกับมือถือ
                  <div className={`max-w-[90%] md:max-w-[85%] p-3 md:p-4 rounded-xl shadow-md border-l-4 mb-1 
                      ${theme === 'dark' ? 'bg-slate-800 border-teal-500 text-gray-200' : 'bg-white border-teal-500 text-gray-700'}
                      ${alignRight ? 'rounded-tr-none' : 'rounded-tl-none'} 
                  `}>
                      <div className="flex items-start gap-2 md:gap-3">
                          <div className="p-1.5 md:p-2 bg-teal-100 text-teal-600 rounded-full shrink-0">
                              {msg.message.includes('นัดหมาย') ? <BellRing size={20} className="md:w-6 md:h-6"/> : <ClipboardList size={20} className="md:w-6 md:h-6"/>}
                          </div>
                          <div className="flex-1 min-w-0">
                              <div className="text-xs md:text-sm whitespace-pre-wrap leading-relaxed font-medium">{msg.message}</div>
                              {msg.file_url && (
                                  <div className="mt-3 pt-3 border-t border-dashed border-gray-200">
                                            <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded bg-gray-100 hover:bg-gray-200 transition-colors text-blue-600 text-xs md:text-sm font-bold">
                                              <FileText size={16} className="md:w-[18px] md:h-[18px]" /> 
                                              <span className="truncate">เปิดไฟล์: {msg.file_name || 'เอกสาร'}</span>
                                              <Download size={12} className="ml-auto"/>
                                           </a>
                                  </div>
                              )}
                              <div className="mt-2 text-[9px] md:text-[10px] text-gray-400 text-right">
                                  {new Date(msg.created_at).toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'})}
                              </div>
                          </div>
                      </div>
                  </div>
              ) : (
                  // 🟢 แก้ไข: ปรับ max-w และ padding ให้กระชับขึ้นบนมือถือ
                  <div className={`max-w-[85%] md:max-w-[70%] p-2.5 md:p-3 rounded-2xl text-xs md:text-sm shadow-sm relative ${
                    alignRight 
                    ? 'bg-teal-600 text-white rounded-tr-none' 
                    : (theme === 'dark' ? 'bg-slate-700 text-white rounded-tl-none' : 'bg-white text-gray-800 border rounded-tl-none')
                  }`}>
                    {msg.file_url && (
                        <div className="mb-2">
                            {isImage ? (
                                <a href={msg.file_url} target="_blank" rel="noopener noreferrer">
                                    <img src={msg.file_url} alt="attch" className="max-w-full h-auto rounded-lg border border-white/20" />
                                </a>
                            ) : (
                                <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 p-2 rounded ${alignRight ? 'bg-white/20' : 'bg-gray-100 dark:bg-slate-600'}`}>
                                    <FileText size={18} />
                                    <span className="underline truncate max-w-[120px] md:max-w-[150px]">{msg.file_name}</span>
                                    <Download size={12} />
                                </a>
                            )}
                        </div>
                    )}
                    {msg.message && <p className="whitespace-pre-wrap">{msg.message}</p>}
                  </div>
              )}

              <div className="flex items-center gap-1 mt-1">
                 <span className={`text-[8px] md:text-[9px] ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                    {new Date(msg.created_at).toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'})}
                 </span>
                 {alignRight && !isBotStyle && ( 
                    msg.read 
                    ? <div className="flex items-center gap-0.5 text-[8px] md:text-[9px] text-teal-500">อ่านแล้ว <CheckCheck size={10} className="md:w-3 md:h-3"/></div>
                    : <span className="text-[8px] md:text-[9px] text-gray-300">ส่งแล้ว</span>
                 )}
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className={`p-2 md:p-3 border-t shrink-0 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
        {selectedFile && (
            <div className={`flex justify-between items-center p-2 mb-2 rounded text-[10px] md:text-xs ${theme === 'dark' ? 'bg-slate-700 text-white' : 'bg-gray-100 text-gray-600'}`}>
                <div className="flex items-center gap-2 truncate">
                    {selectedFile.type.startsWith('image/') ? <ImageIcon size={12}/> : <Paperclip size={12}/>} 
                    <span className="truncate">{selectedFile.name}</span>
                </div>
                <button onClick={() => setSelectedFile(null)} className="text-red-500 font-bold hover:bg-red-100 rounded-full w-5 h-5 flex items-center justify-center shrink-0">×</button>
            </div>
        )}
        <div className="flex gap-1 md:gap-2 items-center">
             {userProfile.role === 'doctor' && (
                <label className="cursor-pointer p-1.5 md:p-2 rounded-full transition-colors bg-teal-50 text-teal-600 hover:bg-teal-100 shrink-0" title="ส่งผลการตรวจ (Bot)">
                    <input type="file" className="hidden" onChange={handleSendMedicalResult} />
                    <ClipboardList size={18} className="md:w-5 md:h-5" />
                </label>
             )}

            <label className={`cursor-pointer p-1.5 md:p-2 rounded-full transition-colors shrink-0 ${theme === 'dark' ? 'text-gray-400 hover:bg-slate-700' : 'text-gray-500 hover:bg-gray-100'}`} title="แนบไฟล์ทั่วไป">
                <input type="file" className="hidden" onChange={handleFileChange} />
                <FileUp size={18} className="md:w-5 md:h-5" />
            </label>

            <form onSubmit={handleSend} className="flex-1 flex gap-1 md:gap-2">
                <input 
                  type="text" 
                  value={input} 
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isUploading ? "กำลังโหลด..." : "พิมพ์ข้อความ..."}
                  disabled={isUploading}
                  className={`flex-1 p-2 md:p-2.5 rounded-xl border outline-none text-xs md:text-sm ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-100 border-transparent text-gray-800'}`}
                />
                <button type="submit" disabled={(!input.trim() && !selectedFile) || isUploading} className="p-2 md:p-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl transition-all shadow-md disabled:opacity-50 shrink-0">
                  {isUploading ? <Loader size={18} className="animate-spin"/> : <MessageCircle size={18} className="md:w-5 md:h-5" />}
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;