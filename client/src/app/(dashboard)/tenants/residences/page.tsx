"use client";

import React from "react";
import {
  useGetAuthUserQuery,
  useGetCurrentResidencesQuery,
  useGetPropertiesQuery,
  useGetTenantQuery,
} from "@/state/api";
import { Loading } from "@/components/loading";
import { Header } from "@/components/header";
import { Property } from "@/types/prismaTypes";
import { Card } from "@/components/card";

const Residences = () => {
  const { data: authUser } = useGetAuthUserQuery();
  const { data: tenant } = useGetTenantQuery(
    authUser?.cognitoInfo.userId || "",
    {
      skip: !authUser?.cognitoInfo.userId,
    },
  );

  const {
    data: currentResidences,
    isLoading,
    error,
  } = useGetCurrentResidencesQuery(authUser?.cognitoInfo.userId || "", {
    skip: !authUser?.cognitoInfo.userId,
  });

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return <div>Error loading current residences.</div>;
  }

  return (
    <div className="dashboard-container">
      <Header
        title="Current Residences"
        subtitle="View and manage your current residences"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {currentResidences?.map((property) => (
          <Card
            key={property.id}
            property={property}
            isFavorite={tenant?.favorites.some(
              (fav: Property) => fav.id === property.id,
            )}
            propertyLink={`/tenants/residences/${property.id}`}
            showFavoriteButton={false}
          />
        ))}
      </div>
      {!currentResidences?.length && (
        <p>You don't have any current residences</p>
      )}
    </div>
  );
};

export default Residences;
