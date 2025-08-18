Meal Mate is a full-stack meal planning and recipe management tool. It lets you save recipes, organize them into folders, generate smart meal plans, and automatically build consolidated grocery lists. Recipes can be extracted from the web, entered manually, or generated via AI.

Features
* Recipe Management
    * Save recipes from URLs or enter manually.
    * Organize recipes into user-defined folders (e.g., Breakfast, Desserts).
    * View, move, rename, or delete recipes and folders.
* Smart Recipe Extraction
    * Uses recipe-scrapers to pull recipes from popular cooking sites.
    * Falls back to Google Gemini AI when scraping fails, extracting name, serving size, ingredients, and instructions.
* Meal Planning & Grocery Lists
    * Select multiple recipes to build a meal plan with start and end dates.
    * Ingredients are parsed and consolidated intelligently (units standardized, duplicates merged).
    * Save and manage grocery lists tied to meal plans.
* Search Recipes
    * Search through your saved collection with keyword matching.
    * Generate new authentic recipes directly with Gemini AI (no web scraping needed).
* Authentication & User Data
    * Simple demo login (with optional Replit Auth / Google OAuth).
    * Each user has their own user_data directory with saved recipes and folders.

Tech Stack
* Backend: Flask, Flask-SQLAlchemy, Flask-Login, Flask-Dance
* Database: PostgreSQL (via SQLAlchemy)
* AI Integration: Google Gemini (Generative AI API)
* Recipe Parsing: recipe-scrapers, beautifulsoup4, trafilatura
* Models: Pydantic for schema validation
* Frontend: HTML templates (Jinja2) served by Flask

Usage
Web App
* Log in as a demo user.
* Add recipes via URL or manual entry.
* Organize them into folders.
* Create a meal plan → generate a grocery list → save it.

CLI Mode
You can also run the CLI version:
python main.py
It supports:
1. Extract recipe from URL
2. Enter recipe manually
3. Create meal plan & grocery list
4. View saved recipes

Project Structure
meal-prep-app/
│── app.py                 # Flask app & API routes
│── main.py                # CLI entry point
│── models.py              # Database models
│── recipe_extractor.py    # Recipe extraction (Gemini + scrapers)
│── recipe_extractor_simple.py # Lightweight scraper-only extractor
│── meal_planner.py        # Meal plan + grocery list logic
│── smart_recipe_search.py # Search saved/web recipes with AI
│── folder_manager.py      # Manage recipe folders
│── folders.json           # Example folder structure
│── pyproject.toml         # Dependencies & config
│── user_data/             # Per-user saved recipes

Future Enhancements
* Make available for Mobile devices via App Store (Apple & Google)
* UI for drag-and-drop meal planning.
* Nutrition info & calorie tracking.
* Export grocery lists to Instacart / Amazon Fresh.
* More robust unit conversions for ingredients.

You can access the prototype here: Meal-Mate.replit.app

## 👨‍💻 Author
Built by Mira Kapoor Wadehra (https://github.com/mirakw).
