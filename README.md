# BE-ADMIN Microservice

## Quick Setup



### 1. Install & Create Super Admin
```bash
npm install
npm run create-super-admin
```

**Credentials:** admin@solulab.com / Solulab@123

### 2. Start Services (3 terminals)
```bash
# Terminal 1
cd Backend/be-auth && npm start

# Terminal 2
cd Backend/be-user && npm start

# Terminal 3
cd Backend/be-admin && npm start
```

### 3. Test
Import `be-admin-api-collection.postman_collection.json` → Run Phase 1 → Step 1.1

## Scripts
- `npm run create-super-admin` - Create default admin
- `npm run create-admin` - Create custom admin (interactive)

## Docs
- [BE-ADMIN_TESTING_FLOW.md](BE-ADMIN_TESTING_FLOW.md) - Complete testing guide
