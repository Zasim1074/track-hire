import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Boxes,
  Briefcase,
  CheckCircle,
  Clock,
  Download,
  Eye,
  MapPinCheck,
  School,
  XCircle,
} from "lucide-react";
import { useFetch } from "@/services/useFetch";
import { updateApplicationStatus } from "@/services/apiApplications";
import { BarLoader } from "react-spinners";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const capitalizeFirstLetter = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

const ApplicationCard = ({ application, isCandidate = false }) => {
  const [status, setStatus] = useState(application?.status || "applied");

  const { loading: loadingApplication, fn: applicationStatusFn } = useFetch(
    updateApplicationStatus,
    {
      application_id: application.id,
    },
  );

  const handleStatusChange = async (newStatus) => {
    const prev = status;
    setStatus(newStatus);

    try {
      await applicationStatusFn(newStatus);
    } catch (err) {
      setStatus(prev);
    }
  };

  const handleDownload = () => {
    if (!application?.resume) return;
    window.open(application.resume, "_blank", "noopener,noreferrer");
  };

  const StatusIcon = ({ status }) => {
    switch (status) {
      case "applied":
        return <Clock size={18} className="text-white" />;

      case "interviewing":
        return <Eye size={18} className="text-blue-500" />;

      case "hired":
        return <CheckCircle size={18} className="text-green-500" />;

      case "rejected":
        return <XCircle size={18} className="text-red-500" />;

      default:
        return null;
    }
  };

  return (
    <div>
      <Card>
        {loadingApplication && (
          <BarLoader className="mb-4" width={"100%"} color="#85D055" />
        )}
        <CardHeader className="px-5 pt-3 pb-1.5">
          <CardTitle className="flex justify-between font-bold gap-2">
            <div className="flex flex-row gap-10 items-center">
              <h3 className="text-2xl">
                {isCandidate ? `${application?.name}` : `${application?.name}`}
              </h3>
              <div className="flex flex-row gap-2 items-center">
                <Briefcase />
                <h3>
                  Experience :
                  <span className="pl-2">{application?.experience}</span> years
                </h3>
              </div>
            </div>
            <Download
              size={18}
              className="bg-white text-black rounded-md h-8 w-8 p-1.5 cursor-pointer"
              onClick={handleDownload}
            />
          </CardTitle>
        </CardHeader>

        <CardContent className="pb-1 pr-5">
          <div className="felx flex-col md:flex-row justify-between text-sm md:text-md">
            <div className="flex flex-row items-center gap-2">
              <Boxes size={15} />
              <p>{`skills :  ${application?.skills}`}</p>
            </div>
            <div className="flex flex-row items-center gap-2">
              <School size={15} />
              <p>{`Education :  ${capitalizeFirstLetter(application?.education)} in  ${capitalizeFirstLetter(application?.degree)}`}</p>
            </div>
            <div className="flex flex-row items-center gap-2">
              <MapPinCheck size={15} />
              <p>{`Location :  ${application?.location}`}</p>
            </div>
            <div className="w-full flex justify-between ">
              {!isCandidate &&<Select
                value={status}
                onValueChange={async (value) => {
                  setStatus(value);
                  await handleStatusChange(value);
                }}
              >
                <SelectTrigger className={`w-auto mt-2 h-8 gap-4`}>
                  <SelectValue
                    placeholder={`Application Status : ${application?.status}`}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="applied">Applied</SelectItem>
                    <SelectItem value="interviewing">Interviewing</SelectItem>
                    <SelectItem value="hired">Hired</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>}
              {isCandidate && (
                <div className="flex flex-row items-center gap-2">
                  <p>{<StatusIcon status={application?.status} />}</p>
                  <p>{`Status : ${capitalizeFirstLetter(application?.status)}`}</p>
                </div>
              )}
              <span className="text-xs text-gray-400 mt-6">
                {application?.created_at
                  ? new Date(application.created_at).toLocaleString()
                  : ""}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApplicationCard;
