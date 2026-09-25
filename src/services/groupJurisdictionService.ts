import { Centre, SoulWinnerProfile } from '../types';

export interface GroupJurisdiction {
  key: string;
  name: string;
  pastorName: string;
  pastorPhone: string;
  pastorEmail: string;
  subGroups: string[];
  defaultCentreId: string;
  description: string;
}

export const GROUP_JURISDICTIONS: GroupJurisdiction[] = [
  {
    key: 'kubwa',
    name: 'Kubwa Group',
    pastorName: '',
    pastorPhone: '',
    pastorEmail: '',
    subGroups: ['Kubwa 1 Group', 'Kubwa 2 Sub-Group'],
    defaultCentreId: 'cnt-kb1-1',
    description: 'Oversees 17 assemblies across Kubwa 1 & Kubwa 2 (Bwari Area Council)',
  },
  {
    key: 'wuye',
    name: 'Wuye Group',
    pastorName: '',
    pastorPhone: '',
    pastorEmail: '',
    subGroups: ['Wuye Sub-Group 1', 'Wuye Sub-Group 2'],
    defaultCentreId: 'cnt-wuye1-1',
    description: 'Oversees 8 assemblies across Wuye Sub-Group 1 & 2 (AMAC)',
  },
  {
    key: 'zonal_church',
    name: 'Zonal Church Service 1 & Central Group',
    pastorName: '',
    pastorPhone: '',
    pastorEmail: '',
    subGroups: ['Zonal Church Group'],
    defaultCentreId: 'cnt-durumi-01',
    description: 'Oversees CE Zonal Church Service 1, Service 2 & Central Hub (Durumi Central)',
  },
  {
    key: 'gwarinpa',
    name: 'Gwarinpa Group',
    pastorName: '',
    pastorPhone: '',
    pastorEmail: '',
    subGroups: ['Gwarinpa Group'],
    defaultCentreId: 'cnt-gwr-1',
    description: 'Oversees 6 assemblies across Gwarinpa Estate & surroundings',
  },
  {
    key: 'bwari',
    name: 'Bwari Group',
    pastorName: '',
    pastorPhone: '',
    pastorEmail: '',
    subGroups: ['Bwari Group'],
    defaultCentreId: 'cnt-bwr-1',
    description: 'Oversees 8 assemblies across Bwari Central, Kuchiko, Piawe & Peyi',
  },
  {
    key: 'gwagwalada',
    name: 'Gwagwalada Group',
    pastorName: '',
    pastorPhone: '',
    pastorEmail: '',
    subGroups: ['Gwagwalada 1 Group', 'Gwagwalada 2 Group'],
    defaultCentreId: 'cnt-gwg1-1',
    description: 'Oversees 11 assemblies across Gwagwalada 1 & 2 Groups and Kwali',
  },
  {
    key: 'kuje',
    name: 'Kuje Group',
    pastorName: '',
    pastorPhone: '',
    pastorEmail: '',
    subGroups: ['Kuje Group'],
    defaultCentreId: 'cnt-kuje-1',
    description: 'Oversees 9 assemblies across Kuje Central, Pegi & Iddo Sarki',
  },
  {
    key: 'lokogoma',
    name: 'Lokogoma Group',
    pastorName: '',
    pastorPhone: '',
    pastorEmail: '',
    subGroups: ['Lokogoma Group'],
    defaultCentreId: 'cnt-lkg-1',
    description: 'Oversees 11 assemblies across Lokogoma, Kabusa, Apo & Durumi',
  },
  {
    key: 'karmo',
    name: 'Karmo Group',
    pastorName: '',
    pastorPhone: '',
    pastorEmail: '',
    subGroups: ['Karmo Group'],
    defaultCentreId: 'cnt-karmo-1',
    description: 'Oversees 4 assemblies across Karmo, Dape & Kagini',
  },
  {
    key: 'airport_road',
    name: 'Airport Road Sub-Group',
    pastorName: '',
    pastorPhone: '',
    pastorEmail: '',
    subGroups: ['Airport Road Sub-Group'],
    defaultCentreId: 'cnt-arp-1',
    description: 'Oversees 4 assemblies along Airport Road & Lugbe corridor',
  },
  {
    key: 'new_horizon',
    name: 'New Horizon Group',
    pastorName: '',
    pastorPhone: '',
    pastorEmail: '',
    subGroups: ['New Horizon Group'],
    defaultCentreId: 'cnt-nh-1',
    description: 'Oversees 5 assemblies across Ushafa & Dutse',
  },
  {
    key: 'dutse_makaranta',
    name: 'Dutse Makaranta Sub-Group',
    pastorName: '',
    pastorPhone: '',
    pastorEmail: '',
    subGroups: ['Dutse Makaranta Sub-Group'],
    defaultCentreId: 'cnt-dts-1',
    description: 'Oversees 5 assemblies in Dutse Makaranta & Garki',
  },
  {
    key: 'fruitful_vine',
    name: 'Fruitful Vine Sub-Group',
    pastorName: '',
    pastorPhone: '',
    pastorEmail: '',
    subGroups: ['Fruitful Vine Sub-Group'],
    defaultCentreId: 'cnt-fv-1',
    description: 'Oversees 3 assemblies across Jabi, Jahi & Kado',
  },
  {
    key: 'deidei',
    name: 'Dei Dei Group',
    pastorName: '',
    pastorPhone: '',
    pastorEmail: '',
    subGroups: ['Dei Dei Group'],
    defaultCentreId: 'cnt-dei-1',
    description: 'Oversees CE Deidei 2 Main Auditorium',
  },
  {
    key: 'byazhin',
    name: 'Byazhin Church',
    pastorName: '',
    pastorPhone: '',
    pastorEmail: '',
    subGroups: ['Byazhin Church'],
    defaultCentreId: 'cnt-byz-1',
    description: 'Oversees CE Byazhin Church',
  },
  {
    key: 'wealthy_place',
    name: 'CE Wealthy Place',
    pastorName: '',
    pastorPhone: '',
    pastorEmail: '',
    subGroups: ['CE Wealthy Place'],
    defaultCentreId: 'cnt-wp-1',
    description: 'Oversees CE Wealthy Place Maitama Extension',
  },
  {
    key: 'city_church',
    name: 'CE City Church',
    pastorName: '',
    pastorPhone: '',
    pastorEmail: '',
    subGroups: ['CE City Church'],
    defaultCentreId: 'cnt-cc-1',
    description: 'Oversees CE City Church Central Area',
  },
  {
    key: 'teens_church',
    name: 'Teens Church Group',
    pastorName: '',
    pastorPhone: '',
    pastorEmail: '',
    subGroups: ['Teens Church Group'],
    defaultCentreId: 'cnt-tc-1',
    description: 'Oversees CEAZ1 Zonal Youth & Teens Church',
  },
];

/**
 * Resolves which GroupJurisdiction applies to a given profile or group string
 */
export function resolveGroupJurisdiction(
  profileOrGroup: SoulWinnerProfile | string | null | undefined,
  centres: Centre[]
): GroupJurisdiction {
  let target = '';

  if (typeof profileOrGroup === 'string') {
    target = profileOrGroup;
  } else if (profileOrGroup) {
    if (profileOrGroup.assignedGroup) {
      target = profileOrGroup.assignedGroup;
    } else if (profileOrGroup.churchCentreId) {
      const c = centres.find(cen => cen.id === profileOrGroup.churchCentreId);
      if (c && c.groupName) {
        target = c.groupName;
      }
    }
    if (!target && profileOrGroup.churchName) {
      target = profileOrGroup.churchName;
    }
  }

  const cleanTarget = (target || '').toLowerCase().trim();

  // Try exact key or name match
  for (const j of GROUP_JURISDICTIONS) {
    if (j.key.toLowerCase() === cleanTarget || j.name.toLowerCase() === cleanTarget) {
      return j;
    }
    if (j.subGroups.some(sg => sg.toLowerCase() === cleanTarget)) {
      return j;
    }
  }

  // Try substring matching
  if (cleanTarget.includes('kubwa')) {
    return GROUP_JURISDICTIONS.find(j => j.key === 'kubwa')!;
  }
  if (cleanTarget.includes('wuye')) {
    return GROUP_JURISDICTIONS.find(j => j.key === 'wuye')!;
  }
  if (cleanTarget.includes('zonal') || cleanTarget.includes('service 1') || cleanTarget.includes('durumi') || cleanTarget.includes('central hub')) {
    return GROUP_JURISDICTIONS.find(j => j.key === 'zonal_church')!;
  }
  if (cleanTarget.includes('gwarinpa')) {
    return GROUP_JURISDICTIONS.find(j => j.key === 'gwarinpa')!;
  }
  if (cleanTarget.includes('bwari')) {
    return GROUP_JURISDICTIONS.find(j => j.key === 'bwari')!;
  }
  if (cleanTarget.includes('gwagwalada')) {
    return GROUP_JURISDICTIONS.find(j => j.key === 'gwagwalada')!;
  }
  if (cleanTarget.includes('kuje')) {
    return GROUP_JURISDICTIONS.find(j => j.key === 'kuje')!;
  }
  if (cleanTarget.includes('lokogoma')) {
    return GROUP_JURISDICTIONS.find(j => j.key === 'lokogoma')!;
  }

  // Default to Kubwa Group if not determined
  return GROUP_JURISDICTIONS[0];
}

/**
 * Returns all centres that belong to a specific group jurisdiction
 */
export function getCentresForJurisdiction(
  jurisdiction: GroupJurisdiction,
  allCentres: Centre[]
): Centre[] {
  const allowedGroups = new Set(jurisdiction.subGroups.map(s => s.toLowerCase()));
  return allCentres.filter(c => c.groupName && allowedGroups.has(c.groupName.toLowerCase()));
}

/**
 * Checks if a centre belongs to a given jurisdiction
 */
export function isCentreInJurisdiction(
  centreId: string,
  jurisdiction: GroupJurisdiction,
  allCentres: Centre[]
): boolean {
  const c = allCentres.find(item => item.id === centreId);
  if (!c || !c.groupName) return false;
  const cGroup = c.groupName.toLowerCase();
  return jurisdiction.subGroups.some(sg => sg.toLowerCase() === cGroup);
}
