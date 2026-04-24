/**
 * Timeline Tab - Học vấn & Quá trình công tác (trước khi vào ProHouze)
 */

import React, { useState } from 'react';
import { Clock, GraduationCap, Briefcase, Plus, Edit, Trash2, X, Save, Calendar } from 'lucide-react';
import { hrApi } from '../../../api/hrApi';
import { toast } from 'sonner';

const EDUCATION_LEVELS = [
  { value: 'high_school', label: 'Trung học phổ thông' },
  { value: 'vocational', label: 'Trung cấp' },
  { value: 'college', label: 'Cao đẳng' },
  { value: 'bachelor', label: 'Đại học' },
  { value: 'master', label: 'Thạc sĩ' },
  { value: 'doctorate', label: 'Tiến sĩ' },
  { value: 'other', label: 'Khác' },
];

export default function TimelineTab({ profileId, education, workHistory, onRefresh }) {
  const [activeSection, setActiveSection] = useState('education'); // education | work
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Education form
  const [eduForm, setEduForm] = useState({
    institution: '',
    degree: '',
    major: '',
    level: 'bachelor',
    start_date: '',
    end_date: '',
    is_current: false,
    gpa: '',
    ranking: '',
    notes: '',
  });
  
  // Work history form
  const [workForm, setWorkForm] = useState({
    company: '',
    position: '',
    department: '',
    start_date: '',
    end_date: '',
    is_current: false,
    responsibilities: '',
    achievements: '',
    reason_for_leaving: '',
    reference_name: '',
    reference_phone: '',
    notes: '',
  });

  const resetForm = () => {
    setEduForm({
      institution: '', degree: '', major: '', level: 'bachelor',
      start_date: '', end_date: '', is_current: false, gpa: '', ranking: '', notes: '',
    });
    setWorkForm({
      company: '', position: '', department: '', start_date: '', end_date: '',
      is_current: false, responsibilities: '', achievements: '', reason_for_leaving: '',
      reference_name: '', reference_phone: '', notes: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEditEducation = (item) => {
    setEduForm({
      institution: item.institution || '',
      degree: item.degree || '',
      major: item.major || '',
      level: item.level || 'bachelor',
      start_date: item.start_date || '',
      end_date: item.end_date || '',
      is_current: item.is_current || false,
      gpa: item.gpa || '',
      ranking: item.ranking || '',
      notes: item.notes || '',
    });
    setEditingId(item.id);
    setActiveSection('education');
    setShowForm(true);
  };

  const handleEditWork = (item) => {
    setWorkForm({
      company: item.company || '',
      position: item.position || '',
      department: item.department || '',
      start_date: item.start_date || '',
      end_date: item.end_date || '',
      is_current: item.is_current || false,
      responsibilities: item.responsibilities || '',
      achievements: item.achievements || '',
      reason_for_leaving: item.reason_for_leaving || '',
      reference_name: item.reference_name || '',
      reference_phone: item.reference_phone || '',
      notes: item.notes || '',
    });
    setEditingId(item.id);
    setActiveSection('work');
    setShowForm(true);
  };

  const handleSaveEducation = async () => {
    if (!eduForm.institution) {
      toast.error('Vui lòng nhập tên trường');
      return;
    }
    try {
      if (editingId) {
        await hrApi.updateEducation(editingId, eduForm);
        toast.success('Cập nhật thành công');
      } else {
        await hrApi.addEducation(profileId, eduForm);
        toast.success('Thêm thành công');
      }
      resetForm();
      onRefresh();
    } catch (error) {
      toast.error('Thao tác thất bại');
    }
  };

  const handleSaveWork = async () => {
    if (!workForm.company || !workForm.position) {
      toast.error('Vui lòng nhập công ty và vị trí');
      return;
    }
    try {
      if (editingId) {
        await hrApi.updateWorkHistory(editingId, workForm);
        toast.success('Cập nhật thành công');
      } else {
        await hrApi.addWorkHistory(profileId, workForm);
        toast.success('Thêm thành công');
      }
      resetForm();
      onRefresh();
    } catch (error) {
      toast.error('Thao tác thất bại');
    }
  };

  const handleDeleteEducation = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa?')) return;
    try {
      await hrApi.deleteEducation(id);
      toast.success('Đã xóa');
      onRefresh();
    } catch (error) {
      toast.error('Xóa thất bại');
    }
  };

  const handleDeleteWork = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa?')) return;
    try {
      await hrApi.deleteWorkHistory(id);
      toast.success('Đã xóa');
      onRefresh();
    } catch (error) {
      toast.error('Xóa thất bại');
    }
  };

  return (
    <div data-testid="timeline-tab">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Clock size={20} className="text-cyan-400" />
          Timeline
        </h3>
      </div>

      {/* Section Tabs */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => { setActiveSection('education'); resetForm(); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeSection === 'education'
              ? 'bg-cyan-500/20 text-cyan-400'
              : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          <GraduationCap size={18} />
          Học vấn ({education?.length || 0})
        </button>
        <button
          onClick={() => { setActiveSection('work'); resetForm(); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeSection === 'work'
              ? 'bg-cyan-500/20 text-cyan-400'
              : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          <Briefcase size={18} />
          Công tác ({workHistory?.length || 0})
        </button>
        
        <div className="flex-1" />
        
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-black font-medium rounded-lg transition-colors"
        >
          <Plus size={16} />
          Thêm {activeSection === 'education' ? 'học vấn' : 'công tác'}
        </button>
      </div>

      {/* Education Form */}
      {showForm && activeSection === 'education' && (
        <div className="bg-gray-800/50 rounded-xl p-6 mb-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-white font-medium">{editingId ? 'Sửa' : 'Thêm'} thông tin học vấn</h4>
            <button onClick={resetForm} className="text-gray-400 hover:text-white">
              <X size={20} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Tên trường *</label>
              <input
                type="text"
                value={eduForm.institution}
                onChange={(e) => setEduForm({ ...eduForm, institution: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                placeholder="Đại học ABC"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Bằng cấp</label>
              <input
                type="text"
                value={eduForm.degree}
                onChange={(e) => setEduForm({ ...eduForm, degree: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                placeholder="Cử nhân"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Ngành học</label>
              <input
                type="text"
                value={eduForm.major}
                onChange={(e) => setEduForm({ ...eduForm, major: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                placeholder="Quản trị kinh doanh"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Cấp độ</label>
              <select
                value={eduForm.level}
                onChange={(e) => setEduForm({ ...eduForm, level: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              >
                {EDUCATION_LEVELS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Từ</label>
              <input
                type="date"
                value={eduForm.start_date}
                onChange={(e) => setEduForm({ ...eduForm, start_date: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Đến</label>
              <input
                type="date"
                value={eduForm.end_date}
                onChange={(e) => setEduForm({ ...eduForm, end_date: e.target.value })}
                disabled={eduForm.is_current}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">GPA</label>
              <input
                type="number"
                step="0.1"
                value={eduForm.gpa}
                onChange={(e) => setEduForm({ ...eduForm, gpa: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                placeholder="3.5"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Xếp loại</label>
              <input
                type="text"
                value={eduForm.ranking}
                onChange={(e) => setEduForm({ ...eduForm, ranking: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                placeholder="Khá, Giỏi, Xuất sắc"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edu_current"
                checked={eduForm.is_current}
                onChange={(e) => setEduForm({ ...eduForm, is_current: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="edu_current" className="text-sm text-gray-400">Đang học</label>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={resetForm} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg">Hủy</button>
            <button onClick={handleSaveEducation} className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-black font-medium rounded-lg">
              <Save size={16} />
              {editingId ? 'Cập nhật' : 'Thêm'}
            </button>
          </div>
        </div>
      )}

      {/* Work Form */}
      {showForm && activeSection === 'work' && (
        <div className="bg-gray-800/50 rounded-xl p-6 mb-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-white font-medium">{editingId ? 'Sửa' : 'Thêm'} quá trình công tác</h4>
            <button onClick={resetForm} className="text-gray-400 hover:text-white">
              <X size={20} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Công ty *</label>
              <input
                type="text"
                value={workForm.company}
                onChange={(e) => setWorkForm({ ...workForm, company: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                placeholder="Công ty ABC"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Vị trí *</label>
              <input
                type="text"
                value={workForm.position}
                onChange={(e) => setWorkForm({ ...workForm, position: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                placeholder="Nhân viên kinh doanh"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Phòng ban</label>
              <input
                type="text"
                value={workForm.department}
                onChange={(e) => setWorkForm({ ...workForm, department: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                placeholder="Phòng kinh doanh"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Từ</label>
              <input
                type="date"
                value={workForm.start_date}
                onChange={(e) => setWorkForm({ ...workForm, start_date: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Đến</label>
              <input
                type="date"
                value={workForm.end_date}
                onChange={(e) => setWorkForm({ ...workForm, end_date: e.target.value })}
                disabled={workForm.is_current}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white disabled:opacity-50"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="work_current"
                checked={workForm.is_current}
                onChange={(e) => setWorkForm({ ...workForm, is_current: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="work_current" className="text-sm text-gray-400">Hiện tại</label>
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm text-gray-400 mb-2">Mô tả công việc</label>
              <textarea
                value={workForm.responsibilities}
                onChange={(e) => setWorkForm({ ...workForm, responsibilities: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                rows={2}
              />
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm text-gray-400 mb-2">Thành tích</label>
              <textarea
                value={workForm.achievements}
                onChange={(e) => setWorkForm({ ...workForm, achievements: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Lý do nghỉ</label>
              <input
                type="text"
                value={workForm.reason_for_leaving}
                onChange={(e) => setWorkForm({ ...workForm, reason_for_leaving: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Người tham chiếu</label>
              <input
                type="text"
                value={workForm.reference_name}
                onChange={(e) => setWorkForm({ ...workForm, reference_name: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">SĐT tham chiếu</label>
              <input
                type="text"
                value={workForm.reference_phone}
                onChange={(e) => setWorkForm({ ...workForm, reference_phone: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={resetForm} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg">Hủy</button>
            <button onClick={handleSaveWork} className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-black font-medium rounded-lg">
              <Save size={16} />
              {editingId ? 'Cập nhật' : 'Thêm'}
            </button>
          </div>
        </div>
      )}

      {/* Education List */}
      {activeSection === 'education' && (
        <div className="space-y-4">
          {education && education.length > 0 ? (
            education.map((item) => (
              <div key={item.id} className="bg-gray-800/30 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-cyan-500/20 rounded-lg">
                      <GraduationCap className="text-cyan-400" size={20} />
                    </div>
                    <div>
                      <div className="text-white font-medium">{item.institution}</div>
                      <div className="text-cyan-400 text-sm">{item.degree} - {item.major}</div>
                      <div className="flex items-center gap-4 mt-2 text-gray-400 text-sm">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {item.start_date} - {item.is_current ? 'Hiện tại' : item.end_date}
                        </span>
                        <span className="px-2 py-0.5 bg-gray-700 rounded text-xs">
                          {EDUCATION_LEVELS.find(l => l.value === item.level)?.label}
                        </span>
                        {item.gpa && <span>GPA: {item.gpa}</span>}
                        {item.ranking && <span>Xếp loại: {item.ranking}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleEditEducation(item)} className="p-2 hover:bg-gray-700 rounded-lg"><Edit size={16} className="text-gray-400" /></button>
                    <button onClick={() => handleDeleteEducation(item.id)} className="p-2 hover:bg-red-500/20 rounded-lg"><Trash2 size={16} className="text-gray-400 hover:text-red-400" /></button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <GraduationCap className="mx-auto mb-4 text-gray-600" size={48} />
              <p className="text-gray-400">Chưa có thông tin học vấn</p>
            </div>
          )}
        </div>
      )}

      {/* Work History List */}
      {activeSection === 'work' && (
        <div className="space-y-4">
          {workHistory && workHistory.length > 0 ? (
            workHistory.map((item) => (
              <div key={item.id} className="bg-gray-800/30 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-purple-500/20 rounded-lg">
                      <Briefcase className="text-purple-400" size={20} />
                    </div>
                    <div>
                      <div className="text-white font-medium">{item.position}</div>
                      <div className="text-purple-400 text-sm">{item.company}</div>
                      {item.department && <div className="text-gray-400 text-sm">{item.department}</div>}
                      <div className="flex items-center gap-4 mt-2 text-gray-400 text-sm">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {item.start_date} - {item.is_current ? 'Hiện tại' : item.end_date}
                        </span>
                      </div>
                      {item.responsibilities && (
                        <div className="mt-2 text-gray-400 text-sm">{item.responsibilities}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleEditWork(item)} className="p-2 hover:bg-gray-700 rounded-lg"><Edit size={16} className="text-gray-400" /></button>
                    <button onClick={() => handleDeleteWork(item.id)} className="p-2 hover:bg-red-500/20 rounded-lg"><Trash2 size={16} className="text-gray-400 hover:text-red-400" /></button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <Briefcase className="mx-auto mb-4 text-gray-600" size={48} />
              <p className="text-gray-400">Chưa có quá trình công tác</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
