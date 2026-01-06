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

