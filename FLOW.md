# Wanderlust — Application Flow

This document describes the end-to-end request/response flow for every feature in the application.

---

## 1. Server Startup Flow

```
node app.js
    │
    ├── mongoose.connect("mongodb://127.0.0.1:27017/wanderlust")
    │       └── Success → "connected to DB"
    │       └── Failure → logs error
    │
    ├── Register Middleware
    │       ├── ejsMate engine
    │       ├── express.urlencoded({ extended: true })
    │       ├── methodOverride("_method")
    │       └── express.static("public/")
    │
    ├── Register Routes (all inline in app.js)
    │
    ├── Register 404 Catch-All
    │        app.all(/.*/) → ExpressError(404)
    │
    ├── Register Global Error Handler
    │
    └── app.listen(8080) → "server is listening to port 8080"
```

---

## 2. Database Seeding Flow

Run once to populate the database with sample listings.

```
node init/index.js
    │
    ├── Connect to MongoDB
    │
    ├── Listing.deleteMany({})       ← Wipe all existing listings
    │
    ├── Listing.insertMany(initData.data)   ← Insert ~47 sample listings
    │           (from init/data.js)
    │
    └── "data was initialized"
```

---

## 3. Listings — Browse All

**`GET /listings`**

```
Browser: GET /listings
    │
    ▼
Express Route Handler (wrapAsync)
    │
    ├── Listing.find({})                    ← Fetch all listings from MongoDB
    │
    └── res.render("listings/index.ejs", { allListings })
            │
            └── boilerplate.ejs (layout)
                    ├── navbar.ejs
                    ├── listings/index.ejs  ← Renders listing cards
                    └── footer.ejs
                            │
                            ▼
                    Browser displays all listings
```

---

## 4. Listing — Create New

### Step 1: Load the Create Form

**`GET /listings/new`**

```
Browser: GET /listings/new
    │
    ▼
Route Handler
    │
    └── res.render("listings/new.ejs")
            │
            └── Browser shows blank create form
```

### Step 2: Submit the Form

**`POST /listings`**

```
Browser: POST /listings  (form submit)
    │
    ▼
validateListing Middleware
    │
    ├── Joi validates req.body.listing
    │       └── FAIL → ExpressError(400, errMsg) → Error Handler
    │       └── PASS → next()
    │
    ▼
Route Handler (wrapAsync)
    │
    ├── Destructure { title, description, image, price, country, location }
    │
    ├── new Listing({ ...fields, image: { url, filename: "listingimage" } })
    │
    ├── newListing.save()                   ← Persist to MongoDB
    │
    └── res.redirect("/listings")           ← Back to all listings
```

---

## 5. Listing — View Single

**`GET /listings/:id`**

```
Browser: GET /listings/:id
    │
    ▼
Route Handler (wrapAsync)
    │
    ├── Listing.findById(id).populate("reviews")
    │       ├── Not found → res.send("Listing not found!")
    │       └── Found → listing document with reviews array populated
    │
    └── res.render("listings/show.ejs", { listing })
            │
            └── Browser shows listing details + all reviews
```

---

## 6. Listing — Edit

### Step 1: Load the Edit Form

**`GET /listings/:id/edit`**

```
Browser: GET /listings/:id/edit
    │
    ▼
Route Handler (wrapAsync)
    │
    ├── Listing.findById(id).populate("reviews")
    │       └── Not found → res.send("Listing not found!")
    │
    └── res.render("listings/edit.ejs", { listing })
            │
            └── Browser shows pre-filled edit form
```

### Step 2: Submit the Edit Form

**`PUT /listings/:id`**  *(sent as POST with `_method=PUT`)*

```
Browser: POST /listings/:id?_method=PUT  (form submit)
    │
    ▼
methodOverride Middleware
    │
    └── Converts to PUT request
    │
    ▼
validateListing Middleware
    │
    ├── Joi validates req.body.listing
    │       └── FAIL → ExpressError(400) → Error Handler
    │       └── PASS → next()
    │
    ▼
Route Handler (wrapAsync)
    │
    ├── Listing.findById(id)
    │       └── Not found → res.send("Listing not found!")
    │
    ├── Check if new image URL provided
    │       ├── YES → set image: { url, filename: "listingimage" }
    │       └── NO  → delete image key (keep existing)
    │
    ├── Listing.findByIdAndUpdate(id, updatedData)
    │
    └── res.redirect(`/listings/${id}`)    ← Back to show page
```

---

## 7. Listing — Delete

**`DELETE /listings/:id`**  *(sent as POST with `_method=DELETE`)*

```
Browser: POST /listings/:id?_method=DELETE  (form submit)
    │
    ▼
methodOverride Middleware
    │
    └── Converts to DELETE request
    │
    ▼
Route Handler (wrapAsync)
    │
    ├── Listing.findByIdAndDelete(id)       ← Remove from MongoDB
    │
    └── res.redirect("/listings")           ← Back to all listings
```

> **Note:** Reviews associated with the deleted listing are **not** currently cascade-deleted.

---

## 8. Review — Create

**`POST /listings/:id/reviews`**

```
Browser: POST /listings/:id/reviews  (review form submit)
    │
    ▼
validateReview Middleware
    │
    ├── Joi validates req.body.review
    │       └── FAIL → ExpressError(400) → Error Handler
    │       └── PASS → next()
    │
    ▼
Route Handler (wrapAsync)
    │
    ├── Listing.findById(req.params.id)     ← Find the parent listing
    │
    ├── new Review(req.body.review)         ← Create Review document
    │
    ├── listing.reviews.push(newReview)     ← Link review to listing
    │
    ├── newReview.save()                    ← Persist review
    ├── listing.save()                      ← Persist updated listing
    │
    └── res.redirect(`/listings/${listing._id}`)   ← Back to show page
```

---

## 9. Error Handling Flow

### Validation Error (400)

```
Request
    │
    ▼
validateListing / validateReview
    │
    ├── Joi.validate() fails
    │
    └── throw new ExpressError(400, "error message")
            │
            ▼
    Global Error Handler
            │
            └── res.status(400).render("error", { err })
```

### Async Route Error (e.g., DB failure)

```
Route Handler wrapped in wrapAsync
    │
    ├── fn(req, res, next) throws or rejects
    │
    └── .catch(next) → next(err)
            │
            ▼
    Global Error Handler
            │
            └── res.status(err.statusCode || 500).render("error", { err })
```

### 404 Not Found

```
Request for unknown path (e.g., GET /xyz)
    │
    ▼
app.all(/.*/)
    │
    └── next(new ExpressError(404, "Page not found!"))
            │
            ▼
    Global Error Handler
            │
            └── res.status(404).render("error", { err })
```

---

## 10. Static Asset Flow

```
Browser requests CSS/JS (e.g., GET /css/style.css)
    │
    ▼
express.static("public/")
    │
    └── Serves public/css/style.css directly (no route handler involved)
```

---

## 11. View Rendering Flow

All dynamic pages use ejs-mate's layout system:

```
res.render("listings/show.ejs", { listing })
    │
    ▼
ejs-mate resolves layout: "layouts/boilerplate.ejs"
    │
    ├── Injects <head>, Bootstrap/CSS links
    ├── Renders <%- include('../includes/navbar.ejs') %>
    ├── Renders <%- body %>    ← listings/show.ejs content goes here
    └── Renders <%- include('../includes/footer.ejs') %>
            │
            ▼
    Complete HTML sent to browser
```

---

## Summary — Route to View Map

| Route                      | View Rendered             |
|----------------------------|---------------------------|
| `GET /listings`            | `listings/index.ejs`      |
| `GET /listings/new`        | `listings/new.ejs`        |
| `GET /listings/:id`        | `listings/show.ejs`       |
| `GET /listings/:id/edit`   | `listings/edit.ejs`       |
| `POST /listings`           | redirect → `/listings`    |
| `PUT /listings/:id`        | redirect → `/listings/:id`|
| `DELETE /listings/:id`     | redirect → `/listings`    |
| `POST /listings/:id/reviews` | redirect → `/listings/:id`|
| Any unknown route          | `error.ejs` (404)         |
| Any server error           | `error.ejs` (500)         |
