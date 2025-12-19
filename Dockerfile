FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application code
COPY index.js ./

# Expose port (Render assigns this automatically)
EXPOSE 10000

# Start the application
CMD ["npm", "start"]
