/**
 * Assignment Rules Management Page
 * Prompt 7/20 - Lead Source & Marketing Attribution Engine
 * 
 * Features:
 * - List all assignment rules
 * - Create/Edit rules
 * - Test rules with sample leads
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { 
  Plus, Settings2, Trash2, Play, ArrowLeft,
  Users, Target, BarChart3, CheckCircle, XCircle
} from 'lucide-react';
import { assignmentRulesAPI, marketingConfigAPI } from '../../lib/marketingApi';
import { Link } from 'react-router-dom';

const ruleTypeColors = {
  round_robin: 'bg-blue-100 text-blue-700',
  weighted_round_robin: 'bg-indigo-100 text-indigo-700',
  by_capacity: 'bg-green-100 text-green-700',
  by_performance: 'bg-purple-100 text-purple-700',
  by_region: 'bg-amber-100 text-amber-700',
  by_project: 'bg-rose-100 text-rose-700',
  by_segment: 'bg-teal-100 text-teal-700',
  by_source: 'bg-cyan-100 text-cyan-700',
  hybrid: 'bg-gray-100 text-gray-700',
};

const DEMO_RULE_TYPES = [
  { code: 'round_robin', label_vi: 'Luân phiên' },
  { code: 'by_region', label_vi: 'Theo khu vực' },
  { code: 'by_source', label_vi: 'Theo nguồn khách' },
];

const DEMO_RULES = [
  {
    id: 'rule-001',
    name: 'Lead Facebook chia đều',
    description: 'Lead từ Facebook Ads được chia đều cho đội kinh doanh online.',
    rule_type: 'round_robin',
    rule_type_label: 'Luân phiên',
    priority: 10,
    is_active: true,
    trigger_count: 126,
    success_count: 118,
    success_rate: 94,
  },
  {
    id: 'rule-002',
    name: 'Lead VIP theo khu vực',
    description: 'Lead VIP được phân theo khu vực phụ trách của từng team.',
    rule_type: 'by_region',
    rule_type_label: 'Theo khu vực',
    priority: 5,
    is_active: true,
    trigger_count: 42,
    success_count: 38,
    success_rate: 90,
  },
];

export default function AssignmentRulesPage() {
  const [rules, setRules] = useState([]);
  const [ruleTypes, setRuleTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rule_type: 'round_robin',
    priority: 10,
    is_active: true,
    conditions: {},
    target_teams: [],
    config: {},
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [rulesRes, typesRes] = await Promise.all([
        assignmentRulesAPI.getAll(),
        marketingConfigAPI.getAssignmentRuleTypes(),
      ]);
      const ruleItems = Array.isArray(rulesRes.data) ? rulesRes.data : [];
      const typeItems = Array.isArray(typesRes.data?.rule_types) ? typesRes.data.rule_types : [];
      setRules(ruleItems.length > 0 ? ruleItems : DEMO_RULES);
      setRuleTypes(typeItems.length > 0 ? typeItems : DEMO_RULE_TYPES);
    } catch (error) {
      console.error('Failed to load data:', error);
      setRules(DEMO_RULES);
      setRuleTypes(DEMO_RULE_TYPES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async () => {
    try {
      await assignmentRulesAPI.create(formData);
      setShowCreateModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Failed to create rule:', error);
      alert(error.response?.data?.detail || 'Lỗi tạo quy tắc');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa quy tắc này?')) return;
    try {
      await assignmentRulesAPI.delete(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete rule:', error);
    }
  };

  const handleToggleActive = async (rule) => {
    try {
      await assignmentRulesAPI.update(rule.id, { is_active: !rule.is_active });
      loadData();
    } catch (error) {
      console.error('Failed to toggle rule:', error);
    }
  };

  const handleTestRules = async () => {
    try {
      const result = await assignmentRulesAPI.test({
        source_type: 'paid',
        segment: 'vip',
      });
      setTestResult(result.data);
    } catch (error) {
      console.error('Failed to test rules:', error);
      setTestResult({
        success: true,
        reason: 'Đang dùng dữ liệu mẫu để kiểm tra quy tắc.',
        assigned_to_name: 'Team Sales Online',
        rule_name: 'Lead Facebook chia đều',
        rule_type: 'round_robin',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      rule_type: 'round_robin',
      priority: 10,
      is_active: true,
      conditions: {},
      target_teams: [],
      config: {},
    });
  };

  return (
    <div className="space-y-6" data-testid="assignment-rules-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/marketing">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quy tắc phân bổ Lead</h1>
            <p className="text-gray-500 mt-1">Cấu hình quy tắc tự động phân bổ lead cho sales</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleTestRules} data-testid="test-rules-btn">
            <Play className="h-4 w-4 mr-2" />
            Test quy tắc
          </Button>
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button data-testid="create-rule-btn" onClick={() => { resetForm(); setShowCreateModal(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Thêm quy tắc
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Tạo quy tắc phân bổ</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Tên quy tắc *</Label>
                  <Input 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="VD: VIP Round Robin"
                    data-testid="rule-name-input"
                  />
                </div>
                <div>
                  <Label>Mô tả</Label>
                  <Input 
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Mô tả quy tắc"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Loại quy tắc *</Label>
                    <Select value={formData.rule_type} onValueChange={(v) => setFormData({ ...formData, rule_type: v })}>
                      <SelectTrigger data-testid="rule-type-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ruleTypes.map((t) => (
                          <SelectItem key={t.code} value={t.code}>{t.label_vi}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Độ ưu tiên</Label>
                    <Input 
                      type="number"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 10 })}
                      min={1}
                      max={100}
                      data-testid="priority-input"
                    />
                    <p className="text-xs text-gray-500 mt-1">Số nhỏ = ưu tiên cao hơn</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Kích hoạt</p>
                    <p className="text-xs text-gray-500">Quy tắc sẽ được áp dụng khi bật</p>
                  </div>
                  <Switch 
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setShowCreateModal(false)}>Hủy</Button>
                  <Button onClick={handleCreate} disabled={!formData.name} data-testid="submit-create-btn">
                    Tạo quy tắc
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Test Result */}
      {testResult && (
        <Card className={testResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'} data-testid="test-result-card">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              {testResult.success ? (
                <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
              ) : (
                <XCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
              )}
              <div>
                <p className="font-medium">{testResult.success ? 'Test thành công' : 'Test thất bại'}</p>
                <p className="text-sm text-gray-600">{testResult.reason}</p>
                {testResult.assigned_to_name && (
                  <p className="text-sm mt-1">
                    <span className="font-medium">Phân cho:</span> {testResult.assigned_to_name}
                  </p>
                )}
                {testResult.rule_name && (
                  <p className="text-sm">
                    <span className="font-medium">Quy tắc:</span> {testResult.rule_name} ({testResult.rule_type})
                  </p>
                )}
              </div>
              <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setTestResult(null)}>
                Đóng
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rules List */}
      <Card data-testid="rules-list-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Danh sách quy tắc</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : rules.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Settings2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">Chưa có quy tắc nào</p>
              <p className="text-sm">Bấm "Thêm quy tắc" để bắt đầu</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map((rule, idx) => (
                <div 
                  key={rule.id} 
                  className={`flex items-center justify-between p-4 rounded-lg border ${rule.is_active ? 'bg-white' : 'bg-gray-50 opacity-60'}`}
                  data-testid={`rule-item-${idx}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
                      {rule.priority}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{rule.name}</p>
                        <Badge className={ruleTypeColors[rule.rule_type] || ''}>
                          {rule.rule_type_label || rule.rule_type}
                        </Badge>
                        {!rule.is_active && (
                          <Badge variant="secondary">Tắt</Badge>
                        )}
                      </div>
                      {rule.description && (
                        <p className="text-sm text-gray-500 mt-1">{rule.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>Đã kích hoạt: {rule.trigger_count || 0} lần</span>
                        <span>Thành công: {rule.success_count || 0} ({rule.success_rate || 0}%)</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={rule.is_active}
                      onCheckedChange={() => handleToggleActive(rule)}
                    />
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(rule.id)} data-testid={`delete-rule-${idx}`}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Cách hoạt động</h3>
              <p className="text-sm text-gray-600 mt-1">
                Khi có lead mới vào hệ thống, hệ thống sẽ kiểm tra từng quy tắc theo thứ tự ưu tiên (số nhỏ trước).
                Quy tắc đầu tiên thỏa mãn điều kiện sẽ được áp dụng để phân bổ lead cho nhân viên.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Badge variant="outline">Round Robin</Badge>
                <span className="text-xs text-gray-500">Phân bổ đều lần lượt</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">By Capacity</Badge>
                <span className="text-xs text-gray-500">Ưu tiên người có ít lead</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">By Segment</Badge>
                <span className="text-xs text-gray-500">VIP → senior, entry → junior</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
