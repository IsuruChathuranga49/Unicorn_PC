# Unicorn PC Builder 🦄

Complete PC Building Platform with AI-Powered Intelligence

## Features

### 🤖 Intelligent Build Mode
- AI-powered PC recommendations based on budget, use case, and requirements
- Gaming FPS targeting (60-300 FPS)
- Resolution optimization (1080P, 1440P, 4K)
- Automatic CPU + GPU + RAM combo selection

### 🔧 Manual Build Mode
- Step-by-step component selection
- CPU Brand → CPU → Motherboard → GPU → RAM → Cooler → Storage → PSU → Case
- Real-time compatibility validation
- Live price tracking

### 📊 Performance Prediction Model
- Machine Learning-powered performance analysis
- FPS prediction for different resolutions
- Suitability score calculation
- Bottleneck detection (CPU vs GPU)
- Gaming rating assessment

## Project Structure

```
Unicorn PC Builder/
├── app.py                      # Main Flask application
├── requirements.txt            # Python dependencies
├── serviceAccountKey.json      # Firebase credentials (optional)
├── data/
│   ├── final_ruleset_data.csv # Intelligent Build dataset
│   └── hardware_lookup.csv    # Hardware scores database
├── models/
│   ├── fps_model.pkl          # FPS prediction model
│   ├── gaming_model.pkl       # Gaming suitability model
│   └── render_model.pkl       # Render performance model
├── templates/
│   ├── index.html             # Homepage
│   ├── intelligent_build.html # Intelligent Build UI
│   ├── manual_build.html      # Manual Build UI
│   └── performance.html       # Performance Prediction UI
└── static/
    ├── css/
    │   ├── manual_build.css
    │   └── performance.css
    └── js/
        ├── manual_build.js
        └── performance.js
```

## Setup Instructions

### 1. Copy Data Files
Copy the following files from the original folders:

From `Intelligent Build Mode/`:
- `final_ruleset_data.csv` → `data/`

From `Perfomance Predict model/`:
- `hardware_lookup.csv` → `data/`
- All `.pkl` files from `models/` → `models/`

From `Manual Build Mode/` (optional):
- `serviceAccountKey.json` → root folder (for Firebase)

### 2. Install Dependencies
```powershell
cd "c:\Users\Isuru Chathuranga\Desktop\Project\Unicorn PC Builder"
pip install -r requirements.txt
```

### 3. Run the Application
```powershell
python app.py
```

The server will start at `http://127.0.0.1:5000`

## Usage

### Homepage
Navigate to `http://127.0.0.1:5000` to see two options:
- **Intelligent Build** - AI-powered recommendations
- **Manual Build** - Step-by-step custom builds

### Intelligent Build Flow
1. Select use case (Gaming, Productivity, Design/Render, Workstation)
2. Choose resolution (1080P, 1440P, 4K)
3. For Gaming: Select target FPS (60-300)
4. Enter budget
5. Get AI recommendation
6. Automatically redirect to Performance Prediction

### Manual Build Flow
1. Select CPU brand (Intel/AMD)
2. Choose CPU
3. Select compatible Motherboard
4. Pick GPU
5. Choose RAM
6. Select Cooler
7. Pick Storage
8. Choose PSU
9. Select Case
10. Validate build
11. Predict performance

### Performance Prediction
- Displays selected components
- Shows FPS predictions for 1080p, 1440p, 4K
- Calculates suitability scores
- Identifies bottlenecks
- Provides gaming ratings

## API Endpoints

### Intelligent Build
- `GET /api/intelligent/options` - Get available options
- `POST /api/intelligent/recommend` - Get AI recommendation

### Manual Build
- `GET /api/manual/cpus?brand=Intel` - Get CPUs by brand
- `GET /api/manual/motherboards?socket=LGA1700` - Get motherboards
- `GET /api/manual/gpus` - Get all GPUs
- `GET /api/manual/ram?ram_type=DDR4` - Get RAM by type
- `GET /api/manual/coolers?socket=LGA1700` - Get coolers
- `GET /api/manual/storage` - Get storage options
- `GET /api/manual/psus` - Get PSUs
- `GET /api/manual/cases?form_factor=ATX&gpu_length=24` - Get cases
- `POST /api/manual/validate` - Validate complete build

### Performance Prediction
- `POST /api/performance/predict` - Predict performance
  - Body: `{"cpu": "i5-12400F", "gpu": "RTX3060", "ram": 16}`

## Notes

- If Firebase is not configured, Manual Build will use mock data
- ML models must be present in `models/` folder for predictions to work
- All CSV files must be in `data/` folder
- The application integrates all three original modes into one unified system

## Technologies Used

- **Backend**: Flask (Python)
- **Frontend**: HTML5, CSS3, JavaScript
- **ML**: scikit-learn, joblib
- **Database**: Firebase Firestore (optional), CSV files
- **Data Processing**: pandas, numpy

## Author

Unicorn PC Builder - 2024
