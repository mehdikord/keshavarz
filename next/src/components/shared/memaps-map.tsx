"use client";

import { useEffect, useRef } from "react";
import type { DivIcon, Map as LeafletMap, Marker, TileLayer } from "leaflet";

import { cn } from "@/lib/utils";
import { DEFAULT_MAP_OVERVIEW_ZOOM } from "@/lib/maps/defaults";
import {
  DEFAULT_MEMAPS_LAYER,
  MEMAPS_LAYERS,
  type MeMapsLayerId,
} from "@/lib/maps/memaps";
import type { GeoLocation } from "@/types";

interface MeMapsMapProps {
  center: GeoLocation;
  value?: GeoLocation | null;
  onChange?: (location: GeoLocation) => void;
  layer?: MeMapsLayerId;
  zoom?: number;
  interactive?: boolean;
  className?: string;
}

function normalizeLocation(lat: number, lng: number): GeoLocation {
  return {
    lat: Number(lat.toFixed(6)),
    lng: Number(lng.toFixed(6)),
  };
}

export function MeMapsMap({
  center,
  value,
  onChange,
  layer = DEFAULT_MEMAPS_LAYER,
  zoom = 16,
  interactive = true,
  className,
}: MeMapsMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const tileLayerRef = useRef<TileLayer | null>(null);
  const markerIconRef = useRef<DivIcon | null>(null);
  const initialCenterRef = useRef(value ?? center);
  const initialValueRef = useRef(value);
  const initialLayerRef = useRef(layer);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let disposed = false;

    void import("leaflet").then((leafletModule) => {
      if (disposed || !containerRef.current) return;

      const L = leafletModule.default;
      const initialCenter = initialCenterRef.current;
      const layerConfig = MEMAPS_LAYERS[initialLayerRef.current];
      const hasSavedLocation = Boolean(initialValueRef.current);
      const initialZoom = hasSavedLocation ? zoom : DEFAULT_MAP_OVERVIEW_ZOOM;
      const map = L.map(containerRef.current, {
        center: [initialCenter.lat, initialCenter.lng],
        zoom: initialZoom,
        zoomControl: false,
        attributionControl: true,
        dragging: interactive,
        scrollWheelZoom: interactive,
        doubleClickZoom: interactive,
        touchZoom: interactive,
        keyboard: interactive,
      });

      L.control.zoom({ position: "topright" }).addTo(map);

      const tileLayer = L.tileLayer(layerConfig.url, {
        attribution: layerConfig.attribution,
        maxZoom: layerConfig.maxZoom,
      }).addTo(map);

      const markerIcon = L.divIcon({
        className: "memaps-location-marker",
        html: '<span aria-hidden="true"></span>',
        iconSize: [32, 40],
        iconAnchor: [16, 40],
      });
      markerIconRef.current = markerIcon;

      const setMarker = (location: GeoLocation) => {
        if (markerRef.current) {
          markerRef.current.setLatLng([location.lat, location.lng]);
          return;
        }

        const marker = L.marker([location.lat, location.lng], {
          icon: markerIcon,
          draggable: interactive,
          keyboard: interactive,
          title: "موقعیت انتخاب‌شده",
        }).addTo(map);

        if (interactive) {
          marker.on("dragend", () => {
            const point = marker.getLatLng();
            onChangeRef.current?.(normalizeLocation(point.lat, point.lng));
          });
        }

        markerRef.current = marker;
      };

      if (initialValueRef.current) setMarker(initialValueRef.current);

      if (interactive) {
        map.on("click", (event) => {
          const location = normalizeLocation(event.latlng.lat, event.latlng.lng);
          setMarker(location);
          onChangeRef.current?.(location);
        });
      }

      mapRef.current = map;
      tileLayerRef.current = tileLayer;
      window.setTimeout(() => map.invalidateSize(), 0);
    });

    return () => {
      disposed = true;
      markerRef.current = null;
      markerIconRef.current = null;
      tileLayerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [interactive, zoom]);

  const centerLat = center.lat;
  const centerLng = center.lng;

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const location = value ?? { lat: centerLat, lng: centerLng };
    const targetZoom = value ? zoom : DEFAULT_MAP_OVERVIEW_ZOOM;
    map.setView([location.lat, location.lng], targetZoom, { animate: true });

    if (!value) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }

    if (markerRef.current) {
      markerRef.current.setLatLng([value.lat, value.lng]);
      return;
    }

    void import("leaflet").then((leafletModule) => {
      if (!mapRef.current || !markerIconRef.current) return;

      const marker = leafletModule.default.marker([value.lat, value.lng], {
        icon: markerIconRef.current,
        draggable: interactive,
        keyboard: interactive,
        title: "موقعیت انتخاب‌شده",
      }).addTo(mapRef.current);

      if (interactive) {
        marker.on("dragend", () => {
          const point = marker.getLatLng();
          onChangeRef.current?.(normalizeLocation(point.lat, point.lng));
        });
      }

      markerRef.current = marker;
    });
  }, [centerLat, centerLng, interactive, value, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    const currentTileLayer = tileLayerRef.current;
    if (!map || !currentTileLayer) return;

    void import("leaflet").then((leafletModule) => {
      if (!mapRef.current) return;
      currentTileLayer.remove();
      const config = MEMAPS_LAYERS[layer];
      tileLayerRef.current = leafletModule.default
        .tileLayer(config.url, {
          attribution: config.attribution,
          maxZoom: config.maxZoom,
        })
        .addTo(mapRef.current);
    });
  }, [layer]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "h-72 w-full overflow-hidden rounded-2xl bg-muted",
        !interactive && "pointer-events-none",
        className,
      )}
      aria-label={interactive ? "انتخاب موقعیت روی نقشه" : "نمایش موقعیت روی نقشه"}
    />
  );
}
