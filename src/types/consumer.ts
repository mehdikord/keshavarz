export interface GeoLocation {
  lat: number;
  lng: number;
}

export interface Land {
  id: string;
  userId: string;
  title: string;
  areaSqm: number;
  location: GeoLocation;
  description?: string;
  createdAt: string;
}
