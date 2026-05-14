import type { ErrorDetails } from './app-error';

export interface MetaPagination {
    currentPage: number;
    perPage: number;
    totalCurrentPage: number;
    totalPage: number;
    totalData: number;
}

export interface SuccessResponse<T> {
    success: true;
    message: string;
    data: T;
}

export interface MetaResponse<T> extends SuccessResponse<T> {
    meta: MetaPagination;
}

export interface ErrorResponseShape {
    success: false;
    message: string;
    errors: ErrorDetails;
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
    };
};

export const successResponse = <T>(data: T, message: string = 'Success'): SuccessResponse<T> => ({
    success: true,
    message,
    data,
});

export const metaResponse = <T>(
    data: T,
    meta: MetaPagination,
    message: string = 'Success',
): MetaResponse<T> => ({
    success: true,
    message,
    data,
    meta,
});

export const errorResponse = (
    message: string,
    errors: ErrorDetails = null,
): ErrorResponseShape => ({
    success: false,
    message,
    errors,
});
