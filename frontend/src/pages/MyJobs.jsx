import AppliedJobs from "@/components/AppliedJobs";
import PostedJobs from "@/components/PostedJobs";
import { useAuth } from "@/auth/AuthContext";
import React from "react";

const MyJobs = () => {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="gradient-title font-extrabold pb-3 text-4xl sm:text-5xl">
        {user?.role === "hr" || user?.role === "admin"
          ? "My Posted Jobs"
          : "My Jobs"}
      </h1>

      {user?.role === "hr" || user?.role === "admin" ? (
        <PostedJobs />
      ) : (
        <AppliedJobs />
      )}
    </div>
  );
};

export default MyJobs;
