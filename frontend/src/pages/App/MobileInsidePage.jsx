/**
 * MobileInsidePage.jsx — Mạng Nội bộ (Base Inside)
 * Feed tin tức công ty · Văn hoá · Chia sẻ thành tích
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Heart, MessageCircle, Share2, Plus,
  Trophy, Image, Smile, ChevronRight, Bell,
  Zap, Star, Users, Camera,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const POSTS = [
  {
    id: 'p1',
    author: 'Ban Giám đốc',
    avatar: 'BGĐ',
    avatarColor: 'bg-[#316585]',
    role: 'Lãnh đạo công ty',
    time: '2 giờ trước',
    type: 'announcement',
    content: '🎉 Chúc mừng toàn thể anh chị em ANKAPU đã xuất sắc hoàn thành tháng 04/2026 với doanh số vượt chỉ tiêu 118%!\n\nĐây là kết quả của sự nỗ lực không ngừng của từng thành viên. Ban Giám đốc ghi nhận và trân trọng đóng góp của tất cả mọi người 💪\n\n📌 Tiệc mừng doanh số sẽ được tổ chức vào tối thứ 6, 26/04/2026 tại Nhà hàng The Summit, Đà Nẵng.',
    likes: 24,
    comments: 8,
    liked: false,
    tag: '📢 Thông báo',
    tagColor: 'bg-blue-100 text-blue-700',
  },
  {
    id: 'p2',
    author: 'Trần Minh Khoa',
    avatar: 'TK',
    avatarColor: 'bg-emerald-500',
    role: 'Sales Senior',
    time: '4 giờ trước',
    type: 'achievement',
    content: '🏆 Vừa chốt deal căn S1-08B NOBU Residences 3.8 tỷ sau 3 tuần follow KH!\n\nChia sẻ với anh chị em: khách này ban đầu rất phân vân về pháp lý. Mình đã nhờ anh BD giải thích trực tiếp về sổ đỏ và cam kết thuê, sau đó mời tham quan showroom thực tế. Deal chốt ngay hôm đó!\n\nKho tri thức "Xử lý phản đối pháp lý" đã rất helpful 💡',
    likes: 18,
    comments: 5,
    liked: true,
    tag: '🏆 Thành tích',
    tagColor: 'bg-amber-100 text-amber-700',
  },
  {
    id: 'p3',
    author: 'Phòng Nhân sự',
    avatar: 'NS',
    avatarColor: 'bg-violet-500',
    role: 'HR Team',
    time: '1 ngày trước',
    type: 'event',
    content: '📸 Recap buổi Team Building "ANKAPU Warriors" cuối tuần qua!\n\nHơn 40 anh chị em đã cùng nhau vượt qua 10 thử thách team tại Bà Nà Hills. Tinh thần đồng đội cực kỳ cao 🔥\n\nCảm ơn ban tổ chức đã chuẩn bị chu đáo! Cùng nhau tiến lên ANKAPU 💪',
    likes: 42,
    comments: 15,
    liked: false,
    tag: '🎉 Sự kiện',
    tagColor: 'bg-pink-100 text-pink-700',
  },
  {
    id: 'p4',
    author: 'Lê Thu Hương',
    avatar: 'LH',
    avatarColor: 'bg-pink-500',
    role: 'Sales',
    time: '2 ngày trước',
    type: 'share',
    content: '💡 Tip nhỏ cho anh chị Sales mới:\n\nSau mỗi cuộc hẹn với khách, mình luôn gửi tin nhắn Zalo trong vòng 2 tiếng cảm ơn + tóm tắt 3 điểm khách quan tâm nhất. Tỷ lệ KH nhớ đến mình và reply lại tăng lên rõ rệt so với trước!\n\nMọi người thử xem nhé 😊',
    likes: 31,
    comments: 9,
    liked: false,
    tag: '💡 Chia sẻ',
    tagColor: 'bg-emerald-100 text-emerald-700',
  },
];

function PostCard({ post, onLike }) {
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState('');

  const handleLike = () => {
    onLike(post.id);
    if (!post.liked) toast.success('❤️ Đã thích bài viết');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm mb-3 overflow-hidden border border-slate-100">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <div className={`w-10 h-10 ${post.avatarColor} rounded-full flex items-center justify-center flex-shrink-0`}>
          <span className="text-white text-xs font-bold">{post.avatar}</span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-800">{post.author}</p>
          <p className="text-xs text-slate-500">{post.role} · {post.time}</p>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${post.tagColor}`}>{post.tag}</span>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{post.content}</p>
      </div>

      {/* Stats */}
      <div className="px-4 py-2 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={handleLike} className={`flex items-center gap-1.5 ${post.liked ? 'text-red-500' : 'text-slate-400'}`}>
            <Heart className={`w-4 h-4 ${post.liked ? 'fill-red-500' : ''}`} />
            <span className="text-xs font-medium">{post.liked ? post.likes + 1 : post.likes}</span>
          </button>
          <button onClick={() => setShowComment(!showComment)} className="flex items-center gap-1.5 text-slate-400">
            <MessageCircle className="w-4 h-4" />
            <span className="text-xs font-medium">{post.comments}</span>
          </button>
          <button className="flex items-center gap-1.5 text-slate-400">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Comment input */}
      {showComment && (
        <div className="px-4 pb-4 border-t border-slate-100 pt-3">
          <div className="flex gap-2">
            <input
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Viết bình luận..."
              className="flex-1 bg-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#316585]/30"
            />
            <button
              onClick={() => {
                if (comment.trim()) {
                  toast.success('💬 Đã gửi bình luận');
                  setComment('');
                  setShowComment(false);
                }
              }}
              className="w-9 h-9 bg-[#316585] rounded-xl flex items-center justify-center flex-shrink-0"
            >
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MobileInsidePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [posts, setPosts] = useState(POSTS);
  const [showNew, setShowNew] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState('share');

  const handleLike = (id) => {
    setPosts(prev => prev.map(p =>
      p.id === id ? { ...p, liked: !p.liked } : p
    ));
  };

  const handlePost = () => {
    if (!newContent.trim()) { toast.error('Nhập nội dung trước đã!'); return; }
    const tagMap = {
      share: { tag: '💡 Chia sẻ', tagColor: 'bg-emerald-100 text-emerald-700' },
      achievement: { tag: '🏆 Thành tích', tagColor: 'bg-amber-100 text-amber-700' },
      question: { tag: '❓ Hỏi đáp', tagColor: 'bg-blue-100 text-blue-700' },
    };
    const newPost = {
      id: `p-${Date.now()}`,
      author: user?.full_name || 'Bạn',
      avatar: (user?.full_name || 'B').split(' ').map(n => n[0]).slice(-2).join(''),
      avatarColor: 'bg-[#316585]',
      role: user?.position || 'Nhân viên',
      time: 'Vừa xong',
      type: newType,
      content: newContent,
      likes: 0,
      comments: 0,
      liked: false,
      ...tagMap[newType],
    };
    setPosts(prev => [newPost, ...prev]);
    setNewContent('');
    setShowNew(false);
    toast.success('📝 Đã đăng bài!');
  };

  return (
    <div className="h-screen bg-[#f1f5f9] flex flex-col overflow-hidden">
      {/* HEADER */}
      <div className="bg-white border-b border-slate-100 px-4 pt-12 pb-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center">
              <ArrowLeft className="w-4 h-4 text-slate-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">ANKAPU Inside</h1>
              <p className="text-xs text-slate-500">Mạng nội bộ · {posts.length} bài viết</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center relative">
              <Bell className="w-4 h-4 text-slate-600" />
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full text-[8px] text-white font-bold flex items-center justify-center">3</span>
            </button>
            <button onClick={() => setShowNew(true)} className="w-9 h-9 bg-[#316585] rounded-full flex items-center justify-center">
              <Plus className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Quick post box */}
        <button
          onClick={() => setShowNew(true)}
          className="w-full flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3"
        >
          <div className="w-8 h-8 bg-[#316585] rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">
              {(user?.full_name || 'B').split(' ').map(n => n[0]).slice(-2).join('')}
            </span>
          </div>
          <span className="text-sm text-slate-400 text-left flex-1">Chia sẻ điều gì đó với đội nhóm...</span>
          <Zap className="w-4 h-4 text-slate-300" />
        </button>
      </div>

      {/* FEED */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {posts.map(post => (
          <PostCard key={post.id} post={post} onLike={handleLike} />
        ))}
        <div className="h-24" />
      </div>

      {/* NEW POST SHEET */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex flex-col">
          <div className="flex-1 bg-black/50" onClick={() => setShowNew(false)} />
          <div className="bg-white rounded-t-3xl p-5 pb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800">Đăng bài mới</h2>
              <button onClick={() => setShowNew(false)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                <span className="text-slate-500 text-sm font-bold">✕</span>
              </button>
            </div>

            {/* Type */}
            <div className="flex gap-2 mb-4">
              {[
                { k: 'share', label: '💡 Chia sẻ' },
                { k: 'achievement', label: '🏆 Thành tích' },
                { k: 'question', label: '❓ Hỏi đáp' },
              ].map(t => (
                <button key={t.k} onClick={() => setNewType(t.k)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${newType === t.k ? 'bg-[#316585] text-white border-[#316585]' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                  {t.label}
                </button>
              ))}
            </div>

            <textarea
              rows={4}
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              placeholder="Chia sẻ kinh nghiệm, thành tích, hoặc hỏi đáp với đồng nghiệp..."
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#316585]/30 resize-none mb-4"
            />

            <button onClick={handlePost} className="w-full py-3.5 bg-[#316585] text-white font-bold rounded-xl text-sm">
              Đăng bài
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
