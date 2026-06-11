export type MachineStatusFields = {
  machineOnline: boolean;
  machineUptimeHours: number;
  machineOnlineSince: Date | null;
};

export function getLiveUptimeHours(plan: MachineStatusFields, now = new Date()): number {
  const base = plan.machineUptimeHours ?? 0;
  if (!plan.machineOnline || !plan.machineOnlineSince) return base;
  const elapsedH = (now.getTime() - plan.machineOnlineSince.getTime()) / (1000 * 60 * 60);
  return base + Math.max(0, elapsedH);
}

export function formatUptimeHours(hours: number): string {
  const totalMinutes = Math.floor(hours * 60);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hrs = Math.floor((totalMinutes % (60 * 24)) / 60);
  const mins = totalMinutes % 60;
  if (days > 0) return `${days}d ${hrs}h ${mins}m`;
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

export function formatHashRate(planName: string, online: boolean): string {
  if (!online) return "0.00 TH/s";
  let hash = 0;
  for (let i = 0; i < planName.length; i++) hash += planName.charCodeAt(i);
  const th = 12 + (hash % 880) / 10;
  return `${th.toFixed(2)} TH/s`;
}
