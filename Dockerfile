# Use an official Node runtime as a parent image
FROM node:lts-slim

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Install Memcached client
# RUN apt-get update && apt-get install -y libmemcached-dev build-essential

# Expose the port the app runs on
EXPOSE 3000

# Set environment variables for Memcached hosts
ENV MEMCACHED_HOST=memcached
ENV MEMCACHED_HOST2=memcached2

# Update the Memcached connection settings in the application
RUN sed -i 's/localhost:11211/memcached:11211/g' index.js && \
    sed -i 's/localhost:11212/memcached2:11211/g' index.js

# Command to run the app
CMD ["node", "index.js"]
