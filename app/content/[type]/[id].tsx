import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

/**
 * Dynamic route handler for content URLs
 * Handles URLs like: /content/paper/902, /content/article/123, etc.
 *
 * This component redirects to the main feed with the specific content loaded
 */
export default function ContentHandler() {
  const router = useRouter();
  const { type, id } = useLocalSearchParams();

  useEffect(() => {
    console.log('🔗 ContentHandler: Handling content route:', { type, id });

    // Validate parameters
    if (!type || !id) {
      console.error('🔗 ContentHandler: Missing type or id parameters');
      router.replace('/feed');
      return;
    }

    // Validate content type
    const validTypes = ['article', 'paper', 'book', 'insight'];
    if (!validTypes.includes(type as string)) {
      console.error('🔗 ContentHandler: Invalid content type:', type);
      router.replace('/feed');
      return;
    }

    console.log(`🔗 ContentHandler: Redirecting to feed with ${type} ${id}`);

    // Redirect to feed with content parameters
    router.replace({
      pathname: '/feed',
      params: {
        contentId: id as string,
        contentType: type as string,
        showBackButton: 'true',
        backTo: 'app'
      }
    });
  }, [type, id, router]);

  // Return null since this is just a redirect handler
  return null;
}