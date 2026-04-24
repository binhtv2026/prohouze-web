/**
 * KPI Leaderboard Page
 * Prompt 12/20 - KPI & Performance Engine
 */
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Trophy, Medal, TrendingUp, TrendingDown, Users,
  ChevronDown, Filter, Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { kpiApi } from '@/api/kpiApi';

const DEMO_LEADERBOARD_TYPES = [
  { type: 'monthly_champions', name: 'Chiến binh tháng' },
  { type: 'booking_race', name: 'Đua booking' },
];

const DEMO_LEADERBOARD = {
  name: 'Chiến binh tháng 3/2026',
  description: 'Xếp hạng theo doanh số và chất lượng xử lý lead.',
  period_label: 'Tháng 3/2026',
  total_participants: 24,
  primary_kpi_name: 'Doanh số',
  current_user_rank: 4,
  entries: [
    { user_name: 'Nguyễn Minh Anh', team_name: 'Team Rivera', primary_formatted: '3,2 tỷ', achievement: 132, rank_badge: '1' },
    { user_name: 'Trần Quốc Huy', team_name: 'Team Sunrise', primary_formatted: '2,8 tỷ', achievement: 118, rank_badge: '2' },
    { user_name: 'Lê Thanh Hà', team_name: 'Team Skyline', primary_formatted: '2,4 tỷ', achievement: 109, rank_badge: '3' },
    { user_name: 'Bạn', team_name: 'Team Rivera', primary_formatted: '2,1 tỷ', achievement: 98, rank_badge: '4' },
  ],
};

// Rank badge colors
const RANK_STYLES = {
  1: { bg: 'bg-gradient-to-br from-amber-400 to-amber-600', text: 'text-white', shadow: 'shadow-amber-200' },
  2: { bg: 'bg-gradient-to-br from-slate-300 to-slate-500', text: 'text-white', shadow: 'shadow-slate-200' },
  3: { bg: 'bg-gradient-to-br from-orange-400 to-orange-600', text: 'text-white', shadow: 'shadow-orange-200' },
};

// Leaderboard entry component
const LeaderboardEntry = ({ entry, rank, isCurrentUser = false }) => {
  const isTop3 = rank <= 3;
  const rankStyle = RANK_STYLES[rank] || { bg: 'bg-slate-100', text: 'text-slate-700' };
  
  return (
    <div 
      className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
        isCurrentUser 
          ? 'bg-blue-50 border-2 border-blue-200' 
          : 'bg-white border border-slate-100 hover:border-slate-200 hover:shadow-sm'
      }`}
      data-testid={`leaderboard-entry-${rank}`}
    >
      {/* Rank Badge */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold ${
        isTop3 ? `${rankStyle.bg} ${rankStyle.text} shadow-lg ${rankStyle.shadow}` : `${rankStyle.bg} ${rankStyle.text}`
      }`}>
        {entry.rank_badge || rank}
      </div>
      
      {/* User Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Avatar className="w-9 h-9">
            <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
              {entry.user_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className={`font-medium truncate ${isCurrentUser ? 'text-blue-700' : 'text-slate-900'}`}>
              {entry.user_name}
              {isCurrentUser && <Badge className="ml-2 bg-blue-100 text-blue-700 text-xs">Bạn</Badge>}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {entry.team_name || 'No team'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Achievement */}
      <div className="text-right flex-shrink-0">
        <p className="text-lg font-bold text-slate-900">{entry.primary_formatted}</p>
        <div className="flex items-center justify-end gap-1">
          {entry.achievement > 100 ? (
            <TrendingUp className="w-3 h-3 text-emerald-500" />
          ) : entry.achievement < 80 ? (
            <TrendingDown className="w-3 h-3 text-red-500" />
          ) : null}
          <span className={`text-xs ${
            entry.achievement >= 100 ? 'text-emerald-600' : 
            entry.achievement >= 80 ? 'text-slate-500' : 'text-red-500'
          }`}>
            {entry.achievement.toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
};

// Top 3 Podium Component
const TopThreePodium = ({ entries }) => {
  if (entries.length < 3) return null;
  
  const [first, second, third] = [entries[0], entries[1], entries[2]];
  
  return (
    <div className="flex items-end justify-center gap-4 py-8">
      {/* 2nd Place */}
      <div className="text-center">
        <Avatar className="w-16 h-16 mx-auto mb-2 ring-4 ring-slate-300">
          <AvatarFallback className="bg-slate-200 text-slate-600 text-xl">
            {second?.user_name?.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="bg-gradient-to-br from-slate-300 to-slate-500 rounded-t-xl px-6 py-4 min-w-[120px]">
          <span className="text-2xl">🥈</span>
          <p className="text-white font-bold text-sm mt-1 truncate">{second?.user_name}</p>
          <p className="text-slate-200 text-xs">{second?.primary_formatted}</p>
        </div>
      </div>
      
      {/* 1st Place */}
      <div className="text-center -mt-8">
        <div className="relative">
          <Trophy className="w-8 h-8 text-amber-500 absolute -top-10 left-1/2 -translate-x-1/2" />
          <Avatar className="w-20 h-20 mx-auto mb-2 ring-4 ring-amber-400">
            <AvatarFallback className="bg-amber-100 text-amber-600 text-2xl">
              {first?.user_name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="bg-gradient-to-br from-amber-400 to-amber-600 rounded-t-xl px-8 py-6 min-w-[140px] shadow-xl shadow-amber-200">
          <span className="text-3xl">🥇</span>
          <p className="text-white font-bold mt-1 truncate">{first?.user_name}</p>
          <p className="text-amber-100 text-sm">{first?.primary_formatted}</p>
        </div>
      </div>
      
      {/* 3rd Place */}
      <div className="text-center">
        <Avatar className="w-14 h-14 mx-auto mb-2 ring-4 ring-orange-400">
          <AvatarFallback className="bg-orange-100 text-orange-600 text-lg">
            {third?.user_name?.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-t-xl px-5 py-3 min-w-[110px]">
          <span className="text-xl">🥉</span>
          <p className="text-white font-bold text-sm mt-1 truncate">{third?.user_name}</p>
          <p className="text-orange-100 text-xs">{third?.primary_formatted}</p>
        </div>
      </div>
    </div>
  );
};

// Main Leaderboard Component
const KPILeaderboard = () => {
  const [leaderboardTypes, setLeaderboardTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('monthly_champions');
  const [leaderboard, setLeaderboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadLeaderboardTypes = useCallback(async () => {
    try {
      const types = await kpiApi.getAvailableLeaderboards();
      setLeaderboardTypes(Array.isArray(types) && types.length > 0 ? types : DEMO_LEADERBOARD_TYPES);
    } catch (err) {
      console.error('Failed to load leaderboard types:', err);
      setLeaderboardTypes(DEMO_LEADERBOARD_TYPES);
    }
  }, []);

  const loadLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      const data = await kpiApi.getLeaderboard(selectedType);
      setLeaderboard(data || DEMO_LEADERBOARD);
    } catch (err) {
      setLeaderboard(DEMO_LEADERBOARD);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedType]);

  useEffect(() => {
    loadLeaderboardTypes();
  }, [loadLeaderboardTypes]);

  useEffect(() => {
    if (selectedType) {
      loadLeaderboard();
    }
  }, [loadLeaderboard, selectedType]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="kpi-leaderboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Trophy className="w-7 h-7 text-amber-500" />
            Bảng xếp hạng
          </h1>
          <p className="text-slate-500">{leaderboard?.period_label}</p>
        </div>
        
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Chọn bảng xếp hạng" />
          </SelectTrigger>
          <SelectContent>
            {leaderboardTypes.map((type) => (
              <SelectItem key={type.type} value={type.type}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {leaderboard && (
        <>
          {/* Leaderboard Info Card */}
          <Card className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">{leaderboard.name}</h2>
                  <p className="text-indigo-200 text-sm mt-1">{leaderboard.description}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-indigo-300" />
                      <span className="text-sm">{leaderboard.total_participants} người tham gia</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-indigo-300" />
                      <span className="text-sm">KPI: {leaderboard.primary_kpi_name}</span>
                    </div>
                  </div>
                </div>
                
                {leaderboard.current_user_rank > 0 && (
                  <div className="text-right bg-white/10 rounded-xl px-6 py-3">
                    <p className="text-indigo-200 text-sm">Xếp hạng của bạn</p>
                    <p className="text-3xl font-bold">#{leaderboard.current_user_rank}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top 3 Podium */}
          {leaderboard.entries.length >= 3 && (
            <Card>
              <CardContent className="p-0">
                <TopThreePodium entries={leaderboard.entries} />
              </CardContent>
            </Card>
          )}

          {/* Full Rankings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Bảng xếp hạng đầy đủ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboard.entries.map((entry, index) => (
                  <LeaderboardEntry 
                    key={entry.user_id} 
                    entry={entry} 
                    rank={entry.rank}
                    isCurrentUser={entry.is_current_user}
                  />
                ))}
                
                {leaderboard.entries.length === 0 && (
                  <div className="text-center py-12 text-slate-500">
                    <Trophy className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>Chưa có dữ liệu xếp hạng</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default KPILeaderboard;
