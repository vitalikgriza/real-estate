import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { fetchAuthSession } from "@aws-amplify/core";
import {
  Application,
  Lease,
  Manager,
  Payment,
  Property,
  Tenant,
} from "@/types/prismaTypes";
import { getCurrentUser } from "@aws-amplify/auth";
import { cleanParams, createNewUserInDatabase, withToast } from "@/lib/utils";
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
  tagTypes: [
    "Managers",
    "Tenants",
    "Properties",
    "Leases",
    "Payments",
    "Applications",
  ],
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

    // PROPERTY-RELATED ENDPOINTS
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
      async onQueryStarted(_, queryLifeCycleApi): Promise<void> {
        await withToast(queryLifeCycleApi.queryFulfilled, {
          error: "Failed to load properties.",
        });
      },
    }),
    getProperty: build.query<Property, number>({
      query: (propertyId) => `/properties/${propertyId}`,
      providesTags: (result) =>
        result ? [{ type: "Properties", id: result.id }] : [],
      async onQueryStarted(_, queryLifeCycleApi): Promise<void> {
        await withToast(queryLifeCycleApi.queryFulfilled, {
          error: "Failed to load property details.",
        });
      },
    }),

    // TENANTS RELATED ENDPOINTS
    getTenant: build.query<Tenant, string>({
      query: (cognitoId) => `/tenants/${cognitoId}`,
      providesTags: (result) =>
        result ? [{ type: "Tenants", id: result.id }] : [],
      async onQueryStarted(_, queryLifeCycleApi): Promise<void> {
        await withToast(queryLifeCycleApi.queryFulfilled, {
          error: "Failed to load tenant profile.",
        });
      },
    }),
    getCurrentResidences: build.query<Property[], string>({
      query: (cognitoId) => `/tenants/${cognitoId}/current-residences`,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Properties" as const, id })),
              { type: "Properties", id: "LIST" },
            ]
          : [{ type: "Properties", id: "LIST" }],
      async onQueryStarted(_, queryLifeCycleApi): Promise<void> {
        await withToast(queryLifeCycleApi.queryFulfilled, {
          error: "Failed to fetch current residences.",
        });
      },
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
      async onQueryStarted(_, queryLifeCycleApi): Promise<void> {
        await withToast(queryLifeCycleApi.queryFulfilled, {
          success: "Tenant settings updated successfully.",
          error: "Failed to update tenant settings.",
        });
      },
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
      async onQueryStarted(_, queryLifeCycleApi): Promise<void> {
        await withToast(queryLifeCycleApi.queryFulfilled, {
          success: "Added to favorites!",
          error: "Failed to add favorite property.",
        });
      },
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
      async onQueryStarted(_, queryLifeCycleApi): Promise<void> {
        await withToast(queryLifeCycleApi.queryFulfilled, {
          error: "Failed to remove property.",
        });
      },
    }),

    // MANAGER PROPERTIES ENDPOINTS
    getManagerProperties: build.query<Property[], string>({
      query: (cognitoId) => `/managers/${cognitoId}/properties`,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Properties" as const, id })),
              { type: "Properties", id: "LIST" },
            ]
          : [{ type: "Properties", id: "LIST" }],
      async onQueryStarted(_, queryLifeCycleApi): Promise<void> {
        await withToast(queryLifeCycleApi.queryFulfilled, {
          error: "Failed to fetch properties.",
        });
      },
    }),
    createProperty: build.mutation<Property, FormData>({
      query: (newProperty) => ({
        url: `properties`,
        method: "POST",
        body: newProperty,
      }),
      invalidatesTags: (result) => [
        { type: "Properties", id: "LIST" },
        { type: "Managers", id: result?.manager?.id },
      ],
      async onQueryStarted(_, queryLifeCycleApi): Promise<void> {
        await withToast(queryLifeCycleApi.queryFulfilled, {
          success: "Property created successfully!",
          error: "Failed to create a new property.",
        });
      },
    }),

    // LEASES RELATED ENDPOINTS
    getLeases: build.query<Lease[], void>({
      query: () => `/leases`,
      providesTags: ["Leases"],
      async onQueryStarted(_, queryLifeCycleApi): Promise<void> {
        await withToast(queryLifeCycleApi.queryFulfilled, {
          error: "Failed to fetch leases.",
        });
      },
    }),

    getPropertyLeases: build.query<Lease[], number>({
      query: (propertyId) => `/properties/${propertyId}/leases`,
      providesTags: ["Leases"],
      async onQueryStarted(_, queryLifeCycleApi): Promise<void> {
        await withToast(queryLifeCycleApi.queryFulfilled, {
          error: "Failed to fetch property leases.",
        });
      },
    }),

    // PAYMENTS RELATED ENDPOINTS
    getPayments: build.query<Payment[], number>({
      query: (leaseId) => `/leases/${leaseId}/payments`,
      providesTags: ["Payments"],
      async onQueryStarted(_, queryLifeCycleApi): Promise<void> {
        await withToast(queryLifeCycleApi.queryFulfilled, {
          error: "Failed to fetch payment info.",
        });
      },
    }),

    // APPLICATIONS RELATED ENDPOINTS
    getApplications: build.query<
      Application[],
      {
        userId?: string;
        userType?: "tenant" | "manager";
      }
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.userId) {
          queryParams.append("userId", params.userId);
        }
        if (params.userType) {
          queryParams.append("userType", params.userType);
        }
        return `/applications?${queryParams.toString()}`;
      },
      providesTags: ["Applications"],
      async onQueryStarted(_, queryLifeCycleApi): Promise<void> {
        await withToast(queryLifeCycleApi.queryFulfilled, {
          error: "Failed to fetch applications.",
        });
      },
    }),
    updateApplicationStatus: build.mutation<
      Application & { lease?: Lease },
      { applicationId: number; status: string }
    >({
      query: ({ applicationId, status }) => ({
        url: `/applications/${applicationId}/status`,
        method: "PUT",
        body: { status },
      }),
      invalidatesTags: ["Applications"],
      async onQueryStarted(_, queryLifeCycleApi): Promise<void> {
        await withToast(queryLifeCycleApi.queryFulfilled, {
          success: "Application status updated successfully.",
          error: "Failed to update application status.",
        });
      },
    }),
    createApplication: build.mutation<Application, Partial<Application>>({
      query: (newApplication) => ({
        url: `/applications`,
        method: "POST",
        body: newApplication,
      }),
      invalidatesTags: ["Applications"],
      async onQueryStarted(_, queryLifeCycleApi): Promise<void> {
        await withToast(queryLifeCycleApi.queryFulfilled, {
          success: "Application submitted successfully.",
          error: "Failed to submit application.",
        });
      },
    }),
  }),
});

export const {
  useGetAuthUserQuery,
  useGetPropertiesQuery,
  useGetPropertyQuery,
  useGetTenantQuery,
  useGetCurrentResidencesQuery,
  useGetManagerPropertiesQuery,
  useGetLeasesQuery,
  useGetPropertyLeasesQuery,
  useGetPaymentsQuery,
  useGetApplicationsQuery,
  useUpdateTenantSettingsMutation,
  useUpdateManagerSettingsMutation,
  useAddFavoritePropertyMutation,
  useCreatePropertyMutation,
  useRemoveFavoritePropertyMutation,
  useUpdateApplicationStatusMutation,
  useCreateApplicationMutation,
} = api;
