// Tipado para la búsqueda de especies (Species)
export interface GBIFSpecies {
  key: number;
  scientificName: string;
  kingdom?: string;
  family?: string;
  genus?: string;
  rank?: string;
}

export interface GBIFSearchResponse {
  results: GBIFSpecies[];
}

export interface GBIFCountry {
  iso2: string;
  title: string;
}

export interface GBIFRegion {
  name: string;
  count: number;
}

export interface Taxon {
  key: number;
  rank: string;
  canonicalName: string;
}
