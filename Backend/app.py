# Unicorn PC Builder - Main Application
# This application helps users build custom PCs with three modes:
# 1. Intelligent Build - AI recommends PC based on budget and needs
# 2. Manual Build - User selects each component manually
# 3. Performance Prediction - Predicts gaming FPS and performance

from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import pandas as pd
import joblib
import os
import numpy as np

# Try to import Firebase for Manual Build database
# Firebase stores all hardware components (CPU, GPU, RAM, etc.)
try:
    import firebase_admin
    from firebase_admin import credentials, firestore
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False
    print("Warning: Firebase not available. Manual Build will use mock data.")

app = Flask(__name__)
CORS(app)

# ============================================================================
# DATA LOADING - Load all necessary files
# ============================================================================

# Load dataset for AI recommendations (contains pre-built PC configurations)
try:
    intelligent_df = pd.read_csv('data/final_ruleset_data.csv')
    print("SUCCESS: Intelligent Build data loaded successfully")
except FileNotFoundError:
    print("ERROR: 'data/final_ruleset_data.csv' not found")
    intelligent_df = None

# Also load the full dataset for exact FPS lookups
try:
    fps_lookup_df = pd.read_csv('data/final_ruleset_data.csv')
    print("SUCCESS: FPS lookup data loaded successfully")
except FileNotFoundError:
    print("ERROR: FPS lookup data not found")
    fps_lookup_df = None

# Load machine learning models for performance prediction
# These models predict FPS, gaming suitability, and rendering performance
MODEL_DIR = 'models'
fps_model = gaming_model = render_model = None
try:
    # Try loading with protocol 4 for better compatibility
    import pickle
    with open(os.path.join(MODEL_DIR, 'fps_model.pkl'), 'rb') as f:
        fps_model = pickle.load(f)
    with open(os.path.join(MODEL_DIR, 'gaming_model.pkl'), 'rb') as f:
        gaming_model = pickle.load(f)
    with open(os.path.join(MODEL_DIR, 'render_model.pkl'), 'rb') as f:
        render_model = pickle.load(f)
    print("SUCCESS: ML Models loaded successfully (Python 3.13 compatible)")
except Exception as e:
    print(f"WARNING: Error loading models: {e}")
    print("WARNING: Performance prediction will use simplified calculations")
    fps_model = gaming_model = render_model = None

# ============================================================================
# HELPER FUNCTION - Find exact FPS from CSV data
# ============================================================================

def find_exact_fps_from_csv(cpu_score, gpu_score, ram_gb, resolution_name):
    """
    Try to find exact FPS match from CSV data.
    Returns FPS if exact match found, None otherwise.
    """
    if fps_lookup_df is None:
        return None
    
    # CSV stores resolutions as strings: "1080P", "1440P", "4K"
    # We need to convert our input format to match
    resolution_csv_format = resolution_name.upper().replace('P', 'P')  # "1080p" -> "1080P"
    
    # Look for exact match (with small tolerance for floating point)
    tolerance = 0.1
    matches = fps_lookup_df[
        (abs(fps_lookup_df['cpu_score'] - cpu_score) < tolerance) &
        (abs(fps_lookup_df['gpu_score'] - gpu_score) < tolerance) &
        (fps_lookup_df['ram_gb'] == ram_gb) &
        (fps_lookup_df['resolution'] == resolution_csv_format)
    ]
    
    if len(matches) > 0:
        fps = matches.iloc[0]['fps']
        print(f"  ✓ CSV Exact Match: {resolution_name} = {fps} FPS")
        return int(fps)
    
    return None

# Load hardware scores database (contains performance scores for CPUs and GPUs)
# Used to calculate performance predictions
try:
    lookup_df = pd.read_csv('data/hardware_lookup.csv')
    lookup_df['clean_name'] = lookup_df['name'].astype(str).str.lower().str.replace(" ", "")
    hw_db = lookup_df.set_index('clean_name')['score'].to_dict()
    print("SUCCESS: Hardware lookup database loaded")
except FileNotFoundError:
    print("ERROR: 'data/hardware_lookup.csv' not found")
    hw_db = {}

# Initialize Firebase connection for Manual Build Mode
# Firebase stores all hardware components in cloud database
db = None
if FIREBASE_AVAILABLE:
    try:
        cred_path = 'serviceAccountKey.json'
        if os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            db = firestore.client()
            print("SUCCESS: Firebase Firestore connected successfully")
            print("SUCCESS: Manual Build will use real database")
        else:
            print("ERROR: serviceAccountKey.json not found")
            print("WARNING: Manual Build will NOT work without Firebase")
    except Exception as e:
        print(f"ERROR: Firebase initialization error: {e}")
        print("WARNING: Manual Build will NOT work without Firebase")
        db = None
else:
    print("ERROR: firebase-admin package not installed")
    print("WARNING: Run: pip install firebase-admin")

# ============================================================================
# HOMEPAGE ROUTE
# ============================================================================

# Main landing page - shows two build modes
@app.route('/')
def index():
    return render_template('index.html')

# ============================================================================
# INTELLIGENT BUILD MODE - AI recommends PC based on budget
# ============================================================================

# Show intelligent build page
@app.route('/intelligent-build')
def intelligent_build():
    return render_template('intelligent_build.html')

# Find best PC configuration based on user requirements
def get_recommendation(budget, resolution, use_case, fps=None):
    """Recommend PC based on budget, resolution, use case, and target FPS
    
    ENHANCED ALGORITHM - Finds EXACT MATCH for resolution & FPS target:
    1. Prioritize EXACT resolution match first (must match)
    2. For gaming with FPS target: find closest match to target FPS
    3. Select best build within budget that matches these criteria
    """
    if intelligent_df is None:
        return {"error": "Dataset not loaded"}
    
    # Define ranking strategy for each use case
    # Gaming focuses on GPU, Productivity on CPU, others on combined score
    use_case_logic = {
        'Gaming': {'filter_col': 'is_good_for_gaming', 'rank_by': 'gpu_score'},
        'Productivity': {'filter_col': 'is_good_for_productivity', 'rank_by': 'cpu_score'},
        'Design/Render': {'filter_col': 'is_good_for_design_render', 'rank_by': 'combined_score'},
        'Workstation': {'filter_col': 'is_good_for_workstation', 'rank_by': 'combined_score'}
    }

    if use_case not in use_case_logic:
        return {"error": f"Invalid use_case. Choose from {list(use_case_logic.keys())}"}

    logic = use_case_logic[use_case]
    
    # Step 1: Filter PCs suitable for selected use case
    use_case_df = intelligent_df[intelligent_df[logic['filter_col']] == 1].copy()
    if use_case_df.empty:
        return {"error": f"No PC found for '{use_case}' in dataset."}
    
    # Step 2: CRITICAL - Filter by EXACT resolution first (MUST MATCH)
    resolution_filtered = use_case_df[use_case_df['resolution'] == resolution].copy()
    if resolution_filtered.empty:
        return {
            "error": f"No {use_case} PC found for {resolution} resolution.",
            "suggestion": f"Try a different resolution. Available: {', '.join(use_case_df['resolution'].unique())}"
        }
    
    # Step 3: Filter by user's budget
    filtered_df = resolution_filtered[resolution_filtered['price'] <= budget].copy()
    if filtered_df.empty:
        # Show cheapest option for this resolution if budget is too low
        cheapest = resolution_filtered.sort_values('price').iloc[0]
        cheapest_price = int(cheapest['price'])
        shortage = cheapest_price - budget
        return {
            "error": f"No {use_case} PC found for {resolution} within ${budget} budget.",
            "suggestion": f"Cheapest {use_case} PC for {resolution} is ${cheapest_price} (shortage: ${shortage})"
        }
    
    # Step 4: ENHANCED FPS MATCHING - Find best match for target FPS
    if use_case == 'Gaming' and fps is not None:
        # Calculate FPS difference from target
        filtered_df['fps_diff'] = abs(filtered_df['fps'] - fps)
        
        # Strategy: Find builds that meet or slightly exceed the FPS target
        # Prefer builds close to target (not overly powerful = waste of budget)
        meets_target = filtered_df[filtered_df['fps'] >= fps].copy()
        
        if not meets_target.empty:
            # Found builds that meet target - select closest to target FPS
            meets_target = meets_target.sort_values('fps_diff')
            filtered_df = meets_target
        else:
            # No build meets target - get the highest FPS available
            max_fps_available = filtered_df['fps'].max()
            return {
                "error": f"Cannot achieve {fps} FPS at {resolution} within ${budget} budget.",
                "suggestion": f"Maximum achievable: {int(max_fps_available)} FPS at {resolution}. Increase budget or lower FPS target."
            }
    
    # Step 5: Rank remaining PCs and select the best one
    rank_col = logic['rank_by']
    if rank_col == 'combined_score':
        # Calculate combined CPU + GPU score
        filtered_df['combined_score'] = filtered_df['cpu_score'] + filtered_df['gpu_score']

    # For gaming with FPS target, prioritize closest FPS match over pure GPU score
    if use_case == 'Gaming' and fps is not None:
        # Sort by: 1) FPS difference (closest to target) 2) GPU score (higher is better)
        ranked_df = filtered_df.sort_values(by=['fps_diff', rank_col], ascending=[True, False])
    else:
        # Sort by performance score (higher is better)
        ranked_df = filtered_df.sort_values(by=rank_col, ascending=False)
    
    best_pc = ranked_df.iloc[0]
    
    recommendation = {
        'CPU': best_pc['cpu'],
        'GPU': best_pc['gpu'],
        'RAM': f"{best_pc['ram_gb']}GB",
        'Price': f"${best_pc['price']}",
        'Resolution': best_pc['resolution'],
        'CPU_Score': float(best_pc['cpu_score']),
        'GPU_Score': float(best_pc['gpu_score']),
        'FPS': int(best_pc['fps']) if use_case == 'Gaming' else None,
        'ram_gb': int(best_pc['ram_gb'])
    }
    
    return recommendation

# API: Get available options for dropdown menus
@app.route('/api/intelligent/options', methods=['GET'])
def intelligent_options():
    if intelligent_df is None:
        return jsonify({"error": "Dataset not loaded"})
    
    # Get all available resolutions and use cases
    resolutions = sorted(intelligent_df['resolution'].unique().tolist())
    use_cases = ['Gaming', 'Productivity', 'Design/Render', 'Workstation']
    
    return jsonify({
        'resolutions': resolutions,
        'use_cases': use_cases,
        'min_price': int(intelligent_df['price'].min()),
        'max_price': int(intelligent_df['price'].max())
    })

# API: Get PC recommendation based on user input
@app.route('/api/intelligent/recommend', methods=['POST'])
def intelligent_recommend():
    # Extract user requirements from request
    data = request.json
    budget = int(data.get('budget', 1000))
    resolution = data.get('resolution', '1080P')
    use_case = data.get('use_case', 'Gaming')
    fps = data.get('fps', None)
    
    if fps is not None:
        fps = int(fps)
    
    result = get_recommendation(budget, resolution, use_case, fps)
    return jsonify(result)

# ============================================================================
# MANUAL BUILD MODE - User selects each component step by step
# ============================================================================

# Show manual build page
@app.route('/manual-build')
def manual_build():
    return render_template('manual_build.html')

# API: Get CPUs from database filtered by brand (Intel or AMD)
@app.route("/api/manual/cpus", methods=["GET"])
def get_cpus():
    """Get list of CPUs for selected brand from Firebase database"""
    brand = request.args.get('brand')
    if not brand:
        return jsonify({"error": "Brand is required"}), 400
    
    if not db:
        return jsonify({"error": "Database not available"}), 500
    
    try:
        cpus_ref = db.collection('cpus')
        all_cpus = cpus_ref.stream()
        cpus = []
        
        for doc in all_cpus:
            cpu_data = doc.to_dict()
            # Filter by brand (check if brand name is in CPU name)
            if brand.lower() in cpu_data.get('Name', '').lower():
                cpu_data['id'] = doc.id
                cpus.append(cpu_data)
        
        return jsonify(cpus)
    except Exception as e:
        print(f"Error fetching CPUs: {e}")
        return jsonify({"error": f"Error fetching CPUs: {str(e)}"}), 500

# API: Get compatible motherboards based on CPU socket type
@app.route("/api/manual/motherboards", methods=["GET"])
def get_motherboards():
    """Get motherboards that match the selected CPU's socket"""
    socket = request.args.get('socket')
    if not socket:
        return jsonify({"error": "Socket is required"}), 400
    
    if not db:
        return jsonify({"error": "Database not available"}), 500
    
    try:
        query = db.collection('motherboards').where('Socket', '==', socket)
        motherboards = []
        
        for doc in query.stream():
            mb_data = doc.to_dict()
            mb_data['id'] = doc.id
            motherboards.append(mb_data)
        
        return jsonify(motherboards)
    except Exception as e:
        print(f"Error fetching Motherboards: {e}")
        return jsonify({"error": f"Error fetching Motherboards: {str(e)}"}), 500

# API: Get all available graphics cards
@app.route("/api/manual/gpus", methods=["GET"])
def get_gpus():
    """Get list of all GPUs from Firebase database"""
    if not db:
        return jsonify({"error": "Database not available"}), 500
    
    try:
        gpus_ref = db.collection('gpus')
        gpus = []
        
        for doc in gpus_ref.stream():
            gpu_data = doc.to_dict()
            gpu_data['id'] = doc.id
            gpus.append(gpu_data)
        
        return jsonify(gpus)
    except Exception as e:
        print(f"Error fetching GPUs: {e}")
        return jsonify({"error": f"Error fetching GPUs: {str(e)}"}), 500

# API: Get compatible RAM based on motherboard RAM type
@app.route("/api/manual/ram", methods=["GET"])
def get_ram():
    """Get RAM that matches motherboard's RAM type (DDR4/DDR5)"""
    ram_type = request.args.get('ram_type')
    if not ram_type:
        return jsonify({"error": "RAM Type is required"}), 400
    
    if not db:
        return jsonify({"error": "Database not available"}), 500
    
    try:
        query = db.collection('ram').where('RAM_Type', '==', ram_type)
        ram_list = []
        
        for doc in query.stream():
            ram_data = doc.to_dict()
            ram_data['id'] = doc.id
            ram_list.append(ram_data)
        
        return jsonify(ram_list)
    except Exception as e:
        print(f"Error fetching RAM: {e}")
        return jsonify({"error": f"Error fetching RAM: {str(e)}"}), 500

# API: Get compatible CPU coolers based on socket type
@app.route("/api/manual/coolers", methods=["GET"])
def get_coolers():
    """Get coolers that support the selected CPU socket"""
    socket = request.args.get('socket')
    if not socket:
        return jsonify({"error": "Socket is required"}), 400
    
    if not db:
        return jsonify({"error": "Database not available"}), 500
    
    try:
        coolers_ref = db.collection('coolers')
        # Query for coolers that support this socket (array-contains)
        query = coolers_ref.where(field_path='Supported_Sockets', op_string='array_contains', value=socket)
        coolers = []
        
        for doc in query.stream():
            cooler_data = doc.to_dict()
            cooler_data['id'] = doc.id
            coolers.append(cooler_data)
        
        return jsonify(coolers)
    except Exception as e:
        print(f"Error fetching Coolers: {e}")
        return jsonify({"error": f"Error fetching Coolers: {str(e)}"}), 500

# API: Get all storage options (SSD/HDD)
@app.route("/api/manual/storage", methods=["GET"])
def get_storage():
    """Get list of all storage devices from Firebase database"""
    if not db:
        return jsonify({"error": "Database not available"}), 500
    
    try:
        storage_list = []
        for doc in db.collection('storage').stream():
            storage_data = doc.to_dict()
            storage_data['id'] = doc.id
            storage_list.append(storage_data)
        
        return jsonify(storage_list)
    except Exception as e:
        print(f"Error fetching Storage: {e}")
        return jsonify({"error": f"Error fetching Storage: {str(e)}"}), 500

# API: Get all power supply units
@app.route("/api/manual/psus", methods=["GET"])
def get_psus():
    """Get list of all PSUs from Firebase database"""
    if not db:
        return jsonify({"error": "Database not available"}), 500
    
    try:
        psu_list = []
        for doc in db.collection('psus').stream():
            psu_data = doc.to_dict()
            psu_data['id'] = doc.id
            psu_list.append(psu_data)
        
        return jsonify(psu_list)
    except Exception as e:
        print(f"Error fetching PSUs: {e}")
        return jsonify({"error": f"Error fetching PSUs: {str(e)}"}), 500

# API: Get compatible cases based on motherboard size and GPU length
@app.route("/api/manual/cases", methods=["GET"])
def get_cases():
    """Get cases that fit the motherboard and GPU"""
    form_factor = request.args.get('form_factor')
    gpu_length = request.args.get('gpu_length')
    
    if not form_factor:
        return jsonify({"error": "Form Factor is required"}), 400
    if not gpu_length:
        return jsonify({"error": "GPU Length is required"}), 400
    
    if not db:
        return jsonify({"error": "Database not available"}), 500
    
    try:
        cases_ref = db.collection('cases')
        
        # Determine compatible form factors
        compatible_form_factors = ['ATX']
        if form_factor == "Micro-ATX":
            compatible_form_factors.append('Micro-ATX')
        elif form_factor == "Mini-ITX":
            compatible_form_factors.extend(['Micro-ATX', 'Mini-ITX'])
        
        # Query by form factor
        query = cases_ref.where('Form_Factor', 'in', compatible_form_factors)
        
        # Filter by GPU length in Python
        cases = []
        for doc in query.stream():
            case_data = doc.to_dict()
            case_max_length = case_data.get('Max_GPU_Length_cm', 0)
            
            # Check if case can fit the GPU
            if case_max_length >= float(gpu_length):
                case_data['id'] = doc.id
                cases.append(case_data)
        
        return jsonify(cases)
    except Exception as e:
        print(f"Error fetching Cases: {e}")
        return jsonify({"error": f"Error fetching Cases: {str(e)}"}), 500

# API: Check if all selected components are compatible
@app.route("/api/manual/validate", methods=["POST"])
def validate_build():
    build = request.json
    errors = []
    warnings = []

    # Check if all components are selected
    required_keys = ['cpu', 'motherboard', 'gpu', 'ram', 'cooler', 'storage', 'psu', 'case']
    for key in required_keys:
        if key not in build or not build[key]:
            errors.append(f"Missing component: {key}")
    
    if errors:
        return jsonify({"isValid": False, "errors": errors, "warnings": warnings})

    try:
        # Check if PSU has enough power for CPU and GPU
        cpu_tdp = build['cpu'].get('TDP', 0)
        gpu_tdp = build['gpu'].get('TDP', 0)
        psu_wattage = build['psu'].get('Wattage', 0)
        recommended_psu = cpu_tdp + gpu_tdp + 150  # Add 150W for other components
        
        if psu_wattage < recommended_psu:
            warnings.append(f"PSU Warning: Selected PSU ({psu_wattage}W) might be underpowered. {recommended_psu}W recommended.")

        # Check if GPU fits inside the case
        gpu_length = build['gpu'].get('Length_cm', 0)
        case_max_length = build['case'].get('Max_GPU_Length_cm', 0)

        if gpu_length > case_max_length:
            errors.append(f"GPU ({gpu_length}cm) is too long for the Case ({case_max_length}cm).")

    except Exception as e:
        errors.append(f"Validation error: {e}")

    is_valid = len(errors) == 0
    return jsonify({"isValid": is_valid, "errors": errors, "warnings": warnings})

# ============================================================================
# PERFORMANCE PREDICTION - Predict FPS and gaming performance
# ============================================================================

# Show performance prediction page
@app.route('/performance-predict')
def performance_predict():
    return render_template('performance.html')

# Get performance score for a CPU or GPU
def get_score(part_name):
    """Find hardware score from database using fuzzy matching"""
    if not part_name or not hw_db:
        return 0
    
    # Remove spaces and special characters for matching
    clean_input = str(part_name).lower().replace(" ", "").replace("-", "")
    
    # Try to find exact match first
    if clean_input in hw_db:
        return hw_db[clean_input]
    
    # Try partial matching - find if any database entry is contained in the input
    for db_name, score in hw_db.items():
        # Remove special characters for comparison
        clean_db_name = db_name.replace("-", "")
        clean_search = clean_input.replace("-", "")
        
        # Check if database name is in the component name or vice versa
        if clean_db_name in clean_search or clean_search in clean_db_name:
            print(f"✓ Matched '{part_name}' with '{db_name}' (score: {score})")
            return score
    
    # If still not found, try matching key parts (for CPUs and GPUs)
    # Extract model numbers and key identifiers
    import re
    
    # For CPUs: look for patterns like i5-12400, Ryzen5, etc.
    cpu_patterns = [
        r'i[3579]-?\d+',  # Intel i3, i5, i7, i9
        r'ryzen[3579]',    # AMD Ryzen 3, 5, 7, 9
    ]
    
    # For GPUs: look for patterns like RTX3060, RX6600, etc.
    gpu_patterns = [
        r'rtx\d+',        # NVIDIA RTX
        r'gtx\d+',        # NVIDIA GTX
        r'rx\d+',         # AMD RX
    ]
    
    all_patterns = cpu_patterns + gpu_patterns
    
    for pattern in all_patterns:
        match_input = re.search(pattern, clean_input)
        if match_input:
            matched_part = match_input.group()
            # Search in database
            for db_name, score in hw_db.items():
                if re.search(pattern, db_name):
                    db_match = re.search(pattern, db_name)
                    if db_match and db_match.group() == matched_part:
                        print(f"✓ Pattern matched '{part_name}' with '{db_name}' (score: {score})")
                        return score
    
    print(f"⚠ No match found for: {part_name}")
    return 0

# Calculate system bottleneck (which component limits performance)
def calculate_bottleneck(c_score, g_score, res_code):
    """Calculate bottleneck percentage and identify limiting component"""
    MAX_CPU_SCORE = 30000.0
    MAX_GPU_SCORE = 30000.0
    
    # Different resolutions stress CPU vs GPU differently
    # 1080P: CPU matters more, 4K: GPU matters more
    if res_code == 2:  # 1080P
        cpu_weight = 0.55
    elif res_code == 4:  # 4K
        cpu_weight = 0.30
    elif res_code == 3:  # 1440P
        cpu_weight = 0.425
    else:
        cpu_weight = 0.50
    
    # Normalize scores to 0-1 range
    cpu_norm = min(c_score / MAX_CPU_SCORE, 1.0)
    gpu_norm = min(g_score / MAX_GPU_SCORE, 1.0)
    
    # Calculate effectiveness based on resolution weighting
    cpu_eff = cpu_norm / cpu_weight
    gpu_eff = gpu_norm / (1 - cpu_weight)
    
    # Determine which component is the bottleneck
    if cpu_eff > gpu_eff:
        bottleneck_type = "GPU"  # GPU is limiting performance
        percentage_loss = abs(1 - (gpu_eff / cpu_eff))
    elif gpu_eff > cpu_eff:
        bottleneck_type = "CPU"  # CPU is limiting performance
        percentage_loss = abs(1 - (cpu_eff / gpu_eff))
    else:
        return 0, "Balanced"  # Perfect balance
    
    bottleneck_pct = min(int(percentage_loss * 100 * 0.40), 99)
    return bottleneck_pct, bottleneck_type

# API: Predict gaming performance for a PC build
@app.route('/api/performance/predict', methods=['POST'])
def predict_performance():
    try:
        # Get PC components from request
        data = request.json
        cpu_name = data.get('cpu')
        gpu_name = data.get('gpu')
        ram_gb = int(data.get('ram', 16))

        print(f"\n=== Performance Prediction Request ===")
        print(f"CPU: {cpu_name}")
        print(f"GPU: {gpu_name}")
        print(f"RAM: {ram_gb}GB")

        # Look up performance scores for CPU and GPU
        c_score = get_score(cpu_name)
        g_score = get_score(gpu_name)

        print(f"CPU Score: {c_score}")
        print(f"GPU Score: {g_score}")

        # Check if components were found in database
        if c_score == 0 and g_score == 0:
            return jsonify({
                "error": "Both CPU and GPU not found in database",
                "details": f"CPU: '{cpu_name}' and GPU: '{gpu_name}' are not in the hardware database. Please add them to data/hardware_lookup.csv"
            }), 404
        elif c_score == 0:
            return jsonify({
                "error": "CPU not found in database",
                "details": f"CPU '{cpu_name}' not found. Please add it to data/hardware_lookup.csv"
            }), 404
        elif g_score == 0:
            return jsonify({
                "error": "GPU not found in database", 
                "details": f"GPU '{gpu_name}' not found. Please add it to data/hardware_lookup.csv"
            }), 404

        # Normalize all values to 0-1 range for calculations
        MAX_FPS_FOR_SUITABILITY = 150.0
        MAX_CPU_SCORE = 30000.0
        MAX_GPU_SCORE = 30000.0
        MAX_RAM_GB = 64.0
        
        N_CPU = min(c_score / MAX_CPU_SCORE, 1.0)
        N_GPU = min(g_score / MAX_GPU_SCORE, 1.0)
        N_RAM = min(ram_gb / MAX_RAM_GB, 1.0)
        
        bottleneck_pct_static, bottleneck_type_static = calculate_bottleneck(c_score, g_score, 2)

        # Resolution FPS multipliers based on real-world performance
        # These are applied as post-processing to base 1080p predictions
        resolution_fps_multipliers = {
            '1080p': 1.0,      # Baseline
            '1440p': 0.65,     # ~35% FPS reduction
            '4K': 0.42         # ~58% FPS reduction
        }

        resolutions = [
            {"name": "1080p", "code": 2},
            {"name": "1440p", "code": 3},
            {"name": "4K", "code": 4}
        ]
        
        results = []
        
        # Strategy: Try CSV exact match first, fallback to model prediction
        print("\n--- FPS Prediction Strategy: CSV First → Model Fallback ---")
        
        # First, predict base FPS at 1080p using the model
        if fps_model and gaming_model:
            # Use 1080p baseline (multiplier = 1.0) for prediction
            base_features = [[c_score, g_score, ram_gb, 1.0]]
            base_fps_1080 = fps_model.predict(base_features)[0]
        else:
            # Fallback calculation if model not loaded
            base_fps_1080 = 120 * (N_GPU * 0.6 + N_CPU * 0.4)
        
        # Now generate predictions for each resolution by applying multipliers
        previous_res_fps = None  # Track previous resolution FPS for validation
        
        for res in resolutions:
            res_name = res['name']
            multiplier = resolution_fps_multipliers[res_name]
            
            # Calculate model prediction for comparison
            model_pred_fps = int(base_fps_1080 * multiplier)
            
            # Try to find exact match in CSV first
            exact_fps = find_exact_fps_from_csv(c_score, g_score, ram_gb, res_name)
            
            # Validation: CSV FPS should follow correct ordering
            # Higher resolution = Lower FPS (1080p > 1440p > 4K)
            use_csv = False
            if exact_fps is not None:
                # Check if CSV data follows correct ordering
                if previous_res_fps is None or exact_fps < previous_res_fps:
                    # CSV data looks valid
                    pred_fps = exact_fps
                    use_csv = True
                else:
                    # CSV data violates resolution ordering - use model instead
                    pred_fps = model_pred_fps
                    print(f"  ⚠ CSV Invalid ({res_name}={exact_fps} >= previous={previous_res_fps}) → Using Model: {pred_fps} FPS")
            else:
                # No CSV match - use model
                pred_fps = model_pred_fps
                print(f"  → Model Prediction: {res_name} = {pred_fps} FPS")
            
            previous_res_fps = pred_fps  # Update for next iteration
            
            # Predict gaming suitability
            if gaming_model:
                features = [[c_score, g_score, ram_gb, multiplier]]
                is_gaming_good = gaming_model.predict(features)[0]
            else:
                is_gaming_good = 1 if pred_fps > 60 else 0
            
            # Simple suitability calculation
            N_FPS = min(pred_fps / MAX_FPS_FOR_SUITABILITY, 1.0)
            final_pct = int(((N_FPS * 0.5) + (N_CPU * 0.15) + (N_GPU * 0.3) + (N_RAM * 0.05)) * 100)
            
            results.append({
                "resolution": res['name'],
                "fps": pred_fps,
                "gaming_rating": "Excellent" if is_gaming_good == 1 else "Average",
                "suitability_score": final_pct,
                "bottleneck_pct": bottleneck_pct_static,
                "bottleneck_type": bottleneck_type_static
            })

        return jsonify({
            "build_info": {
                "cpu": cpu_name,
                "gpu": gpu_name,
                "ram": ram_gb,
                "total_score": int(c_score + g_score)
            },
            "results": results
        })

    except Exception as e:
        print("Server Error:", e)
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500

# ============================================================================
# RUN APPLICATION
# ============================================================================

if __name__ == '__main__':
    print("="*60)
    print("AI PC Builder - Starting Server")
    print("="*60)
    print("Homepage: http://127.0.0.1:5000")
    print("Intelligent Build: http://127.0.0.1:5000/intelligent-build")
    print("Manual Build: http://127.0.0.1:5000/manual-build")
    print("Performance Predict: http://127.0.0.1:5000/performance-predict")
    print("="*60)
    app.run(debug=True, port=5000)
