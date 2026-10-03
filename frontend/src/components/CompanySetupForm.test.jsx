import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const companyApi = vi.hoisted(() => ({ addNewCompany: vi.fn() }));
vi.mock("@/services/apiCompanies", () => companyApi);

import CompanySetupForm from "./CompanySetupForm";

describe("CompanySetupForm", () => {
  beforeEach(() => vi.clearAllMocks());

  it("validates company fields and creates a profile from the backend schema", async () => {
    const user = userEvent.setup();
    const company = { id: "company-1", name: "Northstar", logo_url: "" };
    const onCreated = vi.fn();
    companyApi.addNewCompany.mockResolvedValue(company);
    render(<CompanySetupForm onCreated={onCreated} />);

    await user.type(screen.getByLabelText("Company name"), "Northstar");
    await user.type(screen.getByLabelText("Company website"), "https://northstar.example");
    await user.type(screen.getByLabelText("Company location"), "Remote");
    await user.type(screen.getByLabelText("Company description"), "A growing product company.");
    await user.click(screen.getByRole("button", { name: "Create company profile" }));

    await waitFor(() => expect(companyApi.addNewCompany).toHaveBeenCalledWith({
      name: "Northstar",
      website: "https://northstar.example",
      location: "Remote",
      description: "A growing product company.",
      logo_url: "",
      industry: "software",
      company_size: "1-10",
    }));
    expect(onCreated).toHaveBeenCalledWith(company);
  });

  it("renders API failures and validates malformed company URLs", async () => {
    const user = userEvent.setup();
    companyApi.addNewCompany.mockRejectedValue(new Error("Company already exists."));
    render(<CompanySetupForm onCreated={vi.fn()} />);
    await user.type(screen.getByLabelText("Company name"), "Northstar");
    fireEvent.change(screen.getByLabelText("Company website"), { target: { value: "not a url" } });
    await user.type(screen.getByLabelText("Company location"), "Remote");
    await user.type(screen.getByLabelText("Company description"), "A growing product company.");
    await user.click(screen.getByRole("button", { name: "Create company profile" }));
    expect(await screen.findByText("Enter a valid website URL")).toBeInTheDocument();
    expect(companyApi.addNewCompany).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Company website"), { target: { value: "https://northstar.example" } });
    await user.click(screen.getByRole("button", { name: "Create company profile" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Company already exists.");
  });
});
