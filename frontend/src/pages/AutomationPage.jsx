import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { automationAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Zap,
  Plus,
  Clock,
  Mail,
  MessageSquare,
  Bell,
  UserPlus,
  RefreshCw,
  Settings,
} from 'lucide-react';

const DEMO_AUTOMATION_RULES = [
  { id: 'rule-1', name: 'Chia lead tự động theo vòng quay', trigger: 'lead_created', trigger_count: 128, is_active: true, actions: [{ action: 'assign_lead' }] },
  { id: 'rule-2', name: 'Nhắc sales follow-up lead nóng', trigger: 'lead_not_contacted', trigger_count: 42, is_active: true, actions: [{ action: 'send_notification' }] },
  { id: 'rule-3', name: 'Thu hồi lead quá hạn', trigger: 'lead_no_progress', trigger_count: 18, is_active: false, actions: [{ action: 'reassign_lead' }] },
];

const DEMO_AUTOMATION_LOGS = [
  { id: 'log-1', rule_name: 'Chia lead tự động theo vòng quay', triggered_at: new Date().toISOString(), actions_executed: [{ action: 'assign_lead', status: 'success' }] },
  { id: 'log-2', rule_name: 'Nhắc sales follow-up lead nóng', triggered_at: new Date(Date.now() - 3600000).toISOString(), actions_executed: [{ action: 'send_notification', status: 'success' }] },
];

const triggerTypes = [
  { value: 'lead_created', label: 'Lead mới được tạo', icon: UserPlus },
  { value: 'lead_status_changed', label: 'Trạng thái lead thay đổi', icon: RefreshCw },
  { value: 'lead_not_contacted', label: 'Lead chưa được liên hệ', icon: Clock },
  { value: 'lead_no_progress', label: 'Lead không tiến triển', icon: Clock },
  { value: 'time_based', label: 'Theo thời gian', icon: Clock },
];

const actionTypes = [
  { value: 'assign_lead', label: 'Chia lead', icon: UserPlus },
  { value: 'reassign_lead', label: 'Thu hồi & đảo lead', icon: RefreshCw },
  { value: 'send_notification', label: 'Gửi thông báo', icon: Bell },
  { value: 'send_email', label: 'Gửi Email', icon: Mail },
  { value: 'send_sms', label: 'Gửi SMS', icon: MessageSquare },
  { value: 'create_task', label: 'Tạo task', icon: Clock },
  { value: 'add_to_nurture', label: 'Thêm vào nurture', icon: RefreshCw },
];

export default function AutomationPage() {
  const { hasRole } = useAuth();
  const [rules, setRules] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    trigger: 'lead_created',
    conditions: {},
    actions: [],
    is_active: true,
  });

  const loadRules = useCallback(async () => {
    try {
      const response = await automationAPI.getRules();
      setRules(Array.isArray(response?.data) && response.data.length > 0 ? response.data : DEMO_AUTOMATION_RULES);
    } catch (error) {
      console.log('Could not load rules');
      setRules(DEMO_AUTOMATION_RULES);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLogs = useCallback(async () => {
    try {
      const response = await automationAPI.getLogs({ limit: 20 });
      setLogs(Array.isArray(response?.data) && response.data.length > 0 ? response.data : DEMO_AUTOMATION_LOGS);
    } catch (error) {
      console.log('Could not load logs');
      setLogs(DEMO_AUTOMATION_LOGS);
    }
  }, []);

  useEffect(() => {
    loadRules();
    loadLogs();
  }, [loadLogs, loadRules]);

  const handleToggleRule = async (ruleId) => {
    try {
      const response = await automationAPI.toggleRule(ruleId);
      toast.success(response.data.is_active ? 'Đã bật quy tắc' : 'Đã tắt quy tắc');
      loadRules();
    } catch (error) {
      toast.error('Không thể thay đổi trạng thái');
    }
  };

  const handleCreateRule = async () => {
    try {
      await automationAPI.createRule(newRule);
      toast.success('Tạo quy tắc automation thành công!');
      setShowAddModal(false);
      setNewRule({
        name: '',
        trigger: 'lead_created',
        conditions: {},
        actions: [],
        is_active: true,
      });
      loadRules();
    } catch (error) {
      toast.error('Không thể tạo quy tắc');
    }
  };

  // Sample automation templates
  const templates = [
    {
      name: 'Chia lead tự động',
      description: 'Tự động phân chia lead mới cho sales theo round-robin',
      trigger: 'lead_created',
      icon: UserPlus,
      color: 'bg-blue-100 text-blue-700',
    },
    {
      name: 'Nhắc nhở liên hệ',
      description: 'Nhắc sales liên hệ lại sau 24h nếu lead chưa được cập nhật',
      trigger: 'time_based',
      icon: Clock,
      color: 'bg-orange-100 text-orange-700',
    },
    {
      name: 'Thu hồi lead tự động',
      description: 'Thu hồi lead và giao cho sales khác sau 3 ngày không chốt',
      trigger: 'time_based',
      icon: RefreshCw,
      color: 'bg-red-100 text-red-700',
    },
    {
      name: 'Email chào mừng',
      description: 'Gửi email cảm ơn tự động khi lead mới đăng ký',
      trigger: 'lead_created',
      icon: Mail,
      color: 'bg-green-100 text-green-700',
    },
    {
      name: 'SMS nhắc thanh toán',
      description: 'Gửi SMS nhắc thanh toán trước kỳ hạn 3 ngày',
      trigger: 'time_based',
      icon: MessageSquare,
      color: 'bg-purple-100 text-purple-700',
    },
    {
      name: 'Thông báo lead nóng',
      description: 'Thông báo manager khi có lead chuyển trạng thái nóng',
      trigger: 'lead_status_changed',
      icon: Bell,
      color: 'bg-yellow-100 text-yellow-700',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50" data-testid="automation-page">
      <Header
        title="Marketing Automation"
        onAddNew={() => setShowAddModal(true)}
        addNewLabel="Tạo quy tắc"
      />

      <div className="p-6 max-w-[1600px] mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white border border-slate-200">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#316585]/10 flex items-center justify-center">
                <Zap className="w-6 h-6 text-[#316585]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{rules.filter(r => r.is_active).length}</p>
                <p className="text-sm text-slate-500">Quy tắc đang bật</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border border-slate-200">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{rules.reduce((sum, r) => sum + (r.trigger_count || 0), 0)}</p>
                <p className="text-sm text-slate-500">Lần thực thi</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border border-slate-200">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{logs.filter(l => l.actions_executed?.some(a => a.action === 'reassign_lead')).length}</p>
                <p className="text-sm text-slate-500">Lead đã đảo</p>
              </div>
            </CardContent>
          </Card>
          <Card 
            className="bg-white border border-slate-200 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setShowLogsModal(true)}
          >
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{logs.length}</p>
                <p className="text-sm text-slate-500">Xem logs →</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Templates */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Mẫu Automation phổ biến</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template, index) => (
              <Card
                key={index}
                className="bg-white border border-slate-200 hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => {
                  setNewRule({
                    ...newRule,
                    name: template.name,
                    trigger: template.trigger,
                  });
                  setShowAddModal(true);
                }}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${template.color}`}>
                      <template.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-slate-900 group-hover:text-[#316585] transition-colors">
                        {template.name}
                      </h3>
                      <p className="text-sm text-slate-500 mt-1">{template.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Active Rules */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-4">Quy tắc đang hoạt động</h2>
          {rules.length === 0 ? (
            <Card className="bg-white border border-slate-200">
              <CardContent className="p-12 text-center">
                <Zap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="font-medium text-slate-900 mb-2">Chưa có quy tắc automation</h3>
                <p className="text-sm text-slate-500 mb-4">Tạo quy tắc để tự động hóa quy trình làm việc</p>
                <Button
                  onClick={() => setShowAddModal(true)}
                  className="bg-[#316585] hover:bg-[#264f68]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tạo quy tắc đầu tiên
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {rules.map((rule) => (
                <Card key={rule.id} className="bg-white border border-slate-200">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${rule.is_active ? 'bg-[#316585]/10' : 'bg-slate-100'}`}>
                          <Zap className={`w-5 h-5 ${rule.is_active ? 'text-[#316585]' : 'text-slate-400'}`} />
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-900">{rule.name}</h3>
                          <p className="text-sm text-slate-500">
                            {triggerTypes.find(t => t.value === rule.trigger)?.label || rule.trigger}
                          </p>
                          {rule.description && (
                            <p className="text-xs text-slate-400 mt-1">{rule.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {rule.trigger_count > 0 && (
                          <span className="text-xs text-slate-500">
                            Đã chạy {rule.trigger_count} lần
                          </span>
                        )}
                        <Switch
                          checked={rule.is_active}
                          onCheckedChange={() => handleToggleRule(rule.id)}
                        />
                        <Badge variant={rule.is_active ? "default" : "outline"} className={rule.is_active ? "bg-green-500" : ""}>
                          {rule.is_active ? 'Bật' : 'Tắt'}
                        </Badge>
                      </div>
                    </div>
                    {/* Show actions */}
                    <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                      {rule.actions?.map((action, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {actionTypes.find(a => a.value === action.type)?.label || action.type}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Rule Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tạo quy tắc Automation</DialogTitle>
            <DialogDescription>Thiết lập quy tắc tự động hóa cho hệ thống</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tên quy tắc</Label>
              <Input
                value={newRule.name}
                onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                placeholder="VD: Chia lead tự động"
                data-testid="rule-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label>Điều kiện kích hoạt</Label>
              <Select
                value={newRule.trigger}
                onValueChange={(value) => setNewRule({ ...newRule, trigger: value })}
              >
                <SelectTrigger data-testid="rule-trigger-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {triggerTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Kích hoạt ngay</Label>
              <Switch
                checked={newRule.is_active}
                onCheckedChange={(checked) => setNewRule({ ...newRule, is_active: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleCreateRule}
              className="bg-[#316585] hover:bg-[#264f68]"
              data-testid="create-rule-btn"
            >
              Tạo quy tắc
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logs Modal */}
      <Dialog open={showLogsModal} onOpenChange={setShowLogsModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Automation Logs</DialogTitle>
            <DialogDescription>Lịch sử thực thi các quy tắc automation</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {logs.length === 0 ? (
              <p className="text-center text-slate-500 py-8">Chưa có log nào</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-slate-900">{log.rule_name}</h4>
                      <p className="text-sm text-slate-500">Lead: {log.lead_name || 'N/A'}</p>
                    </div>
                    <Badge variant={log.status === 'success' ? 'default' : 'outline'} className={log.status === 'success' ? 'bg-green-500' : ''}>
                      {log.status}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    {log.actions_executed?.map((action, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <span className={`w-2 h-2 rounded-full ${action.success ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-slate-600">{action.action}:</span>
                        <span className="text-slate-500">{action.message}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    {new Date(log.created_at).toLocaleString('vi-VN')}
                  </p>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
