# LAB 1: Single Point of Failure (SPOF)

## Objective
Observe how a single server handles traffic and what happens when it is overwhelmed or crashes.

## Setup
Run the lab:
```bash
docker compose -f docker-compose.lab1.yml up --build
```

Access the app at: `http://localhost:3000`

## Steps
1. **Login**: Go to the login page and enter a name.
2. **Explore**: Browse the catalog and add items to your cart.
3. **Storm**: Navigate to `/storm`.
    - Set RPS to 20, VUs to 10.
    - Click **START STORM**.
4. **Observe**: Check the `/dashboard`.
    - Notice the **Queue Depth** increasing.
    - Notice the **Latency** increasing.
    - If queue depth > 50, you will see **503 Service Unavailable** errors.

## Failure Scenario
1. Go to the dashboard and click **Crash Process**.
2. Try to refresh any page.
3. The application is completely down. This is a **Single Point of Failure**.

## Questions
- What happened to the latency when you increased the storm load?
- After the crash, can you still see your cart? (No, the server is dead).
