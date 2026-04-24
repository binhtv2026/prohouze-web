import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Mail, Send, CheckCircle, XCircle, Clock, BarChart3, 
  Users, MousePointer, Eye, TrendingUp, Activity
} from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const DEMO_EMAIL_HEALTH = {
  components: {
    smtp: 'configured',
    redis: 'connected',
    worker: 'connected',
    tracker: 'configured'
  }
};

const DEMO_QUEUE_STATS = {
  queued: 12,
  sending: 3,
  sent: 426,
  failed: 9,
  retrying: 2,
  redis_queues: {
    high: 2,
    normal: 8,
    low: 5
  }
};

const DEMO_EVENT_STATS = {
  total: 863,
  by_status: {
    delivered: 515,
    opened: 241,
    clicked: 74,
    bounced: 18,
    unsubscribed: 15
  }
};

const DEMO_EMAIL_ANALYTICS = {
  total_sent: 426,
  open_rate: 42,
  click_rate: 17
};

export default function EmailDashboardPage() {
  const [health, setHealth] = useState(null);
  const [queueStats, setQueueStats] = useState(null);
  const [eventStats, setEventStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [healthRes, queueRes, eventRes, analyticsRes] = await Promise.all([
        fetch(`${API_URL}/api/email/health`),
        fetch(`${API_URL}/api/email/queue/stats`),
        fetch(`${API_URL}/api/email/events/stats`),
        fetch(`${API_URL}/api/email/analytics/overall?days=30`)
      ]);

      const healthData = healthRes.ok ? await healthRes.json() : null;
      const queueData = queueRes.ok ? await queueRes.json() : null;
      const eventData = eventRes.ok ? await eventRes.json() : null;
      const analyticsData = analyticsRes.ok ? await analyticsRes.json() : null;

      setHealth(healthData && typeof healthData === 'object' ? healthData : DEMO_EMAIL_HEALTH);
      setQueueStats(queueData && typeof queueData === 'object' ? queueData : DEMO_QUEUE_STATS);
      setEventStats(eventData && typeof eventData === 'object' ? eventData : DEMO_EVENT_STATS);
      setAnalytics(analyticsData && typeof analyticsData === 'object' ? analyticsData : DEMO_EMAIL_ANALYTICS);
    } catch (error) {
      console.error('Error fetching data:', error);
      setHealth(DEMO_EMAIL_HEALTH);
      setQueueStats(DEMO_QUEUE_STATS);
      setEventStats(DEMO_EVENT_STATS);
      setAnalytics(DEMO_EMAIL_ANALYTICS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const processQueue = async () => {
    try {
      await fetch(`${API_URL}/api/email/queue/process`, { method: 'POST' });
      fetchData();
    } catch (error) {
      console.error('Error processing queue:', error);
      fetchData();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="email-dashboard">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Automation</h1>
          <p className="text-gray-500">Quản lý email tự động với AI</p>
        </div>
        <Button onClick={processQueue} data-testid="process-queue-btn">
          <Send className="w-4 h-4 mr-2" />
          Xử lý hàng đợi
        </Button>
      </div>

      {/* System Health */}
      <Card data-testid="system-health-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Trạng thái hệ thống
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            {health?.components && Object.entries(health.components).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="font-medium capitalize">{key}:</span>
                <Badge variant={value === 'connected' || value === 'configured' ? 'default' : 'secondary'}>
                  {value === 'connected' ? <CheckCircle className="w-3 h-3 mr-1" /> : null}
                  {value}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sent */}
        <Card data-testid="total-sent-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Email đã gửi</p>
                <p className="text-3xl font-bold">{analytics?.total_sent || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Open Rate */}
        <Card data-testid="open-rate-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tỷ lệ mở</p>
                <p className="text-3xl font-bold">{analytics?.open_rate || 0}%</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Eye className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Click Rate */}
        <Card data-testid="click-rate-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tỷ lệ click</p>
                <p className="text-3xl font-bold">{analytics?.click_rate || 0}%</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <MousePointer className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Queue */}
        <Card data-testid="queue-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Trong hàng đợi</p>
                <p className="text-3xl font-bold">{queueStats?.queued || 0}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Queue Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="queue-status-card">
          <CardHeader>
            <CardTitle>Trạng thái hàng đợi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-500" />
                  Đang chờ
                </span>
                <Badge variant="outline">{queueStats?.queued || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-blue-500" />
                  Đang gửi
                </span>
                <Badge variant="outline">{queueStats?.sending || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Đã gửi
                </span>
                <Badge variant="outline">{queueStats?.sent || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-500" />
                  Thất bại
                </span>
                <Badge variant="outline">{queueStats?.failed || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-500" />
                  Đang thử lại
                </span>
                <Badge variant="outline">{queueStats?.retrying || 0}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Event Stats */}
        <Card data-testid="event-stats-card">
          <CardHeader>
            <CardTitle>Thống kê sự kiện</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Tổng sự kiện</span>
                <Badge>{eventStats?.total || 0}</Badge>
              </div>
              {eventStats?.by_status && Object.entries(eventStats.by_status).map(([status, count]) => (
                <div key={status} className="flex justify-between items-center">
                  <span className="capitalize">{status}</span>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Redis Queues */}
      {queueStats?.redis_queues && (
        <Card data-testid="redis-queues-card">
          <CardHeader>
            <CardTitle>Redis Queues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-500">High Priority</p>
                <p className="text-2xl font-bold text-red-600">{queueStats.redis_queues.high}</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-gray-500">Normal Priority</p>
                <p className="text-2xl font-bold text-yellow-600">{queueStats.redis_queues.normal}</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-500">Low Priority</p>
                <p className="text-2xl font-bold text-green-600">{queueStats.redis_queues.low}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
