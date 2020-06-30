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

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storagedProducts = await AsyncStorage.getItem(
        '@GoMarketPlace:products',
      );

      if (storagedProducts) {
        setProducts([...JSON.parse(storagedProducts)]);
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const copyProducts = products;

      const getIndex = copyProducts.findIndex(product => product.id === id);

      if (getIndex < 0) {
        throw new Error('Product not found');
      }

      copyProducts[getIndex].quantity += 1;

      setProducts([...copyProducts]);

      await AsyncStorage.setItem(
        '@GoMarketPlace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const copyProducts = products;

      const getIndex = copyProducts.findIndex(product => product.id === id);

      if (getIndex < 0) {
        throw new Error('Product not found');
      }

      if (copyProducts[getIndex].quantity > 1) {
        copyProducts[getIndex].quantity -= 1;

        setProducts([...copyProducts]);
      } else {
        copyProducts.splice(getIndex, 1);
        setProducts([...copyProducts]);
      }

      await AsyncStorage.setItem(
        '@GoMarketPlace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const addToCart = useCallback(
    async ({ id, title, image_url, price }) => {
      const checkIfAlreadyAdded = products.findIndex(
        product => product.id === id,
      );

      if (checkIfAlreadyAdded >= 0) {
        increment(id);
      } else {
        const productWithQuantity = {
          id,
          title,
          image_url,
          price,
          quantity: 1,
        };

        await AsyncStorage.setItem(
          '@GoMarketPlace:products',
          JSON.stringify(products),
        );

        setProducts(state => [...state, productWithQuantity]);
      }
    },
    [products, increment],
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
