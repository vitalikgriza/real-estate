"use client";

import { useAppDispatch, useAppSelector } from "@/state/redux";
import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { setFilters, setViewMode, toggleFiltersFullOpen } from "@/state";
import { debounce } from "lodash";
import { cleanParams, cn, formatPriceValue } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Filter, Grid, List, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PropertyTypeIcons } from "@/lib/constants";

const FiltersBar = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const filters = useAppSelector((state) => state.global.filters);
  const isFiltersFullOpen = useAppSelector(
    (state) => state.global.isFiltersFullOpen,
  );
  const viewMode = useAppSelector((state) => state.global.viewMode);
  const [searchInput, setSearchInput] = useState(filters.location);

  const updateURL = debounce((newFilters) => {
    const cleanFilters = cleanParams(newFilters);
    const urlSearchParams = new URLSearchParams();
    Object.entries(cleanFilters).forEach(([key, value]) => {
      urlSearchParams.set(
        key,
        Array.isArray(value) ? value.join(",") : String(value),
      );
    });

    router.push(`${pathname}?${urlSearchParams.toString()}`);
  });

  const handleFilterChange = (
    key: string,
    value: any,
    isMin: boolean | null,
  ) => {
    let newValue = value;
    if (key === "priceRange" || key === "squareFeetRange") {
      const currentRange = [...filters[key]];
      if (isMin !== null) {
        const index = isMin ? 0 : 1;
        currentRange[index] = value === "any" ? null : Number(value);
      }
      newValue = currentRange;
    } else if (key === "coordinates") {
      newValue = value === "any" ? [0, 0] : value.map(Number);
    } else {
      newValue = value === "any" ? null : value;
    }
    const newFilters = { ...filters, [key]: newValue };
    dispatch(setFilters(newFilters));
    updateURL(newFilters);
  };

  return (
    <div className="flex justify-between items-center w-full py-5">
      {/* Filters */}
      <div className="flex justify-between items-center gap-4 p-2">
        <Button
          variant="outline"
          className={cn(
            "gap-2 rounded-xl border-primary-400 hover:bg-primary-500 hover:text-primary-100",
            isFiltersFullOpen && "bg-primary-700 text-primary-100",
          )}
          onClick={() => dispatch(toggleFiltersFullOpen())}
        >
          <Filter className="h-4 w-4" />
          <span>All Filters</span>
        </Button>
        {/* Search Location */}
        <div className="flex items-center">
          <Input
            placeholder="Search location"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-40 rounded-l-xl rounded-r-none border-primary-400 border-r-0"
          />
          <Button
            className="rounded-r-xl rounded-l-none border-primary-400 shadow-none border
            hover:bg-primary-700 hover:text-primary-50"
            // onClick={handleLocationSearch}
          >
            <Search className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex gap-1">
          {/* Min Price */}
          <Select
            value={filters.priceRange[0]?.toString() || "any"}
            onValueChange={(value) =>
              handleFilterChange("priceRange", value, true)
            }
          >
            <SelectTrigger className="rounded-xl border-primary-400">
              <SelectValue>
                {formatPriceValue(filters.priceRange[0], true)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="any">Any Min Price</SelectItem>
              {[500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000].map(
                (price) => (
                  <SelectItem
                    key={price}
                    value={price.toString()}
                    onClick={() =>
                      handleFilterChange("priceRange", price, true)
                    }
                  >
                    ${price / 1000}k+
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
          {/* Max Price */}
          <Select
            value={filters.priceRange[1]?.toString() || "any"}
            onValueChange={(value) =>
              handleFilterChange("priceRange", value, false)
            }
          >
            <SelectTrigger className="min-w-30 rounded-xl border-primary-400">
              <SelectValue>
                {formatPriceValue(filters.priceRange[1], false)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="any">Any Max Price</SelectItem>
              {[500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000].map(
                (price) => (
                  <SelectItem
                    key={price}
                    value={price.toString()}
                    onClick={() =>
                      handleFilterChange("priceRange", price, false)
                    }
                  >
                    ${price / 1000}k+
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </div>
        {/* Beds */}
        <div className="flex gap-1">
          <Select
            value={filters.beds}
            onValueChange={(value) => handleFilterChange("beds", value, null)}
          >
            <SelectTrigger className="rounded-xl border-primary-400">
              <SelectValue placeholder="Beds" className="w-26" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="any">Any Beds</SelectItem>
              <SelectItem value="1">1+ Bed</SelectItem>
              <SelectItem value="2">2+ Beds</SelectItem>
              <SelectItem value="3">3+ Beds</SelectItem>
              <SelectItem value="4">4+ Beds</SelectItem>
            </SelectContent>
          </Select>
          {/* Baths */}
          <Select
            value={filters.baths}
            onValueChange={(value) => handleFilterChange("baths", value, null)}
          >
            <SelectTrigger className="w-30 rounded-xl border-primary-400">
              <SelectValue placeholder="Baths" className="w-26" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="any">Any Baths</SelectItem>
              <SelectItem value="1">1+ Bath</SelectItem>
              <SelectItem value="2">2+ Baths</SelectItem>
              <SelectItem value="3">3+ Baths</SelectItem>
              <SelectItem value="4">4+ Baths</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/*  Property Type */}
        <Select
          value={filters.propertyType || "any"}
          onValueChange={(value) =>
            handleFilterChange("propertyType", value, null)
          }
        >
          <SelectTrigger className="min-w-26 rounded-xl border-primary-400">
            <SelectValue placeholder="Home Type" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="any">Any Property Type</SelectItem>
            {Object.entries(PropertyTypeIcons).map(([type, Icon]) => (
              <SelectItem key={type} value={type} className="flex items-center">
                <Icon className="w-4 h-4 mr-2" />
                <span>{type}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* View Mode */}
      <div className="flex justify-between items-center gap-4 p-2">
        <div className="flex border rounded-xl">
          <Button
            variant="ghost"
            className={cn(
              "px-3 py-1 rounded-none rounded-l-xl hover:bg-primary-600 hover:text-primary-50",
              viewMode === "list" ? "bg-primary-700 text-primary-50" : "",
            )}
            onClick={() => dispatch(setViewMode("list"))}
          >
            <List className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "px-3 py-1 rounded-none rounded-r-xl hover:bg-primary-600 hover:text-primary-50",
              viewMode === "grid" ? "bg-primary-700 text-primary-50" : "",
            )}
            onClick={() => dispatch(setViewMode("grid"))}
          >
            <Grid className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export { FiltersBar };
