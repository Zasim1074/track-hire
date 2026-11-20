import { Link } from "react-router-dom";
import { ArrowRight, BriefcaseBusiness, CheckCircle2, Search, ShieldCheck, UsersRound } from "lucide-react";

import companies from "../data/companies.json";
import faqs from "../data/faq.json";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../components/ui/accordion";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

const steps = [
  { icon: Search, title: "Discover the right role", text: "Search published opportunities with practical filters for work mode, employment type, and experience." },
  { icon: CheckCircle2, title: "Apply with confidence", text: "Choose your resume, submit once, and follow every meaningful application status change." },
  { icon: UsersRound, title: "Move hiring forward", text: "Recruitment teams can review applicants, schedule interviews, record feedback, and make decisions." },
];

export default function LandingPage() {
  return (
    <div className="space-y-20 pb-10 sm:space-y-24">
      <section className="grid items-center gap-10 py-10 lg:grid-cols-[1.15fr_.85fr] lg:py-16">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-sm font-medium text-primary"><ShieldCheck aria-hidden="true" className="h-4 w-4" />One clear journey from application to hire</p>
          <h1 className="mt-6 max-w-3xl text-balance text-4xl font-bold tracking-tight sm:text-6xl">Hiring progress you can actually follow.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">TrackHire gives candidates clarity and gives recruitment teams one dependable place to manage jobs, applications, interviews, and decisions.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg"><Link to="/jobs">Explore open roles<ArrowRight aria-hidden="true" /></Link></Button>
            <Button asChild size="lg" variant="outline"><Link to="/register">Create an account</Link></Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Recruiting for a company? Create an HR account to set up your workspace.</p>
        </div>

        <Card className="overflow-hidden border-primary/20 bg-card">
          <CardHeader className="border-b bg-primary/5"><CardTitle className="flex items-center gap-2"><BriefcaseBusiness aria-hidden="true" className="text-primary" />A focused hiring workspace</CardTitle></CardHeader>
          <CardContent className="space-y-5 p-6">
            {["Private resume access", "Recorded application history", "Timezone-aware interview scheduling", "Role and company-based permissions"].map((feature) => <div key={feature} className="flex items-center gap-3"><span className="rounded-full bg-emerald-100 p-1 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"><CheckCircle2 aria-hidden="true" className="h-4 w-4" /></span><span className="font-medium">{feature}</span></div>)}
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="trusted-heading">
        <h2 id="trusted-heading" className="text-center text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Built for the way modern teams hire</h2>
        <div className="mt-7 grid grid-cols-2 items-center gap-8 sm:grid-cols-4 lg:grid-cols-8">
          {companies.map((company) => {
            const fileName = company.path.split("/").pop();
            const src = new URL(`../assets/companies/${fileName}`, import.meta.url).href;
            return <img key={company.id} src={src} alt={company.name} loading="lazy" className="mx-auto h-8 max-w-full object-contain opacity-55 brightness-0 transition-opacity hover:opacity-85 dark:invert" />;
          })}
        </div>
      </section>

      <section aria-labelledby="how-heading">
        <div className="max-w-2xl"><p className="text-sm font-semibold uppercase tracking-wider text-primary">How TrackHire works</p><h2 id="how-heading" className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Less uncertainty at every step</h2></div>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, text }, index) => <Card key={title}><CardContent className="p-6"><div className="flex items-center justify-between"><span className="rounded-xl bg-primary/10 p-3 text-primary"><Icon aria-hidden="true" /></span><span className="text-sm font-semibold text-muted-foreground">0{index + 1}</span></div><h3 className="mt-5 text-xl font-semibold">{title}</h3><p className="mt-2 leading-7 text-muted-foreground">{text}</p></CardContent></Card>)}
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Card><CardHeader><CardTitle>For candidates</CardTitle></CardHeader><CardContent><p className="leading-7 text-muted-foreground">Keep your profile and resumes organized, save opportunities, apply securely, and see where every application stands.</p><Button asChild variant="link" className="mt-4 px-0"><Link to="/register?role=candidate">Start your job search<ArrowRight aria-hidden="true" /></Link></Button></CardContent></Card>
        <Card><CardHeader><CardTitle>For recruitment teams</CardTitle></CardHeader><CardContent><p className="leading-7 text-muted-foreground">Create your company workspace, publish roles, review applicants, coordinate interviews, and keep decisions accountable.</p><Button asChild variant="link" className="mt-4 px-0"><Link to="/register?role=hr">Set up your hiring workspace<ArrowRight aria-hidden="true" /></Link></Button></CardContent></Card>
      </section>

      <section className="mx-auto max-w-3xl" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="text-center text-3xl font-bold tracking-tight">Frequently asked questions</h2>
        <Accordion type="single" collapsible className="mt-7">{faqs.map((faq, index) => <AccordionItem key={faq.question} value={`item-${index + 1}`}><AccordionTrigger>{faq.question}</AccordionTrigger><AccordionContent className="leading-7 text-muted-foreground">{faq.answer}</AccordionContent></AccordionItem>)}</Accordion>
      </section>
    </div>
  );
}
