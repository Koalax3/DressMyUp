import React, { createContext, useContext, useRef, useState } from 'react';
import { Animated } from 'react-native';

type ScrollContextType = {
  scrollY: Animated.Value;
  setScrollPosition: (position: number) => void;
  isScrolled: boolean;
  scrollThreshold: number;
};

const ScrollContext = createContext<ScrollContextType | undefined>(undefined);

export const ScrollProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const scrollY = useRef(new Animated.Value(0)).current;
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollThreshold = 50; // seuil de défilement
  
  // Configurer un écouteur pour mettre à jour l'état isScrolled
  React.useEffect(() => {
    const scrollListener = scrollY.addListener(({ value }) => {
      setIsScrolled(value > scrollThreshold);
    });
    
    return () => {
      scrollY.removeListener(scrollListener);
    };
  }, [scrollY, scrollThreshold]);
  
  const setScrollPosition = (position: number) => {
    scrollY.setValue(position);
    // Met également à jour l'état isScrolled
    setIsScrolled(position > scrollThreshold);
  };
  
  return (
    <ScrollContext.Provider 
      value={{ 
        scrollY, 
        setScrollPosition,
        isScrolled,
        scrollThreshold
      }}
    >
      {children}
    </ScrollContext.Provider>
  );
};

export const useScroll = (): ScrollContextType => {
  const context = useContext(ScrollContext);
  
  if (context === undefined) {
    throw new Error('useScroll must be used within a ScrollProvider');
  }
  
  return context;
}; 