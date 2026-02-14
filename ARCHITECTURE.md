# Wanderlust Architecture

Below is a high-level architecture diagram for the Wanderlust project, illustrating the main components and their interactions.

---

```mermaid
graph TD
    A[Client (Browser)]
    B[Express Server (app.js)]
    C[Models]
    D[Views]
    E[Utils]
    F[Database]
    G[Static Assets]

    A -->|Requests| B
    B -->|Renders| D
    B -->|Uses| C
    B -->|Uses| E
    B -->|Serves| G
    C -->|CRUD| F
    D -->|EJS Templates| A
    G -->|CSS/JS| A
```

---

## Components
- **Client (Browser):** Sends requests and receives rendered pages and static assets.
- **Express Server (app.js):** Handles routing, middleware, and business logic.
- **Models:** Mongoose schemas for listings and reviews, interact with the database.
- **Views:** EJS templates for rendering pages.
- **Utils:** Utility functions for error handling and async operations.
- **Database:** Stores listings and reviews.
- **Static Assets:** CSS and JS files served to the client.

## Flow
1. Client sends a request to the server.
2. Server processes the request, interacts with models and utilities.
3. Server renders views or serves static assets.
4. Data is fetched/stored in the database via models.
5. Client receives the response (HTML, CSS, JS).

---

*This diagram is generated using Mermaid.js. For editing, copy the code block above into a Mermaid editor.*
