import React from "react";

interface MockStatusBarProps {
  timeString: string;
}

export default function MockStatusBar({ timeString }: MockStatusBarProps) {
  return (
    <div className="bg-surface/90 backdrop-blur-md fixed md:absolute top-0 left-0 right-0 h-10 px-6 flex justify-between items-center z-40 text-on-surface-variant font-medium text-xs pointer-events-none">
      <span>{timeString}</span>
      <div className="flex items-center gap-1.5">
        <span className="material-symbols-outlined text-sm font-bold">signal_cellular_4_bar</span>
        <span className="material-symbols-outlined text-sm font-bold">wifi</span>
        <span className="material-symbols-outlined text-sm font-bold">battery_5_bar</span>
      </div>
    </div>
  );
}
