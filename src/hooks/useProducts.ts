import { useState, useEffect, useCallback } from 'react';
import { productService } from '../services/productService';
import type {
    CategoryItem,
    PaginatedProductResponse,
    ProductListQueryParams,
} from '../types/product.types';

export function useCategories() {
    const [data, setData] = useState<CategoryItem[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isError, setIsError] = useState<boolean>(false);

    useEffect(() => {
        let isMounted = true;
        setIsLoading(true);

        productService
            .getCategories()
            .then((res) => {
                if (!isMounted) return;
                const list = Array.isArray(res)
                    ? res
                    : ((res as { data?: CategoryItem[] })?.data ?? []);
                setData(list);
                setIsError(false);
            })
            .catch(() => {
                if (isMounted) setIsError(true);
            })
            .finally(() => {
                if (isMounted) setIsLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, []);

    return { data, isLoading, isError };
}

export function useProducts(params: ProductListQueryParams = {}) {
    const [data, setData] = useState<PaginatedProductResponse>({
        data: [],
        pagination: { page: 1, limit: 20, total: 0, total_pages: 1 },
    });
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isError, setIsError] = useState<boolean>(false);

    // Chuyển params thành chuỗi để useEffect chỉ chạy lại khi tham số lọc thực sự đổi
    const paramsKey = JSON.stringify(params);

    const fetchProducts = useCallback(async () => {
        setIsLoading(true);
        setIsError(false);
        try {
            const parsedParams: ProductListQueryParams = JSON.parse(paramsKey);
            const res = await productService.getProducts(parsedParams);

            if (Array.isArray(res)) {
                setData({
                    data: res,
                    pagination: {
                        page: parsedParams.page ?? 1,
                        limit: parsedParams.limit ?? 20,
                        total: res.length,
                        total_pages: 1,
                    },
                });
            } else {
                setData({
                    data: res?.data ?? [],
                    pagination: res?.pagination ?? {
                        page: parsedParams.page ?? 1,
                        limit: parsedParams.limit ?? 20,
                        total: res?.data?.length ?? 0,
                        totalPages: 1,
                    },
                });
            }
        } catch {
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    }, [paramsKey]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    return { data, isLoading, isError, refetch: fetchProducts };
}