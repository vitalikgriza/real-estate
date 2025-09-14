import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { fetchAuthSession } from "@aws-amplify/core";
import { Manager, Tenant } from "@/types/prismaTypes";
import { getCurrentUser } from "@aws-amplify/auth";
import { createNewUserInDatabase } from "@/lib/utils";

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
  tagTypes: [],
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
  }),
});

export const { useGetAuthUserQuery } = api;
