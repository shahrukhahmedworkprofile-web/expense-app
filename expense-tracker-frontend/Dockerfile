# Node 22 on Alpine Linux (small image). Vite 8 needs a recent Node version
FROM node:22-alpine

# Set the working folder inside the container
WORKDIR /app

# Copy only package files first so Docker can cache the npm install layer
COPY package*.json ./

# Install the project dependencies inside the container
RUN npm install

# Copy the rest of the frontend code
COPY . .

# Document that the Vite dev server uses port 5173
EXPOSE 5173

# Start Vite; --host 0.0.0.0 makes it reachable from your browser outside the container
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]