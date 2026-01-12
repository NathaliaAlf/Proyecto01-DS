/**
 * FilterOverlay
 * -------------
 * Modal que permite:
 * - Seleccionar Rank
 * - Seleccionar Status
 * - Seleccionar Higher Taxon
 * - Activar múltiples Issues
 * 
 * No ejecuta búsquedas directamente.
 * Solo modifica el estado del contexto.
 */

import { useFilters } from '@/context/FilterContext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const RANKS = ['SPECIES', 'UNRANKED', 'GENUS', 'VARIETY', 'SUBSPECIES', 'FORM', 'FAMILY', 'ORDER', 'CLASS', 'PHYLUM', 'KINGDOM'];

const STATUSES = [
  { label: 'Accepted', value: 'ACCEPTED' },
  { label: 'Synonym', value: 'SYNONYM' },
  { label: 'Doubtful', value: 'DOUBTFUL' },
  { label: 'Homotypic synonym', value: 'HOMOTYPIC_SYNONYM' },
  { label: 'Heterotypic synonym', value: 'HETEROTYPIC_SYNONYM' },
  { label: 'Proparte synonym', value: 'PROPARTE_SYNONYM' },
];

const HIGHER_TAXA = [
  { label: 'Animalia', key: 1, type: 'kingdomKey' },
  { label: 'Fungi', key: 5, type: 'kingdomKey' },
  { label: 'Plantae', key: 6, type: 'kingdomKey' },
  { label: 'Mollusca', key: 52, type: 'phylumKey' },
  { label: 'Arthropoda', key: 54, type: 'phylumKey' },
  { label: 'Insecta', key: 216, type: 'classKey' },
  { label: 'Magnoliopsida', key: 220, type: 'classKey' },
  { label: 'Lepidoptera', key: 797, type: 'orderKey' },
  { label: 'Coleoptera', key: 1470, type: 'orderKey' },
  { label: 'Tracheophyta', key: 7707728, type: 'phylumKey' },
];

const ISSUES = [
  { label: 'Basionym relation derived', value: 'BASIONYM_RELATION_DERIVED' },
  { label: 'Name parent mismatch', value: 'NAME_PARENT_MISMATCH' },
  { label: 'No species included', value: 'NO_SPECIES_INCLUDED' },
  { label: 'Conflicting basionym combination', value: 'CONFLICTING_BASIONYM_COMBINATION' },
  { label: 'Orthographic variant', value: 'ORTHOGRAPHIC_VARIANT' },
  { label: 'Published earlier than parent name', value: 'PUBLISHED_BEFORE_PARENT_NAME' },
];

export default function FilterOverlay({ onApply }: { onApply: () => void }) {
  const { filters, setFilters, isFilterVisible, setIsFilterVisible, clearFilters } = useFilters();

  const handleSelectRank = (val: string) => {
    setFilters({ ...filters, rank: filters.rank === val ? undefined : val });
  };

  const handleSelectStatus = (val: string) => {
    setFilters({ ...filters, status: filters.status === val ? undefined : val });
  };

  const handleSelectTaxon = (key: number, type: string) => {
    console.log("Seleccionando Taxon:", { key, type }); 
    if (filters.higherTaxonKey === key) {
      setFilters({ ...filters, higherTaxonKey: undefined, taxonType: undefined });
    } else {
      setFilters({ ...filters, higherTaxonKey: key, taxonType: type });
    }
  };

  const handleToggleIssue = (val: string) => {
    const currentIssues = filters.issue || [];
    if (currentIssues.includes(val)) {
      setFilters({ ...filters, issue: currentIssues.filter(i => i !== val) });
    } else {
      setFilters({ ...filters, issue: [...currentIssues, val] });
    }
  };

  return (
    <Modal visible={isFilterVisible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.menu}>
          <View style={styles.header}>
            <Text style={styles.title}>Filtros Avanzados</Text>
            <TouchableOpacity onPress={() => setIsFilterVisible(false)}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.grid}>
              <View style={styles.column}>
                <Text style={styles.sectionTitle}>Rank</Text>
                {RANKS.map(r => (
                  <FilterOption 
                    key={r} 
                    label={r.charAt(0) + r.slice(1).toLowerCase()} 
                    selected={filters.rank === r} 
                    onPress={() => handleSelectRank(r)} 
                  />
                ))}
              </View>

              <View style={styles.column}>
                <Text style={styles.sectionTitle}>Status</Text>
                {STATUSES.map(s => (
                  <FilterOption 
                    key={s.value} 
                    label={s.label} 
                    selected={filters.status === s.value} 
                    onPress={() => handleSelectStatus(s.value)} 
                  />
                ))}
              </View>

              <View style={styles.column}>
                <Text style={styles.sectionTitle}>Higher Taxon</Text>
                {HIGHER_TAXA.map(t => (
                  <FilterOption 
                    key={t.key} 
                    label={t.label} 
                    selected={filters.higherTaxonKey === t.key} 
                    onPress={() => handleSelectTaxon(t.key, t.type)} 
                  />
                ))}
              </View>

              <View style={styles.column}>
                <Text style={styles.sectionTitle}>Issues and Flags</Text>
                {ISSUES.map(i => (
                  <FilterOption 
                    key={i.value} 
                    label={i.label} 
                    selected={!!filters.issue?.includes(i.value)} 
                    onPress={() => handleToggleIssue(i.value)} 
                  />
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
              <Text style={styles.clearText}>Limpiar Todo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyBtn} onPress={() => { onApply(); setIsFilterVisible(false); }}>
              <Text style={styles.applyText}>Aplicar Filtros</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function FilterOption({ label, selected, onPress }: { label: string, selected: boolean, onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.optionRow} onPress={onPress}>
      <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
        {selected && <Ionicons name="checkmark" size={14} color="white" />}
      </View>
      <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  menu: { width: '95%', height: '85%', backgroundColor: '#68a637', borderRadius: 15, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: 'white' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  column: { width: '48%', marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: 'white', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.3)', paddingBottom: 5 },
  optionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  checkbox: { 
    width: 18, 
    height: 18, 
    borderRadius: 4, 
    borderWidth: 1, 
    borderColor: 'white', 
    backgroundColor: 'white', 
    marginRight: 10, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  checkboxSelected: { backgroundColor: '#333', borderColor: '#333' },
  optionLabel: { color: 'white', fontSize: 13 },
  optionLabelSelected: { fontWeight: 'bold' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, paddingTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' },
  clearBtn: { padding: 12 },
  clearText: { color: 'white', textDecorationLine: 'underline' },
  applyBtn: { backgroundColor: 'white', paddingHorizontal: 25, paddingVertical: 12, borderRadius: 8 },
  applyText: { color: '#68a637', fontWeight: 'bold', fontSize: 16 }
});