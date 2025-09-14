"use client";

import React from "react";
import {
  useGetAuthUserQuery,
  useUpdateTenantSettingsMutation,
} from "@/state/api";
import { SettingsForm } from "@/components/settings-form";

const TenantSettings = () => {
  const { data: authUser, isLoading } = useGetAuthUserQuery();
  const [updateTenant] = useUpdateTenantSettingsMutation();

  const initialData = {
    name: authUser?.userInfo.name,
    email: authUser?.userInfo.email,
    phoneNumber: authUser?.userInfo.phoneNumber,
  };

  const handleSubmit = async (data: typeof initialData) => {
    await updateTenant({
      cognitoId: authUser?.cognitoInfo.userId as string,
      ...data,
    });
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }
  return (
    <SettingsForm
      initialData={initialData}
      onSubmit={handleSubmit}
      userType="tenant"
    />
  );
};

export default TenantSettings;
