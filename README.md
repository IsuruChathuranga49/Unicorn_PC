# 🦄 Unicorn PC Builder

Complete PC Building Platform with AI-Powered Intelligence - **Separated Backend & Frontend Architecture**

## 🏗️ Project Structure

```
Unicorn_PC/
├── Backend/                    # Flask REST API
│   ├── app.py                 # API endpoints
│   ├── requirements.txt       # Python dependencies
│   ├── data/                  # CSV data files
│   ├── models/                # ML models (99MB)
│   └── serviceAccountKey.json # Firebase credentials
│
├── frontend/                   # Next.js Application
│   ├── app/                   # Next.js App Router
│   │   ├── page.jsx          # Homepage
│   │   ├── intelligent-build/ # AI Build Mode
│   │   ├── manual-build/     # Manual Build Mode
│   │   └── performance/      # Performance Prediction
│   ├── services/             # API service layer
│   └── package.json
│
└── .agent/                    # Workflows & deployment guides
```

## 🚀 Quick Start

### Backend Setup

1. **Navigate to Backend**

```powershell
cd Backend
```

2. **Install Dependencies**

```powershell
pip install -r requirements.txt
```

3. **Run Backend Server**

```powershell
python app.py
```

Backend runs at: **http://localhost:5000**

### Frontend Setup

1. **Navigate to Frontend**

```powershell
cd frontend
```

2. **Install Dependencies**

```powershell
npm install
```

3. **Create Environment File**

Create `frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

4. **Run Development Server**

```powershell
npm run dev
```

Frontend runs at: **http://localhost:3000**

## 🎯 Features

### 🤖 Intelligent Build Mode

- AI-powered PC recommendations
- Budget-based filtering ($649 - $7000+)
- Gaming FPS targeting (60-300 FPS)
- Multiple use cases (Gaming, Productivity, Design, Workstation)
- 4550+ PC configurations database
- Automatic performance prediction

### 🔧 Manual Build Mode

- 9-step guided component selection
- Real-time compatibility checking
- Socket validation (CPU ↔ Motherboard ↔ Cooler)
- RAM type matching (DDR4/DDR5)
- GPU length validation
- PSU wattage calculation
- Live price tracking
- Build validation with warnings

### 📊 Performance Prediction

- Machine Learning-powered FPS predictions
- Multi-resolution analysis (1080p, 1440p, 4K)
- Bottleneck detection (CPU vs GPU)
- Suitability scoring (0-100%)
- Gaming rating assessment
- Visual performance indicators

## 🛠️ Tech Stack

### Backend

- **Framework**: Flask 3.0.0
- **ML**: scikit-learn 1.3.2
- **Data**: pandas 2.1.4, numpy 1.26.2
- **Database**: Firebase Firestore (optional)
- **Server**: Gunicorn (production)

### Frontend

- **Framework**: Next.js 15 (App Router)
- **UI**: React 19
- **Styling**: Tailwind CSS 4
- **API**: Fetch API with service layer

## 📡 API Endpoints

### Intelligent Build

- `GET /api/intelligent/options` - Get available options
- `POST /api/intelligent/recommend` - Get AI recommendation

### Manual Build

- `GET /api/manual/cpus?brand=Intel` - Get CPUs
- `GET /api/manual/motherboards?socket=LGA1700` - Get motherboards
- `GET /api/manual/gpus` - Get all GPUs
- `GET /api/manual/ram?ram_type=DDR4` - Get RAM
- `GET /api/manual/coolers?socket=LGA1700` - Get coolers
- `GET /api/manual/storage` - Get storage
- `GET /api/manual/psus` - Get PSUs
- `GET /api/manual/cases?form_factor=ATX&gpu_length=24` - Get cases
- `POST /api/manual/validate` - Validate build

### Performance

- `POST /api/performance/predict` - Predict performance

### Health

- `GET /api/health` - Server health check

## 🧪 Testing

### Test Backend

```powershell
cd Backend
python app.py

# In another terminal:
curl http://localhost:5000/api/health
```

### Test Frontend

```powershell
cd frontend
npm run dev

# Open browser: http://localhost:3000
```

## 🚀 Production Deployment

### Backend (Azure App Service)

```powershell
cd Backend
az webapp up --name unicorn-pc-backend --runtime PYTHON:3.11
```

### Frontend (Vercel)

```powershell
cd frontend
npm run build
vercel --prod
```

See `.agent/workflows/azure-deployment.md` for detailed deployment guide.

## 📁 Data Files

### Required Files

- `Backend/data/final_ruleset_data.csv` (313 KB) - 4550 PC configurations
- `Backend/data/hardware_lookup.csv` (2.6 KB) - Hardware scores
- `Backend/models/fps_model.pkl` (96 MB) - FPS prediction model
- `Backend/models/gaming_model.pkl` (1.4 MB) - Gaming model
- `Backend/models/render_model.pkl` (1 MB) - Render model
- `Backend/serviceAccountKey.json` (optional) - Firebase credentials

## 🔐 Environment Variables

### Backend (.env)

```
FLASK_ENV=development
FLASK_DEBUG=True
PORT=5000
```

### Frontend (.env.local)

```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## 📊 Project Statistics

| Metric                | Count          |
| --------------------- | -------------- |
| Backend API Endpoints | 14             |
| Frontend Pages        | 4              |
| React Components      | 10+            |
| ML Models             | 3 (99 MB)      |
| PC Configurations     | 4550+          |
| Hardware Database     | 40+ components |
| Total Lines of Code   | ~3000+         |

## 🎨 Screenshots

### Homepage

Two build modes: Intelligent Build (AI) & Manual Build (Step-by-step)

### Intelligent Build

Budget slider, use case selector, resolution picker, FPS target

### Manual Build

9-step wizard with real-time compatibility checking

### Performance Prediction

FPS predictions, bottleneck analysis, gaming ratings

## 🔄 Development Workflow

1. **Start Backend**

   ```powershell
   cd Backend
   python app.py
   ```

2. **Start Frontend** (new terminal)

   ```powershell
   cd frontend
   npm run dev
   ```

3. **Open Browser**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api/health

## 📝 Notes

- Backend must be running for Frontend to work
- Firebase is optional (will use mock data if not configured)
- ML models are required for performance predictions
- CORS is configured for localhost:3000

## 🐛 Troubleshooting

### Backend Issues

- **Port 5000 in use**: Change port in `Backend/app.py`
- **ML models not found**: Ensure `.pkl` files are in `Backend/models/`
- **Firebase error**: Check `serviceAccountKey.json` or ignore (optional)

### Frontend Issues

- **API connection failed**: Ensure Backend is running on port 5000
- **Build errors**: Run `npm install` in frontend folder
- **Env variables**: Create `.env.local` with `NEXT_PUBLIC_API_URL`

## 📚 Documentation

- `Backend/README.md` - Backend API documentation
- `frontend/README.md` - Frontend setup guide
- `.agent/workflows/azure-deployment.md` - Deployment guide

## 🎯 Next Steps

1. ✅ Backend & Frontend separated
2. ✅ Full-featured pages created
3. ⏳ Test both servers
4. ⏳ Deploy to Azure/Vercel
5. ⏳ Add more features

## 📞 Support

For issues:

1. Check if both Backend and Frontend are running
2. Verify environment variables
3. Check browser console for errors
4. Check terminal for server errors

## 🏆 Features Comparison

| Feature      | Old (Monolithic)      | New (Separated)                |
| ------------ | --------------------- | ------------------------------ |
| Architecture | Single Flask app      | Backend API + Next.js Frontend |
| Deployment   | Single server         | Separate deployments           |
| Scalability  | Limited               | High                           |
| Performance  | Server-side rendering | Client-side + SSR              |
| Development  | Coupled               | Independent                    |
| Modern UI    | Basic HTML/CSS        | React + Tailwind CSS           |

## 📄 License

© 2024 Unicorn PC Builder - All Rights Reserved 🦄

---

**Built with ❤️ using Flask, Next.js, React, and Machine Learning**
