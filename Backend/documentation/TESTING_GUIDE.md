# Complete Photo Upload Testing Guide

## 🎯 Overview

You have **3 ways** to test photo upload without a frontend:

1. **HTML Test Page** - Visual, browser-based ✅ Easiest
2. **Postman/Thunder Client** - API testing tool
3. **Node.js Script** - Automated testing

---

## 📋 Prerequisites

1. **Backend running**: `npm run dev`
2. **Test user account**: Create via `/auth/register` or use existing
3. **JWT Token**: Get from `/auth/login`

---

## Method 1: HTML Test Page (Recommended) 🌐

### Steps:

1. **Open the HTML file** in your browser:
   ```
   Open: Backend/test-upload.html
   ```

2. **Get your JWT token**:
   - Use Postman or login via your API
   - Copy the token from response

3. **Fill the form**:
   - Paste JWT token
   - Enter your User ID
   - Select photo visibility
   - Choose a photo file

4. **Click Upload**

**Note**: The HTML version currently uses mock URLs because it doesn't have the UploadThing SDK. It tests your backend endpoint.

---

## Method 2: Postman/Thunder Client 📮

### Quick Test (3 Steps):

#### Step 1: Login
```
POST http://localhost:3000/auth/login

Body (JSON):
{
  "email": "your-email@example.com",
  "password": "your-password"
}
```

Copy `accessToken` and `user.id` from response.

#### Step 2: Upload Photo
```
POST http://localhost:3000/users/{userId}/photos

Headers:
  Authorization: Bearer {accessToken}
  Content-Type: application/json

Body (JSON):
{
  "fileUrl": "https://picsum.photos/600/800",
  "visibility": "PUBLIC"
}
```

#### Step 3: Verify Upload
```
GET http://localhost:3000/users/{userId}/photos

Headers:
  Authorization: Bearer {accessToken}
```

### Test Image URLs You Can Use:
- `https://picsum.photos/600/800` (Random photo)
- `https://via.placeholder.com/600/FF0000/FFFFFF?text=Test`
- `https://i.imgur.com/ABC123.jpg` (Upload to imgur first)

---

## Method 3: Automated Node.js Script 🤖

### Setup:

1. **Edit the script**:
   ```javascript
   // Open: Backend/test-photo-upload.js
   // Update line 12-15 with your credentials:
   const TEST_USER = {
     email: 'your-email@example.com',
     password: 'your-password'
   };
   ```

2. **Run the script**:
   ```bash
   node test-photo-upload.js
   ```

### What it tests:
- ✅ Login authentication
- ✅ Upload multiple photos
- ✅ Photo limit (max 5)
- ✅ Get user photos
- ✅ Set primary photo
- ✅ Delete photo
- ✅ Error cases (invalid URL, etc.)

---

## 🧪 Test Scenarios to Cover

### ✅ Success Cases:

1. **First photo upload** → Should be `is_primary: true`
2. **Second photo** → Should be `is_primary: false`
3. **Public visibility** → `visibility: "PUBLIC"`
4. **Private visibility** → `visibility: "PRIVATE"`
5. **Set primary** → Changes `is_primary` flag

### ❌ Error Cases:

1. **No authentication** → 401 Unauthorized
2. **Wrong user ID** → 403 Forbidden
3. **Invalid URL** → 400 Bad Request
4. **6th photo upload** → 400 "Maximum 5 photos allowed"
5. **Invalid visibility** → 400 Bad Request

---

## 📊 Expected Database State

After successful upload, check your database:

```sql
-- Check photos table
SELECT id, user_id, photo_url, visibility, is_primary, is_approved, created_at 
FROM "UserPhoto" 
WHERE user_id = 'your-user-id';
```

**Expected**:
- `is_primary`: Only ONE photo should be `true`
- `is_approved`: All should be `false` (requires moderation)
- `photo_url`: Should be valid HTTPS URLs
- Max 5 photos per user

---

## 🚨 Common Issues & Solutions

### Issue 1: "Token expired"
**Solution**: Login again and get a fresh token

### Issue 2: "Access denied"
**Solution**: Make sure `userId` in URL matches the token's user ID

### Issue 3: "Maximum 5 photos allowed"
**Solution**: Delete old photos first:
```
DELETE http://localhost:3000/users/{userId}/photos/{photoId}
```

### Issue 4: "Valid file URL is required"
**Solution**: URL must start with `https://`

### Issue 5: CORS error in browser
**Solution**: Check your CORS config allows localhost

---

## 🎓 Understanding the Flow

```
1. User uploads file in frontend
   ↓
2. Frontend uploads to UploadThing
   ↓
3. UploadThing returns URL: "https://utfs.io/f/abc123.jpg"
   ↓
4. Frontend sends URL to your backend
   ↓
5. Backend validates and saves metadata
   ↓
6. Photo appears in database (awaiting approval)
```

**For testing** (without frontend), we skip steps 1-3 and directly provide a URL in step 4.

---

## 🔥 Quick Start (Copy-Paste Ready)

### Using curl:

```bash
# 1. Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@123"}'

# 2. Upload Photo (replace TOKEN and USER_ID)
curl -X POST http://localhost:3000/users/USER_ID/photos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"fileUrl":"https://picsum.photos/600/800","visibility":"PUBLIC"}'

# 3. Get Photos
curl -X GET http://localhost:3000/users/USER_ID/photos \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📝 Next Steps

After testing:

1. ✅ Verify photos in database
2. ✅ Test moderation workflow (approve/reject)
3. ✅ Build frontend with actual UploadThing SDK
4. ✅ Add thumbnail generation
5. ✅ Add EXIF data stripping

---

## 💡 Pro Tips

- Use **Postman Collections** to save all your test requests
- Create a **test user** specifically for testing
- Use **placeholder images** from picsum.photos or placeholder.com
- Test with **different file sizes** to verify 5MB limit
- Check **logs** in `Backend/logs/` for debugging

---

## 🆘 Need Help?

If tests fail:
1. Check backend is running: `http://localhost:3000`
2. Check logs: `Backend/logs/combined.log`
3. Verify JWT token is valid
4. Check database connection
5. Ensure user exists and is active
