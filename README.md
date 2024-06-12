# SpareTalk Chat App

Welcome to the SpareTalk Chat App, a full-stack web application designed for real-time communication between anonymous users. The app provides a platform where users can send and receive messages instantly and is built to handle high traffic with real-time capabilities.

## Table of Contents
- [About The Project](#about-the-project)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
- [Testing](#testing)
- [Commit History](#commit-history)

## About The Project
SpareTalk Chat App is developed using:
- **Frontend**: Next.js for responsive and dynamic user interfaces, styled with TailwindCSS.
- **Backend**: Node.js with Express for robust server-side logic.
- **Database**: Employs Redis as an in-memory data store to enhance data retrieval speeds and manage data caching, crucial for real-time features.
- **Real-Time Communication**: Uses Socket.IO to facilitate efficient bi-directional communication between clients and servers, enabling instant messaging and data updates.
- **Testing**: Fully tested using Jest to ensure reliability and performance.
- **Load Balance**: Integrates HAProxy to manage high traffic loads and distribute client requests effectively across multiple servers, including support for sticky sessions to maintain user session persistence.

The application is structured into two main directories: frontend and backend. Backend is containerized with Docker to streamline development and deployment processes.

## Getting Started

### Prerequisites
- **Node.js**: Version 18 or higher. Download and install from [Node.js official website](https://nodejs.org/).
- **Docker**: Download and install Docker from [Docker's official site](https://www.docker.com/get-started).

### Installation
Follow these steps to set up your development environment:

1. Clone the repository:
   ```sh
   git clone https://github.com/billychen0894/spareTalk-chat-app.git
   ```
2. Frontend Installation:
   ```sh
   cd spareTalk-chat-app/frontend
   # See README.md in the frontend directory for more instructions
   ```
3. Backend Installation:
   ```sh
   cd ../backend
   # See README.md in the backend directory for more instructions
   ```

### Usage

To use the app, start both the frontend and backend services as described in their respective READMEs. Then, access the application via http://localhost:3000 to enjoy seamless real-time communication. To effectively test the application, open another session in incognito mode at http://localhost:3000 to simulate a different user environment.

### Testing
The application is comprehensively tested using Jest to ensure functionality and performance. Before running the tests, it's crucial to have the Redis server container operational, as the tests interact with the database in real-time.
```sh
cd backend
npm test
```
These steps will help confirm that all parts of the application function correctly in a live environment, closely mimicking production conditions.

### Commit History

If you are interested in exploring the detailed commit history of this project, you can navigate to our other repository where all development commits are tracked. This includes comprehensive logs of changes, updates, and improvements made throughout the project's lifecycle.

Visit the repository at:
- [View Commit History Repository - Frontend](https://github.com/billychen0894/spareTalk)
- [View Commit History Repository - Backend](https://github.com/billychen0894/spareTalk-server)

This external repository provides a full transparent view of the development process and the evolutionary steps the project has taken.

