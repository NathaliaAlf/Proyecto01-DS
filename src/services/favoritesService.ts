// services/favoritesService.ts
import { db } from '@/config/firebase';
import { arrayRemove, arrayUnion, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export type Favorite = {
  speciesKey: number;
  scientificName: string;
  commonName?: string;
  imageUrl: string;
  addedAt: number;
};

/**
 * Add a species to user's favorites
 */
export async function addToFavorites(userId: string, favorite: Omit<Favorite, 'addedAt'>) {
  const userRef = doc(db, 'users', userId);
  
  try {
    console.log('=== ADD TO FAVORITES DEBUG ===');
    console.log('User ID:', userId);
    console.log('Favorite data:', favorite);
    
    // Remove undefined values - Firebase doesn't accept them
    const cleanedFavorite: any = {
      speciesKey: favorite.speciesKey,
      scientificName: favorite.scientificName,
      imageUrl: favorite.imageUrl,
      addedAt: Date.now()
    };
    
    // Only add commonName if it exists
    if (favorite.commonName) {
      cleanedFavorite.commonName = favorite.commonName;
    }

    console.log('Cleaned favorite data:', cleanedFavorite);

    // Check if user document exists
    const userDoc = await getDoc(userRef);
    console.log('User document exists:', userDoc.exists());
    
    if (!userDoc.exists()) {
      console.log('Creating new user document with favorites...');
      // Create user document with favorites array
      await setDoc(userRef, {
        favorites: [cleanedFavorite]
      }, { merge: true });
      console.log('User document created successfully');
    } else {
      // Check if already favorited
      const favorites = userDoc.data().favorites || [];
      console.log('Current favorites count:', favorites.length);
      
      const alreadyFavorited = favorites.some((fav: Favorite) => fav.speciesKey === favorite.speciesKey);
      
      if (alreadyFavorited) {
        console.log('Already in favorites');
        return false;
      }
      
      console.log('Adding to existing favorites array...');
      // Add to favorites array
      await updateDoc(userRef, {
        favorites: arrayUnion(cleanedFavorite)
      });
      console.log('Successfully added to favorites');
    }
    
    console.log('Added to favorites:', favorite.scientificName);
    console.log('=== END DEBUG ===');
    return true;
  } catch (error) {
    console.error('=== ERROR ADDING TO FAVORITES ===');
    console.error('Error details:', error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('=== END ERROR ===');
    throw error;
  }
}

/**
 * Remove a species from user's favorites
 */
export async function removeFromFavorites(userId: string, speciesKey: number) {
  const userRef = doc(db, 'users', userId);
  
  try {
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      console.log('User document not found');
      return false;
    }
    
    const favorites = userDoc.data().favorites || [];
    const favoriteToRemove = favorites.find((fav: Favorite) => fav.speciesKey === speciesKey);
    
    if (!favoriteToRemove) {
      console.log('Species not in favorites');
      return false;
    }
    
    // Remove from favorites array
    await updateDoc(userRef, {
      favorites: arrayRemove(favoriteToRemove)
    });
    
    console.log('Removed from favorites:', speciesKey);
    return true;
  } catch (error) {
    console.error('Error removing from favorites:', error);
    throw error;
  }
}

/**
 * Get all favorites for a user
 */
export async function getFavorites(userId: string): Promise<Favorite[]> {
  const userRef = doc(db, 'users', userId);
  
  try {
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      return [];
    }
    
    const favorites = userDoc.data().favorites || [];
    
    // Sort by most recently added
    return favorites.sort((a: Favorite, b: Favorite) => b.addedAt - a.addedAt);
  } catch (error) {
    console.error('Error getting favorites:', error);
    return [];
  }
}

/**
 * Check if a species is in user's favorites
 */
export async function isFavorite(userId: string, speciesKey: number): Promise<boolean> {
  const userRef = doc(db, 'users', userId);
  
  try {
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      return false;
    }
    
    const favorites = userDoc.data().favorites || [];
    return favorites.some((fav: Favorite) => fav.speciesKey === speciesKey);
  } catch (error) {
    console.error('Error checking favorite:', error);
    return false;
  }
}

/**
 * Toggle favorite status
 */
export async function toggleFavorite(
  userId: string, 
  favorite: Omit<Favorite, 'addedAt'>
): Promise<boolean> {
  const isFav = await isFavorite(userId, favorite.speciesKey);
  
  if (isFav) {
    await removeFromFavorites(userId, favorite.speciesKey);
    return false; // Now not favorited
  } else {
    await addToFavorites(userId, favorite);
    return true; // Now favorited
  }
}