import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';

export default function KnowledgeFeed() {
  const [posts, setPosts] = useState([]);

  // ดึงข้อมูลเมื่อโหลดหน้าเว็บ
  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    // ✅ แก้ไขชื่อตารางจาก 'knowledge_posts' เป็น 'health_articles' ให้ตรงกับฐานข้อมูลจริง
    const { data, error } = await supabase
      .from('health_articles') 
      .select('*')
      .order('created_at', { ascending: false }); // เรียงจากใหม่ไปเก่า

    if (!error) {
        setPosts(data);
    } else {
        console.error("Error fetching knowledge:", error.message); // เพิ่มการเช็ค error เพื่อตรวจสอบ
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">📚 คลังความรู้สุขภาพ</h2>
      
      <div className="grid gap-4">
        {posts.map((post) => (
          <div key={post.id} className="bg-white p-5 rounded-lg shadow border-l-4 border-blue-500">
            
            <div className="flex justify-between items-start">
              <h3 className="text-xl font-bold text-gray-800">{post.title}</h3>
              <span className="text-xs bg-gray-200 px-2 py-1 rounded text-gray-600">
                โดย: {post.author_name} ({post.author_role})
              </span>
            </div>

            <p className="text-gray-600 mt-2 whitespace-pre-line">
              {post.content}
            </p>

            {/* ถ้ามีไฟล์แนบ ให้แสดงปุ่มดาวน์โหลด */}
            {post.file_url && (
              <div className="mt-4">
                <a 
                  href={post.file_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:underline"
                >
                  📄 เปิดดูไฟล์แนบ / อ่านเพิ่มเติม
                </a>
              </div>
            )}
            
            <div className="text-xs text-gray-400 mt-4">
              เมื่อ: {new Date(post.created_at).toLocaleString('th-TH')}
            </div>
            
          </div>
        ))}

        {posts.length === 0 && <p className="text-center text-gray-500">ยังไม่มีบทความในขณะนี้</p>}
      </div>
    </div>
  );
}