import React from 'react';
import {NAVBAR_HEIGHT} from "@/lib/constants";
import {NavBar} from "@/components/navbar";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="w-full h-full">
      <NavBar />
      <main className={`h-full w-full flex flex-col`} style={{ paddingTop: `${NAVBAR_HEIGHT}px` }}>
        {children}
      </main>
    </div>
  );
}

export default Layout;
