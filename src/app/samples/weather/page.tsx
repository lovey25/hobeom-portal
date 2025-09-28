"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface WeatherData {
  location: string;
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
  icon: string;
}

export default function WeatherPage() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState("서울");

  // 실제로는 API를 사용하지만, 여기서는 샘플 데이터를 생성
  const generateSampleWeather = (location: string): WeatherData => {
    const conditions = [
      { description: "맑음", icon: "☀️", temp: 22 + Math.random() * 10 },
      { description: "흐림", icon: "☁️", temp: 18 + Math.random() * 8 },
      { description: "비", icon: "🌧️", temp: 15 + Math.random() * 8 },
      { description: "눈", icon: "❄️", temp: -2 + Math.random() * 5 },
    ];

    const condition = conditions[Math.floor(Math.random() * conditions.length)];

    return {
      location,
      temperature: Math.round(condition.temp),
      description: condition.description,
      humidity: Math.round(40 + Math.random() * 40),
      windSpeed: Math.round(Math.random() * 15),
      icon: condition.icon,
    };
  };

  const fetchWeather = async (loc: string) => {
    setLoading(true);

    // 실제 API 호출을 시뮬레이션하기 위한 지연
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const weatherData = generateSampleWeather(loc);
    setWeather(weatherData);
    setLoading(false);
  };

  useEffect(() => {
    fetchWeather(location);
  }, []);

  const handleLocationChange = (newLocation: string) => {
    setLocation(newLocation);
    fetchWeather(newLocation);
  };

  const cities = ["서울", "부산", "대구", "인천", "광주", "대전", "울산", "제주"];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">🌤️ 날씨</h1>
            <Link href="/" className="text-blue-600 hover:text-blue-800">
              ← 홈으로
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* City Selector */}
          <Card>
            <h2 className="text-lg font-semibold mb-4">도시 선택</h2>
            <div className="grid grid-cols-4 gap-2">
              {cities.map((city) => (
                <Button
                  key={city}
                  variant={location === city ? "primary" : "outline"}
                  size="sm"
                  onClick={() => handleLocationChange(city)}
                  disabled={loading}
                >
                  {city}
                </Button>
              ))}
            </div>
          </Card>

          {/* Weather Display */}
          {loading ? (
            <Card className="text-center">
              <div className="py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">날씨 정보를 가져오는 중...</p>
              </div>
            </Card>
          ) : weather ? (
            <Card>
              <div className="text-center space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{weather.location}</h2>
                  <div className="text-6xl mb-4">{weather.icon}</div>
                  <div className="text-4xl font-bold text-blue-600 mb-2">{weather.temperature}°C</div>
                  <div className="text-lg text-gray-600">{weather.description}</div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-6 border-t">
                  <div className="text-center">
                    <div className="text-2xl mb-2">💧</div>
                    <div className="text-sm text-gray-600">습도</div>
                    <div className="text-lg font-semibold">{weather.humidity}%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-2">💨</div>
                    <div className="text-sm text-gray-600">풍속</div>
                    <div className="text-lg font-semibold">{weather.windSpeed} m/s</div>
                  </div>
                </div>
              </div>
            </Card>
          ) : null}

          {/* Info Card */}
          <Card className="bg-blue-50">
            <div className="text-center">
              <h3 className="font-semibold text-blue-900 mb-2">💡 정보</h3>
              <p className="text-blue-700 text-sm">
                이것은 샘플 날씨 앱입니다. 실제 날씨 데이터는 OpenWeatherMap 등의 API를 사용하여 구현할 수 있습니다.
              </p>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
