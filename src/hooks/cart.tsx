import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

type Item = Omit<Product, 'quantity'>;

interface CartContext {
  products: Product[];
  addToCart(item: Item): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      // TODO LOAD ITEMS FROM ASYNC STORAGE
      const storedProducts = await AsyncStorage.getItem('@GoMarketplace:cart');

      if (storedProducts) {
        setProducts(JSON.parse(storedProducts));
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const currentProducts = products.map(item => {
        if (item.id === id) {
          const product = {
            ...item,
            quantity: item.quantity + 1,
          };

          return product;
        }

        return item;
      });

      setProducts(currentProducts);

      await AsyncStorage.setItem(
        '@GoMarketplace:cart',
        JSON.stringify(currentProducts),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const currentProducts = products
        .map(product => {
          if (product.id === id) {
            return { ...product, quantity: product.quantity - 1 };
          }
          return product;
        })
        .filter(product => product.quantity > 0);

      setProducts(currentProducts);

      await AsyncStorage.setItem(
        '@GoMarketplace:cart',
        JSON.stringify(currentProducts),
      );
    },
    [products],
  );

  const addToCart = useCallback(
    async item => {
      const findProduct = products.find(
        currentProduct => currentProduct.id === item.id,
      );

      if (findProduct) {
        const { id } = findProduct;
        increment(id);
      } else {
        const product = { ...item, quantity: 1 };
        setProducts([...products, product]);

        await AsyncStorage.setItem(
          '@GoMarketplace:cart',
          JSON.stringify(products),
        );
      }
    },
    [increment, products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
