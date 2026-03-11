import { zodResolver } from "@hookform/resolvers/zod";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./ui/drawer";

import { Button } from "./ui/button";
import { Input } from "./ui/input";

import { addNewCompany } from "@/services/apiCompanies";
import { useFetch } from "@/services/useFetch";

const schema = z.object({
  name: z.string().min(1, { message: "Company name is required" }),
  logo: z
    .any()
    .refine((files) => files?.length === 1, "Logo is required")
    .refine(
      (files) =>
        ["image/png", "image/jpeg"].includes(files?.[0]?.type),
      "Only PNG or JPEG allowed"
    ),
});

const AddCompanyDrawer = ({ fetchCompanies }) => {
  const [open, setOpen] = useState(false);

  const {
    fn: fnAddCompany,
    loading: loadingAddCompany,
  } = useFetch(addNewCompany);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      logo: null,
    },
  });

  const onSubmit = async (data) => {
    try {
      const file = data.logo[0];

      await fnAddCompany({
        name: data.name,
        logo: file,
      });

      // refresh companies dropdown
      await fetchCompanies();

      // close drawer
      setOpen(false);

      // reset form
      reset();

    } catch (err) {
      console.error("Failed to add company:", err);
    }
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button type="button" variant="blue">
          Add Company
        </Button>
      </DrawerTrigger>

      <DrawerContent className="mx-auto w-[95vw] sm:w-[85vw] md:w-[70vw] px-10 pb-10">
        <DrawerHeader>
          <DrawerTitle>Add New Company</DrawerTitle>
        </DrawerHeader>

        <form
          onSubmit={(e) => {
            e.stopPropagation();
            handleSubmit(onSubmit)(e);
          }}
          className="flex flex-col gap-5 px-5"
        >
          <Input placeholder="Company Name" {...register("name")} />
          {errors.name && (
            <p className="text-red-500 text-sm">{errors.name.message}</p>
          )}

          <Input
            type="file"
            accept="image/png,image/jpeg"
            {...register("logo")}
          />
          {errors.logo && (
            <p className="text-red-500 text-sm">{errors.logo.message}</p>
          )}

          <Button
            type="submit"
            variant="blue"
            disabled={loadingAddCompany}
          >
            {loadingAddCompany ? "Adding..." : "Add Company"}
          </Button>
        </form>
      </DrawerContent>
    </Drawer>
  );
};

export default AddCompanyDrawer;