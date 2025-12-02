import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function safeJsonParse<T>(value: any, fallback: T): T {
    if (typeof value === 'string') {
        try {
            return JSON.parse(value);
        } catch (e) {
            console.error('Failed to parse JSON:', value);
            return fallback;
        }
    }
    return value || fallback;
}
