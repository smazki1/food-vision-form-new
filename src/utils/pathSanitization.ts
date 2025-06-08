/**
 * Sanitizes path components for storage compatibility, particularly handling Hebrew characters
 * that can cause issues in storage systems like Supabase Storage.
 */

export const sanitizePathComponent = (text: string): string => {
  // First, replace whole Hebrew words with their English equivalents
  const hebrewToEnglish: Record<string, string> = {
    'מנה': 'dish',
    'שתיה': 'drink', 
    'קוקטייל': 'cocktail',
    'עוגה': 'cake',
    'קינוח': 'dessert',
    'סלט': 'salad',
    'מרק': 'soup',
    'פיצה': 'pizza',
    'המבורגר': 'hamburger',
    'סטייק': 'steak',
    'פסטה': 'pasta',
    'סושי': 'sushi',
    'כריך': 'sandwich',
    'מאפה': 'pastry',
    'ירקות': 'vegetables',
    'פירות': 'fruits',
    'עוף': 'chicken',
    'בשר': 'meat',
    'דג': 'fish'
  };

  let result = text;
  
  // Replace known Hebrew words
  Object.entries(hebrewToEnglish).forEach(([hebrew, english]) => {
    result = result.replace(new RegExp(hebrew, 'g'), english);
  });
  
  // Replace any remaining Hebrew characters with dashes
  result = result.replace(/[א-ת]/g, '-');
  
  // Replace any non-alphanumeric characters (except dash and underscore) with dash
  result = result.replace(/[^a-zA-Z0-9\-_]/g, '-');
  
  // Collapse multiple dashes into single dash
  result = result.replace(/-+/g, '-');
  
  // Remove leading and trailing dashes
  result = result.replace(/^-|-$/g, '');
  
  return result;
}; 