/**
 * Live server startup: verify .env → migrate database → seed admin → start website
 */
import { spawnSync } from "node:child_process";

function run(label, cmd, args) {
  console.log(`\n▶ ${label}`);
  const result = spawnSync(cmd, args, { stdio: "inherit", shell: true, env: process.env });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run("Check configuration", "node", ["scripts/verify-env.mjs"]);
run("Update database", "npx", ["prisma", "migrate", "deploy"]);
run("Create admin account", "node", ["scripts/seed-admin.mjs"]);
run("Start website", "npx", ["next", "start", "-p", process.env.PORT || "3000"]);
