import { Outlet } from "react-router-dom";
import Header from "./Header";

const AppLayout = () => {
  return (
    <div className="color-wash min-h-dvh bg-background">
      <a href="#main-content" className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to main content</a>
      <div className="grid-background" aria-hidden="true" />
      <Header />
      <main id="main-content" tabIndex="-1" className="container min-h-[calc(100dvh-10rem)] py-8 sm:py-10">
        <Outlet />
      </main>
      <footer className="border-t bg-card/80">
        <div className="container flex flex-col gap-2 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p className="font-medium text-foreground">TrackHire</p>
          <p>Clearer hiring journeys for candidates and recruitment teams.</p>
        </div>
      </footer>
    </div>
  );
};

export default AppLayout;
