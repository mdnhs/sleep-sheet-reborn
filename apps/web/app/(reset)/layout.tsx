import { ReduxProvider } from "@/providers/redux-provider";
import React from "react";

interface LayoutProps {
  children: React.ReactNode;
}

function Layout({ children }: LayoutProps) {
  return (
    <ReduxProvider>
      <div className=" min-h-screen flex items-center justify-center -mt-20">
        <div className="max-w-md w-full px-4">
          <div className="flex flex-col items-center justify-center space-y-6">
            {children}
          </div>
        </div>
      </div>
    </ReduxProvider>
  );
}

export default Layout;
