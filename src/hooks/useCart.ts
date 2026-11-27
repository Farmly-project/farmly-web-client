import { useContext } from 'react';
import { CartContext, type CartContextType } from '../contexts/CartContext';

export function useCart(): CartContextType {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart phải được sử dụng bên trong <CartProvider>');
    }
    return context;
}

export default useCart;