export interface Service {
  id: string;
  categoryId: string;
  name: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  services: Service[];
}
