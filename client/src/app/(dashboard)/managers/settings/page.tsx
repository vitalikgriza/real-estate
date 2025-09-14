"use client";

import React from "react";
import {
  useGetAuthUserQuery,
  useUpdateManagerSettingsMutation,
} from "@/state/api";
import { SettingsForm } from "@/components/settings-form";

const ManagerSettings = () => {
  const { data: authUser, isLoading } = useGetAuthUserQuery();
  const [updateManager] = useUpdateManagerSettingsMutation();

  const initialData = {
    name: authUser?.userInfo.name,
    email: authUser?.userInfo.email,
    phoneNumber: authUser?.userInfo.phoneNumber,
  };

  const handleSubmit = async (data: typeof initialData) => {
    await updateManager({
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
      userType="manager"
    />
  );
};

export default ManagerSettings;
