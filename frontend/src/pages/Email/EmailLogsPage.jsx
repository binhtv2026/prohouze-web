import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, RefreshCw, Eye, CheckCircle, XCircle, Clock, Mail, MousePointer } from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const DEMO_EMAIL_LOGS = [
  { id: 'email-log-1', status: 'sent', email: 'khach1@example.com', subject: 'Bảng giá Rivera tháng 3', open_count: 3, click_count: 1, sent_at: new Date().toISOString() },
  { id: 'email-log-2', status: 'failed', email: 'khach2@example.com', subject: 'Chính sách bán hàng Sunrise', open_count: 0, click_count: 0, sent_at: new Date(Date.now() - 3600000).toISOString(), error_message: 'Mailbox unavailable' },
];

const DEMO_EMAIL_ANALYTICS = {
  open_count: 3,
  click_count: 1,
  opened_at: new Date().toISOString(),
  clicked_at: new Date().toISOString(),
  clicked_links: ['https://prohouze.com/projects/rivera'],
};

export default function EmailLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/api/email/logs?limit=100`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (emailFilter) url += `&email=${emailFilter}`;
      
      const res = await fetch(url);
      const data = await res.json();
      setLogs(Array.isArray(data) && data.length > 0 ? data : DEMO_EMAIL_LOGS);
    } catch (error) {
      console.error('Error fetching logs:', error);
      setLogs(DEMO_EMAIL_LOGS.filter((item) => {
        const matchesStatus = !statusFilter || item.status === statusFilter;
        const q = emailFilter?.toLowerCase?.() || '';
        const matchesEmail = !q || item.email?.toLowerCase().includes(q);
        return matchesStatus && matchesEmail;
      }));
    } finally {
      setLoading(false);
    }
  }, [emailFilter, statusFilter]);

  const fetchAnalytics = async (logId) => {
    try {
      const res = await fetch(`${API_URL}/api/email/logs/${logId}/analytics`);
      const data = await res.json();
      setAnalytics(data || DEMO_EMAIL_ANALYTICS);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setAnalytics(DEMO_EMAIL_ANALYTICS);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'bounced':
        return <XCircle className="w-4 h-4 text-orange-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      sent: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      bounced: 'bg-orange-100 text-orange-800'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const handleViewDetails = async (log) => {
    setSelectedLog(log);
    await fetchAnalytics(log.id);
  };

  return (
    <div className="p-6 space-y-6" data-testid="email-logs-page">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Logs</h1>
          <p className="text-gray-500">Lịch sử gửi email và tracking</p>
        </div>
        <Button variant="outline" onClick={fetchLogs} data-testid="refresh-logs-btn">
          <RefreshCw className="w-4 h-4 mr-2" />
          Làm mới
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={emailFilter}
                  onChange={(e) => setEmailFilter(e.target.value)}
                  placeholder="Tìm theo email..."
                  className="pl-10"
                  data-testid="email-filter-input"
                  onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
                />
              </div>
            </div>
            <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="w-40" data-testid="status-filter-select">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="sent">Đã gửi</SelectItem>
                <SelectItem value="failed">Thất bại</SelectItem>
                <SelectItem value="bounced">Bounced</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchLogs} data-testid="search-btn">
              Tìm kiếm
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead className="text-center">Opens</TableHead>
                <TableHead className="text-center">Clicks</TableHead>
                <TableHead>Thời gian</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    Không có log nào
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} data-testid={`log-row-${log.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(log.status)}
                        <Badge className={getStatusBadge(log.status)}>
                          {log.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{log.email}</TableCell>
                    <TableCell className="max-w-xs truncate">{log.subject}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Eye className="w-3 h-3 text-gray-400" />
                        {log.open_count || 0}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <MousePointer className="w-3 h-3 text-gray-400" />
                        {log.click_count || 0}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(log.sent_at).toLocaleString('vi-VN')}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(log)}
                        data-testid={`view-log-btn-${log.id}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Log Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết Email</DialogTitle>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{selectedLog.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Trạng thái</p>
                  <Badge className={getStatusBadge(selectedLog.status)}>
                    {selectedLog.status}
                  </Badge>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">Subject</p>
                <p className="font-medium">{selectedLog.subject}</p>
              </div>

              <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{analytics?.open_count || 0}</p>
                  <p className="text-xs text-gray-500">Opens</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{analytics?.click_count || 0}</p>
                  <p className="text-xs text-gray-500">Clicks</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">{analytics?.opened_at ? new Date(analytics.opened_at).toLocaleString('vi-VN') : '-'}</p>
                  <p className="text-xs text-gray-500">First Open</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">{analytics?.clicked_at ? new Date(analytics.clicked_at).toLocaleString('vi-VN') : '-'}</p>
                  <p className="text-xs text-gray-500">First Click</p>
                </div>
              </div>

              {analytics?.clicked_links?.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Clicked Links</p>
                  <div className="space-y-1">
                    {analytics.clicked_links.map((link, i) => (
                      <div key={i} className="p-2 bg-gray-50 rounded text-sm truncate">
                        {link}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedLog.error_message && (
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-800">{selectedLog.error_message}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
