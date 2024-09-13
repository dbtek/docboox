// Require the framework and instantiate it
import { fastify } from 'fastify';
import jwt, { FastifyJwtNamespace } from '@fastify/jwt';
import * as docs from './api/docs';

declare module 'fastify' {
  interface FastifyInstance extends
    FastifyJwtNamespace<{ namespace: 'security' }> {
  }
}

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
app.register(docs.handler, { prefix: docs.route });

// Run the server!
const start = async () => {
  try {
    await app.listen({
      host: '0.0.0.0',
      port: 3000,
    });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();