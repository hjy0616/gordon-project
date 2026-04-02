import type { CountryIndicators } from "@/types/macro-map";

/** API 실패 시 fallback + 금리 데이터 소스 (World Bank에 없는 지표) */
export const FALLBACK_COUNTRIES: CountryIndicators[] = [
  { iso_a3: "USA", name: "United States", name_ko: "미국", flag_emoji: "🇺🇸", gdp_growth: 2.5, interest_rate: 5.25, inflation: 3.2, gdp_nominal: 26950, unemployment: 3.7, debt_to_gdp: 123, current_account: -3.0 },
  { iso_a3: "CHN", name: "China", name_ko: "중국", flag_emoji: "🇨🇳", gdp_growth: 5.2, interest_rate: 3.45, inflation: 0.2, gdp_nominal: 17960, unemployment: 5.2, debt_to_gdp: 83, current_account: 1.5 },
  { iso_a3: "JPN", name: "Japan", name_ko: "일본", flag_emoji: "🇯🇵", gdp_growth: 1.9, interest_rate: 0.25, inflation: 3.3, gdp_nominal: 4230, unemployment: 2.6, debt_to_gdp: 264, current_account: 3.5 },
  { iso_a3: "DEU", name: "Germany", name_ko: "독일", flag_emoji: "🇩🇪", gdp_growth: -0.3, interest_rate: 4.50, inflation: 2.9, gdp_nominal: 4430, unemployment: 5.7, debt_to_gdp: 66, current_account: 6.0 },
  { iso_a3: "GBR", name: "United Kingdom", name_ko: "영국", flag_emoji: "🇬🇧", gdp_growth: 0.1, interest_rate: 5.25, inflation: 3.9, gdp_nominal: 3330, unemployment: 4.2, debt_to_gdp: 101, current_account: -3.1 },
  { iso_a3: "FRA", name: "France", name_ko: "프랑스", flag_emoji: "🇫🇷", gdp_growth: 0.7, interest_rate: 4.50, inflation: 2.3, gdp_nominal: 3050, unemployment: 7.3, debt_to_gdp: 112, current_account: -0.7 },
  { iso_a3: "IND", name: "India", name_ko: "인도", flag_emoji: "🇮🇳", gdp_growth: 7.8, interest_rate: 6.50, inflation: 5.7, gdp_nominal: 3730, unemployment: 7.1, debt_to_gdp: 83, current_account: -1.2 },
  { iso_a3: "BRA", name: "Brazil", name_ko: "브라질", flag_emoji: "🇧🇷", gdp_growth: 2.9, interest_rate: 11.75, inflation: 4.6, gdp_nominal: 2130, unemployment: 7.8, debt_to_gdp: 74, current_account: -1.3 },
  { iso_a3: "KOR", name: "South Korea", name_ko: "대한민국", flag_emoji: "🇰🇷", gdp_growth: 1.4, interest_rate: 3.50, inflation: 3.6, gdp_nominal: 1710, unemployment: 2.7, debt_to_gdp: 54, current_account: 1.9 },
  { iso_a3: "CAN", name: "Canada", name_ko: "캐나다", flag_emoji: "🇨🇦", gdp_growth: 1.1, interest_rate: 5.00, inflation: 3.1, gdp_nominal: 2140, unemployment: 5.8, debt_to_gdp: 107, current_account: -0.4 },
  { iso_a3: "AUS", name: "Australia", name_ko: "호주", flag_emoji: "🇦🇺", gdp_growth: 1.5, interest_rate: 4.35, inflation: 3.4, gdp_nominal: 1690, unemployment: 3.9, debt_to_gdp: 52, current_account: 1.3 },
  { iso_a3: "MEX", name: "Mexico", name_ko: "멕시코", flag_emoji: "🇲🇽", gdp_growth: 3.2, interest_rate: 11.25, inflation: 4.7, gdp_nominal: 1320, unemployment: 2.8, debt_to_gdp: 54, current_account: -0.3 },
  { iso_a3: "IDN", name: "Indonesia", name_ko: "인도네시아", flag_emoji: "🇮🇩", gdp_growth: 5.1, interest_rate: 6.00, inflation: 2.6, gdp_nominal: 1320, unemployment: 5.3, debt_to_gdp: 39, current_account: -0.1 },
  { iso_a3: "RUS", name: "Russia", name_ko: "러시아", flag_emoji: "🇷🇺", gdp_growth: 3.6, interest_rate: 16.00, inflation: 7.4, gdp_nominal: 1860, unemployment: 2.9, debt_to_gdp: 21, current_account: 2.5 },
  { iso_a3: "SAU", name: "Saudi Arabia", name_ko: "사우디아라비아", flag_emoji: "🇸🇦", gdp_growth: -0.8, interest_rate: 6.00, inflation: 1.6, gdp_nominal: 1060, unemployment: 4.9, debt_to_gdp: 27, current_account: 4.2 },
  { iso_a3: "TUR", name: "Turkey", name_ko: "튀르키예", flag_emoji: "🇹🇷", gdp_growth: 4.5, interest_rate: 42.50, inflation: 64.8, gdp_nominal: 1110, unemployment: 9.4, debt_to_gdp: 35, current_account: -4.0 },
  { iso_a3: "ZAF", name: "South Africa", name_ko: "남아프리카공화국", flag_emoji: "🇿🇦", gdp_growth: 0.6, interest_rate: 8.25, inflation: 5.1, gdp_nominal: 399, unemployment: 32.1, debt_to_gdp: 73, current_account: -0.7 },
  { iso_a3: "ARG", name: "Argentina", name_ko: "아르헨티나", flag_emoji: "🇦🇷", gdp_growth: -1.6, interest_rate: 40.00, inflation: 211.4, gdp_nominal: 632, unemployment: 6.2, debt_to_gdp: 90, current_account: -0.5 },
  { iso_a3: "THA", name: "Thailand", name_ko: "태국", flag_emoji: "🇹🇭", gdp_growth: 1.9, interest_rate: 2.50, inflation: 1.3, gdp_nominal: 515, unemployment: 1.1, debt_to_gdp: 62, current_account: 1.4 },
  { iso_a3: "EGY", name: "Egypt", name_ko: "이집트", flag_emoji: "🇪🇬", gdp_growth: 3.8, interest_rate: 27.25, inflation: 35.7, gdp_nominal: 395, unemployment: 7.1, debt_to_gdp: 92, current_account: -1.2 },
  { iso_a3: "VNM", name: "Vietnam", name_ko: "베트남", flag_emoji: "🇻🇳", gdp_growth: 6.5, interest_rate: 4.50, inflation: 3.5, gdp_nominal: 430, unemployment: 2.3, debt_to_gdp: 37, current_account: 5.0 },
  { iso_a3: "NGA", name: "Nigeria", name_ko: "나이지리아", flag_emoji: "🇳🇬", gdp_growth: 2.9, interest_rate: 18.75, inflation: 28.9, gdp_nominal: 363, unemployment: 5.0, debt_to_gdp: 39, current_account: 0.4 },
  { iso_a3: "POL", name: "Poland", name_ko: "폴란드", flag_emoji: "🇵🇱", gdp_growth: 0.2, interest_rate: 5.75, inflation: 3.7, gdp_nominal: 842, unemployment: 5.1, debt_to_gdp: 49, current_account: 1.0 },
  { iso_a3: "SWE", name: "Sweden", name_ko: "스웨덴", flag_emoji: "🇸🇪", gdp_growth: -0.1, interest_rate: 4.00, inflation: 2.3, gdp_nominal: 593, unemployment: 8.0, debt_to_gdp: 33, current_account: 5.6 },
  { iso_a3: "CHE", name: "Switzerland", name_ko: "스위스", flag_emoji: "🇨🇭", gdp_growth: 0.7, interest_rate: 1.75, inflation: 1.4, gdp_nominal: 884, unemployment: 4.0, debt_to_gdp: 38, current_account: 7.1 },
  { iso_a3: "NOR", name: "Norway", name_ko: "노르웨이", flag_emoji: "🇳🇴", gdp_growth: 1.1, interest_rate: 4.50, inflation: 3.9, gdp_nominal: 485, unemployment: 3.6, debt_to_gdp: 43, current_account: 14.0 },
  { iso_a3: "SGP", name: "Singapore", name_ko: "싱가포르", flag_emoji: "🇸🇬", gdp_growth: 1.1, interest_rate: 3.35, inflation: 3.5, gdp_nominal: 497, unemployment: 2.0, debt_to_gdp: 168, current_account: 19.8 },
  { iso_a3: "MYS", name: "Malaysia", name_ko: "말레이시아", flag_emoji: "🇲🇾", gdp_growth: 3.7, interest_rate: 3.00, inflation: 1.8, gdp_nominal: 410, unemployment: 3.4, debt_to_gdp: 66, current_account: 2.3 },
  { iso_a3: "PHL", name: "Philippines", name_ko: "필리핀", flag_emoji: "🇵🇭", gdp_growth: 5.6, interest_rate: 6.50, inflation: 4.1, gdp_nominal: 435, unemployment: 4.3, debt_to_gdp: 61, current_account: -2.6 },
  { iso_a3: "CHL", name: "Chile", name_ko: "칠레", flag_emoji: "🇨🇱", gdp_growth: 0.2, interest_rate: 8.25, inflation: 3.9, gdp_nominal: 335, unemployment: 8.5, debt_to_gdp: 38, current_account: -3.6 },
];

export const FALLBACK_COUNTRY_MAP = new Map(FALLBACK_COUNTRIES.map((c) => [c.iso_a3, c]));
