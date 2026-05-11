# BE-ADMIN Microservice Testing Flow Guide

## Prerequisites

### 1. Start Required Microservices

You need to run **3 microservices** for be-admin to work properly:

```bash
# Terminal 1 - Auth Service (REQUIRED - for JWT token verification)
cd Backend/be-auth
npm start
# Running on: http://localhost:3000

# Terminal 2 - User Service (REQUIRED - for investor data)
cd Backend/be-user
npm start
# Running on: http://localhost:3001

# Terminal 3 - Admin Service (MAIN SERVICE)
cd Backend/be-admin
npm start
# Running on: http://localhost:5000
```

**Why these services are needed:**
- **be-auth**: Validates admin JWT tokens for all protected endpoints
- **be-user**: Provides investor/user data when admin fetches investor lists
- **be-admin**: The main service you're testing

**Services NOT needed for basic admin testing:**
- be-marketplace (only needed if testing property marketplace integration)
- be-payment (only needed if testing payment/transaction integration)
- be-proposals (not required for admin endpoints)
- be-socket (not required for admin endpoints)

### 2. MongoDB
Ensure MongoDB is running on `mongodb://localhost:27017`

### 3. Import Postman Collection
Import `be-admin-api-collection.postman_collection.json` into Postman

### 4. Verify Collection Variables
- `base_url`: http://localhost:5000
- `admin_token`: (auto-saved after login)

---

## BE-ADMIN Only Testing Flow

This flow tests **ONLY be-admin endpoints** without requiring marketplace, payment, or other services.

---

### Phase 1: Admin Authentication ✅

**Service Used:** be-admin only (authentication happens locally)

#### Step 1.1: Admin Login
**Endpoint:** `POST http://localhost:5000/api/v2/admin/admin/login`

**Request Body:**
```json
{
  "email": "admin@solulab.com",
  "password": "Solulab@123"
}
```

**Expected Response:** 200 OK
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "admin": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "email": "admin@solulab.com",
      "name": "SoluLab Admin",
      "role": "SUPER_ADMIN"
    }
  }
}
```

**Note:**
- Token is auto-saved to `{{admin_token}}` variable
- If first time, admin is auto-created with SUPER_ADMIN role
- Use this token for all subsequent requests

---

#### Step 1.2: Get Admin Profile
**Endpoint:** `GET http://localhost:5000/api/v2/admin/admin/profile`

**Headers:**
```
Authorization: Bearer {{admin_token}}
```

**Expected Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "email": "admin@example.com",
    "firstName": "Admin",
    "lastName": "User",
    "role": "SUPER_ADMIN",
    "permissions": ["ALL"],
    "isActive": true,
    "createdAt": "2025-01-15T10:00:00.000Z"
  }
}
```

**Verify:**
- ✅ Token is valid
- ✅ Admin role is SUPER_ADMIN
- ✅ Profile data is returned

---

#### Step 1.3: Update Admin Profile
**Endpoint:** `PATCH http://localhost:5000/api/v2/admin/admin/profile`

**Headers:**
```
Authorization: Bearer {{admin_token}}
```

**Request Body:**
```json
{
  "firstName": "Super",
  "lastName": "Administrator",
  "phone": "+1234567890"
}
```

**Expected Response:** 200 OK with updated profile

---

#### Step 1.4: Test Forgot Password (Optional)
**Endpoint:** `POST http://localhost:5000/api/v2/admin/admin/forget-password`

**Request Body:**
```json
{
  "email": "admin@solulab.com"
}
```

**Expected Response:** 200 OK
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

**Note:** Check SendGrid email or admin logs for reset token

---

#### Step 1.5: Reset Password (Optional)
**Endpoint:** `POST http://localhost:5000/api/v2/admin/admin/reset-password`

**Request Body:**
```json
{
  "token": "reset_token_from_email",
  "password": "NewPassword@123"
}
```

**Expected Response:** 200 OK, password reset successful

---

### Phase 2: Admin Management (Super Admin Only) ✅

**Service Used:** be-admin only

#### Step 2.1: Create New Admin
**Endpoint:** `POST http://localhost:5000/api/v2/admin/admin/create-admin`

**Headers:**
```
Authorization: Bearer {{admin_token}}
```

**Request Body:**
```json
{
  "email": "newadmin@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "password": "Admin@123",
  "role": "ADMIN",
  "permissions": ["VIEW_PROPERTIES", "MANAGE_USERS"]
}
```

**Expected Response:** 201 Created
```json
{
  "success": true,
  "message": "Admin created successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
    "email": "newadmin@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "ADMIN"
  }
}
```

**Note:** Save the `_id` for next steps

---

#### Step 2.2: Get All Admins
**Endpoint:** `GET http://localhost:5000/api/v2/admin/admin/get-admin-list`

**Headers:**
```
Authorization: Bearer {{admin_token}}
```

**Query Params:**
- page: 1
- limit: 10

**Expected Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "admins": [
      {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
        "email": "admin@example.com",
        "role": "SUPER_ADMIN"
      },
      {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
        "email": "newadmin@example.com",
        "role": "ADMIN"
      }
    ],
    "total": 2,
    "page": 1,
    "totalPages": 1
  }
}
```

**Verify:**
- ✅ Both admins appear in list
- ✅ Pagination works

---

#### Step 2.3: Get Admin by ID
**Endpoint:** `GET http://localhost:5000/api/v2/admin/admin/:adminId`

**Example:** `GET http://localhost:5000/api/v2/admin/admin/65a1b2c3d4e5f6g7h8i9j0k2`

**Headers:**
```
Authorization: Bearer {{admin_token}}
```

**Expected Response:** 200 OK with admin details

---

#### Step 2.4: Update Admin
**Endpoint:** `PATCH http://localhost:5000/api/v2/admin/admin/:adminId`

**Example:** `PATCH http://localhost:5000/api/v2/admin/admin/65a1b2c3d4e5f6g7h8i9j0k2`

**Headers:**
```
Authorization: Bearer {{admin_token}}
```

**Request Body:**
```json
{
  "firstName": "Jane",
  "permissions": ["VIEW_PROPERTIES", "MANAGE_USERS", "MANAGE_PROPERTIES"]
}
```

**Expected Response:** 200 OK with updated admin

---

#### Step 2.5: Delete Admin
**Endpoint:** `DELETE http://localhost:5000/api/v2/admin/admin/:adminId`

**Example:** `DELETE http://localhost:5000/api/v2/admin/admin/65a1b2c3d4e5f6g7h8i9j0k2`

**Headers:**
```
Authorization: Bearer {{admin_token}}
```

**Expected Response:** 200 OK
```json
{
  "success": true,
  "message": "Admin deleted successfully"
}
```

---

### Phase 3: Investor Management ✅

**Services Used:** be-admin + be-user (investor data comes from be-user)

**Prerequisites:**
- ✅ be-user must be running on port 3001
- ✅ At least one user registered in be-user (use be-user registration endpoint first)

#### Step 3.1: Get All Investors
**Endpoint:** `GET http://localhost:5000/api/v2/admin/admin/getInvestorList`

**Headers:**
```
Authorization: Bearer {{admin_token}}
```

**Query Params:**
- page: 1
- limit: 10
- search: (optional) "john"

**Expected Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "investors": [
      {
        "_id": "user_id_from_be_user",
        "email": "investor@example.com",
        "firstName": "John",
        "lastName": "Smith",
        "totalInvestment": 50000,
        "propertiesOwned": 3,
        "isBlacklisted": false
      }
    ],
    "total": 1,
    "page": 1
  }
}
```

**Note:** This endpoint calls be-user internally to fetch user data

---

#### Step 3.2: Get Investor Details
**Endpoint:** `GET http://localhost:5000/api/v2/admin/admin/investor/:investorId`

**Example:** `GET http://localhost:5000/api/v2/admin/admin/investor/65a1b2c3d4e5f6g7h8i9j0k3`

**Headers:**
```
Authorization: Bearer {{admin_token}}
```

**Expected Response:** 200 OK with investor profile and transaction history

---

#### Step 3.3: Get Investor Portfolio
**Endpoint:** `GET http://localhost:5000/api/v2/admin/admin/investor-portfolio/:investorId`

**Headers:**
```
Authorization: Bearer {{admin_token}}
```

**Expected Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "investorId": "65a1b2c3d4e5f6g7h8i9j0k3",
    "totalInvestment": 50000,
    "properties": [
      {
        "propertyId": "property_id",
        "propertyName": "Luxury Apartment",
        "tokensOwned": 100,
        "investmentAmount": 10000,
        "currentValue": 12000,
        "roi": 20
      }
    ]
  }
}
```

---

#### Step 3.4: Blacklist Investor
**Endpoint:** `POST http://localhost:5000/api/v2/admin/admin/blacklist-investor/:investorId`

**Headers:**
```
Authorization: Bearer {{admin_token}}
```

**Request Body:**
```json
{
  "reason": "Fraudulent activity detected"
}
```

**Expected Response:** 200 OK
```json
{
  "success": true,
  "message": "Investor blacklisted successfully"
}
```

---

#### Step 3.5: Remove from Blacklist
**Endpoint:** `DELETE http://localhost:5000/api/v2/admin/admin/blacklist-investor/:investorId`

**Headers:**
```
Authorization: Bearer {{admin_token}}
```

**Expected Response:** 200 OK, investor removed from blacklist

---

### Phase 4: Property Management ✅

**Service Used:** be-admin only (properties stored in mogul-admin database)

#### Step 4.1: Get All Properties
**Endpoint:** `GET http://localhost:5000/api/v2/admin/property`

**Headers:**
```
Authorization: Bearer {{admin_token}}
```

**Query Params:**
- page: 1
- limit: 10
- status: ACTIVE (optional)
- search: (optional) "apartment"

**Expected Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "properties": [
      {
        "_id": "property_id",
        "name": "Luxury Apartment Downtown",
        "location": {
          "city": "New York",
          "state": "NY"
        },
        "totalTokens": 1000,
        "pricePerToken": 100,
        "status": "ACTIVE",
        "createdAt": "2025-01-15T10:00:00.000Z"
      }
    ],
    "total": 1,
    "page": 1
  }
}
```

---

#### Step 4.2: Create New Property (Super Admin)
**Endpoint:** `POST http://localhost:5000/api/v2/admin/property`

**Headers:**
```
Authorization: Bearer {{admin_token}}
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Luxury Apartment Downtown",
  "description": "Modern 2BHK apartment in city center with premium amenities",
  "location": {
    "address": "123 Main Street",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA",
    "latitude": 40.7128,
    "longitude": -74.0060
  },
  "propertyType": "APARTMENT",
  "totalTokens": 1000,
  "pricePerToken": 100,
  "minimumInvestment": 1000,
  "maximumInvestment": 50000,
  "expectedReturn": 12.5,
  "rentalYield": 8.0,
  "appreciationRate": 4.5,
  "startDate": "2025-01-20T00:00:00.000Z",
  "endDate": "2025-12-20T00:00:00.000Z",
  "images": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ],
  "documents": [
    {
      "name": "Property Deed",
      "url": "https://example.com/deed.pdf",
      "type": "LEGAL"
    }
  ],
  "amenities": ["Swimming Pool", "Gym", "Parking", "Security"],
  "highlights": {
    "bedrooms": 2,
    "bathrooms": 2,
    "area": 1200,
    "areaUnit": "sqft"
  }
}
```

**Expected Response:** 201 Created
```json
{
  "success": true,
  "message": "Property created successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k5",
    "name": "Luxury Apartment Downtown",
    "status": "DRAFT",
    "totalTokens": 1000,
    "pricePerToken": 100
  }
}
```

**Note:** Save the property `_id` for next steps

---

#### Step 4.3: Get Property Details
**Endpoint:** `GET http://localhost:5000/api/v2/admin/property/:propertyId`

**Example:** `GET http://localhost:5000/api/v2/admin/property/65a1b2c3d4e5f6g7h8i9j0k5`

**Headers:**
```
Authorization: Bearer {{admin_token}}
```

**Expected Response:** 200 OK with complete property details

---

#### Step 4.4: Update Property
**Endpoint:** `PATCH http://localhost:5000/api/v2/admin/property/:propertyId`

**Headers:**
```
Authorization: Bearer {{admin_token}}
```

**Request Body:**
```json
{
  "description": "Updated description with more details",
  "status": "ACTIVE",
  "pricePerToken": 105
}
```

**Expected Response:** 200 OK
```json
{
  "success": true,
  "message": "Property updated successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k5",
    "name": "Luxury Apartment Downtown",
    "status": "ACTIVE",
    "pricePerToken": 105
  }
}
```

---

#### Step 4.5: Upload Property Files
**Endpoint:** `POST http://localhost:5000/api/v2/admin/property/file.upload`

**Headers:**
```
Authorization: Bearer {{admin_token}}
Content-Type: multipart/form-data
```

**Body:** (form-data)
- `files`: [Select image/PDF files]
- `propertyId`: "65a1b2c3d4e5f6g7h8i9j0k5"
- `fileType`: "PROPERTY_IMAGE" or "DOCUMENT"

**Expected Response:** 200 OK
```json
{
  "success": true,
  "message": "Files uploaded successfully",
  "data": {
    "urls": [
      "https://storage.example.com/property1.jpg",
      "https://storage.example.com/property2.jpg"
    ]
  }
}
```

**Note:** This might require AWS S3 or storage service configuration

---

#### Step 4.6: Delete Property
**Endpoint:** `DELETE http://localhost:5000/api/v2/admin/property/:propertyId`

**Headers:**
```
Authorization: Bearer {{admin_token}}
```

**Expected Response:** 200 OK
```json
{
  "success": true,
  "message": "Property deleted successfully"
}
```

**Note:** Can only delete if no investors have purchased tokens

---

### Phase 5: Property Manager Management ✅

**Service Used:** be-admin only

#### Step 5.1: Get All Property Managers
**Endpoint:** `GET http://localhost:5000/api/v2/admin/propertyManager`

**Headers:**
```
Authorization: Bearer {{admin_token}}
```

**Expected Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "managers": [
      {
        "_id": "manager_id",
        "email": "manager@example.com",
        "firstName": "Mike",
        "lastName": "Johnson",
        "company": "Property Management Inc",
        "propertiesManaged": 5
      }
    ]
  }
}
```

---

#### Step 5.2: Create Property Manager
**Endpoint:** `POST http://localhost:5000/api/v2/admin/propertyManager`

**Headers:**
```
Authorization: Bearer {{admin_token}}
```

**Request Body:**
```json
{
  "email": "manager@example.com",
  "firstName": "Mike",
  "lastName": "Johnson",
  "company": "Property Management Inc",
  "phone": "+1234567890",
  "address": "456 Manager Street, NY"
}
```

**Expected Response:** 201 Created
```json
{
  "success": true,
  "message": "Property manager created successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k6",
    "email": "manager@example.com",
    "firstName": "Mike"
  }
}
```

---

#### Step 5.3: Get Property Manager Details
**Endpoint:** `GET http://localhost:5000/api/v2/admin/propertyManager/:managerId`

**Headers:**
```
Authorization: Bearer {{admin_token}}
```

**Expected Response:** 200 OK with manager details and assigned properties

---

#### Step 5.4: Update Property Manager
**Endpoint:** `PUT http://localhost:5000/api/v2/admin/propertyManager/:managerId`

**Headers:**
```
Authorization: Bearer {{admin_token}}
```

**Request Body:**
```json
{
  "phone": "+9876543210",
  "company": "Elite Property Management"
}
```

**Expected Response:** 200 OK

---

#### Step 5.5: Delete Property Manager
**Endpoint:** `DELETE http://localhost:5000/api/v2/admin/propertyManager/:managerId`

**Headers:**
```
Authorization: Bearer {{admin_token}}
```

**Expected Response:** 200 OK

---

### Phase 6: Dashboard & Analytics ✅

**Service Used:** be-admin only

#### Step 6.1: Get Dashboard Stats
**Endpoint:** `GET http://localhost:5000/api/v2/admin/dashboard/stats`

**Headers:**
```
Authorization: Bearer {{admin_token}}
```

**Expected Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "totalProperties": 15,
    "activeProperties": 10,
    "totalInvestors": 250,
    "activeInvestors": 200,
    "totalInvestment": 5000000,
    "totalPropertyValue": 6000000,
    "averageROI": 12.5,
    "totalRentCollected": 500000,
    "pendingDistributions": 50000
  }
}
```

---

#### Step 6.2: Get Property Performance
**Endpoint:** `GET http://localhost:5000/api/v2/admin/dashboard/property-performance/:propertyId`

**Headers:**
```
Authorization: Bearer {{admin_token}}
```

**Expected Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "propertyId": "property_id",
    "propertyName": "Luxury Apartment",
    "occupancyRate": 95,
    "rentCollectionRate": 98,
    "actualROI": 13.2,
    "expectedROI": 12.5,
    "totalRentCollected": 120000,
    "totalExpenses": 20000,
    "netIncome": 100000
  }
}
```

---

### Phase 7: Health Check ✅

**Service Used:** be-admin only

#### Step 7.1: Health Check
**Endpoint:** `GET http://localhost:5000/api/v2/admin/health`

**No authentication required**

**Expected Response:** 200 OK
```json
{
  "status": "OK",
  "timestamp": "2025-01-15T10:00:00.000Z",
  "service": "be-admin",
  "version": "2.0.0",
  "database": "connected"
}
```

---

## Recommended Testing Sequence

### Quick Test (5 minutes)
Test basic admin functionality without external dependencies:

1. ✅ **Health Check** → Verify service is running
2. ✅ **Admin Login** → Get token
3. ✅ **Get Profile** → Verify authentication
4. ✅ **Create Property** → Test property creation
5. ✅ **Get Properties** → Verify property was saved
6. ✅ **Dashboard Stats** → Check analytics

**Commands:**
```bash
# Start only be-admin
cd Backend/be-admin
npm start
```

---

### Standard Test (15 minutes)
Test admin with user integration:

1. ✅ **Start Services** → be-auth, be-user, be-admin
2. ✅ **Admin Login** → Get token
3. ✅ **Get Profile** → Verify authentication
4. ✅ **Create Admin** → Test admin management
5. ✅ **Get Admin List** → Verify multiple admins
6. ✅ **Create Property** → Test property creation
7. ✅ **Update Property** → Test property update
8. ✅ **Get Properties** → Verify properties
9. ✅ **Create Property Manager** → Test manager creation
10. ✅ **Get Investors** → Test user integration (requires users in be-user)
11. ✅ **Dashboard Stats** → Check analytics

**Commands:**
```bash
# Terminal 1
cd Backend/be-auth
npm start

# Terminal 2
cd Backend/be-user
npm start

# Terminal 3
cd Backend/be-admin
npm start
```

---

### Complete Test (30 minutes)
Full admin workflow:

**All phases in order:**
1. Authentication (Steps 1.1 - 1.5)
2. Admin Management (Steps 2.1 - 2.5)
3. Property Management (Steps 4.1 - 4.6)
4. Property Manager Management (Steps 5.1 - 5.5)
5. Investor Management (Steps 3.1 - 3.5) - requires users in be-user
6. Dashboard & Analytics (Steps 6.1 - 6.2)
7. Health Check (Step 7.1)

---

## Endpoints NOT Tested (Require Other Services)

These endpoints are in be-admin but depend on services not started:

### Blockchain-Related (Require Smart Contracts)
- `POST /api/v2/admin/property/:propertyId/mint` - Mint property tokens
- `POST /api/v2/admin/property/:propertyId/offering` - Create blockchain offering
- `POST /api/v2/admin/cashflow/deposit-rent` - Distribute rent on blockchain
- `GET /api/v2/admin/cashflow/cashflow-transaction` - Blockchain cashflow history

**These will be tested when:**
- Smart contracts are integrated
- Fireblocks is configured
- Test tokens are available

### Marketplace Integration (Require be-marketplace)
- Property listing sync with marketplace
- Investment tracking from marketplace

**These will be tested when:**
- be-marketplace is started
- Marketplace integration is complete

---

## Common Issues & Solutions

### ❌ Error: 401 Unauthorized
**Cause:** Token not saved or expired
**Solution:**
- Re-run Step 1.1 (Admin Login)
- Verify `{{admin_token}}` is set in Postman
- Check Authorization header: `Bearer {{admin_token}}`

---

### ❌ Error: 403 Forbidden
**Cause:** Insufficient permissions (not super admin)
**Solution:**
- Check admin role in Step 1.2 (Get Profile)
- Ensure role is "SUPER_ADMIN" for create/delete operations
- Only super admin can create properties, admins, etc.

---

### ❌ Error: 404 Not Found
**Cause:** Incorrect endpoint or resource doesn't exist
**Solution:**
- Verify URL exactly matches: `http://localhost:5000/api/v2/admin/...`
- Check if resource ID exists (propertyId, adminId)
- Ensure be-admin is running on port 5000

---

### ❌ Error: 500 Internal Server Error
**Cause:** Database issue or service not running
**Solution:**
- Check be-admin terminal logs for error details
- Verify MongoDB is running: `mongodb://localhost:27017`
- Ensure database name is `mogul-admin` in .env
- Check if be-auth and be-user are running (for investor endpoints)

---

### ❌ Error: Connection Refused
**Cause:** Service not started
**Solution:**
```bash
# Check if services are running
# be-auth should be on port 3000
# be-user should be on port 3001
# be-admin should be on port 5000

# Start missing service
cd Backend/be-admin
npm start
```

---

### ❌ Empty Investor List
**Cause:** No users registered in be-user
**Solution:**
- Start be-user service
- Register a test user using be-user registration endpoint
- Then retry Step 3.1 (Get Investors)

---

## Testing Checklist

### Before Testing
- [ ] MongoDB is running
- [ ] be-auth is running on port 3000
- [ ] be-user is running on port 3001
- [ ] be-admin is running on port 5000
- [ ] Postman collection imported
- [ ] Collection variables configured

### Core Admin Functions
- [ ] Admin login successful
- [ ] Admin token auto-saved
- [ ] Get profile returns data
- [ ] Create admin works (super admin only)
- [ ] Get admin list shows multiple admins
- [ ] Update admin works
- [ ] Delete admin works

### Property Management
- [ ] Create property successful
- [ ] Get all properties returns list
- [ ] Get property by ID works
- [ ] Update property works
- [ ] Delete property works
- [ ] File upload works (if storage configured)

### Property Manager
- [ ] Create property manager works
- [ ] Get manager list works
- [ ] Update manager works
- [ ] Delete manager works

### Investor Management (Requires be-user)
- [ ] Get investor list works
- [ ] Get investor details works
- [ ] Get investor portfolio works
- [ ] Blacklist investor works
- [ ] Remove from blacklist works

### Dashboard
- [ ] Dashboard stats return data
- [ ] Property performance analytics work

### Health & Misc
- [ ] Health check returns OK
- [ ] All responses have proper status codes
- [ ] Error messages are clear

---

## Next Steps

After completing be-admin testing:

1. **Test be-user microservice** - User registration, KYC, wallet
2. **Test be-marketplace microservice** - Property listings, investments
3. **Test be-payment microservice** - Payments, withdrawals
4. **Test be-auth microservice** - Authentication flows
5. **Integration testing** - Cross-service flows
6. **Blockchain integration** - Smart contract interactions

Each microservice will have its own testing flow document.
