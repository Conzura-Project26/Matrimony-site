# Photo Upload Testing Guide

## Testing with Postman/Thunder Client

### Step 1: Get Authentication Token
```
POST http://localhost:3000/auth/login
Body (JSON):
{
  "email": "your-email@example.com",
  "password": "your-password"
}

Response:
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-id-here",
      ...
    }
  }
}
```

Copy the `accessToken` and `user.id` from response.

---

### Step 2: Test Photo Upload Endpoint

```
POST http://localhost:3000/users/{userId}/photos

Headers:
  Authorization: Bearer {your-access-token}
  Content-Type: application/json

Body (JSON):
{
  "fileUrl": "https://utfs.io/f/test-photo-123.jpg",
  "visibility": "PUBLIC"
}
```

**Notes:**
- Replace `{userId}` with your actual user ID
- Replace `{your-access-token}` with token from Step 1
- The `fileUrl` should be a valid HTTPS URL
- For testing, you can use any image URL (e.g., from imgur, placeholder services)

---

### Test Cases

#### ✅ Success Case
```json
{
  "fileUrl": "https://via.placeholder.com/600/92c952",
  "visibility": "PUBLIC"
}
```

Expected Response (201):
```json
{
  "success": true,
  "data": {
    "photo": {
      "id": 1,
      "user_id": "user123",
      "photo_url": "https://via.placeholder.com/600/92c952",
      "visibility": "PUBLIC",
      "is_primary": true,
      "is_approved": false,
      "created_at": "2026-01-31T..."
    }
  },
  "message": "Photo uploaded successfully. It will be reviewed by moderators."
}
```

#### ❌ Error Case: Invalid URL
```json
{
  "fileUrl": "not-a-valid-url",
  "visibility": "PUBLIC"
}
```

Expected Response (400):
```json
{
  "success": false,
  "message": "Valid file URL is required"
}
```

#### ❌ Error Case: Unauthorized (different user)
```
POST http://localhost:3000/users/different-user-id/photos
```

Expected Response (403):
```json
{
  "success": false,
  "message": "Access denied: You can only access your own resources"
}
```

#### ❌ Error Case: Photo Limit Reached
Upload 6th photo when user already has 5 photos.

Expected Response (400):
```json
{
  "success": false,
  "message": "Maximum 5 photos allowed. Please delete a photo before uploading a new one."
}
```

---

## Testing with Temporary Image URLs

Use these services for test image URLs:
- https://via.placeholder.com/600/92c952
- https://picsum.photos/600/800
- https://i.imgur.com/{image-id}.jpg (upload image to imgur first)
- https://images.unsplash.com/photo-{id}

---

## Expected Flow

1. **First photo** → `is_primary: true` automatically
2. **Subsequent photos** → `is_primary: false`
3. **All photos** → `is_approved: false` (requires moderation)
4. **Max 5 photos** per user

---

## Testing Other Photo Endpoints

### Get User Photos
```
GET http://localhost:3000/users/{userId}/photos

No authentication required (public endpoint)
Returns only approved public photos for other users
```

### Delete Photo
```
DELETE http://localhost:3000/users/{userId}/photos/{photoId}

Headers:
  Authorization: Bearer {your-access-token}
```

### Set Primary Photo
```
PATCH http://localhost:3000/users/{userId}/photos/{photoId}/primary

Headers:
  Authorization: Bearer {your-access-token}
```
