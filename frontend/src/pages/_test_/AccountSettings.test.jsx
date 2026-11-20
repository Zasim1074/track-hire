import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AccountSettings from "@/pages/AccountSettings";

const mocks = vi.hoisted(() => ({ changePassword: vi.fn(), logout: vi.fn() }));
vi.mock("@/services/apiAuth", () => ({ changePassword: mocks.changePassword }));
vi.mock("@/auth/AuthContext", () => ({ useAuth: () => ({ logout: mocks.logout }) }));

describe("AccountSettings", () => {
  beforeEach(() => vi.clearAllMocks());

  it("validates matching passwords before calling the API", async () => {
    render(<MemoryRouter><AccountSettings /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText("Current password"), { target: { value: "current-password-1" } });
    fireEvent.change(screen.getByLabelText("New password"), { target: { value: "new-password-123" } });
    fireEvent.change(screen.getByLabelText("Confirm new password"), { target: { value: "different-password-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Change password" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("do not match");
    expect(mocks.changePassword).not.toHaveBeenCalled();
  });

  it("changes the password and signs out", async () => {
    mocks.changePassword.mockResolvedValue(null);
    render(<MemoryRouter><AccountSettings /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText("Current password"), { target: { value: "current-password-1" } });
    fireEvent.change(screen.getByLabelText("New password"), { target: { value: "new-password-123" } });
    fireEvent.change(screen.getByLabelText("Confirm new password"), { target: { value: "new-password-123" } });
    fireEvent.click(screen.getByRole("button", { name: "Change password" }));
    await waitFor(() => expect(mocks.logout).toHaveBeenCalled());
    expect(mocks.changePassword).toHaveBeenCalledWith({ current_password: "current-password-1", new_password: "new-password-123" });
  });
});
