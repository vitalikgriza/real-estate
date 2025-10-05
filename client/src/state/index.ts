import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface FilterState {
  location: string;
  beds: string;
  baths: string;
  propertyType: string;
  amenities: string[];
  availableFrom: string;
  priceRange: [number, number] | [null, null];
  squareFeetRange: [number, number] | [null, null];
  coordinates: [number, number];
}

export interface GlobalState {
  isFiltersFullOpen: boolean;
  filters: FilterState;
  viewMode: "grid" | "list";
}

export const initialState: GlobalState = {
  isFiltersFullOpen: false,
  filters: {
    location: "Los Angeles",
    beds: "any",
    baths: "any",
    propertyType: "any",
    amenities: [],
    availableFrom: "",
    priceRange: [null, null],
    squareFeetRange: [null, null],
    coordinates: [-118.25, 34.05],
  },
  viewMode: "grid", // or 'list'
};

export const globalSlice = createSlice({
  name: "global",
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<FilterState>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    toggleFiltersFullOpen: (state) => {
      state.isFiltersFullOpen = !state.isFiltersFullOpen;
    },
    setViewMode: (state, action: PayloadAction<"grid" | "list">) => {
      state.viewMode = action.payload;
    },
  },
});

export const { setFilters, toggleFiltersFullOpen, setViewMode } =
  globalSlice.actions;

export default globalSlice.reducer;
