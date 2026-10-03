import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { addNewCompany } from "@/services/apiCompanies";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  name: z.string().trim().min(1, "Company name is required"),
  description: z.string().trim().min(1, "Company description is required"),
  website: z.string().url("Enter a valid website URL"),
  location: z.string().trim().min(1, "Location is required"),
  logo_url: z.union([z.literal(""), z.string().url("Enter a valid logo URL")]),
  industry: z.enum([
    "software", "fintech", "ecommerce", "healthcare", "edtech", "entertainment",
    "gaming", "consulting", "marketing", "telecommunications", "automotive",
    "logistics", "manufacturing", "real_estate", "government", "education", "retail",
    "media", "travel", "hospitality", "other",
  ]),
  company_size: z.enum(["1-10", "11-50", "51-200", "201-1000", "1001+"]),
});

export default function CompanySetupForm({ onCreated }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "", description: "", website: "", location: "", logo_url: "",
      industry: "software", company_size: "1-10",
    },
  });

  const submit = async (payload) => {
    setSaving(true);
    setError("");
    try {
      const company = await addNewCompany(payload);
      onCreated(company);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mx-auto mt-8 max-w-3xl">
      <CardHeader>
        <CardTitle>Set up your company</CardTitle>
        <p className="text-sm text-muted-foreground">Create a company profile to start posting jobs. You will be added as its owner.</p>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit(submit)}>
          <div><Input aria-label="Company name" placeholder="Company Name" {...register("name")} />{errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}</div>
          <div><Input aria-label="Company website" placeholder="Website URL" {...register("website")} />{errors.website && <p className="text-sm text-red-500">{errors.website.message}</p>}</div>
          <div><Input aria-label="Company location" placeholder="Location" {...register("location")} />{errors.location && <p className="text-sm text-red-500">{errors.location.message}</p>}</div>
          <div><Input aria-label="Company logo URL" placeholder="Logo image URL (optional)" {...register("logo_url")} />{errors.logo_url && <p className="text-sm text-red-500">{errors.logo_url.message}</p>}</div>
          <div className="sm:col-span-2"><Textarea aria-label="Company description" placeholder="Company description" {...register("description")} />{errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}</div>
          <label className="grid gap-1 text-sm">Industry
            <select aria-label="Industry" className="h-10 rounded-md border bg-background px-3" {...register("industry")}>
              {schema.shape.industry.options.map((industry) => <option key={industry} value={industry}>{industry.replaceAll("_", " ")}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm">Company size
            <select aria-label="Company size" className="h-10 rounded-md border bg-background px-3" {...register("company_size")}>
              {schema.shape.company_size.options.map((size) => <option key={size} value={size}>{size} employees</option>)}
            </select>
          </label>
          {error && <p role="alert" className="text-sm text-red-500 sm:col-span-2">{error}</p>}
          <Button type="submit" variant="blue" disabled={saving} className="sm:col-span-2">
            {saving ? "Creating company…" : "Create company profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
