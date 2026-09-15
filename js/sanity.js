// Public identifiers only. No authentication is used by the website.
export const projectId = 'rwra79t2';
export const dataset = 'production';
export const apiVersion = '2026-09-14';
const published = `_type == "post" && !(_id in path("drafts.**")) && !(_id in path("versions.**")) && section in ["STORIES", "LIVE"] && defined(slug.current) && defined(publishedAt) && dateTime(publishedAt) <= dateTime(now())`;
export async function query(groq, params = {}) {
  const url = new URL(`https://${projectId}.apicdn.sanity.io/v${apiVersion}/data/query/${dataset}`);
  url.searchParams.set('query', groq);
  url.searchParams.set('perspective', 'published');
  for (const [key, value] of Object.entries(params)) url.searchParams.set('$' + key, JSON.stringify(value));
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(url, {credentials: 'omit', signal: controller.signal});
    if (!response.ok) throw new Error('Content request failed');
    const data = await response.json();
    if (data.error || !Object.hasOwn(data, 'result')) throw new Error('Invalid content response');
    return data.result;
  } finally { clearTimeout(timer); }
}
const fields = `{_id,title,slug,section,format,topics,dek,excerpt,coverImage,publishedAt,author,photographer,featured}`;
export const getHome = () => query(`{
 "featured": *[${published} && featured == true] | order(publishedAt desc)[0]${fields},
 "latest": *[${published}] | order(publishedAt desc)[0...6]${fields},
 "live": *[${published} && section == "LIVE"] | order(publishedAt desc)[0...3]${fields}
}`);
export const getSection = section => query(`*[${published} && section == $section] | order(publishedAt desc)${fields}`, {section});
export const getPost = slug => query(`*[${published} && slug.current == $slug][0]{...,coverImage,gallery,body}`, {slug});
export function imageUrl(image, width = 1600) {
  const match = /^image-([a-zA-Z0-9]+)-(\d+)x(\d+)-([a-zA-Z0-9]+)$/.exec(image?.asset?._ref || '');
  if (!match) return null;
  const [,id,w,h,ext] = match;
  const url = new URL(`https://cdn.sanity.io/images/${projectId}/${dataset}/${id}-${w}x${h}.${ext}`);
  url.searchParams.set('auto', 'format');
  url.searchParams.set('w', String(Math.min(width, Number(w))));
  url.searchParams.set('fit', 'max');
  return url.href;
}
