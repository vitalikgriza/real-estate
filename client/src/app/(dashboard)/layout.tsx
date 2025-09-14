"use client";

import React, { useEffect, useState } from "react";
import { NavBar } from "@/components/navbar";
import { NAVBAR_HEIGHT } from "@/lib/constants";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/app-sidebar";
import { useGetAuthUserQuery } from "@/state/api";
import { usePathname, useRouter } from "next/navigation";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { data: authUser, isLoading: authLoading } = useGetAuthUserQuery();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authUser) {
      const isManager = authUser.userRole?.toLowerCase() === "manager";
      const userRole = authUser.userRole?.toLowerCase();

      if (
        (userRole === "manager" && pathname.startsWith("/tenants")) ||
        (userRole === "tenant" && pathname.startsWith("/managers"))
      ) {
        router.push(isManager ? "/managers/properties" : "/tenants/favorites", {
          scroll: false,
        });
      } else {
        setIsLoading(false);
      }
    }
  }, [authUser, pathname, router]);

  if (authLoading || isLoading) {
    return <>Loading...</>;
  }

  if (!authUser?.userRole) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full bg-primary-100">
        <NavBar />
        <div style={{ paddingTop: `${NAVBAR_HEIGHT}px` }}>
          <main className="flex">
            <AppSidebar userType={authUser.userRole.toLowerCase()} />
            <div className="flex-grow transition-all duration-300">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
