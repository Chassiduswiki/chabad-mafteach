# Scripts Directory

Utility scripts for setup, data management, and development tools.

## Directory Structure

### `/setup`
Schema and configuration scripts:
- `setup-sources-schema.js` - Set up sources schema in Directus
- `add-article-field.js` - Add article field to topics collection

### `/data`  
Data population and seeding:
- `populate-data.js` - Populate database with initial data

### `/scrapers`
Data scraping utilities:
- `chabadlibraryScraper.js` - Scrapes books from Chabad Library API
- `index.js` - Central registry and documentation for all scrapers

### `/utils`
Development utilities:
- `check-schema.js` - Validate schema structure
- `test-connection.js` - Test Directus connection
- `verify-static-token.js` - Verify static token configuration

## Usage

```bash
# Setup scripts
node scripts/setup/setup-sources-schema.js
node scripts/setup/add-article-field.js

# Data scripts
node scripts/data/populate-data.js

# Utility scripts
node scripts/utils/check-schema.js
node scripts/utils/test-connection.js
```

## Notes

These scripts are for development use only and should not be included in production builds.
