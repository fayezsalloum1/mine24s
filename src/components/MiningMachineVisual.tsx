"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useNow } from "@/hooks/useNow";
import {
  formatHashRate,
  formatUptimeHours,
  getLiveUptimeHours,
} from "@/lib/machine-status";
import MachineImage from "@/components/MachineImage";

export type MachineVisualProps = {
  name: string;
  imageSrc?: string | null;
  videoSrc?: string | null;
  online?: boolean;
  uptimeHours?: number;
  onlineSince?: string | Date | null;
  compact?: boolean;
  showStats?: boolean;
};

export default function MiningMachineVisual({
  name,
  imageSrc,
  videoSrc,
  online = true,
  uptimeHours = 0,
  onlineSince = null,
  compact = false,
  showStats = true,
}: MachineVisualProps) {
  const t = useTranslations("machine");
  const now = useNow();

  const liveUptime = useMemo(
    () =>
      getLiveUptimeHours(
        {
          machineOnline: online,
          machineUptimeHours: uptimeHours,
          machineOnlineSince: onlineSince ? new Date(onlineSince) : null,
        },
        now
      ),
    [online, uptimeHours, onlineSince, now]
  );

  const hashRate = formatHashRate(name, online);

  return (
    <div className={`mining-machine-wrap relative overflow-hidden ${compact ? "h-full" : ""}`}>
      {/* Video or animated backdrop */}
      <div className="absolute inset-0 mining-machine-bg">
        {videoSrc ? (
          <video
            className="absolute inset-0 w-full h-full object-cover opacity-90"
            src={videoSrc}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />
        ) : (
          <>
            <div className="mining-rig-scanner" />
            <div className="mining-rig-grid" />
            <MachineImage
              src={imageSrc}
              alt={name}
              className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-luminosity"
            />
          </>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        {online && <div className="mining-rig-glow" />}
      </div>

      {/* Animated fans overlay when online */}
      {online && (
        <div className="absolute bottom-3 left-3 flex gap-1 opacity-60 pointer-events-none">
          {[0, 1, 2].map((i) => (
            <div key={i} className="mining-fan" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      )}

      {/* Status bar */}
      {showStats && (
        <div className="absolute inset-x-0 bottom-0 z-10 p-2 sm:p-3 bg-gradient-to-t from-black/90 via-black/70 to-transparent">
          <div className="flex items-center justify-between gap-2 text-[10px] sm:text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide shrink-0 ${
                  online
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 mining-status-pulse"
                    : "bg-red-500/20 text-red-400 border border-red-500/40"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${online ? "bg-emerald-400" : "bg-red-400"}`} />
                {online ? t("online") : t("offline")}
              </span>
              {!compact && (
                <span className="text-cyan-400/90 font-mono truncate hidden sm:inline">{hashRate}</span>
              )}
            </div>
            <div className="text-amber-400/90 font-mono shrink-0 tabular-nums">
              <span className="text-slate-500 mr-1 hidden xs:inline">{t("uptime")}</span>
              {formatUptimeHours(liveUptime)}
            </div>
          </div>
          {online && (
            <div className="mt-1 h-0.5 rounded-full bg-slate-800 overflow-hidden">
              <div className="mining-hash-bar h-full rounded-full" />
            </div>
          )}
        </div>
      )}

      {!online && (
        <div className="absolute inset-0 z-[5] bg-slate-950/50 flex items-center justify-center pointer-events-none">
          <span className="text-red-400/80 text-xs font-bold uppercase tracking-widest border border-red-500/30 px-3 py-1 rounded-lg bg-black/40">
            {t("maintenance")}
          </span>
        </div>
      )}
    </div>
  );
}
