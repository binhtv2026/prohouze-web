/**
 * Next Best Action Widget
 * Shows prioritized actions for sales users
 */

import React, { useState, useEffect } from 'react';
import { 
  Zap, Phone, FileText, MapPin, MessageCircle, 
  CreditCard, DollarSign, AlertTriangle, ChevronRight 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { getNextBestActions } from '../../lib/workApi';

const iconMap = {
  Phone, FileText, MapPin, MessageCircle, CreditCard,
  DollarSign, AlertTriangle
};

export default function NextBestAction({ userId, onTaskClick, limit = 5 }) {
  const [actions, setActions] = useState({ urgent_actions: [], important_actions: [] });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchActions = async () => {
      try {
        setLoading(true);
        const data = await getNextBestActions(userId, limit);
        setActions(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchActions();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchActions, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [userId, limit]);
  
  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const { urgent_actions, important_actions, total_pending } = actions;
  const hasActions = urgent_actions.length > 0 || important_actions.length > 0;
  
  return (
    <Card data-testid="next-best-action-widget">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-500" />
          VIEC CAN LAM TIEP THEO
          {total_pending > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {total_pending} viec
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {!hasActions ? (
          <div className="text-center py-6 text-gray-500 text-sm">
            Khong co viec can lam ngay
          </div>
        ) : (
          <div className="divide-y">
            {/* Urgent Actions */}
            {urgent_actions.map((action) => (
              <ActionItem 
                key={action.task_id} 
                action={action} 
                urgent
                onClick={() => onTaskClick?.(action)}
              />
            ))}
            
            {/* Important Actions */}
            {important_actions.slice(0, 3).map((action) => (
              <ActionItem 
                key={action.task_id} 
                action={action}
                onClick={() => onTaskClick?.(action)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ActionItem({ action, urgent, onClick }) {
  const IconComponent = iconMap[action.task_type_icon] || AlertTriangle;
  
  const getUrgencyBadge = () => {
    if (action.urgency_level === 'critical') {
      return <Badge className="bg-red-500 text-white text-xs">KHAN CAP</Badge>;
    }
    if (action.urgency_level === 'high') {
      return <Badge className="bg-orange-500 text-white text-xs">QUAN TRONG</Badge>;
    }
    return null;
  };
  
  return (
    <div 
      className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
        urgent ? 'bg-red-50/50' : ''
      }`}
      onClick={onClick}
      data-testid={`action-item-${action.task_id}`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-full flex-shrink-0 ${
          urgent ? 'bg-red-100' : 'bg-blue-100'
        }`}>
          <IconComponent className={`w-4 h-4 ${
            urgent ? 'text-red-600' : 'text-blue-600'
          }`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm text-gray-900 truncate">
              {action.title}
            </span>
            {getUrgencyBadge()}
          </div>
          
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
            <span>{action.entity_name || action.customer_name}</span>
            <span>|</span>
            <span className={urgent ? 'text-red-600 font-medium' : ''}>
              {action.urgency_reason}
            </span>
          </div>
        </div>
        
        <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
      </div>
    </div>
  );
}
