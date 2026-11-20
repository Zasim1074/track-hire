import { useState } from "react";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AuthPage({ mode }) {
  const registering = mode === "register";
  const { user, login, register, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    role: params.get("role") === "hr" ? "hr" : "candidate",
  });
  if (user)
    return <Navigate to={location.state?.from?.pathname || "/jobs"} replace />;

  const update = (event) =>
    setForm((value) => ({ ...value, [event.target.name]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const loggedIn = registering
        ? await register(form)
        : await login({ email: form.email, password: form.password });
      const redirect =
        params.get("returnTo") ||
        location.state?.from?.pathname ||
        (loggedIn.role === "hr" || loggedIn.role === "admin" ? "/dashboard" : "/jobs");
      navigate(redirect, { replace: true });
    } catch (err) {
      setError(err.message || "Unable to authenticate.");
    }
  };

  return (
    <div className="mx-auto mt-16 max-w-md px-4">
      <Card>
        <CardHeader>
          <CardTitle>
            {registering ? "Create your TrackHire account" : "Welcome back"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {location.state?.message && <p role="status" className="mb-4 text-sm text-green-600">{location.state.message}</p>}
          <form className="flex flex-col gap-4" onSubmit={submit}>
            {registering && (
              <>
                <div className="space-y-2"><Label htmlFor="first_name">First name</Label><Input id="first_name" name="first_name" autoComplete="given-name" placeholder="First name" value={form.first_name} onChange={update} required /></div>
                <div className="space-y-2"><Label htmlFor="last_name">Last name</Label><Input id="last_name" name="last_name" autoComplete="family-name" placeholder="Last name" value={form.last_name} onChange={update} required /></div>
              </>
            )}
            <div className="space-y-2"><Label htmlFor="email">Email address</Label><Input id="email" name="email" type="email" autoComplete="email" placeholder="Email" value={form.email} onChange={update} required /></div>
            <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" name="password" type="password" autoComplete={registering ? "new-password" : "current-password"} placeholder="Password" value={form.password} onChange={update} minLength={registering ? 12 : 1} required /></div>
            {registering && <p className="-mt-2 text-xs text-muted-foreground">Use at least 12 characters with a letter and a number.</p>}
            {registering && (
              <div className="space-y-2"><Label htmlFor="role">I am joining as</Label><select
                id="role"
                className="h-10 rounded-md border bg-background px-3"
                name="role"
                value={form.role}
                onChange={update}
                aria-label="Account type"
              >
                <option value="candidate">Candidate</option>
                <option value="hr">HR / Recruiter</option>
              </select></div>
            )}
            {error && (
              <p role="alert" className="text-sm text-red-500">
                {error}
              </p>
            )}
            <Button type="submit" variant="blue" disabled={loading}>
              {loading
                ? "Please wait…"
                : registering
                  ? "Create account"
                  : "Log in"}
            </Button>
          </form>
          <p className="mt-4 text-sm text-center">
            {registering ? "Already have an account? " : "New to TrackHire? "}
            <Link
              className="underline"
              to={registering ? "/login" : "/register"}
            >
              {registering ? "Log in" : "Create an account"}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
