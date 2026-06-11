# Cloud Mining Platform

Website for cloud mining: user accounts, deposits, mining plans, earnings, referrals, withdrawals, and admin panel.

---

## Run on your computer (development)

1. Copy `.env.example` to `.env` and fill in your values.
2. Install and start:

```bash
npm install
npm run db:migrate
npm run dev
```

3. Open `http://localhost:3000`

---

## Put the website online (production)

You need:

- A **web server** with **Node.js 20+** (VPS, cloud server, or hosting panel with Node support)
- A **PostgreSQL** database (on the same server or hosted separately)
- Your **domain name** pointed to the server (optional but recommended)

### Step 1 — Upload the project

Copy the whole project folder to your server (FTP, SFTP, or file manager).

**Do not upload:** `node_modules`, `.next`, or your real `.env` file.

Upload everything else: source code, `package.json`, `prisma/`, `public/`, etc.

### Step 2 — Create `.env` on the server

On the server, copy `.env.example` to `.env` and set:

| Variable | Example |
|----------|---------|
| `DATABASE_URL` | `postgresql://user:pass@localhost:5432/miningfarm` |
| `NEXTAUTH_URL` | `https://yourdomain.com` |
| `NEXTAUTH_SECRET` | Long random string |
| `ADMIN_EMAIL` | Your admin login email |
| `ADMIN_PASSWORD` | Your admin password |
| `USE_CUSTOM_PLATFORM_WALLET` | `true` |
| `ADMIN_TREASURY_EVM` | Your `0x...` wallet address |
| `ADMIN_TREASURY_TRC20` | Your `T...` Tron address |

**Never put wallet seed phrases on the server.** Use public addresses only (`USE_CUSTOM_PLATFORM_WALLET=true`).

### Step 3 — Install and build

On the server, in the project folder:

```bash
npm install
npm run build
```

### Step 4 — Start the live site

One command (checks config, updates database, creates admin, starts site):

```bash
npm run start:live
```

The site runs on port **3000** (change with `PORT=8080` in `.env`).

### Step 5 — Keep it running (recommended)

Use **PM2** so the site restarts if the server reboots:

```bash
npm install -g pm2
npm run setup
pm2 start npm --name mining -- start
pm2 save
pm2 startup
```

Or run setup once, then `pm2 start npm --name mining -- start`.

### Step 6 — HTTPS (recommended)

Put **Nginx** or **Caddy** in front of port 3000 and add a free SSL certificate (Let's Encrypt).

Set `NEXTAUTH_URL=https://yourdomain.com` in `.env` to match your domain exactly.

---

## Configuration reference

See `.env.example` for all options (email, SMS, blockchain RPC, etc.).

**Required for the site to work:**

- Database + auth settings (above)
- Wallet addresses (custom mode) **or** `MASTER_WALLET_MNEMONIC` (advanced)

**Optional:**

- `SMTP_*` — email notifications
- `TWILIO_*` — SMS verification
- `ETH_RPC_URL`, `BSC_RPC_URL` — auto deposit scanning
- `DISABLE_DEPOSIT_SCANNER=true` — turn off background deposit scanner

---

## Health check

Visit: `https://yourdomain.com/api/health`

Expected: `{"ok":true,"database":"connected"}`

---

## If the dashboard shows a database error

On the server run:

```bash
npm run db:migrate
```

Then restart the site.

---

## Admin wallet addresses

To print deposit addresses configured in `.env`:

```bash
npm run admin:addresses
```

---

## How the platform works

- Users register and deposit USDT to your platform addresses.
- Deposits can be confirmed automatically (scanner) or manually in the admin panel.
- Users buy mining plans; daily earnings accrue over the plan period.
- Withdrawals are approved by admin.

Background deposit scanning starts automatically when the server runs (`ENABLE_BACKGROUND_SCANNER=true`).
