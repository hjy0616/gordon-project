/** ISO A3 → ISO A2 mapping for flag emoji computation */
const A3_TO_A2: Record<string, string> = {
  AFG:"AF",AGO:"AO",ALB:"AL",ARE:"AE",ARG:"AR",ARM:"AM",AUS:"AU",AUT:"AT",AZE:"AZ",
  BDI:"BI",BEL:"BE",BEN:"BJ",BFA:"BF",BGD:"BD",BGR:"BG",BHS:"BS",BIH:"BA",BLR:"BY",
  BLZ:"BZ",BOL:"BO",BRA:"BR",BRN:"BN",BTN:"BT",BWA:"BW",CAF:"CF",CAN:"CA",CHE:"CH",
  CHL:"CL",CHN:"CN",CIV:"CI",CMR:"CM",COD:"CD",COG:"CG",COL:"CO",CRI:"CR",CUB:"CU",
  CYP:"CY",CZE:"CZ",DEU:"DE",DJI:"DJ",DNK:"DK",DOM:"DO",DZA:"DZ",ECU:"EC",EGY:"EG",
  ERI:"ER",ESH:"EH",ESP:"ES",EST:"EE",ETH:"ET",FIN:"FI",FJI:"FJ",FRA:"FR",GAB:"GA",
  GBR:"GB",GEO:"GE",GHA:"GH",GIN:"GN",GMB:"GM",GNB:"GW",GNQ:"GQ",GRC:"GR",GRL:"GL",
  GTM:"GT",GUY:"GY",HND:"HN",HRV:"HR",HTI:"HT",HUN:"HU",IDN:"ID",IND:"IN",IRL:"IE",
  IRN:"IR",IRQ:"IQ",ISL:"IS",ISR:"IL",ITA:"IT",JAM:"JM",JOR:"JO",JPN:"JP",KAZ:"KZ",
  KEN:"KE",KGZ:"KG",KHM:"KH",KOR:"KR",KWT:"KW",LAO:"LA",LBN:"LB",LBR:"LR",LBY:"LY",
  LKA:"LK",LSO:"LS",LTU:"LT",LUX:"LU",LVA:"LV",MAR:"MA",MDA:"MD",MDG:"MG",MEX:"MX",
  MKD:"MK",MLI:"ML",MMR:"MM",MNE:"ME",MNG:"MN",MOZ:"MZ",MRT:"MR",MWI:"MW",MYS:"MY",
  NAM:"NA",NCL:"NC",NER:"NE",NGA:"NG",NIC:"NI",NLD:"NL",NOR:"NO",NPL:"NP",NZL:"NZ",
  OMN:"OM",PAK:"PK",PAN:"PA",PER:"PE",PHL:"PH",PNG:"PG",POL:"PL",PRI:"PR",PRK:"KP",
  PRT:"PT",PRY:"PY",PSE:"PS",QAT:"QA",ROU:"RO",RUS:"RU",RWA:"RW",SAU:"SA",SDN:"SD",
  SEN:"SN",SLB:"SB",SLE:"SL",SLV:"SV",SOM:"SO",SRB:"RS",SSD:"SS",SUR:"SR",SVK:"SK",
  SVN:"SI",SWE:"SE",SWZ:"SZ",SYR:"SY",TCD:"TD",TGO:"TG",THA:"TH",TJK:"TJ",TKM:"TM",
  TLS:"TL",TTO:"TT",TUN:"TN",TUR:"TR",TWN:"TW",TZA:"TZ",UGA:"UG",UKR:"UA",URY:"UY",
  USA:"US",UZB:"UZ",VEN:"VE",VNM:"VN",VUT:"VU",YEM:"YE",ZAF:"ZA",ZMB:"ZM",ZWE:"ZW",
};

/** Korean names for countries (covers all 171 GeoJSON countries) */
const KOREAN_NAMES: Record<string, string> = {
  AFG:"아프가니스탄",AGO:"앙골라",ALB:"알바니아",ARE:"아랍에미리트",ARG:"아르헨티나",ARM:"아르메니아",
  AUS:"호주",AUT:"오스트리아",AZE:"아제르바이잔",BDI:"부룬디",BEL:"벨기에",BEN:"베냉",BFA:"부르키나파소",
  BGD:"방글라데시",BGR:"불가리아",BHS:"바하마",BIH:"보스니아 헤르체고비나",BLR:"벨라루스",BLZ:"벨리즈",
  BOL:"볼리비아",BRA:"브라질",BRN:"브루나이",BTN:"부탄",BWA:"보츠와나",CAF:"중앙아프리카공화국",
  CAN:"캐나다",CHE:"스위스",CHL:"칠레",CHN:"중국",CIV:"코트디부아르",CMR:"카메룬",COD:"콩고민주공화국",
  COG:"콩고공화국",COL:"콜롬비아",CRI:"코스타리카",CUB:"쿠바",CYP:"키프로스",CZE:"체코",DEU:"독일",
  DJI:"지부티",DNK:"덴마크",DOM:"도미니카공화국",DZA:"알제리",ECU:"에콰도르",EGY:"이집트",ERI:"에리트레아",
  ESH:"서사하라",ESP:"스페인",EST:"에스토니아",ETH:"에티오피아",FIN:"핀란드",FJI:"피지",FRA:"프랑스",
  GAB:"가봉",GBR:"영국",GEO:"조지아",GHA:"가나",GIN:"기니",GMB:"감비아",GNB:"기니비사우",
  GNQ:"적도기니",GRC:"그리스",GRL:"그린란드",GTM:"과테말라",GUY:"가이아나",HND:"온두라스",HRV:"크로아티아",
  HTI:"아이티",HUN:"헝가리",IDN:"인도네시아",IND:"인도",IRL:"아일랜드",IRN:"이란",IRQ:"이라크",
  ISL:"아이슬란드",ISR:"이스라엘",ITA:"이탈리아",JAM:"자메이카",JOR:"요르단",JPN:"일본",KAZ:"카자흐스탄",
  KEN:"케냐",KGZ:"키르기스스탄",KHM:"캄보디아",KOR:"대한민국",KWT:"쿠웨이트",LAO:"라오스",LBN:"레바논",
  LBR:"라이베리아",LBY:"리비아",LKA:"스리랑카",LSO:"레소토",LTU:"리투아니아",LUX:"룩셈부르크",
  LVA:"라트비아",MAR:"모로코",MDA:"몰도바",MDG:"마다가스카르",MEX:"멕시코",MKD:"북마케도니아",
  MLI:"말리",MMR:"미얀마",MNE:"몬테네그로",MNG:"몽골",MOZ:"모잠비크",MRT:"모리타니",MWI:"말라위",
  MYS:"말레이시아",NAM:"나미비아",NCL:"뉴칼레도니아",NER:"니제르",NGA:"나이지리아",NIC:"니카라과",
  NLD:"네덜란드",NOR:"노르웨이",NPL:"네팔",NZL:"뉴질랜드",OMN:"오만",PAK:"파키스탄",PAN:"파나마",
  PER:"페루",PHL:"필리핀",PNG:"파푸아뉴기니",POL:"폴란드",PRI:"푸에르토리코",PRK:"북한",PRT:"포르투갈",
  PRY:"파라과이",PSE:"팔레스타인",QAT:"카타르",ROU:"루마니아",RUS:"러시아",RWA:"르완다",
  SAU:"사우디아라비아",SDN:"수단",SEN:"세네갈",SLB:"솔로몬제도",SLE:"시에라리온",SLV:"엘살바도르",
  SOM:"소말리아",SRB:"세르비아",SSD:"남수단",SUR:"수리남",SVK:"슬로바키아",SVN:"슬로베니아",
  SWE:"스웨덴",SWZ:"에스와티니",SYR:"시리아",TCD:"차드",TGO:"토고",THA:"태국",TJK:"타지키스탄",
  TKM:"투르크메니스탄",TLS:"동티모르",TTO:"트리니다드토바고",TUN:"튀니지",TUR:"튀르키예",TWN:"대만",
  TZA:"탄자니아",UGA:"우간다",UKR:"우크라이나",URY:"우루과이",USA:"미국",UZB:"우즈베키스탄",
  VEN:"베네수엘라",VNM:"베트남",VUT:"바누아투",YEM:"예멘",ZAF:"남아프리카공화국",ZMB:"잠비아",ZWE:"짐바브웨",
};

/** Get flag emoji from ISO A3 code */
export function getFlagEmoji(isoA3: string): string {
  const a2 = A3_TO_A2[isoA3];
  if (!a2) return "🏳️";
  return String.fromCodePoint(
    ...a2.split("").map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
  );
}

/** Get Korean name for a country, with English fallback */
export function getCountryNameKo(isoA3: string, fallback?: string): string {
  return KOREAN_NAMES[isoA3] ?? fallback ?? isoA3;
}

export interface CountryBasicInfo {
  iso_a3: string;
  name: string;
  name_ko: string;
  flag_emoji: string;
}

/** Get basic info for any country */
export function getCountryInfo(isoA3: string, englishName?: string): CountryBasicInfo {
  return {
    iso_a3: isoA3,
    name: englishName ?? isoA3,
    name_ko: getCountryNameKo(isoA3, englishName),
    flag_emoji: getFlagEmoji(isoA3),
  };
}
