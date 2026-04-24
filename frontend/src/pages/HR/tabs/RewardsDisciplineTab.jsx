/**
 * Rewards & Discipline Tab - Khen thưởng / Kỷ luật
 */

import React, { useState } from 'react';
import { Trophy, AlertTriangle, Plus, X, Save, Calendar, Star } from 'lucide-react';
import { hrApi } from '../../../api/hrApi';
import { toast } from 'sonner';

const RECORD_TYPES = [
  { value: 'reward', label: 'Khen thưởng', icon: Trophy, color: 'emerald' },
  { value: 'discipline', label: 'Kỷ luật', icon: AlertTriangle, color: 'red' },
  { value: 'warning', label: 'Cảnh cáo', icon: AlertTriangle, color: 'amber' },
  { value: 'commendation', label: 'Biểu dương', icon: Star, color: 'cyan' },
];

const REWARD_LEVELS = [
  { value: 'company', label: 'Cấp công ty' },
  { value: 'department', label: 'Cấp phòng ban' },
  { value: 'team', label: 'Cấp team' },
];

const DISCIPLINE_LEVELS = [
  { value: 'verbal', label: 'Nhắc nhở miệng' },
  { value: 'written', label: 'Cảnh cáo văn bản' },
  { value: 'final', label: 'Cảnh cáo cuối' },
  { value: 'suspension', label: 'Đình chỉ' },
  { value: 'termination', label: 'Sa thải' },
];

export default function RewardsDisciplineTab({ profileId, records, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [activeType, setActiveType] = useState('all'); // all | reward | discipline
  
  const [formData, setFormData] = useState({
    type: 'reward',
    title: '',
    reason: '',
    level: '',
    effective_date: '',
    monetary_value: '',
    decision_number: '',
    decision_date: '',
    decided_by: '',
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      type: 'reward', title: '', reason: '', level: '',
      effective_date: '', monetary_value: '', decision_number: '',
      decision_date: '', decided_by: '', notes: '',
    });
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.reason) {
      toast.error('Vui lòng nhập tiêu đề và lý do');
      return;
    }
    try {
      await hrApi.addRewardDiscipline(profileId, {
        ...formData,
        monetary_value: formData.monetary_value ? Number(formData.monetary_value) : null,
      });
      toast.success('Thêm thành công');
      resetForm();
      onRefresh();
    } catch (error) {
      toast.error('Thao tác thất bại');
    }
  };

  // Filter records
  const filteredRecords = records?.filter(r => {
    if (activeType === 'all') return true;
    if (activeType === 'reward') return r.type === 'reward' || r.type === 'commendation';
    if (activeType === 'discipline') return r.type === 'discipline' || r.type === 'warning';
    return true;
  }) || [];

  // Count by type
  const rewardCount = records?.filter(r => r.type === 'reward' || r.type === 'commendation').length || 0;
  const disciplineCount = records?.filter(r => r.type === 'discipline' || r.type === 'warning').length || 0;

  const getTypeStyle = (type) => {
    const rt = RECORD_TYPES.find(t => t.value === type);
    if (!rt) return { icon: Trophy, color: 'gray' };
    return rt;
  };

  return (
    <div data-testid="rewards-discipline-tab">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Trophy size={20} className="text-cyan-400" />
          Khen thưởng / Kỷ luật
        </h3>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-black font-medium rounded-lg transition-colors"
        >
          <Plus size={16} />
          Thêm mới
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => setActiveType('all')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeType === 'all' ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          Tất cả ({records?.length || 0})
        </button>
        <button
          onClick={() => setActiveType('reward')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeType === 'reward' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          <Trophy size={18} />
          Khen thưởng ({rewardCount})
        </button>
        <button
          onClick={() => setActiveType('discipline')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeType === 'discipline' ? 'bg-red-500/20 text-red-400' : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          <AlertTriangle size={18} />
          Kỷ luật ({disciplineCount})
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-gray-800/50 rounded-xl p-6 mb-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-white font-medium">Thêm khen thưởng / kỷ luật</h4>
            <button onClick={resetForm} className="text-gray-400 hover:text-white">
              <X size={20} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Loại *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value, level: '' })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              >
                {RECORD_TYPES.map(rt => (
                  <option key={rt.value} value={rt.value}>{rt.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">Tiêu đề *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                placeholder="Nhân viên xuất sắc tháng"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">Cấp độ</label>
              <select
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              >
                <option value="">-- Chọn --</option>
                {(formData.type === 'reward' || formData.type === 'commendation' ? REWARD_LEVELS : DISCIPLINE_LEVELS).map(l => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">Ngày hiệu lực</label>
              <input
                type="date"
                value={formData.effective_date}
                onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              />
            </div>
            
            {(formData.type === 'reward' || formData.type === 'commendation') && (
              <div>
                <label className="block text-sm text-gray-400 mb-2">Giá trị thưởng (VND)</label>
                <input
                  type="number"
                  value={formData.monetary_value}
                  onChange={(e) => setFormData({ ...formData, monetary_value: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  placeholder="1000000"
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">Số quyết định</label>
              <input
                type="text"
                value={formData.decision_number}
                onChange={(e) => setFormData({ ...formData, decision_number: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                placeholder="QĐ-2024-001"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">Ngày quyết định</label>
              <input
                type="date"
                value={formData.decision_date}
                onChange={(e) => setFormData({ ...formData, decision_date: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">Người quyết định</label>
              <input
                type="text"
                value={formData.decided_by}
                onChange={(e) => setFormData({ ...formData, decided_by: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                placeholder="Giám đốc"
              />
            </div>
            
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm text-gray-400 mb-2">Lý do *</label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                rows={2}
                placeholder="Mô tả lý do khen thưởng / kỷ luật"
              />
            </div>
            
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm text-gray-400 mb-2">Ghi chú</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                rows={2}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={resetForm} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg">Hủy</button>
            <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-black font-medium rounded-lg">
              <Save size={16} />
              Thêm
            </button>
          </div>
        </div>
      )}

      {/* Records List */}
      {filteredRecords.length > 0 ? (
        <div className="space-y-4">
          {filteredRecords.map((record) => {
            const typeStyle = getTypeStyle(record.type);
            const Icon = typeStyle.icon;
            
            return (
              <div
                key={record.id}
                className={`bg-gray-800/30 border rounded-xl p-4 hover:border-gray-700 transition-colors ${
                  typeStyle.color === 'emerald' ? 'border-emerald-500/30' :
                  typeStyle.color === 'red' ? 'border-red-500/30' :
                  typeStyle.color === 'amber' ? 'border-amber-500/30' :
                  typeStyle.color === 'cyan' ? 'border-cyan-500/30' :
                  'border-gray-800'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${
                    typeStyle.color === 'emerald' ? 'bg-emerald-500/20' :
                    typeStyle.color === 'red' ? 'bg-red-500/20' :
                    typeStyle.color === 'amber' ? 'bg-amber-500/20' :
                    typeStyle.color === 'cyan' ? 'bg-cyan-500/20' :
                    'bg-gray-500/20'
                  }`}>
                    <Icon className={`${
                      typeStyle.color === 'emerald' ? 'text-emerald-400' :
                      typeStyle.color === 'red' ? 'text-red-400' :
                      typeStyle.color === 'amber' ? 'text-amber-400' :
                      typeStyle.color === 'cyan' ? 'text-cyan-400' :
                      'text-gray-400'
                    }`} size={20} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{record.title}</span>
                      <span className={`px-2 py-0.5 rounded-lg text-xs ${
                        typeStyle.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-400' :
                        typeStyle.color === 'red' ? 'bg-red-500/20 text-red-400' :
                        typeStyle.color === 'amber' ? 'bg-amber-500/20 text-amber-400' :
                        typeStyle.color === 'cyan' ? 'bg-cyan-500/20 text-cyan-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {RECORD_TYPES.find(t => t.value === record.type)?.label}
                      </span>
                      {record.level && (
                        <span className="px-2 py-0.5 bg-gray-700 text-gray-400 rounded-lg text-xs">
                          {(record.type === 'reward' || record.type === 'commendation'
                            ? REWARD_LEVELS : DISCIPLINE_LEVELS
                          ).find(l => l.value === record.level)?.label || record.level}
                        </span>
                      )}
                    </div>
                    
                    <div className="text-gray-400 text-sm mt-1">{record.reason}</div>
                    
                    <div className="flex items-center gap-4 mt-2 text-gray-500 text-sm">
                      {record.effective_date && (
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {new Date(record.effective_date).toLocaleDateString('vi-VN')}
                        </span>
                      )}
                      {record.monetary_value > 0 && (
                        <span className="text-emerald-400">
                          +{(record.monetary_value / 1000000).toFixed(1)}M VND
                        </span>
                      )}
                      {record.decision_number && (
                        <span>QĐ: {record.decision_number}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Trophy className="mx-auto mb-4 text-gray-600" size={48} />
          <p className="text-gray-400">Chưa có dữ liệu khen thưởng / kỷ luật</p>
        </div>
      )}
    </div>
  );
}
