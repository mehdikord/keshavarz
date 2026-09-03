export function mapProvince(province: { id: bigint; name: string }) {
  return {
    provinceId: province.id.toString(),
    name: province.name,
  };
}

export function mapCity(city: { id: bigint; name: string }) {
  return {
    cityId: city.id.toString(),
    name: city.name,
  };
}
