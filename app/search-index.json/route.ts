import { searchEntries } from '@/lib/data';

export const dynamic = 'force-static';

// The whole search index as one small JSON file, loaded the first time someone opens search.
export function GET() {
  return Response.json(searchEntries());
}
