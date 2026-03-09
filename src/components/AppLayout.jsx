import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import { Protect } from "@clerk/clerk-react";
import ProtectedRoute from "@/components/ProtectedRoute";

const AppLayout = () => {
  return (
    <>
      <div>
        <div className="grid-background"></div>
        <main className="min-h-screen container">
          <Header />
          <Outlet />
        </main>
        <div className="p-10 text-center bg-grey-800 mt-10">
          © 2026 Jaseem Quraishi. All rights reserved.
        </div>
      </div>
    </>
  );
};

export default AppLayout;
