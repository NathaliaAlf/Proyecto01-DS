// Tipado para la búsqueda de especies (Species)
export interface GBIFSpecies {
    key: number;
    scientificName: string;
    kingdom?: string;
    family?: string;
    genus?: string;
    rank?: string;
    media?: GBIFMedia[]; // From Version 1
}

export interface GBIFSearchResponse {
    results: GBIFSpecies[];
}

// From Version 1
export interface GBIFMedia {
    type: string;
    format: string;
    identifier: string; // Aquí es donde viene la URL de la imagen
    license?: string;
}

// From Version 2
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