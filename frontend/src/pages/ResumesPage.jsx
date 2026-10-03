import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteResume, downloadResume, getMyResumes, setDefaultResume, uploadResume } from "@/services/apiResumes";

export default function ResumesPage() {
  const [resumes, setResumes] = useState([]);
  const [file, setFile] = useState(null);
  const fileInput = useRef(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const refresh = async () => {
    setLoading(true); setError("");
    try { setResumes(await getMyResumes()); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { refresh(); }, []);

  const submit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const selectedFile = fileInput.current?.files?.[0] || file;
    if (!selectedFile) { setError("Choose a resume file to upload."); return; }
    const extension = selectedFile.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "doc", "docx"].includes(extension) || selectedFile.size > 5 * 1024 * 1024) {
      setError("Choose a PDF, DOC, or DOCX file no larger than 5 MB.");
      return;
    }
    setBusy(true); setError("");
    try { await uploadResume(selectedFile); setFile(null); form.reset(); await refresh(); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  const withAction = async (action) => {
    setBusy(true); setError("");
    try { await action(); await refresh(); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  const viewResume = async (resume) => {
    try {
      const blob = await downloadResume(resume.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a"); link.href = url; link.download = resume.file_name; link.click();
      URL.revokeObjectURL(url);
    } catch (err) { setError(err.message); }
  };

  return <div className="mx-auto mt-8 max-w-3xl">
    <h1 className="gradient-title mb-5 text-4xl font-extrabold">My Resumes</h1>
    <Card>
      <CardHeader><CardTitle>Upload resume</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
          <Input ref={fileInput} aria-label="Resume file" type="file" accept=".pdf,.doc,.docx" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <Button variant="blue" disabled={busy}>{busy ? "Uploading…" : "Upload"}</Button>
        </form>
        <p className="mt-2 text-xs text-muted-foreground">PDF, DOC, or DOCX. Maximum 5 MB.</p>
      </CardContent>
    </Card>
    {error && <p role="alert" className="my-4 text-red-500">{error}</p>}
    {loading ? <p role="status" className="mt-6">Loading resumes…</p> : resumes.length ? <div className="mt-5 grid gap-3">
      {resumes.map((resume) => <Card key={resume.id}><CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div><p className="font-medium">{resume.file_name} {resume.is_default && <span className="text-green-500">· Default</span>}</p><p className="text-xs text-muted-foreground">Added {new Date(resume.created_at).toLocaleDateString()}</p></div>
        <div className="flex gap-2"><Button variant="outline" onClick={() => viewResume(resume)}>Download</Button>{!resume.is_default && <Button variant="outline" disabled={busy} onClick={() => withAction(() => setDefaultResume(resume.id))}>Set default</Button>}<Button variant="destructive" disabled={busy} onClick={() => withAction(() => deleteResume(resume.id))}>Delete</Button></div>
      </CardContent></Card>)}
    </div> : <p className="mt-6">No resumes uploaded yet.</p>}
  </div>;
}
