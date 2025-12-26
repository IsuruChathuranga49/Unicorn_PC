---
description: Deploy Unicorn PC Builder to Azure with separate Backend and Frontend
---

# 🚀 Azure Deployment Guide - Unicorn PC Builder

## Overview

Deploy the application with:

- **Backend**: Flask API on Azure App Service
- **Frontend**: React/Vue SPA on Azure Static Web Apps
- **Database**: Azure Cosmos DB (Firestore alternative) or keep Firebase
- **Storage**: Azure Blob Storage for ML models

---

## 📋 Prerequisites

1. **Azure Account**

   - Create free account: https://azure.microsoft.com/free/
   - $200 free credit for 30 days

2. **Required Tools**

   - Azure CLI: `winget install Microsoft.AzureCLI`
   - Node.js 18+: `winget install OpenJS.NodeJS`
   - Python 3.8+: Already installed
   - Git: `winget install Git.Git`

3. **Azure Resources Needed**
   - Resource Group
   - App Service Plan (Backend)
   - App Service (Backend API)
   - Static Web App (Frontend)
   - Storage Account (ML models)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│           Azure Static Web Apps                 │
│         (Frontend - React/Vue)                  │
│   - index.html                                  │
│   - Intelligent Build UI                        │
│   - Manual Build UI                             │
│   - Performance Prediction UI                   │
└─────────────────┬───────────────────────────────┘
                  │
                  │ HTTPS API Calls
                  │
┌─────────────────▼───────────────────────────────┐
│         Azure App Service                       │
│         (Backend - Flask API)                   │
│   - /api/intelligent/*                          │
│   - /api/manual/*                               │
│   - /api/performance/*                          │
└─────────────────┬───────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
┌───────▼────────┐  ┌──────▼──────────┐
│ Azure Blob     │  │ Firebase /      │
│ Storage        │  │ Cosmos DB       │
│ (ML Models)    │  │ (Components DB) │
└────────────────┘  └─────────────────┘
```

---

## 📁 Project Restructure Plan

### Current Structure:

```
Unicorn_PC/
├── app.py (monolithic)
├── templates/ (HTML)
├── static/ (CSS/JS)
├── data/
└── models/
```

### New Structure:

```
Unicorn_PC/
├── backend/                    # Flask API only
│   ├── app.py
│   ├── requirements.txt
│   ├── data/
│   ├── models/
│   └── .env
│
└── frontend/                   # React/Vue SPA
    ├── public/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── services/
    │   └── App.jsx
    ├── package.json
    └── vite.config.js
```

---

## 🔧 Step-by-Step Implementation

### Phase 1: Restructure Project

#### 1.1 Create Backend (API Only)

```powershell
# Create backend folder
mkdir backend
cd backend

# Copy necessary files
copy ..\app.py .
copy ..\requirements.txt .
xcopy ..\data data\ /E /I
xcopy ..\models models\ /E /I
copy ..\serviceAccountKey.json .
```

#### 1.2 Modify Backend for API-only

- Remove `render_template` calls
- Keep only API endpoints
- Add CORS for frontend domain
- Add environment variables

#### 1.3 Create Frontend (React + Vite)

```powershell
# Create frontend
cd ..
npm create vite@latest frontend -- --template react
cd frontend
npm install

# Install dependencies
npm install axios react-router-dom
```

#### 1.4 Convert HTML templates to React components

- `index.html` → `HomePage.jsx`
- `intelligent_build.html` → `IntelligentBuild.jsx`
- `manual_build.html` → `ManualBuild.jsx`
- `performance.html` → `Performance.jsx`

---

### Phase 2: Backend Deployment (Azure App Service)

#### 2.1 Login to Azure

```powershell
az login
```

#### 2.2 Create Resource Group

```powershell
az group create --name unicorn-pc-rg --location eastus
```

#### 2.3 Create App Service Plan

```powershell
az appservice plan create `
  --name unicorn-pc-plan `
  --resource-group unicorn-pc-rg `
  --sku B1 `
  --is-linux
```

#### 2.4 Create Web App

```powershell
az webapp create `
  --resource-group unicorn-pc-rg `
  --plan unicorn-pc-plan `
  --name unicorn-pc-backend `
  --runtime "PYTHON:3.11"
```

#### 2.5 Configure App Settings

```powershell
# Set Python version
az webapp config set `
  --resource-group unicorn-pc-rg `
  --name unicorn-pc-backend `
  --startup-file "gunicorn --bind=0.0.0.0 --timeout 600 app:app"

# Add environment variables
az webapp config appsettings set `
  --resource-group unicorn-pc-rg `
  --name unicorn-pc-backend `
  --settings FLASK_ENV=production
```

#### 2.6 Deploy Backend

```powershell
cd backend

# Create deployment package
zip -r deploy.zip . -x "*.git*" -x "*__pycache__*"

# Deploy
az webapp deployment source config-zip `
  --resource-group unicorn-pc-rg `
  --name unicorn-pc-backend `
  --src deploy.zip
```

#### 2.7 Upload ML Models to Azure Blob Storage

```powershell
# Create storage account
az storage account create `
  --name unicornpcmodels `
  --resource-group unicorn-pc-rg `
  --location eastus `
  --sku Standard_LRS

# Create container
az storage container create `
  --name models `
  --account-name unicornpcmodels `
  --public-access blob

# Upload models
az storage blob upload-batch `
  --account-name unicornpcmodels `
  --destination models `
  --source ./models
```

---

### Phase 3: Frontend Deployment (Azure Static Web Apps)

#### 3.1 Build Frontend

```powershell
cd frontend
npm run build
```

#### 3.2 Create Static Web App

```powershell
az staticwebapp create `
  --name unicorn-pc-frontend `
  --resource-group unicorn-pc-rg `
  --location eastus2 `
  --source . `
  --branch main `
  --app-location "/frontend" `
  --output-location "dist"
```

#### 3.3 Configure API Backend URL

Create `frontend/.env.production`:

```
VITE_API_URL=https://unicorn-pc-backend.azurewebsites.net
```

#### 3.4 Deploy Frontend

```powershell
# Install Azure Static Web Apps CLI
npm install -g @azure/static-web-apps-cli

# Deploy
swa deploy --app-location ./dist --env production
```

---

### Phase 4: Database Migration

#### Option A: Keep Firebase (Easier)

- No changes needed
- Keep `serviceAccountKey.json` in backend
- Add to Azure App Settings as environment variable

#### Option B: Migrate to Azure Cosmos DB

```powershell
# Create Cosmos DB account
az cosmosdb create `
  --name unicorn-pc-db `
  --resource-group unicorn-pc-rg `
  --kind MongoDB

# Get connection string
az cosmosdb keys list `
  --name unicorn-pc-db `
  --resource-group unicorn-pc-rg `
  --type connection-strings
```

---

## 🔐 Security Configuration

### Backend CORS Setup

```python
# In backend/app.py
from flask_cors import CORS

CORS(app, origins=[
    "https://unicorn-pc-frontend.azurestaticapps.net",
    "http://localhost:5173"  # For local development
])
```

### Environment Variables

```powershell
# Set in Azure App Service
az webapp config appsettings set `
  --resource-group unicorn-pc-rg `
  --name unicorn-pc-backend `
  --settings `
    FIREBASE_CREDENTIALS="$(cat serviceAccountKey.json)" `
    FLASK_ENV=production `
    CORS_ORIGINS=https://unicorn-pc-frontend.azurestaticapps.net
```

---

## 💰 Cost Estimation (Monthly)

| Service            | Tier      | Cost              |
| ------------------ | --------- | ----------------- |
| App Service (B1)   | Basic     | ~$13/month        |
| Static Web Apps    | Free      | $0                |
| Blob Storage       | Standard  | ~$0.50/month      |
| Firebase/Cosmos DB | Free tier | $0                |
| **Total**          |           | **~$13.50/month** |

**Free tier option**: Use Azure App Service Free tier (F1) → $0/month

---

## 🧪 Testing

### Local Testing

```powershell
# Backend
cd backend
python app.py
# Runs on http://localhost:5000

# Frontend
cd frontend
npm run dev
# Runs on http://localhost:5173
```

### Production URLs

- **Frontend**: https://unicorn-pc-frontend.azurestaticapps.net
- **Backend API**: https://unicorn-pc-backend.azurewebsites.net

---

## 📊 Monitoring

### Enable Application Insights

```powershell
# Create Application Insights
az monitor app-insights component create `
  --app unicorn-pc-insights `
  --location eastus `
  --resource-group unicorn-pc-rg

# Link to App Service
az webapp config appsettings set `
  --resource-group unicorn-pc-rg `
  --name unicorn-pc-backend `
  --settings APPINSIGHTS_INSTRUMENTATIONKEY=<key>
```

---

## 🔄 CI/CD with GitHub Actions

### Backend Workflow

Create `.github/workflows/backend-deploy.yml`:

```yaml
name: Deploy Backend

on:
  push:
    branches: [main]
    paths:
      - "backend/**"

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Azure
        uses: azure/webapps-deploy@v2
        with:
          app-name: unicorn-pc-backend
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
          package: ./backend
```

### Frontend Workflow

Automatically created by Azure Static Web Apps

---

## 🎯 Next Steps

1. **Restructure Project** (Phase 1)
2. **Deploy Backend** (Phase 2)
3. **Deploy Frontend** (Phase 3)
4. **Test & Monitor**
5. **Setup CI/CD**

---

## 📞 Support Resources

- Azure Documentation: https://docs.microsoft.com/azure
- Azure Portal: https://portal.azure.com
- Azure CLI Reference: https://docs.microsoft.com/cli/azure
- Azure Pricing Calculator: https://azure.microsoft.com/pricing/calculator

---

**Ready to deploy!** 🚀
