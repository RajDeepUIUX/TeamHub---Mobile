import { createContext, useContext } from 'react';
import { AppProduct } from '../types/product';

interface ProductContextType {
  /** null = not chosen yet (the "View this app as" screen is showing) */
  product: AppProduct | null;
  /** Switch product; null goes back to the "View this app as" screen */
  onSwitchProduct: (product: AppProduct | null) => void;
}

const ProductContext = createContext<ProductContextType>({ product: null, onSwitchProduct: () => {} });

export const ProductProvider = ProductContext.Provider;

export const useProduct = () => useContext(ProductContext);
