/**
 * 한국 소아청소년 표준 성장도표 (2017, 질병관리청·대한소아과학회) 기반의
 * 시각화용 백분위 근사값. 의학적 진단 용도가 아닌 차트 참고선으로만 사용한다.
 *
 * 각 배열은 ageMonths 오름차순. age=0 ~ 144개월(0~12세).
 */

export type PercentileGroup = "male" | "female";

export interface PercentilePoint {
  ageMonths: number;
  p3: number;
  p50: number;
  p97: number;
}

export interface PercentileSet {
  height: PercentilePoint[];
  weight: PercentilePoint[];
}

export const PERCENTILES: Record<PercentileGroup, PercentileSet> = {
  male: {
    height: [
      { ageMonths: 0, p3: 46.3, p50: 49.9, p97: 53.4 },
      { ageMonths: 3, p3: 57.6, p50: 61.4, p97: 65.5 },
      { ageMonths: 6, p3: 63.3, p50: 67.6, p97: 71.9 },
      { ageMonths: 12, p3: 71.0, p50: 75.7, p97: 80.5 },
      { ageMonths: 18, p3: 76.9, p50: 82.3, p97: 87.7 },
      { ageMonths: 24, p3: 81.7, p50: 87.1, p97: 92.9 },
      { ageMonths: 36, p3: 88.7, p50: 95.2, p97: 102.1 },
      { ageMonths: 48, p3: 94.9, p50: 102.0, p97: 109.6 },
      { ageMonths: 60, p3: 100.7, p50: 108.4, p97: 116.6 },
      { ageMonths: 72, p3: 106.1, p50: 114.6, p97: 123.4 },
      { ageMonths: 84, p3: 111.2, p50: 120.6, p97: 130.0 },
      { ageMonths: 96, p3: 116.3, p50: 126.4, p97: 136.5 },
      { ageMonths: 108, p3: 121.4, p50: 132.2, p97: 143.0 },
      { ageMonths: 120, p3: 126.7, p50: 138.6, p97: 150.0 },
      { ageMonths: 132, p3: 132.5, p50: 145.8, p97: 158.0 },
      { ageMonths: 144, p3: 139.0, p50: 153.7, p97: 167.0 },
    ],
    weight: [
      { ageMonths: 0, p3: 2.5, p50: 3.3, p97: 4.4 },
      { ageMonths: 3, p3: 5.1, p50: 6.4, p97: 8.0 },
      { ageMonths: 6, p3: 6.4, p50: 7.9, p97: 9.7 },
      { ageMonths: 12, p3: 7.7, p50: 9.6, p97: 11.8 },
      { ageMonths: 18, p3: 8.8, p50: 10.9, p97: 13.5 },
      { ageMonths: 24, p3: 9.7, p50: 12.2, p97: 15.1 },
      { ageMonths: 36, p3: 11.3, p50: 14.3, p97: 18.0 },
      { ageMonths: 48, p3: 12.7, p50: 16.3, p97: 20.9 },
      { ageMonths: 60, p3: 14.1, p50: 18.3, p97: 24.2 },
      { ageMonths: 72, p3: 15.9, p50: 20.7, p97: 28.0 },
      { ageMonths: 84, p3: 17.5, p50: 23.0, p97: 31.7 },
      { ageMonths: 96, p3: 19.4, p50: 25.5, p97: 35.5 },
      { ageMonths: 108, p3: 21.5, p50: 28.4, p97: 39.7 },
      { ageMonths: 120, p3: 23.7, p50: 31.4, p97: 44.0 },
      { ageMonths: 132, p3: 26.0, p50: 35.0, p97: 49.5 },
      { ageMonths: 144, p3: 28.7, p50: 39.5, p97: 56.0 },
    ],
  },
  female: {
    height: [
      { ageMonths: 0, p3: 45.6, p50: 49.1, p97: 52.7 },
      { ageMonths: 3, p3: 55.6, p50: 59.8, p97: 64.0 },
      { ageMonths: 6, p3: 61.2, p50: 65.7, p97: 70.3 },
      { ageMonths: 12, p3: 68.9, p50: 74.0, p97: 79.2 },
      { ageMonths: 18, p3: 74.9, p50: 80.7, p97: 86.5 },
      { ageMonths: 24, p3: 79.6, p50: 85.7, p97: 91.9 },
      { ageMonths: 36, p3: 87.4, p50: 94.1, p97: 100.9 },
      { ageMonths: 48, p3: 93.9, p50: 101.4, p97: 109.0 },
      { ageMonths: 60, p3: 99.9, p50: 108.0, p97: 116.2 },
      { ageMonths: 72, p3: 105.0, p50: 114.0, p97: 123.0 },
      { ageMonths: 84, p3: 110.0, p50: 119.8, p97: 129.6 },
      { ageMonths: 96, p3: 115.0, p50: 125.6, p97: 136.2 },
      { ageMonths: 108, p3: 120.3, p50: 131.8, p97: 143.3 },
      { ageMonths: 120, p3: 126.4, p50: 138.6, p97: 150.8 },
      { ageMonths: 132, p3: 132.5, p50: 145.5, p97: 158.0 },
      { ageMonths: 144, p3: 138.0, p50: 151.4, p97: 164.5 },
    ],
    weight: [
      { ageMonths: 0, p3: 2.4, p50: 3.2, p97: 4.2 },
      { ageMonths: 3, p3: 4.6, p50: 5.8, p97: 7.5 },
      { ageMonths: 6, p3: 5.8, p50: 7.3, p97: 9.2 },
      { ageMonths: 12, p3: 7.0, p50: 8.9, p97: 11.0 },
      { ageMonths: 18, p3: 8.1, p50: 10.2, p97: 12.8 },
      { ageMonths: 24, p3: 9.0, p50: 11.5, p97: 14.6 },
      { ageMonths: 36, p3: 10.8, p50: 13.9, p97: 17.6 },
      { ageMonths: 48, p3: 12.3, p50: 15.9, p97: 20.4 },
      { ageMonths: 60, p3: 13.7, p50: 17.9, p97: 23.5 },
      { ageMonths: 72, p3: 15.2, p50: 20.1, p97: 27.0 },
      { ageMonths: 84, p3: 16.7, p50: 22.3, p97: 30.6 },
      { ageMonths: 96, p3: 18.3, p50: 24.7, p97: 34.7 },
      { ageMonths: 108, p3: 20.2, p50: 27.6, p97: 39.3 },
      { ageMonths: 120, p3: 22.7, p50: 31.1, p97: 44.3 },
      { ageMonths: 132, p3: 25.8, p50: 35.0, p97: 49.5 },
      { ageMonths: 144, p3: 29.0, p50: 39.2, p97: 54.5 },
    ],
  },
};

export function getPercentilesFor(gender: "M" | "F"): PercentileSet {
  return PERCENTILES[gender === "F" ? "female" : "male"];
}
