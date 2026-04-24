/**
 * pushNotifications.js — E3
 * Firebase Cloud Messaging + Capacitor PushNotifications
 * Web + iOS + Android unified push layer
 */
import { isNative, isIOS } from '@/utils/nativeUtils';

// ─── E3a: Web Push (Firebase) ─────────────────────────────────────────────────
const VAPID_KEY = process.env.REACT_APP_FIREBASE_VAPID_KEY || '';
const FIREBASE_CONFIG = {
  apiKey:            process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain:        process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.REACT_APP_FIREBASE_PROJECT_ID || 'prohouzing-prod',
  storageBucket:     process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.REACT_APP_FIREBASE_APP_ID,
};

let _messaging = null;

const getMessaging = async () => {
  if (_messaging) return _messaging;
  try {
    const { initializeApp, getApps } = await import('firebase/app');
    const { getMessaging: getFCMMessaging } = await import('firebase/messaging');
    const app = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
    _messaging = getFCMMessaging(app);
    return _messaging;
  } catch {
    return null;
  }
};

// ─── Request permission + get FCM token ───────────────────────────────────────
export const requestPushPermission = async () => {
  if (isNative()) {
    return await requestNativePush();
  }
  return await requestWebPush();
};

const requestWebPush = async () => {
  if (!('Notification' in window)) {
    return { granted: false, reason: 'not_supported' };
  }

  let permission = Notification.permission;
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }

  if (permission !== 'granted') {
    return { granted: false, reason: 'denied' };
  }

  try {
    const messaging = await getMessaging();
    if (!messaging) return { granted: true, token: null, reason: 'firebase_unavailable' };

    const { getToken } = await import('firebase/messaging');
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    return { granted: true, token, platform: 'web' };
  } catch (error) {
    return { granted: true, token: null, error: error.message };
  }
};

const requestNativePush = async () => {
  try {
    const { PushNotifications } = await import(/* webpackIgnore: true */ '@capacitor/push-notifications').catch(() => ({ PushNotifications: null }));
    if (!PushNotifications) return { granted: false, reason: 'capacitor_unavailable' };

    const result = await PushNotifications.requestPermissions();
    if (result.receive !== 'granted') {
      return { granted: false, reason: 'denied' };
    }

    await PushNotifications.register();
    return { granted: true, platform: isIOS() ? 'ios' : 'android' };
  } catch (error) {
    return { granted: false, error: error.message };
  }
};

// ─── E3b: Register FCM token với backend ──────────────────────────────────────
export const registerFCMToken = async (token, userId, api) => {
  if (!token || !userId) return;
  try {
    await api.post('/api/notifications/register-device', {
      user_id: userId,
      fcm_token: token,
      platform: isNative() ? (isIOS() ? 'ios' : 'android') : 'web',
      app_version: '2.1.0',
    });
  } catch {
    // Non-critical — fail silently
  }
};

// ─── E3c: Foreground message handler ─────────────────────────────────────────
export const setupForegroundMessages = async (onMessage) => {
  if (isNative()) {
    try {
      const { PushNotifications } = await import(/* webpackIgnore: true */ '@capacitor/push-notifications').catch(() => ({ PushNotifications: null }));
      if (!PushNotifications) return null;

      PushNotifications.addListener('pushNotificationReceived', onMessage);
      return () => PushNotifications.removeAllListeners();
    } catch {
      return null;
    }
  }

  // Web FCM foreground
  const messaging = await getMessaging();
  if (!messaging) return null;
  try {
    const { onMessage } = await import('firebase/messaging');
    return onMessage(messaging, (payload) => {
      onMessage(payload);
    });
  } catch {
    return null;
  }
};

// ─── E3d: Local notification (Capacitor) ─────────────────────────────────────
export const sendLocalNotification = async ({ title, body, id = Date.now(), schedule = null }) => {
  if (!isNative()) {
    // Web: use browser Notification API
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
    }
    return;
  }

  try {
    const { LocalNotifications } = await import(/* webpackIgnore: true */ '@capacitor/local-notifications').catch(() => ({ LocalNotifications: null }));
    if (!LocalNotifications) return;

    const notif = { id, title, body, sound: 'default', smallIcon: 'ic_stat_icon_config_sample' };
    if (schedule) notif.schedule = { at: new Date(schedule) };

    await LocalNotifications.schedule({ notifications: [notif] });
  } catch {}
};

// ─── E3e: Đặt lịch thông báo hợp đồng sắp hết hạn ───────────────────────────
export const scheduleContractAlerts = async (contracts) => {
  for (const contract of contracts) {
    if (!contract.end_date) continue;
    const endDate = new Date(contract.end_date);
    const alertDate = new Date(endDate);
    alertDate.setDate(alertDate.getDate() - 14); // 14 ngày trước

    if (alertDate > new Date()) {
      await sendLocalNotification({
        id: Math.abs(contract.id?.charCodeAt(0) || 1) * 100,
        title: '⚠️ Hợp đồng sắp hết hạn',
        body: `HĐ ${contract.asset_code} của ${contract.tenant_name} hết hạn sau 14 ngày`,
        schedule: alertDate.toISOString(),
      });
    }
  }
};
