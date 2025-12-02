/**
 * Utility for generating links to HebrewBooks.org
 */

export function getHebrewBooksUrl(seferId: number, page?: string | number): string {
    // Base URL for HebrewBooks reader
    const baseUrl = 'https://hebrewbooks.org/pdfpager.aspx';

    // If no page provided, just link to the sefer's main page
    if (!page) {
        return `https://hebrewbooks.org/${seferId}`;
    }

    // If page is provided, link to specific page in reader
    // Note: HebrewBooks uses 'req' parameter for page number
    return `${baseUrl}?req=${seferId}&pgnum=${page}`;
}
