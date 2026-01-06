import { GBIFSearchResponse } from '@/services/gbifTypes';

const BASE_URL = 'https://api.gbif.org/v1';

export const gbifService = {
  searchSpecies: async (query: string): Promise<GBIFSearchResponse> => {
    const response = await fetch(`${BASE_URL}/species/search?q=${encodeURIComponent(query)}&limit=10`);
    if (!response.ok) throw new Error('Error al conectar con GBIF');
    return await response.json();
  }
};