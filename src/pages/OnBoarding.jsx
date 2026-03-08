import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/clerk-react";
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

 const OnBoarding = () => {
  const { user } = useUser();
  const navigate = useNavigate();

  const handleRoleSelect = async (role) => {
    await user
      .update({ unsafeMetadata: { role } })
      .then(() =>
        navigate(role === "recruiter" ? "/post-job" : "/jobs", {
          replace: true,
        }),
      )
      .catch((err) => console.log(`Error while updating user role: ${err}`));
  };

  useEffect(() => {
    if (user?.unsafeMetadata?.role) {
      navigate(
        user?.unsafeMetadata?.role === "recruiter" ? "/post-job" : "/jobs",
        { replace: true },
      );
    }
  }, [user, navigate]);

  return (
    <div className="flex flex-col items-center justify-center mt-40">
      <h2 className="gradient-title font-extrabold text-7xl sm:text-8xl tracking-normal">
        I'm a ...
      </h2>
      <div className="mt-16 grid grid-cols-2 gap-8 w-full md:px-32">
        <Button
          variant="blue"
          className="h-36 text-3xl "
          onClick={() => handleRoleSelect("candidate")}
        >
          Candidate
        </Button>
        <Button
          variant="destructive"
          className="h-36 text-3xl"
          onClick={() => handleRoleSelect("recruiter")}
        >
          Recruiter
        </Button>
      </div>
    </div>
  );
};

export default OnBoarding;