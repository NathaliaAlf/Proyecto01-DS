// services/gbifService.ts Este archivo es la única fuente de comunicación con GBIF

const BASE_URL = 'https://api.gbif.org/v1';

export type ImageItem = {
  id: string;
  imageUrl: string;
  scientificName: string;
  commonName?: string;
  taxonKey: number;
};

const TAXON_CONFIG: Record<string, { rank: string; value: string }> = {
  animalia: { rank: 'kingdomKey', value: '1' },
  fungi: { rank: 'kingdomKey', value: '5' },
  plantae: { rank: 'kingdomKey', value: '6' },
  mollusca: { rank: 'phylumKey', value: '52' },
  arthropoda: { rank: 'phylumKey', value: '54' },
  insecta: { rank: 'classKey', value: '216' },
  magnoliopsida: { rank: 'classKey', value: '220' },
  lepidoptera: { rank: 'orderKey', value: '797' },
  coleoptera: { rank: 'orderKey', value: '1470' },
  tracheophyta: { rank: 'phylumKey', value: '7707728' },
};

export const gbifService = {
/**
 * getTaxonGroupImages
 * -------------------
 * Obtiene imágenes representativas por grupo taxonómico
 * (Animalia, Fungi, Plantae, etc.)
 * 
 * Se usa para pantallas tipo "explorar" o "categorías".
 */
  getTaxonGroupImages: async (
    taxon: string,
    offset: number = 0
  ): Promise<ImageItem[]> => {
    try {
      const config = TAXON_CONFIG[taxon.toLowerCase()];
      if (!config) return [];

      const url = `${BASE_URL}/occurrence/search?${config.rank}=${config.value}&mediaType=StillImage&hasCoordinate=true&limit=50&offset=${offset}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!data.results) return [];

      const speciesMap = new Map<number, ImageItem>();

      for (const item of data.results) {
        if (
          item.media?.[0]?.identifier &&
          item.speciesKey &&
          !speciesMap.has(item.speciesKey)
        ) {
          speciesMap.set(item.speciesKey, {
            id: item.speciesKey.toString(),
            imageUrl: item.media[0].identifier,
            scientificName: item.scientificName,
            commonName: item.vernacularName,
            taxonKey: item.speciesKey,
          });
        }

        if (speciesMap.size >= 12) break;
      }

      return Array.from(speciesMap.values());
    } catch (error) {
      console.error('Error en getTaxonGroupImages:', error);
      return [];
    }
  },

/**
 * searchSpecies
 * -------------
 * Búsqueda básica en el endpoint /species/search
 * No garantiza imágenes, solo datos taxonómicos.
 */

  searchSpecies: async (query: string, filters: any = {}) => {
    let url = `${BASE_URL}/species/search?q=${encodeURIComponent(query)}&limit=20`;

    if (filters.rank) url += `&rank=${filters.rank}`;
    if (filters.status) url += `&status=${filters.status}`;
    if (filters.issue) url += `&issue=${filters.issue}`;
    if (filters.higherTaxonKey) url += `&higherTaxonKey=${filters.higherTaxonKey}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Error en búsqueda');
    }

    return await response.json();
  },

/**
 * searchSpeciesWithImages
 * ----------------------
 * Búsqueda de especies + llamada extra a occurrences
 * para traer al menos 1 imagen por especie.
 * 
 * (Más lenta, pero más completa)
 */

  searchSpeciesWithImages: async (query: string, filters: any = {}) => {
    try {
      const data = await gbifService.searchSpecies(query, filters);
      if (!data.results) return [];

      const resultsWithImages = await Promise.all(
        data.results.map(async (species: any) => {
          try {
            const occUrl = `${BASE_URL}/occurrence/search?taxonKey=${species.key}&mediaType=StillImage&limit=1`;
            const occRes = await fetch(occUrl);
            const occData = await occRes.json();

            return {
              ...species,
              imageUrl: occData.results?.[0]?.media?.[0]?.identifier || null,
              commonName:
                species.vernacularName || species.canonicalName || null,
            };
          } catch {
            return { ...species, imageUrl: null };
          }
        })
      );

      return resultsWithImages;
    } catch (error) {
      console.error('Error en searchSpeciesWithImages:', error);
      return [];
    }
  },

/**
 * searchOccurrencesByQuery
 * ------------------------
 * Función principal usada por SpeciesScreen.
 * 
 * Flujo:
 * 1. Construye URL base con query
 * 2. Agrega filtros dinámicamente
 * 3. Llama a /occurrence/search
 * 4. Filtra duplicados por speciesKey
 * 5. Devuelve máximo 20 especies únicas con imagen
 */

searchOccurrencesByQuery: async (
  query: string,
  offset: number = 0,
  filters: any = {}
): Promise<ImageItem[]> => {
  try {
    console.log("DATOS RECIBIDOS EN SERVICIO:", { query, filters });
    // 1. Iniciamos la URL base
    let url = `${BASE_URL}/occurrence/search?q=${encodeURIComponent(query)}&mediaType=StillImage&limit=50&offset=${offset}`;

    // 2. Agregamos filtros si existen
    if (filters.rank) url += `&rank=${filters.rank}`;
    
    // Filtro dinámico de Taxón (Animalia, Insecta, etc.)
    if (filters.taxonType && filters.higherTaxonKey) {
      url += `&${filters.taxonType}=${filters.higherTaxonKey}`;
    }

    // Filtros de Issues (pueden ser varios)
    if (filters.issue && filters.issue.length > 0) {
      filters.issue.forEach((i: string) => {
        url += `&issue=${i}`;
      });
    }

    // DEPURACIÓN 
    console.log("URL GENERADA:", url); 

    const response = await fetch(url);
    const data = await response.json();

    if (!data.results || data.results.length === 0) return [];

    const speciesMap = new Map<number, ImageItem>();
    for (const item of data.results) {
      if (item.speciesKey && item.media?.[0]?.identifier && !speciesMap.has(item.speciesKey)) {
        speciesMap.set(item.speciesKey, {
          id: item.speciesKey.toString(),
          imageUrl: item.media[0].identifier,
          scientificName: item.scientificName,
          commonName: item.vernacularName,
          taxonKey: item.speciesKey,
        });
      }
      if (speciesMap.size >= 20) break;
    }
    return Array.from(speciesMap.values());
  } catch (e) {
    console.error('Error en searchOccurrencesByQuery:', e);
    return [];
  }
},


  /**
   * Obtener Key de un taxon por nombre
   */
  getTaxonKey: async (taxonName: string): Promise<number | null> => {
    try {
      const url = `${BASE_URL}/species/match?name=${encodeURIComponent(
        taxonName
      )}`;
      console.log("🔍 URL FINAL ENVIADA A GBIF:", url);
      const response = await fetch(url);
      const data = await response.json();

      return data.usageKey || null;
    } catch {
      return null;
    }
  },
};
