export interface UserCity {
  cityId: string;
  name: string;
  provinceId: string;
}

export interface UserProvince {
  name: string;
  provinceId: string;
}

export interface User {
  id: string;
  phone: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
  province: UserProvince | null;
  city: UserCity | null;
}
