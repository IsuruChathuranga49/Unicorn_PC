# 🦄 Unicorn PC Builder - Quick Start Guide

## සිංහලෙන් උපදෙස්

### ක්ෂණික ආරම්භය

1. **Python ස්ථාපනය කරන්න** (එය නැත්නම්):
   - Python 3.8+ අවශ්‍යයි

2. **Dependencies ස්ථාපනය කරන්න**:
```powershell
cd "c:\Users\Isuru Chathuranga\Desktop\Project\Unicorn PC Builder"
pip install -r requirements.txt
```

3. **Application එක ධාවනය කරන්න**:
```powershell
python app.py
```

4. **Browser එකෙන් විවෘත කරන්න**:
   - http://127.0.0.1:5000

### Project එක කොහොමද වැඩ කරන්නේ

#### 1. **Homepage** (මුල් පිටුව)
- බ්‍රව්සර් එකෙන් http://127.0.0.1:5000 යන්න
- ඔබට options දෙකක් පෙනේවි:
  - 🤖 **Intelligent Build** - AI recommendation එකකින් best PC එක හොයාගන්න
  - 🔧 **Manual Build** - Step-by-step ඔබම components තෝරාගෙන build කරන්න

#### 2. **Intelligent Build Mode**
මෙහි ක්‍රියාකාරිත්වය:
- **Use Case** තෝරන්න (Gaming, Productivity, Design/Render, Workstation)
- **Resolution** තෝරන්න (1080P, 1440P, 4K)
- Gaming නම් **FPS target** එක තෝරන්න (60-300 FPS)
- **Budget** එක type කරන්න (USD)
- "Get Recommendation" click කරන්න
- AI එක best CPU + GPU + RAM combination එක suggest කරයි
- Automatically **Performance Prediction** එකට redirect වෙනවා

#### 3. **Manual Build Mode**
Step-by-step component selection:
1. **CPU Brand** තෝරන්න (Intel හෝ AMD)
2. **CPU** එක select කරන්න
3. Compatible **Motherboard** එකක් තෝරන්න
4. **GPU** එක select කරන්න
5. **RAM** තෝරන්න
6. **Cooler** එකක් තෝරන්න
7. **Storage** එක select කරන්න
8. **PSU** එක තෝරන්න
9. **Case** එක select කරන්න
10. "Finish Build" click කරන්න
11. Build එක validate වෙනවා
12. "Predict Performance" click කරන්න

#### 4. **Performance Prediction**
මෙහි ඔබට පෙනෙන දේ:
- ඔබගේ build එකේ components (CPU, GPU, RAM)
- **Bottleneck Analysis** - CPU හෝ GPU bottleneck වෙනවද කියලා
- **Resolution-wise Performance**:
  - 🎮 **FPS** - 1080p, 1440p, 4K සඳහා
  - ⭐ **Gaming Rating** - Excellent හෝ Average
  - 📊 **Suitability Score** - Overall performance percentage
  - 🔧 **Bottleneck Type** - CPU හෝ GPU

### තාක්ෂණික විස්තර

**Backend (app.py)**:
- `/` - Homepage
- `/intelligent-build` - Intelligent Build UI
- `/manual-build` - Manual Build UI
- `/performance-predict` - Performance Prediction UI

**API Endpoints**:
- `/api/intelligent/recommend` - AI recommendation
- `/api/manual/*` - Manual build component APIs
- `/api/performance/predict` - ML model predictions

**Data Files**:
- `data/final_ruleset_data.csv` - 4500+ PC configurations for Intelligent Build
- `data/hardware_lookup.csv` - Hardware scores database
- `models/*.pkl` - Machine Learning models (FPS, Gaming, Render)

### Features

✅ **Intelligent Build**:
- Budget-based AI recommendations
- Gaming FPS targeting
- Multiple use cases (Gaming, Productivity, Design, Workstation)
- Resolution optimization

✅ **Manual Build**:
- Step-by-step guided selection
- Compatibility checking
- Real-time price calculation
- Firebase integration (optional)

✅ **Performance Prediction**:
- ML-powered FPS prediction
- Bottleneck detection
- Suitability scoring
- Multi-resolution analysis

### සටහන්

1. **Firebase සඳහා**: `serviceAccountKey.json` file එක root folder එකේ තියෙනවා නම්, Manual Build real Firebase data use කරයි. නැත්නම් mock data use කරයි.

2. **ML Models**: `models/` folder එකේ `.pkl` files තියෙන්න ඕන performance predictions සඳහා.

3. **CSV Data**: `data/` folder එකේ දෙකම CSV files තියෙන්න ඕන.

### Troubleshooting

**Problem**: "Dataset not loaded"
**Solution**: `data/final_ruleset_data.csv` file එක තියෙනවද check කරන්න

**Problem**: "ML Models not found"
**Solution**: `models/` folder එකේ `.pkl` files copy කරන්න

**Problem**: Manual Build components load වෙන්නේ නෑ
**Solution**: Firebase key නැත්නම් mock data use වෙයි - ඒක normal behavior එකක්

### Navigation Flow

```
Homepage
  ├── Intelligent Build
  │     ├── Select Use Case, Resolution, Budget, FPS
  │     ├── Get AI Recommendation
  │     └── → Performance Prediction
  │
  └── Manual Build
        ├── Select Brand → CPU → Mobo → GPU → RAM → Cooler → Storage → PSU → Case
        ├── Validate Build
        └── → Performance Prediction
```

### ප්‍රධාන විශේෂාංග

1. **Unified System** - තනි application එකක් තුළ සියලු modes එකතු වෙලා
2. **Smart Navigation** - Intelligent හෝ Manual මාර්ගයෙන් තෝරලා, අවසානයේ performance prediction
3. **Real-time Validation** - Compatibility issues පෙන්වනවා
4. **ML Integration** - Accurate FPS හා bottleneck predictions
5. **Modern UI** - Clean, responsive design

### Support

ගැටලු තියෙනවා නම්:
1. Terminal එකේ error messages බලන්න
2. Browser console එකේ errors check කරන්න
3. README.md file එක කියවන්න
4. සියලු data files තියෙනවද verify කරන්න

---

**© 2024 Unicorn PC Builder** 🦄
