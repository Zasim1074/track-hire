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

      // Protected Routes
      {
        element: <ProtectedRoute />,
        children: [
          { path: "/jobs/:id", element: <Job /> },
          { path: "/post-job", element: <PostJob /> },
          { path: "/saved-jobs", element: <SavedJobs /> },
          { path: "/my-jobs", element: <MyJobs /> },
          { path: "/profile", element: <CandidateProfilePage /> },
          { path: "/resumes", element: <ResumesPage /> },
        ],
      },
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
