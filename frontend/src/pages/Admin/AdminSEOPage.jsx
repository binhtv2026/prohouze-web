import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  FileText, 
  Globe, 
  TrendingUp, 
  RefreshCw,
  Plus,
  Trash2,
  Eye,
  Send,
  CheckCircle,
  Clock,
  AlertCircle,
  Zap,
  BarChart3,
  Tag,
  Link as LinkIcon,
  BookOpen,
  Home,
  Layers,
  Target,
  GitBranch
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminSEOPage = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [clusterStats, setClusterStats] = useState(null);
  const [keywords, setKeywords] = useState([]);
  const [pages, setPages] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedPage, setSelectedPage] = useState(null);
  const [selectedCluster, setSelectedCluster] = useState(null);
  
  // Cluster creation form
  const [clusterForm, setClusterForm] = useState({
    main_keyword: '',
    location: '',
    num_support_articles: 5
  });
  
  // Keyword generation form
  const [keywordForm, setKeywordForm] = useState({
    locations: ['Đà Nẵng', 'HCM', 'Hà Nội', 'Bình Dương', 'Đồng Nai'],
    intents: ['mua nhà', 'căn hộ', 'đất nền', 'đầu tư', 'cho thuê'],
    price_ranges: ['giá rẻ', 'dưới 2 tỷ', '2-5 tỷ', 'trên 5 tỷ', 'cao cấp'],
    property_types: ['chung cư', 'biệt thự', 'nhà phố', 'đất nền', 'shophouse']
  });

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/seo/stats`);
      const data = await response.json();
      setStats(data);
      
      // Fetch cluster stats
      const clusterResponse = await fetch(`${API_URL}/api/seo/clusters/stats/overview`);
      if (clusterResponse.ok) {
        const clusterData = await clusterResponse.json();
        setClusterStats(clusterData);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, []);

  const fetchKeywords = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/seo/keywords?limit=100`);
      const data = await response.json();
      setKeywords(data.keywords || []);
    } catch (err) {
      console.error('Error fetching keywords:', err);
    }
  }, []);

  const fetchPages = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/seo/pages?limit=100`);
      const data = await response.json();
      setPages(data.pages || []);
    } catch (err) {
      console.error('Error fetching pages:', err);
    }
  }, []);

  const fetchClusters = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/seo/clusters/list?limit=50`);
      if (response.ok) {
        const data = await response.json();
        setClusters(data.clusters || []);
      }
    } catch (err) {
      console.error('Error fetching clusters:', err);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchKeywords(), fetchPages(), fetchClusters()]);
      setLoading(false);
    };
    loadData();
  }, [fetchStats, fetchKeywords, fetchPages, fetchClusters]);

  const handleCreateCluster = async () => {
    if (!clusterForm.main_keyword) {
      alert('Vui lòng nhập từ khóa chính');
      return;
    }
    setGenerating(true);
    try {
      const response = await fetch(`${API_URL}/api/seo/clusters/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clusterForm)
      });
      const data = await response.json();
      if (data.success) {
        alert(`Đã tạo cluster "${data.pillar_slug}" với ${data.support_articles.length} support articles!`);
        setClusterForm({ main_keyword: '', location: '', num_support_articles: 5 });
        fetchClusters();
        fetchStats();
      } else {
        alert(data.detail || 'Lỗi khi tạo cluster');
      }
    } catch (err) {
      console.error('Error creating cluster:', err);
      alert('Lỗi khi tạo cluster');
    }
    setGenerating(false);
  };

  const handleGeneratePillar = async (clusterId) => {
    setGenerating(true);
    try {
      const response = await fetch(`${API_URL}/api/seo/clusters/${clusterId}/generate-pillar`, {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success) {
        alert(`Đã tạo pillar page! SEO Score: ${data.seo_score}, Words: ${data.word_count}`);
        fetchClusters();
        fetchPages();
        fetchStats();
      } else {
        alert(data.detail || 'Lỗi khi tạo pillar');
      }
    } catch (err) {
      console.error('Error generating pillar:', err);
      alert('Lỗi khi tạo pillar');
    }
    setGenerating(false);
  };

  const handleGenerateSupportArticle = async (clusterId, articleIndex) => {
    setGenerating(true);
    try {
      const response = await fetch(`${API_URL}/api/seo/clusters/${clusterId}/generate-support/${articleIndex}`, {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success) {
        alert(`Đã tạo support article! SEO Score: ${data.seo_score}, Words: ${data.word_count}`);
        fetchClusters();
        fetchPages();
        fetchStats();
      } else {
        alert(data.detail || 'Lỗi khi tạo support article');
      }
    } catch (err) {
      console.error('Error generating support article:', err);
      alert('Lỗi khi tạo support article');
    }
    setGenerating(false);
  };

  const viewClusterDetail = async (clusterId) => {
    try {
      const response = await fetch(`${API_URL}/api/seo/clusters/${clusterId}`);
      const data = await response.json();
      setSelectedCluster(data);
    } catch (err) {
      console.error('Error fetching cluster:', err);
    }
  };

  const handleGenerateKeywords = async () => {
    setGenerating(true);
    try {
      const response = await fetch(`${API_URL}/api/seo/generate-keywords`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(keywordForm)
      });
      const data = await response.json();
      if (data.success) {
        alert(`Đã tạo ${data.total_generated} keywords!`);
        fetchKeywords();
        fetchStats();
      }
    } catch (err) {
      console.error('Error generating keywords:', err);
      alert('Lỗi khi tạo keywords');
    }
    setGenerating(false);
  };

  const handleGenerateContent = async (keyword, contentType = 'landing') => {
    setGenerating(true);
    try {
      const response = await fetch(`${API_URL}/api/seo/generate-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, content_type: contentType })
      });
      const data = await response.json();
      if (data.success) {
        alert(`Đã tạo content cho "${keyword}"! SEO Score: ${data.page.seo_score}`);
        fetchPages();
        fetchKeywords();
        fetchStats();
      } else {
        alert(data.detail || 'Lỗi khi tạo content');
      }
    } catch (err) {
      console.error('Error generating content:', err);
      alert('Lỗi khi tạo content');
    }
    setGenerating(false);
  };

  const handlePublish = async (pageId) => {
    try {
      const response = await fetch(`${API_URL}/api/seo/publish/${pageId}`, {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success) {
        alert('Đã publish thành công!');
        fetchPages();
        fetchStats();
      } else {
        alert(data.detail || 'Lỗi khi publish');
      }
    } catch (err) {
      console.error('Error publishing:', err);
      alert('Lỗi khi publish');
    }
  };

  const handleDeleteKeyword = async (keywordId) => {
    if (!window.confirm('Xóa keyword này?')) return;
    try {
      await fetch(`${API_URL}/api/seo/keywords/${keywordId}`, { method: 'DELETE' });
      fetchKeywords();
      fetchStats();
    } catch (err) {
      console.error('Error deleting keyword:', err);
    }
  };

  const handleDeletePage = async (pageId) => {
    if (!window.confirm('Xóa page này?')) return;
    try {
      await fetch(`${API_URL}/api/seo/pages/${pageId}`, { method: 'DELETE' });
      fetchPages();
      fetchStats();
    } catch (err) {
      console.error('Error deleting page:', err);
    }
  };

  const viewPageDetail = async (pageId) => {
    try {
      const response = await fetch(`${API_URL}/api/seo/pages/${pageId}`);
      const data = await response.json();
      setSelectedPage(data);
    } catch (err) {
      console.error('Error fetching page detail:', err);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-gray-500', icon: <Clock className="w-3 h-3" /> },
      generated: { color: 'bg-blue-500', icon: <FileText className="w-3 h-3" /> },
      draft: { color: 'bg-yellow-500', icon: <AlertCircle className="w-3 h-3" /> },
      published: { color: 'bg-green-500', icon: <CheckCircle className="w-3 h-3" /> },
      error: { color: 'bg-red-500', icon: <AlertCircle className="w-3 h-3" /> }
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs text-white flex items-center gap-1 ${badge.color}`}>
        {badge.icon}
        {status.toUpperCase()}
      </span>
    );
  };

  const getSEOScoreColor = (score) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Đang tải dữ liệu SEO...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white" data-testid="admin-seo-page">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-8 h-8 text-green-500" />
            <div>
              <h1 className="text-xl font-bold">SEO FACTORY</h1>
              <p className="text-gray-400 text-sm">Auto generate 1000+ SEO pages</p>
            </div>
          </div>
          <button
            onClick={() => { fetchStats(); fetchKeywords(); fetchPages(); fetchClusters(); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        {[
          { id: 'dashboard', icon: <BarChart3 className="w-4 h-4" />, label: 'Dashboard' },
          { id: 'clusters', icon: <Layers className="w-4 h-4" />, label: 'Clusters' },
          { id: 'keywords', icon: <Tag className="w-4 h-4" />, label: 'Keywords' },
          { id: 'pages', icon: <FileText className="w-4 h-4" />, label: 'Pages' },
          { id: 'generate', icon: <Zap className="w-4 h-4" />, label: 'Generate' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 transition ${
              activeTab === tab.id 
                ? 'border-blue-500 text-blue-500' 
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-6">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && stats && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <StatCard icon={<Tag />} label="Total Keywords" value={stats.keywords?.total || 0} color="blue" />
              <StatCard icon={<Clock />} label="Pending" value={stats.keywords?.pending || 0} color="gray" />
              <StatCard icon={<FileText />} label="Generated" value={stats.keywords?.generated || 0} color="yellow" />
              <StatCard icon={<CheckCircle />} label="Published" value={stats.keywords?.published || 0} color="green" />
              <StatCard icon={<Home />} label="Landing Pages" value={stats.pages?.landing || 0} color="purple" />
              <StatCard icon={<BookOpen />} label="Blog Posts" value={stats.pages?.blog || 0} color="cyan" />
            </div>

            {/* SEO Score */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Average SEO Score
              </h3>
              <div className="flex items-center gap-4">
                <div className={`text-5xl font-bold ${getSEOScoreColor(stats.avg_seo_score || 0)}`}>
                  {stats.avg_seo_score || 0}
                </div>
                <div className="text-gray-400">
                  <p>/ 100</p>
                  <p className="text-sm">Target: 80+</p>
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Progress to 1000 Pages</h3>
              <div className="w-full bg-gray-700 rounded-full h-4 mb-2">
                <div 
                  className="bg-green-500 h-4 rounded-full transition-all"
                  style={{ width: `${Math.min(((stats.pages?.total || 0) / 1000) * 100, 100)}%` }}
                />
              </div>
              <p className="text-gray-400">{stats.pages?.total || 0} / 1000 pages</p>
            </div>
            
            {/* Cluster Stats */}
            {clusterStats && (
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-purple-500" />
                  Topical Clusters
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-400 text-sm">Total Clusters</p>
                    <p className="text-2xl font-bold">{clusterStats.total_clusters || 0}</p>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-400 text-sm">Pillars Published</p>
                    <p className="text-2xl font-bold text-green-500">{clusterStats.pillar_status?.published || 0}</p>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-400 text-sm">Total Articles</p>
                    <p className="text-2xl font-bold">{clusterStats.total_articles || 0}</p>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-400 text-sm">Published Articles</p>
                    <p className="text-2xl font-bold text-green-500">{clusterStats.published_articles || 0}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Clusters Tab */}
        {activeTab === 'clusters' && (
          <div className="space-y-6">
            {/* Create Cluster Form */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-500" />
                Create Topical Cluster
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Từ khóa chính (Pillar)</label>
                  <input
                    type="text"
                    value={clusterForm.main_keyword}
                    onChange={(e) => setClusterForm({...clusterForm, main_keyword: e.target.value})}
                    className="w-full bg-gray-700 rounded p-3 text-white"
                    placeholder="mua nhà Đà Nẵng"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Khu vực</label>
                  <input
                    type="text"
                    value={clusterForm.location}
                    onChange={(e) => setClusterForm({...clusterForm, location: e.target.value})}
                    className="w-full bg-gray-700 rounded p-3 text-white"
                    placeholder="Đà Nẵng"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Số bài hỗ trợ</label>
                  <input
                    type="number"
                    value={clusterForm.num_support_articles}
                    onChange={(e) => setClusterForm({...clusterForm, num_support_articles: parseInt(e.target.value) || 5})}
                    className="w-full bg-gray-700 rounded p-3 text-white"
                    min="3"
                    max="10"
                  />
                </div>
              </div>
              <button
                onClick={handleCreateCluster}
                disabled={generating || !clusterForm.main_keyword}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50"
              >
                {generating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                Create Cluster
              </button>
            </div>

            {/* Clusters List */}
            <div className="bg-gray-800 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-gray-700">
                <h3 className="font-semibold">Clusters ({clusters.length})</h3>
              </div>
              <div className="divide-y divide-gray-700">
                {clusters.map((cluster, idx) => (
                  <div key={cluster.id || idx} className="p-4 hover:bg-gray-750">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <GitBranch className="w-5 h-5 text-purple-500" />
                          <span className="font-medium">{cluster.main_keyword}</span>
                          {getStatusBadge(cluster.pillar_status)}
                        </div>
                        <div className="text-gray-400 text-sm mt-1">
                          /{cluster.pillar_slug} • {cluster.support_articles_count} support articles • {cluster.published_count}/{cluster.total_articles} published
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => viewClusterDetail(cluster.id)}
                          className="p-2 bg-gray-600 hover:bg-gray-500 rounded"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {cluster.pillar_status === 'pending' && (
                          <button
                            onClick={() => handleGeneratePillar(cluster.id)}
                            disabled={generating}
                            className="p-2 bg-purple-600 hover:bg-purple-700 rounded disabled:opacity-50"
                            title="Generate Pillar"
                          >
                            <Zap className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {clusters.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <Layers className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Chưa có cluster nào. Tạo cluster đầu tiên!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Keywords Tab */}
        {activeTab === 'keywords' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Keywords ({keywords.length})</h3>
            </div>
            <div className="bg-gray-800 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left">Keyword</th>
                    <th className="px-4 py-3 text-left">Location</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {keywords.map((kw, idx) => (
                    <tr key={kw.id || idx} className="border-t border-gray-700 hover:bg-gray-750">
                      <td className="px-4 py-3">{kw.keyword}</td>
                      <td className="px-4 py-3 text-gray-400">{kw.location}</td>
                      <td className="px-4 py-3">{getStatusBadge(kw.status)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {kw.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleGenerateContent(kw.keyword, 'landing')}
                                disabled={generating}
                                className="p-2 bg-blue-600 hover:bg-blue-700 rounded text-xs disabled:opacity-50"
                                title="Generate Landing"
                              >
                                <Home className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleGenerateContent(kw.keyword, 'blog')}
                                disabled={generating}
                                className="p-2 bg-purple-600 hover:bg-purple-700 rounded text-xs disabled:opacity-50"
                                title="Generate Blog"
                              >
                                <BookOpen className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDeleteKeyword(kw.id)}
                            className="p-2 bg-red-600 hover:bg-red-700 rounded text-xs"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pages Tab */}
        {activeTab === 'pages' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">SEO Pages ({pages.length})</h3>
            </div>
            <div className="bg-gray-800 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left">Title</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">SEO Score</th>
                    <th className="px-4 py-3 text-left">Words</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pages.map((page, idx) => (
                    <tr key={page.id || idx} className="border-t border-gray-700 hover:bg-gray-750">
                      <td className="px-4 py-3">
                        <div className="max-w-xs truncate">{page.title}</div>
                        <div className="text-gray-500 text-xs">/{page.slug}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          page.content_type === 'landing' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                        }`}>
                          {page.content_type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-bold ${getSEOScoreColor(page.seo_score)}`}>
                          {page.seo_score}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400">{page.word_count}</td>
                      <td className="px-4 py-3">{getStatusBadge(page.status)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => viewPageDetail(page.id)}
                            className="p-2 bg-gray-600 hover:bg-gray-500 rounded"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {page.status === 'draft' && (
                            <button
                              onClick={() => handlePublish(page.id)}
                              className="p-2 bg-green-600 hover:bg-green-700 rounded"
                              title="Publish"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeletePage(page.id)}
                            className="p-2 bg-red-600 hover:bg-red-700 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Generate Tab */}
        {activeTab === 'generate' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Keyword Generator
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Locations</label>
                  <textarea
                    value={keywordForm.locations.join('\n')}
                    onChange={(e) => setKeywordForm({...keywordForm, locations: e.target.value.split('\n').filter(l => l.trim())})}
                    className="w-full bg-gray-700 rounded p-3 text-white h-32"
                    placeholder="Đà Nẵng&#10;HCM&#10;Hà Nội"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Intents</label>
                  <textarea
                    value={keywordForm.intents.join('\n')}
                    onChange={(e) => setKeywordForm({...keywordForm, intents: e.target.value.split('\n').filter(l => l.trim())})}
                    className="w-full bg-gray-700 rounded p-3 text-white h-32"
                    placeholder="mua nhà&#10;căn hộ&#10;đầu tư"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Price Ranges</label>
                  <textarea
                    value={keywordForm.price_ranges.join('\n')}
                    onChange={(e) => setKeywordForm({...keywordForm, price_ranges: e.target.value.split('\n').filter(l => l.trim())})}
                    className="w-full bg-gray-700 rounded p-3 text-white h-32"
                    placeholder="giá rẻ&#10;dưới 2 tỷ&#10;2-5 tỷ"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Property Types</label>
                  <textarea
                    value={keywordForm.property_types.join('\n')}
                    onChange={(e) => setKeywordForm({...keywordForm, property_types: e.target.value.split('\n').filter(l => l.trim())})}
                    className="w-full bg-gray-700 rounded p-3 text-white h-32"
                    placeholder="chung cư&#10;biệt thự&#10;nhà phố"
                  />
                </div>
              </div>

              <button
                onClick={handleGenerateKeywords}
                disabled={generating}
                className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {generating ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Plus className="w-5 h-5" />
                )}
                Generate Keywords
              </button>

              <p className="text-gray-500 text-sm mt-2 text-center">
                Sẽ tạo ra ~{keywordForm.locations.length * keywordForm.intents.length * keywordForm.price_ranges.length * keywordForm.property_types.length * 9} keywords unique
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Page Detail Modal */}
      {selectedPage && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-bold">{selectedPage.title}</h3>
              <button onClick={() => setSelectedPage(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Slug:</span>
                  <span className="ml-2">/{selectedPage.slug}</span>
                </div>
                <div>
                  <span className="text-gray-400">Type:</span>
                  <span className="ml-2">{selectedPage.content_type}</span>
                </div>
                <div>
                  <span className="text-gray-400">SEO Score:</span>
                  <span className={`ml-2 font-bold ${getSEOScoreColor(selectedPage.seo_score)}`}>
                    {selectedPage.seo_score}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Word Count:</span>
                  <span className="ml-2">{selectedPage.word_count}</span>
                </div>
              </div>
              <div>
                <span className="text-gray-400 block mb-1">Meta Description:</span>
                <p className="text-sm bg-gray-700 p-2 rounded">{selectedPage.meta_description}</p>
              </div>
              <div>
                <span className="text-gray-400 block mb-1">H2 Tags:</span>
                <div className="flex flex-wrap gap-2">
                  {selectedPage.h2_tags?.map((tag, i) => (
                    <span key={i} className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-sm">{tag}</span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-gray-400 block mb-1">Internal Links:</span>
                <div className="flex flex-wrap gap-2">
                  {selectedPage.internal_links?.map((link, i) => (
                    <span key={i} className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-sm flex items-center gap-1">
                      <LinkIcon className="w-3 h-3" />
                      {link.anchor}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-gray-400 block mb-1">Content Preview:</span>
                <div 
                  className="bg-gray-700 p-4 rounded max-h-64 overflow-y-auto prose prose-invert prose-sm"
                  dangerouslySetInnerHTML={{ __html: selectedPage.content?.substring(0, 2000) + '...' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cluster Detail Modal */}
      {selectedCluster && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-purple-500" />
                {selectedCluster.main_keyword}
              </h3>
              <button onClick={() => setSelectedCluster(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="p-4 space-y-4">
              {/* Pillar Info */}
              <div className="bg-purple-900/30 rounded-lg p-4">
                <h4 className="font-semibold text-purple-400 mb-2">PILLAR PAGE</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">/{selectedCluster.pillar_slug}</p>
                    {selectedCluster.pillar_page && (
                      <p className="text-sm text-gray-400">
                        SEO: {selectedCluster.pillar_page.seo_score} • Words: {selectedCluster.pillar_page.word_count}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(selectedCluster.pillar_status)}
                    {selectedCluster.pillar_status === 'pending' && (
                      <button
                        onClick={() => { handleGeneratePillar(selectedCluster.id); setSelectedCluster(null); }}
                        disabled={generating}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm disabled:opacity-50"
                      >
                        Generate
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Support Articles */}
              <div>
                <h4 className="font-semibold mb-3">SUPPORT ARTICLES ({selectedCluster.support_articles?.length || 0})</h4>
                <div className="space-y-2">
                  {selectedCluster.support_articles?.map((article, idx) => (
                    <div key={idx} className="bg-gray-700 rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{article.title}</p>
                        <p className="text-xs text-gray-400">/blog/{article.slug} • {article.article_type}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(article.status)}
                        {article.status === 'pending' && (
                          <button
                            onClick={() => { handleGenerateSupportArticle(selectedCluster.id, idx); setSelectedCluster(null); }}
                            disabled={generating}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs disabled:opacity-50"
                          >
                            Generate
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon, label, value, color }) => {
  const colorClasses = {
    blue: 'border-blue-500/30 bg-blue-500/10 text-blue-500',
    gray: 'border-gray-500/30 bg-gray-500/10 text-gray-500',
    yellow: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-500',
    green: 'border-green-500/30 bg-green-500/10 text-green-500',
    purple: 'border-purple-500/30 bg-purple-500/10 text-purple-500',
    cyan: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-500',
  };

  return (
    <div className={`rounded-xl p-4 border ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        {React.cloneElement(icon, { className: 'w-5 h-5' })}
        <span className="text-gray-400 text-xs">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
};

export default AdminSEOPage;
