/**
 * nativeUtils.js — C1 + C2
 * Safe area, haptic feedback, swipe gestures cho Capacitor iOS/Android
 */
import { Capacitor } from '@capacitor/core';

// ─── Platform utils ────────────────────────────────────────────────────────────
export const isNative = () => Capacitor.isNativePlatform();
export const isIOS   = () => Capacitor.getPlatform() === 'ios';
export const isAndroid = () => Capacitor.getPlatform() === 'android';

// ─── C1: Safe Area insets ──────────────────────────────────────────────────────
/**
 * Apply CSS custom properties for safe area insets
 * Tự động đọc từ env() iOS notch / home indicator
 */
export const applySafeAreaCSS = () => {
  const root = document.documentElement;
  // iOS cung cấp qua env() — set thêm vào CSS custom props để dùng dễ hơn
  root.style.setProperty('--safe-area-top',    'env(safe-area-inset-top, 0px)');
  root.style.setProperty('--safe-area-bottom', 'env(safe-area-inset-bottom, 0px)');
  root.style.setProperty('--safe-area-left',   'env(safe-area-inset-left, 0px)');
  root.style.setProperty('--safe-area-right',  'env(safe-area-inset-right, 0px)');

  // Extra padding cho Bottom Nav trên iOS
  if (isIOS()) {
    root.style.setProperty('--bottom-nav-height', '80px'); // taller for home indicator
    document.body.classList.add('ios-device');
  } else if (isAndroid()) {
    root.style.setProperty('--bottom-nav-height', '64px');
    document.body.classList.add('android-device');
  } else {
    root.style.setProperty('--bottom-nav-height', '64px');
  }
};

// ─── C2: Haptic Feedback ───────────────────────────────────────────────────────
let _haptics = null;

const getHaptics = async () => {
  if (_haptics) return _haptics;
  if (!isNative()) return null;
  try {
    const mod = await import(/* webpackIgnore: true */ '@capacitor/haptics').catch(() => null);
    if (!mod) return null;
    _haptics = mod.Haptics;
    return _haptics;
  } catch {
    return null;
  }
};

export const haptic = {
  /** Nhẹ — click button, chọn tab */
  light: async () => {
    const h = await getHaptics();
    if (!h) return;
    try { await h.impact({ style: 'LIGHT' }); } catch {}
  },
  /** Trung bình — confirm action, submit form */
  medium: async () => {
    const h = await getHaptics();
    if (!h) return;
    try { await h.impact({ style: 'MEDIUM' }); } catch {}
  },
  /** Mạnh — destructive, error */
  heavy: async () => {
    const h = await getHaptics();
    if (!h) return;
    try { await h.impact({ style: 'HEAVY' }); } catch {}
  },
  /** Thành công — deal chốt, thanh toán xong */
  success: async () => {
    const h = await getHaptics();
    if (!h) return;
    try { await h.notification({ type: 'SUCCESS' }); } catch {}
  },
  /** Cảnh báo — hợp đồng sắp hết hạn */
  warning: async () => {
    const h = await getHaptics();
    if (!h) return;
    try { await h.notification({ type: 'WARNING' }); } catch {}
  },
  /** Lỗi */
  error: async () => {
    const h = await getHaptics();
    if (!h) return;
    try { await h.notification({ type: 'ERROR' }); } catch {}
  },
};

// ─── C2: Pull-to-refresh helper ────────────────────────────────────────────────
export const setupPullToRefresh = (onRefresh) => {
  if (!isNative()) return null;

  let startY = 0;
  let isPulling = false;

  const handleTouchStart = (e) => {
    startY = e.touches[0].clientY;
    isPulling = window.scrollY === 0;
  };

  const handleTouchEnd = async (e) => {
    if (!isPulling) return;
    const endY = e.changedTouches[0].clientY;
    const delta = endY - startY;
    if (delta > 80) {
      await haptic.light();
      onRefresh?.();
    }
    isPulling = false;
  };

  document.addEventListener('touchstart', handleTouchStart, { passive: true });
  document.addEventListener('touchend', handleTouchEnd, { passive: true });

  // Cleanup
  return () => {
    document.removeEventListener('touchstart', handleTouchStart);
    document.removeEventListener('touchend', handleTouchEnd);
  };
};

// ─── C2: Swipe Back gesture (iOS) ─────────────────────────────────────────────
export const setupSwipeBack = (navigate) => {
  if (!isIOS()) return null;

  let startX = 0;
  const EDGE_THRESHOLD = 30; // px from left edge

  const handleTouchStart = (e) => {
    startX = e.touches[0].clientX;
  };

  const handleTouchEnd = async (e) => {
    const endX = e.changedTouches[0].clientX;
    const startedFromEdge = startX < EDGE_THRESHOLD;
    const swipeDistance = endX - startX;

    if (startedFromEdge && swipeDistance > 100) {
      await haptic.light();
      navigate(-1);
    }
  };

  document.addEventListener('touchstart', handleTouchStart, { passive: true });
  document.addEventListener('touchend', handleTouchEnd, { passive: true });

  return () => {
    document.removeEventListener('touchstart', handleTouchStart);
    document.removeEventListener('touchend', handleTouchEnd);
  };
};

// ─── C1: Keyboard handling ────────────────────────────────────────────────────
export const setupKeyboardHandlers = () => {
  if (!isNative()) return null;

  const showBodyClass = () => document.body.classList.add('keyboard-open');
  const hideBodyClass = () => document.body.classList.remove('keyboard-open');

  window.addEventListener('keyboardWillShow', showBodyClass);
  window.addEventListener('keyboardWillHide', hideBodyClass);
  window.addEventListener('ionKeyboardDidShow', showBodyClass);
  window.addEventListener('ionKeyboardDidHide', hideBodyClass);

  return () => {
    window.removeEventListener('keyboardWillShow', showBodyClass);
    window.removeEventListener('keyboardWillHide', hideBodyClass);
  };
};

// ─── Status Bar control ────────────────────────────────────────────────────────
export const setStatusBarStyle = async (style = 'dark') => {
  if (!isNative()) return;
  try {
    const mod = await import(/* webpackIgnore: true */ '@capacitor/status-bar').catch(() => null);
    if (!mod) return;
    if (style === 'light') {
      await mod.StatusBar.setStyle({ style: 'DARK' });
    } else {
      await mod.StatusBar.setStyle({ style: 'LIGHT' });
    }
  } catch {}
};

// ─── App Badge (iOS) ──────────────────────────────────────────────────────────
export const setAppBadge = async (count) => {
  if (!isIOS()) return;
  try {
    const mod = await import(/* webpackIgnore: true */ '@capacitor/push-notifications').catch(() => null);
    if (!mod) return;
    await mod.PushNotifications.removeAllDeliveredNotifications();
  } catch {}
};
