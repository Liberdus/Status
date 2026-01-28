# Status
This is a status updating service to monitor the current uptime for the services we have running to track outages at a glance.

## Frontend route map

- `/` – Overview dashboard with global status, aggregated uptime, and active incident count
- `/#services` – Per-service table with current status, 30‑day uptime, and last incident
- `/#history` – Incident history timeline showing recent incidents and affected services

Open `index.html` in a browser to view the current dashboard framework. Service data and incident history are mock values that can be wired to real uptime endpoints later.
