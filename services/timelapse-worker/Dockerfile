# Base image with Node.js
FROM node:18-slim

# Install FFmpeg and python3 (if needed for scripts, but mostly ffmpeg)
RUN apt-get update && \
    apt-get install -y ffmpeg unzip && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for tsc)
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Prune dev dependencies to save space (optional, can skip if causing issues)
RUN npm prune --production

# Expose port (Cloud Run defaults to 8080)
ENV PORT=8080
EXPOSE 8080

# Start command
CMD ["npm", "start"]
