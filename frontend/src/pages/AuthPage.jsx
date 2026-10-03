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
    role: "candidate",
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
        (loggedIn.role === "hr" ? "/post-job" : "/jobs");
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
          <form className="flex flex-col gap-4" onSubmit={submit}>
            {registering && (
              <>
                <Input
                  name="first_name"
                  autoComplete="given-name"
                  placeholder="First name"
                  value={form.first_name}
                  onChange={update}
                  required
                />
                <Input
                  name="last_name"
                  autoComplete="family-name"
                  placeholder="Last name"
                  value={form.last_name}
                  onChange={update}
                  required
                />
              </>
            )}
            <Input
              name="email"
              type="email"
              autoComplete="email"
              placeholder="Email"
              value={form.email}
              onChange={update}
              required
            />
            <Input
              name="password"
              type="password"
              autoComplete={registering ? "new-password" : "current-password"}
              placeholder="Password"
              value={form.password}
              onChange={update}
              minLength={8}
              required
            />
            {registering && (
              <select
                className="h-10 rounded-md border bg-background px-3"
                name="role"
                value={form.role}
                onChange={update}
                aria-label="Account type"
              >
                <option value="candidate">Candidate</option>
                <option value="hr">HR / Recruiter</option>
              </select>
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
