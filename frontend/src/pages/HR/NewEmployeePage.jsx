/**
 * New Employee Page - Thêm nhân sự mới
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Save, User, Phone, Mail, Calendar, CreditCard } from 'lucide-react';
import { hrApi } from '../../api/hrApi';
import { toast } from 'sonner';

const GENDER_OPTIONS = [
  { value: 'male', label: 'Nam' },
  { value: 'female', label: 'Nữ' },
  { value: 'other', label: 'Khác' },
];

const STATUS_OPTIONS = [
  { value: 'probation', label: 'Thử việc' },
  { value: 'official', label: 'Chính thức' },
  { value: 'collaborator', label: 'CTV' },
  { value: 'intern', label: 'Thực tập' },
];

export default function NewEmployeePage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    date_of_birth: '',
    gender: 'male',
    id_number: '',
    phone: '',
    email_personal: '',
    permanent_address: '',
    current_address: '',
    employment_status: 'probation',
    join_date: new Date().toISOString().split('T')[0],
    current_position: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.full_name) {
      toast.error('Vui lòng nhập họ tên');
      return;
    }

    try {
      setSaving(true);
      const result = await hrApi.createProfile(formData);
      if (result.success) {
        toast.success('Tạo hồ sơ thành công');
        navigate(`/hr/employees/${result.data.id}`);
      }
    } catch (error) {
      toast.error('Tạo hồ sơ thất bại: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-6" data-testid="new-employee-page">
      {/* Header */}
      <div className="mb-6">
        <Link to="/hr/employees" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors">
          <ChevronLeft size={20} />
          Quay lại danh sách
        </Link>
        <h1 className="text-2xl font-bold text-white">Thêm nhân sự mới</h1>
        <p className="text-gray-400 mt-1">Tạo hồ sơ nhân viên mới trong hệ thống</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-4xl">
        <div className="bg-[#12121a] border border-gray-800 rounded-xl p-6 space-y-8">
          {/* Basic Info */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <User size={20} className="text-cyan-400" />
              Thông tin cơ bản
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Họ và tên *</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  placeholder="Nguyễn Văn A"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">Ngày sinh</label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">Giới tính</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                >
                  {GENDER_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">CCCD/CMND</label>
                <input
                  type="text"
                  name="id_number"
                  value={formData.id_number}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  placeholder="012345678901"
                />
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Phone size={20} className="text-cyan-400" />
              Liên hệ
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Số điện thoại</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  placeholder="0912345678"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">Email cá nhân</label>
                <input
                  type="email"
                  name="email_personal"
                  value={formData.email_personal}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  placeholder="email@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">Địa chỉ thường trú</label>
                <input
                  type="text"
                  name="permanent_address"
                  value={formData.permanent_address}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  placeholder="123 Đường ABC, Quận XYZ"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">Địa chỉ tạm trú</label>
                <input
                  type="text"
                  name="current_address"
                  value={formData.current_address}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  placeholder="456 Đường DEF, Quận UVW"
                />
              </div>
            </div>
          </div>

          {/* Employment Info */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <CreditCard size={20} className="text-cyan-400" />
              Thông tin công việc
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Trạng thái</label>
                <select
                  name="employment_status"
                  value={formData.employment_status}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                >
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">Ngày vào làm</label>
                <input
                  type="date"
                  name="join_date"
                  value={formData.join_date}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">Vị trí</label>
                <input
                  type="text"
                  name="current_position"
                  value={formData.current_position}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  placeholder="Nhân viên kinh doanh"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-800">
            <Link
              to="/hr/employees"
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Hủy
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-black font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Tạo hồ sơ
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
