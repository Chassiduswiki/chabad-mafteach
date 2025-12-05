import { NextResponse } from 'next/server';

export class ApiError extends Error {
    statusCode: number;

    constructor(message: string, statusCode: number = 500) {
        super(message);
        this.statusCode = statusCode;
    }
}

export function handleApiError(error: unknown) {
    console.error('API Error:', error);

    if (error instanceof ApiError) {
        return NextResponse.json(
            { error: error.message },
            { status: error.statusCode }
        );
    }

    return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
    );
}

export function createErrorResponse(message: string, status: number) {
    return NextResponse.json({ error: message }, { status });
}
