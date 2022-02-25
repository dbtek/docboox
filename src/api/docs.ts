import { FastifyInstance } from 'fastify';
import { compileTemplate } from '../templater';
import { Readable } from 'stream';
import {
  get as getObject,
  list as listBucket,
  search as searchBucket,
  getUploadedFileUrl
} from '../storage';
const contentDisposition = require('content-disposition');
var mime = require('mime-types');

export const route = '/docs';

export function handler(fastify: FastifyInstance, opts: any, done) {
  // list
  fastify.get('/', async (request) => {
    const prefix = request.query ? request.query['prefix'] : '';
    const query = request.query ? request.query['q'] : null;
    const objs = query ? await searchBucket(query, prefix) : await listBucket(prefix);
    const bg = objs.find(ob => ob.name?.includes('bg.png'));
    const docs = objs.filter(ob => !ob.name?.includes('bg.png'));
    return {
      backgroundUrl: bg ? getUploadedFileUrl(bg.name) : null,
      docs,
    };
  });

  // detail
  fastify.get<{
    Params: { name: string },
    Querystring: any,
  }>('/download', async (request, reply) => {
    const { file, ...variables } = request.query;
    if (!file) throw new Error('file query param is required');
    const obj = await getObject(file);
    
    // set mime type and filename
    reply.type(mime.contentType(file));
    reply.header('Content-Disposition', contentDisposition(file))
    
    if (!file.includes('.doc')) {
      // directly serve files that are not word docs
      return obj;
    }

    // convert stream to buffer
    const buf = await toBuffer(obj);
    // process word doc
    return compileTemplate(buf, variables);
  });
  
  done();
}

function toBuffer(data: Readable) {
  return new Promise<Buffer>((resolve, reject) => {
    const bufs = [];
    data.on('data', d => bufs.push(d));
    data.on('end', () => resolve(Buffer.concat(bufs)));
    data.on('error', reject);
  });
}

