import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

const { width } = Dimensions.get('window');

export default function DetailedDescriptionScreen() {
  const { speciesKey, scientificName } = useLocalSearchParams();
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.logoContainer}>
             {/* DNA Isotype simulation */}
             <MaterialCommunityIcons name="dna" size={20} color="white" style={{marginRight: 5}} />
             <Text style={styles.logoText}>LIFE</Text>
          </View>
          <View style={styles.headerIcons}>
             <FontAwesome name="globe" size={20} color="white" style={styles.icon} />
             <FontAwesome name="user" size={20} color="white" style={styles.icon} />
             <FontAwesome name="adjust" size={20} color="white" style={styles.icon} />
          </View>
        </View>
        <View style={styles.searchContainer}>
          <FontAwesome name="filter" size={20} color="white" style={styles.filterIcon} />
          <View style={styles.searchBar}>
            <FontAwesome name="search" size={16} color="#ccc" />
            <TextInput placeholder="Search" style={styles.searchInput} />
          </View>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Pantalla 1: Detalle de la Especie y Taxonomía */}
        <View style={styles.section}>
          <View style={styles.titleContainer}>
             <FontAwesome name="arrow-left" size={20} color="#1A4508" />
             <Text style={styles.scientificName}>{scientificName}</Text>
          </View>

          {/* Gallery */}
          <View style={styles.galleryContainer}>
             {/* Left Image */}
             <View style={[styles.galleryImageSmall, {backgroundColor: '#333'}]} />
             {/* Center Image */}
             <View style={styles.galleryImageLarge}>
                <View style={{width: '100%', height: '100%', backgroundColor: '#3D7716', alignItems: 'center', justifyContent: 'center'}}>
                    <Text style={{color: 'white'}}>Oruga</Text>
                </View>
                <View style={styles.imageOverlay}>
                    <Text style={styles.overlayText}>Order Lepidoptera</Text>
                </View>
             </View>
             {/* Right Image */}
             <View style={[styles.galleryImageSmall, {backgroundColor: '#FFEABD'}]} />
          </View>

          {/* Taxonomy */}
          <View style={styles.taxonomyContainer}>
             <View style={styles.taxonomyItem}><Text style={styles.taxonomyLabel}>Kingdom</Text></View>
             <View style={styles.taxonomyItem}><Text style={styles.taxonomyLabel}>Phylum</Text></View>
             <View style={styles.taxonomyItem}><Text style={styles.taxonomyLabel}>Species</Text></View>
             <View style={styles.taxonomyItem}><Text style={styles.taxonomyLabel}>Genus</Text></View>
          </View>
        </View>

        {/* Pantalla 2: Mapa de Distribución */}
        <View style={styles.section}>
           <Text style={styles.sectionTitle}>Distribution Map</Text>
           <View style={styles.mapContainer}>
              {/* Placeholder for Map of Central America */}
              <Text>Map of Central America (Guatemala, Honduras, El Salvador, Nicaragua)</Text>
              {/* Pins */}
              <View style={[styles.pin, {top: 50, left: 100}]} />
              <View style={[styles.pin, {top: 80, left: 120}]} />
              <View style={[styles.pin, {top: 60, left: 150}]} />
              <View style={[styles.pin, {top: 90, left: 130}]} />
           </View>
        </View>

        {/* Pantalla 3: Gráfico de Estacionalidad y Filtros */}
        <View style={styles.section}>
           <Text style={styles.sectionTitle}>Seasonality</Text>
           <View style={styles.chartContainer}>
              {/* Placeholder for Chart */}
              <View style={styles.chartGrid}>
                 {/* Line simulation */}
                 <View style={styles.chartLine} />
              </View>
              <Text style={{textAlign: 'center', marginTop: 10}}>Peak in May</Text>
           </View>

           <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Place:</Text>
              <View style={styles.filterInputContainer}>
                 <Text>Co</Text>
              </View>
              {/* Dropdown simulation */}
              <View style={styles.dropdown}>
                 <Text style={styles.dropdownItem}>Colombia</Text>
                 <View style={styles.dropdownItemSelected}>
                    <Text style={styles.dropdownItemTextSelected}>Costa Rica</Text>
                 </View>
                 <Text style={styles.dropdownItem}>Congo</Text>
              </View>
              <Pressable style={styles.applyButton}>
                 <Text style={styles.applyButtonText}>Apply</Text>
              </Pressable>
           </View>
        </View>
        <View style={{height: 50}} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#53A72F',
    paddingTop: 50, // Safe area
    paddingBottom: 15,
    paddingHorizontal: 15,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerIcons: {
    flexDirection: 'row',
  },
  icon: {
    marginLeft: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterIcon: {
    marginRight: 10,
  },
  searchBar: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 40,
  },
  searchInput: {
    flex: 1,
    marginLeft: 5,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  scientificName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A4508',
    marginLeft: 10,
    fontStyle: 'italic',
  },
  galleryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 200,
    marginBottom: 20,
  },
  galleryImageSmall: {
    width: '20%',
    height: '80%',
    borderRadius: 10,
  },
  galleryImageLarge: {
    width: '55%',
    height: '100%',
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 5,
    borderRadius: 5,
  },
  overlayText: {
    color: 'white',
    fontSize: 12,
  },
  taxonomyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  taxonomyItem: {
    alignItems: 'center',
  },
  taxonomyLabel: {
    color: '#1A4508',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#1A4508',
  },
  mapContainer: {
    height: 200,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pin: {
    position: 'absolute',
    width: 15,
    height: 15,
    backgroundColor: '#3D7716',
    borderRadius: 7.5,
    borderWidth: 2,
    borderColor: '#1B1C1A',
  },
  chartContainer: {
    height: 200,
    backgroundColor: '#fff',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#eee',
    padding: 10,
  },
  chartGrid: {
    flex: 1,
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'flex-end',
  },
  chartLine: {
    height: '80%', // Peak
    width: '100%',
    backgroundColor: '#3D7716',
    opacity: 0.5, // Just a visual representation
  },
  filterSection: {
    marginTop: 10,
  },
  filterLabel: {
    fontWeight: 'bold',
    color: '#1B1C1A',
    marginBottom: 5,
  },
  filterInputContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginBottom: 5,
  },
  dropdown: {
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 10,
  },
  dropdownItem: {
    padding: 10,
    color: '#000',
  },
  dropdownItemSelected: {
    padding: 10,
    backgroundColor: '#1A4508',
  },
  dropdownItemTextSelected: {
    color: '#FFFFFF',
  },
  applyButton: {
    backgroundColor: '#1A4508',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    alignSelf: 'flex-end',
    width: 100,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
