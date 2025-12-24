# 🦄 Unicorn PC Builder - Complete Project Documentation

## Project Overview

**Unicorn PC Builder** is an integrated PC building platform that combines three powerful modes into one unified system:

1. **Intelligent Build Mode** - AI-powered recommendations
2. **Manual Build Mode** - Step-by-step component selection
3. **Performance Prediction** - ML-based performance analysis

## 🎯 Key Features

### Intelligent Build Mode
- Budget-based PC recommendations (min $649 - max $7000+)
- Multiple use cases: Gaming, Productivity, Design/Render, Workstation
- Gaming FPS targeting: 60-300 FPS
- Resolution optimization: 1080P, 1440P, 4K
- 4500+ pre-configured PC combinations in database
- Automatic best CPU + GPU + RAM selection

### Manual Build Mode
- 9-step guided component selection process:
  1. CPU Brand (Intel/AMD)
  2. CPU selection
  3. Motherboard (socket-compatible)
  4. GPU
  5. RAM (type-compatible)
  6. Cooler (socket-compatible)
  7. Storage
  8. PSU (wattage validation)
  9. Case (form factor + GPU length validation)
- Real-time compatibility checking
- Live price calculation
- Warning system for underpowered PSUs
- Firebase integration for component database

### Performance Prediction
- ML-powered FPS prediction (scikit-learn models)
- Multi-resolution analysis (1080p, 1440p, 4K)
- Bottleneck detection (CPU vs GPU)
- Suitability score calculation
- Gaming rating assessment
- Hardware score database with 40+ components

## 📁 Project Structure

```
Unicorn PC Builder/
│
├── app.py                          # Main Flask application (400+ lines)
├── requirements.txt                # Python dependencies
├── setup.ps1                       # Automated setup script
├── README.md                       # Technical documentation
├── QUICKSTART.md                   # Quick start guide (Sinhala + English)
├── serviceAccountKey.json          # Firebase credentials
│
├── data/                           # Data files
│   ├── final_ruleset_data.csv     # 4550 PC configurations
│   └── hardware_lookup.csv        # Hardware scores database
│
├── models/                         # Machine Learning models
│   ├── fps_model.pkl              # FPS prediction (96MB)
│   ├── gaming_model.pkl           # Gaming suitability (1.4MB)
│   └── render_model.pkl           # Render performance (1MB)
│
├── templates/                      # HTML templates
│   ├── index.html                 # Homepage
│   ├── intelligent_build.html     # Intelligent Build UI
│   ├── manual_build.html          # Manual Build UI
│   └── performance.html           # Performance Prediction UI
│
└── static/                         # Static assets
    ├── css/
    │   ├── manual_build.css       # Manual Build styling
    │   └── performance.css        # Performance page styling
    ├── js/
    │   ├── manual_build.js        # Manual Build logic (300+ lines)
    │   └── performance.js         # Performance display logic
    └── images/                     # (empty - for future use)
```

## 🚀 Installation & Setup

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)
- Modern web browser (Chrome, Firefox, Edge)

### Step 1: Install Dependencies
```powershell
cd "c:\Users\Isuru Chathuranga\Desktop\Project\Unicorn PC Builder"
pip install -r requirements.txt
```

Dependencies installed:
- Flask 3.0.0 (web framework)
- Flask-CORS 4.0.0 (cross-origin requests)
- pandas 2.1.4 (data processing)
- joblib 1.3.2 (model loading)
- numpy 1.26.2 (numerical computing)
- scikit-learn 1.3.2 (ML models)
- firebase-admin 6.3.0 (database - optional)

### Step 2: Verify Data Files
Ensure these files exist:
- ✅ `data/final_ruleset_data.csv` (312 KB)
- ✅ `data/hardware_lookup.csv` (2.6 KB)
- ✅ `models/fps_model.pkl` (96 MB)
- ✅ `models/gaming_model.pkl` (1.4 MB)
- ✅ `models/render_model.pkl` (1 MB)
- ⚠️ `serviceAccountKey.json` (optional - for Firebase)

### Step 3: Run the Application
```powershell
python app.py
```

The server will start at: http://127.0.0.1:5000

## 🎮 User Journey

### Journey 1: Intelligent Build → Performance
```
1. Open http://127.0.0.1:5000
2. Click "Intelligent Build"
3. Select:
   - Use Case: Gaming
   - Resolution: 1440P
   - FPS: 120
   - Budget: $1500
4. Click "Get Recommendation"
5. AI suggests: i5-12400F + RTX 3060 Ti + 16GB
6. Automatically redirects to Performance Prediction
7. View FPS predictions for all resolutions
8. Check bottleneck analysis
```

### Journey 2: Manual Build → Performance
```
1. Open http://127.0.0.1:5000
2. Click "Manual Build"
3. Select Brand: Intel
4. Choose CPU: i5-12400F
5. Select Motherboard: B660M (DDR4)
6. Pick GPU: RTX 3060
7. Choose RAM: 16GB DDR4
8. Select Cooler: Hyper 212
9. Pick Storage: 1TB NVMe
10. Choose PSU: 650W Gold
11. Select Case: NZXT H510
12. Validate build (checks compatibility)
13. Click "Predict Performance"
14. View detailed performance metrics
```

## 🔧 Technical Architecture

### Backend (Flask)
```python
# Main routes
/ → Homepage
/intelligent-build → Intelligent Build UI
/manual-build → Manual Build UI
/performance-predict → Performance Prediction UI

# API endpoints
/api/intelligent/options → Get available options
/api/intelligent/recommend → Get AI recommendation
/api/manual/cpus → Get CPUs by brand
/api/manual/motherboards → Get compatible motherboards
/api/manual/gpus → Get all GPUs
/api/manual/ram → Get compatible RAM
/api/manual/coolers → Get compatible coolers
/api/manual/storage → Get storage options
/api/manual/psus → Get PSUs
/api/manual/cases → Get compatible cases
/api/manual/validate → Validate complete build
/api/performance/predict → Predict performance
```

### Frontend (JavaScript)
- Modern vanilla JavaScript (no frameworks)
- Fetch API for AJAX requests
- Browser History API for navigation
- sessionStorage for data passing between pages

### Data Flow
```
User Input → Frontend (JS) → API Request → Backend (Flask) → 
Data Processing (pandas/ML) → Response → Frontend Update
```

## 📊 Database Schema

### final_ruleset_data.csv (Intelligent Build)
Columns:
- c_number (unique ID)
- cpu, gpu, ram_gb
- resolution, fps
- cpu_score, gpu_score
- power, price
- is_good_for_gaming, is_good_for_productivity
- is_good_for_design_render, is_good_for_workstation

### hardware_lookup.csv (Performance Prediction)
Columns:
- name (component name)
- score (performance score)

## 🤖 Machine Learning Models

### FPS Model
- **Type**: Regression
- **Input**: [cpu_score, gpu_score, ram_gb, resolution_code]
- **Output**: Predicted FPS
- **Size**: 96 MB

### Gaming Model
- **Type**: Classification
- **Input**: [cpu_score, gpu_score, ram_gb, resolution_code]
- **Output**: 0 (Average) or 1 (Excellent)
- **Size**: 1.4 MB

### Render Model
- **Type**: Regression
- **Input**: [cpu_score, gpu_score, ram_gb, resolution_code]
- **Output**: Render performance score
- **Size**: 1 MB

## 🎨 UI/UX Design

### Color Scheme
- Primary: #667eea (Purple Blue)
- Secondary: #764ba2 (Purple)
- Success: #28a745 (Green)
- Warning: #ffc107 (Yellow)
- Error: #dc3545 (Red)
- Background: #f4f4f4 (Light Gray)

### Responsive Design
- Desktop: Full-width layout with sidebar
- Tablet: Stacked layout
- Mobile: Single-column layout

### Typography
- Font: Poppins (Google Fonts)
- Weights: 300, 500, 600, 700, 900

## 🔐 Security & Firebase

If `serviceAccountKey.json` exists:
- Manual Build uses real Firebase Firestore data
- Collections: cpus, motherboards, gpus, ram, coolers, storage, psus, cases

If Firebase key is missing:
- Manual Build falls back to mock data
- All functionality still works

## 📈 Performance Metrics

### Bottleneck Calculation
```javascript
Resolution weights:
- 1080P: CPU 55%, GPU 45%
- 1440P: CPU 42.5%, GPU 57.5%
- 4K: CPU 30%, GPU 70%

Bottleneck = |CPU_effective - GPU_effective| * 100 * 0.4
```

### Suitability Score
```javascript
Score = (FPS * 0.5) + (CPU * 0.15) + (GPU * 0.3) + (RAM * 0.05)
Normalized to 0-100%
```

## 🐛 Troubleshooting

### Issue: Dataset not loaded
**Solution**: Check if `data/final_ruleset_data.csv` exists

### Issue: ML Models not found
**Solution**: Copy `.pkl` files to `models/` folder

### Issue: Firebase error
**Solution**: Either add `serviceAccountKey.json` or ignore (mock data works)

### Issue: Port 5000 already in use
**Solution**: Change port in `app.py`: `app.run(debug=True, port=5001)`

## 📝 Future Enhancements

Possible improvements:
1. User accounts & saved builds
2. Component comparison tool
3. Price tracking & alerts
4. Build sharing (social features)
5. More ML models (power consumption, temperature)
6. Mobile app version
7. Multi-language support
8. Component reviews & ratings
9. Build guides & tutorials
10. API for third-party integrations

## 📜 License & Credits

**Unicorn PC Builder** - © 2024

Built with:
- Flask (Python web framework)
- scikit-learn (Machine Learning)
- pandas (Data processing)
- Firebase (Database)
- Poppins font (Google Fonts)

---

## 🎯 Quick Command Reference

```powershell
# Navigate to project
cd "c:\Users\Isuru Chathuranga\Desktop\Project\Unicorn PC Builder"

# Install dependencies
pip install -r requirements.txt

# Run application
python app.py

# Run setup script (does everything)
.\setup.ps1

# Check files
Get-ChildItem data
Get-ChildItem models
Get-ChildItem templates
Get-ChildItem static -Recurse
```

## 🌐 URLs

- **Homepage**: http://127.0.0.1:5000
- **Intelligent Build**: http://127.0.0.1:5000/intelligent-build
- **Manual Build**: http://127.0.0.1:5000/manual-build
- **Performance**: http://127.0.0.1:5000/performance-predict

---

**End of Documentation** 🦄
