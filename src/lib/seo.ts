type MetaTag = { property?: string; name?: string; content: string };

const BASE_URL = "https://medestudia-v2.vercel.app";

export function setMetaTags(tags: MetaTag[]): void {
  for (const tag of tags) {
    const selector = tag.property
      ? `meta[property="${tag.property}"]`
      : `meta[name="${tag.name}"]`;
    let el = document.querySelector(selector) as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement("meta");
      if (tag.property) el.setAttribute("property", tag.property);
      if (tag.name) el.setAttribute("name", tag.name);
      document.head.appendChild(el);
    }
    el.setAttribute("content", tag.content);
  }
}

export function setTitle(title: string): void {
  document.title = title;
}

export interface SeoConfig {
  title: string;
  description: string;
  url?: string;
  image?: string;
}

export function applySeo(config: SeoConfig): void {
  const url = config.url ?? `${BASE_URL}/`;
  const image = config.image ?? `${BASE_URL}/og-medestudia.png`;

  setTitle(`${config.title} — MedEstudia`);
  setMetaTags([
    { name: "description", content: config.description },
    { property: "og:title", content: config.title },
    { property: "og:description", content: config.description },
    { property: "og:url", content: url },
    { property: "og:image", content: image },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { name: "twitter:title", content: config.title },
    { name: "twitter:description", content: config.description },
    { name: "twitter:image", content: image },
    { name: "twitter:url", content: url },
  ]);
}

export function resetToGlobalSeo(): void {
  applySeo({
    title: "MedEstudia",
    description: "Plataforma educativa basada en inteligencia artificial para estudiantes de ciencias médicas.",
    url: BASE_URL,
    image: `${BASE_URL}/og-medestudia.png`,
  });
}
