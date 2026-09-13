import type { Pathway, RecentStudyActivity, StudyToolId } from './types';
import { STORAGE_KEYS, isNonEmptyString, isRecord, readJson, removeKey, writeJson } from './storage';

const PATHWAYS: Pathway[] = ['preclinical', 'clinical'];
const TOOLS: StudyToolId[] = ['mcq', 'quiz', 'explain', 'chat', 'stats'];

/** Exported for tests: rejects anything not matching the v1 shape. */
export function parseRecentStudy(value: unknown): RecentStudyActivity | null {
  if (!isRecord(value)) return null;
  if (value.version !== 1) return null;
  if (!PATHWAYS.includes(value.pathway as Pathway)) return null;
  if (!TOOLS.includes(value.tool as StudyToolId)) return null;
  if (!isNonEmptyString(value.displayLabel)) return null;
  if (!isNonEmptyString(value.route)) return null;
  if (!isNonEmptyString(value.updatedAt)) return null;
  if (Number.isNaN(Date.parse(value.updatedAt))) return null;
  // Only same-origin app routes; never restore to an absolute URL.
  if (!value.route.startsWith('/')) return null;

  return {
    version: 1,
    pathway: value.pathway as Pathway,
    subject: isNonEmptyString(value.subject) ? value.subject : undefined,
    rotation: isNonEmptyString(value.rotation) ? value.rotation : undefined,
    system: isNonEmptyString(value.system) ? value.system : undefined,
    tool: value.tool as StudyToolId,
    displayLabel: value.displayLabel,
    route: value.route,
    updatedAt: value.updatedAt,
  };
}

export function loadRecentStudy(): RecentStudyActivity | null {
  return readJson(STORAGE_KEYS.recentStudy, parseRecentStudy);
}

export function saveRecentStudy(
  activity: Omit<RecentStudyActivity, 'version' | 'updatedAt'>,
): RecentStudyActivity {
  const record: RecentStudyActivity = {
    ...activity,
    version: 1,
    updatedAt: new Date().toISOString(),
  };
  writeJson(STORAGE_KEYS.recentStudy, record);
  return record;
}

export function clearRecentStudy(): void {
  removeKey(STORAGE_KEYS.recentStudy);
}

/**
 * Route that restores a selection. Query params rather than router state so a
 * pasted or bookmarked URL, and the browser back button, both keep working.
 */
export function buildStudyRoute(params: {
  pathway: Pathway;
  subject?: string;
  rotation?: string;
  system?: string;
  tool: StudyToolId;
}): string {
  const base = params.pathway === 'preclinical' ? '/preclinico' : '/clinico/estudio';
  const query = new URLSearchParams();
  if (params.subject) query.set('subject', params.subject);
  if (params.rotation) query.set('rotation', params.rotation);
  if (params.system) query.set('system', params.system);
  query.set('tool', params.tool);
  return `${base}?${query.toString()}`;
}
