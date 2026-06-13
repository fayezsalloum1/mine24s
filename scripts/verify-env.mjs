/**
 * Validates required env vars before migrate/start (production entrypoint).
 * Does NOT run during `npm run build` — set env on the server, not in the build step.
 */

const required = [
  "DATABASE_URL",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
];

const missing = required.filter((key) => !process.env[key]?.trim());

const supabaseConfigured =
  Boolean(process.env.SUPABASE_PUBLIC?.trim()) ||
  (Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || process.env.SUPABASE_URL?.trim()) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || process.env.SUPABASE_ANON_KEY?.trim()));

if (missing.length > 0) {
  console.error("\n❌ Missing required environment variables:\n");
  for (const key of missing) {
    console.error(`   • ${key}`);
  }
  console.error("\nCopy .env.example → .env and fill in all required values.\n");
  process.exit(1);
}

if (!supabaseConfigured) {
  console.error("\n❌ Missing Supabase environment variable:\n");
  console.error("   • SUPABASE_PUBLIC (format: https://project.supabase.co|anon-key)");
  console.error("   • or NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY");
  console.error("\nAdd them in Vercel/host env for Google sign-in.\n");
  process.exit(1);
}

const useCustom = process.env.USE_CUSTOM_PLATFORM_WALLET === "true";
const hasTreasury =
  Boolean(process.env.ADMIN_TREASURY_EVM?.trim()) &&
  Boolean(process.env.ADMIN_TREASURY_TRC20?.trim());
const hasMnemonic = Boolean(process.env.MASTER_WALLET_MNEMONIC?.trim());

if (useCustom && !hasTreasury) {
  console.error("\n❌ Custom wallet mode requires ADMIN_TREASURY_EVM and ADMIN_TREASURY_TRC20.\n");
  process.exit(1);
}

if (!useCustom && !hasMnemonic) {
  console.error("\n❌ Wallet not configured.");
  console.error("   Set USE_CUSTOM_PLATFORM_WALLET=true + treasury addresses,");
  console.error("   or set MASTER_WALLET_MNEMONIC for HD wallet mode.\n");
  process.exit(1);
}

console.log("✓ Environment variables OK");
console.log(`✓ Wallet mode: ${useCustom ? "custom treasury" : "HD mnemonic"}`);
