import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { fetchAuthSession } from "@aws-amplify/core";
import { Manager, Property, Tenant } from "@/types/prismaTypes";
import { getCurrentUser } from "@aws-amplify/auth";
import { cleanParams, createNewUserInDatabase } from "@/lib/utils";
import { FilterState } from "@/state/index";

export const api = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
    prepareHeaders: async (headers) => {
      const session = await fetchAuthSession();
      const { idToken } = session.tokens ?? {};
      if (idToken) {
        headers.set("Authorization", `Bearer ${idToken}`);
      }
      return headers;
    },
  }),
  reducerPath: "api",
  tagTypes: ["Managers", "Tenants", "Properties"],
  endpoints: (build) => ({
    getAuthUser: build.query<User, void>({
      queryFn: async (_, _queryApi, _extraOption, fetchWithBQ) => {
        try {
          const session = await fetchAuthSession();
          const { idToken } = session.tokens ?? {};
          const user = await getCurrentUser();
          const userRole = idToken?.payload["custom:role"] as string;

          const endpoint = userRole === "manager" ? "/managers" : "/tenants";
          let userDetailsResponse = await fetchWithBQ(
            `${endpoint}/${user.userId}`,
          );

          // create a new user if user does not exist
          if (
            userDetailsResponse.error &&
            userDetailsResponse.error.status === 404
          ) {
            userDetailsResponse = await createNewUserInDatabase(
              user,
              idToken,
              userRole,
              fetchWithBQ,
            );
          }

          return {
            data: {
              cognitoInfo: { ...user },
              userInfo: userDetailsResponse.data as Manager | Tenant,
              userRole,
            },
          };
        } catch (error: any) {
          return {
            error: error.message || "Could not fetch user",
          };
        }
      },
    }),
    updateManagerSettings: build.mutation<
      Manager,
      { cognitoId: string } & Partial<Manager>
    >({
      query: ({ cognitoId, ...body }) => ({
        url: `/managers/${cognitoId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result) => [{ type: "Managers", id: result?.id }],
    }),
    // property-related endpoints
    getProperties: build.query<
      Property[],
      Partial<FilterState> & { favoriteIds?: number[] }
    >({
      query: (filters) => {
        const params = cleanParams({
          location: filters.location,
          priceMin: filters.priceRange?.[0],
          priceMax: filters.priceRange?.[1],
          beds: filters.beds,
          baths: filters.baths,
          propertyType: filters.propertyType,
          squareFeetMin: filters.squareFeetRange?.[0],
          squareFeetMax: filters.squareFeetRange?.[1],
          amenities: filters.amenities?.join(","),
          availableFrom: filters.availableFrom,
          favoriteIds: filters.favoriteIds?.join(","),
          latitude: filters.coordinates?.[1],
          longitude: filters.coordinates?.[0],
        });

        return {
          url: "properties",
          params,
        };
      },
      providesTags: (result) => {
        if (result) {
          return [
            ...result.map(({ id }) => ({ type: "Properties" as const, id })),
            { type: "Properties", id: "LIST" },
          ];
        }
        return [{ type: "Properties", id: "LIST" }];
      },
    }),

    // tenants related endpoints
    getTenant: build.query<Tenant, string>({
      query: (cognitoId) => `/tenants/${cognitoId}`,
      providesTags: (result) =>
        result ? [{ type: "Tenants", id: result.id }] : [],
    }),
    updateTenantSettings: build.mutation<
      Tenant,
      { cognitoId: string } & Partial<Tenant>
    >({
      query: ({ cognitoId, ...body }) => ({
        url: `/tenants/${cognitoId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result) => [{ type: "Tenants", id: result?.id }],
    }),
    addFavoriteProperty: build.mutation<
      Tenant,
      { cognitoId: string; propertyId: number }
    >({
      query: ({ cognitoId, propertyId }) => ({
        url: `/tenants/${cognitoId}/favorites/${propertyId}`,
        method: "POST",
      }),
      invalidatesTags: (result) => [
        { type: "Tenants", id: result?.id },
        { type: "Properties", id: "LIST" },
      ],
    }),
    removeFavoriteProperty: build.mutation<
      Tenant,
      { cognitoId: string; propertyId: number }
    >({
      query: ({ cognitoId, propertyId }) => ({
        url: `/tenants/${cognitoId}/favorites/${propertyId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result) => [
        { type: "Tenants", id: result?.id },
        { type: "Properties", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetAuthUserQuery,
  useGetPropertiesQuery,
  useGetTenantQuery,
  useUpdateTenantSettingsMutation,
  useUpdateManagerSettingsMutation,
  useAddFavoritePropertyMutation,
  useRemoveFavoritePropertyMutation,
} = api;
