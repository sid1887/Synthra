# Frontend - React App

FROM node:20-alpine

WORKDIR /app

# Install additional dependencies needed for node-gyp
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies with legacy peer deps flag
RUN npm cache clean --force && \
    npm install --legacy-peer-deps --no-audit

# Copy application code
COPY . .

EXPOSE 3000

# Set environment variables for react-scripts
# When running in Docker Compose, services are accessible by service name
ENV DANGEROUSLY_DISABLE_HOST_CHECK=true \
    SKIP_PREFLIGHT_CHECK=true \
    NODE_ENV=development \
    REACT_APP_API_URL=http://api:8000 \
    REACT_APP_VISION_URL=http://vision:8001 \
    REACT_APP_CORE_URL=http://core:8002 \
    REACT_APP_SIMULATOR_URL=http://simulator:8003 \
    REACT_APP_SVE_URL=http://sve:8005 \
    REACT_APP_DOCS_URL=http://docs:8006 \
    REACT_APP_REALTIME_URL=http://realtime:8007

CMD ["npm", "start"]