import { lazy, Suspense } from "react";
import "./App.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ThemeProvider } from "./components/theme-provider";
import { BarLoader } from "react-spinners";
const AppLayout = lazy(() => import("./components/AppLayout"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const JobListing = lazy(() => import("./pages/JobListing"));
const ProtectedRoute = lazy(() => import("./components/ProtectedRoute"));
const PostJob = lazy(() => import("./pages/PostJob"));
const SavedJobs = lazy(() => import("./pages/SavedJobs"));
const MyJobs = lazy(() => import("./pages/MyJobs"));
const Job = lazy(() => import("./pages/Job"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const CandidateProfilePage = lazy(() => import("./pages/CandidateProfilePage"));
const ResumesPage = lazy(() => import("./pages/ResumesPage"));
const RoleHome = lazy(() => import("./pages/RoleHome"));
const ForbiddenPage = lazy(() => import("./pages/ForbiddenPage"));

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    errorElement: <div className="flex justify-center items-center w-full h-[100vh] text-3xl">Something went wrong 🥺</div>,
    children: [
      // Public Routes
      { path: "/", element: <LandingPage /> },
      { path: "/jobs", element: <JobListing /> },
      { path: "/login", element: <AuthPage mode="login" /> },
      { path: "/register", element: <AuthPage mode="register" /> },
      { path: "/unauthorized", element: <ForbiddenPage /> },

      // Protected Routes
      {
        element: <ProtectedRoute />,
        children: [
          { path: "/dashboard", element: <RoleHome /> },
          { path: "/jobs/:id", element: <Job /> },
          { element: <ProtectedRoute allowedRoles={["hr", "admin"]} />, children: [
            { path: "/post-job", element: <PostJob /> },
            { path: "/my-jobs", element: <MyJobs /> },
          ] },
          { element: <ProtectedRoute allowedRoles={["candidate"]} />, children: [
            { path: "/saved-jobs", element: <SavedJobs /> },
            { path: "/profile", element: <CandidateProfilePage /> },
            { path: "/resumes", element: <ResumesPage /> },
            { path: "/my-applications", element: <MyJobs /> },
          ] },
        ],
      },
      { path: "*", element: <div className="py-20 text-center"><h1 className="text-3xl font-bold">Page not found</h1><p className="mt-3">This TrackHire page doesn’t exist.</p></div> },
    ],
  },
]);
function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Suspense
        fallback={<BarLoader className="mb-4" width={"100%"} color="#85D055" />}
      >
        <RouterProvider router={router} />
      </Suspense>
    </ThemeProvider>
  );
}

export default App;
