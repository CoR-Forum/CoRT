# Use the official Node.js image as base
FROM node:latest

# Set the working directory in the container
WORKDIR /usr/src/app

# Install requirements: python3 and bs4
RUN apt-get update && apt-get install -y python3

# Copy the app file to the working directory
COPY app/CoRT .

# Install app dependencies
RUN npm install

# Expose the port your app runs on
EXPOSE 3000

# Run the app
CMD ["node", "server/index.js"]
