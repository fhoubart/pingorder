# LAB 2: Reverse Proxy & Maintenance Pages

## Objective
Learn how a Reverse Proxy (Nginx) sits in front of your application and how it can "mask" failures using static maintenance pages.

## Setup
Run the lab:
```bash
docker compose -f docker-compose-1.yaml up --build
```

Access the app at: `http://localhost` (Nginx port 80)

## Steps
1. **Normal Ops**: Browse the product catalog. Check the debug banner at the bottom. Everything is green.
2. **The App Crash**:
   - Go to the **Observability Dashboard**.
   - Click **Force Crash (Process Exit)**.
   - The app container will stop or restart (depending on compose settings, but here it just dies).
3. **Observation**:
   - Try to navigate to a new page or refresh.
   - Instead of a browser "Unable to connect" error or a white screen, you should see the **Penguin Maintenance Page**.
   - This is because Nginx is still running and "intercepts" the 502 Bad Gateway error from the dead backend.

## Questions
- Why is a custom maintenance page better for user experience than a raw 502 error?
- In this setup, we have 1 Nginx and 1 App. Is this a High Availability setup?
- If the Nginx container itself crashes, will you still see the penguin?

## Bonus
Try to manually run a second instance of the app on a different port and change `nginx.conf` to point to it!
