"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import MachineImage from "@/components/MachineImage";

type AdminPlan = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  dailyReturnPercent: number;
  durationDays?: number;
  machineImage?: string | null;
  planType: "SOLO" | "POOLED";
  targetPoolAmount?: number | null;
  minContribution?: number | null;
  maxParticipants?: number | null;
  isActive: boolean;
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
  planType: "SOLO" as "SOLO" | "POOLED",
  targetPoolAmount: "",
  minContribution: "100",
  maxParticipants: "",
  isActive: true,
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

  const loadPlans = () => {
    fetch("/api/admin/plans")
      .then((r) => r.json())
      .then((data) => setPlans(Array.isArray(data) ? data : []));
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
      planType: plan.planType,
      targetPoolAmount: plan.targetPoolAmount ? String(plan.targetPoolAmount) : "",
      minContribution: plan.minContribution ? String(plan.minContribution) : "100",
      maxParticipants: plan.maxParticipants ? String(plan.maxParticipants) : "",
      isActive: plan.isActive,
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
    };

    const res = await fetch("/api/admin/plans", {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
    });
    const data = await res.json();

    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Failed to save plan");
      return;
    }

    setMessage(editingId ? t("planUpdated") : t("planCreated"));
    resetForm();
    loadPlans();
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

  const handleDelete = async (id: string) => {
    if (!confirm(t("confirmDeletePlan"))) return;
    const res = await fetch("/api/admin/plans", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage(data.softDeleted ? t("planDeactivated") : t("planDeleted"));
      loadPlans();
    }
  };

  return (
    <div className="space-y-6">
      {message && <p className="text-green-400 bg-green-900/30 p-3 rounded">{message}</p>}
      {error && <p className="text-red-400 bg-red-900/30 p-3 rounded">{error}</p>}

      <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <h2 className="md:col-span-2 text-xl font-bold text-yellow-500">
          {editingId ? t("editPlan") : t("addPlan")}
        </h2>

        <label className="block">
          <span className="text-sm text-gray-400">{t("planName")}</span>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full mt-1 p-2 rounded bg-gray-700"
          />
        </label>

        <label className="block">
          <span className="text-sm text-gray-400">{t("planType")}</span>
          <select
            value={form.planType}
            onChange={(e) => setForm({ ...form, planType: e.target.value as "SOLO" | "POOLED" })}
            className="w-full mt-1 p-2 rounded bg-gray-700"
          >
            <option value="SOLO">{t("soloPlan")}</option>
            <option value="POOLED">{t("sharedPlan")}</option>
          </select>
        </label>

        <label className="md:col-span-2 block">
          <span className="text-sm text-gray-400">{t("planDescription")}</span>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full mt-1 p-2 rounded bg-gray-700 h-20"
          />
        </label>

        {form.planType === "SOLO" ? (
          <label className="block">
            <span className="text-sm text-gray-400">{t("planPrice")} ($)</span>
            <input
              required
              type="number"
              step="0.01"
              min="1"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="w-full mt-1 p-2 rounded bg-gray-700"
            />
          </label>
        ) : (
          <>
            <label className="block">
              <span className="text-sm text-gray-400">{t("targetPool")} ($)</span>
              <input
                required
                type="number"
                step="0.01"
                min="1"
                value={form.targetPoolAmount}
                onChange={(e) => setForm({ ...form, targetPoolAmount: e.target.value })}
                className="w-full mt-1 p-2 rounded bg-gray-700"
              />
            </label>
            <label className="block">
              <span className="text-sm text-gray-400">{t("minContribution")} ($)</span>
              <input
                required
                type="number"
                step="0.01"
                min="1"
                value={form.minContribution}
                onChange={(e) => setForm({ ...form, minContribution: e.target.value })}
                className="w-full mt-1 p-2 rounded bg-gray-700"
              />
            </label>
            <label className="block">
              <span className="text-sm text-gray-400">{t("maxParticipants")}</span>
              <input
                type="number"
                min="2"
                placeholder={t("optional")}
                value={form.maxParticipants}
                onChange={(e) => setForm({ ...form, maxParticipants: e.target.value })}
                className="w-full mt-1 p-2 rounded bg-gray-700"
              />
            </label>
            <label className="block">
              <span className="text-sm text-gray-400">{t("displayPrice")} ($)</span>
              <input
                required
                type="number"
                step="0.01"
                min="1"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full mt-1 p-2 rounded bg-gray-700"
              />
            </label>
          </>
        )}

        <label className="block">
          <span className="text-sm text-gray-400">{t("dailyReturn")} (%)</span>
          <input
            required
            type="number"
            step="0.01"
            min="0.01"
            value={form.dailyReturnPercent}
            onChange={(e) => setForm({ ...form, dailyReturnPercent: e.target.value })}
            className="w-full mt-1 p-2 rounded bg-gray-700"
          />
        </label>

        <label className="block">
          <span className="text-sm text-gray-400">{t("durationDays")}</span>
          <input
            required
            type="number"
            min="1"
            value={form.durationDays}
            onChange={(e) => setForm({ ...form, durationDays: e.target.value })}
            className="w-full mt-1 p-2 rounded bg-gray-700"
          />
        </label>

        <div className="md:col-span-2 block">
          <span className="text-sm text-gray-400">{t("planImage")}</span>
          <div className="mt-2 flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-40 h-32 bg-gray-700 rounded-lg overflow-hidden shrink-0">
              <MachineImage src={form.machineImage} alt={form.name || "plan"} />
            </div>
            <div className="flex-1 space-y-2">
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 rounded cursor-pointer hover:bg-gray-600 w-fit">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  disabled={uploadingImage}
                  onChange={handleImageUpload}
                />
                <span className="text-sm text-yellow-500 font-medium">
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
                  className="w-full mt-1 p-2 rounded bg-gray-700 font-mono text-sm"
                />
              </label>
            </div>
          </div>
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          />
          <span className="text-sm text-gray-300">{tc("active")}</span>
        </label>

        <div className="md:col-span-2 flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-yellow-500 text-black font-bold rounded hover:bg-yellow-400 disabled:opacity-50"
          >
            {editingId ? t("savePlan") : t("addPlan")}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="px-6 py-2 bg-gray-700 rounded">
              {tc("cancel")}
            </button>
          )}
        </div>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div key={plan.id} className={`bg-gray-800 rounded-lg overflow-hidden ${!plan.isActive ? "opacity-60" : ""}`}>
            <div className="h-36 bg-gray-700">
              <MachineImage src={plan.machineImage} alt={plan.name} />
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start gap-2">
                <h3 className="font-bold text-yellow-500">{plan.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded ${plan.planType === "POOLED" ? "bg-blue-900 text-blue-300" : "bg-green-900 text-green-300"}`}>
                  {plan.planType === "POOLED" ? t("sharedPlan") : t("soloPlan")}
                </span>
              </div>
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
                <button onClick={() => startEdit(plan)} className="text-sm text-yellow-500 hover:underline">
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
