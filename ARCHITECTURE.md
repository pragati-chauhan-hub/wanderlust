# Wanderlust — Architecture

Wanderlust is a full-stack Node.js web application that lets users browse, create, edit, and delete travel property listings, as well as leave reviews. It follows the **MVC (Model-View-Controller)** pattern.

---

## Tech Stack

| Layer        | Technology                           |
|--------------|--------------------------------------|
| Runtime      | Node.js                              |
| Framework    | Express.js v5                        |
| Database     | MongoDB (local) via Mongoose v8      |
| Templating   | EJS + ejs-mate (layout engine)       |
| Validation   | Joi                                  |
| HTTP Helpers | method-override (PUT/DELETE in forms)|
| Styling      | Custom CSS (`public/css/style.css`)  |
| Client JS    | `public/js/script.js`                |

---

## Directory Structure

```
wanderlust/
├── app.js                  # Entry point: server, middleware, routes, error handlers
├── schema.js               # Joi validation schemas (listingSchema, reviewSchema)
├── package.json
│
├── models/
│   ├── listing.js          # Mongoose model — Listing
│   └── review.js           # Mongoose model — Review
│
├── views/
│   ├── layouts/
│   │   └── boilerplate.ejs # Master layout (head, navbar, footer wrappers)
│   ├── includes/
│   │   ├── navbar.ejs      # Navigation bar partial
│   │   └── footer.ejs      # Footer partial
│   ├── listings/
│   │   ├── index.ejs       # All listings page
│   │   ├── show.ejs        # Single listing detail page
│   │   ├── new.ejs         # Create listing form
│   │   └── edit.ejs        # Edit listing form
│   └── error.ejs           # Error display page
│
├── utils/
│   ├── wrapAsync.js        # Wraps async route handlers, forwards errors to next()
│   └── ExpressError.js     # Custom error class with statusCode + message
│
├── public/
│   ├── css/style.css       # Global stylesheet
│   └── js/script.js        # Client-side JavaScript
│
└── init/
    ├── data.js             # Seed data — array of sample listings
    └── index.js            # DB seeding script (clears + inserts sample data)
```

---

## Core Components

### 1. `app.js` — Application Entry Point
- Connects to MongoDB at `mongodb://127.0.0.1:27017/wanderlust`
- Registers global middleware: EJS engine, URL parser, method-override, static files
- Defines all route handlers inline (Listings CRUD + Reviews)
- Registers the 404 catch-all and global error handler at the bottom

### 2. Models

#### `models/listing.js`
Represents a travel property listing.

| Field         | Type              | Notes                        |
|---------------|-------------------|------------------------------|
| `title`       | String            |                              |
| `description` | String            |                              |
| `price`       | Number            |                              |
| `location`    | String            |                              |
| `country`     | String            |                              |
| `image`       | `{url, filename}` | Stores URL + filename        |
| `reviews`     | `[ObjectId]`      | References to Review docs    |

#### `models/review.js`
Represents a user review on a listing.

| Field       | Type   | Notes                  |
|-------------|--------|------------------------|
| `comment`   | String |                        |
| `rating`    | Number | Min: 1, Max: 5         |
| `createdAt` | Date   | Defaults to `Date.now` |

### 3. `schema.js` — Joi Validation
Defines server-side validation schemas used as middleware before database operations:
- **`listingSchema`** — validates `title`, `description`, `price`, `country`, `location`, optional `image`
- **`reviewSchema`** — validates `comment` and `rating` on review submissions

### 4. `utils/wrapAsync.js` — Async Error Wrapper
Wraps every async route handler so that any rejected promise is automatically passed to `next(err)` instead of crashing the server.

```js
module.exports = (fn) => (req, res, next) => fn(req, res, next).catch(next);
```

### 5. `utils/ExpressError.js` — Custom Error Class
Extends the native `Error` class with a `statusCode` property, enabling structured HTTP error responses.

```js
class ExpressError extends Error {
    constructor(statusCode, message) { ... }
}
```

### 6. Views (EJS Templates)
- All views extend `layouts/boilerplate.ejs` via ejs-mate
- `boilerplate.ejs` injects `navbar.ejs` and `footer.ejs` partials automatically
- Listing views handle listing cards, forms, and the detail/show page

### 7. `init/` — Database Seeder
- `data.js` exports an array of ~47 sample listing objects with Unsplash image URLs
- `index.js` connects to MongoDB, drops all existing listings, and inserts the sample data
- Run once with: `node init/index.js`

---

## Routes Overview

| Method | Path                    | Handler Description           | Validation        |
|--------|-------------------------|-------------------------------|-------------------|
| GET    | `/`                     | Root health check             | —                 |
| GET    | `/listings`             | Show all listings             | —                 |
| GET    | `/listings/new`         | Render create listing form    | —                 |
| POST   | `/listings`             | Create new listing            | `validateListing` |
| GET    | `/listings/:id`         | Show single listing + reviews | —                 |
| GET    | `/listings/:id/edit`    | Render edit listing form      | —                 |
| PUT    | `/listings/:id`         | Update listing                | `validateListing` |
| DELETE | `/listings/:id`         | Delete listing                | —                 |
| POST   | `/listings/:id/reviews` | Add review to listing         | `validateReview`  |

---

## Error Handling Pipeline

```
Route Handler
    │
    ▼
wrapAsync(fn) ──(catch)──► next(err)
                                │
                                ▼
                    ExpressError (statusCode, message)
                                │
                                ▼
                    Global Error Handler (app.js)
                    res.status(statusCode).render("error", { err })
```

- If no route matches → `app.all(/.*/)` fires `new ExpressError(404, "Page not found!")`
- All async errors are forwarded via `wrapAsync`
- The global error handler renders `views/error.ejs`

---

## Data Relationships

```
Listing  1 ──────────────── * Review
         (reviews: [ObjectId])
         (populated with .populate("reviews"))
```

Each `Listing` document stores an array of `Review` ObjectIds. When fetching a listing, `.populate("reviews")` is called to replace IDs with full review documents.

---

## Component Interaction Diagram

```
Browser
  │
  │  HTTP Request (GET / POST / PUT / DELETE)
  ▼
Express Router (app.js)
  │
  ├──► Middleware
  │     ├── express.urlencoded()   — Parse form bodies
  │     ├── methodOverride()       — Support _method for PUT/DELETE
  │     └── express.static()       — Serve public/ assets
  │
  ├──► Validation Middleware (validateListing / validateReview)
  │         │ Joi validates req.body against schema
  │         └── on fail → ExpressError(400) → Global Error Handler
  │
  ├──► Route Handler (wrapped in wrapAsync)
  │         │
  │         ├──► Mongoose Model (Listing / Review)
  │         │         │
  │         │         └──► MongoDB (localhost:27017/wanderlust)
  │         │
  │         └──► res.render(view, data)  or  res.redirect(path)
  │
  ├──► EJS View rendered via ejs-mate
  │     ├── layouts/boilerplate.ejs  (master layout)
  │     ├── includes/navbar.ejs
  │     ├── includes/footer.ejs
  │     └── listings/*.ejs  /  error.ejs
  │
  └──► HTTP Response sent to Browser
```
