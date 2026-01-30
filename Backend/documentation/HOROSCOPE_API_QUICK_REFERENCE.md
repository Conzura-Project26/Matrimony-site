# Horoscope Details API - Quick Reference

## Base URL
```
http://localhost:3000/users
```

## Authentication
All endpoints require Bearer token:
```
Authorization: Bearer <access_token>
```

---

## Endpoints

### 1. Create Horoscope Details
```http
POST /users/:userId/horoscope
```

**Authorization**: User (own), ADMIN (any)  
**Permissions**: `create_own_horoscope_details` OR `manage_horoscope_details`

**Request Body** (all fields optional):
```json
{
  "rasi": "Mesha (Aries)",
  "nakshatra": "Ashwini",
  "time_of_birth": "02:30 PM",
  "place_of_birth": "Chennai, Tamil Nadu, India"
}
```

**Success Response** (201):
```json
{
  "success": true,
  "message": "Horoscope details created successfully",
  "data": {
    "horoscope_details": {
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "rasi": "Mesha (Aries)",
      "nakshatra": "Ashwini",
      "time_of_birth": "1970-01-01T09:00:00.000Z",
      "place_of_birth": "Chennai, Tamil Nadu, India"
    },
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "full_name": "John Doe"
    }
  }
}
```

**Error Responses**:
- `400` - Invalid Rasi/Nakshatra or time format
- `403` - Not authorized (not owner, not ADMIN)
- `404` - User not found
- `409` - Horoscope already exists (use PUT)

---

### 2. Update Horoscope Details
```http
PUT /users/:userId/horoscope
```

**Authorization**: User (own), ADMIN (any)  
**Permissions**: `edit_own_horoscope_details` OR `manage_horoscope_details`

**Request Body** (partial update, all fields optional):
```json
{
  "time_of_birth": "11:30 PM"
}
```

OR

```json
{
  "nakshatra": "Rohini",
  "place_of_birth": "Hyderabad, Telangana, India"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Horoscope details updated successfully",
  "data": {
    "horoscope_details": {
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "rasi": "Mesha (Aries)",
      "nakshatra": "Rohini",
      "time_of_birth": "1970-01-01T23:30:00.000Z",
      "place_of_birth": "Hyderabad, Telangana, India"
    },
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "full_name": "John Doe"
    }
  }
}
```

**Error Responses**:
- `400` - Invalid validation
- `403` - Not authorized
- `404` - User or horoscope not found (use POST to create)

---

### 3. Get Horoscope Details
```http
GET /users/:userId/horoscope
```

**Authorization**: Any authenticated user  
**Permissions**: `view_horoscope_details`

**Success Response with Data** (200):
```json
{
  "success": true,
  "message": "Horoscope details retrieved successfully",
  "data": {
    "horoscope_details": {
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "rasi": "Mesha (Aries)",
      "nakshatra": "Ashwini",
      "time_of_birth": "1970-01-01T09:00:00.000Z",
      "place_of_birth": "Chennai, Tamil Nadu, India"
    },
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "full_name": "John Doe",
      "gender": "Male"
    }
  }
}
```

**Success Response without Data** (200):
```json
{
  "success": true,
  "message": "No horoscope details found for this user",
  "data": {
    "horoscope_details": {},
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "full_name": "John Doe",
      "gender": "Male"
    }
  }
}
```

**Error Responses**:
- `403` - Inactive user
- `404` - User not found

---

## Validation Rules

### Rasi (12 Options - Exact Match Required)
```
"Mesha (Aries)"
"Vrishabha (Taurus)"
"Mithuna (Gemini)"
"Karka (Cancer)"
"Simha (Leo)"
"Kanya (Virgo)"
"Tula (Libra)"
"Vrishchika (Scorpio)"
"Dhanu (Sagittarius)"
"Makara (Capricorn)"
"Kumbha (Aquarius)"
"Meena (Pisces)"
```

### Nakshatra (27 Options - Exact Match Required)
```
"Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
"Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni",
"Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha",
"Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana",
"Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada",
"Revati"
```

### Time Format
- **Pattern**: `HH:MM AM/PM`
- **Examples**: 
  - ✅ `"02:30 PM"`
  - ✅ `"11:45 AM"`
  - ✅ `"9:15 AM"` (single digit hour)
  - ❌ `"14:30"` (24-hour format not accepted)
  - ❌ `"2:30pm"` (no space before AM/PM)

### Place of Birth
- **Type**: Free text string
- **Max Length**: 150 characters
- **Example**: `"Chennai, Tamil Nadu, India"`

---

## Postman Collection Examples

### Create Horoscope (Complete)
```json
POST http://localhost:3000/users/{{userId}}/horoscope
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "rasi": "Mesha (Aries)",
  "nakshatra": "Ashwini",
  "time_of_birth": "02:30 PM",
  "place_of_birth": "Chennai, Tamil Nadu, India"
}
```

### Create Horoscope (Partial)
```json
POST http://localhost:3000/users/{{userId}}/horoscope
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "rasi": "Kanya (Virgo)",
  "place_of_birth": "Mumbai, Maharashtra, India"
}
```

### Update Time Only
```json
PUT http://localhost:3000/users/{{userId}}/horoscope
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "time_of_birth": "11:30 PM"
}
```

### Get Horoscope
```
GET http://localhost:3000/users/{{userId}}/horoscope
Authorization: Bearer {{access_token}}
```

---

## Common Errors

### Invalid Rasi
```json
{
  "success": false,
  "message": "Rasi must be one of: Mesha (Aries), Vrishabha (Taurus), ..."
}
```

### Invalid Time Format
```json
{
  "success": false,
  "message": "Time must be in format \"HH:MM AM/PM\" (e.g., \"02:30 PM\")"
}
```

### Horoscope Already Exists
```json
{
  "success": false,
  "message": "Horoscope details already exist for this user. Use PUT /users/:userId/horoscope to update."
}
```

### Horoscope Not Found (PUT)
```json
{
  "success": false,
  "message": "Horoscope details not found for this user. Use POST /users/:userId/horoscope to create."
}
```

---

## Swagger Documentation
Complete API documentation with interactive testing available at:
```
http://localhost:3000/api-docs
```

Navigate to: **Profile Management** → **Horoscope Endpoints**
