import { useState, useEffect, useCallback } from 'react';
import { productService } from '../services/productService';
import type {
    CategoryItem,
    PaginatedProductResponse,
    ProductCardItem,
    ProductListQueryParams,
} from '../types/product.types';

export function useCategories() {
    const [data, setData] = useState<CategoryItem[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isError, setIsError] = useState<boolean>(false);

    const fetchCategories = useCallback(async () => {
        setIsLoading(true);
        setIsError(false);
        try {
            const res = await productService.getCategories();
            const list = Array.isArray(res)
                ? res
                : ((res as { data?: CategoryItem[]; items?: CategoryItem[] })?.items ??
                    (res as { data?: CategoryItem[] })?.data ??
                    []);
            setData(list);
        } catch {
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    return { data, isLoading, isError, refetch: fetchCategories };
}

export function useProducts(params: ProductListQueryParams = {}) {
    const [data, setData] = useState<PaginatedProductResponse>({
        items: [],
        pagination: { page: 1, limit: 20, total: 0, total_pages: 1 },
    });
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isError, setIsError] = useState<boolean>(false);

    const paramsKey = JSON.stringify(params);

    const fetchProducts = useCallback(async () => {
        setIsLoading(true);
        setIsError(false);
        try {
            const parsedParams: ProductListQueryParams = JSON.parse(paramsKey);
            const res = await productService.getProducts(parsedParams);

            if (Array.isArray(res)) {
                setData({
                    items: res,
                    pagination: {
                        page: parsedParams.page ?? 1,
                        limit: parsedParams.limit ?? 20,
                        total: res.length,
                        total_pages: Math.max(1, Math.ceil(res.length / (parsedParams.limit ?? 20))),
                    },
                });
            } else {
                const rawAny = res as unknown as {
                    items?: ProductCardItem[];
                    data?: ProductCardItem[];
                    pagination?: PaginatedProductResponse['pagination'];
                };
                const list = rawAny.items ?? rawAny.data ?? [];
                setData({
                    items: list,
                    pagination: rawAny.pagination ?? {
                        page: parsedParams.page ?? 1,
                        limit: parsedParams.limit ?? 20,
                        total: list.length,
                        total_pages: 1,
                    },
                });
            }
        } catch {
            setIsError(true);
            setData({
                items: [],
                pagination: { page: 1, limit: 20, total: 0, total_pages: 1 },
            });
        } finally {
            setIsLoading(false);
        }
    }, [paramsKey]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    return { data, isLoading, isError, refetch: fetchProducts };
}