import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import readline from 'readline';

// MongoDB connection strings
const ADMIN_DB_STRING = process.env.DB_STRING || 'mongodb://localhost:27017/mogul-admin';
const AUTH_DB_STRING = 'mongodb://localhost:27017/mogul-user';

// Admin Schema
const adminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    userType: {
      type: String,
      default: 'admin',
      enum: ['admin'],
    },
    password: {
      type: String,
      required: true,
    },
    countryCode: {
      type: String,
    },
    mobileNumber: {
      type: Number,
    },
    isSuperAdmin: {
      type: Boolean,
      default: false,
    },
    twoFA: {
      sms: {
        type: Boolean,
        default: false,
      },
      none: {
        type: Boolean,
        default: true,
      },
    },
    forgotPasswordRequest: {
      type: Boolean,
      default: false,
    },
    forceUpdatePassword: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      default: 'Active',
      enum: ['Active', 'Deactive'],
    },
    name: {
      type: String,
      required: true,
    },
    passwordResetToken: String,
  },
  {
    collection: 'admin',
    timestamps: true,
  }
);

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Promisified question
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Colors for console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.cyan}ℹ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  header: (msg) => console.log(`${colors.bright}${colors.cyan}\n${'='.repeat(60)}\n${msg}\n${'='.repeat(60)}${colors.reset}`),
};

async function createAdmin() {
  let adminConn, authConn;
  try {
    log.header('CREATE ADMIN USER FOR BE-ADMIN SERVICE');

    // Connect to both databases
    log.info('Connecting to MongoDB databases...');
    adminConn = await mongoose.createConnection(ADMIN_DB_STRING).asPromise();
    log.success('Connected to mogul-admin');

    authConn = await mongoose.createConnection(AUTH_DB_STRING).asPromise();
    log.success('Connected to mogul-user (be-auth)');

    const AdminModel = adminConn.model('Admin', adminSchema);
    const AuthAdminModel = authConn.model('Admin', adminSchema);

    console.log('\n');

    // Get admin details
    const email = await question('Enter email address: ');
    const name = await question('Enter full name: ');
    const password = await question('Enter password (min 8 characters): ');
    const isSuperAdminInput = await question('Is this a Super Admin? (y/n): ');
    const isSuperAdmin = isSuperAdminInput.toLowerCase() === 'y';

    // Validate inputs
    if (!email || !email.includes('@')) {
      log.error('Invalid email address');
      process.exit(1);
    }

    if (!name || name.trim().length < 2) {
      log.error('Name must be at least 2 characters');
      process.exit(1);
    }

    if (!password || password.length < 8) {
      log.error('Password must be at least 8 characters');
      process.exit(1);
    }

    // Check if admin already exists
    const existingAdmin = await AdminModel.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      log.error(`Admin with email ${email} already exists!`);
      const update = await question('Do you want to update the password? (y/n): ');

      if (update.toLowerCase() === 'y') {
        const hashedPassword = await bcrypt.hash(password, 10);
        existingAdmin.password = hashedPassword;
        existingAdmin.name = name;
        existingAdmin.isSuperAdmin = isSuperAdmin;
        await existingAdmin.save();

        // Also update in auth database
        const existingAuthAdmin = await AuthAdminModel.findOne({ email: email.toLowerCase() });
        if (existingAuthAdmin) {
          existingAuthAdmin.password = hashedPassword;
          existingAuthAdmin.name = name;
          existingAuthAdmin.isSuperAdmin = isSuperAdmin;
          await existingAuthAdmin.save();
        } else {
          await AuthAdminModel.create({
            _id: existingAdmin._id,
            email: existingAdmin.email,
            name: existingAdmin.name,
            password: hashedPassword,
            userType: 'admin',
            isSuperAdmin,
            status: 'Active',
            twoFA: existingAdmin.twoFA,
            forgotPasswordRequest: false,
            forceUpdatePassword: false,
          });
        }

        log.success(`Admin updated successfully in both databases!`);
        console.log(`\n${colors.bright}Login Credentials:${colors.reset}`);
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        console.log(`Role: ${isSuperAdmin ? 'Super Admin' : 'Admin'}`);
      } else {
        log.info('Admin creation cancelled');
      }

      await adminConn.close();
      await authConn.close();
      rl.close();
      return;
    }

    // Hash password
    log.info('Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin data
    const adminData = {
      email: email.toLowerCase(),
      name,
      password: hashedPassword,
      userType: 'admin',
      isSuperAdmin,
      status: 'Active',
      twoFA: {
        sms: false,
        none: true,
      },
      forgotPasswordRequest: false,
      forceUpdatePassword: false,
    };

    // Create in admin database
    const admin = await AdminModel.create(adminData);
    log.success('Admin created in mogul-admin');

    // Create in auth database with same _id
    await AuthAdminModel.create({
      _id: admin._id,
      ...adminData,
    });
    log.success('Admin created in mogul-user (be-auth)');

    log.success('Admin created successfully in both databases!');
    console.log(`\n${colors.bright}${colors.green}${'='.repeat(60)}${colors.reset}`);
    console.log(`${colors.bright}Login Credentials:${colors.reset}`);
    console.log(`${colors.cyan}Email:${colors.reset} ${email}`);
    console.log(`${colors.cyan}Password:${colors.reset} ${password}`);
    console.log(`${colors.cyan}Name:${colors.reset} ${name}`);
    console.log(`${colors.cyan}Role:${colors.reset} ${isSuperAdmin ? 'Super Admin' : 'Admin'}`);
    console.log(`${colors.cyan}Status:${colors.reset} Active`);
    console.log(`${colors.cyan}2FA:${colors.reset} Disabled`);
    console.log(`${colors.bright}${colors.green}${'='.repeat(60)}${colors.reset}\n`);

    log.info('You can now login at: http://localhost:5000/api/v2/admin/login');
    log.info('Use the Postman collection to test the login');

    // Close connections
    await adminConn.close();
    await authConn.close();
    rl.close();
  } catch (error) {
    log.error(`Error: ${error.message}`);
    if (adminConn && adminConn.readyState === 1) {
      await adminConn.close();
    }
    if (authConn && authConn.readyState === 1) {
      await authConn.close();
    }
    rl.close();
    process.exit(1);
  }
}

// Run the script
createAdmin();
