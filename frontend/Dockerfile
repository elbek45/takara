# Frontend Dockerfile with Nginx
FROM node:20-alpine AS builder

WORKDIR /app

# Build arguments
ARG VITE_API_URL
ARG VITE_SOLANA_NETWORK
ARG VITE_SOLANA_RPC_URL
ARG VITE_APP_NAME

# Copy package files
COPY package*.json ./

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++ linux-headers eudev-dev libusb-dev

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build for production
RUN npm run build

# Production image with Nginx
FROM nginx:alpine

# Copy nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
