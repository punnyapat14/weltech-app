import React, { useState, useEffect, useRef } from 'react';
import { 
    Image as ImageIcon, Send, Trash2, User, Paperclip, FileText, X 
} from 'lucide-react';
import { supabase } from '../../supabaseClient'; 

const DoctorHealthTips = ({ userProfile, theme }) => { 
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [file, setFile] = useState(null);
    const [isPosting, setIsPosting] = useState(false);
    const fileInputRef = useRef(null);
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchArticles();
    }, []);

    const fetchArticles = async () => {
        try {
            const { data, error } = await supabase
                .from('health_articles')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            setArticles(data);
        } catch (error) {
            console.error("Error fetching articles:", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePost = async () => {
        if (!title.trim() && !content.trim()) {
            alert("กรุณากรอกหัวข้อหรือเนื้อหา");
            return;
        }

        setIsPosting(true);
        try {
            let uploadedFileUrl = null;
            const doctorName = `${userProfile?.title_th || ''}${userProfile?.first_name_th || ''} ${userProfile?.last_name_th || ''}`.trim() || 'นพ. สมชาย';

            if (file) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('knowledge-files') 
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data } = supabase.storage
                    .from('knowledge-files')
                    .getPublicUrl(filePath);
                
                uploadedFileUrl = data.publicUrl;
            }

            const { error } = await supabase
                .from('health_articles')
                .insert([{
                    author_id: userProfile?.id,
                    author_name: doctorName,
                    author_role: 'doctor',
                    title: title,
                    content: content,
                    file_url: uploadedFileUrl
                }]);

            if (error) throw error;

            setTitle('');
            setContent('');
            setFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
            fetchArticles(); 

        } catch (error) {
            alert("เกิดข้อผิดพลาด: " + error.message);
        } finally {
            setIsPosting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("คุณต้องการลบโพสต์นี้ใช่หรือไม่?")) return;
        try {
            const { error } = await supabase.from('health_articles').delete().eq('id', id);
            if (error) throw error;
            fetchArticles();
        } catch (error) {
            alert("ลบไม่สำเร็จ: " + error.message);
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('th-TH', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className={`flex flex-col items-center w-full min-h-screen p-2 md:p-4 pb-20 overflow-y-auto custom-scroll transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-gray-50 text-gray-800'}`}>
            <div className="w-full max-w-3xl space-y-6">
                <div className="flex justify-between items-center px-2">
                    <h1 className={`text-xl md:text-2xl font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                        <FileText className="text-blue-600"/> เกร็ดความรู้สุขภาพ
                    </h1>
                </div>

                <div 
                    style={{ 
                        backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff' 
                    }}
                    className={`rounded-xl shadow-sm border p-4 animate-fade-in transition-all ${theme === 'dark' ? 'border-slate-700 shadow-slate-950' : 'bg-white border-gray-200 shadow-sm'}`}
                >
                    <div className="flex gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 font-bold">
                            {userProfile?.first_name_th ? userProfile.first_name_th.charAt(0) : <User/>}
                        </div>
                        <div className="flex-1 space-y-3">
                            <input 
                                type="text"
                                style={{ 
                                    backgroundColor: 'transparent', 
                                    color: theme === 'dark' ? '#ffffff' : '#1f2937' 
                                }}
                                className={`w-full font-bold focus:outline-none border-b pb-2 transition-all appearance-none ${
                                    theme === 'dark' 
                                    ? 'border-slate-600 placeholder:text-gray-500' 
                                    : 'border-gray-100 placeholder:text-gray-400'
                                }`}
                                placeholder="หัวข้อเรื่อง"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                            <textarea
                                style={{ 
                                    backgroundColor: theme === 'dark' ? '#334155' : '#f9fafb',
                                    color: theme === 'dark' ? '#ffffff' : '#374151' 
                                }}
                                className={`w-full rounded-lg p-3 focus:outline-none focus:ring-2 resize-none min-h-[100px] transition-all appearance-none border ${
                                    theme === 'dark' 
                                    ? 'border-slate-600 focus:ring-blue-500/30' 
                                    : 'border-transparent focus:ring-blue-100'
                                }`}
                                placeholder={`คุณหมอ ${userProfile?.first_name_th || ''} มีเกร็ดความรู้อะไรจะแชร์วันนี้?`}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                            />
                        </div>
                    </div>

                    {file && (
                        <div className="mb-3 ml-0 md:ml-12 relative inline-block">
                            <div className={`border rounded-lg p-2 flex items-center gap-2 text-sm ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-600'}`}>
                                <Paperclip size={16}/> 
                                <span className="max-w-[150px] md:max-w-xs truncate">{file.name}</span>
                                <button onClick={() => setFile(null)} className="text-red-500 hover:bg-red-50 rounded-full p-1"><X size={14}/></button>
                            </div>
                        </div>
                    )}

                    <div className={`border-t mt-2 pt-3 flex justify-between items-center md:pl-12 ${theme === 'dark' ? 'border-slate-700' : 'border-gray-100'}`}>
                        <div>
                            <input 
                                type="file" 
                                ref={fileInputRef}
                                className="hidden" 
                                onChange={(e) => setFile(e.target.files[0])}
                                accept="image/*,.pdf" 
                            />
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${theme === 'dark' ? 'text-gray-300 hover:bg-slate-700' : 'text-gray-500 hover:bg-gray-100'}`}
                            >
                                <ImageIcon size={20} className="text-green-500" />
                                <span className="hidden md:inline">แนบรูป/ไฟล์</span>
                            </button>
                        </div>

                        <button 
                            onClick={handlePost}
                            disabled={isPosting || (!title && !content)}
                            className={`flex items-center gap-2 px-4 md:px-6 py-2 rounded-lg font-bold text-white transition-all shadow-sm ${isPosting ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            <Send size={16} />
                            <span>{isPosting ? '...' : 'โพสต์'}</span>
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-10"><span className="loading loading-spinner text-blue-500"></span></div>
                ) : (
                    <div className="space-y-6">
                        {articles.map((article) => (
                            <div 
                                key={article.id} 
                                style={{ backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff' }}
                                className={`rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-all ${theme === 'dark' ? 'border-slate-700' : 'border-gray-200'}`}
                            >
                                <div className="p-4 flex justify-between items-start">
                                    <div className="flex gap-3">
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0">
                                            {article.author_name ? article.author_name.charAt(0) : 'D'}
                                        </div>
                                        <div>
                                            <h3 className={`font-bold text-sm ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>{article.author_name}</h3>
                                            <div className="text-xs text-gray-500">{formatTime(article.created_at)}</div>
                                        </div>
                                    </div>
                                    
                                    <button onClick={() => handleDelete(article.id)} className="text-gray-400 hover:text-red-500 p-2 transition-colors">
                                        <Trash2 size={18} />
                                    </button>
                                </div>

                                <div className="px-4 pb-4">
                                    {article.title && (
                                        <h4 className={`font-bold text-lg mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{article.title}</h4>
                                    )}
                                    <p className={`whitespace-pre-line leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                        {article.content}
                                    </p>
                                </div>

                                {article.file_url && (
                                    <div className={`w-full border-t border-b ${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-100'}`}>
                                        {article.file_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                            <img src={article.file_url} alt="Attachment" className="w-full max-h-[400px] object-contain" />
                                        ) : (
                                            <div className="p-4 flex items-center gap-3">
                                                <div className="bg-red-100 p-3 rounded-lg"><FileText className="text-red-500"/></div>
                                                <div className="flex-1">
                                                    <div className={`text-sm font-bold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>ไฟล์แนบ</div>
                                                    <a href={article.file_url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline break-all">
                                                        เปิดเอกสาร
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DoctorHealthTips;