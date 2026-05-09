import React from "react";

interface AuthLayoutProps {
  children: React.ReactNode;
}

function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className=" min-h-screen flex items-center justify-center -mt-20">
      <div className="max-w-md w-full px-4">
        <div className="flex flex-col items-center justify-center space-y-6">
          <label className="text-3xl font-bold">My Account</label>
          {children}
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
