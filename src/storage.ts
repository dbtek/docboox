import { BucketItem, Client as Minio } from 'minio';
import { nanoid } from 'nanoid';
import { Readable } from 'stream';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fixUtf8 = require('fix-utf8');

const bucket = process.env.BUCKET;
const idLength = 6;

const minio = new Minio({
  endPoint: process.env.MINIO_ENDPOINT,
  port: 443,
  useSSL: Boolean(process.env.MINIO_SSL),
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY
});

function getUploadedFileUrl(fileName: string) {
  return `${Boolean(process.env.MINIO_SSL) ? 'https' : 'http'}://${process.env.MINIO_ENDPOINT}/${bucket}/${fileName}`;
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
export function upload(fileName: string, file: Buffer, mimeType?: string) {
  return new Promise<string>((resolve, reject) => {
    const fileNameFull = renameOriginalFileName(fileName);

    const metadata = {};
    if (mimeType) metadata['Content-Type'] = mimeType;

    minio.putObject(bucket, fileNameFull, file, undefined, metadata, (err) => {
      if (err) return reject(err);
      resolve(getUploadedFileUrl(fileNameFull));
    });
  });
}

export function list() {
  return new Promise<BucketItem[]>((resolve, reject) => {
    const res = [];
    minio.listObjectsV2(bucket)
      .on('data', (obj) => {
        res.push(obj);
      })
      .on('end', () => {
        resolve(res);
      })
  });
}

export function get(name: string) {
  return minio.getObject(bucket, name);
}
