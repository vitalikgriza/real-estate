"use client";

import React from "react";
import { useParams } from "next/navigation";
import {
  useGetAuthUserQuery,
  useGetLeasesQuery,
  useGetPaymentsQuery,
  useGetPropertyQuery,
} from "@/state/api";
import { Loading } from "@/components/loading";
import { PaymentMethod } from "@/app/(dashboard)/tenants/residences/[id]/payment-method";
import { ResidenceCard } from "@/app/(dashboard)/tenants/residences/[id]/residence-card";
import { BillingHistory } from "@/app/(dashboard)/tenants/residences/[id]/payment-history";

const Residence = () => {
  const { id } = useParams();
  const { data: authUser } = useGetAuthUserQuery();
  const {
    data: property,
    isLoading: propertyLoading,
    error: propertyError,
  } = useGetPropertyQuery(Number(id));

  const {
    data: leases,
    isLoading: leasesLoading,
    error: leasesError,
  } = useGetLeasesQuery(undefined, {
    skip: !authUser?.cognitoInfo.userId || !property,
  });

  const {
    data: payments,
    isLoading: paymentsLoading,
    error: paymentsError,
  } = useGetPaymentsQuery(leases?.[0]?.id || 0, {
    skip: !leases?.length,
  });

  if (propertyLoading || leasesLoading || paymentsLoading) {
    return <Loading />;
  }

  if (propertyError || leasesError || paymentsError) {
    return <div>Error loading residence details.</div>;
  }

  const currentLease = leases?.find(
    (lease) => lease.propertyId === property?.id,
  );

  return (
    <div className="dashboard-container">
      <div className="w-full mx-auto">
        <div className="md:flex gap-10">
          {currentLease && (
            <ResidenceCard property={property} currentLease={currentLease} />
          )}
          <PaymentMethod />
        </div>
        <BillingHistory payments={payments || []} />
      </div>
    </div>
  );
};

export default Residence;
