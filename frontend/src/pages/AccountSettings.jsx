import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePassword } from "@/services/apiAuth";

export default function AccountSettings() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (form.new_password !== form.confirm_password) {
      setError("New passwords do not match.");
      return;
    }
    setSaving(true);
    try {
      await changePassword({ current_password: form.current_password, new_password: form.new_password });
      logout();
      navigate("/login", { replace: true, state: { message: "Password changed. Sign in with your new password." } });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto max-w-xl py-8">
      <p className="text-sm text-muted-foreground">Account</p>
      <h1 className="gradient-title pb-6 text-4xl font-extrabold">Security settings</h1>
      <form className="space-y-4 rounded-xl border p-6" onSubmit={submit}>
        {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
        <div className="space-y-2"><Label htmlFor="current-password">Current password</Label><Input id="current-password" type="password" autoComplete="current-password" required value={form.current_password} onChange={(event) => setForm({ ...form, current_password: event.target.value })} /></div>
        <div className="space-y-2"><Label htmlFor="new-password">New password</Label><Input id="new-password" type="password" autoComplete="new-password" minLength={12} required value={form.new_password} onChange={(event) => setForm({ ...form, new_password: event.target.value })} /><p className="text-xs text-muted-foreground">Use at least 12 characters with a letter and a number.</p></div>
        <div className="space-y-2"><Label htmlFor="confirm-password">Confirm new password</Label><Input id="confirm-password" type="password" autoComplete="new-password" minLength={12} required value={form.confirm_password} onChange={(event) => setForm({ ...form, confirm_password: event.target.value })} /></div>
        <Button type="submit" disabled={saving}>{saving ? "Updating…" : "Change password"}</Button>
      </form>
    </main>
  );
}
