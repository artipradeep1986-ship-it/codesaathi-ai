FROM node:20-bullseye-slim

# Install OpenJDK 17 for real Java code execution & compilation
RUN apt-get update && \
    apt-get install -y --no-install-recommends openjdk-17-jdk-headless ca-certificates && \
    rm -rf /var/lib/apt/lists/*

ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
ENV PATH=$JAVA_HOME/bin:$PATH

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 4000

ENV PORT=4000
ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
