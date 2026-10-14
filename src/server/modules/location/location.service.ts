import { API_ERROR_CODES, ApiError } from "@/server/errors";
import {
  findActiveProvinceById,
  listActiveCitiesByProvinceId,
  listActiveProvinces,
} from "@/server/modules/location/location.repository";

export async function getProvinces() {
  const provinces = await listActiveProvinces();
  return provinces.map((province) => ({
    provinceId: province.id.toString(),
    name: province.name,
  }));
}

export async function getCitiesForProvince(provinceId: bigint) {
  const province = await findActiveProvinceById(provinceId);
  if (!province) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "استان یافت نشد.");
  }

  const cities = await listActiveCitiesByProvinceId(provinceId);
  return cities.map((city) => ({
    cityId: city.id.toString(),
    name: city.name,
  }));
}
