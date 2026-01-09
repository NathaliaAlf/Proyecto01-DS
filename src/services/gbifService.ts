// services/gbifService.ts
const BASE_URL = 'https://api.gbif.org/v1';

export type ImageItem = {
  id: string;
  imageUrl: string;
  scientificName: string;
  commonName?: string;
  taxonKey: number;
  width?: number;
  height?: number;
};

// Map taxa to their correct GBIF rank and key
const TAXON_CONFIG: Record<string, { rank: string, value: string }> = {
  'animalia': { rank: 'kingdomKey', value: '1' },
  'fungi': { rank: 'kingdomKey', value: '5' },
  'plantae': { rank: 'kingdomKey', value: '6' },
  'mollusca': { rank: 'phylumKey', value: '52' },
  'arthropoda': { rank: 'phylumKey', value: '54' },
  'insecta': { rank: 'classKey', value: '216' },
  'magnoliopsida': { rank: 'classKey', value: '220' },
  'lepidoptera': { rank: 'orderKey', value: '797' },
  'coleoptera': { rank: 'orderKey', value: '1470' },
  'tracheophyta': { rank: 'phylumKey', value: '7707728' },
};

/**
 * Strategy: Get species list first, then fetch one good image per species
 * This ensures we show UNIQUE species, not duplicate occurrences
 */
export async function getTaxonGroupImages(taxon: string, offset: number = 0): Promise<ImageItem[]> {
  try {
    const config = TAXON_CONFIG[taxon.toLowerCase()];
    
    if (!config) {
      console.warn(`Unknown taxon: ${taxon}`);
      return [];
    }

    console.log(`Fetching unique species for ${taxon}, offset: ${offset}...`);

    // Step 1: Get a list of species that have images in this taxon
    const speciesUrl = `${BASE_URL}/occurrence/search` +
      `?${config.rank}=${config.value}` +
      `&mediaType=StillImage` +
      `&hasCoordinate=true` +
      `&limit=100` + // Get more to find diverse species
      `&offset=${offset}` + // Pagination support
      `&year=2018,2024`; // Recent observations

    const response = await fetch(speciesUrl);
    
    if (!response.ok) {
      throw new Error(`GBIF API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      console.warn(`No results found for ${taxon}`);
      return [];
    }

    // Step 2: Extract unique species with their best image
    const speciesMap = new Map<number, ImageItem>();
    
    for (const occurrence of data.results) {
      // Must have: image, species key, and scientific name
      if (!occurrence.media?.[0]?.identifier || 
          !occurrence.speciesKey || 
          !occurrence.scientificName) {
        continue;
      }

      // Only add if we haven't seen this species yet
      if (!speciesMap.has(occurrence.speciesKey)) {
        const imageUrl = occurrence.media[0].identifier;
        
        // Filter out low quality or problematic images
        if (imageUrl.includes('inaturalist') || 
            imageUrl.includes('flickr') ||
            imageUrl.includes('wikimedia')) {
          
          speciesMap.set(occurrence.speciesKey, {
            id: `${occurrence.speciesKey}`,
            imageUrl: imageUrl,
            scientificName: occurrence.scientificName,
            commonName: occurrence.vernacularName,
            taxonKey: occurrence.speciesKey
          });
        }
      }

      // Stop once we have enough unique species
      if (speciesMap.size >= 12) {
        break;
      }
    }

    const results = Array.from(speciesMap.values());
    console.log(`Found ${results.length} unique species for ${taxon}`);
    
    return results;

  } catch (error) {
    console.error(`Error getting images for ${taxon}:`, error);
    return [];
  }
}

/**
 * Alternative strategy: Search species endpoint first, then get images
 * More reliable but requires two API calls per taxon
 */
export async function getTaxonGroupImagesV2(taxon: string, offset: number = 0): Promise<ImageItem[]> {
  try {
    const config = TAXON_CONFIG[taxon.toLowerCase()];
    
    if (!config) {
      console.warn(`Unknown taxon: ${taxon}`);
      return [];
    }

    console.log(`Fetching species list for ${taxon}, offset: ${offset}...`);

    // Step 1: Get species that belong to this taxon
    const speciesUrl = `${BASE_URL}/species/search` +
      `?${config.rank}=${config.value}` +
      `&rank=SPECIES` +
      `&limit=20` +
      `&offset=${offset}`;

    const speciesResponse = await fetch(speciesUrl);
    
    if (!speciesResponse.ok) {
      throw new Error(`GBIF species search error: ${speciesResponse.status}`);
    }

    const speciesData = await speciesResponse.json();

    if (!speciesData.results || speciesData.results.length === 0) {
      console.warn(`No species found for ${taxon}`);
      return [];
    }

    // Step 2: For each species, try to get an image
    const imagePromises = speciesData.results.slice(0, 12).map(async (species: any) => {
      try {
        const occurrenceUrl = `${BASE_URL}/occurrence/search` +
          `?taxonKey=${species.key}` +
          `&mediaType=StillImage` +
          `&hasCoordinate=true` +
          `&limit=1`;

        const occResponse = await fetch(occurrenceUrl);
        const occData = await occResponse.json();

        if (occData.results?.[0]?.media?.[0]?.identifier) {
          return {
            id: `${species.key}`,
            imageUrl: occData.results[0].media[0].identifier,
            scientificName: species.scientificName || species.canonicalName,
            commonName: species.vernacularName,
            taxonKey: species.key
          };
        }
        
        return null;
      } catch (error) {
        console.error(`Failed to get image for species ${species.key}:`, error);
        return null;
      }
    });

    const results = (await Promise.all(imagePromises)).filter(Boolean) as ImageItem[];
    console.log(`Found ${results.length} species with images for ${taxon}`);
    
    return results;

  } catch (error) {
    console.error(`Error in getTaxonGroupImagesV2 for ${taxon}:`, error);
    return [];
  }
}

/**
 * Get taxon keys for reference - useful for debugging
 */
export async function getTaxonKey(taxonName: string): Promise<number | null> {
  try {
    const url = `${BASE_URL}/species/match?name=${encodeURIComponent(taxonName)}`;
    const response = await fetch(url);
    
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.usageKey || null;
  } catch (error) {
    console.error(`Error getting taxon key for ${taxonName}:`, error);
    return null;
  }
}

// Keep for backward compatibility
export async function getOccurrenceImages(taxon: string): Promise<ImageItem[]> {
  return await getTaxonGroupImages(taxon);
}

export const gbifService = {
  searchSpecies: async (query: string) => {
    const response = await fetch(`${BASE_URL}/species/search?q=${encodeURIComponent(query)}&limit=10`);
    if (!response.ok) throw new Error('Error connecting to GBIF');
    return await response.json();
  }
};