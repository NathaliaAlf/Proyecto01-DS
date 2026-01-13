// services/gbifService.ts
// This file is the single source of communication with GBIF

const BASE_URL = 'https://api.gbif.org/v1';

export type ImageItem = {
    id: string;
    imageUrl: string;
    scientificName: string;
    commonName?: string;
    taxonKey: number;
    // Included from V2 for compatibility
    width?: number;
    height?: number;
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
     * Gets representative images by taxonomic group (Animalia, Fungi, Plantae, etc.).
     * Used for "Explore" or "Category" screens.
     */
    getTaxonGroupImages: async (
        taxon: string,
        offset: number = 0
    ): Promise<ImageItem[]> => {
        try {
            const config = TAXON_CONFIG[taxon.toLowerCase()];
            if (!config) return [];

            // No date restriction, accepting any image source (Version 1 logic)
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
            console.error('Error in getTaxonGroupImages:', error);
            return [];
        }
    },

    /**
     * searchSpecies
     * -------------
     * Basic search in the /species/search endpoint.
     * Does not guarantee images, returns taxonomic data.
     */
    searchSpecies: async (query: string, filters: any = {}) => {
        let url = `${BASE_URL}/species/search?q=${encodeURIComponent(query)}&limit=20`;

        if (filters.rank) url += `&rank=${filters.rank}`;
        if (filters.status) url += `&status=${filters.status}`;
        if (filters.issue) url += `&issue=${filters.issue}`;
        if (filters.higherTaxonKey) url += `&higherTaxonKey=${filters.higherTaxonKey}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('Error in search');
        }

        return await response.json();
    },

    /**
     * searchSpeciesWithImages
     * -----------------------
     * Species search + extra call to occurrences to fetch at least 1 image per species.
     * (Slower, but more complete for UI display)
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
            console.error('Error in searchSpeciesWithImages:', error);
            return [];
        }
    },

    /**
     * searchOccurrencesByQuery
     * ------------------------
     * Main function used by SpeciesScreen.
     *
     * Flow:
     * 1. Build base URL with query
     * 2. Dynamically add filters
     * 3. Call /occurrence/search
     * 4. Filter duplicates by speciesKey
     * 5. Return max 20 unique species with images
     */
    searchOccurrencesByQuery: async (
        query: string,
        offset: number = 0,
        filters: any = {}
    ): Promise<ImageItem[]> => {
        try {
            console.log('DATA RECEIVED IN SERVICE:', { query, filters });
            // 1. Start base URL
            let url = `${BASE_URL}/occurrence/search?q=${encodeURIComponent(query)}&mediaType=StillImage&limit=50&offset=${offset}`;

            // 2. Add filters if they exist
            if (filters.rank) url += `&rank=${filters.rank}`;

            // Dynamic Taxon Filter (Animalia, Insecta, etc.)
            if (filters.taxonType && filters.higherTaxonKey) {
                url += `&${filters.taxonType}=${filters.higherTaxonKey}`;
            }

            // Issue Filters (can be multiple)
            if (filters.issue && filters.issue.length > 0) {
                filters.issue.forEach((i: string) => {
                    url += `&issue=${i}`;
                });
            }

            console.log('GENERATED URL:', url);

            const response = await fetch(url);
            const data = await response.json();

            if (!data.results || data.results.length === 0) return [];

            const speciesMap = new Map<number, ImageItem>();
            for (const item of data.results) {
                if (
                    item.speciesKey &&
                    item.media?.[0]?.identifier &&
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
                if (speciesMap.size >= 20) break;
            }
            return Array.from(speciesMap.values());
        } catch (e) {
            console.error('Error in searchOccurrencesByQuery:', e);
            return [];
        }
    },

    /**
     * Get Taxon Key by name
     */
    getTaxonKey: async (taxonName: string): Promise<number | null> => {
        try {
            const url = `${BASE_URL}/species/match?name=${encodeURIComponent(
                taxonName
            )}`;
            const response = await fetch(url);
            const data = await response.json();

            return data.usageKey || null;
        } catch {
            return null;
        }
    },

    // =================================================================
    // ADDED METHODS FROM VERSION 2 (Analytics & Details)
    // =================================================================

    /**
     * Get monthly occurrence statistics for a species.
     * Useful for seasonality charts.
     */
    getMonthlyOccurrences: async (
        speciesKey: number,
        countryCode?: string,
        stateProvince?: string
    ) => {
        let url = `${BASE_URL}/occurrence/search?taxonKey=${speciesKey}&facet=month&limit=0`;
        if (countryCode) {
            url += `&country=${countryCode}`;
        }
        if (stateProvince) {
            url += `&stateProvince=${encodeURIComponent(stateProvince)}`;
        }
        const response = await fetch(url);
        if (!response.ok) throw new Error('Error connecting to GBIF');
        return await response.json();
    },

    /**
     * Get verified locations grouped by country and region.
     */
    getVerifiedLocations: async (speciesKey: number) => {
        const url = `${BASE_URL}/occurrence/search?taxonKey=${speciesKey}&hasGeospatialIssue=false&hasCoordinate=true&limit=300`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Error fetching verified occurrences');
        const data = await response.json();

        const countries = new Map<string, { iso2: string; title: string }>();
        const regionsByCountry = new Map<string, Set<string>>();

        for (const occ of data.results) {
            if (occ.countryCode && occ.country) {
                if (!countries.has(occ.countryCode)) {
                    countries.set(occ.countryCode, {
                        iso2: occ.countryCode,
                        title: occ.country,
                    });
                }
            }

            if (occ.countryCode && occ.stateProvince) {
                if (!regionsByCountry.has(occ.countryCode)) {
                    regionsByCountry.set(occ.countryCode, new Set());
                }
                regionsByCountry.get(occ.countryCode)!.add(occ.stateProvince);
            }
        }

        return {
            countries: Array.from(countries.values()),
            regionsByCountry: regionsByCountry,
        };
    },

    /**
     * Get full taxonomic hierarchy (Parent -> Child -> Species).
     */
    getTaxonomicHierarchy: async (speciesKey: number) => {
        // 1. Get the parent hierarchy
        const parentsResponse = await fetch(
            `${BASE_URL}/species/${speciesKey}/parents`
        );
        if (!parentsResponse.ok)
            throw new Error('Error fetching taxonomic parents');
        const parents = await parentsResponse.json();

        // 2. Get the species' own data
        const speciesResponse = await fetch(`${BASE_URL}/species/${speciesKey}`);
        if (!speciesResponse.ok) throw new Error('Error fetching species details');
        const speciesData = await speciesResponse.json();

        // 3. Combine and return, filtering out unranked items if any
        const hierarchy = [...parents, speciesData].filter(
            (t) => t.rank && t.canonicalName
        );
        return hierarchy;
    },

    /**
     * Get a gallery of images for a specific species.
     */
    getSpeciesImages: async (
        speciesKey: number,
        limit: number = 5
    ): Promise<string[]> => {
        const url = `${BASE_URL}/occurrence/search?taxonKey=${speciesKey}&mediaType=StillImage&limit=${limit}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Error fetching species images');
        const data = await response.json();

        const images: string[] = [];
        if (data.results) {
            for (const occ of data.results) {
                if (occ.media && occ.media.length > 0) {
                    for (const mediaItem of occ.media) {
                        if (mediaItem.type === 'StillImage' && mediaItem.identifier) {
                            images.push(mediaItem.identifier);
                        }
                    }
                }
            }
        }
        // Return only unique images
        return [...new Set(images)];
    },

    /**
     * Get raw coordinates for map plotting.
     */
    getOccurrenceCoordinates: async (speciesKey: number, limit: number = 200) => {
        const url = `${BASE_URL}/occurrence/search?taxonKey=${speciesKey}&hasCoordinate=true&hasGeospatialIssue=false&limit=${limit}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Error fetching occurrence coordinates');
        const data = await response.json();
        return data.results
            .map((occ: any) => ({
                latitude: occ.decimalLatitude,
                longitude: occ.decimalLongitude,
            }))
            .filter((coord: any) => coord.latitude && coord.longitude);
    },
};