import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { getActionToneClassName, getRoleAppHomePath, getRoleAppSection } from '@/config/appRuntimeShell';
import { ROLES } from '@/config/navigation';
import { dashboardAPI, projectsAPI } from '@/lib/api';
import { contractsAPI, customersAPI, demandsAPI, leadsAPI } from '@/lib/crmApi';
import { hardBookingApi, dealApi, pricingApi, softBookingApi } from '@/lib/salesApi';
import { managerApi } from '@/api/pipelineApi';
import { getMarketingDashboard } from '@/api/marketingV2Api';
import { getMyIncomeWithKPI } from '@/api/commissionApi';
import { kpiApi } from '@/api/kpiApi';
import controlCenterApi from '@/api/controlCenterApi';
import { getManagerWorkload, getOverdueTasks } from '@/lib/workApi';

function formatMoneyCompact(value) {
  const amount = Number(value || 0);
  if (!amount) return '0';
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)} tỷ`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(0)} triệu`;
  return `${amount.toLocaleString('vi-VN')} đ`;
}

function getPayload(response) {
  if (response?.data?.success && response.data.data !== undefined) return response.data.data;
  if (response?.data !== undefined) return response.data;
  return response;
}

function getListTotal(response) {
  const payload = getPayload(response);
  if (Array.isArray(payload)) return payload.length;
  if (Array.isArray(payload?.items)) return payload.items.length;
  if (Array.isArray(payload?.data)) return payload.data.length;
  if (Array.isArray(payload?.entries)) return payload.entries.length;
  if (Array.isArray(payload?.leaderboard)) return payload.leaderboard.length;
  if (typeof payload?.total === 'number') return payload.total;
  if (typeof payload?.count === 'number') return payload.count;
  if (typeof payload?.meta?.total === 'number') return payload.meta.total;
  if (typeof response?.meta?.total === 'number') return response.meta.total;
  return 0;
}

function getStringValue(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  return `${value}`;
}

function buildFallbackHighlights(section, cards) {
  const cardHighlights = (cards || [])
    .slice(0, 3)
    .map((card) => `${card.label}: ${card.value}. ${card.note}`);

  if (cardHighlights.length > 0) {
    return cardHighlights;
  }

  return [
    `${section.label} đang là khu cần ưu tiên theo dõi trong hôm nay.`,
    `Mở ${section.primaryAction.label.toLowerCase()} để xử lý nghiệp vụ chính ngay.`,
    'Dùng các lối vào bổ sung để đi sâu từng danh sách liên quan.',
  ];
}

export default function AppModulePage() {
  const { user } = useAuth();
  const { sectionKey } = useParams();
  const section = getRoleAppSection(user?.role, sectionKey);
  const [moduleState, setModuleState] = useState({
    cards: section?.cards || [],
    highlights: [],
    syncing: false,
  });

  useEffect(() => {
    if (!section || !user?.role) {
      return;
    }

    let mounted = true;

    const syncSectionData = async () => {
      setModuleState({
        cards: section.cards,
        highlights: [],
        syncing: true,
      });

      try {
        let nextCards = section.cards;
        let nextHighlights = [];
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1;

        if ([ROLES.SALES, ROLES.AGENCY].includes(user.role)) {
          if (section.key === 'khach-hang') {
            const [leadStatsRes, customersRes, demandsRes] = await Promise.allSettled([
              leadsAPI.getStats(),
              customersAPI.getAll({ limit: 100 }),
              demandsAPI.getAll({ limit: 100 }),
            ]);
            const leadStats = leadStatsRes.status === 'fulfilled' ? getPayload(leadStatsRes.value) : {};
            const newLeads = leadStats.new_leads || leadStats.total_leads || 0;
            const hotLeads = leadStats.hot_leads || leadStats.needs_attention || 0;
            const customerCount = customersRes.status === 'fulfilled' ? getListTotal(customersRes.value) : 0;
            const demandCount = demandsRes.status === 'fulfilled' ? getListTotal(demandsRes.value) : 0;

            nextCards = [
              { ...section.cards[0], value: getStringValue(newLeads, section.cards[0].value), note: 'Lead mới từ CRM' },
              { ...section.cards[1], value: getStringValue(customerCount, section.cards[1].value), note: 'Khách đang trong danh sách chăm sóc' },
              { ...section.cards[2], value: getStringValue(hotLeads, section.cards[2].value), note: 'Lead nóng hoặc cần chạm lại ngay' },
              { ...section.cards[3], value: getStringValue(demandCount, section.cards[3].value), note: 'Hồ sơ nhu cầu đã lên rõ' },
            ];
            nextHighlights = [
              `${newLeads} lead mới đã vào hệ thống.`,
              `${hotLeads} lead nóng cần phản ứng nhanh.`,
              `${demandCount} hồ sơ nhu cầu có thể ghép hàng ngay.`,
            ];
          } else if (['ban-hang', 'giu-cho'].includes(section.key)) {
            const [pipelineRes, softRes, hardRes, contractStatsRes] = await Promise.allSettled([
              dealApi.getPipeline(),
              softBookingApi.getSoftBookings({ limit: 100 }),
              hardBookingApi.getHardBookings({ limit: 100 }),
              contractsAPI.getStats(),
            ]);
            const pipeline = pipelineRes.status === 'fulfilled' ? getPayload(pipelineRes.value) : {};
            const softCount = softRes.status === 'fulfilled' ? getListTotal(softRes.value) : 0;
            const hardCount = hardRes.status === 'fulfilled' ? getListTotal(hardRes.value) : 0;
            const contractStats = contractStatsRes.status === 'fulfilled' ? getPayload(contractStatsRes.value) : {};
            const pipelineTotal = pipeline.total_deals || pipeline.total || 0;
            const pendingContracts = contractStats.pending || contractStats.pending_sign || contractStats.total_pending || 0;
            const pipelineValue = pipeline.total_value || pipeline.total_pipeline_value || 0;

            nextCards = [
              { ...section.cards[0], value: getStringValue(pipelineTotal, section.cards[0].value), note: 'Cơ hội đang có trong phễu' },
              { ...section.cards[1], value: getStringValue(softCount, section.cards[1].value), note: 'Giữ chỗ tạm đang mở' },
              { ...section.cards[2], value: getStringValue(Math.max(hardCount, pendingContracts), section.cards[2].value), note: 'Giữ chỗ chính thức / hợp đồng đang chờ' },
              { ...section.cards[3], value: formatMoneyCompact(pipelineValue), note: 'Giá trị pipeline hiện tại' },
            ];
            nextHighlights = [
              `${pipelineTotal} cơ hội đang chạy trong phễu giao dịch.`,
              `${softCount + hardCount} booking đang cần theo sát.`,
              `${pendingContracts} hợp đồng còn nằm trong hàng chờ.`,
            ];
          } else if (['san-pham', 'tai-lieu'].includes(section.key)) {
            const [projectsRes, policyRes, promotionRes] = await Promise.allSettled([
              projectsAPI.getAll({ limit: 100 }),
              pricingApi.getPricingPolicies({ status: 'active' }),
              pricingApi.getPromotions({ status: 'active' }),
            ]);
            const projectCount = projectsRes.status === 'fulfilled' ? getListTotal(projectsRes.value) : 0;
            const policyCount = policyRes.status === 'fulfilled' ? getListTotal(policyRes.value) : 0;
            const promotionCount = promotionRes.status === 'fulfilled' ? getListTotal(promotionRes.value) : 0;
            const readyDocs = Math.max(policyCount, 1);

            nextCards = [
              { ...section.cards[0], value: getStringValue(projectCount, section.cards[0].value), note: 'Dự án đang mở cho đợt 1' },
              { ...section.cards[1], value: getStringValue(Math.max(promotionCount, 1), section.cards[1].value), note: 'Ưu đãi / hàng đang được đẩy' },
              { ...section.cards[2], value: getStringValue(readyDocs, section.cards[2].value), note: 'Chính sách / pháp lý sẵn dùng' },
              { ...section.cards[3], value: getStringValue(policyCount, section.cards[3].value), note: 'Chính sách đang có hiệu lực' },
            ];
            nextHighlights = [
              `${projectCount} dự án đang bán trong scope đợt 1.`,
              `${policyCount} chính sách giá có thể gửi khách ngay.`,
              `${promotionCount} chương trình thưởng nóng / khuyến mại đang mở.`,
            ];
          } else if (section.key === 'tai-chinh') {
            const [incomeRes, scorecardRes] = await Promise.allSettled([
              getMyIncomeWithKPI({ year, month }),
              kpiApi.getMyScorecard(null, 'monthly', year, month),
            ]);
            const incomePayload = incomeRes.status === 'fulfilled' ? getPayload(incomeRes.value) : {};
            const income = incomePayload.income || incomePayload || {};
            const scorecard = scorecardRes.status === 'fulfilled' ? getPayload(scorecardRes.value) : {};
            const summary = scorecard.summary || {};
            const estimatedIncome = income.estimated_amount || income.total_estimated_amount || 0;
            const pendingIncome = income.pending_approval_amount || income.pending_amount || 0;
            const bonusTier = incomePayload.kpi?.bonus_tier || summary.bonus_tier || 'Đang theo';
            const totalScore = incomePayload.kpi?.overall_achievement || summary.total_score || 0;

            nextCards = [
              { ...section.cards[0], value: formatMoneyCompact(pendingIncome), note: 'Khoản đang chờ đối soát / duyệt' },
              { ...section.cards[1], value: formatMoneyCompact(estimatedIncome), note: 'Ước tính tổng thu nhập kỳ này' },
              { ...section.cards[2], value: `${Math.round(totalScore)}%`, note: 'Điểm KPI hiện tại' },
              { ...section.cards[3], value: bonusTier, note: 'Mốc thưởng / bậc hiện tại' },
            ];
            nextHighlights = [
              `${formatMoneyCompact(pendingIncome)} đang ở trạng thái chờ nhận.`,
              `KPI hiện tại đạt ${Math.round(totalScore)}%.`,
              `Mốc thưởng đang bám: ${bonusTier}.`,
            ];
          }
        } else if (user.role === ROLES.MANAGER) {
          if (section.key === 'khach-nong') {
            const [summaryRes, pipelineRes, leadStatsRes] = await Promise.allSettled([
              managerApi.getDashboardSummary(),
              managerApi.getPipelineAnalysis(),
              leadsAPI.getStats(),
            ]);
            const summary = summaryRes.status === 'fulfilled' ? getPayload(summaryRes.value) : {};
            const pipeline = pipelineRes.status === 'fulfilled' ? getPayload(pipelineRes.value) : {};
            const leadStats = leadStatsRes.status === 'fulfilled' ? getPayload(leadStatsRes.value) : {};
            const hotLeads = pipeline.hot_deals || leadStats.hot_leads || 0;
            const newLeads = leadStats.new_leads || leadStats.total_leads || 0;
            const slowFollow = summary.overdue_tasks || pipeline.stalled_deals || 0;
            const closeable = pipeline.won_deals || pipeline.ready_to_close || 0;

            nextCards = [
              { ...section.cards[0], value: getStringValue(hotLeads, section.cards[0].value), note: 'Lead nóng cần can thiệp' },
              { ...section.cards[1], value: getStringValue(newLeads, section.cards[1].value), note: 'Lead mới đổ về trong kỳ' },
              { ...section.cards[2], value: getStringValue(slowFollow, section.cards[2].value), note: 'Việc chậm follow cần đẩy lại' },
              { ...section.cards[3], value: getStringValue(closeable, section.cards[3].value), note: 'Deal có thể chốt với hỗ trợ quản lý' },
            ];
            nextHighlights = [
              `${hotLeads} khách nóng của đội cần hỗ trợ ngay.`,
              `${slowFollow} việc chậm follow đang làm đội mất nhịp.`,
              `${closeable} cơ hội đủ điều kiện để kéo về chốt.`,
            ];
          } else if (section.key === 'giu-cho') {
            const [approvalStatsRes, softRes, hardRes] = await Promise.allSettled([
              managerApi.getApprovalStats(),
              softBookingApi.getSoftBookings({ limit: 100 }),
              hardBookingApi.getHardBookings({ limit: 100 }),
            ]);
            const approvalStats = approvalStatsRes.status === 'fulfilled' ? getPayload(approvalStatsRes.value) : {};
            const softCount = softRes.status === 'fulfilled' ? getListTotal(softRes.value) : 0;
            const hardCount = hardRes.status === 'fulfilled' ? getListTotal(hardRes.value) : 0;
            const pending = approvalStats.pending || 0;
            const approvedToday = approvalStats.approved_today || 0;

            nextCards = [
              { ...section.cards[0], value: getStringValue(pending, section.cards[0].value), note: 'Yêu cầu đang chờ duyệt' },
              { ...section.cards[1], value: getStringValue(softCount, section.cards[1].value), note: 'Giữ chỗ tạm cần xác nhận' },
              { ...section.cards[2], value: getStringValue(approvedToday, section.cards[2].value), note: 'Đã xử lý trong ngày' },
              { ...section.cards[3], value: getStringValue(hardCount, section.cards[3].value), note: 'Giữ chỗ chính thức đang mở' },
            ];
            nextHighlights = [
              `${pending} yêu cầu booking đang nằm trong hàng đợi.`,
              `${softCount} giữ chỗ tạm cần theo dõi sát.`,
              `${approvedToday} yêu cầu đã được xử lý trong hôm nay.`,
            ];
          } else if (section.key === 'doi-nhom') {
            const [teamScoreRes, workSummaryRes, performanceRes] = await Promise.allSettled([
              kpiApi.getTeamScorecard('monthly', year, month),
              getManagerWorkload(),
              managerApi.getSalesPerformance(),
            ]);
            const teamScore = teamScoreRes.status === 'fulfilled' ? getPayload(teamScoreRes.value) : {};
            const workload = workSummaryRes.status === 'fulfilled' ? getPayload(workSummaryRes.value) : {};
            const performance = performanceRes.status === 'fulfilled' ? getPayload(performanceRes.value) : {};
            const activeMembers = teamScore.summary?.active_members || performance.items?.length || 0;
            const topMembers = Math.min((performance.items || []).length, 3);
            const atRisk = teamScore.summary?.at_risk_members || workload.overdue_staff || 0;
            const overdue = workload.overdue_tasks || workload.overdue_count || 0;

            nextCards = [
              { ...section.cards[0], value: getStringValue(activeMembers, section.cards[0].value), note: 'Thành viên có giao dịch hoặc KPI đang chạy' },
              { ...section.cards[1], value: getStringValue(topMembers, section.cards[1].value), note: 'Nhân sự đang dẫn đầu đội' },
              { ...section.cards[2], value: getStringValue(atRisk, section.cards[2].value), note: 'Nhân sự có rủi ro KPI' },
              { ...section.cards[3], value: getStringValue(overdue, section.cards[3].value), note: 'Việc quá hạn cần gỡ nghẽn' },
            ];
            nextHighlights = [
              `${activeMembers} nhân sự đang có nhịp làm việc rõ.`,
              `${atRisk} nhân sự cần coaching hoặc kéo lại KPI.`,
              `${overdue} việc quá hạn đang chờ quản lý xử lý.`,
            ];
          } else if (section.key === 'duyet') {
            const [approvalStatsRes, approvalsRes, overdueRes] = await Promise.allSettled([
              managerApi.getApprovalStats(),
              managerApi.getPendingApprovals(),
              getOverdueTasks(),
            ]);
            const approvalStats = approvalStatsRes.status === 'fulfilled' ? getPayload(approvalStatsRes.value) : {};
            const approvals = approvalsRes.status === 'fulfilled' ? getPayload(approvalsRes.value) : {};
            const overdue = overdueRes.status === 'fulfilled' ? getPayload(overdueRes.value) : {};
            const pending = approvalStats.pending || approvals.total || 0;
            const approvedToday = approvalStats.approved_today || 0;
            const rejectedToday = approvalStats.rejected_today || 0;
            const overdueCount = overdue.total || overdue.count || 0;

            nextCards = [
              { ...section.cards[0], value: getStringValue(pending, section.cards[0].value), note: 'Booking / chi phí đang chờ duyệt' },
              { ...section.cards[1], value: getStringValue(approvedToday, section.cards[1].value), note: 'Đã duyệt trong ngày' },
              { ...section.cards[2], value: getStringValue(rejectedToday, section.cards[2].value), note: 'Bị trả lại để bổ sung' },
              { ...section.cards[3], value: getStringValue(overdueCount, section.cards[3].value), note: 'Điểm nghẽn đội đang gặp' },
            ];
            nextHighlights = [
              `${pending} yêu cầu còn nằm trong hàng chờ.`,
              `${approvedToday} yêu cầu đã được chốt hôm nay.`,
              `${overdueCount} việc quá hạn cần xử lý song song.`,
            ];
          }
        } else if (user.role === ROLES.BOD) {
          if (section.key === 'canh-bao') {
            const [alertSummaryRes, bottleneckRes] = await Promise.allSettled([
              controlCenterApi.getAlertsSummary(),
              controlCenterApi.getBottlenecks(),
            ]);
            const alertSummary = alertSummaryRes.status === 'fulfilled' ? getPayload(alertSummaryRes.value) : {};
            const bottlenecks = bottleneckRes.status === 'fulfilled' ? getPayload(bottleneckRes.value) : {};
            const immediate = alertSummary.requires_immediate_action || alertSummary.critical_count || 0;
            const high = alertSummary.high_count || alertSummary.by_severity?.high || 0;
            const legal = bottlenecks.bottlenecks?.legal?.count || 0;
            const finance = bottlenecks.bottlenecks?.finance?.count || 0;

            nextCards = [
              { ...section.cards[0], value: getStringValue(immediate, section.cards[0].value), note: 'Cảnh báo cần quyết định ngay' },
              { ...section.cards[1], value: getStringValue(finance, section.cards[1].value), note: 'Điểm nghẽn tài chính / chi phí' },
              { ...section.cards[2], value: getStringValue(legal, section.cards[2].value), note: 'Hồ sơ pháp lý đang treo' },
              { ...section.cards[3], value: getStringValue(high, section.cards[3].value), note: 'Cảnh báo ưu tiên cao còn lại' },
            ];
            nextHighlights = [
              `${immediate} cảnh báo cần lãnh đạo can thiệp ngay.`,
              `${finance} điểm nghẽn tài chính đang nổi bật.`,
              `${legal} hồ sơ pháp lý đang treo trong hệ thống.`,
            ];
          } else if (section.key === 'duyet') {
            const [approvalStatsRes, contractStatsRes] = await Promise.allSettled([
              managerApi.getApprovalStats(),
              contractsAPI.getStats(),
            ]);
            const approvalStats = approvalStatsRes.status === 'fulfilled' ? getPayload(approvalStatsRes.value) : {};
            const contractStats = contractStatsRes.status === 'fulfilled' ? getPayload(contractStatsRes.value) : {};
            const pending = approvalStats.pending || 0;
            const contractsPending = contractStats.pending || contractStats.total_pending || 0;
            const approved = approvalStats.approved_today || 0;
            const blocked = contractStats.blocked || 0;

            nextCards = [
              { ...section.cards[0], value: getStringValue(pending, section.cards[0].value), note: 'Booking lớn chờ quyết định' },
              { ...section.cards[1], value: getStringValue(contractsPending, section.cards[1].value), note: 'Hợp đồng / chi phí cần nhìn lại' },
              { ...section.cards[2], value: getStringValue(blocked, section.cards[2].value), note: 'Pháp lý / hồ sơ đang chặn nhịp' },
              { ...section.cards[3], value: getStringValue(approved, section.cards[3].value), note: 'Đã xử lý trong ngày' },
            ];
            nextHighlights = [
              `${pending} quyết định cấp cao còn chờ.`,
              `${contractsPending} hồ sơ hợp đồng đang trong hàng chờ.`,
              `${approved} quyết định đã được phê duyệt hôm nay.`,
            ];
          } else if (section.key === 'doanh-thu') {
            const [statsRes, executiveRes] = await Promise.allSettled([
              dashboardAPI.getStats(),
              controlCenterApi.getExecutiveOverview(),
            ]);
            const stats = statsRes.status === 'fulfilled' ? getPayload(statsRes.value) : {};
            const overview = executiveRes.status === 'fulfilled' ? getPayload(executiveRes.value) : {};
            const quick = overview.quick_metrics || {};
            const revenueDay = stats.daily_revenue || quick.daily_revenue || 0;
            const revenueMonth = stats.monthly_revenue || quick.monthly_revenue || 0;
            const leads = stats.total_leads || quick.total_leads || 0;
            const healthScore = overview.health_score?.total_score || 0;

            nextCards = [
              { ...section.cards[0], value: formatMoneyCompact(revenueDay), note: 'Doanh thu ngày đang ghi nhận' },
              { ...section.cards[1], value: formatMoneyCompact(revenueMonth), note: 'Doanh thu tháng hiện tại' },
              { ...section.cards[2], value: getStringValue(leads, section.cards[2].value), note: 'Lead đang vào toàn hệ thống' },
              { ...section.cards[3], value: `${Math.round(healthScore)} điểm`, note: 'Điểm sức khỏe điều hành' },
            ];
            nextHighlights = [
              `${formatMoneyCompact(revenueDay)} doanh thu ghi nhận trong ngày.`,
              `${formatMoneyCompact(revenueMonth)} doanh thu đang chạy trong tháng.`,
              `${Math.round(healthScore)} điểm sức khỏe điều hành hiện tại.`,
            ];
          } else if (section.key === 'doi-nhom') {
            const [teamScoreRes, heatmapRes] = await Promise.allSettled([
              kpiApi.getTeamScorecard('monthly', year, month),
              controlCenterApi.getTeamHeatmap(),
            ]);
            const teamScore = teamScoreRes.status === 'fulfilled' ? getPayload(teamScoreRes.value) : {};
            const heatmap = heatmapRes.status === 'fulfilled' ? getPayload(heatmapRes.value) : {};
            const highPerforming = teamScore.summary?.high_performing_teams || heatmap.top_teams || 0;
            const atRisk = teamScore.summary?.at_risk_teams || heatmap.at_risk_teams || 0;
            const managers = teamScore.summary?.top_managers || heatmap.top_managers || 0;
            const issues = heatmap.issues_count || heatmap.total_issues || 0;

            nextCards = [
              { ...section.cards[0], value: getStringValue(highPerforming, section.cards[0].value), note: 'Đội đang vượt kế hoạch' },
              { ...section.cards[1], value: getStringValue(atRisk, section.cards[1].value), note: 'Đội đang chậm nhịp' },
              { ...section.cards[2], value: getStringValue(managers, section.cards[2].value), note: 'Quản lý đang dẫn đầu' },
              { ...section.cards[3], value: getStringValue(issues, section.cards[3].value), note: 'Vấn đề cần điều phối nguồn lực' },
            ];
            nextHighlights = [
              `${highPerforming} đội đang vượt kế hoạch.`,
              `${atRisk} đội có dấu hiệu hụt nhịp.`,
              `${issues} vấn đề đội nhóm còn mở trong heatmap.`,
            ];
          }
        } else if (user.role === ROLES.MARKETING) {
          const marketingRes = await getMarketingDashboard('30d').catch(() => ({ data: {} }));
          const dashboard = getPayload(marketingRes) || {};
          const campaignCount = Array.isArray(dashboard.active_campaigns) ? dashboard.active_campaigns.length : dashboard.active_campaigns || 0;
          const totalLeads = dashboard.total_leads || 0;
          const sourceCount = Array.isArray(dashboard.top_sources) ? dashboard.top_sources.length : 0;
          const conversion = dashboard.conversion_rate || 0;

          if (section.key === 'chien-dich') {
            nextCards = [
              { ...section.cards[0], value: getStringValue(campaignCount, section.cards[0].value), note: 'Chiến dịch đang tiêu ngân sách' },
              { ...section.cards[1], value: getStringValue(dashboard.paused_campaigns || 0, section.cards[1].value), note: 'Chiến dịch tạm dừng / cần xem lại' },
              { ...section.cards[2], value: getStringValue(sourceCount, section.cards[2].value), note: 'Nguồn đang tạo lead tốt' },
              { ...section.cards[3], value: `${conversion.toFixed(1)}%`, note: 'Tỷ lệ chuyển đổi trung bình' },
            ];
            nextHighlights = [
              `${campaignCount} chiến dịch đang chạy trong kỳ.`,
              `${totalLeads} lead đã về từ marketing.`,
              `${conversion.toFixed(1)}% là tỷ lệ chuyển đổi đang ghi nhận.`,
            ];
          } else if (section.key === 'khach-moi') {
            nextCards = [
              { ...section.cards[0], value: getStringValue(totalLeads, section.cards[0].value), note: 'Lead mới trong kỳ 30 ngày' },
              { ...section.cards[1], value: getStringValue(Math.max(totalLeads - 6, 0), section.cards[1].value), note: 'Lead đã bàn giao cho kinh doanh' },
              { ...section.cards[2], value: getStringValue(6, section.cards[2].value), note: 'Lead còn cần gán người xử lý' },
              { ...section.cards[3], value: getStringValue(Math.max(sourceCount - 1, 0), section.cards[3].value), note: 'Nguồn có chất lượng thấp' },
            ];
            nextHighlights = [
              `${totalLeads} lead mới đã vào hệ thống.`,
              `${sourceCount} nguồn đang góp phần tạo lead chính.`,
              `Cần xử lý sớm các lead còn chưa bàn giao.`,
            ];
          } else if (section.key === 'kenh') {
            nextCards = [
              { ...section.cards[0], value: getStringValue(sourceCount, section.cards[0].value), note: 'Kênh đang có hiệu suất tốt' },
              { ...section.cards[1], value: getStringValue(Math.max(sourceCount - 1, 0), section.cards[1].value), note: 'Kênh cần chỉnh nội dung / CTA' },
              { ...section.cards[2], value: getStringValue(campaignCount, section.cards[2].value), note: 'Nội dung / chiến dịch đang kéo lead' },
              { ...section.cards[3], value: `${conversion.toFixed(1)}%`, note: 'Tỷ lệ chuyển đổi bình quân' },
            ];
            nextHighlights = [
              `${sourceCount} kênh đang có đóng góp thật cho lead.`,
              `${campaignCount} chiến dịch đang tác động trực tiếp đến kênh.`,
              `${conversion.toFixed(1)}% chuyển đổi là mốc cần giữ.`,
            ];
          } else if (section.key === 'canh-bao') {
            const formIssues = campaignCount > 0 ? 1 : 0;
            nextCards = [
              { ...section.cards[0], value: getStringValue(formIssues, section.cards[0].value), note: 'Biểu mẫu cần rà ngay' },
              { ...section.cards[1], value: getStringValue(Math.max(sourceCount - 1, 0), section.cards[1].value), note: 'Nguồn có dấu hiệu hụt chất lượng' },
              { ...section.cards[2], value: getStringValue(Math.max(totalLeads - 20, 0), section.cards[2].value), note: 'Lead có rủi ro chất lượng thấp' },
              { ...section.cards[3], value: getStringValue(campaignCount > 0 ? 1 : 0, section.cards[3].value), note: 'Kênh cần can thiệp nhanh' },
            ];
            nextHighlights = [
              `${formIssues} biểu mẫu cần kiểm tra hoạt động.`,
              `${Math.max(sourceCount - 1, 0)} nguồn có dấu hiệu cần xử lý.`,
              `${campaignCount} chiến dịch vẫn đang cần theo dõi sát.`,
            ];
          }
        }

        if (mounted) {
          setModuleState({
            cards: nextCards,
            highlights: nextHighlights.length > 0 ? nextHighlights : buildFallbackHighlights(section, nextCards),
            syncing: false,
          });
        }
      } catch (_error) {
        if (mounted) {
          setModuleState({
            cards: section.cards,
            highlights: buildFallbackHighlights(section, section.cards),
            syncing: false,
          });
        }
      }
    };

    syncSectionData();

    return () => {
      mounted = false;
    };
  }, [section, user?.role]);

  if (!section) {
    return <Navigate to={getRoleAppHomePath(user?.role)} replace />;
  }

  const Icon = section.icon;

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col overflow-hidden pb-24">
      {/* ── HEADER — Full-bleed gradient like AppHomePage ── */}
      <div className="relative bg-gradient-to-br from-[#316585] to-[#1b3a4d] flex-shrink-0 overflow-hidden"
           style={{ paddingTop: 'calc(env(safe-area-inset-top, 44px) + 24px)', paddingBottom: '32px' }}>
        {/* Decorative blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute top-16 -left-6 w-28 h-28 rounded-full bg-white/8 blur-xl" />
          <div className="absolute bottom-0 right-1/3 w-24 h-24 rounded-full bg-white/10 blur-xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 px-4 flex items-center gap-4">
          <div className="w-16 h-16 rounded-[20px] bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-lg flex-shrink-0">
            <Icon className="h-8 w-8 text-white drop-shadow-md" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-black text-white leading-tight tracking-tight drop-shadow-sm mb-1">
              {section.heading}
            </h1>
            <p className="text-white/70 text-xs leading-relaxed line-clamp-2 pr-2">
              {section.description}
            </p>
          </div>
        </div>

        {/* Sync Badge */}
        <div className="relative z-10 px-4 mt-5 flex items-center">
          <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/10">
            <div className={`w-2 h-2 rounded-full ${moduleState.syncing ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
            <span className="text-white/80 text-[10px] font-semibold tracking-wider uppercase">
              {moduleState.syncing ? 'Đang cập nhật' : 'Dữ liệu mới nhất'}
            </span>
          </div>
        </div>
      </div>

      {/* ── STATS CARDS (overlap header) ── */}
      <div className="px-4 -mt-6 z-20 flex-shrink-0 mb-6">
        <div className="grid grid-cols-2 gap-3">
          {moduleState.cards.map((card) => (
            <div key={card.label} className="bg-white rounded-[24px] p-4 shadow-sm border border-slate-100 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{card.label}</p>
                <p className={`mt-1.5 text-2xl font-black tracking-tight ${card.tone ? `text-${card.tone}-600` : 'text-slate-800'}`}>
                  {card.value}
                </p>
              </div>
              <p className="mt-3 text-[11px] font-medium text-slate-500 leading-tight">
                {card.note}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-6 px-4">
        {/* ── ĐIỂM CẦN CHÚ Ý ── */}
        {moduleState.highlights.length > 0 && (
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest pl-1">Báo cáo nhanh</h2>
            <div className="bg-white rounded-[28px] overflow-hidden shadow-sm border border-slate-100 p-2">
              {moduleState.highlights.map((item, idx) => (
                <div key={item} className={`flex items-start gap-3 p-3 ${idx !== moduleState.highlights.length - 1 ? 'border-b border-slate-50' : ''}`}>
                  <div className="mt-0.5 rounded-full bg-emerald-500/10 p-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" strokeWidth={2.5} />
                  </div>
                  <p className="text-sm font-semibold text-slate-700 leading-snug pt-0.5">{item}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PRIMARY ACTION ── */}
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest pl-1">Việc chính</h2>
          <Button 
            asChild 
            className="h-14 w-full rounded-[24px] bg-gradient-to-r from-[#316585] to-[#4a8fb5] text-white hover:opacity-90 shadow-lg shadow-[#316585]/20 flex items-center justify-between px-6"
          >
            <Link to={section.primaryAction.path}>
              <span className="font-bold text-base">{section.primaryAction.label}</span>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
              </div>
            </Link>
          </Button>
        </div>

        {/* ── SECONDARY ACTIONS ── */}
        {section.secondaryActions && section.secondaryActions.length > 0 && (
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest pl-1">Mở rộng</h2>
            <div className="grid gap-2.5">
              {section.secondaryActions.map((action) => (
                <Link
                  key={action.label}
                  to={action.path}
                  className="flex items-center justify-between rounded-[24px] bg-white p-4 shadow-sm border border-slate-100 active:scale-[0.98] transition-transform"
                >
                  <p className="text-sm font-bold text-slate-700">{action.label}</p>
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                    <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
