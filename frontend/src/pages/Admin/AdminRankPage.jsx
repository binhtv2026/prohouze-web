import React, { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, 
  Target, 
  BarChart3, 
  Globe, 
  Search,
  RefreshCw,
  Eye,
  FileText,
  Users,
  Clock,
  CheckCircle,
  Link,
  Upload,
  Calendar,
  Play,
  Settings,
  ExternalLink,
  Layers
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminRankPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [kpiData, setKpiData] = useState(null);
  const [topRankings, setTopRankings] = useState([]);
  const [rankingSummary, setRankingSummary] = useState(null);
  const [publishStats, setPublishStats] = useState(null);
  const [publishQueue, setPublishQueue] = useState(null);
  const [backlinkStats, setBacklinkStats] = useState(null);
  const [satelliteSites, setSatelliteSites] = useState([]);
  const [gscConfig, setGscConfig] = useState(null);
  const [sessionStats, setSessionStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [kpiRes, rankRes, summaryRes, publishRes, queueRes, blRes, sitesRes, gscRes, sessionRes] = await Promise.all([
        fetch(`${API_URL}/api/seo/rank/kpi-dashboard`),
        fetch(`${API_URL}/api/seo/rank/top-rankings?limit=20`),
        fetch(`${API_URL}/api/seo/rank/rankings-summary`),
        fetch(`${API_URL}/api/seo/publish/stats`),
        fetch(`${API_URL}/api/seo/publish/queue?limit=20`),
        fetch(`${API_URL}/api/seo/backlink/stats`),
        fetch(`${API_URL}/api/seo/backlink/sites`),
        fetch(`${API_URL}/api/seo/index/config`),
        fetch(`${API_URL}/api/seo/traffic/session/stats?days=7`)
      ]);

      if (kpiRes.ok) setKpiData(await kpiRes.json());
      if (rankRes.ok) setTopRankings((await rankRes.json()).keywords || []);
      if (summaryRes.ok) setRankingSummary(await summaryRes.json());
      if (publishRes.ok) setPublishStats(await publishRes.json());
      if (queueRes.ok) setPublishQueue(await queueRes.json());
      if (blRes.ok) setBacklinkStats(await blRes.json());
      if (sitesRes.ok) setSatelliteSites((await sitesRes.json()).sites || []);
      if (gscRes.ok) setGscConfig(await gscRes.json());
      if (sessionRes.ok) setSessionStats(await sessionRes.json());
    } catch (err) {
      console.error('Error fetching data:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getPositionColor = (pos) => {
    if (pos <= 3) return 'text-green-500';
    if (pos <= 10) return 'text-yellow-500';
    if (pos <= 20) return 'text-orange-500';
    return 'text-red-500';
  };

  // API Actions
  const createDailySchedule = async () => {
    try {
      const res = await fetch(`${API_URL}/api/seo/publish/schedule/create`, { method: 'POST' });
      const data = await res.json();
      alert(`Schedule created: ${data.scheduled_count || 0} pages`);
      fetchData();
    } catch (err) {
      alert('Error creating schedule');
    }
  };

  const executeSchedule = async () => {
    try {
      await fetch(`${API_URL}/api/seo/publish/schedule/execute`, { method: 'POST' });
      alert('Execution started in background');
      setTimeout(fetchData, 3000);
    } catch (err) {
      alert('Error executing schedule');
    }
  };

  const autoQueueDrafts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/seo/publish/queue/auto-add?min_seo_score=60&limit=100`, { method: 'POST' });
      const data = await res.json();
      alert(`Added ${data.added || 0} pages to queue`);
      fetchData();
    } catch (err) {
      alert('Error adding to queue');
    }
  };

  if (loading && !kpiData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <RefreshCw className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-6" data-testid="admin-rank-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-green-500" />
            SEO CONTROL CENTER
          </h1>
          <p className="text-gray-400 text-sm">Rankings, Publishing, Indexing, Backlinks</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
          data-testid="refresh-btn"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
          { id: 'publish', label: 'Publish Strategy', icon: <Calendar className="w-4 h-4" /> },
          { id: 'indexing', label: 'Google Indexing', icon: <Globe className="w-4 h-4" /> },
          { id: 'backlinks', label: 'Backlinks', icon: <Link className="w-4 h-4" /> },
          { id: 'traffic', label: 'Traffic & Dwell', icon: <Users className="w-4 h-4" /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === tab.id 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
            data-testid={`tab-${tab.id}`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && kpiData && (
        <OverviewTab 
          kpiData={kpiData} 
          topRankings={topRankings} 
          rankingSummary={rankingSummary}
          publishStats={publishStats}
          backlinkStats={backlinkStats}
          gscConfig={gscConfig}
          getPositionColor={getPositionColor}
        />
      )}

      {activeTab === 'publish' && (
        <PublishTab 
          publishStats={publishStats}
          publishQueue={publishQueue}
          onCreateSchedule={createDailySchedule}
          onExecuteSchedule={executeSchedule}
          onAutoQueue={autoQueueDrafts}
        />
      )}

      {activeTab === 'indexing' && (
        <IndexingTab 
          gscConfig={gscConfig}
          kpiData={kpiData}
          onRefresh={fetchData}
        />
      )}

      {activeTab === 'backlinks' && (
        <BacklinksTab 
          backlinkStats={backlinkStats}
          satelliteSites={satelliteSites}
          onRefresh={fetchData}
        />
      )}

      {activeTab === 'traffic' && (
        <TrafficTab 
          sessionStats={sessionStats}
          kpiData={kpiData}
        />
      )}
    </div>
  );
};

// ===================== OVERVIEW TAB =====================
const OverviewTab = ({ kpiData, topRankings, rankingSummary, publishStats, backlinkStats, gscConfig, getPositionColor }) => (
  <>
    {/* Target Progress */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <ProgressCard
        title="Pages Published"
        current={kpiData.pages?.published || 0}
        goal={kpiData.targets?.pages_goal || 1000}
        progress={kpiData.targets?.pages_progress || 0}
        icon={<FileText className="w-6 h-6" />}
      />
      <ProgressCard
        title="Keywords Top 10"
        current={kpiData.keywords?.top_10 || 0}
        goal={kpiData.targets?.keywords_top10_goal || 50}
        progress={kpiData.targets?.keywords_top10_progress || 0}
        icon={<Target className="w-6 h-6" />}
      />
      <ProgressCard
        title="Backlinks"
        current={backlinkStats?.total_backlinks || 0}
        goal={100}
        progress={Math.min((backlinkStats?.total_backlinks || 0), 100)}
        icon={<Link className="w-6 h-6" />}
      />
      <ProgressCard
        title="GSC Status"
        current={gscConfig?.is_configured ? 1 : 0}
        goal={1}
        progress={gscConfig?.is_configured ? 100 : 0}
        icon={<Globe className="w-6 h-6" />}
        customLabel={gscConfig?.is_configured ? 'Connected' : 'Not Connected'}
      />
    </div>

    {/* Stats Grid */}
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
      <StatCard label="Total Pages" value={kpiData.pages?.total || 0} icon={<FileText />} />
      <StatCard label="Published" value={kpiData.pages?.published || 0} color="green" icon={<CheckCircle />} />
      <StatCard label="Total Keywords" value={kpiData.keywords?.total || 0} icon={<Search />} />
      <StatCard label="Top 3" value={kpiData.keywords?.top_3 || 0} color="green" icon={<TrendingUp />} />
      <StatCard label="Traffic (7d)" value={kpiData.traffic?.last_7_days || 0} icon={<Eye />} />
      <StatCard label="Queue" value={publishStats?.queue?.pending || 0} icon={<Clock />} />
    </div>

    {/* Main Content Grid */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      {/* Top Rankings */}
      <div className="lg:col-span-2 bg-gray-800 rounded-xl p-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-500" />
          Top Keyword Rankings
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-700">
                <th className="text-left py-2">Keyword</th>
                <th className="text-center py-2">Position</th>
                <th className="text-left py-2">URL</th>
              </tr>
            </thead>
            <tbody>
              {topRankings.length > 0 ? topRankings.map((kw, idx) => (
                <tr key={idx} className="border-b border-gray-700/50">
                  <td className="py-2">{kw.keyword}</td>
                  <td className="text-center py-2">
                    <span className={`font-bold ${getPositionColor(kw.position)}`}>
                      #{kw.position}
                    </span>
                  </td>
                  <td className="py-2 text-gray-400 text-xs truncate max-w-[200px]">
                    {kw.url}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-gray-500">
                    Chưa có dữ liệu ranking. Cập nhật từ Google Search Console.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ranking Distribution */}
      <div className="bg-gray-800 rounded-xl p-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-500" />
          Ranking Distribution
        </h3>
        {rankingSummary?.distribution?.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-700/50">
            <span className="text-gray-400">{item.range}</span>
            <span className="font-bold">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  </>
);

// ===================== PUBLISH TAB =====================
const PublishTab = ({ publishStats, publishQueue, onCreateSchedule, onExecuteSchedule, onAutoQueue }) => (
  <div className="space-y-6">
    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-gray-800 rounded-xl p-4">
        <p className="text-gray-400 text-sm mb-1">Status</p>
        <p className={`text-2xl font-bold ${publishStats?.is_active ? 'text-green-500' : 'text-red-500'}`}>
          {publishStats?.is_active ? 'ACTIVE' : 'PAUSED'}
        </p>
      </div>
      <div className="bg-gray-800 rounded-xl p-4">
        <p className="text-gray-400 text-sm mb-1">Published Today</p>
        <p className="text-2xl font-bold text-green-500">{publishStats?.today?.published || 0}</p>
        <p className="text-xs text-gray-500">Target: {publishStats?.config?.pages_per_day_min || 10}-{publishStats?.config?.pages_per_day_max || 20}/day</p>
      </div>
      <div className="bg-gray-800 rounded-xl p-4">
        <p className="text-gray-400 text-sm mb-1">In Queue</p>
        <p className="text-2xl font-bold">{publishStats?.queue?.pending || 0}</p>
        <p className="text-xs text-gray-500">Scheduled: {publishStats?.queue?.scheduled || 0}</p>
      </div>
      <div className="bg-gray-800 rounded-xl p-4">
        <p className="text-gray-400 text-sm mb-1">Draft Ready</p>
        <p className="text-2xl font-bold text-yellow-500">{publishStats?.draft_pages_ready || 0}</p>
        <p className="text-xs text-gray-500">Min SEO Score: {publishStats?.config?.min_seo_score || 60}</p>
      </div>
    </div>

    {/* Actions */}
    <div className="bg-gray-800 rounded-xl p-4">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Settings className="w-5 h-5 text-purple-500" />
        Quick Actions
      </h3>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={onAutoQueue}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
          data-testid="auto-queue-btn"
        >
          <Upload className="w-4 h-4" />
          Auto Add Drafts to Queue
        </button>
        <button
          onClick={onCreateSchedule}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg"
          data-testid="create-schedule-btn"
        >
          <Calendar className="w-4 h-4" />
          Create Today's Schedule
        </button>
        <button
          onClick={onExecuteSchedule}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg"
          data-testid="execute-schedule-btn"
        >
          <Play className="w-4 h-4" />
          Execute Due Publishes
        </button>
      </div>
    </div>

    {/* Queue Preview */}
    <div className="bg-gray-800 rounded-xl p-4">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5 text-yellow-500" />
        Publish Queue
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 border-b border-gray-700">
              <th className="text-left py-2">Title</th>
              <th className="text-center py-2">SEO Score</th>
              <th className="text-center py-2">Type</th>
              <th className="text-center py-2">Status</th>
              <th className="text-left py-2">Scheduled</th>
            </tr>
          </thead>
          <tbody>
            {publishQueue?.items?.length > 0 ? publishQueue.items.map((item, idx) => (
              <tr key={idx} className="border-b border-gray-700/50">
                <td className="py-2 max-w-[200px] truncate">{item.page_title}</td>
                <td className="text-center py-2">
                  <span className={item.seo_score >= 70 ? 'text-green-500' : 'text-yellow-500'}>
                    {item.seo_score}
                  </span>
                </td>
                <td className="text-center py-2 capitalize">{item.content_type}</td>
                <td className="text-center py-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    item.status === 'published' ? 'bg-green-500/20 text-green-400' :
                    item.status === 'scheduled' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {item.status}
                  </span>
                </td>
                <td className="py-2 text-gray-400 text-xs">{item.scheduled_at || '-'}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-500">
                  Queue trống. Click "Auto Add Drafts" để thêm pages.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

// ===================== INDEXING TAB =====================
const IndexingTab = ({ gscConfig, kpiData, onRefresh }) => {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const text = await file.text();
      const json = JSON.parse(text);

      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/seo/index/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_account_json: json })
      });

      if (res.ok) {
        alert('Google Search Console configured successfully!');
        onRefresh();
      } else {
        const error = await res.json();
        alert(`Error: ${error.detail || 'Upload failed'}`);
      }
    } catch (err) {
      alert('Invalid JSON file');
    }
    setUploading(false);
  };

  const testConnection = async () => {
    const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/seo/index/test-connection`, { method: 'POST' });
    const data = await res.json();
    alert(data.success ? 'Connection successful!' : `Error: ${data.error}`);
  };

  return (
    <div className="space-y-6">
      {/* GSC Status */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-purple-500" />
          Google Search Console Configuration
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-gray-400 mb-2">Status</p>
            <p className={`text-xl font-bold ${gscConfig?.is_configured ? 'text-green-500' : 'text-red-500'}`}>
              {gscConfig?.is_configured ? 'CONNECTED' : 'NOT CONNECTED'}
            </p>
            {gscConfig?.is_configured && (
              <>
                <p className="text-sm text-gray-400 mt-2">Service Account: {gscConfig.service_account_email}</p>
                <p className="text-sm text-gray-400">Site URL: {gscConfig.site_url}</p>
              </>
            )}
          </div>
          
          <div>
            <p className="text-gray-400 mb-2">Upload Service Account JSON</p>
            <label className="flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer">
              <Upload className="w-4 h-4" />
              {uploading ? 'Uploading...' : 'Select JSON File'}
              <input 
                type="file" 
                accept=".json" 
                onChange={handleFileUpload} 
                className="hidden" 
                disabled={uploading}
              />
            </label>
            {gscConfig?.is_configured && (
              <button 
                onClick={testConnection}
                className="mt-2 flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg"
              >
                Test Connection
              </button>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-gray-700/50 rounded-lg">
          <h4 className="font-semibold mb-2">Setup Instructions:</h4>
          <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
            <li>Go to Google Cloud Console (console.cloud.google.com)</li>
            <li>Create/select a project and enable "Indexing API"</li>
            <li>Go to "IAM & Admin" → "Service Accounts"</li>
            <li>Create service account with Owner role</li>
            <li>Create JSON key and download</li>
            <li>In Search Console, add the service account email as Owner</li>
            <li>Upload the JSON file above</li>
          </ol>
        </div>
      </div>

      {/* Indexing Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-xl p-4">
          <p className="text-gray-400 text-sm mb-1">Pages Submitted</p>
          <p className="text-2xl font-bold text-green-500">{kpiData?.indexing?.pages_submitted || 0}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4">
          <p className="text-gray-400 text-sm mb-1">Index Requests</p>
          <p className="text-2xl font-bold">{kpiData?.indexing?.requests_total || 0}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4">
          <p className="text-gray-400 text-sm mb-1">Submitted</p>
          <p className="text-2xl font-bold text-blue-500">{kpiData?.indexing?.submitted || 0}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4">
          <p className="text-gray-400 text-sm mb-1">Errors</p>
          <p className="text-2xl font-bold text-red-500">{kpiData?.indexing?.errors || 0}</p>
        </div>
      </div>
    </div>
  );
};

// ===================== BACKLINKS TAB =====================
const BacklinksTab = ({ backlinkStats, satelliteSites, onRefresh }) => {
  const generateSites = async () => {
    const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/seo/backlink/sites/generate-defaults`, { method: 'POST' });
    const data = await res.json();
    alert(`Created ${data.created || 0} satellite sites`);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-xl p-4">
          <p className="text-gray-400 text-sm mb-1">Total Backlinks</p>
          <p className="text-2xl font-bold text-green-500">{backlinkStats?.total_backlinks || 0}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4">
          <p className="text-gray-400 text-sm mb-1">Last 7 Days</p>
          <p className="text-2xl font-bold">{backlinkStats?.recent_7_days || 0}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4">
          <p className="text-gray-400 text-sm mb-1">Satellite Sites</p>
          <p className="text-2xl font-bold text-blue-500">{satelliteSites?.length || 0}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4">
          <p className="text-gray-400 text-sm mb-1">Target</p>
          <p className="text-2xl font-bold text-yellow-500">10 sites</p>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-gray-800 rounded-xl p-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-purple-500" />
          Satellite Site Network
        </h3>
        <button
          onClick={generateSites}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg mb-4"
        >
          <Layers className="w-4 h-4" />
          Generate Default 10 Sites
        </button>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {satelliteSites?.map((site, idx) => (
            <div key={idx} className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold truncate">{site.name}</span>
                <span className={`px-2 py-1 rounded text-xs ${site.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {site.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-sm text-gray-400 truncate">{site.domain}</p>
              <div className="flex gap-4 mt-2 text-xs text-gray-500">
                <span>Posts: {site.total_posts}</span>
                <span>Links: {site.total_backlinks}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Anchors */}
      <div className="bg-gray-800 rounded-xl p-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Link className="w-5 h-5 text-green-500" />
          Top Anchor Texts
        </h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(backlinkStats?.by_anchor || {}).map(([anchor, count], idx) => (
            <span key={idx} className="px-3 py-1 bg-gray-700 rounded-full text-sm">
              {anchor}: <span className="text-green-400">{count}</span>
            </span>
          ))}
          {Object.keys(backlinkStats?.by_anchor || {}).length === 0 && (
            <p className="text-gray-500">Chưa có backlinks</p>
          )}
        </div>
      </div>
    </div>
  );
};

// ===================== TRAFFIC TAB =====================
const TrafficTab = ({ sessionStats, kpiData }) => (
  <div className="space-y-6">
    {/* Session Quality */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-gray-800 rounded-xl p-4">
        <p className="text-gray-400 text-sm mb-1">Total Sessions (7d)</p>
        <p className="text-2xl font-bold">{sessionStats?.total_sessions || 0}</p>
      </div>
      <div className="bg-gray-800 rounded-xl p-4">
        <p className="text-gray-400 text-sm mb-1">Qualified (≥30s)</p>
        <p className="text-2xl font-bold text-green-500">{sessionStats?.qualified_sessions || 0}</p>
        <p className="text-xs text-gray-500">Rate: {sessionStats?.qualification_rate || 0}%</p>
      </div>
      <div className="bg-gray-800 rounded-xl p-4">
        <p className="text-gray-400 text-sm mb-1">Avg Duration</p>
        <p className="text-2xl font-bold">{sessionStats?.avg_duration_seconds || 0}s</p>
        <p className="text-xs text-gray-500">Target: 30s</p>
      </div>
      <div className="bg-gray-800 rounded-xl p-4">
        <p className="text-gray-400 text-sm mb-1">Avg Scroll Depth</p>
        <p className="text-2xl font-bold text-blue-500">{sessionStats?.avg_scroll_depth || 0}%</p>
      </div>
    </div>

    {/* Traffic by Source */}
    <div className="bg-gray-800 rounded-xl p-4">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Eye className="w-5 h-5 text-cyan-500" />
        Traffic by Source (Last 7 Days)
      </h3>
      <div className="flex flex-wrap gap-4">
        {Object.entries(kpiData?.traffic?.by_source || {}).map(([source, count]) => (
          <div key={source} className="bg-gray-700 rounded-lg px-4 py-2">
            <span className="text-gray-400 capitalize">{source}: </span>
            <span className="font-bold">{count}</span>
          </div>
        ))}
        {Object.keys(kpiData?.traffic?.by_source || {}).length === 0 && (
          <p className="text-gray-500">Chưa có dữ liệu traffic</p>
        )}
      </div>
    </div>

    {/* CTR & Dwell Time Tips */}
    <div className="bg-gray-800 rounded-xl p-4">
      <h3 className="text-lg font-semibold mb-4">CTR & Dwell Time Optimization</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-gray-700/50 rounded-lg">
          <h4 className="font-semibold mb-2 text-green-400">CTR Boosters</h4>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>✓ CTR-optimized title formats</li>
            <li>✓ Numbers in titles (e.g., "5 Mẹo...")</li>
            <li>✓ Year in titles (2026)</li>
            <li>✓ Power words (Bí Quyết, Kinh Nghiệm)</li>
          </ul>
        </div>
        <div className="p-4 bg-gray-700/50 rounded-lg">
          <h4 className="font-semibold mb-2 text-blue-400">Dwell Time Boosters</h4>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>✓ Table of Contents</li>
            <li>✓ Related posts sections</li>
            <li>✓ Mid-article CTAs</li>
            <li>✓ Scroll depth tracking</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
);

// ===================== SHARED COMPONENTS =====================
const ProgressCard = ({ title, current, goal, progress, icon, customLabel }) => {
  const getColor = (p) => {
    if (p >= 80) return 'bg-green-500';
    if (p >= 50) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  return (
    <div className="bg-gray-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-400">{title}</span>
        {icon}
      </div>
      <div className="text-2xl font-bold mb-2">{customLabel || `${current} / ${goal}`}</div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all ${getColor(progress)}`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      <p className="text-sm text-gray-400 mt-1">{progress}% complete</p>
    </div>
  );
};

const StatCard = ({ label, value, color, icon }) => {
  const colorClasses = {
    green: 'text-green-500',
    yellow: 'text-yellow-500',
    red: 'text-red-500',
    default: 'text-white'
  };

  return (
    <div className="bg-gray-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2 text-gray-400">
        {React.cloneElement(icon, { className: 'w-4 h-4' })}
        <span className="text-xs">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${colorClasses[color] || colorClasses.default}`}>
        {value}
      </p>
    </div>
  );
};

export default AdminRankPage;
