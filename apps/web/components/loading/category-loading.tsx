import React from "react";

function CategoryLoading() {
  return (
    <ul className="space-y-2">
      <ul className="space-y-2">
        <li>
          <div className="h-5 w-[20%] bg-gray-200 rounded animate-pulse" />
        </li>
        <li>
          <div className="h-5 w-[40%] bg-gray-200 rounded animate-pulse" />
        </li>
      </ul>
    </ul>
  );
}

export default CategoryLoading;
