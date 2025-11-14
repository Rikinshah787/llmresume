# llmresume - Backend (Node + Express + Socket.IO)

This folder contains a production-ready backend for a real-time LaTeX resume editor. It provides REST endpoints and realtime Socket.IO events to integrate with the frontend chat UI.

Quick start

1. Install dependencies
```
cd server
npm install
```

2. Copy `.env.example` → `.env` and set your GRO_API_KEY/GRO_API_BASE/GRO_MODEL

3. Start server
```
npm start
```

Server endpoints and socket events are described in the project spec. See `.env.example` for required environment variables.

Notes
- In production replace in-memory state with Redis/DB and protect GRO keys server-side.
- Node 18+ is required for native fetch.
