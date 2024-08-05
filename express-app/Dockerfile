# Use a lightweight Node.js image as the base image
FROM node:latest

# Set the working directory for the container
WORKDIR /app

# Copy package.json and package-lock.json files to the container
COPY package*.json ./

# Install the Node.js dependencies
RUN npm install

# Copy the API source code to the container
COPY . .

# Expose the port that the API will listen on
EXPOSE 3000

# Start the Node.js API when the container is run
CMD ["npm", "start"]