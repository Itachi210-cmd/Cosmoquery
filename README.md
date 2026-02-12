# CosmoQuery: Unified Space Science Research Dashboard 🌌

**CosmoQuery** is a high-performance, cinematic data visualization dashboard for exploring the universe's most intriguing objects: **Exoplanets** and **Black Holes**. 

Built with **Flask** and **Vanilla JavaScript**, it processes large astronomical datasets (NASA Exoplanet Archive) to provide real-time filtering, interactive visualizations, and a "Deep Space" immersive experience.


## ✨ Key Features

### 🪐 Exoplanet Research Portal
*   **Massive Data Handling**: Efficiently parses and displays 30,000+ rows of exoplanet data using server-side chunking and lazy loading.
*   **Interactive Visualizations**:
    *   **Discovery Trends**: Dynamic line chart tracking exoplanet discoveries by decade.
    *   **Detection Methods**: Donut chart visualizing the most successful verification techniques (Transit, Radial Velocity, etc.).
*   **Advanced Filtering**: Filter by Discovery Year, Method, Host Star, and Facility with real-time updates.
*   **Habitability Calculator**: Estimates the potential habitability of an exoplanet based on its radius, flux, and equilibrium temperature.
*   **Planetary Comparison**: Compare up to 3 exoplanets side-by-side.

### 🕳️ Black Hole Research Portal
*   **Dedicated Module**: A specialized interface for black hole data, featuring a "Singularity" theme.
*   **Catalog**: detailed list of confirmed black holes with properties like Mass (Solar Masses), Distance, and Type.
*   **Visual Distributions**: Charts showing Mass Distribution and Observatory contributions.

### 🎨 Immersive Experience
*   **Cinematic Design**: Glassmorphism UI, "Deep Space" particle effects, and CSS-driven animations.
*   **Mobile Optimized**: Fully responsive layout with card-based views for smaller screens.
*   **Performance First**: Sub-second load times even with heavy datasets.

## 🛠️ Tech Stack

*   **Backend**: Python (Flask), Pandas
*   **Frontend**: HTML5, CSS3 (TailwindCSS), Vanilla JavaScript
*   **Data**: NASA Exoplanet Archive, Custom Black Hole Catalog (CSV)
*   **Design**: Custom "Space Grotesk" typography, Material Symbols

## 🚀 Installation & Setup

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/yourusername/cosmoquery.git
    cd cosmoquery
    ```

2.  **Create a Virtual Environment**
    ```bash
    # Windows
    python -m venv venv
    venv\Scripts\activate

    # macOS/Linux
    python3 -m venv venv
    source venv/bin/activate
    ```

3.  **Install Dependencies**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Run the Application**
    ```bash
    python app.py
    ```

5.  **Access the Dashboard**
    Open your browser and navigate to `http://127.0.0.1:5000`

## 📂 Project Structure

```
CosmoQuery/
├── app.py              # Main Flask application entry point
├── requirements.txt    # Python dependencies
├── dataset1/           # Data files (CSVs)
│   ├── exoplanets.csv
│   └── blackholes.csv
├── static/             # Static assets
│   ├── style.css       # Global styles & Tailwind overrides
│   ├── script.js       # Main dashboard logic
│   ├── blackholes.js   # Black hole module logic
│   └── particles.js    # Background animation logic
└── templates/          # HTML Templates
    ├── landing.html    # Cinematic entry page
    ├── index.html      # Main Exoplanet Dashboard
    └── blackholes.html # Black Hole Portal
```

## 🔒 Security Note
This project is configured for secure deployment. 
*   `.gitignore` is set up to exclude system files, virtual environments, and cache.
*   No API keys are required for the core functionality as it runs on local datasets.

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

---
*Created by [Sujal Kate] - 2026*
