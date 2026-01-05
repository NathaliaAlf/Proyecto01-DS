import React, { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, TextInput, View } from 'react-native';
import { Text } from '../../components/Themed';
import { useColorScheme } from '../../components/useColorScheme';
import Colors from '../../constants/Colors';
import { gbifService } from '../../services/gbifService';
import { GBIFSpecies } from '../../services/gbifTypes';

export default function SpeciesScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GBIFSpecies[]>([]);
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme() ?? 'light';

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    try {
      const data = await gbifService.searchSpecies(query);
      setResults(data.results);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Buscador de Especies GBIF</Text>
      
      <TextInput
        style={[styles.input, { color: Colors[colorScheme].text, borderColor: Colors[colorScheme].tabIconDefault }]}
        placeholder="Ej: Sloth"
        placeholderTextColor="#888"
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={handleSearch}
      />

      {loading ? (
        <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.key.toString()}
          renderItem={({ item }) => (
            <View style={styles.itemCard}>
              <Text style={styles.scientificName}>{item.scientificName}</Text>
              <Text style={styles.details}>{item.kingdom} {'>'} {item.family}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  input: { height: 50, borderWidth: 1, borderRadius: 8, paddingHorizontal: 15, marginBottom: 20 },
  itemCard: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#ccc' },
  scientificName: { fontSize: 16, fontWeight: '600' },
  details: { fontSize: 12, opacity: 0.7 },
});