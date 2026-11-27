import { maxBackupBytes } from '../backup/service.ts';
import { createProgressStore } from '../progress/store.ts';
import type { Progress } from '../progress/store.ts';
import { createProjectStore } from '../projects/store.ts';
import type { Project } from '../projects/store.ts';
import { createReadinessStore } from '../projects/readiness.ts';
import type { ReleaseReview } from '../projects/readiness.ts';
import { createStudyStore } from '../study/store.ts';
import { integer, list, object, parseJson, requireThat, timestamp, uuid } from '../validation/json.ts';

export const contractLimits = { mutationBytes: 256 * 1024, workspaceBytes: maxBackupBytes } as const;
export const syncSchemaVersion = 1;
export type Namespace = `user:${string}` | `guest:${string}`;
type Study = ReturnType<ReturnType<typeof createStudyStore>['load']>;
export type Payloads = {
  learning: Progress;
  study: Study;
  project: Omit<Project, 'id'>;
  readiness: { projectId: string; review: ReleaseReview };
};
export type EntityKind = keyof Payloads;
type RequestIdentity = { schemaVersion: 1; ownerId: string; operationId: string; entityId: string; baseRevision: number };
export type SyncMutation = {
  [K in EntityKind]: RequestIdentity & { kind: K; action: 'upsert'; payload: Payloads[K] }
}[EntityKind] | RequestIdentity & { kind: 'project' | 'readiness'; action: 'delete'; payload: null };
type RecordIdentity = { schemaVersion: 1; ownerId: string; entityId: string; revision: number; workspaceRevision: number };
export type CloudRecord = {
  [K in EntityKind]: RecordIdentity & { kind: K; deletedAt: null; payload: Payloads[K] }
}[EntityKind] | RecordIdentity & { kind: 'project' | 'readiness'; deletedAt: string; payload: null };
export type SyncResponse = { schemaVersion: 1; operationId: string } & (
  { status: 'applied'; record: CloudRecord } | { status: 'conflict'; current: CloudRecord } |
  { status: 'rejected'; code: 'invalid' | 'forbidden' | 'quota' | 'unsupported' }
);
export type ProjectMapping = { namespace: Namespace; localProjectId: number; cloudProjectId: string };
export type ImportIdentity = { ownerId: string; guestDatasetId: string; operationId: string };
export type ImportRequest = ImportIdentity & { localProjectIds: number[] };
export type ImportReceipt = ImportIdentity & { schemaVersion: 1; workspaceRevision: number; mappings: ProjectMapping[] };

function identity(value: Record<string, unknown>, ownerId: string): EntityKind {
  uuid(ownerId);
  requireThat(value.schemaVersion === syncSchemaVersion, 'Unsupported sync schema version.');
  requireThat(uuid(value.ownerId) === ownerId, 'Sync owner does not match the active account.');
  const kind = value.kind;
  requireThat(kind === 'learning' || kind === 'study' || kind === 'project' || kind === 'readiness', 'Unknown entity kind.');
  if (kind === 'learning' || kind === 'study') requireThat(value.entityId === 'singleton', 'Invalid singleton identity.');
  else uuid(value.entityId);
  return kind;
}

function validatePayload(kind: EntityKind, payload: unknown): void {
  const slot = (record: unknown) => ({ read: () => JSON.stringify(record), write: (): never => { throw new Error('Validation is read only.'); } });
  if (kind === 'learning') {
    const data = object(payload, 'learning payload', ['checkpoints', 'openedMissions', 'quizResults']);
    createProgressStore(slot({ ...data, version: 1 })).load();
  } else if (kind === 'study') {
    const data = object(payload, 'study payload', ['daily', 'cards']);
    createStudyStore(slot({ ...data, version: 1 })).load();
  } else if (kind === 'project') {
    const data = object(payload, 'project payload', ['name', 'audience', 'goal', 'plan', 'build', 'milestones'], ['name', 'audience', 'goal']);
    createProjectStore(slot({ version: 1, projects: [{ ...data, id: 1 }] })).load();
  } else {
    const data = object(payload, 'readiness payload', ['projectId', 'review']);
    uuid(data.projectId);
    createReadinessStore(slot({ version: 1, reviews: [data.review] })).load();
  }
}

function equalJson(left: unknown, right: unknown): boolean {
  if (left === right) return true;
  if (Array.isArray(left) && Array.isArray(right)) {
    return left.length === right.length && left.every((item, index) => equalJson(item, right[index]));
  }
  if (typeof left !== 'object' || left === null || typeof right !== 'object' || right === null || Array.isArray(left) || Array.isArray(right)) return false;
  const a = left as Record<string, unknown>;
  const b = right as Record<string, unknown>;
  return Object.keys(a).length === Object.keys(b).length && Object.keys(a).every(key => Object.hasOwn(b, key) && equalJson(a[key], b[key]));
}

export function parseMutation(source: string, ownerId: string): SyncMutation {
  const value = object(parseJson(source, contractLimits.mutationBytes), 'mutation',
    ['schemaVersion', 'ownerId', 'operationId', 'kind', 'entityId', 'baseRevision', 'action', 'payload']);
  const kind = identity(value, ownerId);
  uuid(value.operationId);
  const revision = integer(value.baseRevision, 'base revision');
  if (value.action === 'delete') {
    requireThat((kind === 'project' || kind === 'readiness') && revision > 0 && value.payload === null, 'Invalid deletion intent.');
  } else {
    requireThat(value.action === 'upsert', 'Unknown mutation action.');
    validatePayload(kind, value.payload);
  }
  return value as SyncMutation;
}

function cloudRecord(input: unknown, ownerId: string): CloudRecord {
  const value = object(input, 'cloud record',
    ['schemaVersion', 'ownerId', 'kind', 'entityId', 'revision', 'workspaceRevision', 'payload', 'deletedAt']);
  const kind = identity(value, ownerId);
  const revision = integer(value.revision, 'record revision', 1);
  requireThat(integer(value.workspaceRevision, 'workspace revision', 1) >= revision, 'Invalid workspace revision.');
  if (value.deletedAt !== null) {
    timestamp(value.deletedAt);
    requireThat((kind === 'project' || kind === 'readiness') && value.payload === null, 'Invalid tombstone.');
  } else validatePayload(kind, value.payload);
  return value as CloudRecord;
}

export function parseCloudRecord(source: string, ownerId: string): CloudRecord {
  return cloudRecord(parseJson(source, contractLimits.mutationBytes), ownerId);
}

export function parseSyncResponse(source: string, request: SyncMutation): SyncResponse {
  const value = object(parseJson(source, contractLimits.mutationBytes), 'sync response');
  requireThat(value.schemaVersion === syncSchemaVersion && uuid(value.operationId) === request.operationId, 'Sync response does not match the request.');
  if (value.status === 'rejected') {
    object(value, 'rejection', ['schemaVersion', 'operationId', 'status', 'code']);
    requireThat(['invalid', 'forbidden', 'quota', 'unsupported'].includes(String(value.code)), 'Unknown rejection code.');
  } else {
    requireThat(value.status === 'applied' || value.status === 'conflict', 'Unknown sync response status.');
    const key = value.status === 'applied' ? 'record' : 'current';
    object(value, 'sync response', ['schemaVersion', 'operationId', 'status', key]);
    const result = cloudRecord(value[key], request.ownerId);
    requireThat(result.kind === request.kind && result.entityId === request.entityId && result.revision > request.baseRevision,
      'Sync response entity or revision does not match the request.');
    if (value.status === 'applied') {
      requireThat((request.action === 'delete') === (result.deletedAt !== null) && equalJson(request.payload, result.payload),
        'Acknowledgement does not match the submitted action and content.');
    }
  }
  return value as SyncResponse;
}

function projectMappings(input: unknown, namespace: string): ProjectMapping[] {
  const [prefix, id, ...extra] = namespace.split(':');
  requireThat((prefix === 'user' || prefix === 'guest') && extra.length === 0, 'Invalid namespace.');
  uuid(id);
  const local = new Set<number>();
  const cloud = new Set<string>();
  const rows = list(input, 'project mappings');
  for (const row of rows) {
    const value = object(row, 'project mapping', ['namespace', 'localProjectId', 'cloudProjectId']);
    requireThat(value.namespace === namespace, 'Project mapping belongs to another namespace.');
    const localId = integer(value.localProjectId, 'local project ID', 1);
    const cloudId = uuid(value.cloudProjectId);
    requireThat(!local.has(localId) && !cloud.has(cloudId), 'Duplicate project identity mapping.');
    local.add(localId); cloud.add(cloudId);
  }
  return rows as ProjectMapping[];
}

export function parseProjectMappings(source: string, namespace: string): ProjectMapping[] {
  return projectMappings(parseJson(source, contractLimits.mutationBytes), namespace);
}

export function parseImportReceipt(source: string, expected: ImportRequest): ImportReceipt {
  const value = object(parseJson(source, contractLimits.mutationBytes), 'import receipt',
    ['schemaVersion', 'ownerId', 'guestDatasetId', 'operationId', 'workspaceRevision', 'mappings']);
  requireThat(value.schemaVersion === syncSchemaVersion, 'Unsupported import receipt version.');
  for (const key of ['ownerId', 'guestDatasetId', 'operationId'] as const) {
    requireThat(uuid(value[key]) === uuid(expected[key]), 'Import receipt does not match the requested import.');
  }
  integer(value.workspaceRevision, 'workspace revision', 1);
  const mappings = projectMappings(value.mappings, `user:${expected.ownerId}`);
  const expectedIds = expected.localProjectIds.map(id => integer(id, 'import project ID', 1));
  requireThat(new Set(expectedIds).size === expectedIds.length && mappings.length === expectedIds.length &&
    mappings.every(mapping => expectedIds.includes(mapping.localProjectId)), 'Incomplete or unexpected import project mapping.');
  return value as ImportReceipt;
}
