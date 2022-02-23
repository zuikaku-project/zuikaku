FROM node:17.5.0-alpine as build-stage

LABEL name "Zuikaku (build-stage)"
LABEL maintainer "noxzym"

WORKDIR /tmp/build

# Install build tools for node-gyp
RUN apk add --no-cache build-base git python3

# Copy package.json
COPY package.json .

# Install node dependencies
RUN npm install

# Now copy project files
COPY . .

# Build typescript project
RUN npm run build

# Prune dev dependencies
RUN npm prune --production

# Get ready for production
FROM node:17.5.0-alpine

LABEL name "Zuikaku"
LABEL maintainer "noxzym"

WORKDIR /app

# Install dependencies
RUN apk add --no-cache tzdata

# Copy needed project files
COPY --from=build-stage /tmp/build/package.json .
COPY --from=build-stage /tmp/build/package-lock.json .
COPY --from=build-stage /tmp/build/node_modules ./node_modules
COPY --from=build-stage /tmp/build/dist ./dist

VOLUME [ "/app/logs" ]

CMD ["node", "dist/ZuikakuBase.js"]