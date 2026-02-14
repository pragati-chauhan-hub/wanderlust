# Wanderlust Architecture

Below is a high-level architecture diagram for the Wanderlust project, illustrating the main components and their interactions.



Below is a high-level architecture diagram for the Wanderlust project, using lines and boxes to illustrate the main components and their interactions.

-----


graph LR
    Client[Client (Browser)]
    Server[Express Server (app.js)]
    Models[Models]
    Views[Views]
    Utils[Utils]
    Database[Database]
    StaticAssets[Static Assets]

    Client ---|Requests| Server
    Server ---|Renders| Views
    Server ---|Uses| Models
    Server ---|Uses| Utils
    Server ---|Serves| StaticAssets
    Models ---|CRUD| Database
    Views ---|EJS Templates| Client
    StaticAssets ---|CSS/JS| Client


-----

## Components

## Flow
1. Client sends a request to the server.
2. Server processes the request, interacts with models and utilities.
3. Server renders views or serves static assets.
4. Data is fetched/stored in the database via models.
5. Client receives the response (HTML, CSS, JS).


*This diagram is generated using Mermaid.js. For editing, copy the code block above into a Mermaid editor.*
