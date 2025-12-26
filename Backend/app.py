# Unicorn PC Builder - Backend API
# Flask REST API for Next.js Frontend

from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import joblib
import os
import numpy as np

# Import Firebase for Manual Build (Optional)
try:
    import firebase_admin
    from firebase_admin import credentials, firestore
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False
    print("⚠️ Firebase not available. Manual Build will use mock data.")

app = Flask(__name__)

# CORS Configuration - Allow Next.js frontend
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "http://localhost:3000",  # Next.js dev server
            "https://*.vercel.app",   # Vercel deployment
            "https://*.azurestaticapps.net"  # Azure deployment
        ],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

# ============================================================================
# DATA LOADING
# ============================================================================

# Load Intelligent Build CSV Data
try:
    intelligent_df = pd.read_csv('data/final_ruleset_data.csv')
    print("✅ Intelligent Build data loaded successfully")
except FileNotFoundError:
    print("❌ Error: 'data/final_ruleset_data.csv' not found")
    intelligent_df = None

# Load Performance Prediction Models
MODEL_DIR = 'models'
try:
    fps_model = joblib.load(os.path.join(MODEL_DIR, 'fps_model.pkl'))
    gaming_model = joblib.load(os.path.join(MODEL_DIR, 'gaming_model.pkl'))
    render_model = joblib.load(os.path.join(MODEL_DIR, 'render_model.pkl'))
    print("✅ ML Models loaded successfully")
except FileNotFoundError as e:
    print(f"❌ Error loading models: {e}")
    fps_model = gaming_model = render_model = None

# Load Hardware Lookup Database
try:
    lookup_df = pd.read_csv('data/hardware_lookup.csv')
    lookup_df['clean_name'] = lookup_df['name'].astype(str).str.lower().str.replace(" ", "")
    hw_db = lookup_df.set_index('clean_name')['score'].to_dict()
    print("✅ Hardware lookup database loaded")
except FileNotFoundError:
    print("❌ Error: 'data/hardware_lookup.csv' not found")
    hw_db = {}

# Initialize Firebase for Manual Build Mode
db = None
if FIREBASE_AVAILABLE:
    try:
        cred_path = 'serviceAccountKey.json'
        if os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            db = firestore.client()
            print("✅ Firebase Firestore connected successfully")
            print("✅ Manual Build will use real database")
        else:
            print("❌ serviceAccountKey.json not found")
            print("⚠️ Manual Build will NOT work without Firebase")
    except Exception as e:
        print(f"❌ Firebase initialization error: {e}")
        print("⚠️ Manual Build will NOT work without Firebase")
        db = None
else:
    print("❌ firebase-admin package not installed")
    print("⚠️ Run: pip install firebase-admin")

# ============================================================================
# HEALTH CHECK
# ============================================================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "Unicorn PC Builder API",
        "version": "2.0.0",
        "data_loaded": intelligent_df is not None,
        "models_loaded": fps_model is not None,
        "firebase_available": db is not None
    })

# ============================================================================
# INTELLIGENT BUILD MODE API
# ============================================================================

def get_recommendation(budget, resolution, use_case, fps=None):
    """AI recommendation logic from Intelligent Build Mode"""
    if intelligent_df is None:
        return {"error": "Dataset not loaded"}
    
    use_case_logic = {
        'Gaming': {'filter_col': 'is_good_for_gaming', 'rank_by': 'gpu_score'},
        'Productivity': {'filter_col': 'is_good_for_productivity', 'rank_by': 'cpu_score'},
        'Design/Render': {'filter_col': 'is_good_for_design_render', 'rank_by': 'combined_score'},
        'Workstation': {'filter_col': 'is_good_for_workstation', 'rank_by': 'combined_score'}
    }

    if use_case not in use_case_logic:
        return {"error": f"Invalid use_case. Choose from {list(use_case_logic.keys())}"}

    logic = use_case_logic[use_case]
    
    # Filter by use case
    use_case_df = intelligent_df[intelligent_df[logic['filter_col']] == 1].copy()
    if use_case_df.empty:
        return {"error": f"No PC found for '{use_case}' in dataset."}
    
    # Filter by budget
    filtered_df = use_case_df[use_case_df['price'] <= budget].copy()
    if filtered_df.empty:
        cheapest = use_case_df.sort_values('price').iloc[0]
        cheapest_price = int(cheapest['price'])
        shortage = cheapest_price - budget
        return {
            "error": f"No {use_case} PC found within ${budget} budget.",
            "suggestion": f"Cheapest {use_case} PC available is ${cheapest_price} (shortage: ${shortage})"
        }
    
    # Filter by FPS for Gaming
    if use_case == 'Gaming' and fps is not None:
        fps_filtered = filtered_df[filtered_df['fps'] >= fps]
        if not fps_filtered.empty:
            filtered_df = fps_filtered
    
    # Filter by resolution
    resolution_filtered = filtered_df[filtered_df['resolution'] == resolution]
    if not resolution_filtered.empty:
        filtered_df = resolution_filtered
    
    # Rank and select best
    rank_col = logic['rank_by']
    if rank_col == 'combined_score':
        filtered_df['combined_score'] = filtered_df['cpu_score'] + filtered_df['gpu_score']

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

@app.route('/api/intelligent/options', methods=['GET'])
def intelligent_options():
    """Get available options for intelligent build"""
    if intelligent_df is None:
        return jsonify({"error": "Dataset not loaded"}), 500
    
    resolutions = sorted(intelligent_df['resolution'].unique().tolist())
    use_cases = ['Gaming', 'Productivity', 'Design/Render', 'Workstation']
    
    return jsonify({
        'resolutions': resolutions,
        'use_cases': use_cases,
        'min_price': int(intelligent_df['price'].min()),
        'max_price': int(intelligent_df['price'].max())
    })

@app.route('/api/intelligent/recommend', methods=['POST'])
def intelligent_recommend():
    """Get AI recommendation based on requirements"""
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
# MANUAL BUILD MODE API
# ============================================================================

@app.route("/api/manual/cpus", methods=["GET"])
def get_cpus():
    """Get CPUs filtered by brand from Firebase"""
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

@app.route("/api/manual/motherboards", methods=["GET"])
def get_motherboards():
    """Get motherboards filtered by socket from Firebase"""
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

@app.route("/api/manual/gpus", methods=["GET"])
def get_gpus():
    """Get all GPUs from Firebase"""
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

@app.route("/api/manual/ram", methods=["GET"])
def get_ram():
    """Get RAM filtered by type from Firebase"""
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

@app.route("/api/manual/coolers", methods=["GET"])
def get_coolers():
    """Get coolers filtered by socket support from Firebase"""
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

@app.route("/api/manual/storage", methods=["GET"])
def get_storage():
    """Get all storage options from Firebase"""
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

@app.route("/api/manual/psus", methods=["GET"])
def get_psus():
    """Get all PSUs from Firebase"""
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

@app.route("/api/manual/cases", methods=["GET"])
def get_cases():
    """Get cases filtered by form factor and GPU length from Firebase"""
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

@app.route("/api/manual/validate", methods=["POST"])
def validate_build():
    """Validate complete PC build"""
    build = request.json
    errors = []
    warnings = []

    required_keys = ['cpu', 'motherboard', 'gpu', 'ram', 'cooler', 'storage', 'psu', 'case']
    for key in required_keys:
        if key not in build or not build[key]:
            errors.append(f"Missing component: {key}")
    
    if errors:
        return jsonify({"isValid": False, "errors": errors, "warnings": warnings})

    try:
        cpu_tdp = build['cpu'].get('TDP', 0)
        gpu_tdp = build['gpu'].get('TDP', 0)
        psu_wattage = build['psu'].get('Wattage', 0)
        recommended_psu = cpu_tdp + gpu_tdp + 150
        
        if psu_wattage < recommended_psu:
            warnings.append(f"PSU Warning: Selected PSU ({psu_wattage}W) might be underpowered. {recommended_psu}W recommended.")

        gpu_length = build['gpu'].get('Length_cm', 0)
        case_max_length = build['case'].get('Max_GPU_Length_cm', 0)

        if gpu_length > case_max_length:
            errors.append(f"GPU ({gpu_length}cm) is too long for the Case ({case_max_length}cm).")

    except Exception as e:
        errors.append(f"Validation error: {e}")

    is_valid = len(errors) == 0
    return jsonify({"isValid": is_valid, "errors": errors, "warnings": warnings})

# ============================================================================
# PERFORMANCE PREDICTION API
# ============================================================================

def get_score(part_name):
    """Retrieve hardware score from database with flexible matching"""
    if not part_name or not hw_db:
        return 0
    
    # Clean the input
    clean_input = str(part_name).lower().replace(" ", "").replace("-", "")
    
    # Try exact match first
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

def calculate_bottleneck(c_score, g_score, res_code):
    """Calculate bottleneck percentage"""
    MAX_CPU_SCORE = 30000.0
    MAX_GPU_SCORE = 30000.0
    
    if res_code == 2:  # 1080P
        cpu_weight = 0.55
    elif res_code == 4:  # 4K
        cpu_weight = 0.30
    elif res_code == 3:  # 1440P
        cpu_weight = 0.425
    else:
        cpu_weight = 0.50
    
    cpu_norm = min(c_score / MAX_CPU_SCORE, 1.0)
    gpu_norm = min(g_score / MAX_GPU_SCORE, 1.0)
    
    cpu_eff = cpu_norm / cpu_weight
    gpu_eff = gpu_norm / (1 - cpu_weight)
    
    if cpu_eff > gpu_eff:
        bottleneck_type = "GPU"
        percentage_loss = abs(1 - (gpu_eff / cpu_eff))
    elif gpu_eff > cpu_eff:
        bottleneck_type = "CPU"
        percentage_loss = abs(1 - (cpu_eff / gpu_eff))
    else:
        return 0, "Balanced"
    
    bottleneck_pct = min(int(percentage_loss * 100 * 0.40), 99)
    return bottleneck_pct, bottleneck_type

@app.route('/api/performance/predict', methods=['POST'])
def predict_performance():
    """Predict PC performance using ML models"""
    try:
        data = request.json
        cpu_name = data.get('cpu')
        gpu_name = data.get('gpu')
        ram_gb = int(data.get('ram', 16))

        print(f"\n=== Performance Prediction Request ===")
        print(f"CPU: {cpu_name}")
        print(f"GPU: {gpu_name}")
        print(f"RAM: {ram_gb}GB")

        c_score = get_score(cpu_name)
        g_score = get_score(gpu_name)

        print(f"CPU Score: {c_score}")
        print(f"GPU Score: {g_score}")

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

        MAX_FPS_FOR_SUITABILITY = 150.0
        MAX_CPU_SCORE = 30000.0
        MAX_GPU_SCORE = 30000.0
        MAX_RAM_GB = 64.0
        
        N_CPU = min(c_score / MAX_CPU_SCORE, 1.0)
        N_GPU = min(g_score / MAX_GPU_SCORE, 1.0)
        N_RAM = min(ram_gb / MAX_RAM_GB, 1.0)
        
        bottleneck_pct_static, bottleneck_type_static = calculate_bottleneck(c_score, g_score, 2)

        resolutions = [
            {"name": "1080p", "code": 2},
            {"name": "1440p", "code": 3},
            {"name": "4K", "code": 4}
        ]
        
        results = []
        
        for res in resolutions:
            features = [[c_score, g_score, ram_gb, res['code']]]
            
            if fps_model and gaming_model:
                pred_fps = int(fps_model.predict(features)[0])
                is_gaming_good = gaming_model.predict(features)[0]
            else:
                # Fallback if models not loaded
                pred_fps = int(120 * (N_GPU + N_CPU) / 2)
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
    print("🦄 Unicorn PC Builder - Backend API Server")
    print("="*60)
    print("📍 API Base URL: http://127.0.0.1:5000")
    print("🔍 Health Check: http://127.0.0.1:5000/api/health")
    print("📚 API Endpoints:")
    print("   - /api/intelligent/*")
    print("   - /api/manual/*")
    print("   - /api/performance/*")
    print("="*60)
    app.run(debug=True, port=5000)
