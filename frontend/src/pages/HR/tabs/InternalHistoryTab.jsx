/**
 * Internal History Tab - Công tác nội bộ tại ProHouze
 */

import React, { useState } from 'react';
import { Building, Plus, Calendar, ChevronRight, FileText, X, Save, User } from 'lucide-react';
import { hrApi } from '../../../api/hrApi';
import { toast } from 'sonner';

const CONTRACT_TYPES = [
  { value: 'probation', label: 'Hợp đồng thử việc' },
  { value: 'fixed_term', label: 'Hợp đồng có thời hạn' },
  { value: 'indefinite', label: 'Hợp đồng không thời hạn' },
  { value: 'collaborator', label: 'Hợp đồng CTV' },
  { value: 'freelance', label: 'Freelance' },
];

const CHANGE_TYPES = [
  { value: 'join', label: 'Nhận việc', color: 'emerald' },
  { value: 'transfer', label: 'Chuyển đổi', color: 'blue' },
  { value: 'promotion', label: 'Thăng chức', color: 'purple' },
  { value: 'demotion', label: 'Giáng chức', color: 'orange' },
  { value: 'resignation', label: 'Nghỉ việc', color: 'red' },
];

export default function InternalHistoryTab({ profileId, internalHistory, contracts, onRefresh }) {
  const [activeSection, setActiveSection] = useState('history'); // history | contracts
  const [showForm, setShowForm] = useState(false);
  
  const [historyForm, setHistoryForm] = useState({
    team_name: '',
    position: '',
    leader_name: '',
    start_date: '',
    change_type: 'transfer',
    change_reason: '',
    notes: '',
  });
  
  const [contractForm, setContractForm] = useState({
    contract_type: 'fixed_term',
    start_date: '',
    end_date: '',
    position: '',
    department: '',
    base_salary: '',
    notes: '',
  });

  const resetForm = () => {
    setHistoryForm({
      team_name: '', position: '', leader_name: '', start_date: '',
      change_type: 'transfer', change_reason: '', notes: '',
    });
    setContractForm({
      contract_type: 'fixed_term', start_date: '', end_date: '',
      position: '', department: '', base_salary: '', notes: '',
    });
    setShowForm(false);
  };

  const handleSaveHistory = async () => {
    if (!historyForm.position || !historyForm.start_date) {
      toast.error('Vui lòng nhập vị trí và ngày bắt đầu');
      return;
    }
    try {
      await hrApi.addInternalHistory(profileId, historyForm);
      toast.success('Thêm thành công');
      resetForm();
      onRefresh();
    } catch (error) {
      toast.error('Thao tác thất bại');
    }
  };

  const handleSaveContract = async () => {
    if (!contractForm.contract_type || !contractForm.start_date || !contractForm.position) {
      toast.error('Vui lòng nhập loại HĐ, ngày bắt đầu và vị trí');
      return;
    }
    try {
      await hrApi.addContract(profileId, contractForm);
      toast.success('Thêm thành công');
      resetForm();
      onRefresh();
    } catch (error) {
      toast.error('Thao tác thất bại');
    }
  };

  const getChangeTypeStyle = (type) => {
    const ct = CHANGE_TYPES.find(t => t.value === type);
    if (!ct) return { bg: 'bg-gray-500/20', text: 'text-gray-400' };
    return {
      bg: `bg-${ct.color}-500/20`,
      text: `text-${ct.color}-400`,
    };
  };

  return (
    <div data-testid="internal-history-tab">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Building size={20} className="text-cyan-400" />
          Công tác nội bộ tại ProHouze
        </h3>
      </div>

      {/* Section Tabs */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => { setActiveSection('history'); resetForm(); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeSection === 'history'
              ? 'bg-cyan-500/20 text-cyan-400'
              : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          <Building size={18} />
          Quá trình công tác ({internalHistory?.length || 0})
        </button>
        <button
          onClick={() => { setActiveSection('contracts'); resetForm(); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeSection === 'contracts'
              ? 'bg-cyan-500/20 text-cyan-400'
              : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          <FileText size={18} />
          Hợp đồng lao động ({contracts?.length || 0})
        </button>
        
        <div className="flex-1" />
        
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-black font-medium rounded-lg transition-colors"
        >
          <Plus size={16} />
          Thêm {activeSection === 'history' ? 'lịch sử' : 'hợp đồng'}
        </button>
      </div>

      {/* History Form */}
      {showForm && activeSection === 'history' && (
        <div className="bg-gray-800/50 rounded-xl p-6 mb-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-white font-medium">Thêm lịch sử công tác</h4>
            <button onClick={resetForm} className="text-gray-400 hover:text-white">
              <X size={20} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Vị trí *</label>
              <input
                type="text"
                value={historyForm.position}
                onChange={(e) => setHistoryForm({ ...historyForm, position: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                placeholder="Nhân viên kinh doanh"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Team/Phòng ban</label>
              <input
                type="text"
                value={historyForm.team_name}
                onChange={(e) => setHistoryForm({ ...historyForm, team_name: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                placeholder="Team A"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Quản lý trực tiếp</label>
              <input
                type="text"
                value={historyForm.leader_name}
                onChange={(e) => setHistoryForm({ ...historyForm, leader_name: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                placeholder="Nguyễn Văn A"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Ngày bắt đầu *</label>
              <input
                type="date"
                value={historyForm.start_date}
                onChange={(e) => setHistoryForm({ ...historyForm, start_date: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Loại thay đổi</label>
              <select
                value={historyForm.change_type}
                onChange={(e) => setHistoryForm({ ...historyForm, change_type: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              >
                {CHANGE_TYPES.map(ct => (
                  <option key={ct.value} value={ct.value}>{ct.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Lý do</label>
              <input
                type="text"
                value={historyForm.change_reason}
                onChange={(e) => setHistoryForm({ ...historyForm, change_reason: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={resetForm} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg">Hủy</button>
            <button onClick={handleSaveHistory} className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-black font-medium rounded-lg">
              <Save size={16} />
              Thêm
            </button>
          </div>
        </div>
      )}

      {/* Contract Form */}
      {showForm && activeSection === 'contracts' && (
        <div className="bg-gray-800/50 rounded-xl p-6 mb-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-white font-medium">Thêm hợp đồng lao động</h4>
            <button onClick={resetForm} className="text-gray-400 hover:text-white">
              <X size={20} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Loại hợp đồng *</label>
              <select
                value={contractForm.contract_type}
                onChange={(e) => setContractForm({ ...contractForm, contract_type: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              >
                {CONTRACT_TYPES.map(ct => (
                  <option key={ct.value} value={ct.value}>{ct.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Vị trí *</label>
              <input
                type="text"
                value={contractForm.position}
                onChange={(e) => setContractForm({ ...contractForm, position: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Phòng ban</label>
              <input
                type="text"
                value={contractForm.department}
                onChange={(e) => setContractForm({ ...contractForm, department: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Ngày bắt đầu *</label>
              <input
                type="date"
                value={contractForm.start_date}
                onChange={(e) => setContractForm({ ...contractForm, start_date: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Ngày kết thúc</label>
              <input
                type="date"
                value={contractForm.end_date}
                onChange={(e) => setContractForm({ ...contractForm, end_date: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Lương cơ bản</label>
              <input
                type="number"
                value={contractForm.base_salary}
                onChange={(e) => setContractForm({ ...contractForm, base_salary: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                placeholder="10000000"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={resetForm} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg">Hủy</button>
            <button onClick={handleSaveContract} className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-black font-medium rounded-lg">
              <Save size={16} />
              Thêm
            </button>
          </div>
        </div>
      )}

      {/* Internal History Timeline */}
      {activeSection === 'history' && (
        <div className="relative">
          {internalHistory && internalHistory.length > 0 ? (
            <div className="space-y-4">
              {/* Timeline line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-800"></div>
              
              {internalHistory.map((item, idx) => {
                const changeType = CHANGE_TYPES.find(t => t.value === item.change_type);
                
                return (
                  <div key={item.id} className="relative pl-14">
                    {/* Timeline dot */}
                    <div className={`absolute left-4 w-4 h-4 rounded-full border-2 ${
                      item.is_current ? 'bg-cyan-500 border-cyan-400' : 'bg-gray-800 border-gray-600'
                    }`}></div>
                    
                    <div className={`bg-gray-800/30 border rounded-xl p-4 ${item.is_current ? 'border-cyan-500/30' : 'border-gray-800'}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">{item.position}</span>
                            {item.is_current && (
                              <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs rounded-lg">Hiện tại</span>
                            )}
                            <span className={`px-2 py-0.5 rounded-lg text-xs ${
                              changeType?.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-400' :
                              changeType?.color === 'blue' ? 'bg-blue-500/20 text-blue-400' :
                              changeType?.color === 'purple' ? 'bg-purple-500/20 text-purple-400' :
                              changeType?.color === 'orange' ? 'bg-orange-500/20 text-orange-400' :
                              changeType?.color === 'red' ? 'bg-red-500/20 text-red-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {changeType?.label || item.change_type}
                            </span>
                          </div>
                          {item.team_name && <div className="text-cyan-400 text-sm">{item.team_name}</div>}
                          {item.leader_name && (
                            <div className="flex items-center gap-1 text-gray-400 text-sm mt-1">
                              <User size={14} />
                              Quản lý: {item.leader_name}
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-gray-500 text-sm mt-2">
                            <Calendar size={14} />
                            {item.start_date} - {item.is_current ? 'Hiện tại' : item.end_date}
                          </div>
                          {item.change_reason && (
                            <div className="text-gray-400 text-sm mt-2">Lý do: {item.change_reason}</div>
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
              <Building className="mx-auto mb-4 text-gray-600" size={48} />
              <p className="text-gray-400">Chưa có lịch sử công tác</p>
            </div>
          )}
        </div>
      )}

      {/* Contracts List */}
      {activeSection === 'contracts' && (
        <div className="space-y-4">
          {contracts && contracts.length > 0 ? (
            contracts.map((contract) => {
              const isExpired = contract.end_date && new Date(contract.end_date) < new Date();
              const isActive = contract.status === 'active';
              
              return (
                <div
                  key={contract.id}
                  className={`bg-gray-800/30 border rounded-xl p-4 ${
                    isActive ? 'border-emerald-500/30' : isExpired ? 'border-red-500/30' : 'border-gray-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <FileText className={isActive ? 'text-emerald-400' : 'text-gray-400'} size={20} />
                        <span className="text-white font-medium">{contract.contract_number}</span>
                        <span className={`px-2 py-0.5 rounded-lg text-xs ${
                          isActive ? 'bg-emerald-500/20 text-emerald-400' :
                          isExpired ? 'bg-red-500/20 text-red-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {isActive ? 'Đang hiệu lực' : isExpired ? 'Hết hạn' : contract.status}
                        </span>
                      </div>
                      <div className="text-cyan-400 text-sm mt-1">
                        {CONTRACT_TYPES.find(t => t.value === contract.contract_type)?.label || contract.contract_type}
                      </div>
                      <div className="text-gray-400 text-sm mt-1">
                        {contract.position} {contract.department ? `- ${contract.department}` : ''}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-gray-500 text-sm">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {contract.start_date} - {contract.end_date || 'Vô thời hạn'}
                        </span>
                        {contract.base_salary && (
                          <span>Lương: {(contract.base_salary / 1000000).toFixed(0)}M</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <FileText className="mx-auto mb-4 text-gray-600" size={48} />
              <p className="text-gray-400">Chưa có hợp đồng lao động</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
