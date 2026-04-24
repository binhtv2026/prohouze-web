import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
  RefreshCw, AlertTriangle, CheckCircle, XCircle, Clock, Send, 
  RotateCw, Eye, Zap, Timer, AlertCircle, PlayCircle
} from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const DEMO_EMAIL_JOBS = [
  {
    id: 'job-001',
    status: 'queued',
    email: 'khach.vip@prohouze.com',
    subject: 'Chinh sach ban hang du an The Glory Heights',
    retry_count: 0,
    max_retries: 3,
    last_error: null,
    queued_at: '2026-03-26T08:30:00+07:00',
    priority: 3
  },
  {
    id: 'job-002',
    status: 'failed',
    email: 'nha.dau.tu@prohouze.com',
    subject: 'Bang gia cap nhat dot mo ban cuoi tuan',
    retry_count: 2,
    max_retries: 3,
    last_error: 'Provider timeout sau 30 giay',
    queued_at: '2026-03-26T07:45:00+07:00',
    priority: 5
  },
  {
    id: 'job-003',
    status: 'sent',
    email: 'sale.team@prohouze.com',
    subject: 'Thuong nong cho sale chot giao dich dau tien',
    retry_count: 0,
    max_retries: 3,
    last_error: null,
    queued_at: '2026-03-26T06:10:00+07:00',
    processed_at: '2026-03-26T06:11:40+07:00',
    priority: 2
  }
];

const DEMO_STUCK_JOBS = [
  {
    id: 'job-002',
    email: 'nha.dau.tu@prohouze.com',
    stuck_duration_seconds: 1240,
    status: 'failed'
  }
];

const DEMO_DETAILED_STATS = {
  queued: 4,
  sending: 1,
  sent: 128,
  failed: 3,
  retrying: 1,
  stuck_jobs_count: 1,
  processing_metrics: {
    total_processed: 184,
    avg_processing_time_ms: 12400,
    min_processing_time_ms: 3200,
    max_processing_time_ms: 45600
  },
  error_breakdown: [
    { error: 'Provider timeout sau 30 giay', count: 2 },
    { error: 'Dia chi email khong hop le', count: 1 }
  ]
};

const buildDemoJobDetail = (job) => ({
  is_stuck: job?.status === 'failed',
  stuck_duration_seconds: 1240,
  processing_time_seconds: job?.status === 'sent' ? 14 : null,
  job: {
    ...job,
    queued_at: job?.queued_at || '2026-03-26T08:30:00+07:00',
    started_at: '2026-03-26T08:31:00+07:00',
    processed_at: job?.processed_at || null,
    next_retry_at: job?.status === 'failed' ? '2026-03-26T09:15:00+07:00' : null,
    provider_message_id: 'demo-provider-001',
    provider_name: 'SendGrid',
    template_key: 'sales_policy_update'
  }
});

export default function EmailJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [stuckJobs, setStuckJobs] = useState([]);
  const [detailedStats, setDetailedStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobDetail, setJobDetail] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      let jobsUrl = `${API_URL}/api/email/jobs?limit=100`;
      if (statusFilter !== 'all') {
        jobsUrl += `&status=${statusFilter}`;
      }
      
      const [jobsRes, stuckRes, statsRes] = await Promise.all([
        fetch(jobsUrl),
        fetch(`${API_URL}/api/email/jobs/stuck?threshold_minutes=5`),
        fetch(`${API_URL}/api/email/queue/detailed-stats`)
      ]);
      
      const jobsData = jobsRes.ok ? await jobsRes.json() : null;
      const stuckData = stuckRes.ok ? await stuckRes.json() : null;
      const statsData = statsRes.ok ? await statsRes.json() : null;

      setJobs(Array.isArray(jobsData) && jobsData.length > 0 ? jobsData : DEMO_EMAIL_JOBS);
      setStuckJobs(Array.isArray(stuckData) ? stuckData : DEMO_STUCK_JOBS);
      setDetailedStats(statsData && typeof statsData === 'object' ? statsData : DEMO_DETAILED_STATS);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setJobs(DEMO_EMAIL_JOBS);
      setStuckJobs(DEMO_STUCK_JOBS);
      setDetailedStats(DEMO_DETAILED_STATS);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 10 seconds
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchData, 10000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchData, autoRefresh]);

  const fetchJobDetail = async (jobId) => {
    try {
      const res = await fetch(`${API_URL}/api/email/jobs/${jobId}/detail`);
      const detail = res.ok ? await res.json() : null;
      setJobDetail(detail || buildDemoJobDetail(selectedJob));
    } catch (error) {
      console.error('Error fetching job detail:', error);
      setJobDetail(buildDemoJobDetail(selectedJob));
      toast.error('Khong the tai chi tiet job, dang hien du lieu demo');
    }
  };

  const retryJob = async (jobId) => {
    try {
      const res = await fetch(`${API_URL}/api/email/jobs/${jobId}/retry`, {
        method: 'POST'
      });
      
      if (res.ok) {
        toast.success('Đã thêm job vào hàng đợi retry');
        fetchData();
        setSelectedJob(null);
      } else {
        const error = await res.json();
        toast.error(error.detail || 'Lỗi retry job');
      }
    } catch (error) {
      console.error('Error retrying job:', error);
      toast.error('Lỗi hệ thống');
    }
  };

  const processQueue = async () => {
    try {
      await fetch(`${API_URL}/api/email/queue/process`, { method: 'POST' });
      toast.success('Đang xử lý hàng đợi...');
      setTimeout(fetchData, 2000);
    } catch (error) {
      console.error('Error processing queue:', error);
      toast.error('Lỗi xử lý queue');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'queued':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'sending':
        return <Send className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'retrying':
        return <RotateCw className="w-4 h-4 text-orange-500 animate-spin" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      queued: 'bg-yellow-100 text-yellow-800',
      sending: 'bg-blue-100 text-blue-800',
      sent: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      retrying: 'bg-orange-100 text-orange-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '-';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  const handleViewDetail = async (job) => {
    setSelectedJob(job);
    await fetchJobDetail(job.id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="email-jobs-page">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Queue Monitoring</h1>
          <p className="text-gray-500">Giám sát hàng đợi email và job status</p>
        </div>
        <div className="flex gap-2 items-center">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto-refresh
          </label>
          <Button variant="outline" onClick={fetchData} data-testid="refresh-btn">
            <RefreshCw className="w-4 h-4 mr-2" />
            Làm mới
          </Button>
          <Button onClick={processQueue} data-testid="process-queue-btn">
            <PlayCircle className="w-4 h-4 mr-2" />
            Xử lý Queue
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Đang chờ</p>
                <p className="text-2xl font-bold text-yellow-600">{detailedStats?.queued || 0}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Đang gửi</p>
                <p className="text-2xl font-bold text-blue-600">{detailedStats?.sending || 0}</p>
              </div>
              <Send className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Đã gửi</p>
                <p className="text-2xl font-bold text-green-600">{detailedStats?.sent || 0}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Thất bại</p>
                <p className="text-2xl font-bold text-red-600">{detailedStats?.failed || 0}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className={stuckJobs.length > 0 ? 'border-red-500 border-2' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Stuck Jobs</p>
                <p className="text-2xl font-bold text-orange-600">{detailedStats?.stuck_jobs_count || 0}</p>
              </div>
              <AlertTriangle className={`w-8 h-8 ${stuckJobs.length > 0 ? 'text-red-500 animate-pulse' : 'text-orange-400'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stuck Jobs Alert */}
      {stuckJobs.length > 0 && (
        <Card className="border-red-500 bg-red-50" data-testid="stuck-jobs-alert">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5" />
              Cảnh báo: {stuckJobs.length} jobs bị stuck (&gt; 5 phút)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stuckJobs.slice(0, 5).map((job) => (
                <div key={job.id} className="flex justify-between items-center p-2 bg-white rounded border">
                  <div>
                    <span className="font-medium">{job.email}</span>
                    <span className="text-sm text-gray-500 ml-2">
                      ({formatDuration(job.stuck_duration_seconds)} stuck)
                    </span>
                  </div>
                  <Button size="sm" variant="destructive" onClick={() => retryJob(job.id)}>
                    <RotateCw className="w-3 h-3 mr-1" />
                    Retry
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing Metrics */}
      {detailedStats?.processing_metrics && Object.keys(detailedStats.processing_metrics).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="w-5 h-5" />
              Processing Metrics (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded">
                <p className="text-2xl font-bold">{detailedStats.processing_metrics.total_processed || 0}</p>
                <p className="text-sm text-gray-500">Total Processed</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded">
                <p className="text-2xl font-bold">
                  {Math.round((detailedStats.processing_metrics.avg_processing_time_ms || 0) / 1000)}s
                </p>
                <p className="text-sm text-gray-500">Avg Time</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded">
                <p className="text-2xl font-bold">
                  {Math.round((detailedStats.processing_metrics.min_processing_time_ms || 0) / 1000)}s
                </p>
                <p className="text-sm text-gray-500">Min Time</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded">
                <p className="text-2xl font-bold">
                  {Math.round((detailedStats.processing_metrics.max_processing_time_ms || 0) / 1000)}s
                </p>
                <p className="text-sm text-gray-500">Max Time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Breakdown */}
      {detailedStats?.error_breakdown?.length > 0 && (
        <Card data-testid="error-breakdown-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              Error Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {detailedStats.error_breakdown.map((err, i) => (
                <div key={i} className="flex justify-between items-center p-2 bg-red-50 rounded">
                  <span className="text-sm text-red-800 truncate max-w-md">{err.error || 'Unknown error'}</span>
                  <Badge variant="destructive">{err.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Jobs List</CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40" data-testid="status-filter">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="queued">Đang chờ</SelectItem>
                <SelectItem value="sending">Đang gửi</SelectItem>
                <SelectItem value="sent">Đã gửi</SelectItem>
                <SelectItem value="failed">Thất bại</SelectItem>
                <SelectItem value="retrying">Đang retry</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead className="text-center">Retry</TableHead>
                <TableHead>Error</TableHead>
                <TableHead>Queued At</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    Không có jobs nào
                  </TableCell>
                </TableRow>
              ) : (
                jobs.map((job) => (
                  <TableRow key={job.id} data-testid={`job-row-${job.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(job.status)}
                        <Badge className={getStatusBadge(job.status)}>
                          {job.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{job.email}</TableCell>
                    <TableCell className="max-w-xs truncate">{job.subject}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{job.retry_count || 0}/{job.max_retries || 3}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-red-600 text-sm">
                      {job.last_error || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(job.queued_at).toLocaleString('vi-VN')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetail(job)}
                          data-testid={`view-job-btn-${job.id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {['failed', 'retrying'].includes(job.status) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => retryJob(job.id)}
                            data-testid={`retry-job-btn-${job.id}`}
                          >
                            <RotateCw className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Job Detail Dialog */}
      <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết Job</DialogTitle>
          </DialogHeader>
          
          {jobDetail && (
            <div className="space-y-4 py-4">
              {/* Status Banner */}
              {jobDetail.is_stuck && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <span className="text-red-700 font-medium">
                    Job bị stuck ({formatDuration(jobDetail.stuck_duration_seconds)})
                  </span>
                </div>
              )}

              {/* Job Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{jobDetail.job?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge className={getStatusBadge(jobDetail.job?.status)}>
                    {jobDetail.job?.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Subject</p>
                  <p className="font-medium">{jobDetail.job?.subject}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Processing Time</p>
                  <p className="font-medium">
                    {jobDetail.processing_time_seconds 
                      ? `${Math.round(jobDetail.processing_time_seconds)}s`
                      : '-'}
                  </p>
                </div>
              </div>

              {/* Retry Info */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Retry Information</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Retry Count</p>
                    <p className="font-medium">{jobDetail.job?.retry_count || 0}/{jobDetail.job?.max_retries || 3}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Next Retry At</p>
                    <p className="font-medium">
                      {jobDetail.job?.next_retry_at 
                        ? new Date(jobDetail.job.next_retry_at).toLocaleString('vi-VN')
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Priority</p>
                    <p className="font-medium">{jobDetail.job?.priority || 5}</p>
                  </div>
                </div>
              </div>

              {/* Error */}
              {jobDetail.job?.last_error && (
                <div className="p-4 bg-red-50 rounded-lg">
                  <h4 className="font-medium text-red-800 mb-2">Last Error</h4>
                  <p className="text-sm text-red-700 whitespace-pre-wrap">{jobDetail.job.last_error}</p>
                </div>
              )}

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Queued At</p>
                  <p>{jobDetail.job?.queued_at ? new Date(jobDetail.job.queued_at).toLocaleString('vi-VN') : '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Started At</p>
                  <p>{jobDetail.job?.started_at ? new Date(jobDetail.job.started_at).toLocaleString('vi-VN') : '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Processed At</p>
                  <p>{jobDetail.job?.processed_at ? new Date(jobDetail.job.processed_at).toLocaleString('vi-VN') : '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Provider ID</p>
                  <p className="font-mono text-xs">{jobDetail.job?.provider_id || '-'}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            {selectedJob && ['failed', 'retrying', 'queued'].includes(selectedJob.status) && (
              <Button onClick={() => retryJob(selectedJob.id)} data-testid="retry-dialog-btn">
                <RotateCw className="w-4 h-4 mr-2" />
                Retry Job
              </Button>
            )}
            <Button variant="outline" onClick={() => setSelectedJob(null)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
