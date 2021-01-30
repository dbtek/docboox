// Require the framework and instantiate it
import { fastify } from 'fastify';
import * as docs from './api/docs';

const app = fastify({ logger: true });

// Declare a route
app.get('/', async (request, reply) => {
  return { hello: 'world' }
});

// register routes
app.register(docs.handler, { prefix: docs.route });

// Run the server!
const start = async () => {
  try {
    await app.listen(3000, '0.0.0.0');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();