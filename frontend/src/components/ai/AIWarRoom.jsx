/**
 * AI War Room Component
 * Prompt 18/20 - AI Decision Engine (FINAL 10/10)
 * 
 * WAR ROOM Dashboard showing:
 * - Revenue at Risk
 * - Deals cần xử lý hôm nay
 * - AI Actions với EXECUTE buttons
 * - Money Impact cho mỗi action
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { toast } from 'sonner';
import { 
  Brain, DollarSign, TrendingDown, TrendingUp, AlertTriangle,
  Phone, ClipboardList, Users, RefreshCw, Zap, Target,
  ChevronRight, Clock, CheckCircle2, XCircle
} from 'lucide-react';
import { getWarRoomData, executeAction, getTodayActionsWithMoney } from '../../api/aiInsightApi';

const priorityColors = {
  critical: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
  urgent: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
  high: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  medium: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  low: { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30' }
};

const formatVND = (amount) => {
  if (!amount) return '0';
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)} tỷ`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(0)} triệu`;
  return `${amount.toLocaleString()} VND`;
};

export const AIWarRoom = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState({});

  useEffect(() => {
    fetchWarRoom();
  }, []);

  const fetchWarRoom = async () => {
    try {
      setLoading(true);
      const result = await getWarRoomData();
      setData(result);
    } catch (err) {
      toast.error('Không thể tải WAR ROOM');
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async (action) => {
    const key = `${action.entity_type}_${action.entity_id}_${action.action_type}`;
    setExecuting(prev => ({ ...prev, [key]: true }));
    
    try {
      const result = await executeAction({
        action_type: action.action_type,
        entity_type: action.entity_type,
        entity_id: action.entity_id,
        params: action.params || {}
      });
      
      if (result.success) {
        toast.success(`Thực hiện thành công: ${result.result?.message || action.action_label}`);
        // Refresh data
        fetchWarRoom();
      } else {
        toast.error(result.error || 'Thực hiện thất bại');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setExecuting(prev => ({ ...prev, [key]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Brain className="w-8 h-8 animate-pulse text-blue-400 mr-3" />
        <span className="text-slate-300">Đang tải WAR ROOM...</span>
      </div>
    );
  }

  const rar = data?.revenue_at_risk || {};
  const opp = data?.today_opportunity || {};
  const summary = data?.summary || {};

  return (
    <div className="space-y-4">
      {/* TOP METRICS */}
      <div className="grid grid-cols-4 gap-4">
        {/* Revenue at Risk */}
        <Card className="border-red-500/30 bg-red-500/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 mb-1">Revenue at Risk</p>
                <p className="text-2xl font-bold text-red-400">
                  {rar.formatted?.total || '0'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {rar.deals_count || 0} deals có rủi ro
                </p>
              </div>
              <TrendingDown className="w-10 h-10 text-red-500/50" />
            </div>
          </CardContent>
        </Card>

        {/* Today Opportunity */}
        <Card className="border-emerald-500/30 bg-emerald-500/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 mb-1">Cơ hội hôm nay</p>
                <p className="text-2xl font-bold text-emerald-400">
                  {opp.formatted || '0'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {opp.hot_leads_count || 0} leads nóng
                </p>
              </div>
              <TrendingUp className="w-10 h-10 text-emerald-500/50" />
            </div>
          </CardContent>
        </Card>

        {/* Actions Today */}
        <Card className="border-blue-500/30 bg-blue-500/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 mb-1">Actions cần làm</p>
                <p className="text-2xl font-bold text-blue-400">
                  {summary.actions_count || 0}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Hôm nay
                </p>
              </div>
              <Target className="w-10 h-10 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>

        {/* Critical Deals */}
        <Card className="border-amber-500/30 bg-amber-500/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 mb-1">Deals khẩn cấp</p>
                <p className="text-2xl font-bold text-amber-400">
                  {summary.deals_count || 0}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Cần xử lý ngay
                </p>
              </div>
              <AlertTriangle className="w-10 h-10 text-amber-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* AI ACTIONS - MAIN COLUMN */}
        <div className="col-span-2">
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <span className="text-slate-200">AI Actions - Thực hiện NGAY</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={fetchWarRoom}
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {data?.today_actions?.actions?.map((action, idx) => {
                    const colors = priorityColors[action.priority] || priorityColors.medium;
                    const execKey = `${action.entity_type}_${action.entity_id}_${action.action_type}`;
                    const isExecuting = executing[execKey];
                    const money = action.money_impact || {};
                    
                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-lg border ${colors.border} ${colors.bg}`}
                        data-testid={`war-room-action-${idx}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className={`${colors.text} ${colors.border} uppercase text-xs`}>
                                {action.priority}
                              </Badge>
                              <Badge variant="outline" className="text-xs bg-slate-700/50 text-slate-300 border-slate-600">
                                {action.entity_type}
                              </Badge>
                            </div>
                            
                            <h4 className="font-medium text-slate-200">
                              {action.entity_name}
                            </h4>
                            
                            <p className="text-sm text-slate-400 mt-1">
                              {action.reason}
                            </p>
                            
                            {/* Money Impact */}
                            <div className="mt-2 p-2 bg-slate-900/50 rounded border border-slate-700">
                              <div className="flex items-center gap-4 text-xs">
                                <div>
                                  <span className="text-slate-500">Giá trị: </span>
                                  <span className="text-emerald-400 font-medium">
                                    {formatVND(money.expected_value || action.value)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-500">Rủi ro mất: </span>
                                  <span className="text-red-400 font-medium">
                                    {formatVND(money.risk_loss)}
                                  </span>
                                </div>
                                {action.deadline && (
                                  <div className="flex items-center gap-1 text-amber-400">
                                    <Clock className="w-3 h-3" />
                                    <span>{action.deadline?.split(' ')[0]}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Execute Button */}
                          <Button
                            size="sm"
                            variant={action.priority === 'urgent' || action.priority === 'critical' ? 'destructive' : 'default'}
                            className="ml-4"
                            onClick={() => handleExecute(action)}
                            disabled={isExecuting}
                            data-testid={`execute-btn-${idx}`}
                          >
                            {isExecuting ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Phone className="w-4 h-4 mr-1" />
                                {action.action_label || 'Thực hiện'}
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  
                  {(!data?.today_actions?.actions || data.today_actions.actions.length === 0) && (
                    <div className="text-center py-8 text-slate-500">
                      <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Không có actions cần xử lý</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT SIDEBAR - HIGH RISK DEALS */}
        <div className="space-y-4">
          {/* High Risk Deals */}
          <Card className="border-red-500/30 bg-red-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <span className="text-slate-200">Deals cần xử lý</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[180px]">
                <div className="space-y-2">
                  {data?.deals_today?.map((deal, idx) => {
                    const money = deal.money_impact || {};
                    return (
                      <div
                        key={idx}
                        className="p-2 bg-slate-900/50 rounded border border-slate-700 hover:bg-slate-900 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-200 font-medium">
                            {deal.code || deal.deal_id?.slice(0, 8)}
                          </span>
                          <Badge variant="outline" className="text-xs bg-red-500/20 text-red-400 border-red-500/30">
                            {deal.risk_level}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{deal.customer_name}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-emerald-400">{formatVND(deal.value)}</span>
                          <span className="text-xs text-red-400">-{formatVND(money.risk_loss)}</span>
                        </div>
                      </div>
                    );
                  })}
                  
                  {(!data?.deals_today || data.deals_today.length === 0) && (
                    <p className="text-center text-slate-500 py-4 text-sm">
                      Không có deal rủi ro
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Hot Leads */}
          <Card className="border-emerald-500/30 bg-emerald-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <span className="text-slate-200">Leads nóng</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[180px]">
                <div className="space-y-2">
                  {data?.hot_leads?.map((lead, idx) => {
                    const money = lead.money_impact || {};
                    return (
                      <div
                        key={idx}
                        className="p-2 bg-slate-900/50 rounded border border-slate-700 hover:bg-slate-900 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-200 font-medium">
                            {lead.full_name}
                          </span>
                          <Badge variant="outline" className="text-xs bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                            Score: {lead.score}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{lead.phone}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-emerald-400">{formatVND(money.expected_value)}</span>
                          <span className="text-xs text-slate-500">{lead.status}</span>
                        </div>
                      </div>
                    );
                  })}
                  
                  {(!data?.hot_leads || data.hot_leads.length === 0) && (
                    <p className="text-center text-slate-500 py-4 text-sm">
                      Không có lead nóng
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AIWarRoom;
