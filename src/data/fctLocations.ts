export type AreaCouncilCode =
  | 'AMAC'
  | 'BWARI'
  | 'GWAGWALADA'
  | 'KUJE'
  | 'KWALI'
  | 'ABAJI'
  | 'BWR'
  | 'GWG'
  | 'KUJ'
  | 'KWL'
  | 'ABJ';

export interface Locality {
  name: string;
  areaCouncil: AreaCouncilCode;
  kind: 'district' | 'town';
  phase?: 1 | 2 | 3 | 4 | 5;
}

export const AREA_COUNCILS: Record<AreaCouncilCode, { name: string; code: AreaCouncilCode }> = {
  AMAC: { name: 'Abuja Municipal Area Council', code: 'AMAC' },
  BWARI: { name: 'Bwari Area Council', code: 'BWARI' },
  GWAGWALADA: { name: 'Gwagwalada Area Council', code: 'GWAGWALADA' },
  KUJE: { name: 'Kuje Area Council', code: 'KUJE' },
  KWALI: { name: 'Kwali Area Council', code: 'KWALI' },
  ABAJI: { name: 'Abaji Area Council', code: 'ABAJI' },
  BWR: { name: 'Bwari Area Council', code: 'BWARI' },
  GWG: { name: 'Gwagwalada Area Council', code: 'GWAGWALADA' },
  KUJ: { name: 'Kuje Area Council', code: 'KUJE' },
  KWL: { name: 'Kwali Area Council', code: 'KWALI' },
  ABJ: { name: 'Abaji Area Council', code: 'ABAJI' },
};

const amacWards = [
  'City Centre',
  'Garki',
  'Wuse',
  'Kabusa',
  'Gwarinpa',
  'Jiwa',
  'Gui',
  'Karshi',
  'Orozo',
  'Karu',
  'Nyanya',
  'Gwagwa',
];

const bwariWards = [
  'Bwari Central',
  'Kuduru',
  'Ushafa',
  'Dutsen Alhaji',
  'Kubwa',
  'Byazhin',
  'Igu',
  'Kawu',
  'Shere',
  'Usuma',
];

const gwagwaladaWards = [
  'Gwagwalada Central',
  'Kutunku',
  'Staff Quarters',
  'Ibwa',
  'Dobi',
  'Paiko',
  'Tungan Maje',
  'Zuba',
  'Ikwa',
  'Gwako',
];

const kujeWards = [
  'Kuje Central',
  'Chibiri',
  'Gaube',
  'Kwaku',
  'Kabi',
  'Rubochi',
  'Gwargwada',
  'Gudun Karya',
  'Kujekwa',
  'Yenche',
];

const kwaliWards = [
  'Kwali Central',
  'Yangoji',
  'Pai',
  'Kilankwa',
  'Dafa',
  'Kundu',
  'Ashara',
  'Gumbo',
  'Wako',
  'Yebu',
];

const abajiWards = [
  'Abaji Central',
  'Abaji North East',
  'Abaji South East',
  'Agyana/Pandagi',
  'Rimba Ebagi',
  'Nuku',
  'Alu/Mamagi',
  'Yaba',
  'Gurdi',
  'Gawu',
];

export const WARDS: Record<AreaCouncilCode, string[]> = {
  AMAC: amacWards,
  BWARI: bwariWards,
  GWAGWALADA: gwagwaladaWards,
  KUJE: kujeWards,
  KWALI: kwaliWards,
  ABAJI: abajiWards,
  BWR: bwariWards,
  GWG: gwagwaladaWards,
  KUJ: kujeWards,
  KWL: kwaliWards,
  ABJ: abajiWards,
};

const amacDistrictsPhase1: string[] = [
  'Central Business District',
  'Central Area',
  'Three Arms Zone',
  'Asokoro',
  'Maitama',
  'Maitama II',
  'Garki I',
  'Garki II',
  'Guzape I',
  'Guzape II',
  'Wuse I',
  'Wuse II',
];

const amacDistrictsPhase2: string[] = [
  'Utako',
  'Jabi',
  'Mabushi',
  'Kado',
  'Jahi',
  'Katampe',
  'Katampe Extension',
  'Wuye',
  'Gudu',
  'Durumi',
  'Apo',
  'Apo-Dutse',
  'Gaduwa',
  'Kaura',
  'Duboyi',
  'Dakibiyu',
  'Kukwaba',
];

const amacDistrictsPhase3: string[] = [
  'Gwarinpa',
  'Life Camp',
  'Dape',
  'Kafe',
  'Karmo',
  'Lokogoma',
  'Galadimawa',
  'Dakwo',
  'Kabusa',
  'Nbora',
  'Wumba',
  'Wupa',
  'Pyakasa',
  'Bunkoro',
  'Okanje',
  'Saraji',
  'Idu Industrial',
];

const amacDistrictsPhase4: string[] = [
  'Idu',
  'Gwagwa',
  'Karsana',
  'Kagini',
  'Jaite',
  'Ketti',
  'Waru',
  'Sabo Gida',
  'Tasha',
  'Mamusa',
  'Sheretti',
  'Chafe',
];

const amacDistrictsPhase5: string[] = ['Lugbe', 'Kyami'];

const amacTowns: string[] = [
  'Nyanya',
  'Nyanya Gwandara',
  'Karu Site',
  'Kurudu',
  'Jikwoyi',
  'Orozo',
  'Karshi',
  'Kugbo',
  'Mpape',
  'Dei-Dei',
  'Jiwa',
  'Gui',
  'Chika',
  'Kuchigoro',
  'Piwoyi',
  'Sabon Lugbe',
  'Games Village',
  'Sun City',
  'Trademore',
  'Bazango',
  'Zhidu',
];

const bwariTowns: string[] = [
  'Bwari Town',
  'Kubwa',
  'Kubwa Phase 1',
  'Kubwa Phase 2',
  'Kubwa Phase 3',
  'Kubwa Phase 4',
  'FHA Kubwa',
  'Arab Contractors',
  'PW',
  'Gbazango',
  'Byazhin',
  'Byazhin Across',
  'Dutse-Alhaji',
  'Dutse Baupma',
  'Dawaki',
  'Ushafa',
  'Kuduru',
  'Igu',
  'Kawu',
  'Shere',
  'Usuma',
  'Zuma',
  'Kuchibuyi',
  'Sabon Gari (Bwari)',
  'Kurumin Daudu',
  'Gidan Baushe',
  'Gidan Pawa',
  'Barago',
  'Kasaru',
  'Zango',
  'Yaba (Bwari)',
];

const gwagwaladaTowns: string[] = [
  'Gwagwalada Town',
  'Gwagwalada Phase 1',
  'Gwagwalada Phase 2',
  'Gwagwalada Phase 3',
  'Kutunku',
  'Staff Quarters',
  'Zuba',
  'Tungan Maje',
  'Dobi',
  'Ibwa',
  'Ikwa',
  'Gwako',
  'Paikon Kore',
  'Giri',
  'Dagiri',
  'Anagada',
  'Passo',
  'University of Abuja',
];

const kujeTowns: string[] = [
  'Kuje Town',
  'Kuchiyako',
  'Chibiri',
  'Gaube',
  'Gwargwada',
  'Gudun Karya',
  'Kabi',
  'Kujekwa',
  'Kwaku',
  'Rubochi',
  'Yenche',
  'Pegi',
  'Kiyi',
  'Chukuku',
  'Damwa',
  'Shetuko',
];

const kwaliTowns: string[] = [
  'Kwali Town',
  'Yangoji',
  'Pai',
  'Kilankwa',
  'Dafa',
  'Kundu',
  'Ashara',
  'Gumbo',
  'Wako',
  'Yebu',
  'Sheda',
  'Kwaita',
  'Dangara',
];

const abajiTowns: string[] = [
  'Abaji Town',
  'Abaji North East',
  'Abaji South East',
  'Agyana',
  'Pandagi',
  'Rimba Ebagi',
  'Nuku',
  'Alu',
  'Mamagi',
  'Yaba (Abaji)',
  'Gurdi',
  'Gawu',
  'Manderegi',
  'Naharati',
  'Sabon Gari (Abaji)',
];

export const LOCALITIES: Locality[] = [
  ...amacDistrictsPhase1.map(name => ({ name, areaCouncil: 'AMAC' as AreaCouncilCode, kind: 'district' as const, phase: 1 as const })),
  ...amacDistrictsPhase2.map(name => ({ name, areaCouncil: 'AMAC' as AreaCouncilCode, kind: 'district' as const, phase: 2 as const })),
  ...amacDistrictsPhase3.map(name => ({ name, areaCouncil: 'AMAC' as AreaCouncilCode, kind: 'district' as const, phase: 3 as const })),
  ...amacDistrictsPhase4.map(name => ({ name, areaCouncil: 'AMAC' as AreaCouncilCode, kind: 'district' as const, phase: 4 as const })),
  ...amacDistrictsPhase5.map(name => ({ name, areaCouncil: 'AMAC' as AreaCouncilCode, kind: 'district' as const, phase: 5 as const })),
  ...amacTowns.map(name => ({ name, areaCouncil: 'AMAC' as AreaCouncilCode, kind: 'town' as const })),
  ...bwariTowns.map(name => ({ name, areaCouncil: 'BWARI' as AreaCouncilCode, kind: 'town' as const })),
  ...gwagwaladaTowns.map(name => ({ name, areaCouncil: 'GWAGWALADA' as AreaCouncilCode, kind: 'town' as const })),
  ...kujeTowns.map(name => ({ name, areaCouncil: 'KUJE' as AreaCouncilCode, kind: 'town' as const })),
  ...kwaliTowns.map(name => ({ name, areaCouncil: 'KWALI' as AreaCouncilCode, kind: 'town' as const })),
  ...abajiTowns.map(name => ({ name, areaCouncil: 'ABAJI' as AreaCouncilCode, kind: 'town' as const })),
];

export function localitiesFor(code: AreaCouncilCode): Locality[] {
  return LOCALITIES.filter(l => l.areaCouncil === code);
}

export function wardsFor(code: AreaCouncilCode): string[] {
  return WARDS[code] || [];
}

export function areaCouncilOf(localityName: string): AreaCouncilCode | undefined {
  const found = LOCALITIES.find(l => l.name.toLowerCase() === localityName.toLowerCase());
  return found?.areaCouncil;
}
