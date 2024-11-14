# Use the official Node.js image as base
FROM node:latest
 
# Set the working directory inside the container
WORKDIR /app
 
# Copy package.json and package-lock.json (if available)
COPY package*.json ./
 
# Install dependencies
RUN npm install
 
# Copy all source code to the container
COPY . .
 
# Expose the port your app runs on
EXPOSE 3000
 
# Command to run your app
CMD ["node", "server.js"]  