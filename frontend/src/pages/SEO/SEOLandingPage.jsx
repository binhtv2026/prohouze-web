import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ChevronRight, Home, MessageCircle, Calendar, Phone, List, ArrowUp } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const SAMPLE_SEO_PAGE = {
  id: 'seo-landing-demo',
  slug: 'can-ho-thu-duc',
  title: 'Căn hộ TP. Thủ Đức giá tốt, pháp lý rõ ràng',
  excerpt: 'Tổng hợp dự án căn hộ nổi bật tại TP. Thủ Đức cùng chính sách bán hàng, bảng giá và tài liệu gửi khách.',
  content: `
    <h2>Vì sao khách hàng quan tâm mạnh tới khu Đông</h2>
    <p>Hạ tầng, tốc độ đô thị hóa và nhu cầu ở thực tạo ra lực cầu bền hơn cho các dự án có pháp lý rõ và chủ đầu tư mạnh.</p>
    <h2>Những yếu tố khách hàng hỏi nhiều nhất</h2>
    <p>Bảng giá, tiến độ, pháp lý, tiện ích và chính sách thanh toán vẫn là 5 chủ đề cần được trả lời thật nhanh.</p>
    <h2>Gợi ý sử dụng cho đội sale</h2>
    <p>Dùng landing page như một link tư vấn nhanh để gửi khách ngay sau cuộc gọi đầu tiên.</p>
  `,
  meta_title: 'Căn hộ TP. Thủ Đức',
  meta_description: 'Landing page tổng hợp căn hộ TP. Thủ Đức với thông tin giá, chính sách bán hàng và pháp lý.',
};

const SAMPLE_SEO_RELATED = [
  { id: 'seo-related-1', slug: 'bang-gia-du-an-moi', title: 'Bảng giá dự án mới nhất', published_at: '2026-03-18T08:00:00' },
  { id: 'seo-related-2', slug: 'tai-lieu-ban-hang-cho-sale', title: 'Bộ tài liệu bán hàng cho đội sale', published_at: '2026-03-15T09:45:00' },
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

const SEOLandingPage = () => {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
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
      
      // Track page view
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
      
      // Send periodic updates
      trackingIntervalRef.current = setInterval(sendTrackingData, 10000); // Every 10 seconds
    } catch (e) {
      console.log('Session tracking error:', e);
    }
  }, [sendTrackingData]);

  // Fetch page data
  useEffect(() => {
    const fetchPage = async () => {
      const appRoutes = ['login', 'register', 'dashboard', 'admin', 'home', 'du-an', 'gioi-thieu', 'lien-he', 'tin-tuc', 'blog', 'recruitment'];
      if (appRoutes.some(route => slug.startsWith(route))) {
        setError('not_seo_page');
        setLoading(false);
        return;
      }
      
      try {
        const response = await fetch(`${API_URL}/api/seo/pages?limit=1&slug=${slug}`);
        const data = await response.json();
        
        if (data.pages && data.pages.length > 0) {
          const pageId = data.pages[0].id;
          pageIdRef.current = pageId;
          
          const detailResponse = await fetch(`${API_URL}/api/seo/pages/${pageId}`);
          const pageData = await detailResponse.json();
          setPage(pageData);
          
          // Fetch related posts
          try {
            const relatedRes = await fetch(`${API_URL}/api/seo/traffic/related-posts/${pageId}?limit=5`);
            if (relatedRes.ok) {
              const relatedData = await relatedRes.json();
              setRelatedPosts(relatedData.related_posts || []);
            }
          } catch (e) {
            console.log('Related posts not available');
          }
          
          // Start session tracking
          startSessionTracking(pageId);
        } else {
          setPage(SAMPLE_SEO_PAGE);
          setRelatedPosts(SAMPLE_SEO_RELATED);
        }
      } catch (err) {
        console.error('Error fetching page:', err);
        setPage(SAMPLE_SEO_PAGE);
        setRelatedPosts(SAMPLE_SEO_RELATED);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPage();
    }
    
    return () => {
      // Send final tracking on unmount
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
          to_page_id: toPageId,
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error === 'not_seo_page') {
    return null;
  }

  if (error || !page) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Không tìm thấy trang</h1>
        <Link to="/home" className="text-blue-600 hover:underline">Về trang chủ</Link>
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
        <meta property="og:type" content="website" />
        <link rel="canonical" href={`${window.location.origin}/${page.slug}`} />
      </Helmet>

      <div className="min-h-screen bg-white" data-testid="seo-landing-page">
        {/* Breadcrumb */}
        <div className="bg-gray-100 py-3">
          <div className="max-w-6xl mx-auto px-4">
            <nav className="flex items-center text-sm text-gray-600">
              <Link to="/" className="hover:text-blue-600 flex items-center">
                <Home className="w-4 h-4 mr-1" />
                Trang chủ
              </Link>
              <ChevronRight className="w-4 h-4 mx-2" />
              <span className="text-gray-900">{page.keyword}</span>
            </nav>
          </div>
        </div>

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white py-16">
          <div className="max-w-6xl mx-auto px-4">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              {page.h1}
            </h1>
            <p className="text-lg md:text-xl text-blue-100 max-w-3xl">
              {page.meta_description}
            </p>
            
            <div className="flex flex-wrap gap-4 mt-8">
              <a 
                href="/#ai-chat" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 rounded-lg font-semibold transition"
                data-testid="hero-chat-btn"
              >
                <MessageCircle className="w-5 h-5" />
                Chat với AI ngay
              </a>
              <a 
                href="/#booking" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 rounded-lg font-semibold transition"
                data-testid="hero-booking-btn"
              >
                <Calendar className="w-5 h-5" />
                Đặt lịch xem nhà
              </a>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Content Column */}
            <div className="lg:col-span-2">
              {/* Table of Contents */}
              {tocItems.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-6 mb-8" data-testid="table-of-contents">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <List className="w-5 h-5 text-blue-600" />
                    Nội Dung Bài Viết
                  </h3>
                  <ol className="space-y-2 list-decimal list-inside">
                    {tocItems.map((item, i) => (
                      <li key={i}>
                        <button
                          onClick={() => scrollToSection(item.id)}
                          className="text-blue-600 hover:text-blue-800 hover:underline text-left"
                        >
                          {item.text}
                        </button>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              <article 
                ref={contentRef}
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: page.content }}
              />

              {/* Related Posts Section */}
              {relatedPosts.length > 0 && (
                <div className="mt-12 bg-gray-50 rounded-xl p-6" data-testid="related-posts">
                  <h3 className="font-bold text-xl mb-6">Bài Viết Liên Quan</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {relatedPosts.map((post, i) => (
                      <Link
                        key={i}
                        to={post.content_type === 'blog' ? `/blog/${post.slug}` : `/${post.slug}`}
                        onClick={() => trackInternalClick(post.id, post.slug, 'related')}
                        className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition"
                      >
                        <span className={`text-xs px-2 py-1 rounded ${
                          post.relevance === 'cluster' ? 'bg-green-100 text-green-700' :
                          post.relevance === 'keyword' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {post.content_type}
                        </span>
                        <h4 className="font-semibold mt-2 text-gray-900 hover:text-blue-600">
                          {post.title}
                        </h4>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-4 space-y-6">
                {/* Contact Box */}
                <div className="bg-blue-50 rounded-xl p-6">
                  <h3 className="font-bold text-lg mb-4">Liên hệ tư vấn</h3>
                  <div className="space-y-3">
                    <a 
                      href="tel:1900636019" 
                      className="flex items-center gap-3 text-blue-600 hover:text-blue-800"
                    >
                      <Phone className="w-5 h-5" />
                      <span className="font-semibold">1900 636 019</span>
                    </a>
                    <p className="text-gray-600 text-sm">Miễn phí • 8:00 - 21:00</p>
                  </div>
                </div>

                {/* Mid-page CTA */}
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                  <h3 className="font-bold text-lg mb-2">Cần tư vấn ngay?</h3>
                  <p className="text-green-100 text-sm mb-4">
                    AI ProHouze sẵn sàng hỗ trợ 24/7
                  </p>
                  <a 
                    href="/#ai-chat"
                    className="block w-full py-3 bg-white text-green-600 rounded-lg font-semibold text-center hover:bg-green-50 transition"
                    data-testid="sidebar-chat-btn"
                  >
                    Chat Ngay
                  </a>
                </div>

                {/* Quick Links */}
                {page.internal_links && page.internal_links.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="font-bold text-lg mb-4">Xem thêm</h3>
                    <ul className="space-y-2">
                      {page.internal_links.slice(0, 5).map((link, i) => (
                        <li key={i}>
                          <Link 
                            to={link.url} 
                            onClick={() => trackInternalClick('', link.url, 'internal_link')}
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {link.anchor}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Reading Progress */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-bold text-lg mb-4">Tiến độ đọc</h3>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${scrollDepth}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">{scrollDepth}% đã đọc</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="bg-gray-900 text-white py-12">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Bạn đang tìm kiếm {page.keyword}?
            </h2>
            <p className="text-gray-300 mb-8">
              Nhận tư vấn miễn phí từ chuyên gia BĐS với hơn 10 năm kinh nghiệm
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a 
                href="/#ai-chat" 
                className="inline-flex items-center gap-2 px-8 py-4 bg-green-500 hover:bg-green-600 rounded-lg font-semibold text-lg transition"
                data-testid="footer-chat-btn"
              >
                <MessageCircle className="w-6 h-6" />
                Chat với AI ngay
              </a>
              <a 
                href="/#booking" 
                className="inline-flex items-center gap-2 px-8 py-4 bg-orange-500 hover:bg-orange-600 rounded-lg font-semibold text-lg transition"
                data-testid="footer-booking-btn"
              >
                <Calendar className="w-6 h-6" />
                Đặt lịch xem nhà miễn phí
              </a>
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

export default SEOLandingPage;
