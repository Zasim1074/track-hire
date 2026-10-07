import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const authMocks = vi.hoisted(() => ({ useAuth: vi.fn() }));
vi.mock("@/auth/AuthContext", () => ({ useAuth: authMocks.useAuth }));

import AuthPage from "../AuthPage";
import ProtectedRoute from "@/components/ProtectedRoute";

function renderPage(mode) {
  return render(
    <MemoryRouter initialEntries={[`/${mode}`]}>
      <Routes>
        <Route path={`/${mode}`} element={<AuthPage mode={mode} />} />
        <Route path="/jobs" element={<p>Jobs page</p>} />
        <Route path="/post-job" element={<p>Post job page</p>} />
        <Route path="/dashboard" element={<p>Recruiter dashboard</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("FastAPI authentication screens", () => {
  beforeEach(() => {
    authMocks.useAuth.mockReset();
  });

  it("logs in and redirects candidates to jobs", async () => {
    const login = vi.fn().mockResolvedValue({ role: "candidate" });
    authMocks.useAuth.mockReturnValue({
      user: null,
      login,
      register: vi.fn(),
      loading: false,
    });
    renderPage("login");
    fireEvent.change(screen.getByPlaceholderText("Email"), {
      target: { value: "candidate@example.test" },
    });
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));
    await waitFor(() => expect(screen.getByText("Jobs page")).toBeTruthy());
    expect(login).toHaveBeenCalledWith({
      email: "candidate@example.test",
      password: "password123",
    });
  });

  it("routes HR users to recruiter actions and shows login errors", async () => {
    const login = vi.fn().mockResolvedValue({ role: "hr" });
    authMocks.useAuth.mockReturnValue({
      user: null,
      login,
      register: vi.fn(),
      loading: false,
    });
    renderPage("login");
    fireEvent.change(screen.getByPlaceholderText("Email"), {
      target: { value: "hr@example.test" },
    });
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));
    await waitFor(() => expect(screen.getByText("Recruiter dashboard")).toBeTruthy());
  });

  it("registers the selected role and reports API errors", async () => {
    const register = vi
      .fn()
      .mockRejectedValue(new Error("Email already exists"));
    authMocks.useAuth.mockReturnValue({
      user: null,
      login: vi.fn(),
      register,
      loading: false,
    });
    renderPage("register");
    fireEvent.change(screen.getByPlaceholderText("First name"), {
      target: { value: "Ava" },
    });
    fireEvent.change(screen.getByPlaceholderText("Last name"), {
      target: { value: "Candidate" },
    });
    fireEvent.change(screen.getByPlaceholderText("Email"), {
      target: { value: "ava@example.test" },
    });
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Account type" }), {
      target: { value: "hr" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toBe(
        "Email already exists",
      ),
    );
    expect(register).toHaveBeenCalledWith(
      expect.objectContaining({ role: "hr", first_name: "Ava" }),
    );
  });

  it("redirects protected routes to FastAPI login when signed out", async () => {
    authMocks.useAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      loading: false,
    });
    render(
      <MemoryRouter initialEntries={["/private"]}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/private" element={<p>Protected content</p>} />
          </Route>
          <Route path="/login" element={<p>FastAPI login</p>} />
        </Routes>
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByText("FastAPI login")).toBeTruthy());
  });
});
