/** Disable background deposit scanner (setInterval). Use /api/cron/scan-deposits instead. */
export function isDepositScannerDisabled() {
  if (process.env.DISABLE_DEPOSIT_SCANNER === "true") return true;
  if (process.env.ENABLE_BACKGROUND_SCANNER === "false") return true;
  return false;
}
