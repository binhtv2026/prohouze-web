import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ChevronRight, Home, MessageCircle, Calendar, Clock, Tag, BookOpen, List, ArrowUp } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const SAMPLE_BLOG_PAGE = {
  id: 'seo-blog-demo',
  slug: 'thi-truong-bat-dong-san-2026',
  title: 'Thị trường bất động sản 2026: xu hướng và cơ hội đầu tư',
  excerpt: 'Những chuyển động mới của thị trường sơ cấp và cách đội ngũ kinh doanh tận dụng để tăng tỷ lệ chốt khách.',
  content: `
    <h2>Tín hiệu phục hồi rõ hơn</h2>
    <p>Thị trường sơ cấp đang bước vào giai đoạn chọn lọc mạnh hơn, với dòng tiền tập trung vào dự án có pháp lý rõ ràng và chủ đầu tư uy tín.</p>
    <h2>Điểm cần tập trung khi tư vấn</h2>
    <p>Sale cần bám sát nhu cầu thật, cập nhật chính sách bán hàng nhanh và dùng tài liệu pháp lý đúng lúc để tăng niềm tin cho khách.</p>
    <h2>Cơ hội cho nhà đầu tư</h2>
    <p>Các khu vực có hạ tầng mở rộng và nguồn cung chất lượng vẫn là điểm sáng trong chu kỳ mới.</p>
  `,
  category_name: 'Thị trường',
  published_at: '2026-03-20T08:00:00',
  read_time: 6,
  meta_title: 'Thị trường bất động sản 2026',
  meta_description: 'Phân tích xu hướng bất động sản 2026 và cơ hội cho người mua ở thực và nhà đầu tư.',
};

const SAMPLE_BLOG_RELATED = [
  { id: 'seo-rel-1', slug: 'chinh-sach-ban-hang-tang-ty-le-chot', title: '3 chính sách bán hàng giúp tăng tỷ lệ chốt', published_at: '2026-03-18T10:00:00' },
  { id: 'seo-rel-2', slug: 'phap-ly-du-an-anh-huong-niem-tin-khach', title: 'Pháp lý dự án ảnh hưởng niềm tin khách như thế nào', published_at: '2026-03-16T09:30:00' },
  { id: 'seo-rel-3', slug: 'sale-bat-dong-san-can-gi-de-vuot-kpi', title: 'Sale bất động sản cần gì để vượt KPI', published_at: '2026-03-14T14:20:00' },
];

// Generate or get session ID
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('seo_session_id');
  if (!sessionId) {
    sessionId = uuidv4();
    sessionStorage.setItem('seo_session_id', sessionId);
  }
  return sessionId;
};

const SEOBlogPage = () => {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scrollDepth, setScrollDepth] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [tocItems, setTocItems] = useState([]);
  
  const contentRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const sessionIdRef = useRef(getSessionId());
  const pageIdRef = useRef(null);
  const trackingIntervalRef = useRef(null);

  // Send tracking data
  const sendTrackingData = useCallback(async () => {
    if (!pageIdRef.current) return;
    
    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
    
    try {
      await fetch(`${API_URL}/api/seo/traffic/session/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionIdRef.current,
          page_id: pageIdRef.current,
          duration_seconds: duration,
          scroll_depth: scrollDepth,
          interactions: 0
        })
      });
    } catch (e) {
      console.log('Tracking update error:', e);
    }
  }, [scrollDepth]);

  // Start session tracking
  const startSessionTracking = useCallback(async (pageId) => {
    try {
      await fetch(`${API_URL}/api/seo/traffic/session/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionIdRef.current,
          page_id: pageId,
          url: window.location.href,
          referrer: document.referrer || null
        })
      });
      
      await fetch(`${API_URL}/api/seo/traffic/track-view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page_id: pageId,
          url: window.location.href,
          source: getTrafficSource(),
          device: getDeviceType(),
          session_id: sessionIdRef.current
        })
      });
      
      trackingIntervalRef.current = setInterval(sendTrackingData, 10000);
    } catch (e) {
      console.log('Session tracking error:', e);
    }
  }, [sendTrackingData]);

  // Fetch page data
  useEffect(() => {
    const fetchPage = async () => {
      try {
        const response = await fetch(`${API_URL}/api/seo/pages?content_type=blog&limit=50`);
        const data = await response.json();
        
        const foundPage = data.pages?.find(p => p.slug === slug);
        
        if (foundPage) {
          const pageId = foundPage.id;
          pageIdRef.current = pageId;
          
          const detailResponse = await fetch(`${API_URL}/api/seo/pages/${pageId}`);
          const pageData = await detailResponse.json();
          setPage(pageData);
          
          // Fetch related posts from API
          try {
            const relatedRes = await fetch(`${API_URL}/api/seo/traffic/related-posts/${pageId}?limit=5`);
            if (relatedRes.ok) {
              const relatedData = await relatedRes.json();
              if (relatedData.related_posts?.length > 0) {
                setRelatedPosts(relatedData.related_posts);
              } else {
                // Fallback: get other blog posts
                const related = data.pages.filter(p => p.slug !== slug).slice(0, 5);
                setRelatedPosts(related);
              }
            }
          } catch (e) {
            const related = data.pages.filter(p => p.slug !== slug).slice(0, 5);
            setRelatedPosts(related);
          }
          
          // Start session tracking
          startSessionTracking(pageId);
        } else {
          setPage(SAMPLE_BLOG_PAGE);
          setRelatedPosts(SAMPLE_BLOG_RELATED);
        }
      } catch (err) {
        console.error('Error fetching blog:', err);
        setPage(SAMPLE_BLOG_PAGE);
        setRelatedPosts(SAMPLE_BLOG_RELATED);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPage();
    }
    
    return () => {
      if (pageIdRef.current) {
        sendTrackingData();
      }
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
    };
  }, [sendTrackingData, slug, startSessionTracking]);

  // Track internal clicks
  const trackInternalClick = async (toPageId, toUrl, clickType = 'related') => {
    if (!pageIdRef.current) return;
    
    try {
      await fetch(`${API_URL}/api/seo/traffic/track-internal-click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionIdRef.current,
          from_page_id: pageIdRef.current,
          to_page_id: toPageId || '',
          from_url: window.location.href,
          to_url: toUrl,
          click_type: clickType
        })
      });
    } catch (e) {
      console.log('Click tracking error:', e);
    }
  };

  // Parse TOC from content
  useEffect(() => {
    if (page?.content && contentRef.current) {
      const headings = contentRef.current.querySelectorAll('h2');
      const items = Array.from(headings).map((h, i) => {
        const id = `section-${i}`;
        h.id = id;
        return { id, text: h.textContent };
      });
      setTocItems(items);
    }
  }, [page?.content]);

  // Scroll tracking
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const depth = Math.round((scrollTop / docHeight) * 100);
      setScrollDepth(Math.min(depth, 100));
      setShowBackToTop(scrollTop > 500);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Calculate read time
  const getReadTime = () => {
    const wordCount = page?.word_count || (page?.content?.split(/\s+/).length || 0);
    return Math.max(1, Math.ceil(wordCount / 200));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Không tìm thấy bài viết</h1>
        <Link to="/news" className="text-blue-600 hover:underline">Xem tất cả bài viết</Link>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{page.title}</title>
        <meta name="description" content={page.meta_description} />
        <meta property="og:title" content={page.title} />
        <meta property="og:description" content={page.meta_description} />
        <meta property="og:type" content="article" />
        <link rel="canonical" href={`${window.location.origin}/blog/${page.slug}`} />
      </Helmet>

      <div className="min-h-screen bg-gray-50" data-testid="seo-blog-page">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 py-4">
            {/* Breadcrumb */}
            <nav className="flex items-center text-sm text-gray-600 mb-4">
              <Link to="/" className="hover:text-blue-600 flex items-center">
                <Home className="w-4 h-4 mr-1" />
                Trang chủ
              </Link>
              <ChevronRight className="w-4 h-4 mx-2" />
              <Link to="/news" className="hover:text-blue-600">Tin tức</Link>
              <ChevronRight className="w-4 h-4 mx-2" />
              <span className="text-gray-900 truncate max-w-xs">{page.keyword}</span>
            </nav>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {page.h1}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-gray-500 text-sm">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {getReadTime()} phút đọc
              </span>
              <span className="flex items-center gap-1">
                <Tag className="w-4 h-4" />
                {page.keyword}
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                {page.word_count || '-'} từ
              </span>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Left - TOC (Desktop) */}
            <div className="hidden lg:block lg:col-span-1">
              <div className="sticky top-4">
                {tocItems.length > 0 && (
                  <div className="bg-white rounded-xl p-4 shadow-sm" data-testid="table-of-contents">
                    <h3 className="font-bold text-sm uppercase text-gray-500 mb-3 flex items-center gap-2">
                      <List className="w-4 h-4" />
                      Nội Dung
                    </h3>
                    <ol className="space-y-2 text-sm">
                      {tocItems.map((item, i) => (
                        <li key={i}>
                          <button
                            onClick={() => scrollToSection(item.id)}
                            className="text-gray-600 hover:text-blue-600 hover:underline text-left line-clamp-2"
                          >
                            {i + 1}. {item.text}
                          </button>
                        </li>
                      ))}
                    </ol>
                    
                    {/* Progress */}
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-gray-400 mb-1">{scrollDepth}% đã đọc</p>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${scrollDepth}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Mobile TOC */}
              {tocItems.length > 0 && (
                <div className="lg:hidden bg-white rounded-xl p-4 shadow-sm mb-6">
                  <h3 className="font-bold text-sm uppercase text-gray-500 mb-3 flex items-center gap-2">
                    <List className="w-4 h-4" />
                    Nội Dung Bài Viết
                  </h3>
                  <ol className="space-y-2 text-sm">
                    {tocItems.map((item, i) => (
                      <li key={i}>
                        <button
                          onClick={() => scrollToSection(item.id)}
                          className="text-blue-600 hover:underline text-left"
                        >
                          {i + 1}. {item.text}
                        </button>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Article Content */}
              <article className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div 
                  ref={contentRef}
                  className="prose prose-lg max-w-none p-6 md:p-8"
                  dangerouslySetInnerHTML={{ __html: page.content }}
                />
              </article>

              {/* Related Posts */}
              {relatedPosts.length > 0 && (
                <div className="mt-8 bg-white rounded-xl p-6 shadow-sm" data-testid="related-posts">
                  <h3 className="font-bold text-xl mb-6">Bài Viết Liên Quan</h3>
                  <div className="space-y-4">
                    {relatedPosts.map((post, i) => (
                      <Link
                        key={i}
                        to={post.content_type === 'blog' ? `/blog/${post.slug}` : `/${post.slug}`}
                        onClick={() => trackInternalClick(post.id, post.slug, 'related')}
                        className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h4 className="font-semibold text-gray-900 hover:text-blue-600 line-clamp-2">
                              {post.title}
                            </h4>
                            {post.relevance && (
                              <span className={`inline-block mt-2 text-xs px-2 py-1 rounded ${
                                post.relevance === 'cluster' ? 'bg-green-100 text-green-700' :
                                post.relevance === 'keyword' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {post.relevance}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar Right */}
            <div className="lg:col-span-1">
              <div className="sticky top-4 space-y-4">
                {/* CTA Box */}
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                  <h3 className="font-bold text-lg mb-2">Cần tư vấn?</h3>
                  <p className="text-green-100 text-sm mb-4">
                    AI sẵn sàng hỗ trợ bạn 24/7
                  </p>
                  <a 
                    href="/#ai-chat"
                    className="block w-full py-3 bg-white text-green-600 rounded-lg font-semibold text-center hover:bg-green-50 transition"
                    data-testid="sidebar-chat-btn"
                  >
                    <MessageCircle className="w-4 h-4 inline mr-2" />
                    Chat Ngay
                  </a>
                </div>

                {/* Booking CTA */}
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
                  <h3 className="font-bold text-lg mb-2">Đặt lịch xem nhà</h3>
                  <p className="text-orange-100 text-sm mb-4">
                    Miễn phí - Không ràng buộc
                  </p>
                  <a 
                    href="/#booking"
                    className="block w-full py-3 bg-white text-orange-600 rounded-lg font-semibold text-center hover:bg-orange-50 transition"
                    data-testid="sidebar-booking-btn"
                  >
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Đặt Lịch
                  </a>
                </div>

                {/* Tags */}
                {page.h2_tags && page.h2_tags.length > 0 && (
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <h3 className="font-bold text-sm uppercase text-gray-500 mb-3">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {page.h2_tags.slice(0, 8).map((tag, i) => (
                        <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Back to Top Button */}
        {showBackToTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all z-50"
            data-testid="back-to-top-btn"
          >
            <ArrowUp className="w-6 h-6" />
          </button>
        )}
      </div>
    </>
  );
};

// Helper functions
const getTrafficSource = () => {
  const referrer = document.referrer;
  if (!referrer) return 'direct';
  if (referrer.includes('google')) return 'search';
  if (referrer.includes('facebook') || referrer.includes('fb.')) return 'social';
  if (referrer.includes(window.location.hostname)) return 'internal';
  return 'referral';
};

const getDeviceType = () => {
  const ua = navigator.userAgent;
  if (/mobile/i.test(ua)) return 'mobile';
  if (/tablet|ipad/i.test(ua)) return 'tablet';
  return 'desktop';
};

export default SEOBlogPage;
