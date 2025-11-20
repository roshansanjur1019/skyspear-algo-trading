FROM node:18-alpine

WORKDIR /app

# Copy package files (including package-lock.json)
COPY package*.json ./

# Install dependencies (npm ci requires package-lock.json)
RUN npm ci --production --omit=dev

# Copy application code
COPY . .

# Expose port
EXPOSE 4000

# Start the application
CMD ["node", "index.js"]

