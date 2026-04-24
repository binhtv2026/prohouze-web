/**
 * AICopilotButton.jsx
 * ─────────────────────────────────────────────────────────────
 * Floating AI button — hiển thị trên mọi màn hình của app mobile.
 * Nhấn → mở AICopilotDrawer.
 * Pulse animation để thu hút chú ý.
 */
import { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { AICopilotDrawer } from './AICopilotDrawer';

export function AICopilotButton({ role = 'sale', userName = 'Anh/chị', style = {} }) {
  const [open, setOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <>
      {/* Floating button */}
      <div
        className="fixed z-50 flex flex-col items-center"
        style={{ bottom: 90, right: 20, ...style }}
      >
        {/* Tooltip */}
        {showTooltip && !open && (
          <div className="mb-2 bg-slate-900 text-white text-[10px] font-semibold px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap animate-fade-in">
            AI Trợ lý ProHouze
          </div>
        )}

        {/* Button */}
        <button
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onClick={() => setOpen(v => !v)}
          className="relative w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
          }}
        >
          {/* Pulse rings */}
          {!open && (
            <>
              <span className="absolute inset-0 rounded-full bg-violet-500/30 animate-ping" />
              <span className="absolute inset-1 rounded-full bg-violet-500/20 animate-ping" style={{ animationDelay: '300ms' }} />
            </>
          )}
          {open
            ? <X className="w-5 h-5 text-white relative z-10" />
            : <Sparkles className="w-6 h-6 text-white relative z-10" />
          }
        </button>

        {/* AI label */}
        {!open && (
          <span className="mt-1 text-[9px] font-bold text-white/80 bg-slate-900/80 px-2 py-0.5 rounded-full">
            AI
          </span>
        )}
      </div>

      {/* Drawer */}
      <AICopilotDrawer
        isOpen={open}
        onClose={() => setOpen(false)}
        role={role}
        userName={userName}
      />
    </>
  );
}

export default AICopilotButton;
