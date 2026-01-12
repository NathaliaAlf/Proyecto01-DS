// Tipado para la búsqueda de especies (Species)
export interface GBIFSpecies {
  key: number;
  scientificName: string;
  kingdom?: string;
  family?: string;
  genus?: string;
  rank?: string;
  media?: GBIFMedia[];
}

export interface GBIFSearchResponse {
  results: GBIFSpecies[];
}

export interface GBIFMedia {
  type: string;
  format: string;
  identifier: string; // Aquí es donde viene la URL de la imagen
  license?: string;
}

