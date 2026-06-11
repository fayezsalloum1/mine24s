/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import AppHeader from "@/components/AppHeader";
import AdminPlansSection from "@/components/AdminPlansSection";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const [users, setUsers] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [activeTab, setActiveTab] = useState("users");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [referralTree, setReferralTree] = useState<any>(null);
  const [inputValue, setInputValue] = useState("");
  const [notificationMsg, setNotificationMsg] = useState("");
  const [message, setMessage] = useState("");
  const [filterFrozen, setFilterFrozen] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterHasActivePlan, setFilterHasActivePlan] = useState("");
  const [activePlans, setActivePlans] = useState<any[]>([]);
  const [treasury, setTreasury] = useState<any>(null);

  const hasActiveFilters = Boolean(filterFrozen || filterRole || filterDate || filterHasActivePlan);

  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setMessage(tc("copied"));
  };

  const clearFilters = () => {
    setFilterFrozen("");
    setFilterRole("");
    setFilterDate("");
    setFilterHasActivePlan("");
  };

  const [adminError, setAdminError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && session?.user?.role !== "ADMIN") router.push("/dashboard");
  }, [status, session, router]);

  const loadData = async () => {
    if (session?.user?.role !== "ADMIN") return;

    const params = new URLSearchParams();
    if (filterFrozen) params.set("frozen", filterFrozen);
    if (filterRole) params.set("role", filterRole);
    if (filterDate) params.set("dateFrom", filterDate);
    if (filterHasActivePlan) params.set("hasActivePlan", filterHasActivePlan);

    try {
      const [usersRes, withdrawalsRes, depositsRes, notificationsRes, statsRes, activePlansRes, treasuryRes] = await Promise.all([
        fetch(`/api/admin/users?${params}`),
        fetch("/api/admin/withdrawals"),
        fetch("/api/admin/deposits"),
        fetch("/api/admin/notifications"),
        fetch("/api/admin/stats"),
        fetch("/api/admin/active-plans"),
        fetch("/api/admin/wallet"),
      ]);

      const usersData = await usersRes.json();
      const withdrawalsData = await withdrawalsRes.json();
      const depositsData = await depositsRes.json();
      const notificationsData = await notificationsRes.json();
      const statsData = await statsRes.json();
      const activePlansData = await activePlansRes.json();
      const treasuryData = await treasuryRes.json();

      if (!usersRes.ok) throw new Error(usersData.error || "Failed to load users");
      setUsers(Array.isArray(usersData) ? usersData : []);
      setActivePlans(Array.isArray(activePlansData) ? activePlansData : []);
      setWithdrawals(Array.isArray(withdrawalsData) ? withdrawalsData : []);
      setDeposits(Array.isArray(depositsData) ? depositsData : []);
      setNotifications(Array.isArray(notificationsData) ? notificationsData : []);
      setStats(statsData.error ? {} : statsData);
      setTreasury(treasuryRes.ok ? treasuryData : null);
      setAdminError("");
    } catch (err) {
      setAdminError(err instanceof Error ? err.message : "Failed to load admin data");
      setUsers([]);
      setWithdrawals([]);
      setDeposits([]);
      setNotifications([]);
      setStats({});
      setActivePlans([]);
      setTreasury(null);
    }
  };

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "ADMIN") {
      loadData();
    }
  }, [status, session, filterFrozen, filterRole, filterDate, filterHasActivePlan]);

  async function userAction(id: string, action: string, value?: string) {
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action, value }),
    });
    const data = await res.json();
    if (data.error) {
      setMessage("Error: " + data.error);
    } else {
      setMessage(t("done"));
      setSelectedUser(null);
      setInputValue("");
      loadData();
    }
  }

  async function handleDeposit(id: string, action: string) {
    await fetch("/api/admin/deposits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    loadData();
  }

  async function handleWithdrawal(id: string, action: string) {
    await fetch("/api/admin/withdrawals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    loadData();
  }

  async function triggerEarnings(userId: string) {
    const res = await fetch("/api/admin/earnings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json();
    setMessage(data.success ? `Earned $${data.earned?.toFixed(2)}` : data.error);
  }

  async function sendNotification(userId: string) {
    await fetch("/api/admin/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, message: notificationMsg }),
    });
    setNotificationMsg("");
    setMessage(t("done"));
    loadData();
  }

  async function loadReferralTree(userId: string) {
    const res = await fetch(`/api/admin/referrals?userId=${userId}`);
    setReferralTree(await res.json());
  }

  const tabs = [
    { id: "stats", label: t("statsTab") },
    { id: "plans", label: t("plansTab") },
    { id: "users", label: t("users") },
    { id: "activePlans", label: t("activePlansTab") },
    { id: "deposits", label: t("deposits") },
    { id: "withdrawals", label: t("withdrawals") },
    { id: "notifications", label: t("notifications") },
  ];

  if (status === "loading") {
    return <div className="page-shell flex items-center justify-center text-white">{tc("loading")}</div>;
  }

  if (session?.user?.role !== "ADMIN") return null;

  return (
    <div className="page-shell text-white">
      <AppHeader />
      <div className="page-content-wide">
        <h1 className="page-title">{t("title")}</h1>
        {adminError && (
          <div className="bg-red-950/50 border border-red-500/40 text-red-300 p-4 rounded-xl mb-4">{adminError}</div>
        )}
        {message && (
          <div className="bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 p-4 rounded-xl mb-4 flex justify-between items-center">
            <span>{message}</span>
            <button onClick={() => setMessage("")} className="text-emerald-400 hover:text-white px-2">✕</button>
          </div>
        )}

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={activeTab === tab.id ? "admin-tab-active" : "admin-tab"}
            >
              {tab.label}
              {tab.id === "users" && ` (${users.length})`}
              {tab.id === "activePlans" && ` (${activePlans.length})`}
              {tab.id === "deposits" && ` (${deposits.filter((d) => d.status === "PENDING").length})`}
              {tab.id === "withdrawals" && ` (${withdrawals.filter((w) => w.status === "PENDING").length})`}
            </button>
          ))}
        </div>

        {activeTab === "stats" && (
          <>
          <div className="admin-panel mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-amber-400 mb-2">{t("treasuryWallet")}</h2>
            <p className="text-sm text-gray-400 mb-4">{t("treasuryHint")}</p>
            {treasury?.addresses ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-400">
                  {t("walletIndex")}: <span className="text-white">{treasury.walletIndex ?? "—"}</span>
                  {" · "}
                  {treasury.addresses?.source === "custom" || treasury.source === "custom"
                    ? t("walletSourceCustom")
                    : t("walletSourceHd")}
                  {treasury.source !== "custom" && (
                    <>
                      {" · "}
                      {t("autoSweep")}: <span className={treasury.autoSweepEnabled ? "text-green-400" : "text-red-400"}>{treasury.autoSweepEnabled ? tc("active") : tc("rejected")}</span>
                    </>
                  )}
                </p>
                {(["ERC20", "BEP20", "TRC20"] as const).map((net) => (
                  <div key={net} className="bg-slate-800/60 border border-slate-700/50 p-4 rounded-xl">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <span className="font-bold text-yellow-500">{net}</span>
                      <span className="text-green-400 text-sm">
                        USDT: ${treasury.usdtBalances?.[net]?.toFixed(2) ?? "0.00"}
                      </span>
                    </div>
                    <p className="font-mono text-xs break-all text-gray-300">{treasury.addresses[net]}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-gray-500">
                        {net === "ERC20" ? `ETH: ${treasury.nativeBalances?.ETH?.toFixed(4) ?? "0"}` : null}
                        {net === "BEP20" ? `BNB: ${treasury.nativeBalances?.BNB?.toFixed(4) ?? "0"}` : null}
                        {net === "TRC20" ? `TRX: ${treasury.nativeBalances?.TRX?.toFixed(2) ?? "0"}` : null}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyText(treasury.addresses[net])}
                        className="text-xs text-yellow-500 hover:text-yellow-400"
                      >
                        {tc("copy")}
                      </button>
                    </div>
                  </div>
                ))}
                {treasury.balanceError && (
                  <p className="text-red-400 text-sm">{treasury.balanceError}</p>
                )}
              </div>
            ) : (
              <p className="text-gray-400">{t("treasuryNotConfigured")}</p>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <div className="admin-stat">
              <p className="text-slate-400 text-xs sm:text-sm">{t("totalUsers")}</p>
              <p className="text-2xl sm:text-3xl font-bold text-gradient-gold">{stats.totalUsers ?? 0}</p>
            </div>
            <div className="admin-stat">
              <p className="text-slate-400 text-xs sm:text-sm">{t("usersWithActivePlans")}</p>
              <p className="text-2xl sm:text-3xl font-bold text-emerald-400">{stats.usersWithActivePlans ?? 0}</p>
            </div>
            <div className="admin-stat">
              <p className="text-slate-400 text-xs sm:text-sm">{t("totalActivePlans")}</p>
              <p className="text-2xl sm:text-3xl font-bold text-emerald-400">{stats.totalActivePlans ?? 0}</p>
            </div>
            <div className="admin-stat">
              <p className="text-slate-400 text-xs sm:text-sm">{t("totalDeposits")}</p>
              <p className="text-2xl sm:text-3xl font-bold text-emerald-400">${stats.totalDeposits?.toFixed(2) ?? "0"}</p>
            </div>
            <div className="admin-stat">
              <p className="text-slate-400 text-xs sm:text-sm">{t("totalWithdrawals")}</p>
              <p className="text-2xl sm:text-3xl font-bold text-red-400">${stats.totalWithdrawals?.toFixed(2) ?? "0"}</p>
            </div>
            <div className="admin-stat">
              <p className="text-slate-400 text-xs sm:text-sm">{t("platformBalance")}</p>
              <p className="text-2xl sm:text-3xl font-bold text-gradient-gold">${stats.platformBalance?.toFixed(2) ?? "0"}</p>
            </div>
          </div>
          </>
        )}

        {activeTab === "plans" && <AdminPlansSection />}

        {activeTab === "users" && (
          <div>
            <div className="admin-panel mb-4">
              <div className="flex flex-wrap items-end justify-between gap-4 mb-3">
                <div>
                  <p className="text-sm text-gray-400">{t("showingUsers")}</p>
                  <p className="text-xl font-bold text-yellow-500">
                    {users.length}
                    {stats.totalUsers ? (
                      <span className="text-sm font-normal text-gray-400"> / {stats.totalUsers} {t("total")}</span>
                    ) : null}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearFilters}
                  disabled={!hasActiveFilters}
                  className="btn-primary px-4 py-2 rounded-xl text-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {t("showAllUsers")}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <label className="block">
                  <span className="text-xs text-gray-400 mb-1 block">{t("filterFrozen")}</span>
                  <select
                    value={filterFrozen}
                    onChange={(e) => setFilterFrozen(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-800/80 border border-slate-600/60 text-sm focus:border-amber-500/50 outline-none"
                  >
                    <option value="">{t("all")}</option>
                    <option value="true">{tc("frozen")}</option>
                    <option value="false">{tc("active")}</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs text-gray-400 mb-1 block">{t("filterRole")}</span>
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-800/80 border border-slate-600/60 text-sm focus:border-amber-500/50 outline-none"
                  >
                    <option value="">{t("all")}</option>
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs text-gray-400 mb-1 block">{t("filterPlans")}</span>
                  <select
                    value={filterHasActivePlan}
                    onChange={(e) => setFilterHasActivePlan(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-800/80 border border-slate-600/60 text-sm focus:border-amber-500/50 outline-none"
                  >
                    <option value="">{t("allUsers")}</option>
                    <option value="true">{t("withActivePlans")}</option>
                    <option value="false">{t("withoutActivePlans")}</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs text-gray-400 mb-1 block">{t("filterDate")}</span>
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-800/80 border border-slate-600/60 text-sm focus:border-amber-500/50 outline-none"
                  />
                </label>
              </div>

              {hasActiveFilters && (
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-700">
                  <span className="text-xs text-gray-500 self-center">{t("activeFilters")}:</span>
                  {filterFrozen && (
                    <span className="text-xs bg-gray-700 px-2 py-1 rounded">
                      {t("filterFrozen")}: {filterFrozen === "true" ? tc("frozen") : tc("active")}
                    </span>
                  )}
                  {filterRole && (
                    <span className="text-xs bg-gray-700 px-2 py-1 rounded">
                      {t("filterRole")}: {filterRole}
                    </span>
                  )}
                  {filterHasActivePlan && (
                    <span className="text-xs bg-gray-700 px-2 py-1 rounded">
                      {t("filterPlans")}: {filterHasActivePlan === "true" ? t("withActivePlans") : t("withoutActivePlans")}
                    </span>
                  )}
                  {filterDate && (
                    <span className="text-xs bg-gray-700 px-2 py-1 rounded">
                      {t("filterDate")}: {filterDate}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="p-4 text-left">{tc("email")}</th>
                    <th className="p-4 text-left">{tc("balance")}</th>
                    <th className="p-4 text-left">{t("activePlans")}</th>
                    <th className="p-4 text-left">{t("referralCount")}</th>
                    <th className="p-4 text-left">{t("referredBy")}</th>
                    <th className="p-4 text-left">{t("phone")}</th>
                    <th className="p-4 text-left">{tc("status")}</th>
                    <th className="p-4 text-left">{tc("actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-4 text-center text-gray-400">
                        {hasActiveFilters ? t("noUsersMatchFilters") : t("noData")}
                      </td>
                    </tr>
                  ) : users.map((user) => (
                    <tr key={user.id} className="border-b border-gray-700">
                      <td className="p-4">{user.email}</td>
                      <td className="p-4 text-yellow-500">${user.balance.toFixed(2)}</td>
                      <td className="p-4">
                        {user.activePlanCount > 0 ? (
                          <div className="text-sm">
                            <span className="text-green-400 font-bold">{user.activePlanCount}</span>
                            <div className="text-gray-400 text-xs mt-1">
                              {user.activePlans?.map((p: any) => p.planName).join(", ")}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="p-4">{user.referralCount ?? 0}</td>
                      <td className="p-4 text-sm text-gray-400">{user.referredByEmail ?? "-"}</td>
                      <td className="p-4 text-sm">{user.phoneNumber ?? "-"}</td>
                      <td className="p-4">
                        {user.isFrozen ? (
                          <span className="text-red-400">{tc("frozen")}</span>
                        ) : (
                          <span className="text-green-400">{tc("active")}</span>
                        )}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => { setSelectedUser(user); loadReferralTree(user.id); }}
                          className="bg-blue-600 px-3 py-1 rounded hover:bg-blue-500 text-sm"
                        >
                          {t("manage")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedUser && (
              <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="admin-panel w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-panel animate-slide-up">
                  <h2 className="text-lg font-bold text-gradient-gold mb-4">{selectedUser.email}</h2>
                  <p className="text-gray-400 mb-2">{tc("balance")}: ${selectedUser.balance.toFixed(2)}</p>
                  <p className="text-gray-400 mb-4">{t("referrals")}: {selectedUser.referralCount ?? 0}</p>

                  {selectedUser.activePlans?.length > 0 && (
                    <div className="mb-4 p-3 bg-slate-800/60 rounded-xl border border-slate-700/50">
                      <h3 className="font-bold text-amber-400 mb-2">{t("activePlans")}</h3>
                      {selectedUser.activePlans.map((p: any) => (
                        <div key={p.id} className="text-sm mb-2 border-b border-gray-600 pb-2 last:border-0">
                          <p className="text-white font-medium">{p.planName} — ${p.planPrice}</p>
                          <p className="text-green-400">{p.dailyReturnPercent}% · ${p.dailyProfit?.toFixed(2)}/day</p>
                          <p className="text-gray-500 text-xs">{t("purchased")}: {new Date(p.purchasedAt).toLocaleDateString()}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {referralTree && (
                    <div className="mb-4 p-3 bg-slate-800/60 rounded-xl border border-slate-700/50">
                      <h3 className="font-bold text-amber-400 mb-2">{t("referralTree")}</h3>
                      {referralTree.referrer && (
                        <p className="text-sm text-gray-400">↑ {referralTree.referrer.email}</p>
                      )}
                      {referralTree.referrals?.map((r: any) => (
                        <p key={r.id} className="text-sm">→ {r.email} ({r.userPlans?.length ?? 0} plans)</p>
                      ))}
                    </div>
                  )}

                  <input
                    type="text"
                    placeholder="Value"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full form-input mb-2"
                  />
                  <textarea
                    placeholder={t("notificationMessage")}
                    value={notificationMsg}
                    onChange={(e) => setNotificationMsg(e.target.value)}
                    className="w-full form-input mb-4 h-20"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => userAction(selectedUser.id, "addBalance", inputValue)} className="bg-green-600 p-2 rounded text-sm">+ Balance</button>
                    <button onClick={() => userAction(selectedUser.id, "subtractBalance", inputValue)} className="bg-orange-600 p-2 rounded text-sm">- Balance</button>
                    <button onClick={() => triggerEarnings(selectedUser.id)} className="bg-yellow-600 p-2 rounded text-sm">{t("triggerEarnings")}</button>
                    <button onClick={() => sendNotification(selectedUser.id)} className="bg-blue-600 p-2 rounded text-sm">{t("sendNotification")}</button>
                    <button onClick={() => userAction(selectedUser.id, selectedUser.isFrozen ? "unfreeze" : "freeze")} className={`p-2 rounded text-sm ${selectedUser.isFrozen ? "bg-green-700" : "bg-red-700"}`}>
                      {selectedUser.isFrozen ? "Unfreeze" : "Freeze"}
                    </button>
                    <button onClick={() => userAction(selectedUser.id, "disable2fa")} className="bg-purple-600 p-2 rounded text-sm">{t("disable2fa")}</button>
                    <button onClick={() => userAction(selectedUser.id, "changeRole", selectedUser.role === "ADMIN" ? "USER" : "ADMIN")} className="bg-yellow-600 p-2 rounded text-sm">
                      Make {selectedUser.role === "ADMIN" ? "USER" : "ADMIN"}
                    </button>
                    <button onClick={() => { if (confirm("Delete?")) userAction(selectedUser.id, "delete"); }} className="bg-red-800 p-2 rounded text-sm">Delete</button>
                  </div>

                  <button onClick={() => { setSelectedUser(null); setReferralTree(null); }} className="mt-4 w-full btn-outline py-2.5 rounded-xl">
                    {tc("close")}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "activePlans" && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="p-4 text-left">{tc("email")}</th>
                  <th className="p-4 text-left">{t("planName")}</th>
                  <th className="p-4 text-left">{t("planPrice")}</th>
                  <th className="p-4 text-left">{t("dailyProfit")}</th>
                  <th className="p-4 text-left">{tc("balance")}</th>
                  <th className="p-4 text-left">{t("purchased")}</th>
                  <th className="p-4 text-left">{tc("status")}</th>
                </tr>
              </thead>
              <tbody>
                {activePlans.length === 0 ? (
                  <tr><td colSpan={7} className="p-4 text-center text-gray-400">{t("noActivePlans")}</td></tr>
                ) : activePlans.map((row) => (
                  <tr key={row.id} className="border-b border-gray-700">
                    <td className="p-4">{row.email}</td>
                    <td className="p-4 text-yellow-500 font-medium">{row.planName}</td>
                    <td className="p-4">${row.planPrice}</td>
                    <td className="p-4 text-green-400">${row.dailyProfit?.toFixed(2)}/day ({row.dailyReturnPercent}%)</td>
                    <td className="p-4">${row.balance?.toFixed(2)}</td>
                    <td className="p-4 text-sm">{new Date(row.purchasedAt).toLocaleDateString()}</td>
                    <td className="p-4">
                      {row.isFrozen ? (
                        <span className="text-red-400">{tc("frozen")}</span>
                      ) : (
                        <span className="text-green-400">{tc("active")}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "deposits" && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="p-4 text-left">{tc("email")}</th>
                  <th className="p-4 text-left">{tc("amount")}</th>
                  <th className="p-4 text-left">{tc("status")}</th>
                  <th className="p-4 text-left">{tc("date")}</th>
                  <th className="p-4 text-left">{tc("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {deposits.length === 0 ? (
                  <tr><td colSpan={5} className="p-4 text-center text-gray-400">{t("noData")}</td></tr>
                ) : deposits.map((d) => (
                  <tr key={d.id} className="border-b border-gray-700">
                    <td className="p-4">{d.user?.email}</td>
                    <td className="p-4 text-yellow-500">${d.amount}</td>
                    <td className="p-4">{d.status}</td>
                    <td className="p-4 text-sm">{new Date(d.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 flex gap-2">
                      {d.status === "PENDING" && d.amount >= 0 && (
                        <>
                          <button onClick={() => handleDeposit(d.id, "confirm")} className="bg-green-600 px-3 py-1 rounded">{tc("confirm")}</button>
                          <button onClick={() => handleDeposit(d.id, "reject")} className="bg-red-600 px-3 py-1 rounded">{tc("rejected")}</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "withdrawals" && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="p-4 text-left">{tc("email")}</th>
                  <th className="p-4 text-left">{tc("amount")}</th>
                  <th className="p-4 text-left">Network</th>
                  <th className="p-4 text-left">Address</th>
                  <th className="p-4 text-left">{tc("status")}</th>
                  <th className="p-4 text-left">{tc("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.length === 0 ? (
                  <tr><td colSpan={6} className="p-4 text-center text-gray-400">{t("noData")}</td></tr>
                ) : withdrawals.map((w) => (
                  <tr key={w.id} className="border-b border-gray-700">
                    <td className="p-4">{w.user?.email}</td>
                    <td className="p-4 text-yellow-500">${w.amount}</td>
                    <td className="p-4">{w.network ?? "-"}</td>
                    <td className="p-4 text-xs font-mono">{w.withdrawalAddress?.slice(0, 12) ?? "-"}...</td>
                    <td className="p-4">{w.status}</td>
                    <td className="p-4 flex gap-2">
                      {w.status === "PENDING" && (
                        <>
                          <button onClick={() => handleWithdrawal(w.id, "confirm")} className="bg-green-600 px-3 py-1 rounded">{tc("confirm")}</button>
                          <button onClick={() => handleWithdrawal(w.id, "reject")} className="bg-red-600 px-3 py-1 rounded">{tc("rejected")}</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="p-4 text-left">{tc("email")}</th>
                  <th className="p-4 text-left">Message</th>
                  <th className="p-4 text-left">Read</th>
                  <th className="p-4 text-left">{tc("date")}</th>
                </tr>
              </thead>
              <tbody>
                {notifications.length === 0 ? (
                  <tr><td colSpan={4} className="p-4 text-center text-gray-400">{t("noData")}</td></tr>
                ) : notifications.map((n) => (
                  <tr key={n.id} className="border-b border-gray-700">
                    <td className="p-4">{n.user?.email}</td>
                    <td className="p-4">{n.message}</td>
                    <td className="p-4">{n.isRead ? "✓" : "•"}</td>
                    <td className="p-4 text-sm">{new Date(n.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
