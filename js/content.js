import {getHome, getSection, getPost, imageUrl} from './sanity.js';
const el = (tag, cls, text) => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = text;
  return node;
};
const href = post => 'article.html?slug=' + encodeURIComponent(post.slug.current);
function link(text, url, cls) { const a = el('a', cls, text); a.href = url; return a; }
function date(post, cls) {
  const p = el('p', cls), d = new Date(post.publishedAt);
  if (!Number.isNaN(d.getTime())) {
    const time = el('time', '', new Intl.DateTimeFormat('en-GB', {day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(d));
    time.dateTime = post.publishedAt; p.append(time);
  }
  return p;
}
function img(image) {
  const url = imageUrl(image);
  if (!url) return null;
  const node = el('img'); node.src = url; node.alt = image.alt || ''; node.loading = 'lazy'; node.decoding = 'async';
  const dimensions = image.asset._ref.match(/-(\d+)x(\d+)-/);
  node.width = Number(dimensions[1]); node.height = Number(dimensions[2]);
  node.addEventListener('error', () => { node.closest('figure')?.remove(); if (node.isConnected) node.parentElement.remove(); });
  return node;
}
function figure(image, cls = '') {
  const picture = img(image); if (!picture) return null;
  const f = el('figure', 'media cms-media ' + cls); f.append(picture);
  const caption = [image.caption, image.credit && `Photo by ${image.credit}`].filter(Boolean).join(' ');
  if (caption) f.append(el('figcaption', 'media__caption', caption));
  return f;
}
function card(post, heading = 'h3') {
  const c = el('article', 'card'), a = link(null, href(post));
  const picture = img(post.coverImage);
  if (picture) { const media = el('div','card__media cms-card-media'); media.append(picture); a.append(media); }
  else c.classList.add('card--text');
  a.append(el('p','card__kicker editorial-meta',[post.section,post.format,...(post.topics || [])].filter(Boolean).join(' / ')),el(heading,'card__title',post.title));
  if (post.excerpt || post.dek) a.append(el('p','card__excerpt',post.excerpt || post.dek));
  a.append(date(post,'card__date')); c.append(a); return c;
}
function listing(target, posts, heading = 'h3') {
  target.replaceChildren();
  if (!posts?.length) { target.append(el('p','empty-note','No stories published here yet.')); return; }
  target.append(...posts.map(p => card(p, heading)));
}
function featured(target, post) {
  target.replaceChildren();
  if (!post) { target.append(el('p','empty-note','Explore the latest stories below.')); return; }
  const row = el('article','featured'), photo = figure(post.coverImage,'cms-featured');
  if (photo) { const a = link(null,href(post)); a.setAttribute('aria-label',post.title); a.append(photo); row.append(a); }
  const copy = el('div','featured__copy'), title = el('h3','featured__title'); title.append(link(post.title,href(post)));
  copy.append(el('p','kicker',[post.section,post.format].filter(Boolean).join(' / ')),title);
  if (post.excerpt || post.dek) copy.append(el('p','featured__excerpt',post.excerpt || post.dek));
  copy.append(date(post,'featured__date'),link('Read the story',href(post),'link-more')); row.append(copy); target.append(row);
}
function safeUrl(value) {
  try { const url = new URL(value,location.href); return ['https:','http:','mailto:'].includes(url.protocol) ? url.href : null; } catch { return null; }
}
export function portableText(blocks) {
  const root = el('div'); let list = null, listType = null;
  for (const block of blocks || []) {
    if (block._type === 'image') { list = null; const f = figure(block); if (f) root.append(f); continue; }
    if (block._type !== 'block') continue;
    const tag = ({h1:'h2',h2:'h2',h3:'h3',h4:'h4',blockquote:'blockquote'})[block.style] || 'p';
    const node = el(block.listItem ? 'li' : tag, tag === 'blockquote' ? 'pullquote' : '');
    for (const span of block.children || []) {
      if (span._type !== 'span') continue;
      let text = document.createTextNode(span.text || '');
      for (const mark of span.marks || []) {
        let wrapper;
        if (mark === 'strong' || mark === 'em') wrapper = el(mark);
        else { const def = block.markDefs?.find(d => d._key === mark); const url = def?._type === 'link' && safeUrl(def.href); if (url) wrapper = link(null,url); }
        if (wrapper) { wrapper.append(text); text = wrapper; }
      }
      node.append(text);
    }
    if (block.listItem) {
      const type = block.listItem === 'number' ? 'ol' : 'ul';
      if (!list || listType !== type) { list = el(type); listType = type; root.append(list); }
      list.append(node);
    } else { list = null; root.append(node); }
  }
  return root;
}
export function renderPost(target, post) {
  const essay = post.format === 'Photo Essay';
  const article = el('article','article wrap'), header = el('header',essay ? 'essay-header' : 'article__header');
  header.append(el('p','kicker',[post.section,post.format,...(post.topics || [])].filter(Boolean).join(' / ')),el('h1','article__headline',post.title));
  if (post.dek || post.excerpt) header.append(el('p','article__dek',post.dek || post.excerpt));
  if (post.author) header.append(el('p','article__byline','Words / '+post.author));
  header.append(date(post,'article__byline'));
  if (post.photographer) header.append(el('p','essay-credit','Photographs / '+post.photographer));
  article.append(header);
  const cover = figure(post.coverImage,'article__hero'); if (cover) article.append(cover);
  const body = portableText(post.body); body.className = essay ? 'essay-intro cms-body' : 'article__body cms-body'; article.append(body);
  const gallery = el('div','essay-grid cms-gallery');
  for (const image of post.gallery || []) { const f = figure(image); if (f) gallery.append(f); }
  if (gallery.children.length) article.append(gallery);
  target.replaceChildren(article);
  const captionAlignment = new ResizeObserver(entries => {
    for (const {target: image} of entries) {
      const figure = image.parentElement;
      const caption = figure.querySelector('figcaption');
      const imageRect = image.getBoundingClientRect();
      const figureRect = figure.getBoundingClientRect();
      caption.style.marginLeft = `${imageRect.left - figureRect.left}px`;
      caption.style.marginRight = `${figureRect.right - imageRect.right}px`;
    }
  });
  article.querySelectorAll('.cms-media').forEach(figure => {
    if (figure.querySelector('figcaption')) captionAlignment.observe(figure.querySelector('img'));
  });
  document.title = (post.seoTitle || post.title) + ' · CUT TO';
  document.querySelector('meta[name="description"]')?.setAttribute('content',post.seoDescription || post.excerpt || post.dek || '');
  const nav = document.querySelector(`nav a[href="${post.section === 'LIVE' ? 'live' : 'stories'}.html"]`); nav?.setAttribute('aria-current','page');
}
async function init() {
  const targets = [...document.querySelectorAll('[data-content]')];
  if (!targets.length) return;
  try {
    const type = document.body.dataset.page;
    if (type === 'home') { const data = await getHome(); featured(targets[0],data.featured); listing(targets[1],data.latest); listing(targets[2],data.live); }
    else if (type === 'article') {
      const slug = new URLSearchParams(location.search).get('slug');
      const post = slug && slug.length <= 200 ? await getPost(slug) : null;
      if (post) renderPost(targets[0],post);
      else { document.title = 'Story unavailable · CUT TO'; targets[0].replaceChildren(el('h1','page-head__title','Story unavailable'),el('p','empty-note','This story may have moved or is not available.'),link('Browse stories','stories.html','link-more')); }
    } else listing(targets[0],await getSection(type),'h2');
  } catch {
    for (const target of targets) target.replaceChildren(el('p','empty-note','Stories couldn’t load just now. Please try again shortly.'),link('Try again',location.href,'link-more'));
  } finally { for (const target of targets) target.setAttribute('aria-busy','false'); }
}
init();
