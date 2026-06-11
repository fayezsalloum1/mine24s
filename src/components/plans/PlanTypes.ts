export interface ClientPlan {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  dailyReturnPercent: number;
  durationDays: number;
  machineImage?: string | null;
  planType: string;
  isPooled?: boolean;
  targetPoolAmount?: number;
  poolProgress?: number;
  poolFilled?: number;
  poolRemaining?: number;
  poolParticipants?: number;
  soloDailyProfit?: number;
  poolDailyProfit?: number | null;
  minContribution?: number;
}
