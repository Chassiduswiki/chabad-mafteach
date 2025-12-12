# Directus Built-in Translations: Better Approach

You're absolutely right! Directus comes with built-in multilingual content support. Instead of creating a custom translations table, we should use Directus's native approach.

## Updated: Transliteration vs Translation Strategy

### Hebrew Term Types:
1. **Transliteration**: Phonetic conversion (צדיק → Tzadik)
2. **Translation**: Meaning-based equivalent (צדיק → Righteous Person)
3. **Hybrid**: Both transliteration + translation

### Recommended Fields:
- `canonical_title_en` → **Translation** (Righteous Person)
- `canonical_title_transliteration` → **Transliteration** (Tzadik)
- `description_en` → **Translation** (Full English explanation)
- `description_he` → **Original Hebrew** (Always preserved)

### Display Logic:
```javascript
// Display priority: Translation > Transliteration > Hebrew
name: topic.canonical_title_en || 
      topic.canonical_title_transliteration || 
      topic.canonical_title
```

## Recommended Implementation

For our simple bilingual needs (Hebrew originals + English translations), **Option A** is perfect:

1. **Add English fields to topics collection:**
   - `canonical_title_en` (string, required)
   - `description_en` (text, required)

2. **Update API logic:**
   - If English translation exists → show English first
   - Fallback to Hebrew if English missing

3. **Admin workflow:**
   - Content editors add English translations directly in the topic form
   - No separate translations table to manage

## Benefits vs Our Previous Approach
- ✅ **Simpler**: No separate table creation/API complexity
- ✅ **Integrated**: Works with Directus admin interface natively  
- ✅ **Performance**: Single query per topic instead of joins
- ✅ **Maintenance**: Directus handles the multilingual UI automatically

## Migration Path
1. Add English fields to existing topics collection (Directus admin)
2. Populate English translations for existing 3 topics
3. Update API to use new fields instead of translations table
4. Remove our custom translations table approach

This is exactly what Directus was designed for! 🎯
