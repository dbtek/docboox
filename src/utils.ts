import { Readable } from 'stream';

export function toBuffer(data: Readable) {
  return new Promise<Buffer>((resolve, reject) => {
    const bufs = [];
    data.on('data', d => bufs.push(d));
    data.on('end', () => resolve(Buffer.concat(bufs)));
    data.on('error', reject);
  });
}

