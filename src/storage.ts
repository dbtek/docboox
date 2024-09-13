import { BucketItem, Client as Minio } from 'minio';
import { nanoid } from 'nanoid';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fixUtf8 = require('fix-utf8');

const bucket = process.env.BUCKET;
const idLength = 6;
const useSSL = ['true', '1'].includes(process.env.MINIO_SSL);

const minio = new Minio({
  endPoint: process.env.MINIO_ENDPOINT,
  port: process.env.MINIO_PORT ? parseInt(process.env.MINIO_PORT) : useSSL ? 443 : 80,
  useSSL,
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY
});

export function getUploadedFileUrl(fileName: string) {
  return `${useSSL ? 'https' : 'http'}://${process.env.MINIO_ENDPOINT}/${bucket}/${fileName}`;
}

/**
 * Renames file.jpg to file_V1StGX.jpg
 */
function renameOriginalFileName(fileName: string) {
  const charMap = {
    'Ç': 'C', 'ç': 'c',
    'Ğ': 'G', 'ğ': 'g',
    'ı': 'i', 'İ': 'I',
    'Ö': 'O', 'ö': 'o',
    'Ş': 'S', 'ş': 's',
    'Ü': 'U', 'ü': 'u',
  };
  // fix non utf8 characters
  const safeFileName = fixUtf8(fileName)
    // remove illegal characters
    .replace(/[/\\?%*:|"<\s>]/g, '-')
    // replace turkish characters
    .replace(new RegExp(Object.keys(charMap).join('|'), 'g'), (c: string) => charMap.hasOwnProperty(c) ? charMap[c] : '-');

  const dotIndex = safeFileName.lastIndexOf('.');
  if (dotIndex === -1) return safeFileName + '_' + nanoid(idLength);

  return safeFileName
    // add an id to end of it
    .slice(0, dotIndex) + '_' + nanoid(idLength) + safeFileName.slice(dotIndex - 1);
}

/**
 * Uploads given file to desired bucket.
 * Returns public url to uploaded file.
 */
export async function upload(fileName: string, file: Buffer, mimeType?: string) {
    const fileNameFull = renameOriginalFileName(fileName);

    const metadata = {};
    if (mimeType) metadata['Content-Type'] = mimeType;

    await minio.putObject(bucket, fileNameFull, file, undefined, metadata);
    return getUploadedFileUrl(fileNameFull);
}

export function list(prefix?: string) {
  return new Promise<BucketItem[]>((resolve, reject) => {
    const res = [];
    minio.listObjectsV2(bucket, prefix)
      .on('data', (obj) => {
        res.push(obj);
      })
      .on('end', () => {
        resolve(res);
      })
  });
}

export function search(query: string, prefix?: string) {
  return new Promise<BucketItem[]>((resolve, reject) => {
    const res = [];
    minio.listObjectsV2(bucket, prefix, true)
      .on('data', (obj) => {
        if (lowerCase(obj.name).includes(lowerCase(query))) res.push(obj);
      })
      .on('end', () => {
        resolve(res);
      })
  });
}

export function get(name: string) {
  return minio.getObject(bucket, name);
}

function lowerCase(str: string) {
  return str.toLocaleLowerCase('tr-TR');
}