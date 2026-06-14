"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import MachineImage from "@/components/MachineImage";
import MiningMachineVisual from "@/components/MiningMachineVisual";
import { formatUptimeHours, getLiveUptimeHours } from "@/lib/machine-status";

type AdminPlan = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  dailyReturnPercent: number;
  durationDays?: number;
  machineImage?: string | null;
  machineVideo?: string | null;
  machineOnline?: boolean;
  machineUptimeHours?: number;
  machineOnlineSince?: string | null;
  planType: "SOLO" | "POOLED";
  targetPoolAmount?: number | null;
  minContribution?: number | null;
  maxParticipants?: number | null;
  isActive: boolean;
  acceptingSubscriptions?: boolean;
  _count?: { userPlans: number };
  pools?: Array<{ id: string; status: string; filledAmount: number; targetAmount: number }>;
};

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  dailyReturnPercent: "1",
  durationDays: "100",
  machineImage: "/machines/starter.png",
  machineVideo: "",
  machineOnline: true,
  machineUptimeHours: "8760",
  planType: "SOLO" as "SOLO" | "POOLED",
  targetPoolAmount: "",
  minContribution: "100",
  maxParticipants: "",
  isActive: true,
  acceptingSubscriptions: true,
};

export default function AdminPlansSection() {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const [plans, setPlans] = useState<AdminPlan[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const loadPlans = async () => {
    try {
      const res = await fetch(`/api/admin/plans?_=${Date.now()}`, {
        cache: "no-store",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load plans");
        return;
      }
      setPlans(Array.isArray(data) ? data : []);
    } catch {
      setError("Failed to load plans");
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const startEdit = (plan: AdminPlan) => {
    setEditingId(plan.id);
    setForm({
      name: plan.name,
      description: plan.description ?? "",
      price: String(plan.price),
      dailyReturnPercent: String(plan.dailyReturnPercent),
      durationDays: String(plan.durationDays ?? 100),
      machineImage: plan.machineImage ?? "/machines/starter.png",
      machineVideo: plan.machineVideo ?? "",
      machineOnline: plan.machineOnline ?? true,
      machineUptimeHours: String(plan.machineUptimeHours ?? 8760),
      planType: plan.planType,
      targetPoolAmount: plan.targetPoolAmount ? String(plan.targetPoolAmount) : "",
      minContribution: plan.minContribution ? String(plan.minContribution) : "100",
      maxParticipants: plan.maxParticipants ? String(plan.maxParticipants) : "",
      isActive: plan.isActive,
      acceptingSubscriptions: plan.acceptingSubscriptions !== false,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const payload = {
      ...form,
      price: parseFloat(form.price),
      dailyReturnPercent: parseFloat(form.dailyReturnPercent),
      durationDays: parseInt(form.durationDays, 10),
      targetPoolAmount: form.planType === "POOLED" ? parseFloat(form.targetPoolAmount) : null,
      minContribution: form.planType === "POOLED" ? parseFloat(form.minContribution) : null,
      maxParticipants: form.maxParticipants ? parseInt(form.maxParticipants, 10) : null,
      machineVideo: form.machineVideo.trim() || null,
      machineOnline: form.machineOnline,
      machineUptimeHours: parseFloat(form.machineUptimeHours) || 0,
      acceptingSubscriptions: form.acceptingSubscriptions,
    };

    const res = await fetch("/api/admin/plans", {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      cache: "no-store",
      body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
    });
    const data = await res.json();

    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Failed to save plan");
      return;
    }

    setMessage(editingId ? t("planUpdated") : t("planCreated"));
    if (editingId) {
      setPlans((prev) => prev.map((plan) => (plan.id === data.id ? { ...plan, ...data } : plan)));
    } else {
      setPlans((prev) => [data, ...prev]);
    }
    resetForm();
    await loadPlans();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setError("");

    const body = new FormData();
    body.append("file", file);

    try {
      const res = await fetch("/api/admin/plans/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("imageUploadFailed"));
        return;
      }
      setForm((prev) => ({ ...prev, machineImage: data.url }));
      setMessage(t("imageUploaded"));
    } catch {
      setError(t("imageUploadFailed"));
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingVideo(true);
    setError("");

    const body = new FormData();
    body.append("file", file);

    try {
      const res = await fetch("/api/admin/plans/upload-video", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("videoUploadFailed"));
        return;
      }
      setForm((prev) => ({ ...prev, machineVideo: data.url }));
      setMessage(t("videoUploaded"));
    } catch {
      setError(t("videoUploadFailed"));
    } finally {
      setUploadingVideo(false);
      e.target.value = "";
    }
  };

  const togglePlanMachine = async (planId: string, online: boolean) => {
    const res = await fetch("/api/admin/plans/machine-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      cache: "no-store",
      body: JSON.stringify({ id: planId, online }),
    });
    if (res.ok) {
      const data = await res.json();
      setPlans((prev) => prev.map((plan) => (plan.id === planId ? { ...plan, ...data } : plan)));
      await loadPlans();
    }
  };

  const togglePlanSubscriptions = async (planId: string, acceptingSubscriptions: boolean) => {
    const res = await fetch("/api/admin/plans/subscription", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      cache: "no-store",
      body: JSON.stringify({ planId, acceptingSubscriptions }),
    });
    if (res.ok) {
      const data = await res.json();
      setPlans((prev) => prev.map((plan) => (plan.id === planId ? { ...plan, ...data } : plan)));
      setMessage(acceptingSubscriptions ? t("subscriptionsOpened") : t("subscriptionsFrozen"));
      await loadPlans();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("confirmDeletePlan"))) return;
    setError("");
    const res = await fetch(`/api/admin/plans?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "include",
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to delete plan");
      return;
    }

    if (data.softDeleted && data.plan) {
      setPlans((prev) => prev.map((plan) => (plan.id === id ? { ...plan, ...data.plan } : plan)));
      setMessage(t("planDeactivated"));
    } else {
      setPlans((prev) => prev.filter((plan) => plan.id !== id));
      setMessage(t("planDeleted"));
    }
    if (editingId === id) resetForm();
    await loadPlans();
  };

  return (
    <div className="space-y-6">
      {message && <p className="text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 p-3 rounded-xl text-sm">{message}</p>}
      {error && <p className="text-red-300 bg-red-950/40 border border-red-500/30 p-3 rounded-xl text-sm">{error}</p>}

      <form onSubmit={handleSubmit} className="admin-panel grid grid-cols-1 md:grid-cols-2 gap-4">
        <h2 className="md:col-span-2 text-lg sm:text-xl font-bold text-amber-400">
          {editingId ? t("editPlan") : t("addPlan")}
        </h2>

        <label className="block">
          <span className="form-label">{t("planName")}</span>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="form-input"
          />
        </label>

        <label className="block">
          <span className="form-label">{t("planType")}</span>
          <select
            value={form.planType}
            onChange={(e) => setForm({ ...form, planType: e.target.value as "SOLO" | "POOLED" })}
            className="form-input"
          >
            <option value="SOLO">{t("soloPlan")}</option>
            <option value="POOLED">{t("sharedPlan")}</option>
          </select>
        </label>

        <label className="md:col-span-2 block">
          <span className="form-label">{t("planDescription")}</span>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="form-input h-20"
          />
        </label>

        {form.planType === "SOLO" ? (
          <label className="block">
            <span className="form-label">{t("planPrice")} ($)</span>
            <input
              required
              type="number"
              step="0.01"
              min="1"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="form-input"
            />
          </label>
        ) : (
          <>
            <label className="block">
              <span className="form-label">{t("targetPool")} ($)</span>
              <input
                required
                type="number"
                step="0.01"
                min="1"
                value={form.targetPoolAmount}
                onChange={(e) => setForm({ ...form, targetPoolAmount: e.target.value })}
                className="form-input"
              />
            </label>
            <label className="block">
              <span className="form-label">{t("minContribution")} ($)</span>
              <input
                required
                type="number"
                step="0.01"
                min="1"
                value={form.minContribution}
                onChange={(e) => setForm({ ...form, minContribution: e.target.value })}
                className="form-input"
              />
            </label>
            <label className="block">
              <span className="form-label">{t("maxParticipants")}</span>
              <input
                type="number"
                min="2"
                placeholder={t("optional")}
                value={form.maxParticipants}
                onChange={(e) => setForm({ ...form, maxParticipants: e.target.value })}
                className="form-input"
              />
            </label>
            <label className="block">
              <span className="form-label">{t("displayPrice")} ($)</span>
              <input
                required
                type="number"
                step="0.01"
                min="1"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="form-input"
              />
            </label>
          </>
        )}

        <label className="block">
          <span className="form-label">{t("dailyReturn")} (%)</span>
          <input
            required
            type="number"
            step="0.01"
            min="0.01"
            value={form.dailyReturnPercent}
            onChange={(e) => setForm({ ...form, dailyReturnPercent: e.target.value })}
            className="form-input"
          />
        </label>

        <label className="block">
          <span className="form-label">{t("durationDays")}</span>
          <input
            required
            type="number"
            min="1"
            value={form.durationDays}
            onChange={(e) => setForm({ ...form, durationDays: e.target.value })}
            className="form-input"
          />
        </label>

        <div className="md:col-span-2 block">
          <span className="form-label">{t("planImage")}</span>
          <div className="mt-2 flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-40 h-32 bg-slate-800/60 rounded-xl overflow-hidden shrink-0 border border-slate-700/50">
              <MachineImage src={form.machineImage} alt={form.name || "plan"} />
            </div>
            <div className="flex-1 space-y-2">
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/80 border border-slate-700/60 rounded-xl cursor-pointer hover:border-amber-500/30 w-fit transition-colors">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  disabled={uploadingImage}
                  onChange={handleImageUpload}
                />
                <span className="text-sm text-amber-400 font-medium">
                  {uploadingImage ? t("imageUploading") : t("uploadImage")}
                </span>
              </label>
              <p className="text-xs text-gray-500">{t("imageUploadHint")}</p>
              <label className="block">
                <span className="text-xs text-gray-500">{t("imageUrlOrPath")}</span>
                <input
                  value={form.machineImage}
                  onChange={(e) => setForm({ ...form, machineImage: e.target.value })}
                  placeholder="/machines/pro.png"
                  className="form-input font-mono"
                />
              </label>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 block border-t border-slate-700/50 pt-4 mt-2">
          <span className="form-label">{t("machineVideo")}</span>
          <div className="mt-2 space-y-2">
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/80 border border-slate-700/60 rounded-xl cursor-pointer hover:border-cyan-500/30 w-fit transition-colors">
              <input
                type="file"
                accept="video/mp4,video/webm"
                className="hidden"
                disabled={uploadingVideo}
                onChange={handleVideoUpload}
              />
              <span className="text-sm text-cyan-400 font-medium">
                {uploadingVideo ? t("videoUploading") : t("uploadVideo")}
              </span>
            </label>
            <p className="text-xs text-slate-500">{t("videoUploadHint")}</p>
            <input
              value={form.machineVideo}
              onChange={(e) => setForm({ ...form, machineVideo: e.target.value })}
              placeholder="https://... or /uploads/videos/..."
              className="form-input font-mono text-xs"
            />
          </div>
        </div>

        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-700/50 pt-4">
          <label className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-700/50">
            <span className="form-label mb-0">{t("machineOnline")}</span>
            <button
              type="button"
              onClick={() => setForm({ ...form, machineOnline: !form.machineOnline })}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                form.machineOnline ? "bg-emerald-600" : "bg-slate-600"
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  form.machineOnline ? "left-6" : "left-0.5"
                }`}
              />
            </button>
          </label>
          <label className="block">
            <span className="form-label">{t("machineUptimeHours")}</span>
            <input
              type="number"
              min="0"
              step="0.1"
              value={form.machineUptimeHours}
              onChange={(e) => setForm({ ...form, machineUptimeHours: e.target.value })}
              className="form-input"
            />
            <p className="text-xs text-slate-500 mt-1">{t("machineUptimeHint")}</p>
          </label>
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          />
          <span className="text-sm text-gray-300">{tc("active")}</span>
        </label>

        <label className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-700/50">
          <div>
            <span className="form-label mb-0 block">{t("acceptingSubscriptions")}</span>
            <p className="text-xs text-slate-500 mt-1">{t("acceptingSubscriptionsHint")}</p>
          </div>
          <button
            type="button"
            onClick={() => setForm({ ...form, acceptingSubscriptions: !form.acceptingSubscriptions })}
            className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${
              form.acceptingSubscriptions ? "bg-emerald-600" : "bg-amber-600"
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                form.acceptingSubscriptions ? "left-6" : "left-0.5"
              }`}
            />
          </button>
        </label>

        <div className="md:col-span-2 flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary px-6 py-2.5 rounded-xl text-sm disabled:opacity-50 disabled:transform-none"
          >
            {editingId ? t("savePlan") : t("addPlan")}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="btn-outline px-6 py-2.5 rounded-xl text-sm">
              {tc("cancel")}
            </button>
          )}
        </div>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div key={plan.id} className={`plan-card ${!plan.isActive ? "opacity-60" : ""}`}>
            <div className="h-40 relative">
              <MiningMachineVisual
                name={plan.name}
                imageSrc={plan.machineImage}
                videoSrc={plan.machineVideo}
                online={plan.machineOnline ?? true}
                uptimeHours={plan.machineUptimeHours ?? 0}
                onlineSince={plan.machineOnlineSince}
                compact
              />
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start gap-2">
                <h3 className="font-bold text-gradient-gold">{plan.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded ${plan.planType === "POOLED" ? "bg-blue-900 text-blue-300" : "bg-green-900 text-green-300"}`}>
                  {plan.planType === "POOLED" ? t("sharedPlan") : t("soloPlan")}
                </span>
              </div>
              <div className="flex items-center justify-between mt-2 gap-2">
                <span className={`text-xs font-bold ${plan.machineOnline ? "text-emerald-400" : "text-red-400"}`}>
                  {plan.machineOnline ? t("machineOn") : t("machineOff")}
                </span>
                <span className="text-xs text-amber-400 font-mono">
                  {formatUptimeHours(
                    getLiveUptimeHours({
                      machineOnline: plan.machineOnline ?? true,
                      machineUptimeHours: plan.machineUptimeHours ?? 0,
                      machineOnlineSince: plan.machineOnlineSince ? new Date(plan.machineOnlineSince) : null,
                    })
                  )}
                </span>
              </div>
              <button
                type="button"
                onClick={() => togglePlanMachine(plan.id, !plan.machineOnline)}
                className={`mt-2 w-full py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  plan.machineOnline
                    ? "bg-red-950/50 text-red-400 border border-red-500/30 hover:bg-red-950"
                    : "bg-emerald-950/50 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-950"
                }`}
              >
                {plan.machineOnline ? t("turnMachineOff") : t("turnMachineOn")}
              </button>
              <button
                type="button"
                onClick={() => togglePlanSubscriptions(plan.id, plan.acceptingSubscriptions === false)}
                className={`mt-2 w-full py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  plan.acceptingSubscriptions !== false
                    ? "bg-amber-950/50 text-amber-400 border border-amber-500/30 hover:bg-amber-950"
                    : "bg-emerald-950/50 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-950"
                }`}
              >
                {plan.acceptingSubscriptions !== false ? t("freezeSubscriptions") : t("openSubscriptions")}
              </button>
              {plan.acceptingSubscriptions === false && (
                <p className="text-xs text-amber-400/90 mt-1.5">
                  {t("planFrozenHint", { count: plan._count?.userPlans ?? 0 })}
                </p>
              )}
              <p className="text-sm text-gray-400 mt-1 line-clamp-2">{plan.description}</p>
              <p className="text-sm mt-2">
                {plan.planType === "POOLED"
                  ? `${t("targetPool")}: $${plan.targetPoolAmount?.toLocaleString()}`
                  : `${t("planPrice")}: $${plan.price}`}
                {" · "}{plan.dailyReturnPercent}%/day · {plan.durationDays}d
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {plan._count?.userPlans ?? 0} active · {plan.pools?.length ?? 0} pools
              </p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => startEdit(plan)} className="text-sm text-amber-400 hover:underline">
                  {t("editPlan")}
                </button>
                <button onClick={() => handleDelete(plan.id)} className="text-sm text-red-400 hover:underline">
                  {t("deletePlan")}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
