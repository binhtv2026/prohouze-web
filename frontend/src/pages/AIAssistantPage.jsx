import React, { useState, useEffect, useRef } from 'react';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { aiAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Bot,
  Send,
  Sparkles,
  User,
  Lightbulb,
  TrendingUp,
  Users,
  FileText,
} from 'lucide-react';

const quickActions = [
  { icon: TrendingUp, label: 'Phân tích hiệu suất', prompt: 'Phân tích hiệu suất bán hàng của tôi tháng này' },
  { icon: Users, label: 'Tư vấn lead nóng', prompt: 'Gợi ý cách tiếp cận lead nóng hiệu quả' },
  { icon: FileText, label: 'Mẫu email chốt sale', prompt: 'Viết mẫu email chốt sale chuyên nghiệp' },
  { icon: Lightbulb, label: 'Kịch bản gọi điện', prompt: 'Gợi ý kịch bản gọi điện tư vấn khách hàng lần đầu' },
];

export default function AIAssistantPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Xin chào ${user?.full_name}! Tôi là AI Assistant của ProHouze. Tôi có thể giúp bạn:\n\n• Phân tích dữ liệu lead và khách hàng\n• Đề xuất chiến lược bán hàng\n• Viết nội dung email/SMS marketing\n• Gợi ý kịch bản tư vấn\n• Trả lời các câu hỏi về thị trường BĐS\n\nBạn cần tôi hỗ trợ gì?`,
      suggestions: [],
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;

    const userMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await aiAPI.chat({ message: text });
      const assistantMessage = {
        role: 'assistant',
        content: response.data.response,
        suggestions: response.data.suggestions || [],
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      toast.error('Không thể kết nối AI Assistant');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Xin lỗi, tôi đang gặp sự cố kết nối. Vui lòng thử lại sau.',
          suggestions: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="min-h-screen bg-slate-50" data-testid="ai-assistant-page">
      <Header title="AI Assistant" />

      <div className="p-6 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <Card className="bg-white border border-slate-200 sticky top-24">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#316585]" />
                  Gợi ý nhanh
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => sendMessage(action.prompt)}
                    disabled={loading}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors text-left disabled:opacity-50"
                    data-testid={`quick-action-${index}`}
                  >
                    <action.icon className="w-4 h-4 text-[#316585]" />
                    <span className="text-sm font-medium text-slate-700">{action.label}</span>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3">
            <Card className="bg-white border border-slate-200 h-[calc(100vh-200px)] flex flex-col">
              {/* Messages */}
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {message.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-[#316585] flex items-center justify-center shrink-0">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          message.role === 'user'
                            ? 'bg-[#316585] text-white'
                            : 'bg-slate-100 text-slate-900'
                        }`}
                      >
                        <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                        {message.suggestions && message.suggestions.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {message.suggestions.map((suggestion, sIndex) => (
                              <button
                                key={sIndex}
                                onClick={() => sendMessage(suggestion)}
                                className="px-3 py-1 rounded-full bg-white/20 text-xs hover:bg-white/30 transition-colors"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {message.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-slate-600" />
                        </div>
                      )}
                    </div>
                  ))}
                  {loading && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#316585] flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-slate-100 rounded-2xl px-4 py-3">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-4 border-t border-slate-200">
                <form onSubmit={handleSubmit} className="flex gap-3">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Nhập câu hỏi hoặc yêu cầu của bạn..."
                    disabled={loading}
                    className="flex-1 h-11"
                    data-testid="ai-chat-input"
                  />
                  <Button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="h-11 px-6 bg-[#316585] hover:bg-[#264f68]"
                    data-testid="ai-chat-submit"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
