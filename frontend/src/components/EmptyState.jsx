import { Link } from "react-router-dom";
import { Inbox } from "lucide-react";
import { Button } from "./ui/button";

export default function EmptyState({ title, description, actionLabel, actionTo, icon: Icon = Inbox }) {
  return (
    <div className="col-span-full flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed bg-card/70 p-8 text-center">
      <span className="mb-4 rounded-full bg-primary/10 p-3 text-primary"><Icon aria-hidden="true" className="h-6 w-6" /></span>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      {actionLabel && actionTo && <Button asChild className="mt-5"><Link to={actionTo}>{actionLabel}</Link></Button>}
    </div>
  );
}
