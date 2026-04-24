import "@/App.css";
import { useEffect } from 'react';
import { applySafeAreaCSS, setupKeyboardHandlers } from '@/utils/nativeUtils';
import { initAnalytics, initWebVitals, Analytics } from '@/lib/analytics';
import { registerServiceWorker } from '@/hooks/useSystemHealth';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { MasterDataProvider } from "@/hooks/useDynamicData";
import MainLayout from "@/components/layout/MainLayout";
import AppSurfaceLayout from "@/components/layout/AppSurfaceLayout";
import AppBottomNav from "@/components/layout/AppBottomNav";
import LoginPage from "@/pages/LoginPage";
import ModuleSelectPage from "@/pages/ModuleSelectPage";
import RegisterPage from "@/pages/RegisterPage";
import DashboardPage from "@/pages/DashboardPage";
import LeadsPage from "@/pages/LeadsPage";
import CustomersPage from "@/pages/CustomersPage";
import ProjectsPage from "@/pages/ProjectsPage";
import ContractsPage from "@/pages/ContractsPage";
import KPIPage from "@/pages/KPIPage";
import ReportsPage from "@/pages/ReportsPage";
import AutomationPage from "@/pages/AutomationPage";
import AIAssistantPage from "@/pages/AIAssistantPage";
import SettingsPage from "@/pages/SettingsPage";
// Omnichannel Pages (Legacy)
import ChannelsPage from "@/pages/ChannelsPage";
import ContentCalendarPage from "@/pages/ContentCalendarPage";
import ResponseTemplatesPage from "@/pages/ResponseTemplatesPage";
import DistributionRulesPage from "@/pages/DistributionRulesPage";
// Marketing V2 Pages - Prompt 13/20
import ChannelsPageV2 from "@/pages/marketing/ChannelsPageV2";
import ContentCalendarPageV2 from "@/pages/marketing/ContentCalendarPageV2";
import ResponseTemplatesPageV2 from "@/pages/marketing/ResponseTemplatesPageV2";
import FormsPage from "@/pages/marketing/FormsPage";
import AttributionPage from "@/pages/marketing/AttributionPage";
// HRM Pages
import OrganizationPage from "@/pages/OrganizationPage";
import JobPositionsPage from "@/pages/JobPositionsPage";
import CollaboratorsPage from "@/pages/CollaboratorsPage";
// Finance Pages
import {
  FinanceDashboardPage,
  RevenuePage,
  ExpensePage,
  InvoicePage,
  ContractPage as FinanceContractPage,
  TaxReportPage,
  BudgetPage,
  CommissionPage,
  SalaryPage,
  SalesTargetPage,
  DebtPage,
  ForecastPage,
  BankAccountPage,
  // NEW Finance System - Payment, Commission Engine, Payout, Tax
  FinanceDashboard,
  ReceivablesPage,
  PayoutsPage,
  CommissionsPage,
  ProjectCommissionsPage,
} from "@/pages/Finance";
// HRM Advanced Pages
import {
  LaborContractPage,
  RecruitmentPage,
  TrainingPage,
  InternalMessagingPage,
  CompanyCulturePage,
  CareerPathPage,
  CompetitionPage,
} from "@/pages/HRM";
import TrainingHubPage from "@/pages/HRM/TrainingHubPage";
import NotificationCenterPage from "@/pages/NotificationCenterPage";
import AppSettingsPage from "@/pages/AppSettingsPage";
// Phase D — AI Features
import AIDashboardPage  from "@/pages/AI/AIDashboardPage";
import AIValuationPage  from "@/pages/AI/AIValuationPage";
import AIChatPage       from "@/pages/AI/AIChatPage";
import AILeadDistributionPage from "@/pages/AI/AILeadDistributionPage";
import DeveloperPortalPage from "@/pages/Developer/DeveloperPortalPage";
import SystemHealthPage from "@/pages/Admin/SystemHealthPage";
// HR Profile 360° Module
import HRDashboardPage from "@/pages/HR/HRDashboardPage";
import EmployeeListPage from "@/pages/HR/EmployeeListPage";
import BODDashboardPage from "@/pages/BOD/BODDashboardPage";
import ProjectDirectorDashboard from "@/pages/Projects/ProjectDirectorDashboard";
import SalesSupportDashboard from "@/pages/SalesSupport/SalesSupportDashboard";
import ContentDashboard from "@/pages/Content/ContentDashboard";
import EmployeeDetailPage from "@/pages/HR/EmployeeDetailPage";
import NewEmployeePage from "@/pages/HR/NewEmployeePage";
// Payroll & Workforce Module - Phase 1
import {
  PayrollDashboardPage,
  PayrollListPage,
  PayrollDetailPage,
  AttendancePage,
  LeavePage,
  MySalaryPage,
  MonthlySummaryPage,
  PayrollRulesPage,
  PayrollAuditPage,
} from "@/pages/Payroll";
// Dashboard Pages
import { 
  HRDashboard, 
  SalesDashboard, 
  TaskDashboard,
  LegalDashboard,
  DataDashboard,
  OmnichannelDashboard,
  CustomersDashboard,
  ProductsDashboard,
  AutomationDashboard,
  ManagerDashboardPage,
} from "@/pages/Dashboard";
// Tasks Pages
import { TasksPage, KanbanPage, CalendarPage, RemindersPage } from "@/pages/Tasks";
// Sales Pages
import {
  CampaignsPage,
  ProductsPage,
  BookingsPage,
  DealsPage,
  SalesMyTeamPage,
  SalesProductCenterPage,
  SalesChannelCenterPage,
  SalesFinanceCenterPage,
  SalesKnowledgeCenterPage,
  SalesContractsPage,
  SalesDocumentHubPage,
} from "@/pages/Sales";
// Legal Pages
import { LegalContractsPage, LicensesPage, CompliancePage, RegulationsPage } from "@/pages/Legal";
// Data Pages
import { AnalyticsPage, MarketPage, TrendsPage, DataManagementPage } from "@/pages/Data";
// Analytics - Executive Dashboard (Prompt 16/20)
import ExecutiveDashboard from "@/pages/analytics/ExecutiveDashboard";
// Admin Tools
import VideoEditorTool from "@/pages/Admin/VideoEditorTool";
import AdminProjectsPage from "@/pages/Admin/AdminProjectsPage";
import MasterOverviewDashboard from "@/pages/Admin/MasterOverviewDashboard";
import AdminCareersPage from "@/pages/Admin/AdminCareersPage";
import AdminNewsPage from "@/pages/Admin/AdminNewsPage";
import AdminTestimonialsPage from "@/pages/Admin/AdminTestimonialsPage";
import AdminPartnersPage from "@/pages/Admin/AdminPartnersPage";
import ContentAnalyticsDashboard from "@/pages/Admin/ContentAnalyticsDashboard";
import AdminNotificationsPage from "@/pages/Admin/AdminNotificationsPage";
import AdminSEOPage from "@/pages/Admin/AdminSEOPage";
import AdminRankPage from "@/pages/Admin/AdminRankPage";
import TransformationBlueprintPage from "@/pages/Admin/TransformationBlueprintPage";
import DataFoundationPage from "@/pages/Admin/DataFoundationPage";
import StatusModelPage from "@/pages/Admin/StatusModelPage";
import ApprovalMatrixPage from "@/pages/Admin/ApprovalMatrixPage";
import AuditTimelineFoundationPage from "@/pages/Admin/AuditTimelineFoundationPage";
import GovernanceConsolePage from "@/pages/Admin/GovernanceConsolePage";
import RoleWorkspacePage from "@/pages/RoleWorkspacePage";
import MyProfilePage from "@/pages/MyProfilePage";
import EntityGovernanceMappingPage from "@/pages/Admin/EntityGovernanceMappingPage";
import GovernanceCoveragePage from "@/pages/Admin/GovernanceCoveragePage";
import GovernanceRemediationPage from "@/pages/Admin/GovernanceRemediationPage";
import GovernanceChangeManagementPage from "@/pages/Admin/GovernanceChangeManagementPage";
// Dynamic Data Foundation - Prompt 3/20
import MasterDataPage from "@/pages/Admin/MasterDataPage";
import EntitySchemasPage from "@/pages/Admin/EntitySchemasPage";
// Organization & Permission Foundation - Prompt 4/20
import OrganizationManagementPage from "@/pages/Admin/OrganizationManagementPage";
import RolesPermissionsPage from "@/pages/Admin/RolesPermissionsPage";
import DashboardArchitecturePage from "@/pages/Admin/DashboardArchitecturePage";
import UserManagementPage from "@/pages/Admin/UserManagementPage";
import PlatformSurfaceStrategyPage from "@/pages/Admin/PlatformSurfaceStrategyPage";
import PlatformLaunchScopePage from "@/pages/Admin/PlatformLaunchScopePage";
import PlatformNavigationSplitPage from "@/pages/Admin/PlatformNavigationSplitPage";
import PlatformScreenStandardsPage from "@/pages/Admin/PlatformScreenStandardsPage";
import PlatformAppShellPage from "@/pages/Admin/PlatformAppShellPage";
import PlatformWebShellPage from "@/pages/Admin/PlatformWebShellPage";
import PlatformApiPermissionPage from "@/pages/Admin/PlatformApiPermissionPage";
import PlatformFieldValidationPage from "@/pages/Admin/PlatformFieldValidationPage";
import PlatformFinalGoLivePage from "@/pages/Admin/PlatformFinalGoLivePage";
import GoLiveValidationPage from "@/pages/Admin/GoLiveValidationPage";
import GoLiveBackendContractsPage from "@/pages/Admin/GoLiveBackendContractsPage";
import GoLiveActionPermissionsPage from "@/pages/Admin/GoLiveActionPermissionsPage";
import GoLiveFoundationBaselinePage from "@/pages/Admin/GoLiveFoundationBaselinePage";
import { PermissionProvider } from "@/contexts/PermissionContext";
// Inventory Foundation - Prompt 5/20
import { ProductInventoryPage } from "@/pages/Inventory";
import PriceListsPage from "@/pages/Inventory/PriceListsPage";
import PromotionsPage from "@/pages/Inventory/PromotionsPage";
// Agency & Distribution - UI Refactor
import { AgencyDashboard, AgencyListPage, AgencyDistributionPage, AgencyPerformancePage, AgencyNetworkPage } from "@/pages/Agency";
// Control Center - Alerts
import AlertsPage from "@/pages/Control/AlertsPage";
// CRM Unified Profile - Prompt 6/20
import { CRMDashboard, ContactsPage, LeadsPipelinePage, DemandsPage } from "@/pages/crm";
// Dynamic Form Renderer - Prompt 3/20 Phase 4
import DynamicLeadFormPage from "@/pages/crm/DynamicLeadFormPage";
import DynamicDealFormPage from "@/pages/crm/DynamicDealFormPage";
// Marketing Attribution - Prompt 7/20
import MarketingDashboard from "@/pages/marketing/MarketingDashboard";
import LeadSourcesPage from "@/pages/marketing/LeadSourcesPage";
import CampaignsPage_Marketing from "@/pages/marketing/CampaignsPage";
import AssignmentRulesPage from "@/pages/marketing/AssignmentRulesPage";
// Sales Pipeline & Booking - Prompt 8/20
import { 
  NewSalesDashboard,
  DealPipelinePage,
  SoftBookingPage,
  HardBookingPage,
  SalesEventPage,
  PricingManagementPage,
  SalesWorkboardPage,
  PipelineKanbanPage,
  SalesFloorPlanPage,
  SalesProjectsPage,
} from "@/pages/Sales";
// Secondary Sales Module — Thứ cấp
import {
  SecondaryDashboard,
  SecondaryListingsPage,
  SecondaryValuationPage,
  SecondaryDealsPage,
  SecondaryTransferPage,
} from "@/pages/Secondary";
// Contract & Document Workflow - Prompt 9/20
import { ContractListPage, ContractDetailPage } from "@/pages/Contracts";
// Work OS - Prompt 10/20
import { DailyWorkboard, ManagerWorkload } from "@/pages/Work";
// Commission Engine - Prompt 11/20
import { MyIncomePage, CommissionPoliciesPage, CommissionApprovalsPage } from "@/pages/Commission";
// CMS Engine - Prompt 14/20
import { CMSDashboardPage, CMSPagesPage, CMSArticlesPage, CMSLandingPagesPage, CMSPublicProjectsPage } from "@/pages/cms";
// KPI & Performance Engine - Prompt 12/20
import { KPIDashboard, KPILeaderboard, KPITargets, MyPerformancePage, TeamKPIPage, KPIConfigPage } from "@/pages/KPI";
import MobileTeamMemberDetailPage from "@/pages/KPI/MobileTeamMemberDetailPage";
// Phase 3.5: Auto Recruitment + Onboarding Engine
import { 
  ApplicationPage, 
  VerificationPage, 
  ConsentPage, 
  TestPage, 
  ContractPage as RecruitmentContractPage, 
  StatusPage, 
  RecruitmentDashboardPage,
  LinkGeneratorPage
} from "@/pages/Recruitment";
// Phase 4: AI Email Automation System
import { 
  EmailDashboardPage, 
  EmailTemplatesPage, 
  EmailCampaignsPage, 
  EmailLogsPage,
  EmailJobsPage 
} from "@/pages/Email";
// Executive Control Center - Prompt 17/20
import ExecutiveControlCenter from "@/pages/ControlCenter/ExecutiveControlCenter";
// Website Pages
import { LandingPage, AboutPage, ProjectsListPage, ProjectDetailPage, ProjectLandingPage, ContactPage, CareersPage, NewsPage } from "@/pages/Website";
import NewsDetailPage from "@/pages/Website/NewsDetailPage";
import NewsListPage from "@/pages/Website/NewsListPage";
import CamNangPage from "@/pages/Website/CamNangPage";
import PrivacyPolicyPage from "@/pages/Website/PrivacyPolicyPage";
import TermsOfServicePage from "@/pages/Website/TermsOfServicePage";
import AppHomePage from "@/pages/App/AppHomePage";
import ReferralPage from "@/pages/Recruitment/ReferralPage";
import SalesProductCatalogPage from "@/pages/Sales/SalesProductCatalogPage";
import MobileContactsPage from "@/pages/App/MobileContactsPage";
import QuickAddContactPage from "@/pages/App/QuickAddContactPage";
import MobileLeadsPage from "@/pages/App/MobileLeadsPage";
import MobileCalendarPage from "@/pages/App/MobileCalendarPage";
import MobileBookingsPage from "@/pages/App/MobileBookingsPage";
import MobileIncomePage from "@/pages/App/MobileIncomePage";
import MobileKPIPage from "@/pages/App/MobileKPIPage";
import MobileLeaderboardPage from "@/pages/App/MobileLeaderboardPage";
// New role-specific mobile pages
import MobileAuditPage from "@/pages/App/MobileAuditPage";
import MobileSalesSupportPage from "@/pages/App/MobileSalesSupportPage";
import MobileProjectDirectorPage from "@/pages/App/MobileProjectDirectorPage";
import MobileApprovalsPage from "@/pages/App/MobileApprovalsPage";
import MobilePayrollPage from "@/pages/App/MobilePayrollPage";
import MobileKnowledgePage from "@/pages/App/MobileKnowledgePage";
import MobileCheckinPage from "@/pages/App/MobileCheckinPage";
import MobileContractSignPage from "@/pages/App/MobileContractSignPage";
import MobileRecruitmentPipelinePage from "@/pages/App/MobileRecruitmentPipelinePage";
import MobilePerformancePage from "@/pages/App/MobilePerformancePage";
import MobileRewardsPage from "@/pages/App/MobileRewardsPage";
import MobileOfficePage from "@/pages/App/MobileOfficePage";
import MobileInsidePage from "@/pages/App/MobileInsidePage";
import MobileWorkflowPage from "@/pages/App/MobileWorkflowPage";
import MobileSalesAIPage from "@/pages/App/MobileSalesAIPage";
import MobileFinanceReportPage from "@/pages/App/MobileFinanceReportPage";
import MobileAnalyticsPage from "@/pages/App/MobileAnalyticsPage";
import MobileBODRevenuePage from "@/pages/App/MobileBODRevenuePage";
import MobileBODSalesPage from "@/pages/App/MobileBODSalesPage";
import MobileBODOrgPage from "@/pages/App/MobileBODOrgPage";
import MobileBODKPIPage from "@/pages/App/MobileBODKPIPage";

import AppModulePage from "@/pages/App/AppModulePage";
import AppProfilePage from "@/pages/App/AppProfilePage";
// SEO Pages
import { SEOLandingPage, SEOBlogPage } from "@/pages/SEO";
// Leasing Pages (Port from ProLeazing)
import LeasingDashboardPage from "@/pages/Leasing/LeasingDashboardPage";
import LeasingAssetsPage from "@/pages/Leasing/LeasingAssetsPage";
import LeasingContractsPage from "@/pages/Leasing/LeasingContractsPage";
import LeasingMaintenancePage from "@/pages/Leasing/LeasingMaintenancePage";
import LeasingInvoicesPage from "@/pages/Leasing/LeasingInvoicesPage";
import { Toaster } from "sonner";
import { getRoleGoLiveHomePath, isPathInRoleGoLiveScope } from "@/config/roleDashboardSpec";
import { canRoleAccessPath } from "@/config/goLiveActionPermissions";

function GoLiveScopeLayout() {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading || !isAuthenticated || !user?.role) {
    return <MainLayout />;
  }

  if (!isPathInRoleGoLiveScope(user.role, location.pathname)) {
    return <Navigate to={getRoleGoLiveHomePath(user.role)} replace />;
  }

  if (!canRoleAccessPath(user.role, location.pathname)) {
    return <Navigate to={getRoleGoLiveHomePath(user.role)} replace />;
  }

  return <MainLayout />;
}

// ─── Native App Entry Redirect ───────────────────────────────────────────────
// Khi chạy trong Capacitor (iOS/Android): vào /login → dashboard
// Khi chạy trên web browser: vào /home (trang marketing)
function NativeRedirect() {
  const isNative = !!(window.Capacitor?.isNativePlatform?.() ||
    window.location.protocol === 'capacitor:' ||
    navigator.userAgent.includes('ProHouze'));
  return <Navigate to={isNative ? "/login" : "/home"} replace />;
}

// ─── Platform-aware Route ─────────────────────────────────────────────────────
// Phân luồng: iOS app (Capacitor) → mobile component; Web browser → desktop component
function PlatformRoute({ mobile: Mobile, desktop: Desktop }) {
  const isNative = !!(window.Capacitor?.isNativePlatform?.() ||
    window.location.protocol === 'capacitor:' ||
    navigator.userAgent.includes('ProHouze'));
  return isNative ? <Mobile /> : <Desktop />;
}

function App() {
  // C1+C2 — Native platform bootstrap
  useEffect(() => {
    applySafeAreaCSS();
    const cleanupKeyboard = setupKeyboardHandlers();

    // E4 — Analytics init (deferred)
    initAnalytics().catch(() => {});
    initWebVitals().catch(() => {});

    // E9 — Service Worker (production only)
    registerServiceWorker().catch(() => {});

    // E10 — Network status listener
    const handleOnline  = () => Analytics.featureUsed('reconnected');
    const handleOffline = () => console.warn('[App] Network offline');
    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      cleanupKeyboard?.();
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <HelmetProvider>
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <PermissionProvider>
            <MasterDataProvider>
              <BrowserRouter>
              <Routes>
              {/* ============================================ */}
              {/* PUBLIC ROUTES - Website & Auth */}
              {/* ============================================ */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              {/* Màn hình chọn mảng sau đăng nhập */}
              <Route path="/select-module" element={<ModuleSelectPage />} />
              {/* Phase A — Notification & Settings */}
              <Route path="/notifications" element={<NotificationCenterPage />} />
              <Route path="/settings/app" element={<AppSettingsPage />} />
              
              {/* Website Public Routes */}
              <Route path="/home" element={<LandingPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/du-an" element={<ProjectsListPage />} />
              <Route path="/du-an/:projectId" element={<ProjectLandingPage />} />
              <Route path="/projects" element={<ProjectsListPage />} />
              <Route path="/projects/:projectId" element={<ProjectLandingPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/careers" element={<CareersPage />} />
              <Route path="/news" element={<NewsListPage />} />
              <Route path="/cam-nang" element={<CamNangPage />} />
              <Route path="/blog" element={<NewsListPage />} />
              <Route path="/news/:newsId" element={<NewsDetailPage />} />
              <Route path="/cam-nang/:newsId" element={<NewsDetailPage />} />
              <Route path="/services" element={<LandingPage />} />
              <Route path="/privacy" element={<PrivacyPolicyPage />} />
              <Route path="/terms" element={<TermsOfServicePage />} />
              <Route path="/chinh-sach-bao-mat" element={<PrivacyPolicyPage />} />
              <Route path="/dieu-khoan" element={<TermsOfServicePage />} />
              
              {/* Phase 3.5: Recruitment Public Routes */}
              <Route path="/recruitment/apply" element={<ApplicationPage />} />
              <Route path="/recruitment/verify" element={<VerificationPage />} />
              <Route path="/recruitment/consent" element={<ConsentPage />} />
              <Route path="/recruitment/test" element={<TestPage />} />
              <Route path="/recruitment/contract" element={<RecruitmentContractPage />} />
              <Route path="/recruitment/status" element={<StatusPage />} />
              
              {/* P84: SEO Dynamic Pages - Clean URLs */}
              <Route path="/blog/:slug" element={<SEOBlogPage />} />
              
              {/* ============================================ */}
              {/* PROTECTED ROUTES - CRM Application */}
              {/* ============================================ */}
              <Route element={<AppSurfaceLayout />}>
                <Route path="/app" element={<AppHomePage />} />
                <Route path="/app/ho-so" element={<AppProfilePage />} />
                {/* Tab Tôi */}
                <Route path="/profile" element={<AppProfilePage />} />
                <Route path="/app/:sectionKey" element={<AppModulePage />} />
                {/* Sprint 1: Giỏ hàng sơ cấp */}
                <Route path="/sales/catalog" element={<SalesProductCatalogPage />} />
                {/* Document Hub — Thư viện tài liệu và gửi khách */}
                <Route path="/sales/documents" element={<SalesDocumentHubPage />} />
                {/* Sprint 1: Affiliate tuyển dụng */}
                <Route path="/recruitment/referral" element={<ReferralPage />} />
                {/* Mobile-native CRM pages */}
                <Route path="/crm/contacts" element={<MobileContactsPage />} />
                <Route path="/crm/contacts/new" element={<QuickAddContactPage />} />
                <Route path="/crm/leads" element={<MobileLeadsPage />} />
                {/* Mobile-native Work/Finance/KPI pages */}
                <Route path="/work/calendar" element={<MobileCalendarPage />} />
                <Route path="/sales/bookings" element={<MobileBookingsPage />} />
                <Route path="/finance/my-income" element={<MobileIncomePage />} />
                <Route path="/sales/kpi" element={<MobileKPIPage />} />
                <Route path="/kpi/leaderboard" element={<MobileLeaderboardPage />} />
                {/* Audit (Ban Kiểm soát / HĐQT) */}
                <Route path="/audit/finance" element={<MobileAuditPage />} />
                <Route path="/audit/hr" element={<MobileAuditPage />} />
                <Route path="/audit/reports" element={<MobileAuditPage />} />
                <Route path="/audit/overview" element={<MobileAuditPage />} />
                {/* ── Base-inspired modules (Phase 1) ──────────────── */}
                <Route path="/app/approvals" element={<MobileApprovalsPage />} />
                <Route path="/app/payroll" element={<MobilePayrollPage />} />
                <Route path="/app/knowledge" element={<MobileKnowledgePage />} />
                {/* ── Base-inspired modules (Phase 2) ──────────────── */}
                <Route path="/app/checkin" element={<MobileCheckinPage />} />
                <Route path="/app/contracts/sign" element={<MobileContractSignPage />} />
                <Route path="/app/recruitment" element={<MobileRecruitmentPipelinePage />} />
                <Route path="/app/performance" element={<MobilePerformancePage />} />
                {/* ── Base-inspired modules (Phase 3) ──────────────── */}
                <Route path="/app/rewards" element={<MobileRewardsPage />} />
                <Route path="/app/office" element={<MobileOfficePage />} />
                <Route path="/app/inside" element={<MobileInsidePage />} />
                {/* ── Extended modules (A/B/C) ────────────────────── */}
                <Route path="/app/ai-sales" element={<MobileSalesAIPage />} />
                <Route path="/app/workflow" element={<MobileWorkflowPage />} />
                <Route path="/app/finance-report" element={<MobileFinanceReportPage />} />

                {/* ── Mobile-first cross-role routes ───────────────── */}
                {/* KPI — Manager / BOD / HR / Project Director */}
                <Route path="/kpi/team" element={<TeamKPIPage />} />
                <Route path="/kpi/team/member/:memberId" element={<MobileTeamMemberDetailPage />} />

                {/* Analytics — BOD / Manager / Marketing / Finance */}
                {/* PlatformRoute: iOS app → Mobile UI | Web browser → Desktop UI */}
                <Route path="/analytics/executive" element={<PlatformRoute mobile={MobileAnalyticsPage} desktop={ExecutiveDashboard} />} />
                <Route path="/analytics/reports" element={<PlatformRoute mobile={MobileAnalyticsPage} desktop={ReportsPage} />} />
                <Route path="/analytics/content" element={<PlatformRoute mobile={MobileAnalyticsPage} desktop={ContentAnalyticsDashboard} />} />
                {/* CEO Detail Pages */}
                <Route path="/app/bod/revenue" element={<MobileBODRevenuePage />} />
                <Route path="/app/bod/sales" element={<MobileBODSalesPage />} />
                <Route path="/app/bod/org" element={<MobileBODOrgPage />} />
                <Route path="/app/bod/kpi" element={<MobileBODKPIPage />} />

                {/* CMS — Content / Marketing / Admin */}
                <Route path="/cms/articles" element={<CMSArticlesPage />} />
                <Route path="/cms/news" element={<AdminNewsPage />} />
                <Route path="/cms/media" element={<CMSPublicProjectsPage />} />

                {/* Marketing — Marketing role */}
                <Route path="/marketing/campaigns" element={<CampaignsPage_Marketing />} />
                <Route path="/communications/channels" element={<ChannelsPageV2 />} />

                {/* Work — Manager / BOD  */}
                <Route path="/work/manager" element={<ManagerWorkload />} />
              </Route>

              <Route element={<GoLiveScopeLayout />}>
                {/* ------------------------------------------ */}
                {/* DASHBOARD - Main Overview */}
                {/* ------------------------------------------ */}
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/workspace" element={<RoleWorkspacePage />} />
                <Route path="/me" element={<MyProfilePage />} />
                
                {/* ------------------------------------------ */}
                {/* CRM - Customer Relationship Management */}
                {/* New CRM Module - Prompt 6/20 */}
                {/* ------------------------------------------ */}
                <Route path="/crm" element={<CRMDashboard />} />
                <Route path="/crm/contacts" element={<ContactsPage />} />
                <Route path="/crm/customers" element={<CustomersPage />} />
                <Route path="/crm/leads" element={<LeadsPipelinePage />} />
                <Route path="/crm/leads/new" element={<DynamicLeadFormPage />} />
                <Route path="/leads/new" element={<DynamicLeadFormPage />} />
                <Route path="/crm/demands" element={<DemandsPage />} />
                <Route path="/crm/collaborators" element={<CollaboratorsPage />} />
                {/* Legacy routes (backward compatibility) */}
                <Route path="/leads" element={<LeadsPipelinePage />} />
                <Route path="/customers" element={<ContactsPage />} />
                <Route path="/collaborators" element={<CollaboratorsPage />} />
                
                {/* ------------------------------------------ */}
                {/* MARKETING - Lead Source & Attribution */}
                {/* New Marketing Module - Prompt 7/20 */}
                {/* ------------------------------------------ */}
                <Route path="/marketing" element={<MarketingDashboard />} />
                <Route path="/marketing/sources" element={<LeadSourcesPage />} />
                <Route path="/marketing/campaigns" element={<CampaignsPage_Marketing />} />
                <Route path="/marketing/rules" element={<AssignmentRulesPage />} />
                
                {/* ------------------------------------------ */}
                {/* SALES - Pipeline & Operations */}
                {/* New Sales Module - Prompt 8/20 */}
                {/* ------------------------------------------ */}
                <Route path="/sales/dashboard" element={<NewSalesDashboard />} />
                <Route path="/sales/my-team" element={<SalesMyTeamPage />} />
                <Route path="/sales/product-center" element={<SalesProductCenterPage />} />
                <Route path="/sales/channel-center" element={<SalesChannelCenterPage />} />
                <Route path="/sales/finance-center" element={<SalesFinanceCenterPage />} />
                <Route path="/sales/knowledge-center" element={<SalesKnowledgeCenterPage />} />
                <Route path="/sales/pipeline" element={<DealPipelinePage />} />
                <Route path="/sales/kanban" element={<PipelineKanbanPage />} />
                <Route path="/sales/deals/new" element={<DynamicDealFormPage />} />
                <Route path="/sales/soft-bookings" element={<SoftBookingPage />} />
                <Route path="/sales/soft-booking" element={<SoftBookingPage />} />
                <Route path="/sales/hard-bookings" element={<HardBookingPage />} />
                <Route path="/sales/hard-booking" element={<HardBookingPage />} />
                <Route path="/sales/events" element={<SalesEventPage />} />
                <Route path="/sales/pricing" element={<PricingManagementPage />} />
                {/* TASK 1 - Sales Working Interface */}
                <Route path="/sales/workboard" element={<SalesWorkboardPage />} />
                <Route path="/sales/my-inventory" element={<SalesWorkboardPage />} />
                {/* Sơ cấp – Bảng giá & Sơ đồ căn hộ */}
                <Route path="/sales/floor-plan" element={<SalesFloorPlanPage />} />
                <Route path="/sales/products/floor-plan" element={<SalesFloorPlanPage />} />
                {/* Sơ cấp – Trang dự án + iPad Presentation Mode */}
                <Route path="/sales/projects" element={<SalesProjectsPage />} />
                {/* ------------------------------------------ */}
                {/* THỨ CẤP — Secondary Sales Module */}
                {/* ------------------------------------------ */}
                <Route path="/secondary" element={<SecondaryDashboard />} />
                <Route path="/secondary/dashboard" element={<SecondaryDashboard />} />
                <Route path="/secondary/listings" element={<SecondaryListingsPage />} />
                <Route path="/secondary/listings/new" element={<SecondaryListingsPage />} />
                <Route path="/secondary/listings/:id/edit" element={<SecondaryListingsPage />} />
                <Route path="/secondary/valuation" element={<SecondaryValuationPage />} />
                <Route path="/secondary/deals" element={<SecondaryDealsPage />} />
                <Route path="/secondary/deals/new" element={<SecondaryDealsPage />} />
                <Route path="/secondary/deals/:id" element={<SecondaryDealsPage />} />
                <Route path="/secondary/transfer" element={<SecondaryTransferPage />} />
                <Route path="/secondary/commission" element={<SecondaryDashboard />} />
                {/* Legacy Sales routes */}
                <Route path="/sales" element={<NewSalesDashboard />} />
                <Route path="/sales/deals" element={<DealPipelinePage />} />
                <Route path="/deals" element={<DealPipelinePage />} />
                <Route path="/sales/bookings" element={<SoftBookingPage />} />
                <Route path="/sales/contracts" element={<SalesContractsPage />} />
                <Route path="/sales/kpi" element={<KPIDashboard />} />
                <Route path="/sales/kpi/leaderboard" element={<KPILeaderboard />} />
                <Route path="/sales/kpi/targets" element={<KPITargets />} />
                <Route path="/sales/campaigns" element={<CampaignsPage />} />
                {/* Legacy routes */}
                <Route path="/contracts" element={<ContractListPage />} />
                <Route path="/contracts/pending" element={<ContractListPage />} />
                <Route path="/contracts/:id" element={<ContractDetailPage />} />
                <Route path="/kpi" element={<KPIDashboard />} />
                <Route path="/kpi/leaderboard" element={<KPILeaderboard />} />
                <Route path="/kpi/targets" element={<KPITargets />} />
                {/* Phase 2: Real Estate KPI Engine */}
                <Route path="/kpi/my-performance" element={<MyPerformancePage />} />
                <Route path="/kpi/team" element={<TeamKPIPage />} />
                <Route path="/kpi/config" element={<KPIConfigPage />} />
                <Route path="/dashboard/sales" element={<NewSalesDashboard />} />
                
                {/* ------------------------------------------ */}
                {/* INVENTORY - Projects & Products */}
                {/* New canonical routes */}
                {/* ------------------------------------------ */}
                <Route path="/inventory" element={<ProductsDashboard />} />
                <Route path="/inventory/projects" element={<AdminProjectsPage />} />
                <Route path="/inventory/products" element={<ProductsPage />} />
                <Route path="/inventory/campaigns" element={<CampaignsPage />} />
                {/* Prompt 5/20: New Inventory Management */}
                <Route path="/inventory/stock" element={<ProductInventoryPage />} />
                <Route path="/inventory/handover" element={<ProductInventoryPage />} />
                <Route path="/inventory/price-lists" element={<PriceListsPage />} />
                <Route path="/inventory/promotions" element={<PromotionsPage />} />
                {/* Legacy routes */}
                <Route path="/sales/products" element={<ProductsPage />} />
                <Route path="/dashboard/products" element={<ProductsDashboard />} />
                
                {/* ------------------------------------------ */}
                {/* AGENCY & DISTRIBUTION - Đại lý và phân phối */}
                {/* UI Refactor - 15 Modules */}
                {/* ------------------------------------------ */}
                <Route path="/agency" element={<AgencyDashboard />} />
                <Route path="/agency/list" element={<AgencyListPage />} />
                <Route path="/agency/distribution" element={<AgencyDistributionPage />} />
                <Route path="/agency/performance" element={<AgencyPerformancePage />} />
                <Route path="/agency/network" element={<AgencyNetworkPage />} />
                
                {/* ------------------------------------------ */}
                {/* BOD / Chủ tịch HĐQT */}
                <Route path="/bod/dashboard" element={<BODDashboardPage />} />
                {/* Project Director / Giám đốc Dự án */}
                <Route path="/project-director/dashboard" element={<ProjectDirectorDashboard />} />
                {/* Sales Support / Hỗ trợ nghiệp vụ */}
                <Route path="/sales-support/dashboard" element={<SalesSupportDashboard />} />
                {/* Content / CMS */}
                <Route path="/content/dashboard" element={<ContentDashboard />} />
                {/* FINANCE - Financial Management */}
                {/* ------------------------------------------ */}
                <Route path="/finance" element={<FinanceDashboardPage />} />
                <Route path="/finance/revenue" element={<RevenuePage />} />
                <Route path="/finance/expense" element={<ExpensePage />} />
                <Route path="/finance/expenses" element={<ExpensePage />} />
                <Route path="/finance/transactions" element={<RevenuePage />} />
                <Route path="/finance/payments" element={<PayoutsPage />} />
                <Route path="/finance/reports" element={<ReportsPage />} />
                <Route path="/finance/invoices" element={<InvoicePage />} />
                <Route path="/finance/contracts" element={<FinanceContractPage />} />
                <Route path="/finance/tax" element={<TaxReportPage />} />
                <Route path="/finance/budget" element={<BudgetPage />} />
                <Route path="/finance/commission" element={<CommissionPage />} />
                <Route path="/finance/commissions" element={<CommissionPage />} />
                <Route path="/commission" element={<CommissionsPage />} />
                <Route path="/finance/my-income" element={<MyIncomePage />} />
                <Route path="/finance/commission/policies" element={<CommissionPoliciesPage />} />
                <Route path="/finance/commission/approvals" element={<CommissionApprovalsPage />} />
                <Route path="/finance/salary" element={<SalaryPage />} />
                <Route path="/finance/sales-target" element={<SalesTargetPage />} />
                <Route path="/finance/debt" element={<DebtPage />} />
                <Route path="/finance/forecast" element={<ForecastPage />} />
                <Route path="/finance/bank-accounts" element={<BankAccountPage />} />
                
                {/* NEW Finance System - Payment, Commission Engine, Payout, Tax */}
                <Route path="/finance/overview" element={<FinanceDashboard />} />
                <Route path="/finance/receivables" element={<ReceivablesPage />} />
                <Route path="/finance/payouts" element={<PayoutsPage />} />
                <Route path="/finance/commissions" element={<CommissionsPage />} />
                <Route path="/finance/project-commissions" element={<ProjectCommissionsPage />} />
                
                {/* ------------------------------------------ */}
                {/* HR - Human Resources */}
                {/* New canonical routes */}
                {/* ------------------------------------------ */}
                <Route path="/hr" element={<HRDashboardPage />} />
                <Route path="/hr/alerts" element={<HRDashboardPage />} />
                <Route path="/hr/employees" element={<EmployeeListPage />} />
                <Route path="/hr/employees/new" element={<NewEmployeePage />} />
                <Route path="/hr/employees/:profileId" element={<EmployeeDetailPage />} />
                <Route path="/hr/organization" element={<OrganizationPage />} />
                <Route path="/hr/teams" element={<OrganizationPage />} />
                <Route path="/hr/org-chart" element={<OrganizationPage />} />
                <Route path="/hr/positions" element={<JobPositionsPage />} />
                <Route path="/hr/recruitment" element={<RecruitmentPage />} />
                <Route path="/hr/training" element={<TrainingPage />} />
                <Route path="/hr/training/courses" element={<TrainingPage />} />
                <Route path="/training" element={<TrainingPage />} />
                <Route path="/training/courses" element={<TrainingPage />} />
                <Route path="/hr/contracts" element={<LaborContractPage />} />
                <Route path="/hr/messages" element={<InternalMessagingPage />} />
                <Route path="/hr/culture" element={<CompanyCulturePage />} />
                {/* Legacy routes */}
                <Route path="/organization" element={<OrganizationPage />} />
                <Route path="/job-positions" element={<JobPositionsPage />} />
                <Route path="/hrm/contracts" element={<LaborContractPage />} />
                <Route path="/hrm/recruitment" element={<RecruitmentPage />} />
                <Route path="/hrm/training" element={<TrainingPage />} />
                <Route path="/hrm/messages" element={<InternalMessagingPage />} />
                <Route path="/hrm/culture" element={<CompanyCulturePage />} />
                {/* Đào tạo & Phát triển nhân sự */}
                <Route path="/hrm/career-path" element={<CareerPathPage />} />
                <Route path="/hrm/competition" element={<CompetitionPage />} />
                <Route path="/hrm/training-hub" element={<TrainingHubPage />} />
                <Route path="/dashboard/hr" element={<HRDashboardPage />} />

                {/* ─────────────────────────────────────── */}
                {/* PHASE D — AI FEATURES                  */}
                {/* ─────────────────────────────────────── */}
                <Route path="/ai"              element={<AIDashboardPage />} />
                <Route path="/ai/valuation"    element={<AIValuationPage />} />
                <Route path="/ai/chat"         element={<AIChatPage />} />
                <Route path="/ai/lead-distribution" element={<AILeadDistributionPage />} />
                {/* D2/D4/D6/D7/D8/D9 — Sử dụng AIDashboardPage + modals */}
                <Route path="/ai/lead-scoring" element={<AILeadDistributionPage />} />
                <Route path="/ai/deal-advisor" element={<AIDashboardPage />} />
                <Route path="/ai/content"      element={<AIDashboardPage />} />
                {/* Developer Portal */}
                <Route path="/developer" element={<DeveloperPortalPage />} />
                <Route path="/developer/portal" element={<DeveloperPortalPage />} />
                <Route path="/ai/recommend"    element={<AIDashboardPage />} />
                <Route path="/ai/kpi-coaching" element={<AIDashboardPage />} />
                <Route path="/ai/sentiment"    element={<AIDashboardPage />} />

                {/* ─────────────────────────────────────── */}
                {/* PHASE F — MONITORING                   */}
                {/* ─────────────────────────────────────── */}
                <Route path="/admin/system-health" element={<SystemHealthPage />} />

                {/* ------------------------------------------ */}
                {/* PAYROLL - Payroll & Workforce Management */}
                {/* Phase 1 of HR AI Platform */}
                {/* ------------------------------------------ */}
                <Route path="/payroll" element={<PayrollDashboardPage />} />
                <Route path="/payroll/payrolls" element={<PayrollListPage />} />
                <Route path="/payroll/detail/:payrollId" element={<PayrollDetailPage />} />
                <Route path="/payroll/attendance" element={<AttendancePage />} />
                <Route path="/payroll/shifts" element={<AttendancePage />} />
                <Route path="/payroll/leave" element={<LeavePage />} />
                <Route path="/payroll/salary" element={<MySalaryPage />} />
                <Route path="/payroll/summary" element={<MonthlySummaryPage />} />
                <Route path="/payroll/rules" element={<PayrollRulesPage />} />
                <Route path="/payroll/audit" element={<PayrollAuditPage />} />
                
                {/* ------------------------------------------ */}
                {/* RECRUITMENT - Phase 3.5 Auto Recruitment */}
                {/* ------------------------------------------ */}
                <Route path="/recruitment" element={<RecruitmentDashboardPage />} />
                <Route path="/recruitment/dashboard" element={<RecruitmentDashboardPage />} />
                <Route path="/recruitment/link" element={<LinkGeneratorPage />} />
                
                {/* ------------------------------------------ */}
                {/* EMAIL AUTOMATION - Phase 4 AI Email System */}
                {/* ------------------------------------------ */}
                <Route path="/email" element={<EmailDashboardPage />} />
                <Route path="/email/dashboard" element={<EmailDashboardPage />} />
                <Route path="/email/templates" element={<EmailTemplatesPage />} />
                <Route path="/email/campaigns" element={<EmailCampaignsPage />} />
                <Route path="/email/logs" element={<EmailLogsPage />} />
                <Route path="/email/jobs" element={<EmailJobsPage />} />
                
                {/* ------------------------------------------ */}
                {/* LEGAL - Legal & Compliance */}
                {/* New canonical routes */}
                {/* ------------------------------------------ */}
                <Route path="/legal" element={<LegalDashboard />} />
                <Route path="/legal/contracts" element={<LegalContractsPage />} />
                <Route path="/legal/documents" element={<LegalContractsPage />} />
                <Route path="/legal/licenses" element={<LicensesPage />} />
                <Route path="/legal/compliance" element={<CompliancePage />} />
                <Route path="/legal/approvals" element={<CompliancePage />} />
                <Route path="/legal/regulations" element={<RegulationsPage />} />
                {/* Legacy */}
                <Route path="/dashboard/legal" element={<LegalDashboard />} />
                
                {/* ------------------------------------------ */}
                {/* WORK - Tasks & Collaboration */}
                {/* New canonical routes - Prompt 10/20 Work OS */}
                {/* ------------------------------------------ */}
                <Route path="/work" element={<DailyWorkboard />} />
                <Route path="/work/my-day" element={<DailyWorkboard />} />
                <Route path="/work/manager" element={<ManagerWorkload />} />
                <Route path="/work/tasks" element={<TasksPage />} />
                <Route path="/work/kanban" element={<KanbanPage />} />
                <Route path="/work/calendar" element={<CalendarPage />} />
                <Route path="/work/reminders" element={<RemindersPage />} />
                {/* Legacy routes */}
                <Route path="/tasks" element={<TasksPage />} />
                <Route path="/tasks/kanban" element={<KanbanPage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/reminders" element={<RemindersPage />} />
                <Route path="/dashboard/tasks" element={<TaskDashboard />} />
                
                {/* ------------------------------------------ */}
                {/* MARKETING - Omnichannel Marketing */}
                {/* New canonical routes */}
                {/* ------------------------------------------ */}
                {/* ------------------------------------------ */}
                {/* COMMUNICATIONS - Content & Social (Renamed from Marketing Omnichannel) */}
                {/* Updated to use Marketing V2 API - Prompt 13/20 */}
                {/* ------------------------------------------ */}
                <Route path="/communications" element={<OmnichannelDashboard />} />
                <Route path="/communications/channels" element={<ChannelsPageV2 />} />
                <Route path="/communications/content" element={<ContentCalendarPageV2 />} />
                <Route path="/communications/templates" element={<ResponseTemplatesPageV2 />} />
                <Route path="/communications/forms" element={<FormsPage />} />
                <Route path="/communications/attribution" element={<AttributionPage />} />
                <Route path="/communications/automation" element={<AutomationPage />} />
                {/* Legacy/redirect routes for old marketing/omnichannel */}
                <Route path="/marketing/channels" element={<ChannelsPageV2 />} />
                <Route path="/marketing/content" element={<ContentCalendarPageV2 />} />
                <Route path="/marketing/templates" element={<ResponseTemplatesPageV2 />} />
                <Route path="/marketing/forms" element={<FormsPage />} />
                <Route path="/marketing/attribution" element={<AttributionPage />} />
                <Route path="/marketing/distribution" element={<DistributionRulesPage />} />
                <Route path="/marketing/automation" element={<AutomationPage />} />
                <Route path="/channels" element={<ChannelsPageV2 />} />
                <Route path="/content-calendar" element={<ContentCalendarPageV2 />} />
                <Route path="/response-templates" element={<ResponseTemplatesPageV2 />} />
                <Route path="/forms" element={<FormsPage />} />
                <Route path="/attribution" element={<AttributionPage />} />
                <Route path="/distribution-rules" element={<DistributionRulesPage />} />
                <Route path="/automation" element={<AutomationPage />} />
                <Route path="/automation/rules" element={<AutomationPage />} />
                <Route path="/automation/logs" element={<AutomationPage />} />
                <Route path="/dashboard/omnichannel" element={<OmnichannelDashboard />} />
                <Route path="/dashboard/automation" element={<AutomationDashboard />} />
                
                {/* ------------------------------------------ */}
                {/* CONTROL CENTER - Executive Control Center */}
                {/* Prompt 17/20: Operating System for Real Estate Business */}
                {/* ------------------------------------------ */}
                <Route path="/control" element={<ExecutiveControlCenter />} />
                <Route path="/control/executive" element={<ExecutiveControlCenter />} />
                <Route path="/control/alerts" element={<AlertsPage />} />
                
                {/* ------------------------------------------ */}
                {/* MANAGER DASHBOARD - Task 4 */}
                {/* Manager Control: Dashboard, Inventory, Approvals */}
                {/* ------------------------------------------ */}
                <Route path="/manager" element={<ManagerDashboardPage />} />
                <Route path="/manager/dashboard" element={<ManagerDashboardPage />} />
                <Route path="/dashboard/manager" element={<ManagerDashboardPage />} />
                
                {/* ------------------------------------------ */}
                {/* ANALYTICS - Reports & Data */}
                {/* New canonical routes */}
                {/* ------------------------------------------ */}
                <Route path="/analytics" element={<DataDashboard />} />
                <Route path="/analytics/executive" element={<ExecutiveDashboard />} />
                <Route path="/analytics/reports" element={<ReportsPage />} />
                <Route path="/analytics/business" element={<AnalyticsPage />} />
                <Route path="/analytics/market" element={<MarketPage />} />
                <Route path="/analytics/trends" element={<TrendsPage />} />
                <Route path="/analytics/data" element={<DataManagementPage />} />
                <Route path="/analytics/content" element={<ContentAnalyticsDashboard />} />
                {/* Legacy routes */}
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/data/analytics" element={<AnalyticsPage />} />
                <Route path="/data/market" element={<MarketPage />} />
                <Route path="/data/trends" element={<TrendsPage />} />
                <Route path="/data/management" element={<DataManagementPage />} />
                <Route path="/dashboard/data" element={<DataDashboard />} />
                <Route path="/dashboard/customers" element={<CustomersDashboard />} />
                
                {/* ------------------------------------------ */}
                {/* TOOLS - AI & Utilities */}
                {/* New canonical routes */}
                {/* ------------------------------------------ */}
                <Route path="/tools/ai" element={<AIAssistantPage />} />
                <Route path="/tools/video" element={<VideoEditorTool />} />
                {/* Legacy routes */}
                <Route path="/ai-assistant" element={<AIAssistantPage />} />
                <Route path="/admin/video-editor" element={<VideoEditorTool />} />
                <Route path="/admin/overview" element={<MasterOverviewDashboard />} />
                <Route path="/admin" element={<MasterOverviewDashboard />} />
                <Route path="/admin/tenants" element={<OrganizationManagementPage />} />
                <Route path="/admin/logs" element={<AuditTimelineFoundationPage />} />
                
                {/* ------------------------------------------ */}
                {/* CMS - Website Content Management (Prompt 14/20) */}
                {/* New V2 canonical routes */}
                {/* ------------------------------------------ */}
                <Route path="/cms" element={<CMSDashboardPage />} />
                <Route path="/cms/settings" element={<SettingsPage />} />
                <Route path="/cms/media" element={<CMSPublicProjectsPage />} />
                <Route path="/cms/faqs" element={<CMSPagesPage />} />
                <Route path="/cms/pages" element={<CMSPagesPage />} />
                <Route path="/cms/articles" element={<CMSArticlesPage />} />
                <Route path="/cms/landing-pages" element={<CMSLandingPagesPage />} />
                <Route path="/cms/public-projects" element={<CMSPublicProjectsPage />} />
                {/* Legacy CMS routes */}
                <Route path="/cms/projects" element={<AdminProjectsPage />} />
                <Route path="/cms/news" element={<AdminNewsPage />} />
                <Route path="/cms/careers" element={<AdminCareersPage />} />
                <Route path="/cms/testimonials" element={<AdminTestimonialsPage />} />
                <Route path="/cms/partners" element={<AdminPartnersPage />} />
                <Route path="/cms/analytics" element={<ContentAnalyticsDashboard />} />
                <Route path="/cms/notifications" element={<AdminNotificationsPage />} />
                {/* Legacy routes */}
                <Route path="/admin/projects" element={<AdminProjectsPage />} />
                <Route path="/admin/careers" element={<AdminCareersPage />} />
                <Route path="/admin/news" element={<AdminNewsPage />} />
                <Route path="/admin/testimonials" element={<AdminTestimonialsPage />} />
                <Route path="/admin/partners" element={<AdminPartnersPage />} />
                <Route path="/admin/content-analytics" element={<ContentAnalyticsDashboard />} />
                <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
                <Route path="/admin/seo" element={<AdminSEOPage />} />
                <Route path="/admin/seo/rank" element={<AdminRankPage />} />
                
                {/* ------------------------------------------ */}
                {/* SETTINGS - System Configuration */}
                {/* ------------------------------------------ */}
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/settings/integrations" element={<GoLiveBackendContractsPage />} />
                <Route path="/settings/governance" element={<GovernanceConsolePage />} />
                <Route path="/settings/governance-coverage" element={<GovernanceCoveragePage />} />
                <Route path="/settings/governance-remediation" element={<GovernanceRemediationPage />} />
                <Route path="/settings/change-management" element={<GovernanceChangeManagementPage />} />
                <Route path="/settings/blueprint" element={<TransformationBlueprintPage />} />
                <Route path="/settings/data-foundation" element={<DataFoundationPage />} />
                <Route path="/settings/status-model" element={<StatusModelPage />} />
                <Route path="/settings/approval-matrix" element={<ApprovalMatrixPage />} />
                <Route path="/settings/audit-timeline" element={<AuditTimelineFoundationPage />} />
                <Route path="/settings/entity-governance" element={<EntityGovernanceMappingPage />} />
                {/* Dynamic Data Foundation - Prompt 3/20 */}
                <Route path="/settings/master-data" element={<MasterDataPage />} />
                <Route path="/settings/entity-schemas" element={<EntitySchemasPage />} />
                {/* Organization & Permission Foundation - Prompt 4/20 */}
                <Route path="/settings/organization" element={<OrganizationManagementPage />} />
                <Route path="/settings/roles" element={<RolesPermissionsPage />} />
                <Route path="/settings/dashboard-architecture" element={<DashboardArchitecturePage />} />
                <Route path="/settings/platform-surfaces" element={<PlatformSurfaceStrategyPage />} />
                <Route path="/settings/platform-launch-scope" element={<PlatformLaunchScopePage />} />
                <Route path="/settings/platform-navigation" element={<PlatformNavigationSplitPage />} />
                <Route path="/settings/platform-screen-standards" element={<PlatformScreenStandardsPage />} />
                <Route path="/settings/platform-app-shell" element={<PlatformAppShellPage />} />
                <Route path="/settings/platform-web-shell" element={<PlatformWebShellPage />} />
                <Route path="/settings/platform-api-permissions" element={<PlatformApiPermissionPage />} />
                <Route path="/settings/platform-field-validation" element={<PlatformFieldValidationPage />} />
                <Route path="/settings/platform-go-live-final" element={<PlatformFinalGoLivePage />} />
                <Route path="/settings/go-live-validation" element={<GoLiveValidationPage />} />
                <Route path="/settings/backend-contracts" element={<GoLiveBackendContractsPage />} />
                <Route path="/settings/action-permissions" element={<GoLiveActionPermissionsPage />} />
                <Route path="/settings/foundation-baseline" element={<GoLiveFoundationBaselinePage />} />
                <Route path="/settings/users" element={<UserManagementPage />} />
              </Route>
              
              {/* ============================================ */}
              {/* LEASING MODULE - Cho thuê & Vận hành */}
              {/* ============================================ */}
              <Route element={<MainLayout />}>
                <Route path="/leasing" element={<LeasingDashboardPage />} />
                <Route path="/leasing/assets" element={<LeasingAssetsPage />} />
                <Route path="/leasing/assets/new" element={<LeasingAssetsPage />} />
                <Route path="/leasing/contracts" element={<LeasingContractsPage />} />
                <Route path="/leasing/contracts/new" element={<LeasingContractsPage />} />
                <Route path="/leasing/maintenance" element={<LeasingMaintenancePage />} />
                <Route path="/leasing/maintenance/new" element={<LeasingMaintenancePage />} />
                <Route path="/leasing/invoices" element={<LeasingInvoicesPage />} />
                <Route path="/leasing/invoices/new" element={<LeasingInvoicesPage />} />
                <Route path="/leasing/tenants" element={<LeasingAssetsPage />} />
                <Route path="/leasing/payments" element={<LeasingInvoicesPage />} />
                <Route path="/leasing/reports" element={<LeasingDashboardPage />} />
              </Route>

              {/* ============================================ */}
              {/* SEO LANDING PAGES - Clean URLs (must be before catch-all) */}
              {/* ============================================ */}
              <Route path="/:slug" element={<SEOLandingPage />} />
              
              {/* ============================================ */}
              {/* REDIRECTS & CATCH-ALL */}
              {/* ============================================ */}
              <Route path="/" element={<NativeRedirect />} />
            </Routes>
            {/* Global Bottom Nav — hiện theo role, tự ẩn ở login/workspace */}
            <AppBottomNav />
          </BrowserRouter>
          <Toaster position="top-right" richColors />
            </MasterDataProvider>
          </PermissionProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;
