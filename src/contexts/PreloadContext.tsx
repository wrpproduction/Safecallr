import React, { createContext, useContext } from 'react';

export const PreloadContext = createContext<any>(null);

export function usePreloadedData() {
  return useContext(PreloadContext);
}
