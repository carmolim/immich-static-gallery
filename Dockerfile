# -------------------------------------------------
# Stage 1: Builder
# Install ALL dependencies (including dev) needed for potential native module builds
# -------------------------------------------------
FROM node:18-alpine AS builder

# Install build tools and necessary dev libraries for native modules
# Use --virtual to easily remove build deps later if needed within this stage
RUN apk add --no-cache --virtual .build-deps \
    git \
    python3 \
    make \
    g++

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install ALL npm dependencies (including devDeps needed for potential builds)
RUN npm ci

# Copy the rest of the application source code
# Ensure .dockerignore prevents copying unnecessary files like local node_modules
COPY . .

# Optional: If you had a build step (e.g., tsc, webpack), run it here
# RUN npm run build

# -------------------------------------------------
# Stage 2: Production Runtime
# Use a small base image and copy only necessary artifacts
# -------------------------------------------------
FROM node:18-alpine

# Install ONLY essential runtime dependencies from Alpine packages
# Use non -dev versions (e.g., libheif instead of libheif-dev)
RUN apk add --no-cache \
    ffmpeg \
    imagemagick \
    graphicsmagick \
    exiftool \
    gifsicle \
    zip \
    libheif \
    libde265 \
    tini \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install ONLY production npm dependencies
RUN npm ci --omit=dev

# Install global dependencies needed at runtime AFTER production deps are installed
# This keeps layers slightly more logical, though size impact is minimal
RUN npm install -g thumbsup wrangler

# Copy application code (excluding node_modules) from the builder stage
# This ensures we get the source code without the devDependencies from the builder's node_modules
COPY --from=builder /app /app

# Set Tini as the entrypoint for proper signal handling & zombie reaping
ENTRYPOINT ["tini", "-g", "--"]

# Default command to run the application
CMD ["npm", "run", "start"]