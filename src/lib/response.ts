export interface MetaPagination {
    currentPage: number;
    perPage: number;
    totalCurrentPage: number;
    totalPage: number;
    totalData: number;
}

export const metaPagination = (
    page: number,
    perPage: number,
    totalCurrentPage: number,
    total: number,
): MetaPagination => {
    return {
        currentPage: page,
        perPage,
        totalCurrentPage,
        totalPage: Math.ceil(total / perPage),
        totalData: total,
    }
}

export const successResponse = <T>(data: T, message: string = 'Success') => ({
    success: true,
    message,
    data,
});

export const metaResponse = <T>(data: T, meta: ReturnType<typeof metaPagination>, message: string = 'Success') => ({
    success: true,
    message,
    data,
    meta,
});

export const errorResponse = (message: string, errors: any = null) => ({
    success: false,
    message,
    errors,
});
