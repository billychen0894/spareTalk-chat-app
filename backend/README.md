# SpareTalk Chat App - Backend

Welcome to the SpareTalk Chat App repository, a full-stack solution for real-time communication. This backend manages all server-side logic and database interactions, designed to work seamlessly with the frontend.

## Table of Contents
- [Getting Started](#getting-started)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Docker Setup](#docker-setup)
- [Testing the Application](#testing-the-application)

## Getting Started

### Prerequisites
- **Node.js**: Version 18 or higher. Download from [Node.js official website](https://nodejs.org/).
- **Docker**: Ensure Docker is installed on your system. Download from [Docker's official site](https://www.docker.com/get-started).

### Installation

```bash
# Clone the repository
git clone https://github.com/billychen0894/spareTalk-chat-app.git

# Navigate to the backend directory and install dependencies
cd spareTalk-chat-app/backend
npm install

# Set up environment variables
cp .example.env .env
```

### Docker Setup

```bash
# From the root of your project directory (ensure Dockerfile and docker-compose.yml are set up)
docker-compose build

# This command starts all services defined in your docker-compose.yml
docker-compose up

The backend server should now be running and accessible. By default, it's accessible via http://localhost:4040, but check your Docker configuration to confirm the port settings.
```

### Testing the Application
- Local Testing: Open http://localhost:3000 in your browser to see the backend in action.
- Docker Environment Testing: To effectively test the application, open another session in incognito mode at http://localhost:3000 to simulate a different user environment.
