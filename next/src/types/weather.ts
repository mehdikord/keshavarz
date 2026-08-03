export interface WeatherCondition {
  text: string;
  icon: string;
  code: number;
}

export interface WeatherLocation {
  name: string;
  region: string;
  country: string;
  lat: number;
  lon: number;
  localtime: string;
}

export interface WeatherCurrent {
  temp_c: number;
  feelslike_c: number;
  humidity: number;
  wind_kph: number;
  wind_dir: string;
  uv: number;
  is_day: number;
  condition: WeatherCondition;
  last_updated: string;
}

export interface WeatherForecastDay {
  date: string;
  date_epoch: number;
  day: {
    maxtemp_c: number;
    mintemp_c: number;
    avgtemp_c: number;
    condition: WeatherCondition;
    daily_chance_of_rain: number;
    maxwind_kph: number;
    avghumidity: number;
  };
  astro: {
    sunrise: string;
    sunset: string;
  };
}

export interface WeatherForecastResponse {
  location: WeatherLocation;
  current: WeatherCurrent;
  forecast: {
    forecastday: WeatherForecastDay[];
  };
}

export interface WeatherQuery {
  lat?: number;
  lng?: number;
  q?: string;
}
