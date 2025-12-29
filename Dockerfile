FROM oven/bun:1.1.45

WORKDIR /app

COPY package.json bun.lock* ./

RUN bun install --frozen-lockfile

COPY . .

ENV NODE_ENV=production
ENV EXPO_USE_METRO_WORKSPACE_ROOT=1

EXPOSE 8081

CMD ["bun", "run", "start-web"]
