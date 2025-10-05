"use client";

import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useAppSelector } from "@/state/redux";
import { useGetPropertiesQuery } from "@/state/api";
import { Property } from "@/types/prismaTypes";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

const createPropertyMarkers = (property: Property, map: mapboxgl.Map) => {
  return new mapboxgl.Marker()
    .setLngLat([
      property.location.coordinates.longitude,
      property.location.coordinates.latitude,
    ])
    .setPopup(
      new mapboxgl.Popup({ offset: 25 }).setHTML(
        `
          <div class="marker-popup">
            <div class="marker-popup-image"></div>
            <div>
              <a href="/search/${property.id}" target="_blank" class="marker-popup-title">${property.name}</a>
              <p class="marker-popup-price">
                $${property.pricePerMonth}
                <span class="marker-popup-price-unit"> / month</span>
              </p>
            </div>
          </div>
        `,
      ),
    )
    .addTo(map);
};

const Map = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const filters = useAppSelector((state) => state.global.filters);

  const {
    data: properties,
    isLoading,
    isError,
  } = useGetPropertiesQuery(filters);

  useEffect(() => {
    if (!properties || isError || isLoading) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current!,
      style: "mapbox://styles/vgriza/cmg2kt8us004t01qu5plnbh09",
      center:
        Array.isArray(filters.coordinates) && filters.coordinates.length === 2
          ? filters.coordinates
          : [-74.5, 40],
      zoom: 9,
    });

    properties.forEach((property) => {
      const marker = createPropertyMarkers(property, map);
      const markerElement = marker.getElement();
      const path = markerElement.querySelector("path[fill='#3FB1CE']");
      if (path) path.setAttribute("fill", "#000000");
    });

    const resizeMap = () => {
      setTimeout(() => {
        map.resize();
      }, 700);
    };

    resizeMap();

    return () => {
      map.remove();
    };
  }, [isLoading, isError, properties, filters.coordinates]);

  if (isLoading) {
    return <div>Loading map...</div>;
  }

  if (isError || !properties) {
    return <div>Error loading map data.</div>;
  }

  return (
    <div className="basis-5/12 grow relative rounded-xl">
      <div
        className="map-container rounded-xl"
        ref={mapContainerRef}
        style={{
          height: "100%",
          width: "100%",
        }}
      />
    </div>
  );
};

export { Map };
