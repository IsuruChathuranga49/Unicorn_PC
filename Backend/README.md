# Backend README

## 🦄 Unicorn PC Builder - Backend API

Flask REST API for Unicorn PC Builder.

### 📋 Prerequisites

- Python 3.8+
- pip

### 🚀 Setup

1. **Install Dependencies**

```powershell
pip install -r requirements.txt
```

2. **Configure Environment** (optional)

```powershell
copy .env.example .env
# Edit .env with your settings
```

3. **Run Server**

```powershell
python app.py
```

Server will start at: http://localhost:5000

### 🔍 API Endpoints

#### Health Check

- `GET /api/health` - Server health status

#### Intelligent Build

- `GET /api/intelligent/options` - Get available options
- `POST /api/intelligent/recommend` - Get AI recommendation

#### Manual Build

- `GET /api/manual/cpus?brand=Intel` - Get CPUs
- `GET /api/manual/motherboards?socket=LGA1700` - Get motherboards
- `GET /api/manual/gpus` - Get GPUs
- `GET /api/manual/ram?ram_type=DDR4` - Get RAM
- `GET /api/manual/coolers?socket=LGA1700` - Get coolers
- `GET /api/manual/storage` - Get storage
- `GET /api/manual/psus` - Get PSUs
- `GET /api/manual/cases?form_factor=ATX&gpu_length=24` - Get cases
- `POST /api/manual/validate` - Validate build

#### Performance Prediction

- `POST /api/performance/predict` - Predict performance

### 📁 Project Structure

```
Backend/
├── app.py                  # Main Flask application
├── requirements.txt        # Python dependencies
├── .env.example           # Environment variables template
├── data/                  # CSV data files
│   ├── final_ruleset_data.csv
│   └── hardware_lookup.csv
├── models/                # ML models
│   ├── fps_model.pkl
│   ├── gaming_model.pkl
│   └── render_model.pkl
└── serviceAccountKey.json # Firebase credentials
```

### 🔐 CORS Configuration

The API allows requests from:

- `http://localhost:3000` (Next.js dev)
- `https://*.vercel.app` (Vercel deployment)
- `https://*.azurestaticapps.net` (Azure deployment)

### 🧪 Testing

Test the API:

```powershell
# Health check
curl http://localhost:5000/api/health

# Get intelligent build options
curl http://localhost:5000/api/intelligent/options

# Get recommendation
curl -X POST http://localhost:5000/api/intelligent/recommend `
  -H "Content-Type: application/json" `
  -d '{"budget":1500,"resolution":"1440P","use_case":"Gaming","fps":120}'
```

### 🚀 Production Deployment

For production, use gunicorn:

```powershell
gunicorn --bind 0.0.0.0:5000 --timeout 600 app:app
```

### 📝 Notes

- ML models are ~99MB total
- Firebase is optional (will use mock data if not available)
- All API responses are in JSON format
