import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Plus,
  MessageSquare,
  Send,
  Users,
  Hash,
  Lock,
  Search,
  MoreVertical,
  Paperclip,
  Smile,
  Check,
  CheckCheck,
  Clock,
  Building2,
} from 'lucide-react';
import { toast } from 'sonner';

const channelTypeLabels = {
  public: { label: 'Công khai', icon: Hash },
  private: { label: 'Riêng tư', icon: Lock },
  department: { label: 'Phòng ban', icon: Building2 },
};

const DEMO_CHANNELS = [
  { id: 'ch-1', name: 'Kinh doanh miền Nam', type: 'department', description: 'Trao đổi team kinh doanh khu vực miền Nam' },
  { id: 'ch-2', name: 'Marketing đa kênh', type: 'public', description: 'Nội dung và lead đa kênh' },
];

const DEMO_EMPLOYEES = [
  { id: 'user-1', full_name: 'Nguyễn Hoàng Phúc', email: 'phuc@prohouze.com' },
  { id: 'user-2', full_name: 'Lê Mỹ Linh', email: 'linh@prohouze.com' },
  { id: 'user-3', full_name: 'Trần Gia Bảo', email: 'bao@prohouze.com' },
];

const DEMO_MESSAGES = [
  { id: 'msg-1', content: 'Hôm nay ưu tiên lead nóng dự án The Privé.', sender_name: 'Quản lý kinh doanh', created_at: '2026-03-26T08:30:00Z' },
  { id: 'msg-2', content: 'Đã cập nhật bảng giá mới trong tài liệu bán hàng.', sender_name: 'Marketing', created_at: '2026-03-26T09:15:00Z' },
];

export default function InternalMessagingPage() {
  const { token, user } = useAuth();
  const [channels, setChannels] = useState([]);
  const [directContacts, setDirectContacts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showChannelDialog, setShowChannelDialog] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);

  const [channelForm, setChannelForm] = useState({
    name: '',
    type: 'public',
    description: '',
    member_ids: [],
  });

  const fetchChannels = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/hrm-advanced/messages/channels');
      const items = res.data || [];
      setChannels(items.length > 0 ? items : DEMO_CHANNELS);
    } catch (error) {
      console.error('Error:', error);
      setChannels(DEMO_CHANNELS);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await api.get('/users');
      const items = res.data || [];
      const filtered = items.filter(e => e.id !== user?.id);
      setEmployees(filtered.length > 0 ? filtered : DEMO_EMPLOYEES.filter(e => e.id !== user?.id));
    } catch (error) {
      console.error('Error:', error);
      setEmployees(DEMO_EMPLOYEES.filter(e => e.id !== user?.id));
    }
  }, [user?.id]);

  const fetchMessages = useCallback(async () => {
    try {
      const params = selectedChannel
        ? `channel_id=${selectedChannel.id}`
        : `user_id=${selectedUser.id}`;
      const res = await api.get(`/hrm-advanced/messages?${params}`);
      const items = res.data || [];
      setMessages(items.length > 0 ? items : DEMO_MESSAGES);
    } catch (error) {
      console.error('Error:', error);
      setMessages(DEMO_MESSAGES);
    }
  }, [selectedChannel, selectedUser]);

  useEffect(() => {
    fetchChannels();
    fetchEmployees();
  }, [fetchChannels, fetchEmployees]);

  useEffect(() => {
    if (selectedChannel || selectedUser) {
      fetchMessages();
    }
  }, [fetchMessages, selectedChannel, selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    try {
      await api.post('/hrm-advanced/messages/channels', channelForm);
      toast.success('Đã tạo kênh chat');
      setShowChannelDialog(false);
      fetchChannels();
      setChannelForm({
        name: '',
        type: 'public',
        description: '',
        member_ids: [],
      });
    } catch (error) {
      console.error('Error:', error);
      toast.error('Không thể tạo kênh');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const payload = {
        content: newMessage,
        to_channel_id: selectedChannel?.id || null,
        to_user_id: selectedUser?.id || null,
      };

      await api.post('/hrm-advanced/messages', payload);
      setNewMessage('');
      fetchMessages();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Không thể gửi tin nhắn');
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Vừa xong';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} phút`;
    if (diff < 86400000) return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString('vi-VN');
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).slice(-2).join('').toUpperCase();
  };

  const filteredChannels = channels.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredEmployees = employees.filter(e =>
    e.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentChat = selectedChannel || selectedUser;
  const chatTitle = selectedChannel?.name || selectedUser?.full_name;

  return (
    <div className="h-[calc(100vh-200px)] flex gap-4" data-testid="internal-messaging-page">
      {/* Sidebar - Channels & Contacts */}
      <Card className="w-80 flex-shrink-0 flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Tin nhắn</CardTitle>
            <Dialog open={showChannelDialog} onOpenChange={setShowChannelDialog}>
              <DialogTrigger asChild>
                <Button size="icon" variant="ghost">
                  <Plus className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tạo Kênh Chat</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateChannel} className="space-y-4">
                  <div>
                    <Label>Tên kênh *</Label>
                    <Input
                      value={channelForm.name}
                      onChange={(e) => setChannelForm({ ...channelForm, name: e.target.value })}
                      placeholder="VD: team-sales"
                      required
                    />
                  </div>
                  <div>
                    <Label>Loại</Label>
                    <Select value={channelForm.type} onValueChange={(v) => setChannelForm({ ...channelForm, type: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(channelTypeLabels).map(([key, val]) => (
                          <SelectItem key={key} value={key}>{val.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Mô tả</Label>
                    <Textarea
                      value={channelForm.description}
                      onChange={(e) => setChannelForm({ ...channelForm, description: e.target.value })}
                      placeholder="Mô tả kênh..."
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => setShowChannelDialog(false)}>
                      Huỷ
                    </Button>
                    <Button type="submit">Tạo kênh</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              className="pl-9"
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full">
            {/* Channels */}
            <div className="p-2">
              <p className="text-xs font-medium text-slate-500 px-3 py-2">KÊNH</p>
              {filteredChannels.map((channel) => {
                const TypeIcon = channelTypeLabels[channel.type]?.icon || Hash;
                const isSelected = selectedChannel?.id === channel.id;

                return (
                  <button
                    key={channel.id}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      isSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-100'
                    }`}
                    onClick={() => {
                      setSelectedChannel(channel);
                      setSelectedUser(null);
                    }}
                  >
                    <TypeIcon className="h-4 w-4 flex-shrink-0" />
                    <span className="flex-1 truncate">{channel.name}</span>
                    {channel.unread_count > 0 && (
                      <Badge className="bg-red-500">{channel.unread_count}</Badge>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Direct Messages */}
            <div className="p-2 border-t">
              <p className="text-xs font-medium text-slate-500 px-3 py-2">TIN NHẮN TRỰC TIẾP</p>
              {filteredEmployees.slice(0, 10).map((emp) => {
                const isSelected = selectedUser?.id === emp.id;

                return (
                  <button
                    key={emp.id}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      isSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-100'
                    }`}
                    onClick={() => {
                      setSelectedUser(emp);
                      setSelectedChannel(null);
                    }}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{getInitials(emp.full_name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{emp.full_name}</p>
                      <p className="text-xs text-slate-500 truncate">{emp.role}</p>
                    </div>
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col">
        {currentChat ? (
          <>
            {/* Chat Header */}
            <CardHeader className="pb-2 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {selectedChannel ? (
                    <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Hash className="h-5 w-5 text-blue-600" />
                    </div>
                  ) : (
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{getInitials(selectedUser?.full_name)}</AvatarFallback>
                    </Avatar>
                  )}
                  <div>
                    <p className="font-medium">{chatTitle}</p>
                    <p className="text-xs text-slate-500">
                      {selectedChannel
                        ? `${selectedChannel.member_count} thành viên`
                        : selectedUser?.role}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>

            {/* Messages */}
            <CardContent className="flex-1 overflow-hidden p-0">
              <ScrollArea className="h-full p-4">
                <div className="space-y-4">
                  {messages.map((msg, idx) => {
                    const isOwn = msg.from_user_id === user?.id;
                    const showAvatar = !isOwn && (idx === 0 || messages[idx - 1]?.from_user_id !== msg.from_user_id);

                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
                      >
                        {!isOwn && showAvatar ? (
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{getInitials(msg.from_user_name)}</AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="w-8" />
                        )}
                        <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
                          {!isOwn && showAvatar && (
                            <p className="text-xs text-slate-500 mb-1">{msg.from_user_name}</p>
                          )}
                          <div
                            className={`px-4 py-2 rounded-2xl ${
                              isOwn
                                ? 'bg-blue-600 text-white rounded-tr-sm'
                                : 'bg-slate-100 text-slate-900 rounded-tl-sm'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          </div>
                          <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : ''}`}>
                            <span className="text-xs text-slate-400">{formatTime(msg.created_at)}</span>
                            {isOwn && (
                              <span className="text-blue-500">
                                {msg.is_read ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </CardContent>

            {/* Message Input */}
            <div className="p-4 border-t">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Button type="button" variant="ghost" size="icon">
                  <Paperclip className="h-5 w-5" />
                </Button>
                <Input
                  className="flex-1"
                  placeholder="Nhập tin nhắn..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <Button type="button" variant="ghost" size="icon">
                  <Smile className="h-5 w-5" />
                </Button>
                <Button type="submit" disabled={!newMessage.trim()}>
                  <Send className="h-5 w-5" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500">Chọn một kênh hoặc người để bắt đầu chat</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
