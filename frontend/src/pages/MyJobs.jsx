import AppliedJobs from "@/components/AppliedJobs";
import PostedJobs from "@/components/PostedJobs";
import { useAuth } from "@/auth/AuthContext";
import React from "react";
import PageHeader from "@/components/PageHeader";

const MyJobs = () => {
  const { user } = useAuth();

  return (
    <div>
      <PageHeader eyebrow={user?.role === "candidate" ? "Candidate workspace" : "Recruiter workspace"} title={user?.role === "hr" || user?.role === "admin" ? "Jobs and applicants" : "Your applications"} description={user?.role === "candidate" ? "Review every application, status update, and interview from one place." : "Manage published roles and open each job to review its applicant pipeline."} />

      {user?.role === "hr" || user?.role === "admin" ? (
        <PostedJobs />
      ) : (
        <AppliedJobs />
      )}
    </div>
  );
};

export default MyJobs;
