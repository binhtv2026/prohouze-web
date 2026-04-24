/**
 * COREZANO AI - SALES CLOSING WIDGET
 * ==================================
 * AI Sales thực thụ - không phải chatbot
 * 
 * Features:
 * - 7-stage conversation flow
 * - Lead scoring (HOT/WARM/COLD)
 * - Auto phone capture
 * - Project suggestions
 * - Deal creation tracking
 * - Booking integration
 * - Analytics
 */

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, X, Send, Bot, Minimize2,
  Phone, Sparkles, ChevronDown, Loader2, 
  Building2, MapPin, Gift, Flame, Calendar,
  CheckCircle2, TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import BookingModal from './BookingModal';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Storage keys
const SESSION_KEY = 'prohouzing_sales_session';
const MESSAGES_KEY = 'prohouzing_sales_messages';
const STATE_KEY = 'prohouzing_sales_state';

// Stage labels
const STAGE_LABELS = {
  init: 'Bắt đầu',
  qualifying: 'Tìm hiểu nhu cầu',
  lead_capture: 'Thu thập thông tin',
  matching: 'Gợi ý dự án',
  urgency: 'Tạo cơ hội',
  closing: 'Chốt lịch',
  booking: 'Đặt lịch',
  done: 'Hoàn tất',
};

// Score colors
const SCORE_COLORS = {
  hot: 'bg-red-500',
  warm: 'bg-yellow-500',
  cold: 'bg-blue-500',
};

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [showGreeting, setShowGreeting] = useState(true);
  const [conversationState, setConversationState] = useState({
    stage: 'init',
    leadScore: null,
    leadScoreLabel: null,
    phoneCaptured: false,
    dealCreated: false,
    leadId: null,
    dealId: null,
    customerPhone: null,
  });
  const [suggestedProjects, setSuggestedProjects] = useState([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Load session from localStorage
  useEffect(() => {
    const savedSession = localStorage.getItem(SESSION_KEY);
    const savedMessages = localStorage.getItem(MESSAGES_KEY);
    const savedState = localStorage.getItem(STATE_KEY);
    
    if (savedSession) setSessionId(savedSession);
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          setShowGreeting(false);
        }
      } catch (e) {}
    }
    if (savedState) {
      try {
        setConversationState(JSON.parse(savedState));
      } catch (e) {}
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    if (sessionId) localStorage.setItem(SESSION_KEY, sessionId);
  }, [sessionId]);

  useEffect(() => {
    localStorage.setItem(STATE_KEY, JSON.stringify(conversationState));
  }, [conversationState]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
    setShowGreeting(false);
    
    // Add welcome message if no history
    if (messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: 'Xin chào anh/chị 👋\n\nEm là tư vấn BĐS của ProHouze. Hiện bên em đang có dự án giá rất tốt, chiết khấu đến 15%.\n\nAnh/chị đang tìm mua để **ở** hay **đầu tư** ạ?',
        timestamp: new Date().toISOString(),
        stage: 'init',
      }]);
    }
  };

  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!message.trim() || loading) return;
    
    const userMessage = message.trim();
    setMessage('');
    
    // Add user message
    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    }]);
    
    setLoading(true);
    
    try {
      const res = await fetch(`${API_URL}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message: userMessage,
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        
        // Update session
        if (data.session_id) setSessionId(data.session_id);
        
        // Update state
        setConversationState(prev => ({
          ...prev,
          stage: data.stage || prev.stage,
          leadScoreLabel: data.lead_score || prev.leadScoreLabel,
          phoneCaptured: data.lead_captured || prev.phoneCaptured,
          dealCreated: data.deal_created || prev.dealCreated,
          leadId: data.lead_id || prev.leadId,
          dealId: data.deal_id || prev.dealId,
        }));
        
        // Extract phone from user message for booking
        const phoneMatch = userMessage.match(/0[35789]\d{8}/);
        if (phoneMatch) {
          setConversationState(prev => ({
            ...prev,
            customerPhone: phoneMatch[0],
          }));
        }
        
        // Update suggested projects
        if (data.suggested_projects) {
          setSuggestedProjects(data.suggested_projects);
        }
        
        // Add AI response
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.message,
          timestamp: new Date().toISOString(),
          stage: data.stage,
        }]);
        
        // Notifications
        if (data.lead_captured) {
          toast.success('🎯 Đã ghi nhận thông tin! Chuyên viên sẽ liên hệ trong 15 phút.', { duration: 5000 });
        }
        if (data.deal_created) {
          toast.success('🔥 Deal đã được tạo tự động!', { duration: 3000 });
        }
        
        // Auto-show booking modal when in closing/booking stage and deal created
        if ((data.stage === 'closing' || data.stage === 'booking') && data.deal_created) {
          // Don't auto-show, let user click booking button
        }
      } else {
        throw new Error('API error');
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Xin lỗi, em đang gặp sự cố. Anh/chị để lại SĐT, chuyên viên sẽ gọi ngay ạ!',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const quickReplies = [
    { text: 'Mua để ở', icon: '🏠' },
    { text: 'Đầu tư', icon: '📈' },
    { text: 'Ngân sách 3 tỷ', icon: '💰' },
    { text: 'Khu Thủ Đức', icon: '📍' },
  ];

  const handleQuickReply = (text) => {
    setMessage(text);
    inputRef.current?.focus();
  };

  const handleOpenBooking = (project = null) => {
    setSelectedProject(project);
    setShowBookingModal(true);
  };

  const handleBookingSuccess = (booking) => {
    // Add success message to chat
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `✅ Đặt lịch thành công!\n\n📅 ${booking.time_slot} hôm nay\n👤 Chuyên viên ${booking.assigned_name || 'tư vấn'} sẽ liên hệ bạn trong 5 phút.\n\nCảm ơn anh/chị đã tin tưởng ProHouze! 🙏`,
      timestamp: new Date().toISOString(),
      stage: 'done',
    }]);
    
    setConversationState(prev => ({
      ...prev,
      stage: 'done',
    }));
    
    setShowBookingModal(false);
  };

  const startNewChat = () => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(MESSAGES_KEY);
    localStorage.removeItem(STATE_KEY);
    setSessionId(null);
    setMessages([]);
    setSuggestedProjects([]);
    setShowBookingModal(false);
    setSelectedProject(null);
    setConversationState({
      stage: 'init',
      leadScore: null,
      leadScoreLabel: null,
      phoneCaptured: false,
      dealCreated: false,
      leadId: null,
      dealId: null,
      customerPhone: null,
    });
    handleOpen();
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          data-testid="ai-chat-button"
          className="fixed bottom-6 right-6 z-50 group"
        >
          <div className="relative">
            {/* Pulse */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#316585] to-red-500 rounded-full animate-ping opacity-40" />
            
            {/* Button */}
            <div className="relative w-16 h-16 bg-gradient-to-br from-[#316585] to-[#1e4a64] rounded-full flex items-center justify-center shadow-xl shadow-[#316585]/40 group-hover:scale-110 transition-transform">
              <MessageCircle className="w-7 h-7 text-white" />
            </div>
            
            {/* Badge */}
            {showGreeting && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center animate-bounce">
                <Flame className="w-3.5 h-3.5 text-white" />
              </div>
            )}
          </div>
          
          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
            <span className="text-yellow-400 font-semibold">Ưu đãi HOT!</span> Chat ngay
            <Sparkles className="w-3 h-3 inline ml-1 text-yellow-400" />
          </div>
        </button>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <div
          data-testid="ai-chat-widget"
          className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
            isMinimized ? 'w-72' : 'w-[400px]'
          }`}
        >
          <Card className="bg-[#0d1f35] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#316585] to-[#1e4a64] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-sm flex items-center gap-2">
                      ProHouze AI
                      <Flame className="w-4 h-4 text-orange-400" />
                    </h4>
                    <p className="text-white/70 text-xs flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      Tư vấn 24/7
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsMinimized(true)}
                    className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white/80"
                  >
                    <Minimize2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    data-testid="close-chat-btn"
                    className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white/80"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Stage & Score Indicator */}
              {conversationState.stage !== 'init' && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10">
                  <Badge variant="outline" className="text-[10px] border-white/30 text-white/80">
                    {STAGE_LABELS[conversationState.stage] || conversationState.stage}
                  </Badge>
                  {conversationState.leadScoreLabel && (
                    <Badge className={`text-[10px] ${SCORE_COLORS[conversationState.leadScoreLabel] || 'bg-gray-500'}`}>
                      {conversationState.leadScoreLabel.toUpperCase()}
                    </Badge>
                  )}
                  {conversationState.phoneCaptured && (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  )}
                  {conversationState.dealCreated && (
                    <TrendingUp className="w-4 h-4 text-yellow-400" />
                  )}
                </div>
              )}
            </div>

            {/* Messages */}
            {!isMinimized && (
              <>
                <div className="h-[320px] overflow-y-auto p-4 space-y-4 bg-[#0a1628]">
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl p-3 ${
                          msg.role === 'user'
                            ? 'bg-[#316585] text-white rounded-br-sm'
                            : 'bg-white/10 text-white/90 rounded-bl-sm'
                        }`}
                      >
                        {msg.role === 'assistant' && (
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <Bot className="w-3.5 h-3.5 text-[#316585]" />
                            <span className="text-[#316585] text-xs font-medium">AI Sales</span>
                          </div>
                        )}
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  
                  {/* Loading */}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-white/10 rounded-2xl rounded-bl-sm p-3">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 text-[#316585] animate-spin" />
                          <span className="text-white/60 text-sm">Đang phân tích...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Suggested Projects */}
                  {suggestedProjects.length > 0 && !loading && (
                    <div className="space-y-2">
                      <p className="text-white/50 text-xs">Dự án gợi ý:</p>
                      {suggestedProjects.slice(0, 2).map((p, i) => (
                        <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-[#316585]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Building2 className="w-5 h-5 text-[#316585]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="text-white font-medium text-sm truncate">{p.name}</h5>
                              <div className="flex items-center gap-1 text-white/50 text-xs mt-0.5">
                                <MapPin className="w-3 h-3" />
                                {p.location}
                              </div>
                              <div className="flex items-center gap-3 mt-1.5">
                                <span className="text-[#316585] text-xs font-medium">Từ {p.price_from}</span>
                                {p.discount && (
                                  <span className="flex items-center gap-1 text-orange-400 text-xs">
                                    <Gift className="w-3 h-3" />
                                    {p.discount}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {p.units_left && (
                            <div className="mt-2 pt-2 border-t border-white/5">
                              <span className="text-red-400 text-xs font-medium">
                                🔥 Chỉ còn {p.units_left} căn giá tốt!
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Replies */}
                <div className="px-4 pb-2 flex flex-wrap gap-2 bg-[#0a1628]">
                  {/* Show booking button when deal created */}
                  {conversationState.dealCreated && conversationState.leadId && (
                    <button
                      onClick={() => handleOpenBooking(suggestedProjects[0])}
                      data-testid="open-booking-btn"
                      className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-medium flex items-center justify-center gap-2 hover:from-green-600 hover:to-emerald-600 transition-all mb-2"
                    >
                      <Calendar className="w-4 h-4" />
                      Đặt lịch xem nhà / tư vấn ngay
                    </button>
                  )}
                  
                  {quickReplies.map((reply, i) => (
                    <button
                      key={i}
                      onClick={() => handleQuickReply(reply.text)}
                      className="text-xs px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-colors"
                    >
                      {reply.icon} {reply.text}
                    </button>
                  ))}
                </div>

                {/* Input */}
                <form onSubmit={sendMessage} className="p-4 border-t border-white/10 bg-[#0d1f35]">
                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      type="text"
                      placeholder="Nhập tin nhắn..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      disabled={loading}
                      data-testid="chat-input"
                      className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-full px-4 h-10 text-sm"
                    />
                    <Button
                      type="submit"
                      disabled={loading || !message.trim()}
                      data-testid="send-message-btn"
                      className="w-10 h-10 rounded-full bg-[#316585] hover:bg-[#3d7a9e] p-0"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {/* New chat button */}
                  {conversationState.dealCreated && (
                    <button
                      type="button"
                      onClick={startNewChat}
                      className="w-full mt-2 text-xs text-white/50 hover:text-white/70"
                    >
                      Bắt đầu cuộc trò chuyện mới
                    </button>
                  )}
                </form>
              </>
            )}

            {/* Minimized */}
            {isMinimized && (
              <button
                onClick={() => setIsMinimized(false)}
                className="w-full p-4 flex items-center justify-between text-white hover:bg-white/5"
              >
                <span className="text-sm">Tiếp tục tư vấn</span>
                <ChevronDown className="w-4 h-4 rotate-180" />
              </button>
            )}
          </Card>
        </div>
      )}

      {/* Booking Modal */}
      <BookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        leadId={conversationState.leadId}
        dealId={conversationState.dealId}
        projectName={selectedProject?.name || suggestedProjects[0]?.name}
        customerPhone={conversationState.customerPhone}
        onSuccess={handleBookingSuccess}
      />
    </>
  );
}
