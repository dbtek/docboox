// Require the framework and instantiate it
import { fastify } from 'fastify';
import jwt from 'fastify-jwt';
import * as docs from './api/docs';
import * as sheets from './api/sheets';

const app = fastify({ logger: true });

// add auth plugin
app.register(jwt, { secret: process.env.JWT_SECRET });

app.addHook('onRequest', async (request, reply) => {
  try {
    if (request.query['token']) request.headers['authorization'] = `Bearer ${request.query['token']}`;
    await request.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
});

// register routes
app.register(sheets.handler, { prefix: sheets.route });
app.register(docs.handler, { prefix: docs.route });

// Run the server!
const start = async () => {
  try {
    await app.listen(3000, '0.0.0.0');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();