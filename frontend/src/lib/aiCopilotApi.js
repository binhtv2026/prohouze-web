/**
 * aiCopilotApi.js
 * ──────────────────────────────────────────────────────────────
 * Service layer cho AI Copilot:
 * 1. Gọi backend POST /api/ai/copilot/chat
 * 2. Nếu fail → dùng localAIAnswer() làm fallback
 * 3. Trả về chuẩn để AICopilotDrawer xử lý
 */
import { localAIAnswer } from '@/config/aiKnowledgeBase';

const BASE_URL = process.env.REACT_APP_BACKEND_URL || '';

/**
 * @param {object} params
 * @param {string} params.message
 * @param {string} params.sessionId
 * @param {string} params.role
 * @param {string} params.userName
 * @param {string} params.pageContext   — e.g. "project:NBU", "deal:123", "home"
 * @param {string} params.projectId
 * @param {Array}  params.history       — [{role, content}]
 * @returns {Promise<{message, source, suggestions}>}
 */
export async function sendCopilotMessage({
  message,
  sessionId,
  role = 'sale',
  userName = 'Nhân viên',
  pageContext = null,
  projectId = 'NBU',
  history = [],
}) {
  // ── Try backend API first ──────────────────────────────────────────────────
  if (BASE_URL) {
    try {
      const res = await fetch(`${BASE_URL}/api/ai/copilot/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          session_id: sessionId,
          role,
          user_name: userName,
          page_context: pageContext,
          project_id: projectId,
          history: history.slice(-6),
        }),
        signal: AbortSignal.timeout(10000), // 10s timeout
      });

      if (res.ok) {
        const data = await res.json();
        return {
          message: data.message,
          source: data.source || 'gpt',
          suggestions: data.suggestions || [],
        };
      }
    } catch (_err) {
      // Network error or timeout — fall through to local
    }
  }

  // ── Local fallback ─────────────────────────────────────────────────────────
  const answer = localAIAnswer(message, role, projectId);
  return {
    message: answer,
    source: 'local',
    suggestions: getLocalSuggestions(role, message),
  };
}

/**
 * Check API health — used to show connection indicator in UI
 */
export async function checkCopilotHealth() {
  if (!BASE_URL) return { online: false, mode: 'local-only' };
  try {
    const res = await fetch(`${BASE_URL}/api/ai/copilot/health`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      return { online: true, mode: data.mode, gptAvailable: data.gpt_available };
    }
  } catch (_) {}
  return { online: false, mode: 'local-only' };
}

function getLocalSuggestions(role, message) {
  const q = message.toLowerCase();
  if (/roi|cam kết|6%/.test(q)) return ['Chi phí phải đóng gồm những gì?', 'CTCT bắt buộc với tầng nào?'];
  if (/ctct|cho thuê/.test(q))  return ['Giá thuê kỳ vọng 2027?', '45 điểm nghỉ dưỡng dùng thế nào?'];
  if (/script|soạn|follow/.test(q)) return ['Soạn script cho khách HOT', 'Xử lý phản đối condotel 50 năm?'];
  if (role === 'manager')        return ['Deal nào cần theo dõi?', 'Gợi ý coaching sale mới?'];
  return ['Cam kết thuê NOBU?', 'Pháp lý đầy đủ chưa?', 'So sánh các loại căn?'];
}
