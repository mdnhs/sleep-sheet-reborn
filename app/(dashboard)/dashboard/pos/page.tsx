import React, { Suspense } from "react";
import PosClientPage from "./pos-client";

export const metadata = {
  title: "POS - Point of Sale",
};

function PosPage() {
  return (
    <Suspense fallback={<div>Loading POS...</div>}>
      <PosClientPage />
    </Suspense>
  );
}

export default PosPage;
