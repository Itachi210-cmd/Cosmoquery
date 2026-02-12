from flask import Flask, render_template, jsonify, request
import pandas as pd
import os

app = Flask(__name__)

# --- Data Loading ---
DATA_PATH = os.path.join('dataset1', 'exoplanets.csv')

def load_data():
    try:
        # Load specific columns to save memory and parsing time
        # Select relevant columns: pl_name, discoverymethod, disc_year, hostname, pl_rade, pl_bmasse, pl_orbper, disc_facility, pl_insol, pl_eqt
        cols = [
            'pl_name', 'discoverymethod', 'disc_year', 'hostname', 
            'pl_rade', 'pl_bmasse', 'pl_orbper', 'disc_facility',
            'pl_insol', 'pl_eqt'
        ]
        
        # skiprows to handle comments naturally if they start with #. 
        # But we know the header starts with 'pl_name'. 
        # Let's find header row index first for safely.
        header_row = 0
        with open(DATA_PATH, 'r', encoding='utf-8') as f:
            for i, line in enumerate(f):
                if line.strip().startswith('pl_name'):
                    header_row = i
                    break
        
        df = pd.read_csv(DATA_PATH, header=header_row, usecols=lambda c: c in cols)
        
        # Clean data
        df['disc_year'] = df['disc_year'].fillna(0).astype(int).astype(str).replace('0', 'Unknown')
        df = df.fillna('') # Replace NaNs with empty string for JSON compatibility
        
        print(f"Loaded {len(df)} rows from {DATA_PATH}")
        return df
    except Exception as e:
        print(f"Error loading data: {e}")
        return pd.DataFrame()

# Initialize Data (Global for read-only access)
df = load_data()

# --- Routes ---

@app.route('/')
def landing():
    return render_template('landing.html')

@app.route('/dashboard')
def dashboard():
    return render_template('index.html')

@app.route('/blackholes')
def blackholes():
    return render_template('blackholes.html')

@app.route('/api/data')
def get_data():
    """
    Returns filtered and paginated data.
    Query Params: year, method, facility, host, page, per_page, sort_col, sort_dir
    """
    global df
    filtered_df = df.copy()
    
    # 1. Filtering
    year = request.args.get('year')
    method = request.args.get('method')
    facility = request.args.get('facility')
    host = request.args.get('host')
    
    if year and year != 'All Years':
        filtered_df = filtered_df[filtered_df['disc_year'] == year]
    
    if method and method != 'All Methods':
        filtered_df = filtered_df[filtered_df['discoverymethod'] == method]
        
    if facility and facility != 'All Facilities':
        filtered_df = filtered_df[filtered_df['disc_facility'] == facility]
        
    if host:
        filtered_df = filtered_df[filtered_df['hostname'].str.contains(host, case=False, na=False)]

    # 2. Sorting
    sort_col = request.args.get('sort_col')
    sort_dir = request.args.get('sort_dir', 'asc')
    
    if sort_col and sort_col in filtered_df.columns:
        ascending = sort_dir == 'asc'
        # Convert to numeric for sorting if applicable
        try:
            filtered_df = filtered_df.sort_values(by=sort_col, ascending=ascending)
        except:
             filtered_df = filtered_df.sort_values(by=sort_col, ascending=ascending)

    # 3. Pagination
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 10))
    
    total = len(filtered_df)
    start = (page - 1) * per_page
    end = start + per_page
    
    data = filtered_df.iloc[start:end].to_dict(orient='records')
    
    return jsonify({
        'data': data,
        'total': total,
        'page': page,
        'per_page': per_page,
        'pages': (total // per_page) + (1 if total % per_page > 0 else 0)
    })

@app.route('/api/filters')
def get_filters():
    """Returns unique values for dropdowns."""
    global df
    return jsonify({
        'years': sorted(df['disc_year'].unique().tolist(), reverse=True),
        'methods': sorted(df['discoverymethod'].unique().tolist()),
        'facilities': sorted(df['disc_facility'].unique().tolist())
    })

@app.route('/api/stats')
def get_stats():
    """Returns aggregated stats for charts."""
    global df
    # Filtered stats could be implemented by passing query params here too, 
    # but for consistent dashboard behavior, usually charts reflect the current filters.
    # Re-using the filter logic?
    
    # For now, let's just return stats based on current filters (we need to duplicate filter logic or refactor)
    # Refactoring filter logic to a helper function is better.
    
    # ... (Re-applying filters for simplicity in this artifact)
    filtered_df = df.copy()
    year = request.args.get('year')
    method = request.args.get('method')
    facility = request.args.get('facility')
    host = request.args.get('host')
    
    if year and year != 'All Years':
        filtered_df = filtered_df[filtered_df['disc_year'] == year]
    if method and method != 'All Methods':
        filtered_df = filtered_df[filtered_df['discoverymethod'] == method]
    if facility and facility != 'All Facilities':
        filtered_df = filtered_df[filtered_df['disc_facility'] == facility]
    if host:
        filtered_df = filtered_df[filtered_df['hostname'].str.contains(host, case=False, na=False)]
        
    # Trends (Decades)
    years = pd.to_numeric(filtered_df['disc_year'], errors='coerce')
    decades = (years // 10) * 10
    trends = decades.value_counts().sort_index().to_dict()
    
    return jsonify({
        'trends': trends,
        'total': len(filtered_df)
    })

# --- Black Hole Data Loading ---
BH_DATA_PATH = os.path.join(os.path.dirname(__file__), 'dataset1', 'blackholes.csv')

def load_blackholes():
    try:
        if not os.path.exists(BH_DATA_PATH):
            return []
        
        bh_df = pd.read_csv(BH_DATA_PATH)
        bh_df = bh_df.fillna('')
        
        # Map CSV columns to frontend expected keys
        # Frontend expects: name, mass, distance, type, constellation
        mapped_data = []
        for _, row in bh_df.iterrows():
            mapped_data.append({
                "name": row['bh_name'],
                "mass": f"{row['mass_solar']} M☉",
                "distance": f"{row['distance_ly']} ly",
                "type": row['bh_type'],
                "constellation": row['host_galaxy'] # Mapping Host Galaxy to Constellation column for now
            })
            
        return mapped_data
    except Exception as e:
        print(f"Error loading black holes: {e}")
        return []

@app.route('/api/blackholes')
def get_blackholes():
    data = load_blackholes()
    return jsonify(data)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
