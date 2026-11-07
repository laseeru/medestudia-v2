# Retrieval Design Note (S4-1)

**Status:** implemented on branch `feat/rag-retrieval`; full index built 7 Nov 2026 (42,572 chunks from 38 books; manifest in `rag/output/embed-manifest.json`). **Not yet evaluated.** The
S4-3 retrieval-only gate (Recall@k, MRR, nDCG on a labelled question set) has **not** been run,
so nothing here is evidence that retrieval works well. It is evidence that it exists.

## Decisions

| Decision | Choice | Rationale / deviation |
|---|---|---|
| Embedding model | Azure OpenAI `text-embedding-3-small`, `dimensions = 512` | **Deviates from the roadmap's preference for a local model** (licensing §4.6, reproducibility). Chosen for: Azure credits already available, same provider already receives passages at generation time, strong multilingual quality, and no local GPU. The model name is a fixed version; record the deployment's model version with any experiment. 512 dims (native Matryoshka reduction) keeps the index ~3× smaller than 1536 |
| Text embedded | `"<title> — <section>\n<content>"` | Gives short chunks book/section context |
| Vector store | Supabase Postgres + pgvector, HNSW (m=16, ef_construction=64), cosine | Already in the stack; server-side only |
| Access | RLS on, no policies; RPC executable by `service_role` only | Corpus licence unverified → no public read of chunk text. Clients receive only ≤220-char excerpts with each answer |
| k | 5 (quiz: 8) | Starting point, not tuned |
| Similarity threshold | 0.50 cosine (`RAG_MIN_SIMILARITY`) | **Provisional, sanity-checked, not formally calibrated.** Full index (42,572 chunks, 38 books, 7 Nov 2026), 17 queries: 12 on-topic clinical/preclinical queries scored 0.65–0.74 at rank 1 and 0.62–0.71 at rank 5; 5 non-medical queries scored 0.25–0.41 at rank 1. 0.50 sits in the gap. An earlier 200-chunk pilot showed 0.35 admitted off-topic passages. This is a separation check, not the S4-3 relevance evaluation |
| Metadata pre-filter | None | Roadmap default: filtering is a second intervention |
| Passage order | Similarity descending, labelled S1…Sk | Lost-in-the-middle not yet addressed |
| Corruption filter | Drop chunks with NUL bytes or non-Spanish Latin-1 letters (269 of 42,841, 0.6%) | Same signal as the initial audit (221). Ordinary OCR typos are **not** filtered |
| Citation format | Inline `[S#]` markers; server removes markers that point to no retrieved passage and reports `removedCitations` | Implements the roadmap's automatic "cited IDs exist and were retrieved" test at runtime |
| No relevant passages | Answer is still generated, flagged `grounded: false`, and the UI says it has no verifiable sources | **No hard abstention yet.** C1/C2 abstention design is still open |
| Guideline source note | Written by the server from the passages actually cited; never by the model | Replaces the old hard-coded "RAG will be integrated later" disclaimer |
| Experiment switch | Request field `retrieval: false` skips retrieval (C0/C1 runs); `RAG_ENABLED=false` disables globally | Keeps the C0/C1/C2 comparison possible on the deployed code path |

## Known limitations (carry into any write-up)
1. **No page numbers** in the corpus, so citations point to book + section only.
2. Silent OCR corruption remains in retrieved text (e.g. *Bioquímica Médica, Tomo III*).
3. The threshold and k are uncalibrated; retrieval quality is unmeasured.
4. The licence status of the source PDFs is unresolved (briefing §4.6).
5. Grounding instruction allows uncited general knowledge, so "grounded" means "passages were
   supplied", not "every claim is supported".

## Next (S4-3)
Build a labelled question set → run retrieval only → report Recall@5, MRR, nDCG@5 →
set `RAG_MIN_SIMILARITY` from the score distribution of relevant vs irrelevant passages.
