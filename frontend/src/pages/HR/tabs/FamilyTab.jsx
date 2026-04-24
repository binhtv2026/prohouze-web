/**
 * Family Tab - Nhân thân / Liên hệ khẩn cấp
 */

import React, { useState } from 'react';
import { Users, Plus, Edit, Trash2, Phone, Mail, AlertCircle, X, Save } from 'lucide-react';
import { hrApi } from '../../../api/hrApi';
import { toast } from 'sonner';

const RELATIONSHIP_OPTIONS = [
  { value: 'spouse', label: 'Vợ/Chồng' },
  { value: 'father', label: 'Cha' },
  { value: 'mother', label: 'Mẹ' },
  { value: 'child', label: 'Con' },
  { value: 'sibling', label: 'Anh/Chị/Em' },
  { value: 'grandparent', label: 'Ông/Bà' },
  { value: 'other', label: 'Khác' },
];

export default function FamilyTab({ profileId, family, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    relationship: '',
    year_of_birth: '',
    occupation: '',
    phone: '',
    email: '',
    address: '',
    is_emergency_contact: false,
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      full_name: '',
      relationship: '',
      year_of_birth: '',
      occupation: '',
      phone: '',
      email: '',
      address: '',
      is_emergency_contact: false,
      notes: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (member) => {
    setFormData({
      full_name: member.full_name || '',
      relationship: member.relationship || '',
      year_of_birth: member.year_of_birth || '',
      occupation: member.occupation || '',
      phone: member.phone || '',
      email: member.email || '',
      address: member.address || '',
      is_emergency_contact: member.is_emergency_contact || false,
      notes: member.notes || '',
    });
    setEditingId(member.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.full_name || !formData.relationship) {
      toast.error('Vui lòng nhập họ tên và quan hệ');
      return;
    }

    try {
      if (editingId) {
        await hrApi.updateFamilyMember(editingId, formData);
        toast.success('Cập nhật thành công');
      } else {
        await hrApi.addFamilyMember(profileId, formData);
        toast.success('Thêm thành công');
      }
      resetForm();
      onRefresh();
    } catch (error) {
      toast.error(editingId ? 'Cập nhật thất bại' : 'Thêm thất bại');
    }
  };

  const handleDelete = async (memberId) => {
    if (!window.confirm('Bạn có chắc muốn xóa người thân này?')) return;
    
    try {
      await hrApi.deleteFamilyMember(memberId);
      toast.success('Đã xóa');
      onRefresh();
    } catch (error) {
      toast.error('Xóa thất bại');
    }
  };

  return (
    <div data-testid="family-tab">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Users size={20} className="text-cyan-400" />
          Nhân thân / Liên hệ khẩn cấp
        </h3>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-black font-medium rounded-lg transition-colors"
          data-testid="add-family-btn"
        >
          <Plus size={16} />
          Thêm người thân
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-gray-800/50 rounded-xl p-6 mb-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-white font-medium">{editingId ? 'Sửa thông tin' : 'Thêm người thân'}</h4>
            <button onClick={resetForm} className="text-gray-400 hover:text-white">
              <X size={20} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Họ và tên *</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                placeholder="Nguyễn Văn A"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">Quan hệ *</label>
              <select
                value={formData.relationship}
                onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              >
                <option value="">-- Chọn --</option>
                {RELATIONSHIP_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">Năm sinh</label>
              <input
                type="number"
                value={formData.year_of_birth}
                onChange={(e) => setFormData({ ...formData, year_of_birth: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                placeholder="1980"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">Nghề nghiệp</label>
              <input
                type="text"
                value={formData.occupation}
                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                placeholder="Giáo viên"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">Số điện thoại</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                placeholder="0912345678"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                placeholder="email@example.com"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-400 mb-2">Địa chỉ</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                placeholder="123 Đường ABC, Quận XYZ"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_emergency"
                checked={formData.is_emergency_contact}
                onChange={(e) => setFormData({ ...formData, is_emergency_contact: e.target.checked })}
                className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-cyan-500"
              />
              <label htmlFor="is_emergency" className="text-sm text-gray-400">
                Liên hệ khẩn cấp
              </label>
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm text-gray-400 mb-2">Ghi chú</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              rows={2}
              placeholder="Ghi chú thêm..."
            />
          </div>
          
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={resetForm}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-black font-medium rounded-lg transition-colors"
            >
              <Save size={16} />
              {editingId ? 'Cập nhật' : 'Thêm'}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {family && family.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {family.map((member) => (
            <div
              key={member.id}
              className="bg-gray-800/30 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-medium">
                    {member.full_name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{member.full_name}</span>
                      {member.is_emergency_contact && (
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-lg flex items-center gap-1">
                          <AlertCircle size={12} />
                          Khẩn cấp
                        </span>
                      )}
                    </div>
                    <div className="text-cyan-400 text-sm">
                      {RELATIONSHIP_OPTIONS.find(r => r.value === member.relationship)?.label || member.relationship}
                    </div>
                    {member.occupation && (
                      <div className="text-gray-400 text-sm">{member.occupation}</div>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      {member.phone && (
                        <a href={`tel:${member.phone}`} className="flex items-center gap-1 text-gray-400 hover:text-white text-sm">
                          <Phone size={14} />
                          {member.phone}
                        </a>
                      )}
                      {member.email && (
                        <a href={`mailto:${member.email}`} className="flex items-center gap-1 text-gray-400 hover:text-white text-sm">
                          <Mail size={14} />
                          {member.email}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(member)}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    title="Sửa"
                  >
                    <Edit size={16} className="text-gray-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(member.id)}
                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                    title="Xóa"
                  >
                    <Trash2 size={16} className="text-gray-400 hover:text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Users className="mx-auto mb-4 text-gray-600" size={48} />
          <p className="text-gray-400">Chưa có thông tin nhân thân</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 text-cyan-400 hover:text-cyan-300"
          >
            + Thêm người thân
          </button>
        </div>
      )}
    </div>
  );
}
