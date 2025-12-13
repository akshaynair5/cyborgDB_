Backend notes
=============

Microservice configuration
--------------------------

- The backend sends completed encounters to the Cyborg clinical microservice.
- Set `CYBORG_MICROSERVICE_URL` (preferred) or `CYBORG_URL` to the microservice base URL (example: `http://localhost:8000`). Do not include a trailing slash.

Node runtime / fetch
--------------------

- The code uses `global.fetch` when available (Node 18+). If running on Node < 18, install `node-fetch`:

```powershell
cd backend
npm install node-fetch@2
```

Files added/changed
-------------------

- `src/utils/cyborg.client.js` — small client wrapper to call `/upsert-encounter` on the microservice.
- `package.json` — added `node-fetch` dependency to support older Node runtimes.

Security note
-------------

The controller currently sends the full populated encounter to the microservice when `endedAt` is set. Ensure the microservice is properly secured and trusted before enabling in production. Consider adding RBAC checks so only authorized roles can trigger or read the full upsert.
