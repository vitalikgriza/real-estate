import React from "react";
import {
  useAddFavoritePropertyMutation,
  useGetAuthUserQuery,
  useGetPropertiesQuery,
  useGetTenantQuery,
  useRemoveFavoritePropertyMutation,
} from "@/state/api";
import { useAppSelector } from "@/state/redux";
import { Property } from "@/types/prismaTypes";
import { Card } from "@/components/card";
import { CardCompact } from "@/components/card-compact";

const Listings = () => {
  const { data: authUser } = useGetAuthUserQuery();
  const { data: tenant } = useGetTenantQuery(authUser?.userInfo.cognitoId, {
    skip: !authUser,
  });
  const [removeFavoriteProperty] = useRemoveFavoritePropertyMutation();
  const [addFavoriteProperty] = useAddFavoritePropertyMutation();
  const filters = useAppSelector((state) => state.global.filters);
  const { data: properties, isLoading } = useGetPropertiesQuery(filters);
  const viewMode = useAppSelector((state) => state.global.viewMode);

  const handleToggleFavorites = async (propertyId: string) => {
    if (!authUser || !tenant) {
      return;
    }

    const isFavorite = tenant.favorites.some(
      (fav: Property) => fav.id === propertyId,
    );

    if (isFavorite) {
      await removeFavoriteProperty({
        cognitoId: authUser.userInfo.cognitoId,
        propertyId: Number(propertyId),
      });
    } else {
      await addFavoriteProperty({
        cognitoId: authUser.userInfo.cognitoId,
        propertyId: Number(propertyId),
      });
    }
  };
  if (!properties) return null;
  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="w-full">
      <h3 className="text-sm px-4 font-bold">
        {properties.length}{" "}
        <span className="text-gray-700 font-normal">
          Places in {filters.location || "the area"}
        </span>
      </h3>
      <div className="flex">
        <div className="p-4 w-full">
          {properties?.map((property) => {
            if (viewMode === "grid") {
              return (
                <Card
                  key={property.id}
                  property={property}
                  isFavorite={tenant?.favorites.some(
                    (fav: Property) => fav.id === property.id,
                  )}
                  onFavoriteToggle={() => handleToggleFavorites(property.id)}
                  propertyLink={`/search/${property.id}`}
                  showFavoriteButton
                />
              );
            } else {
              return (
                <CardCompact
                  key={property.id}
                  property={property}
                  isFavorite={tenant?.favorites.some(
                    (fav: Property) => fav.id === property.id,
                  )}
                  onFavoriteToggle={() => handleToggleFavorites(property.id)}
                  propertyLink={`/search/${property.id}`}
                  showFavoriteButton
                />
              );
            }
          })}
        </div>
      </div>
    </div>
  );
};

export { Listings };
