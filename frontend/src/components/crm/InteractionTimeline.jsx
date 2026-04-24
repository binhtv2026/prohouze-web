/**
 * Interaction Timeline Component
 * Prompt 6/20 - CRM Unified Profile Standardization
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Mail,
  MessageSquare,
  MessageCircle,
  Users,
  Home,
  FileText,
  GitBranch,
  RefreshCw,
  UserPlus,
  Edit3,
  CheckCircle,
  Bookmark,
  DollarSign,
  FileSignature,
  Settings,
  Zap,
  GitMerge,
  Package,
} from 'lucide-react';

const INTERACTION_ICONS = {
  call_outbound: PhoneOutgoing,
  call_inbound: PhoneIncoming,
  call_missed: PhoneMissed,
  sms: MessageSquare,
  email: Mail,
  zns: MessageCircle,
  chat: MessageCircle,
  meeting: Users,
  site_visit: Home,
  note: FileText,
  stage_change: GitBranch,
  status_change: RefreshCw,
  assignment: UserPlus,
  reassignment: Users,
  demand_update: Edit3,
  demand_match: CheckCircle,
  product_presented: Package,
  deal_created: Bookmark,
  booking_created: Bookmark,
  deposit_received: DollarSign,
  contract_signed: FileSignature,
  system: Settings,
  auto_action: Zap,
  duplicate_merge: GitMerge,
};

const INTERACTION_COLORS = {
  call_outbound: 'text-blue-600 bg-blue-50',
  call_inbound: 'text-green-600 bg-green-50',
  call_missed: 'text-red-600 bg-red-50',
  sms: 'text-purple-600 bg-purple-50',
  email: 'text-indigo-600 bg-indigo-50',
  zns: 'text-blue-600 bg-blue-50',
  chat: 'text-cyan-600 bg-cyan-50',
  meeting: 'text-amber-600 bg-amber-50',
  site_visit: 'text-emerald-600 bg-emerald-50',
  note: 'text-slate-600 bg-slate-50',
  stage_change: 'text-purple-600 bg-purple-50',
  status_change: 'text-orange-600 bg-orange-50',
  assignment: 'text-teal-600 bg-teal-50',
  reassignment: 'text-yellow-600 bg-yellow-50',
  demand_update: 'text-pink-600 bg-pink-50',
  demand_match: 'text-green-600 bg-green-50',
  product_presented: 'text-blue-600 bg-blue-50',
  deal_created: 'text-indigo-600 bg-indigo-50',
  booking_created: 'text-amber-600 bg-amber-50',
  deposit_received: 'text-yellow-600 bg-yellow-50',
  contract_signed: 'text-emerald-600 bg-emerald-50',
  system: 'text-gray-600 bg-gray-50',
  auto_action: 'text-violet-600 bg-violet-50',
  duplicate_merge: 'text-rose-600 bg-rose-50',
};

export default function InteractionTimeline({ interactions = [], total = 0 }) {
  if (interactions.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>Chưa có tương tác nào</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* Timeline Items */}
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-200" />

        {interactions.map((interaction, index) => {
          const Icon = INTERACTION_ICONS[interaction.interaction_type] || MessageSquare;
          const colorClass = INTERACTION_COLORS[interaction.interaction_type] || 'text-slate-600 bg-slate-50';
          const [iconColor, bgColor] = colorClass.split(' ');

          return (
            <div key={interaction.id || index} className="relative flex gap-4 pb-6 last:pb-0">
              {/* Icon */}
              <div className={`relative z-10 w-10 h-10 rounded-full ${bgColor} flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${iconColor}`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div>
                    <h4 className="font-medium text-slate-900 text-sm">
                      {interaction.title}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {interaction.interaction_type_label || interaction.interaction_type}
                      {interaction.user_name && ` • ${interaction.user_name}`}
                    </p>
                  </div>
                  <span className="text-xs text-slate-400 shrink-0">
                    {formatDate(interaction.created_at)}
                  </span>
                </div>

                {interaction.content && (
                  <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                    {interaction.content}
                  </p>
                )}

                {/* Stage/Status Change */}
                {(interaction.old_value || interaction.new_value) && (
                  <div className="flex items-center gap-2 mt-2">
                    {interaction.old_value && (
                      <Badge variant="outline" className="text-xs">
                        {interaction.old_value}
                      </Badge>
                    )}
                    {interaction.old_value && interaction.new_value && (
                      <span className="text-slate-400">→</span>
                    )}
                    {interaction.new_value && (
                      <Badge className="text-xs bg-[#316585] text-white">
                        {interaction.new_value}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Outcome */}
                {interaction.outcome && (
                  <Badge 
                    variant="outline" 
                    className={`mt-2 text-xs ${
                      interaction.outcome === 'positive' ? 'border-green-300 text-green-700' :
                      interaction.outcome === 'negative' ? 'border-red-300 text-red-700' :
                      'border-slate-300 text-slate-700'
                    }`}
                  >
                    {interaction.outcome_label || interaction.outcome}
                  </Badge>
                )}

                {/* Auto indicator */}
                {interaction.is_auto && (
                  <Badge variant="outline" className="mt-2 text-xs border-violet-300 text-violet-700">
                    <Zap className="w-3 h-3 mr-1" />
                    Tự động
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Load More */}
      {total > interactions.length && (
        <div className="text-center pt-4">
          <span className="text-sm text-slate-500">
            Hiển thị {interactions.length} / {total} tương tác
          </span>
        </div>
      )}
    </div>
  );
}
