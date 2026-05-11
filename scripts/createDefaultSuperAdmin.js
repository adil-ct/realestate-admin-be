import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

// MongoDB connection strings
const ADMIN_DB_STRING = 'mongodb://127.0.0.1:27017/real_estate';
const AUTH_DB_STRING = 'mongodb://127.0.0.1:27017/real_estate';

// Default Super Admin Credentials
const DEFAULT_SUPER_ADMIN = {
  email: 'admin@candour.com',
  name: 'Candour Admin',
  password: 'Candour@123',
  isSuperAdmin: true,
};

// Admin Schema
const adminSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    userType: { type: String, default: 'admin', enum: ['admin'] },
    password: { type: String, required: true },
    countryCode: { type: String },
    mobileNumber: { type: Number },
    isSuperAdmin: { type: Boolean, default: false },
    twoFA: {
      sms: { type: Boolean, default: false },
      none: { type: Boolean, default: true },
    },
    forgotPasswordRequest: { type: Boolean, default: false },
    forceUpdatePassword: { type: Boolean, default: false },
    status: { type: String, default: 'Active', enum: ['Active', 'Deactive'] },
    name: { type: String, required: true },
    passwordResetToken: String,
  },
  {
    collection: 'admin',
    timestamps: true,
  }
);

// Colors for console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

async function createDefaultSuperAdmin() {
  let adminConn, authConn;
  try {
    console.log(`${colors.bright}${colors.cyan}\n${'='.repeat(70)}`);
    console.log('CREATE DEFAULT SUPER ADMIN');
    console.log(`${'='.repeat(70)}${colors.reset}\n`);

    // Connect to both databases
    console.log(`${colors.cyan}ℹ Connecting to MongoDB databases...${colors.reset}`);
    adminConn = await mongoose.createConnection(ADMIN_DB_STRING).asPromise();
    console.log(`${colors.green}✓ Connected to mogul-admin${colors.reset}`);

    authConn = await mongoose.createConnection(AUTH_DB_STRING).asPromise();
    console.log(`${colors.green}✓ Connected to mogul-user (be-auth)${colors.reset}\n`);

    const AdminModel = adminConn.model('Admin', adminSchema);
    const AuthAdminModel = authConn.model('Admin', adminSchema);

    // Check if super admin already exists
    const existingSuperAdmin = await AdminModel.findOne({ isSuperAdmin: true });

    if (existingSuperAdmin) {
      console.log(`${colors.yellow}⚠ Super Admin already exists!${colors.reset}`);
      console.log(`\n${colors.bright}Existing Super Admin:${colors.reset}`);
      console.log(`${colors.cyan}Email:${colors.reset} ${existingSuperAdmin.email}`);
      console.log(`${colors.cyan}Name:${colors.reset} ${existingSuperAdmin.name}`);
      console.log(`${colors.cyan}Status:${colors.reset} ${existingSuperAdmin.status}`);
      console.log(`${colors.cyan}Created:${colors.reset} ${existingSuperAdmin.createdAt}\n`);

      console.log(`${colors.yellow}ℹ To create a different admin, use: npm run create-admin${colors.reset}\n`);
      await adminConn.close();
      await authConn.close();
      return;
    }

    // Check if email already exists (but not super admin)
    const existingEmail = await AdminModel.findOne({ email: DEFAULT_SUPER_ADMIN.email });
    if (existingEmail) {
      console.log(`${colors.yellow}⚠ Email ${DEFAULT_SUPER_ADMIN.email} already exists but is not a super admin${colors.reset}`);
      console.log(`${colors.yellow}ℹ Promoting to Super Admin...${colors.reset}\n`);

      existingEmail.isSuperAdmin = true;
      existingEmail.name = DEFAULT_SUPER_ADMIN.name;
      existingEmail.status = 'Active';
      const hashedPassword = await bcrypt.hash(DEFAULT_SUPER_ADMIN.password, 10);
      existingEmail.password = hashedPassword;
      await existingEmail.save();

      // Also update in auth database
      const existingAuthAdmin = await AuthAdminModel.findOne({ email: DEFAULT_SUPER_ADMIN.email });
      if (existingAuthAdmin) {
        existingAuthAdmin.isSuperAdmin = true;
        existingAuthAdmin.name = DEFAULT_SUPER_ADMIN.name;
        existingAuthAdmin.status = 'Active';
        existingAuthAdmin.password = hashedPassword;
        await existingAuthAdmin.save();
      } else {
        await AuthAdminModel.create({
          _id: existingEmail._id,
          email: existingEmail.email,
          name: existingEmail.name,
          password: hashedPassword,
          userType: 'admin',
          isSuperAdmin: true,
          status: 'Active',
          twoFA: existingEmail.twoFA,
          forgotPasswordRequest: false,
          forceUpdatePassword: false,
        });
      }

      console.log(`${colors.green}✓ Admin promoted to Super Admin successfully in both databases!${colors.reset}\n`);
    } else {
      // Create new super admin
      console.log(`${colors.cyan}ℹ Creating default Super Admin...${colors.reset}`);
      console.log(`${colors.cyan}ℹ Hashing password...${colors.reset}`);

      const hashedPassword = await bcrypt.hash(DEFAULT_SUPER_ADMIN.password, 10);

      const adminData = {
        email: DEFAULT_SUPER_ADMIN.email,
        name: DEFAULT_SUPER_ADMIN.name,
        password: hashedPassword,
        userType: 'admin',
        isSuperAdmin: true,
        status: 'Active',
        twoFA: {
          sms: false,
          none: true,
        },
        forgotPasswordRequest: false,
        forceUpdatePassword: false,
      };

      // Create in admin database
      const superAdmin = await AdminModel.create(adminData);
      console.log(`${colors.green}✓ Super Admin created in mogul-admin${colors.reset}`);

      // Create in auth database with same _id
      await AuthAdminModel.create({
        _id: superAdmin._id,
        ...adminData,
      });
      console.log(`${colors.green}✓ Super Admin created in mogul-user (be-auth)${colors.reset}\n`);
    }

    // Display credentials
    console.log(`${colors.bright}${colors.green}${'='.repeat(70)}${colors.reset}`);
    console.log(`${colors.bright}DEFAULT SUPER ADMIN CREDENTIALS${colors.reset}`);
    console.log(`${colors.bright}${colors.green}${'='.repeat(70)}${colors.reset}\n`);
    console.log(`${colors.cyan}Email:${colors.reset}     ${DEFAULT_SUPER_ADMIN.email}`);
    console.log(`${colors.cyan}Password:${colors.reset}  ${DEFAULT_SUPER_ADMIN.password}`);
    console.log(`${colors.cyan}Name:${colors.reset}      ${DEFAULT_SUPER_ADMIN.name}`);
    console.log(`${colors.cyan}Role:${colors.reset}      Super Admin`);
    console.log(`${colors.cyan}Status:${colors.reset}    Active`);
    console.log(`${colors.cyan}2FA:${colors.reset}       Disabled`);
    console.log(`${colors.bright}${colors.green}${'='.repeat(70)}${colors.reset}\n`);

    console.log(`${colors.cyan}ℹ Login URL: http://localhost:5000/api/v2/admin/login${colors.reset}`);
    console.log(`${colors.cyan}ℹ Use Postman collection: Phase 1 → Step 1.1: Admin Login${colors.reset}`);
    console.log(`${colors.cyan}ℹ Token will be auto-saved after successful login${colors.reset}\n`);

    console.log(`${colors.yellow}⚠ SECURITY WARNING:${colors.reset}`);
    console.log(`${colors.yellow}  Please change the default password after first login!${colors.reset}\n`);

    // Close connections
    await adminConn.close();
    await authConn.close();
    console.log(`${colors.green}✓ Database connections closed${colors.reset}\n`);
  } catch (error) {
    console.log(`${colors.red}✗ Error: ${error.message}${colors.reset}`);
    if (adminConn && adminConn.readyState === 1) {
      await adminConn.close();
    }
    if (authConn && authConn.readyState === 1) {
      await authConn.close();
    }
    process.exit(1);
  }
}

// Run the script
createDefaultSuperAdmin();
