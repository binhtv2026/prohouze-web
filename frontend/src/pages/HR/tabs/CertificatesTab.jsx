/**
 * Certificates Tab - Bằng cấp & Chứng chỉ
 */

import React, { useState } from 'react';
import { Award, Plus, Edit, Trash2, X, Save, CheckCircle, Calendar, ExternalLink } from 'lucide-react';
import { hrApi } from '../../../api/hrApi';
import { toast } from 'sonner';

export default function CertificatesTab({ profileId, certificates, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    issuer: '',
    issue_date: '',
    expiry_date: '',
    certificate_number: '',
    level: '',
    score: '',
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      name: '', issuer: '', issue_date: '', expiry_date: '',
      certificate_number: '', level: '', score: '', notes: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (cert) => {
    setFormData({
      name: cert.name || '',
      issuer: cert.issuer || '',
      issue_date: cert.issue_date || '',
      expiry_date: cert.expiry_date || '',
      certificate_number: cert.certificate_number || '',
      level: cert.level || '',
      score: cert.score || '',
      notes: cert.notes || '',
    });
    setEditingId(cert.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.issuer) {
      toast.error('Vui lòng nhập tên và đơn vị cấp');
      return;
    }
    try {
      if (editingId) {
        await hrApi.updateCertificate(editingId, formData);
        toast.success('Cập nhật thành công');
      } else {
        await hrApi.addCertificate(profileId, formData);
        toast.success('Thêm thành công');
      }
      resetForm();
      onRefresh();
    } catch (error) {
      toast.error('Thao tác thất bại');
    }
  };

  const handleVerify = async (certId) => {
    try {
      await hrApi.verifyCertificate(certId);
      toast.success('Đã xác minh');
      onRefresh();
    } catch (error) {
      toast.error('Xác minh thất bại');
    }
  };

  return (
    <div data-testid="certificates-tab">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Award size={20} className="text-cyan-400" />
          Bằng cấp & Chứng chỉ
        </h3>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-black font-medium rounded-lg transition-colors"
        >
          <Plus size={16} />
          Thêm bằng cấp
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-gray-800/50 rounded-xl p-6 mb-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-white font-medium">{editingId ? 'Sửa' : 'Thêm'} bằng cấp / chứng chỉ</h4>
            <button onClick={resetForm} className="text-gray-400 hover:text-white">
              <X size={20} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Tên bằng/chứng chỉ *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                placeholder="IELTS, Bằng Đại học..."
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Đơn vị cấp *</label>
              <input
                type="text"
                value={formData.issuer}
                onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                placeholder="British Council, Đại học ABC..."
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Số hiệu</label>
              <input
                type="text"
                value={formData.certificate_number}
                onChange={(e) => setFormData({ ...formData, certificate_number: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Ngày cấp</label>
              <input
                type="date"
                value={formData.issue_date}
                onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Ngày hết hạn</label>
              <input
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Cấp độ</label>
              <input
                type="text"
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                placeholder="B1, B2, C1..."
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Điểm</label>
              <input
                type="text"
                value={formData.score}
                onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                placeholder="7.0, 800..."
              />
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm text-gray-400 mb-2">Ghi chú</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              rows={2}
            />
          </div>
          
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={resetForm} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg">Hủy</button>
            <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-black font-medium rounded-lg">
              <Save size={16} />
              {editingId ? 'Cập nhật' : 'Thêm'}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {certificates && certificates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {certificates.map((cert) => {
            const isExpired = cert.expiry_date && new Date(cert.expiry_date) < new Date();
            
            return (
              <div
                key={cert.id}
                className={`bg-gray-800/30 border rounded-xl p-4 hover:border-gray-700 transition-colors ${
                  isExpired ? 'border-red-500/30' : 'border-gray-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${cert.is_verified ? 'bg-emerald-500/20' : 'bg-amber-500/20'}`}>
                      <Award className={cert.is_verified ? 'text-emerald-400' : 'text-amber-400'} size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{cert.name}</span>
                        {cert.is_verified && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-lg">
                            <CheckCircle size={12} />
                            Đã xác minh
                          </span>
                        )}
                        {isExpired && (
                          <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-lg">
                            Hết hạn
                          </span>
                        )}
                      </div>
                      <div className="text-cyan-400 text-sm">{cert.issuer}</div>
                      <div className="flex items-center gap-4 mt-2 text-gray-400 text-sm">
                        {cert.issue_date && (
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {new Date(cert.issue_date).toLocaleDateString('vi-VN')}
                          </span>
                        )}
                        {cert.level && <span>Cấp độ: {cert.level}</span>}
                        {cert.score && <span>Điểm: {cert.score}</span>}
                      </div>
                      {cert.certificate_number && (
                        <div className="text-gray-500 text-sm mt-1">Số: {cert.certificate_number}</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {!cert.is_verified && (
                      <button
                        onClick={() => handleVerify(cert.id)}
                        className="p-2 hover:bg-emerald-500/20 rounded-lg"
                        title="Xác minh"
                      >
                        <CheckCircle size={16} className="text-gray-400 hover:text-emerald-400" />
                      </button>
                    )}
                    <button onClick={() => handleEdit(cert)} className="p-2 hover:bg-gray-700 rounded-lg">
                      <Edit size={16} className="text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Award className="mx-auto mb-4 text-gray-600" size={48} />
          <p className="text-gray-400">Chưa có bằng cấp / chứng chỉ</p>
          <button onClick={() => setShowForm(true)} className="mt-4 text-cyan-400 hover:text-cyan-300">
            + Thêm bằng cấp
          </button>
        </div>
      )}
    </div>
  );
}
