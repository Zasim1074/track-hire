import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "../AuthContext";
import { setAccessToken, getAccessToken } from "@/services/apiClient";

function SessionProbe() {
  const { user, loading, logout } = useAuth();
  return (
    <div>
      <span>{loading ? "Loading" : user ? user.email : "Signed out"}</span>
      <button onClick={logout}>Log out</button>
    </div>
  );
}

describe("FastAPI authentication session", () => {
  it("restores the current user from the persisted JWT and logs out", async () => {
    localStorage.clear();
    setAccessToken("saved-jwt");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            id: "u1",
            email: "user@example.test",
            role: "candidate",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );
    render(
      <AuthProvider>
        <SessionProbe />
      </AuthProvider>,
    );
    await waitFor(() =>
      expect(screen.getByText("user@example.test")).toBeTruthy(),
    );
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/users/me",
      expect.objectContaining({ headers: expect.any(Headers) }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Log out" }));
    expect(screen.getByText("Signed out")).toBeTruthy();
    expect(getAccessToken()).toBeNull();
    vi.unstubAllGlobals();
  });

  it("clears invalid JWTs during session restoration", async () => {
    localStorage.clear();
    setAccessToken("expired-jwt");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ detail: "Invalid credentials" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    render(
      <AuthProvider>
        <SessionProbe />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByText("Signed out")).toBeTruthy());
    expect(getAccessToken()).toBeNull();
    vi.unstubAllGlobals();
  });
});
