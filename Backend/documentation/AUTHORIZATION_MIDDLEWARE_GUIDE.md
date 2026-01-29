# Authorization Middleware Guide

Complete guide for using role-based and permission-based authorization in SARVVIVAH backend.

## Table of Contents
1. [Overview](#overview)
2. [Middleware Functions](#middleware-functions)
3. [Usage Examples](#usage-examples)
4. [Security Features](#security-features)
5. [Best Practices](#best-practices)

---

## Overview

The authorization system provides three middleware functions:
- **`authorizeRole()`** - Role-based access control
- **`authorizePermission()`** - Permission-based access control  
- **`checkOwnership()`** - Resource ownership verification

### Key Features
✅ ADMIN bypasses all permission checks  
✅ Automatic inactive user blocking  
✅ Audit logging for failed attempts  
✅ OR logic for multiple permissions/roles  
✅ Detailed backend logging  

---

## Middleware Functions

### 1. authorizeRole(allowedRoles)

Restricts access to users with specific roles.

**Parameters:**
- `allowedRoles` (string[]): Array of allowed role names

**Example:**
```javascript
import { authorizeRole } from '../middleware/authorization.js';

// Only ADMIN can access
router.get('/admin/dashboard', auth, authorizeRole(['ADMIN']), getDashboard);

// ADMIN or MODERATOR can access
router.get('/moderation/reports', auth, authorizeRole(['ADMIN', 'MODERATOR']), getReports);
```

---

### 2. authorizePermission(requiredPermissions)

Restricts access based on specific permissions. User needs **at least ONE** of the specified permissions (OR logic).

**Parameters:**
- `requiredPermissions` (string[]): Array of required permission names

**Special Behavior:**
- ADMIN role **automatically bypasses** all permission checks

**Example:**
```javascript
import { authorizePermission } from '../middleware/authorization.js';

// User needs 'delete_users' permission
router.delete('/users/:id', auth, authorizePermission(['delete_users']), deleteUser);

// User needs EITHER 'export_reports' OR 'view_analytics'
router.get('/reports/export', auth, authorizePermission(['export_reports', 'view_analytics']), exportReports);
```

---

### 3. checkOwnership(paramName, options)

Verifies user owns the resource they're accessing. Useful for "edit own profile" scenarios.

**Parameters:**
- `paramName` (string): Route parameter name to check (e.g., 'userId', 'photoId')
- `options` (object):
  - `bypassRoles` (string[]): Roles that bypass check (default: ['ADMIN', 'MODERATOR'])
  - `resourceType` (string): Resource type for logging (default: 'resource')

**Example:**
```javascript
import { checkOwnership } from '../middleware/authorization.js';

// User can only edit their own profile
router.put('/profile/:userId', 
  auth, 
  authorizePermission(['edit_own_profile']),
  checkOwnership('userId'), 
  updateProfile
);

// User can only delete their own photo
router.delete('/photos/:photoId', 
  auth,
  authorizePermission(['delete_own_photo']),
  checkOwnership('photoId', { resourceType: 'photo' }),
  deletePhoto
);

// Custom bypass roles
router.put('/messages/:messageId', 
  auth,
  checkOwnership('messageId', { 
    bypassRoles: ['ADMIN'], 
    resourceType: 'message' 
  }),
  editMessage
);
```

---

## Usage Examples

### Example 1: Admin Analytics Dashboard
```javascript
// Only ADMIN role can access
router.get('/admin/analytics', 
  auth, 
  authorizeRole(['ADMIN']), 
  getAnalytics
);
```

### Example 2: Photo Moderation
```javascript
// MODERATOR or ADMIN can approve photos
router.post('/photos/:photoId/approve', 
  auth,
  authorizeRole(['MODERATOR', 'ADMIN']),
  approvePhoto
);
```

### Example 3: User Management
```javascript
// Need specific permission (ADMIN auto-passes)
router.delete('/users/:userId', 
  auth,
  authorizePermission(['delete_users']),
  deleteUser
);

// Deactivate user account
router.patch('/users/:userId/deactivate', 
  auth,
  authorizePermission(['activate_deactivate_users']),
  deactivateUser
);
```

### Example 4: Profile Management (Ownership)
```javascript
// User can edit their OWN profile
router.put('/profiles/:userId', 
  auth,
  authorizePermission(['edit_own_profile']),
  checkOwnership('userId'),
  updateProfile
);

// ADMIN can edit ANY profile (no ownership check)
router.put('/admin/profiles/:userId', 
  auth,
  authorizePermission(['manage_users']),
  // No checkOwnership - ADMIN can edit any profile
  adminUpdateProfile
);
```

### Example 5: Photo Management
```javascript
// Upload photo (any user with permission)
router.post('/photos', 
  auth,
  authorizePermission(['upload_photo']),
  uploadPhoto
);

// Delete own photo only
router.delete('/photos/:photoId', 
  auth,
  authorizePermission(['delete_own_photo']),
  checkOwnership('photoId', { resourceType: 'photo' }),
  deletePhoto
);
```

### Example 6: Report Management
```javascript
// View reports (MODERATOR or ADMIN)
router.get('/reports', 
  auth,
  authorizeRole(['MODERATOR', 'ADMIN']),
  getReports
);

// Export reports (specific permission)
router.post('/reports/export', 
  auth,
  authorizePermission(['export_reports']),
  exportReports
);
```

### Example 7: Combining Multiple Checks
```javascript
// Must be ADMIN AND have specific permission (double security)
router.post('/system/reset', 
  auth,
  authorizeRole(['ADMIN']),
  authorizePermission(['manage_master_data']),
  resetSystem
);
```

---

## Security Features

### 1. Automatic Inactive User Blocking
Both `authorizeRole()` and `authorizePermission()` check if user's `is_active` flag is true.

```javascript
// If user.is_active === false
// Response: 403 Forbidden - "Your account has been deactivated"
```

### 2. ADMIN Bypass
ADMIN role automatically passes ALL permission checks (but NOT role checks).

```javascript
// ADMIN bypasses this
authorizePermission(['delete_users']); // ✅ ADMIN passes

// ADMIN must still have the role
authorizeRole(['MODERATOR']); // ❌ ADMIN fails (not a MODERATOR)
```

### 3. Audit Logging
All failed authorization attempts are logged to:
- **Console/File Logs** (via Winston logger)
- **Database Audit Trail** (`audit_logs` table)

Logged information:
- User ID
- Role/Permissions
- IP Address
- Request path/method
- Failure reason

### 4. OR Logic
When multiple permissions/roles are specified, user needs **ANY ONE** (not all).

```javascript
// User needs EITHER permission
authorizePermission(['approve_photos', 'moderate_content']);

// User needs EITHER role
authorizeRole(['ADMIN', 'MODERATOR']);
```

---

## Best Practices

### ✅ DO

1. **Always use `auth` middleware before authorization**
   ```javascript
   router.delete('/users/:id', auth, authorizePermission(['delete_users']), deleteUser);
   ```

2. **Use permission-based for granular control**
   ```javascript
   // Better (flexible)
   authorizePermission(['delete_users'])
   
   // vs role-based (rigid)
   authorizeRole(['ADMIN'])
   ```

3. **Add ownership checks for user resources**
   ```javascript
   router.put('/profile/:userId', 
     auth, 
     authorizePermission(['edit_own_profile']),
     checkOwnership('userId'), 
     updateProfile
   );
   ```

4. **Use role-based for broad access levels**
   ```javascript
   // Admin-only sections
   router.use('/admin/*', auth, authorizeRole(['ADMIN']));
   ```

5. **Combine checks for critical operations**
   ```javascript
   router.delete('/system/data', 
     auth,
     authorizeRole(['ADMIN']),
     authorizePermission(['manage_master_data']),
     deleteSystemData
   );
   ```

### ❌ DON'T

1. **Don't skip auth middleware**
   ```javascript
   // ❌ BAD
   router.delete('/users/:id', authorizePermission(['delete_users']), deleteUser);
   
   // ✅ GOOD
   router.delete('/users/:id', auth, authorizePermission(['delete_users']), deleteUser);
   ```

2. **Don't use ownership check without permission check**
   ```javascript
   // ❌ BAD
   router.put('/profile/:userId', auth, checkOwnership('userId'), updateProfile);
   
   // ✅ GOOD
   router.put('/profile/:userId', auth, authorizePermission(['edit_own_profile']), checkOwnership('userId'), updateProfile);
   ```

3. **Don't hardcode permissions in controllers**
   ```javascript
   // ❌ BAD
   async deleteUser(req, res) {
     if (req.user.roleName !== 'ADMIN') {
       return res.status(403).json({ error: 'Forbidden' });
     }
     // ...
   }
   
   // ✅ GOOD - Use middleware
   router.delete('/users/:id', auth, authorizeRole(['ADMIN']), deleteUser);
   ```

---

## Error Responses

### 401 Unauthorized (Not Authenticated)
```json
{
  "success": false,
  "error": "Authentication required"
}
```

### 403 Forbidden (Insufficient Permissions)
```json
{
  "success": false,
  "error": "You do not have permission to access this resource"
}
```

### 403 Forbidden (Account Deactivated)
```json
{
  "success": false,
  "error": "Your account has been deactivated"
}
```

---

## Testing

```javascript
// Test role authorization
describe('Authorization Middleware', () => {
  it('should allow ADMIN to access admin routes', async () => {
    const response = await request(app)
      .get('/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(response.status).toBe(200);
  });

  it('should block USER from accessing admin routes', async () => {
    const response = await request(app)
      .get('/admin/dashboard')
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(response.status).toBe(403);
  });

  it('should allow user to edit own profile', async () => {
    const response = await request(app)
      .put(`/profile/${userId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ full_name: 'Updated Name' });
    
    expect(response.status).toBe(200);
  });

  it('should block user from editing other profiles', async () => {
    const response = await request(app)
      .put(`/profile/${otherUserId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ full_name: 'Hacked Name' });
    
    expect(response.status).toBe(403);
  });
});
```

---

## Quick Reference

| Use Case | Middleware | Example |
|----------|-----------|---------|
| Admin-only routes | `authorizeRole(['ADMIN'])` | Dashboard, system settings |
| Moderator routes | `authorizeRole(['MODERATOR', 'ADMIN'])` | Content moderation |
| Specific actions | `authorizePermission(['delete_users'])` | Delete user, export data |
| Own resource | `checkOwnership('userId')` | Edit own profile, delete own photo |
| Critical operations | Both role + permission | System reset, data deletion |

---

**Need Help?** Check the inline JSDoc comments in `authorization.js` for more details!