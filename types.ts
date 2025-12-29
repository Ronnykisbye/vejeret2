
export interface WeatherForecastDay {
  date: string;
  dayName: string;
  tempHigh: number;
  tempLow: number;
  condition: string;
  icon?: string;
}

export interface CurrentWeather {
  city: string;
  temp: number;
  condition: string;
  humidity: number;
  windSpeed: string;
  lastUpdated: string;
  description: string;
}

export interface WeatherData {
  current: CurrentWeather;
  forecast: WeatherForecastDay[];
  sources: Array<{ title: string; uri: string }>;
  audioData?: string; // Base64 encoded PCM audio data
}

export type View = 'home' | 'detail';
