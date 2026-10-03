import AppliedJobs from "@/components/AppliedJobs";
import PostedJobs from "@/components/PostedJobs";
import { useUser } from "@clerk/clerk-react";
import React from "react";

const MyJobs = () => {
  const { user } = useUser();

  return (
    <div>
      <h1 className="gradient-title font-extrabold pb-3 text-4xl sm:text-5xl">
        {user?.unsafeMetadata?.role === "recruiter"
          ? "My Posted Jobs"
          : "My Jobs"}
      </h1>

      {user?.unsafeMetadata?.role === "recruiter" ? (
        <PostedJobs recruiter_id={user.id} />
      ) : (
        <AppliedJobs user_id={user.id} />
      )}
    </div>
  );
};

export default MyJobs;
