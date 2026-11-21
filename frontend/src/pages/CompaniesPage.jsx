import { useEffect, useState } from "react";
import { Building2, CheckCircle2, MapPin } from "lucide-react";
import { getCompanies } from "@/services/apiCompanies";
import PageHeader from "@/components/PageHeader";

export default function CompaniesPage() {
  const [companies, setCompanies] = useState([]); const [error, setError] = useState("");
  useEffect(() => { getCompanies().then(setCompanies).catch((err) => setError(err.message)); }, []);
  return <section><PageHeader eyebrow="Administration" title="Companies" description="Review company records and current verification state." />{error && <p role="alert" className="mb-4 text-red-700">{error}</p>}<div className="overflow-hidden rounded-xl border bg-card shadow-sm"><div className="hidden grid-cols-[minmax(15rem,1.4fr)_1fr_1fr_auto] gap-4 border-b bg-muted/50 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground md:grid"><span>Company</span><span>Location</span><span>Industry</span><span>Status</span></div><div className="divide-y">{companies.map((company) => <div key={company.id} className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(15rem,1.4fr)_1fr_1fr_auto] md:items-center"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-lg bg-slate-100 text-[#172B4D]"><Building2 aria-hidden="true" /></span><div><p className="font-semibold">{company.name}</p><p className="text-xs text-muted-foreground">{company.company_size?.replaceAll("_", " ")}</p></div></div><p className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin aria-hidden="true" className="h-4 w-4" />{company.location}</p><p className="text-sm capitalize">{company.industry?.replaceAll("_", " ")}</p><span className="inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold"><CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" />{company.is_verified ? "Verified" : "Pending"}</span></div>)}</div></div></section>;
}
