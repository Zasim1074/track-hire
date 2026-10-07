import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCandidateProfile, createCandidateProfile, updateCandidateProfile } from "@/services/apiCandidateProfile";

const emptyProfile = { phone: "", headline: "", bio: "", location: "", experience_years: "", linkedin_url: "", github_url: "", portfolio_url: "" };

export default function CandidateProfilePage() {
  const [profile, setProfile] = useState(emptyProfile);
  const [exists, setExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const refresh = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getCandidateProfile();
      setProfile({ ...emptyProfile, ...data, experience_years: data.experience_years ?? "" });
      setExists(true);
    } catch (err) {
      if (err.status === 404) {
        setProfile(emptyProfile);
        setExists(false);
      } else setError(err.message);
    } finally { setLoading(false); }
  };

  useEffect(() => { refresh(); }, []);
  const change = (event) => setProfile((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true); setError(""); setMessage("");
    const payload = { ...profile, experience_years: profile.experience_years === "" ? null : Number(profile.experience_years) };
    for (const key of Object.keys(payload)) if (payload[key] === "") payload[key] = null;
    try {
      const saved = exists ? await updateCandidateProfile(payload) : await createCandidateProfile(payload);
      setProfile({ ...emptyProfile, ...saved, experience_years: saved.experience_years ?? "" });
      setExists(true); setMessage("Profile saved.");
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return <p role="status" className="mt-8">Loading profile…</p>;
  if (error && !exists) return <Card className="mx-auto mt-8 max-w-3xl"><CardContent className="space-y-3 p-6"><p role="alert" className="text-red-500">Unable to load your profile: {error}</p><Button variant="outline" onClick={refresh}>Try again</Button></CardContent></Card>;
  return <Card className="mx-auto mt-8 max-w-3xl">
    <CardHeader><CardTitle>Candidate Profile</CardTitle></CardHeader>
    <CardContent>
      {error && <p role="alert" className="mb-4 text-red-500">{error}</p>}
      {message && <p role="status" className="mb-4 text-green-500">{message}</p>}
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={submit}>
        <Input name="headline" aria-label="Headline" placeholder="Professional headline" value={profile.headline || ""} onChange={change} />
        <Input name="phone" aria-label="Phone" placeholder="Phone" value={profile.phone || ""} onChange={change} />
        <Input name="location" aria-label="Location" placeholder="Location" value={profile.location || ""} onChange={change} />
        <Input name="experience_years" aria-label="Years of experience" type="number" min="0" placeholder="Years of experience" value={profile.experience_years} onChange={change} />
        <Textarea className="sm:col-span-2" name="bio" aria-label="About" placeholder="About you" value={profile.bio || ""} onChange={change} />
        <Input name="linkedin_url" aria-label="LinkedIn URL" placeholder="LinkedIn URL" value={profile.linkedin_url || ""} onChange={change} />
        <Input name="github_url" aria-label="GitHub URL" placeholder="GitHub URL" value={profile.github_url || ""} onChange={change} />
        <Input className="sm:col-span-2" name="portfolio_url" aria-label="Portfolio URL" placeholder="Portfolio URL" value={profile.portfolio_url || ""} onChange={change} />
        <Button className="sm:col-span-2" variant="blue" disabled={saving}>{saving ? "Saving…" : "Save profile"}</Button>
      </form>
    </CardContent>
  </Card>;
}
