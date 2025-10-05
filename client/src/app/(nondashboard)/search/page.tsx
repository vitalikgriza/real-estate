"use client";

import React, { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/state/redux";
import { NAVBAR_HEIGHT } from "@/lib/constants";
import { cleanParams, cn } from "@/lib/utils";
import { FiltersBar } from "@/app/(nondashboard)/search/filters-bar";
import { FiltersFull } from "@/app/(nondashboard)/search/filters-full";
import { setFilters } from "@/state";
import { Map } from "@/app/(nondashboard)/search/map";
import { Listings } from "@/app/(nondashboard)/search/listings";

const SearchPage = () => {
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const isFiltersFullOpen = useAppSelector(
    (state) => state.global.isFiltersFullOpen,
  );

  useEffect(() => {
    // set filters from url when the component mounts
    const initialFilters = Array.from(searchParams.entries()).reduce(
      (acc: any, [key, value]) => {
        if (key === "priceRange" || key === "squareFeetRange") {
          const [min, max] = value
            .split(",")
            .map((v) => (v ? Number(v) : null));
          acc[key] = [min, max];
        } else if (key === "coordinates") {
          acc[key] = value.split(",").map((v) => Number(v));
        } else {
          acc[key] = value === "any" ? null : value;
        }

        return acc;
      },
      {},
    );
    const cleanedFilters = cleanParams(initialFilters);
    dispatch(setFilters(cleanedFilters));
  }, []);

  return (
    <div
      className="w-full mx-auto px-5 flex flex-col"
      style={{
        height: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
      }}
    >
      <FiltersBar />
      <div className="flex justify-between flex-1 overflow-hidden gap-3 mb-5">
        <div
          className={cn(
            "h-full overflow-auto transition-all duration-300 ease-in-out",
            isFiltersFullOpen
              ? "w-3/12 opacity-100 visible"
              : "w-0 opacity-0 invisible",
          )}
        >
          <FiltersFull />
        </div>
        <Map />
        <div className="basis-4/12 overflow-y-auto">
          <Listings />
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
