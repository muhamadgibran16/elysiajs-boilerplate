import { Storage, type Bucket, type File } from '@google-cloud/storage';
import { Readable } from 'node:stream';
import { env } from '../config/env-loader';
import { InternalServerError, NotFoundError, BadRequestError } from './app-error';

export interface UploadOptions {
  /** Destination path inside the bucket (e.g. "job-experiences/abc/je1.pdf"). Required. */
  destination: string;
  /** MIME content type. Defaults to "application/octet-stream". */
  contentType?: string;
  /** When true, file is publicly readable & a `publicUrl` is returned. */
  isPublic?: boolean;
  /** Arbitrary metadata stored on the object (e.g. uploader id). */
  metadata?: Record<string, string>;
  /** Cache-Control header for the stored object. */
  cacheControl?: string;
}

export interface UploadResult {
  path: string;
  bucket: string;
  size: number;
  contentType: string;
  publicUrl: string | null;
  uri: string; // gs://bucket/path
}

export interface SignedUrlOptions {
  /** How long the URL is valid for. Defaults to 15 minutes. */
  expiresInMs?: number;
  /** "read" (GET) or "write" (PUT). Defaults to "read". */
  action?: 'read' | 'write';
}

export interface ObjectMetadata {
  name: string;
  bucket: string;
  size: number;
  contentType: string;
  md5Hash: string | null;
  generation: string | null;
  metageneration: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  customMetadata: Record<string, string>;
  publicUrl: string | null;
}

const FIFTEEN_MINUTES = 15 * 60 * 1000;

function assertConfigured() {
  if (!env.google.gcsBucket) {
    throw new InternalServerError(
      'GCS_BUCKET env var is not configured — storage operations are unavailable',
    );
  }
}

function buildStorageClient(): Storage {
  if (!env.google.gcsClientEmail || !env.google.gcsPrivateKey) {
    throw new InternalServerError(
      'GCS_CLIENT_EMAIL / GCS_PRIVATE_KEY are not configured — cannot initialize storage client',
    );
  }
  return new Storage({
    projectId: env.google.projectId,
    credentials: {
      client_email: env.google.gcsClientEmail,
      private_key: env.google.gcsPrivateKey,
    },
  });
}

// Lazy singleton — only instantiate when first storage op is invoked.
let _storage: Storage | null = null;
function client(): Storage {
  if (!_storage) _storage = buildStorageClient();
  return _storage;
}

function defaultBucket(): Bucket {
  assertConfigured();
  return client().bucket(env.google.gcsBucket);
}

function buildPublicUrl(bucket: string, path: string): string {
  const base = env.google.gcsUrl.replace(/\/+$/, '');
  return `${base}/${bucket}/${encodeURI(path)}`;
}

async function readableFrom(
  data: Buffer | Uint8Array | ArrayBuffer | Readable | Blob,
): Promise<Readable> {
  if (data instanceof Readable) return data;
  if (data instanceof Buffer) return Readable.from(data);
  if (data instanceof ArrayBuffer) return Readable.from(Buffer.from(data));
  if (ArrayBuffer.isView(data)) return Readable.from(Buffer.from(data.buffer));
  if (typeof Blob !== 'undefined' && data instanceof Blob) {
    return Readable.from(Buffer.from(await data.arrayBuffer()));
  }
  throw new BadRequestError('Unsupported upload data type');
}

function toCustomMetadata(file: File): Record<string, string> {
  const meta = file.metadata.metadata;
  if (!meta || typeof meta !== 'object') return {};
  return Object.fromEntries(Object.entries(meta).map(([k, v]) => [k, String(v ?? '')]));
}

export class StorageError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'StorageError';
  }
}

export const storage = {
  /** Get the underlying bucket reference (escape hatch — prefer the named helpers). */
  bucket(name?: string): Bucket {
    return name ? client().bucket(name) : defaultBucket();
  },

  /** Upload a Buffer / stream / Blob to GCS. */
  async upload(
    data: Buffer | Uint8Array | ArrayBuffer | Readable | Blob,
    opts: UploadOptions,
  ): Promise<UploadResult> {
    if (!opts.destination) throw new BadRequestError('Upload destination is required');
    const bucket = defaultBucket();
    const file = bucket.file(opts.destination);

    const stream = await readableFrom(data);
    await new Promise<void>((resolve, reject) => {
      stream
        .pipe(
          file.createWriteStream({
            resumable: false,
            contentType: opts.contentType ?? 'application/octet-stream',
            metadata: {
              cacheControl: opts.cacheControl,
              metadata: opts.metadata,
            },
            public: opts.isPublic ?? false,
          }),
        )
        .on('error', (err) => reject(new StorageError('Upload failed', err)))
        .on('finish', () => resolve());
    });

    if (opts.isPublic) {
      try {
        await file.makePublic();
      } catch (e) {
        throw new StorageError('Failed to set public ACL', e);
      }
    }

    const [meta] = await file.getMetadata();
    return {
      path: opts.destination,
      bucket: bucket.name,
      size: Number(meta.size ?? 0),
      contentType: meta.contentType ?? opts.contentType ?? 'application/octet-stream',
      publicUrl: opts.isPublic ? buildPublicUrl(bucket.name, opts.destination) : null,
      uri: `gs://${bucket.name}/${opts.destination}`,
    };
  },

  /** Download object content as Buffer. */
  async getFile(path: string): Promise<Buffer> {
    if (!path) throw new BadRequestError('Path is required');
    const file = defaultBucket().file(path);
    const [exists] = await file.exists();
    if (!exists) throw new NotFoundError(`Object not found: ${path}`);
    try {
      const [buf] = await file.download();
      return buf;
    } catch (e) {
      throw new StorageError(`Failed to download ${path}`, e);
    }
  },

  /** Delete an object. Throws NotFound if it doesn't exist. */
  async deleteFile(path: string): Promise<void> {
    if (!path) throw new BadRequestError('Path is required');
    const file = defaultBucket().file(path);
    try {
      await file.delete();
    } catch (e: unknown) {
      const code = (e as { code?: number })?.code;
      if (code === 404) throw new NotFoundError(`Object not found: ${path}`);
      throw new StorageError(`Failed to delete ${path}`, e);
    }
  },

  /** Copy a file within the same bucket (or across buckets via `targetBucket`). */
  async copyFile(
    sourcePath: string,
    destinationPath: string,
    options?: { targetBucket?: string },
  ): Promise<UploadResult> {
    if (!sourcePath || !destinationPath) {
      throw new BadRequestError('Both source and destination paths are required');
    }
    const src = defaultBucket().file(sourcePath);
    const [exists] = await src.exists();
    if (!exists) throw new NotFoundError(`Source not found: ${sourcePath}`);

    const targetBucket = options?.targetBucket
      ? client().bucket(options.targetBucket)
      : defaultBucket();
    const dst = targetBucket.file(destinationPath);

    try {
      await src.copy(dst);
    } catch (e) {
      throw new StorageError(`Failed to copy ${sourcePath} → ${destinationPath}`, e);
    }
    const [meta] = await dst.getMetadata();
    return {
      path: destinationPath,
      bucket: targetBucket.name,
      size: Number(meta.size ?? 0),
      contentType: meta.contentType ?? 'application/octet-stream',
      publicUrl: null,
      uri: `gs://${targetBucket.name}/${destinationPath}`,
    };
  },

  /** Fetch object metadata. */
  async getMetadata(path: string): Promise<ObjectMetadata> {
    if (!path) throw new BadRequestError('Path is required');
    const bucket = defaultBucket();
    const file = bucket.file(path);
    const [exists] = await file.exists();
    if (!exists) throw new NotFoundError(`Object not found: ${path}`);

    const [meta] = await file.getMetadata();
    const isPublic = Array.isArray(meta.acl)
      ? meta.acl.some(
        (a) =>
          (a as { entity?: string; role?: string }).entity === 'allUsers' &&
          (a as { role?: string }).role === 'READER',
      )
      : false;

    return {
      name: meta.name ?? path,
      bucket: bucket.name,
      size: Number(meta.size ?? 0),
      contentType: meta.contentType ?? 'application/octet-stream',
      md5Hash: meta.md5Hash ?? null,
      generation: meta.generation?.toString() ?? null,
      metageneration: meta.metageneration?.toString() ?? null,
      createdAt: meta.timeCreated ? new Date(meta.timeCreated) : null,
      updatedAt: meta.updated ? new Date(meta.updated) : null,
      customMetadata: toCustomMetadata(file),
      publicUrl: isPublic ? buildPublicUrl(bucket.name, path) : null,
    };
  },

  /** Check whether an object exists. */
  async exists(path: string): Promise<boolean> {
    if (!path) return false;
    const [exists] = await defaultBucket().file(path).exists();
    return exists;
  },

  /** Generate a short-lived signed URL (V4) for download or upload. */
  async getSignedUrl(path: string, options: SignedUrlOptions = {}): Promise<string> {
    if (!path) throw new BadRequestError('Path is required');
    const expiresInMs = options.expiresInMs ?? FIFTEEN_MINUTES;
    const [url] = await defaultBucket()
      .file(path)
      .getSignedUrl({
        version: 'v4',
        action: options.action ?? 'read',
        expires: Date.now() + expiresInMs,
      });
    return url;
  },

  /** Compute the public URL for a path (does not check existence). */
  publicUrlFor(path: string): string {
    assertConfigured();
    return buildPublicUrl(env.google.gcsBucket, path);
  },
};
