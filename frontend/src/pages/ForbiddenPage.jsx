import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function ForbiddenPage() {
  return (
    <main className="mx-auto max-w-xl py-20 text-center">
      <h1 className="gradient-title text-4xl font-extrabold">
        This area isn’t available to your account
      </h1>
      <p className="mt-4 text-muted-foreground">
        Your TrackHire role doesn’t have access to this page.
      </p>
      <Link className="mt-6 inline-block" to="/dashboard">
        <Button variant="blue">Go to your dashboard</Button>
      </Link>
    </main>
  );
}
