/**
 * vietnamLocations.js — Danh mục hành chính Việt Nam 2025
 * 34 Tỉnh/Thành phố | 3.321 Xã/Phường (không có Quận/Huyện)
 * Theo Nghị quyết UBTVQH15 - Hiệu lực 2025
 *
 * Cấu trúc:  Tỉnh/Thành → Xã/Phường  (2 cấp)
 * Sử dụng:   Dự án, Nhân sự, Khách hàng
 */
import locationsData from './vietnam-locations.json';

const { provinces, wards } = locationsData;

// Cache ward lists by province code for performance
const _wardsByProvince = {};

// ─── Province helpers ───────────────────────────────────────────────────────

/** Danh sách 34 tỉnh/thành (sorted by code) */
export const getProvinces = () => provinces;

/** Tìm tỉnh theo mã */
export const getProvinceByCode = (ma) =>
  provinces.find(p => p.ma === String(ma).padStart(2, '0')) || null;

/** Tên tỉnh từ mã */
export const getProvinceName = (ma) => getProvinceByCode(ma)?.ten || '';

// ─── Ward helpers ────────────────────────────────────────────────────────────

/** Danh sách xã/phường theo tỉnh */
export const getWardsByProvince = (ma_tinh) => {
  const key = String(ma_tinh).padStart(2, '0');
  if (!_wardsByProvince[key]) {
    _wardsByProvince[key] = wards.filter(w => w.ma_tinh === key);
  }
  return _wardsByProvince[key];
};

/** Tìm xã/phường theo mã */
export const getWardByCode = (ma) =>
  wards.find(w => w.ma === String(ma)) || null;

/** Tên xã/phường từ mã */
export const getWardName = (ma) => getWardByCode(ma)?.ten || '';

/** Full địa chỉ: "Phường Ba Đình, Thành phố Hà Nội" */
export const formatLocation = (ma_tinh, ma_xa) => {
  const parts = [];
  const ward = getWardByCode(ma_xa);
  const prov = getProvinceByCode(ma_tinh);
  if (ward) parts.push(ward.ten);
  if (prov) parts.push(prov.ten);
  return parts.join(', ');
};

/** Search wards by name (for autocomplete) */
export const searchWards = (query, ma_tinh = null) => {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const source = ma_tinh ? getWardsByProvince(ma_tinh) : wards;
  return source
    .filter(w => w.ten.toLowerCase().includes(q))
    .slice(0, 20);
};

// ─── Organization helpers ────────────────────────────────────────────────────

/**
 * Mỗi tỉnh có 1 chi nhánh (branch) và 1 Giám đốc.
 * Branch code = mã tỉnh 2 chữ số (e.g. "01" = Hà Nội)
 */
export const getBranchByProvince = (ma_tinh) => {
  const prov = getProvinceByCode(ma_tinh);
  if (!prov) return null;
  return {
    branch_code: prov.ma,
    branch_name: `Chi nhánh ${prov.ten.replace('Thành phố ', 'TP. ').replace('Tỉnh ', '')}`,
    province_name: prov.ten,
    province_code: prov.ma,
  };
};

/** Tất cả chi nhánh (34 chi nhánh = 34 tỉnh) */
export const getAllBranches = () =>
  provinces.map(p => getBranchByProvince(p.ma));

// ─── Summary stats ───────────────────────────────────────────────────────────
export const LOCATION_STATS = {
  totalProvinces: provinces.length,   // 34
  totalWards:     wards.length,        // 3321
  lastUpdated:    '2025-06-16',        // Ngày NQ UBTVQH15
};

export default {
  getProvinces,
  getProvinceByCode,
  getProvinceName,
  getWardsByProvince,
  getWardByCode,
  getWardName,
  formatLocation,
  searchWards,
  getBranchByProvince,
  getAllBranches,
  LOCATION_STATS,
};
