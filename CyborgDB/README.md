# MedSec Database Infrastructure

This guide explains how to deploy the **CyborgDB Service** (Encrypted Search Engine) and **Redis** (Storage Layer) using Docker. We use a dedicated Docker network to ensure seamless communication between the two services.



---

## 🚀 Quick Setup Guide

### 1. Create the Docker Network
We need a private bridge network so the containers can resolve each other by name.


docker network create medsec-net


2. Start Redis (The Storage Layer)
This container acts as the persistent storage "body" for the system.

Bash

docker run -d --name medsec-redis --network medsec-net -p 6379:6379 redis


3. Start CyborgDB (The Encryption Layer)
This container acts as the "brain," handling API requests and encryption before saving data to Redis.



docker run -p 8000:8000 --name cyborgdb-service --network medsec-net ^
  -e CYBORGDB_API_KEY=cyborg_093ee86b4ec04fcca20a9c6fca66a368 ^
  -e CYBORGDB_DB_TYPE=redis ^
  -e CYBORGDB_CONNECTION_STRING=host:medsec-redis,port:6379,db:0 ^
  cyborginc/cyborgdb-service

  ✅ Verification
Once running, keep the terminal for Step 3 open. You should see logs indicating the service is active:

INFO: Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)

You can now run your Python backend (app.py), and it will automatically connect to this local cloud infrastructure.