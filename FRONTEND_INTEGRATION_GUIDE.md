# 🚀 MindSync Frontend Environment Configuration

## 📋 **DEVELOPMENT ENVIRONMENT**

### **Environment Variables (.env.development)**
```bash
# API Configuration
REACT_APP_API_BASE_URL=https://dev-api.mindsync.com
REACT_APP_API_VERSION=v1
REACT_APP_ENVIRONMENT=development

# AWS Configuration
REACT_APP_AWS_REGION=us-east-1
REACT_APP_S3_BUCKET=mindsync-dev-static-assets
REACT_APP_CLOUDFRONT_URL=https://d1234567890.cloudfront.net

# Authentication
REACT_APP_JWT_EXPIRY=7d
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
REACT_APP_APPLE_CLIENT_ID=your-apple-client-id

# Feature Flags
REACT_APP_ENABLE_PUSH_NOTIFICATIONS=true
REACT_APP_ENABLE_OFFLINE_MODE=true
REACT_APP_ENABLE_ANALYTICS=false
REACT_APP_DEBUG_MODE=true

# API Keys (if needed on frontend)
REACT_APP_GOOGLE_MAPS_API_KEY=your-maps-api-key
```

### **Expo Configuration (app.config.js)**
```javascript
export default {
  expo: {
    name: "MindSync",
    slug: "mindsync-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.mindsync.app",
      buildNumber: "1"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#FFFFFF"
      },
      package: "com.mindsync.app",
      versionCode: 1
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro"
    },
    extra: {
      eas: {
        projectId: "your-eas-project-id"
      },
      apiUrl: process.env.REACT_APP_API_BASE_URL || "https://dev-api.mindsync.com",
      environment: process.env.REACT_APP_ENVIRONMENT || "development"
    },
    scheme: "mindsync",
    plugins: [
      "expo-router",
      "expo-secure-store",
      "expo-camera",
      "expo-image-picker",
      "expo-notifications"
    ]
  }
};
```

---

## 📋 **PRODUCTION ENVIRONMENT**

### **Environment Variables (.env.production)**
```bash
# API Configuration
REACT_APP_API_BASE_URL=https://api.mindsync.com
REACT_APP_API_VERSION=v1
REACT_APP_ENVIRONMENT=production

# AWS Configuration  
REACT_APP_AWS_REGION=us-east-1
REACT_APP_S3_BUCKET=mindsync-static-assets
REACT_APP_CLOUDFRONT_URL=https://cdn.mindsync.com

# Authentication
REACT_APP_JWT_EXPIRY=7d
REACT_APP_GOOGLE_CLIENT_ID=your-prod-google-client-id
REACT_APP_APPLE_CLIENT_ID=your-prod-apple-client-id

# Feature Flags
REACT_APP_ENABLE_PUSH_NOTIFICATIONS=true
REACT_APP_ENABLE_OFFLINE_MODE=true
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_DEBUG_MODE=false

# API Keys
REACT_APP_GOOGLE_MAPS_API_KEY=your-prod-maps-api-key
```

---

## 🔧 **API SERVICE CONFIGURATION**

### **API Client Setup (services/api.js)**
```javascript
const API_CONFIG = {
  baseURL: process.env.REACT_APP_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'X-App-Version': '1.0.0',
    'X-Device-Type': Platform.OS, // 'ios' | 'android' | 'web'
  },
};

// Axios instance with interceptors
const apiClient = axios.create(API_CONFIG);

// Request interceptor for authentication
apiClient.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      await SecureStore.deleteItemAsync('authToken');
      router.replace('/auth/login');
    }
    return Promise.reject(error);
  }
);
```

---

## 📱 **CORS ORIGINS (Backend Configuration)**

### **Allowed Origins for API Gateway**
```javascript
const allowedOrigins = [
  // Development
  'exp://192.168.1.100:19000',    // Expo dev server
  'http://localhost:19006',        // Expo web
  'https://dev-app.mindsync.com',  // Dev PWA
  
  // Mobile app protocols
  'mindsync://auth',               // Deep linking
  'capacitor://localhost',         // Capacitor
  'ionic://localhost',             // Ionic
  
  // Production
  'https://app.mindsync.com',      // Production PWA
  'https://www.mindsync.com',      // Main website
];
```

---

## 🔐 **AUTHENTICATION HEADERS**

### **Required Headers for API Calls**
```javascript
const authHeaders = {
  'Authorization': 'Bearer <JWT_TOKEN>',
  'Content-Type': 'application/json',
  'X-Device-Type': 'mobile', // 'mobile' | 'web'
  'X-App-Version': '1.0.0',
  'X-Platform': Platform.OS, // 'ios' | 'android' | 'web'
};
```

### **File Upload Headers**
```javascript
const uploadHeaders = {
  'Authorization': 'Bearer <JWT_TOKEN>',
  'Content-Type': 'multipart/form-data',
  'X-Device-Type': 'mobile',
  'X-Upload-Type': 'profile', // 'profile' | 'task' | 'media'
};
```

---

## 📂 **FILE UPLOAD CONFIGURATION**

### **S3 Upload Endpoints**
```javascript
const uploadConfig = {
  profiles: {
    endpoint: '/api/upload/profile',
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
  tasks: {
    endpoint: '/api/upload/task-attachment',
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['*'], // Any file type
  },
  media: {
    endpoint: '/api/upload/media',
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: ['image/*', 'video/*', 'audio/*'],
  },
};
```

---

## 🌐 **API ENDPOINT REFERENCE**

### **Base URLs**
- **Development:** `https://dev-api.mindsync.com`
- **Staging:** `https://staging-api.mindsync.com`
- **Production:** `https://api.mindsync.com`

### **Authentication Endpoints**
```javascript
const authEndpoints = {
  register: 'POST /api/auth/register',
  login: 'POST /api/auth/login',
  googleAuth: 'POST /api/auth/google',
  appleAuth: 'POST /api/auth/apple',
  refreshToken: 'POST /api/auth/refresh',
  getProfile: 'GET /api/auth/profile',
  updateProfile: 'PUT /api/auth/profile',
};
```

### **News Endpoints**
```javascript
const newsEndpoints = {
  getPersonalized: 'GET /api/news/personalized?mood=happy&limit=20',
  getCategories: 'GET /api/news/categories',
  getByCategory: 'GET /api/news/category/technology?limit=20',
  getByMood: 'GET /api/news/mood/happy?limit=20',
  markAsViewed: 'POST /api/news/article/:articleId/view',
  getBookmarks: 'GET /api/news/user/bookmarks',
  addBookmark: 'POST /api/news/user/bookmarks',
  removeBookmark: 'DELETE /api/news/user/bookmarks/:articleId',
};
```

### **Tasks Endpoints**
```javascript
const taskEndpoints = {
  getTasks: 'GET /api/tasks?userId=xxx',
  createTask: 'POST /api/tasks',
  updateTask: 'PUT /api/tasks/:taskId',
  deleteTask: 'DELETE /api/tasks/:taskId',
  getTask: 'GET /api/tasks/:taskId',
};
```

### **Weather Endpoints**
```javascript
const weatherEndpoints = {
  getByCity: 'GET /api/weather/New York',
  getByCoordinates: 'GET /api/weather/coordinates?lat=40.7128&lon=-74.0060',
};
```

---

## 📊 **RESPONSE FORMATS**

### **Success Response**
```javascript
{
  "success": true,
  "data": {
    // Response data here
  },
  "message": "Operation completed successfully"
}
```

### **Error Response**
```javascript
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    // Additional error details
  }
}
```

---

## ⚡ **PERFORMANCE OPTIMIZATION**

### **API Call Best Practices**
```javascript
// Use React Query for caching
const { data, isLoading, error } = useQuery(
  ['news', mood, category],
  () => fetchNews({ mood, category }),
  {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  }
);

// Implement offline support
const useOfflineNews = () => {
  const [cachedNews, setCachedNews] = useState([]);
  const isOnline = useNetInfo().isConnected;
  
  useEffect(() => {
    if (isOnline) {
      // Sync with server
      syncNewsData();
    } else {
      // Use cached data
      loadCachedNews();
    }
  }, [isOnline]);
};
```

---

## 🔧 **DEVELOPMENT TOOLS**

### **Useful Environment Commands**
```bash
# Start development server
npm start
expo start

# Build for production
npm run build
eas build --platform all

# Test API connectivity
curl -X GET "https://dev-api.mindsync.com/api/health" \
  -H "Content-Type: application/json"

# View build logs
eas build:view --platform ios
```

### **Testing API Endpoints**
```javascript
// Test authentication
const testAuth = async () => {
  try {
    const response = await fetch('https://dev-api.mindsync.com/api/auth/profile', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    console.log('Auth test:', await response.json());
  } catch (error) {
    console.error('Auth test failed:', error);
  }
};
```

---

## 🎯 **IMMEDIATE SETUP CHECKLIST**

### **Frontend Team Tasks:**
- [ ] Update `.env` files with provided URLs
- [ ] Configure Expo app.config.js
- [ ] Set up API service layer with interceptors  
- [ ] Implement authentication token management
- [ ] Add CORS handling for mobile platforms
- [ ] Test file upload functionality
- [ ] Set up offline data caching
- [ ] Configure push notifications (future)

### **Ready for Integration:**
- [ ] API base URLs configured
- [ ] Authentication flow implemented
- [ ] File upload endpoints ready
- [ ] Error handling established
- [ ] Offline support prepared

---

**🚀 LET'S COORDINATE THE INTEGRATION! Frontend team is ready for AWS domination! 💪**
