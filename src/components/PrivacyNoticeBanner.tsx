import React, { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import {
  getPrivacyPreference,
  PrivacyPreference,
  setPrivacyPreference,
} from '../utils/analyticsClient';

export const PrivacyNoticeBanner: React.FC = () => {
  const [pref, setPref] = useState<PrivacyPreference>('accepted');

  useEffect(() => {
    setPref(getPrivacyPreference());
  }, []);

  if (pref !== 'unset') return null;

  return (
    <aside
      aria-label="Privacy and analytics notice"
      className="fixed bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-[65] bg-[#1A1A1A]/95 text-[#F2EBDD] border border-white/15 px-4 py-3 shadow-[0_14px_40px_rgba(0,0,0,0.4)]"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5 text-xs leading-snug text-[#F2EBDD]/85">
          <ShieldCheck className="w-4 h-4 text-[#F5B800] shrink-0 mt-0.5" aria-hidden="true" />
          <p>
            CyberNest measures aggregate site visits privately without third-party ad cookies or
            personal data tracking.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setPrivacyPreference('opted_out');
              setPref('opted_out');
            }}
            className="px-3 py-1.5 text-[11px] font-medium border border-white/20 text-[#F2EBDD]/80 hover:text-white hover:border-white/40 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Opt Out
          </button>
          <button
            type="button"
            onClick={() => {
              setPrivacyPreference('accepted');
              setPref('accepted');
            }}
            className="px-3 py-1.5 text-[11px] font-bold bg-[#F5B800] text-[#1A1A1A] hover:bg-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Accept
          </button>
        </div>
      </div>
    </aside>
  );
};
