import React, { createContext, useContext, ReactNode } from 'react';
import { useFavorites } from '@/hooks/useFavorites';

interface FavoritesContextType {
  favorites: string[];
  loading: boolean;
  initialized: boolean;
  isFavorite: (videoId: string) => boolean;
  addToFavorites: (videoId: string) => Promise<void>;
  removeFromFavorites: (videoId: string) => Promise<void>;
  toggleFavorite: (videoId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

interface FavoritesProviderProps {
  children: ReactNode;
}

export const FavoritesProvider = ({ children }: FavoritesProviderProps) => {
  const favoritesData = useFavorites();

  return (
    <FavoritesContext.Provider value={favoritesData}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavoritesContext = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavoritesContext must be used within a FavoritesProvider');
  }
  return context;
};