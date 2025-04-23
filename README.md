# Build Your Own HTTP Server

[![progress-banner](https://backend.codecrafters.io/progress/http-server/a427051c-9fba-4988-bd78-2898a040e480)](https://app.codecrafters.io/users/codecrafters-bot?r=2qF)


A JavaScript implementation of an HTTP/1.1 server built from scratch.

## Overview

This project is a HTTP/1.1 server implementation written in JavaScript. It was developed as part of the "Build Your Own HTTP Server" challenge from CodeCrafters.

## Features

- TCP server implementation
- HTTP/1.1 protocol support
- Multi-client handling
- Request parsing and response generation
- Compression using gzip for improved performance
- Persistent connections (Keep-Alive) for efficient resource loading

## Requirements

- Node.js (v21 or higher)

## Running the Server

To run the HTTP server locally:

```bash
./your_program.sh
```

Or directly:

```bash
node app/main.js
```

## Implementation Details

The implementation follows the HTTP/1.1 protocol specification and includes:

- TCP socket handling
- HTTP request parsing
- Response generation with appropriate status codes
- Header processing
- Basic file serving capabilities
- Content compression with gzip
- Connection management for Keep-Alive requests

## Learning Outcomes

Through this project, I've gained experience with:

- TCP networking in JavaScript
- HTTP protocol implementation details
- Socket programming
- Request/response cycle handling
- Error management in network applications