FROM node:14-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install

# build app
WORKDIR /usr/src/app
# add app source
COPY . .
RUN npm run build

# build release image
FROM node:14-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --only production
EXPOSE 3000
CMD [ "node", "dist/main.js" ]