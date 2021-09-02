FROM node:15-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install

# add app source
COPY . .
RUN npm run build

# build release image
FROM node:14-alpine
WORKDIR /usr/src/app
COPY package*.json ./
COPY --from=builder /usr/src/app/dist /usr/src/app/dist
RUN npm install --only production
EXPOSE 3000
CMD [ "node", "dist/server.js" ]