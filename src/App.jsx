import { lazy, Suspense } from "react";
import "./App.css";
import {  createHashRouter, RouterProvider } from "react-router-dom";
import { ThemeProvider } from "./components/theme-provider";
import { BarLoader } from "react-spinners";
const AppLayout = lazy(() => import("./components/AppLayout"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const JobListing = lazy(() => import("./pages/JobListing"));
const ProtectedRoute = lazy(() => import("./components/ProtectedRoute"));
const OnBoarding = lazy(() => import("./pages/OnBoarding"));
const PostJob = lazy(() => import("./pages/PostJob"));
const SavedJobs = lazy(() => import("./pages/SavedJobs"));
const MyJobs = lazy(() => import("./pages/MyJobs"));
const Job = lazy(() => import("./pages/Job"));

const router = createHashRouter([
  {
    element: <AppLayout />,
    errorElement: <div className="flex justify-center items-center w-full h-[100vh] text-3xl">Something went wrong 🥺</div>,
    children: [
      // Public Routes
      { path: "/", element: <LandingPage /> },
      { path: "/jobs", element: <JobListing /> },

      // Protected Routes
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: "/on-boarding",
            element: <OnBoarding />,
          },
          { path: "/jobs/:id", element: <Job /> },
          { path: "/post-job", element: <PostJob /> },
          { path: "/saved-jobs", element: <SavedJobs /> },
          { path: "/my-jobs", element: <MyJobs /> },
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
