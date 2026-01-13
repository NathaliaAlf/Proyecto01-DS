/**
 * FilterContext
 * -------------
 * Maneja:
 * - El estado de los filtros
 * - La visibilidad del modal de filtros
 * - Función para limpiar filtros
 */

import React, { createContext, useContext, useState } from 'react';

export interface Filters {
  rank?: string;
  status?: string;
  higherTaxonKey?: number; 
  taxonType?: string;    
  issue?: string[];
}

interface FilterContextType {
  filters: Filters;
  setFilters: (filters: Filters) => void;
  isFilterVisible: boolean;
  setIsFilterVisible: (visible: boolean) => void;
  clearFilters: () => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<Filters>({ issue: [] });
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  const clearFilters = () => setFilters({ issue: [] });

  return (
    <FilterContext.Provider value={{ filters, setFilters, isFilterVisible, setIsFilterVisible, clearFilters }}>
      {children}
    </FilterContext.Provider>
  );
}

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (!context) throw new Error('useFilters must be used within FilterProvider');
  return context;
};