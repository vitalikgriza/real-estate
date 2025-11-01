"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useGetAuthUserQuery } from "@/state/api";
import { ImagePreviews } from "@/app/(nondashboard)/search/[id]/image-previews";
import { PropertyOverview } from "@/app/(nondashboard)/search/[id]/property-overview";
import { PropertyDetails } from "@/app/(nondashboard)/search/[id]/property-details";
import PropertyLocation from "@/app/(nondashboard)/search/[id]/property-location";
import ContactWidget from "@/app/(nondashboard)/search/[id]/contact-widget";
import ApplicationModal from "@/app/(nondashboard)/search/[id]/application-modal";

const SingleListing = () => {
  const { id } = useParams();
  const propertyId = Number(id);
  const { data: authUser } = useGetAuthUserQuery();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div>
      <ImagePreviews
        images={["/singlelisting-2.jpg", "/singlelisting-3.jpg"]}
      />

      <div className="flex flex-col md:flex-row gap-10 mx-10 md:w-2/3 md:mx-auto mt-16 mb-8">
        <div className="order-2 md:order-1">
          <PropertyOverview propertyId={propertyId} />
          <PropertyDetails propertyId={propertyId} />
          <PropertyLocation propertyId={propertyId} />
        </div>
        <div className="order-1 md:order-2">
          <ContactWidget onOpenModal={() => setIsModalOpen(true)} />
        </div>
        {authUser && (
          <ApplicationModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            propertyId={propertyId}
          />
        )}
      </div>
    </div>
  );
};

export default SingleListing;
