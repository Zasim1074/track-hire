import Jobcard from "@/components/Jobcard";
import { getJobs } from "@/services/apiJobs";
import React, { useEffect, useMemo, useState } from "react";
import { BarLoader } from "react-spinners";
import { getCompanies } from "@/services/apiCompanies";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFetch } from "@/services/useFetch";

const JobListing = () => {
  const [location, setLocation] = useState("");
  const [company, setCompany] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const {
    fn: fnJobs,
    data: dataJobs,
    loading: loadingJobs,
    error: errorJobs,
  } = useFetch(getJobs);

  const {
    fn: fnAllJobs,
    data: dataAllJobs,
  } = useFetch(getJobs);

  const {
    fn: fnCompanies,
    data: dataCompanies,
    loading: loadingCompanies,
  } = useFetch(getCompanies);

  useEffect(() => {
    fnAllJobs({
      location: "",
      company: "",
      searchQuery: "",
    }).catch(() => {});
  }, [fnAllJobs]);

  useEffect(() => {
    fnJobs({
      location,
      company,
      searchQuery,
    }).catch(() => {});
  }, [location, company, searchQuery, fnJobs]);

  useEffect(() => {
    fnCompanies().catch(() => {});
  }, [fnCompanies]);

  const uniqueLocations = useMemo(
    () => [...new Set((dataAllJobs || []).map((job) => job.location).filter(Boolean))].sort(),
    [dataAllJobs],
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    fnJobs();
  };

  const handleReset = (e) => {
    e.preventDefault();
    setSearchQuery("");
    setCompany("");
    setLocation("");
  };

  // ========================================= UI ===================================
  return (
    <div>
      <h1 className="gradient-title font-extrabold text-6xl sm:text-6xl text-start pb-5">
        Latest Jobs
      </h1>

      {/* Filters */}
      <form
        onSubmit={handleSubmit}
        className="h-10 flex flex-1 w-full gap-4 items-center mb-5"
      >
        <Input
          name="search-query"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by Job Title"
          className="h-full flex-1 px-5 text-xl"
        />

        {
          <Select value={company} onValueChange={setCompany}>
            <SelectTrigger className="w-auto h-full gap-4">
              <SelectValue placeholder="Select Company " />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {!loadingCompanies && !dataCompanies?.length && (
                  <SelectItem disabled value="none">
                    No Companies
                  </SelectItem>
                )}
                {dataCompanies?.map((company) => (
                  <SelectItem value={company.id.toString()} key={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        }

        <Select value={location} onValueChange={setLocation}>
          <SelectTrigger className="w-auto gap-2 h-full">
            <SelectValue placeholder="Search by location" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {uniqueLocations.map((loc) => (
                <SelectItem value={loc} key={loc}>
                  {loc}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <Button type="submit" className="h-full sm:w-28" variant="blue">
          Search
        </Button>
        <Button
          type="button"
          className="h-full sm:w-28"
          variant="destructive"
          onClick={handleReset}
        >
          Reset
        </Button>
      </form>

      <hr />

      {/* Jobs Listing */}
      {loadingJobs && (
        <BarLoader className="mb-4" width={"100%"} color="#85D055" />
      )}

      {!loadingJobs && errorJobs && <p role="alert" className="text-red-500">{errorJobs.message}</p>}
      {!loadingJobs && !errorJobs && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {errorJobs ? <div role="alert">{errorJobs.message}</div> : dataJobs?.length ? (
            dataJobs.map((job) => {
              return (
                <Jobcard
                  key={job.id}
                  job={job}
                  savedInit={job?.saved?.length > 0}
                />
              );
            })
          ) : (
            <div>No Jobs Found 😢</div>
          )}
        </div>
      )}
    </div>
  );
};

export default JobListing;
