import { FastifyInstance } from 'fastify';
import { toBuffer } from '../utils';
import {
  get as getObject,
} from '../storage';
import { renderExcel } from 'ejsexcel';
const contentDisposition = require('content-disposition');
var mime = require('mime-types');

export const route = '/sheets';

export function handler(fastify: FastifyInstance, opts: any, done: () => void) {
  // sheet download api
  fastify.post('/download', async (request, reply) => {
    const { file, variables } = <{
      file: string,
      variables: { [key: string]: string },
    }>request.body;
    if (!file) throw new Error('file property is required');
    const obj = await getObject(file);

    // set mime type and filename
    reply.type(mime.contentType(file));
    reply.header('Content-Disposition', contentDisposition(file))

    if (!file.includes('.xls')) {
      // directly serve files that are not word docs
      throw new Error('file must be an excel file');
    }

    // convert stream to buffer
    const buf = await toBuffer(obj);
    
    // process excel template
    return renderExcel(buf, variables, { cachePath: "/tmp" });
  });

  done();
}
