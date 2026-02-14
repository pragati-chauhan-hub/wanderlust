# Wanderlust

Wanderlust is a Node.js web application for listing and reviewing travel destinations. It allows users to browse, create, edit, and review listings, providing a platform for sharing travel experiences.

## Features
- Browse travel listings
- Add new listings
- Edit and delete listings
- Submit and view reviews
- Error handling and async utilities

## Project Structure
```
wanderlust/
├── app.js                # Main application entry point
├── schema.js             # Schema definitions
├── init/                 # Initialization scripts
│   ├── data.js           # Seed data
│   └── index.js          # Initialization logic
├── models/               # Mongoose models
│   ├── listing.js        # Listing model
│   └── review.js         # Review model
├── public/               # Static assets
│   ├── css/
│   │   └── style.css     # Stylesheets
│   └── js/
│       └── script.js     # Client-side scripts
├── utils/                # Utility functions
│   ├── ExpressError.js   # Custom error class
│   └── wrapAsync.js      # Async wrapper
├── views/                # EJS templates
│   ├── error.ejs         # Error page
│   ├── includes/         # Shared partials
│   │   ├── footer.ejs
│   │   └── navbar.ejs
│   ├── layouts/          # Layout templates
│   │   └── boilerplate.ejs
│   └── listings/         # Listing views
│       ├── edit.ejs
│       ├── index.ejs
│       ├── new.ejs
│       └── show.ejs
├── package.json          # Project metadata and dependencies
├── LICENSE               # License information
└── README.md             # Project documentation
```

## Setup
1. Clone the repository:
	```bash
	git clone <repo-url>
	```
2. Install dependencies:
	```bash
	npm install
	```
3. Start the application:
	```bash
	node app.js
	```

## Architecture
See [ARCHITECTURE.md](ARCHITECTURE.md) for a visual diagram and explanation.

## License
This project is licensed under the MIT License.