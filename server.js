{
  "name": "shared-board-pg",
  "version": "1.0.0",
  "description": "Mobile-first shared bulletin board (Node.js + Express + PostgreSQL)",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "NODE_ENV=development node server.js"
  },
  "dependencies": {
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "express-rate-limit": "^7.4.0",
    "helmet": "^7.1.0",
    "pg": "^8.12.0"
  }
}
