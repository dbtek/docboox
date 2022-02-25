import * as Pizzip from 'pizzip';
import * as http from 'http';
import * as https from 'https';
import { Transform } from 'stream';
import * as sharp from 'sharp';
const DocxTemplater = require('docxtemplater');
const ImageModule = require('docxtemplater-image-module-free');

function getSize(image: any, tagValue: string, tagName: string) {
  const parts = tagName.split('__');
  if (parts.length !== 2) throw new Error(`Invalid image tag name: ${tagName}. Should be in format: myImage__600x400`);
  const size = parts[1].split('x');
  if (size.length !== 2) throw new Error(`Invalid image tag name: ${tagName}. Should be in format: myImage__600x400`);
  return size.map(s => parseInt(s));
}

const imageOpts = {
  getSize,
  getImage(tagValue: string, tagName:  string) {
    // tagValue is "https://docxtemplater.com/xt-pro-white.png"
    // tagName is "image"
    return new Promise(function (resolve, reject) {
      getHttpData(tagValue, (err: Error, data: any) => {
        if (err) {
          return reject(err);
        }
        const [w, h] = getSize(data, tagValue, tagName);
        sharp(data).resize(w, h, { fit: 'contain' })
          .toBuffer()
          .then(d => resolve(d));
      });
    });
  },
  
}

function getHttpData(url: string, callback: (err: Error | null, data?: any) => void) {
  let h: typeof http | typeof https = http;
  if (url.slice(0, 5) === 'https') h = https;
  h.request(url, function (response) {
    if (response.statusCode !== 200) {
      return callback(
        new Error(
          `Request to ${url} failed, status code: ${response.statusCode}`
        )
      );
    }

    const data = new Transform();
    response.on('data', function (chunk) {
      data.push(chunk);
    });
    response.on('end', function () {
      callback(null, data.read());
    });
    response.on('error', function (e) {
      callback(e);
    });
  })
  .end();
}

export async function compileTemplate(doc: Buffer, variables: Object) {
  const zip = new Pizzip(doc);
  const templater = new DocxTemplater(zip, { modules: [new ImageModule(imageOpts)] });
  templater.setData(variables);
  await templater.resolveData(variables)
  templater.render();
  return templater.getZip().generate({ type: 'nodebuffer' });
}
