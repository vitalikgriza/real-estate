"use client";

import React, { ReactNode, useEffect } from "react";
import { Amplify } from "aws-amplify";
import {
  Authenticator,
  Heading,
  Radio,
  RadioGroupField,
  useAuthenticator,
  View,
} from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { usePathname, useRouter } from "next/navigation";

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID!,
      userPoolClientId: process.env.NEXT_PUBLIC_AWS_COGNITO_USER_CLIENT_ID!,
    },
  },
});

const formFields = {
  signIn: {
    username: {
      placeholder: "Enter your email",
      isRequired: true,
      label: "Email",
      type: "email",
    },
    password: {
      placeholder: "Enter your password",
      isRequired: true,
      label: "Password",
      type: "password",
    },
  },
  signUp: {
    username: {
      order: 1,
      placeholder: "Enter your username",
      isRequired: true,
      label: "Username",
    },
    email: {
      order: 2,
      placeholder: "Enter your email",
      isRequired: true,
      label: "Email",
      type: "email",
    },
    password: {
      order: 3,
      placeholder: "Create a password",
      isRequired: true,
      label: "Password",
      type: "password",
    },
    confirm_password: {
      order: 4,
      placeholder: "Confirm your password",
      isRequired: true,
      label: "Confirm Password",
      type: "password",
    },
  },
};

const components = {
  Header() {
    return (
      <View className="mt-7 mb-4">
        <Heading level={3} className="!text-2xl !font-bold">
          RENT
          <span className="text-secondary-500 font-light hover:!text-primary-300">
            IFUL
          </span>
        </Heading>
        <p className="text-muted-foreground mt-2">
          <span className="font-bold">Welcome!</span> Please sign in to
          continue.
        </p>
      </View>
    );
  },
  SignIn: {
    Footer() {
      const { toSignUp } = useAuthenticator();
      return (
        <View className="text-center mt-4">
          <p className="text-muted-foreground">
            Don&apos;t have an account?{" "}
            <button
              className="text-primary hover:underline bg-transparent border-none p-0"
              onClick={toSignUp}
            >
              Sign up here
            </button>
          </p>
        </View>
      );
    },
  },

  SignUp: {
    FormFields() {
      const { validationErrors } = useAuthenticator();
      return (
        <>
          <Authenticator.SignUp.FormFields />
          <RadioGroupField
            name="custom:role"
            legend="Role"
            isRequired
            errorMessage={validationErrors["custom:role"]}
            hasError={!!validationErrors["custom:role"]}
          >
            <Radio value="tenant">Tenant</Radio>
            <Radio value="manager">Manager</Radio>
          </RadioGroupField>
        </>
      );
    },
    Footer() {
      const { toSignIn } = useAuthenticator();
      return (
        <View className="text-center mt-4">
          <p className="text-muted-foreground">
            Already have an account?{" "}
            <button
              className="text-primary hover:underline bg-transparent border-none p-0"
              onClick={toSignIn}
            >
              Sign in
            </button>
          </p>
        </View>
      );
    },
  },
};

const Auth = ({ children }: { children: ReactNode }) => {
  const { user } = useAuthenticator((context) => [context.user]);
  const router = useRouter();
  const pathname = usePathname();
  const isAuthPage = pathname.match(/^\/(signin|signup)$/);
  const isDashboardPage =
    pathname.startsWith("/managers") || pathname.startsWith("/tenants");

  useEffect(() => {
    if (user && isAuthPage) {
      router.push("/");
    }
  }, [user, isAuthPage, router]);

  // Allow access to public pages without authentication
  if (!isAuthPage && !isDashboardPage) {
    return <>{children}</>;
  }

  return (
    <div className="h-full">
      <Authenticator
        initialState={pathname.includes("signup") ? "signUp" : "signIn"}
        components={components}
        formFields={formFields}
      >
        {() => <>{children}</>}
      </Authenticator>
    </div>
  );
};

export { Auth };
