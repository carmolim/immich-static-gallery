# -------------------------------------------------
# Multi-stage build for production
# -------------------------------------------------

# Stage 1: Builder (based on thumbsup's approach)
FROM node:18-alpine AS builder

# Install build tools
RUN apk add --no-cache git make g++ python3

WORKDIR /app

# Install app dependencies first for better caching
COPY package.json package-lock.json ./
RUN npm ci

# Copy app source
COPY . .

# Stage 2: Runtime image (optimized)
FROM node:18-alpine

# Metadata
LABEL maintainer="Your Name <your.email@example.com>"

# Install runtime dependencies with architecture checks
RUN apk add --no-cache \
    ffmpeg \
    imagemagick \
    graphicsmagick \
    exiftool \
    gifsicle \
    zip \
    libheif \
    libde265 \
    x265 \
    dcraw \
    libgomp \
    zlib \
    libpng \
    libjpeg-turbo \
    libwebp \
    tiff \
    lcms2 \
    && if [ "$(uname -m)" = "x86_64" ]; then \
         apk add --no-cache intel-media-driver; \
       fi \
    && sed -i '/pattern="HEIC"/d' /etc/ImageMagick-7/policy.xml \
    && ln -s $(which convert) /usr/local/bin/magick

# Copy built application from builder
COPY --from=builder /app /app

# Install global packages separately
RUN npm install -g thumbsup wrangler

# Use tini as init process
RUN apk add --no-cache tini
ENTRYPOINT ["tini", "-g", "--"]

WORKDIR /app
CMD ["npm", "run", "start"]