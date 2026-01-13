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
import { useLanguage } from '@/context/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const RANKS = ['SPECIES', 'UNRANKED', 'GENUS', 'VARIETY', 'SUBSPECIES', 'FORM', 'FAMILY', 'ORDER', 'CLASS', 'PHYLUM', 'KINGDOM'];

const STATUSES = [
  { labelKey: 'ACCEPTED', value: 'ACCEPTED' },
  { labelKey: 'SYNONYM', value: 'SYNONYM' },
  { labelKey: 'DOUBTFUL', value: 'DOUBTFUL' },
  { labelKey: 'HOMOTYPIC_SYNONYM', value: 'HOMOTYPIC_SYNONYM' },
  { labelKey: 'HETEROTYPIC_SYNONYM', value: 'HETEROTYPIC_SYNONYM' },
  { labelKey: 'PROPARTE_SYNONYM', value: 'PROPARTE_SYNONYM' },
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
  { labelKey: 'BASIONYM_RELATION_DERIVED', value: 'BASIONYM_RELATION_DERIVED' },
  { labelKey: 'NAME_PARENT_MISMATCH', value: 'NAME_PARENT_MISMATCH' },
  { labelKey: 'NO_SPECIES_INCLUDED', value: 'NO_SPECIES_INCLUDED' },
  { labelKey: 'CONFLICTING_BASIONYM_COMBINATION', value: 'CONFLICTING_BASIONYM_COMBINATION' },
  { labelKey: 'ORTHOGRAPHIC_VARIANT', value: 'ORTHOGRAPHIC_VARIANT' },
  { labelKey: 'PUBLISHED_BEFORE_PARENT_NAME', value: 'PUBLISHED_BEFORE_PARENT_NAME' },
];

export default function FilterOverlay({ onApply }: { onApply: () => void }) {
  const { filters, setFilters, isFilterVisible, setIsFilterVisible, clearFilters } = useFilters();
  const { t } = useLanguage();

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
            <Text style={styles.title}>{t('filters.title')}</Text>
            <TouchableOpacity onPress={() => setIsFilterVisible(false)}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.grid}>
              <View style={styles.column}>
                <Text style={styles.sectionTitle}>{t('filters.rank')}</Text>
                {RANKS.map(r => (
                  <FilterOption 
                    key={r} 
                    label={t(`filters.ranks.${r}`)} 
                    selected={filters.rank === r} 
                    onPress={() => handleSelectRank(r)} 
                  />
                ))}
              </View>

              <View style={styles.column}>
                <Text style={styles.sectionTitle}>{t('filters.status')}</Text>
                {STATUSES.map(s => (
                  <FilterOption 
                    key={s.value} 
                    label={t(`filters.statuses.${s.labelKey}`)} 
                    selected={filters.status === s.value} 
                    onPress={() => handleSelectStatus(s.value)} 
                  />
                ))}
              </View>

              <View style={styles.column}>
                <Text style={styles.sectionTitle}>{t('filters.higherTaxon')}</Text>
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
                <Text style={styles.sectionTitle}>{t('filters.issues')}</Text>
                {ISSUES.map(i => (
                  <FilterOption 
                    key={i.value} 
                    label={t(`filters.issuesList.${i.labelKey}`)} 
                    selected={!!filters.issue?.includes(i.value)} 
                    onPress={() => handleToggleIssue(i.value)} 
                  />
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
              <Text style={styles.clearText}>{t('filters.clearAll')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyBtn} onPress={() => { onApply(); setIsFilterVisible(false); }}>
              <Text style={styles.applyText}>{t('filters.apply')}</Text>
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