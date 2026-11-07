/**
 * Resolve the Azure OpenAI embeddings URL. Accepts either the full URL
 * (…/openai/deployments/<name>/embeddings?api-version=…) or just the resource
 * base URL (https://<resource>.services.ai.azure.com or .openai.azure.com),
 * in which case the deployment name comes from AZURE_OPENAI_EMBED_DEPLOYMENT
 * (default "text-embedding-3-small").
 * Shared by api/_lib/retrieval.ts and rag/embed.mjs so both always hit the same model.
 */
export const EMBED_API_VERSION = '2024-10-21';

export function resolveEmbedEndpoint(env) {
  const raw = (env.AZURE_OPENAI_EMBED_ENDPOINT || '').trim();
  if (!raw) return '';
  if (/\/embeddings(\?|$)/.test(raw)) return raw;
  const base = raw.replace(/\/+$/, '').replace(/\/openai$/, '');
  const deployment = (env.AZURE_OPENAI_EMBED_DEPLOYMENT || 'text-embedding-3-small').trim();
  return `${base}/openai/deployments/${encodeURIComponent(deployment)}/embeddings?api-version=${EMBED_API_VERSION}`;
}
