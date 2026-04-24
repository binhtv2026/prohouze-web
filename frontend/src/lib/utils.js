import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { ROLE_GOVERNANCE } from "@/config/roleGovernance";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount) {
  if (!amount) return "0 đ";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

export function formatNumber(num) {
  if (!num) return "0";
  return new Intl.NumberFormat("vi-VN").format(num);
}

export function formatDate(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function formatDateTime(date) {
  if (!date) return "";
  return new Date(date).toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getStatusColor(status) {
  const colors = {
    new: "bg-blue-100 text-blue-800",
    contacted: "bg-purple-100 text-purple-800",
    warm: "bg-yellow-100 text-yellow-800",
    hot: "bg-orange-100 text-orange-800",
    qualified: "bg-cyan-100 text-cyan-800",
    proposal: "bg-indigo-100 text-indigo-800",
    negotiation: "bg-pink-100 text-pink-800",
    closed_won: "bg-green-100 text-green-800",
    closed_lost: "bg-red-100 text-red-800",
    active: "bg-green-100 text-green-800",
    inactive: "bg-gray-100 text-gray-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

export function getStatusLabel(status) {
  const labels = {
    new: "Mới",
    contacted: "Đã liên hệ",
    warm: "Ấm",
    hot: "Nóng",
    qualified: "Đủ điều kiện",
    proposal: "Đề xuất",
    negotiation: "Đàm phán",
    closed_won: "Chốt thành công",
    closed_lost: "Mất",
    active: "Hoạt động",
    inactive: "Không hoạt động",
  };
  return labels[status] || status;
}

export function getSourceLabel(source) {
  const labels = {
    website: "Website",
    facebook: "Facebook",
    zalo: "Zalo",
    tiktok: "TikTok",
    google: "Google",
    referral: "Giới thiệu",
    event: "Sự kiện",
    cold_call: "Cold Call",
    other: "Khác",
  };
  return labels[source] || source;
}

export function getRoleLabel(role) {
  return ROLE_GOVERNANCE[role]?.ten || role;
}

export function truncate(str, length = 50) {
  if (!str) return "";
  return str.length > length ? str.substring(0, length) + "..." : str;
}

export function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

export function getScoreColor(score) {
  if (score >= 80) return "text-green-600 bg-green-100";
  if (score >= 60) return "text-yellow-600 bg-yellow-100";
  if (score >= 40) return "text-orange-600 bg-orange-100";
  return "text-red-600 bg-red-100";
}
