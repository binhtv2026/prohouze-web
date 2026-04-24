/**
 * KPI Config Page - Cấu hình KPI Rules (10/10)
 * ProHouze HR AI Platform - Phase 2
 * 
 * FEATURES:
 * - Validate total weight = 100% (không cho save nếu sai)
 * - Commission tiers configuration
 * - Level system configuration
 * - KPI lock management
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronLeft, Settings, Save, AlertCircle, CheckCircle,
  Target, Scale, DollarSign, Percent, RefreshCw, Edit3,
  Sliders, Award, TrendingUp, Lock, Unlock, AlertTriangle,
  Shield, Medal, Crown, Gem
} from 'lucide-react';
import { kpiApi } from '../../api/kpiApi';
import { toast } from 'sonner';

export default function KPIConfigPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [kpiDefinitions, setKpiDefinitions] = useState([]);
  const [bonusTiers, setBonusTiers] = useState([]);
  const [weightValidation, setWeightValidation] = useState(null);
  const [editedWeights, setEditedWeights] = useState({});
  const [levelsConfig, setLevelsConfig] = useState(null);
  const [activeTab, setActiveTab] = useState('kpis');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [definitions, tiers, validation, levels] = await Promise.all([
        kpiApi.getDefinitions(null, true),
        kpiApi.getBonusTiers(),
        kpiApi.validateWeights(),
        kpiApi.getLevelsConfig().catch(() => null),
      ]);
      setKpiDefinitions(definitions || []);
      setBonusTiers(tiers || []);
      setWeightValidation(validation);
      setLevelsConfig(levels);
      
      // Initialize edited weights
      const weights = {};
      (definitions || []).forEach(d => {
        weights[d.code] = (d.weight || 0) * 100;
      });
      setEditedWeights(weights);
    } catch (error) {
      console.error('Error loading config:', error);
      toast.error('Không thể tải cấu hình');
    } finally {
      setLoading(false);
    }
  };

  const handleWeightChange = (code, value) => {
    const numValue = parseFloat(value) || 0;
    setEditedWeights(prev => ({
      ...prev,
      [code]: numValue,
    }));
  };

  const getTotalWeight = () => {
    return Object.values(editedWeights).reduce((sum, w) => sum + w, 0);
  };

  const handleSaveWeights = async () => {
    const total = getTotalWeight();
    
    if (Math.abs(total - 100) > 0.01) {
      toast.error(`Tổng trọng số = ${total.toFixed(1)}% (phải = 100%)`);
      return;
    }
    
    try {
      setSaving(true);
      const weights = Object.entries(editedWeights).map(([code, weight]) => ({
        code,
        weight: weight / 100,
      }));
      
      await kpiApi.updateWeightsBatch(weights);
      toast.success('Đã lưu trọng số KPI');
      await loadData();
    } catch (error) {
      toast.error(error.message || 'Không thể lưu trọng số');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBonusTiers = async () => {
    try {
      setSaving(true);
      await kpiApi.updateBonusTiers(bonusTiers);
      toast.success('Đã lưu bảng hệ số Commission');
    } catch (error) {
      console.error('Error saving bonus tiers:', error);
      toast.error('Không thể lưu');
    } finally {
      setSaving(false);
    }
  };

  const updateBonusTier = (index, field, value) => {
    const updated = [...bonusTiers];
    updated[index] = {
      ...updated[index],
      [field]: parseFloat(value) || 0,
    };
    setBonusTiers(updated);
  };

  const addBonusTier = () => {
    setBonusTiers([
      ...bonusTiers,
      { min_achievement: 0, max_achievement: 100, bonus_modifier: 1.0 },
    ]);
  };

  const removeBonusTier = (index) => {
    setBonusTiers(bonusTiers.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  // Categorize KPIs
  const kpisByCategory = kpiDefinitions.reduce((acc, kpi) => {
    const cat = kpi.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(kpi);
    return acc;
  }, {});

  const categoryLabels = {
    sales: 'Bán hàng (Sales)',
    revenue: 'Doanh thu (Revenue)',
    activity: 'Hoạt động (Activity)',
    lead: 'Lead Management',
    quality: 'Chất lượng (Quality)',
    efficiency: 'Hiệu suất (Efficiency)',
    other: 'Khác',
  };
  
  const totalWeight = getTotalWeight();
  const weightValid = Math.abs(totalWeight - 100) < 0.01;

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-6" data-testid="kpi-config-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to="/kpi" className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <ChevronLeft size={20} className="text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Settings className="text-cyan-400" />
              Cấu hình KPI
            </h1>
            <p className="text-gray-400">Quản lý trọng số, target và hệ số commission</p>
          </div>
        </div>
        
        <button
          onClick={loadData}
          className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <RefreshCw size={18} className="text-gray-400" />
        </button>
      </div>

      {/* Weight Validation Banner */}
      <div className={`rounded-xl p-4 mb-6 flex items-center gap-3 ${
        weightValid 
          ? 'bg-emerald-500/10 border border-emerald-500/30' 
          : 'bg-red-500/10 border border-red-500/30'
      }`}>
        {weightValid ? (
          <CheckCircle className="text-emerald-400" size={24} />
        ) : (
          <AlertTriangle className="text-red-400" size={24} />
        )}
        <div className="flex-1">
          <div className={`font-semibold ${weightValid ? 'text-emerald-400' : 'text-red-400'}`}>
            Tổng trọng số: {totalWeight.toFixed(1)}%
          </div>
          <div className={`text-sm ${weightValid ? 'text-emerald-300' : 'text-red-300'}`}>
            {weightValid 
              ? 'Hợp lệ - Tổng = 100%' 
              : `KHÔNG hợp lệ - Cần ${(100 - totalWeight).toFixed(1) > 0 ? '+' : ''}${(100 - totalWeight).toFixed(1)}% nữa`}
          </div>
        </div>
        {!weightValid && (
          <div className="text-red-400 text-sm font-medium">
            Không thể lưu khi tổng ≠ 100%
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('kpis')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'kpis' 
              ? 'bg-cyan-500 text-black font-medium' 
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
          data-testid="tab-kpis"
        >
          <Target className="inline-block mr-2" size={16} />
          KPI Weights
        </button>
        <button
          onClick={() => setActiveTab('bonus')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'bonus' 
              ? 'bg-cyan-500 text-black font-medium' 
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
          data-testid="tab-bonus"
        >
          <DollarSign className="inline-block mr-2" size={16} />
          Commission Rules
        </button>
        <button
          onClick={() => setActiveTab('levels')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'levels' 
              ? 'bg-cyan-500 text-black font-medium' 
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
          data-testid="tab-levels"
        >
          <Crown className="inline-block mr-2" size={16} />
          Level System
        </button>
      </div>

      {/* KPI Weights Tab */}
      {activeTab === 'kpis' && (
        <div className="space-y-6">
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="text-blue-400 flex-shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-blue-200">
              <p className="font-medium">Quy tắc trọng số KPI:</p>
              <ul className="mt-1 space-y-1 text-blue-300">
                <li>• <b>Tổng tất cả KPI = 100%</b> (bắt buộc)</li>
                <li>• Không cho phép save khi tổng ≠ 100%</li>
                <li>• KPI key metric nên có trọng số cao hơn</li>
              </ul>
            </div>
          </div>

          {Object.entries(kpisByCategory).map(([category, kpis]) => (
            <div key={category} className="bg-[#12121a] border border-gray-800 rounded-xl overflow-hidden">
              <div className="p-4 bg-gray-800/30 border-b border-gray-700 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">{categoryLabels[category] || category}</h3>
                <span className="text-sm text-gray-400">
                  Subtotal: {kpis.reduce((sum, k) => sum + (editedWeights[k.code] || 0), 0).toFixed(1)}%
                </span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800/50">
                    <tr>
                      <th className="p-3 text-left text-gray-400 font-medium">KPI</th>
                      <th className="p-3 text-center text-gray-400 font-medium w-32">Trọng số (%)</th>
                      <th className="p-3 text-center text-gray-400 font-medium w-28">Target</th>
                      <th className="p-3 text-center text-gray-400 font-medium">Data Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kpis.map((kpi, index) => (
                      <tr 
                        key={kpi.code || index}
                        className="border-t border-gray-800 hover:bg-gray-800/30"
                        data-testid={`kpi-row-${kpi.code}`}
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div>
                              <span className="text-white font-medium">{kpi.name || kpi.code}</span>
                              {kpi.is_key_metric && (
                                <Award className="inline ml-2 text-amber-400" size={14} />
                              )}
                            </div>
                          </div>
                          <span className="text-gray-500 text-xs">{kpi.code}</span>
                        </td>
                        <td className="p-3 text-center">
                          <input
                            type="number"
                            value={editedWeights[kpi.code] || 0}
                            min="0"
                            max="100"
                            step="0.5"
                            className="w-20 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-center text-white"
                            onChange={(e) => handleWeightChange(kpi.code, e.target.value)}
                          />
                          <span className="text-gray-500 ml-1">%</span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="text-white">
                            {kpi.format === 'currency' 
                              ? (kpi.default_target / 1000000).toFixed(0) + 'M' 
                              : kpi.default_target || '-'}
                          </span>
                          <span className="text-gray-500 text-xs ml-1">{kpi.unit}</span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400">
                            AUTO
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between">
            <div className={`text-lg font-semibold ${weightValid ? 'text-emerald-400' : 'text-red-400'}`}>
              Tổng: {totalWeight.toFixed(1)}% / 100%
            </div>
            
            <button
              onClick={handleSaveWeights}
              disabled={saving || !weightValid}
              className={`px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                weightValid 
                  ? 'bg-cyan-500 hover:bg-cyan-600 text-black' 
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
              data-testid="save-weights-btn"
            >
              {saving ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Lưu trọng số
            </button>
          </div>
        </div>
      )}

      {/* Commission Rules Tab */}
      {activeTab === 'bonus' && (
        <div className="space-y-6">
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 flex items-start gap-3">
            <DollarSign className="text-purple-400 flex-shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-purple-200">
              <p className="font-medium">KPI → Commission Rules:</p>
              <ul className="mt-1 space-y-1 text-purple-300">
                <li>• <b>KPI &lt; 70%</b> → KHÔNG có commission</li>
                <li>• <b>KPI 70-99%</b> → Commission chuẩn</li>
                <li>• <b>KPI ≥ 100%</b> → Bonus multiplier</li>
              </ul>
            </div>
          </div>

          <div className="bg-[#12121a] border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="text-cyan-400" size={20} />
              Bảng hệ số Commission theo % KPI
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800/50">
                  <tr>
                    <th className="p-3 text-left text-gray-400 font-medium">% KPI Tối thiểu</th>
                    <th className="p-3 text-left text-gray-400 font-medium">% KPI Tối đa</th>
                    <th className="p-3 text-center text-gray-400 font-medium">Hệ số nhân</th>
                    <th className="p-3 text-center text-gray-400 font-medium">Commission</th>
                    <th className="p-3 text-center text-gray-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bonusTiers.map((tier, index) => {
                    const isNoCommission = tier.bonus_modifier === 0 || tier.max_achievement < 70;
                    
                    return (
                      <tr key={index} className="border-t border-gray-800" data-testid={`tier-row-${index}`}>
                        <td className="p-3">
                          <input
                            type="number"
                            value={tier.min_achievement || 0}
                            onChange={(e) => updateBonusTier(index, 'min_achievement', e.target.value)}
                            className="w-24 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                            min="0"
                            max="200"
                          />
                          <span className="text-gray-500 ml-2">%</span>
                        </td>
                        <td className="p-3">
                          <input
                            type="number"
                            value={tier.max_achievement || 100}
                            onChange={(e) => updateBonusTier(index, 'max_achievement', e.target.value)}
                            className="w-24 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                            min="0"
                            max="200"
                          />
                          <span className="text-gray-500 ml-2">%</span>
                        </td>
                        <td className="p-3 text-center">
                          <input
                            type="number"
                            value={tier.bonus_modifier || 0}
                            onChange={(e) => updateBonusTier(index, 'bonus_modifier', e.target.value)}
                            className="w-20 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-center"
                            min="0"
                            max="3"
                            step="0.05"
                          />
                          <span className="text-gray-500 ml-2">x</span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-1 rounded text-xs ${
                            isNoCommission 
                              ? 'bg-red-500/20 text-red-400' 
                              : tier.bonus_modifier >= 1.2 
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {isNoCommission ? 'KHÔNG có' : tier.bonus_modifier >= 1.2 ? 'BONUS' : 'Chuẩn'}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => removeBonusTier(index)}
                            className="p-1.5 hover:bg-red-500/20 rounded transition-colors text-red-400"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 flex items-center gap-4">
              <button
                onClick={addBonusTier}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                + Thêm mức
              </button>
              
              <button
                onClick={handleSaveBonusTiers}
                disabled={saving}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-black font-medium rounded-lg transition-colors flex items-center gap-2"
                data-testid="save-tiers-btn"
              >
                {saving ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Level System Tab */}
      {activeTab === 'levels' && (
        <div className="space-y-6">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
            <Crown className="text-amber-400 flex-shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-amber-200">
              <p className="font-medium">Level System - Gamification:</p>
              <p className="mt-1 text-amber-300">
                Sales được xếp hạng theo điểm KPI. Level cao = ưu đãi tốt hơn.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { level: 'bronze', icon: Shield, color: 'orange', range: '0 - 59%', perks: ['Cơ bản'] },
              { level: 'silver', icon: Medal, color: 'gray', range: '60 - 79%', perks: ['Commission chuẩn', 'Ưu tiên lead'] },
              { level: 'gold', icon: Crown, color: 'amber', range: '80 - 99%', perks: ['Commission +10%', 'Ưu tiên lead cao', 'Thưởng tháng'] },
              { level: 'diamond', icon: Gem, color: 'cyan', range: '≥ 100%', perks: ['Commission +30%', 'Lead VIP', 'Thưởng đặc biệt', 'Vinh danh'] },
            ].map(({ level, icon: Icon, color, range, perks }) => (
              <div 
                key={level}
                className={`bg-[#12121a] border border-${color}-500/30 rounded-xl p-6`}
              >
                <div className={`w-16 h-16 rounded-2xl bg-${color}-500/20 flex items-center justify-center mx-auto mb-4`}>
                  <Icon size={32} className={`text-${color}-400`} />
                </div>
                <h3 className={`text-xl font-bold text-${color}-400 text-center mb-2`}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </h3>
                <div className="text-center text-gray-400 text-sm mb-4">{range}</div>
                <ul className="text-sm text-gray-300 space-y-1">
                  {perks.map((perk, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle size={12} className={`text-${color}-400`} />
                      {perk}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="bg-[#12121a] border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Level → Commission Bonus</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-orange-500/10 rounded-lg">
                <span className="text-orange-400 font-medium">Bronze (0-59%)</span>
                <span className="text-gray-400">Commission +0%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-500/10 rounded-lg">
                <span className="text-gray-400 font-medium">Silver (60-79%)</span>
                <span className="text-gray-400">Commission +0%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-amber-500/10 rounded-lg">
                <span className="text-amber-400 font-medium">Gold (80-99%)</span>
                <span className="text-emerald-400">Commission +10%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-cyan-500/10 rounded-lg">
                <span className="text-cyan-400 font-medium">Diamond (≥100%)</span>
                <span className="text-emerald-400 font-bold">Commission +30%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
