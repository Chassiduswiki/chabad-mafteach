# Add English Translation Fields to Topics Collection

## Directus Admin Steps

1. **Access Directus Admin:**
   - Go to: `https://directus-production-20db.up.railway.app/admin`
   - Log in with admin credentials

2. **Navigate to Topics Collection:**
   - Go to Settings → Data Model → `topics` collection

3. **Add English Translation Field:**
   - Click "Create Field"
   - **Field Key:** `canonical_title_en`
   - **Type:** String
   - **Interface:** Input
   - **Required:** Yes (for now - can make optional later)
   - **Note:** English translation of the Hebrew term
   - **Max Length:** 255

4. **Add Transliteration Field:**
   - Click "Create Field"
   - **Field Key:** `canonical_title_transliteration`
   - **Type:** String
   - **Interface:** Input
   - **Required:** No
   - **Note:** Phonetic transliteration (e.g., "Tzadik" for צדיק)
   - **Max Length:** 255

5. **Add English Description Field:**
   - Click "Create Field"
   - **Field Key:** `description_en`
   - **Type:** Text
   - **Interface:** Textarea
   - **Required:** Yes (for now)
   - **Note:** English translation of the description

## Field Display Configuration

After creating the fields, you can configure how they appear in the admin interface:

1. **Field Layout:** Arrange English fields next to Hebrew fields
2. **Field Groups:** Group "Hebrew" and "English" fields separately
3. **Conditional Visibility:** Show English fields only when Hebrew content exists

## Populate Existing Data

For the 3 existing topics, add English translations and transliterations:

### Topic 1: Tzadik (id: 1)
- **canonical_title_en**: Righteous Person
- **canonical_title_transliteration**: Tzadik
- **description_en**: A righteous individual who has achieved spiritual perfection...

### Topic 2: Rasha (id: 2)
- **canonical_title_en**: Wicked Person
- **canonical_title_transliteration**: Rasha
- **description_en**: [English description of rasha concept]

### Topic 3: Beinoni (id: 3)
- **canonical_title_en**: Intermediate Person
- **canonical_title_transliteration**: Beinoni
- **description_en**: [English description of beinoni concept]

## Display Priority Logic

The API will display names in this priority order:
1. **English Translation** (canonical_title_en) - e.g., "Righteous Person"
2. **Transliteration** (canonical_title_transliteration) - e.g., "Tzadik"
3. **Hebrew Original** (canonical_title) - e.g., "צדיק"

## API Impact

After adding these fields:
- The topics API will automatically include `canonical_title_en` and `description_en`
- Update the API logic to prefer English fields when available
- Hebrew fields (`canonical_title`, `description`) become the fallback

This approach leverages Directus's built-in multilingual content support without custom tables! 🎉
