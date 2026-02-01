# Task 2.10: Complete Profile API - Quick Reference

## 🚀 Quick Start

### Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/users/:userId/profile` | Get complete profile with all sections | Required |
| GET | `/users/:userId/verification-status` | Get detailed verification status | Self/Admin |

---

## 📋 Complete Profile API

### Request
```bash
GET /users/:userId/profile
Authorization: Bearer <JWT_TOKEN>
```

### Response (200 OK)
```json
{
  "success": true,
  "message": "Complete profile retrieved successfully",
  "data": {
    "basic_info": { /* ... */ },
    "personal_details": { /* ... */ },
    "caste_details": { /* ... */ },
    "education_details": [ /* sorted by year desc */ ],
    "professional_details": { /* income filtered */ },
    "family_details": { /* sensitive - filtered */ },
    "horoscope_details": { /* ... */ },
    "photos": [ /* only approved */ ],
    "partner_preferences": { /* ... */ },
    "profile_completion": {
      "percentage": 85,
      "status": "Almost Complete",
      "readiness": {
        "is_ready_for_matching": true,
        "status": "ready",
        "message": "Profile ready for matching!"
      }
    },
    "verification_status": {
      "is_verified": false,
      "mobile_verified": true,
      "email_verified": false,
      "profile_verified": false,
      "verification_percentage": 33
    },
    "activity_status": {
      "activity_level": "active",
      "days_since_last_update": 2
    },
    "badges": [
      { "type": "active", "label": "Active User", "icon": "🔥" }
    ]
  }
}
```

### Privacy Rules

| Data Type | Self | Other Users | Admin |
|-----------|------|-------------|-------|
| Mobile/Email | ✅ | ❌ | ✅ |
| Income | ✅ | ❌ | ✅ |
| Family Details | ✅ | ❌ | ✅ |
| Public Info | ✅ | ✅ | ✅ |

---

## ✅ Verification Status API

### Request
```bash
GET /users/:userId/verification-status
Authorization: Bearer <JWT_TOKEN>
```

**Authorization:** Self or Admin only (403 otherwise)

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "is_verified": false,
    "mobile_verified": true,
    "email_verified": false,
    "profile_verified": false,
    "verification_percentage": 33,
    "pending_verifications": ["email", "profile_approval"],
    "verification_steps": [
      {
        "step": "mobile",
        "status": "verified",
        "description": "Verify your mobile number via OTP"
      }
    ],
    "next_steps": [
      "Verify your email address",
      "Wait for admin to review your profile"
    ]
  }
}
```

### Verification Logic
✅ **Fully Verified = ALL THREE must be true:**
1. Mobile verified
2. Email verified
3. Profile verified (admin approval)

---

## 🎯 Profile Readiness

### Matching Eligibility
```
Ready = (Completion ≥ 60%) AND (Mobile Verified = true)
```

### Status Levels
- **complete_verified**: 100% + verified ✅
- **complete_unverified**: 100% + not verified
- **ready**: ≥60% + mobile verified ✓
- **in_progress**: 30-59%
- **incomplete**: <30%

---

## 🏅 Badges

| Badge | Criteria |
|-------|----------|
| ✓ Verified Profile | All 3 verifications complete |
| ★ Complete Profile | 100% completion |
| 🆕 Recently Joined | Account age ≤ 30 days |
| 🔥 Active User | Updated within 7 days |

---

## 📊 Profile Completion

### Weights (Total: 100%)
- Basic Info: 20%
- Personal Details: 20%
- Caste Details: 10%
- Education: 10%
- Professional: 10%
- Family: 10%
- Horoscope: 5%
- Photos: 10%
- Preferences: 5%

---

## 📸 Photo Filtering

**Returned Photos:**
- ✅ Only approved photos
- ✅ Sorted: Primary first, then by upload date
- ✅ Full metadata included

**Metadata:**
```json
{
  "id": 123,
  "photo_url": "https://...",
  "is_primary": true,
  "is_approved": true,
  "visibility": "PUBLIC",
  "uploaded_at": "2026-02-01T10:00:00Z"
}
```

---

## 📚 Education Sorting

**Order:** Latest year first (DESC)

```json
"education_details": [
  {
    "qualification": "Master's Degree",
    "year_of_passing": 2024,
    "institution_name": "University Name"
  },
  {
    "qualification": "Bachelor's Degree",
    "year_of_passing": 2022,
    "institution_name": "College Name"
  }
]
```

---

## 📈 Activity Levels

| Level | Days Since Update |
|-------|------------------|
| very_active | 0 (today) |
| active | 1-3 |
| moderately_active | 4-7 |
| less_active | 8-30 |
| inactive | >30 |

---

## 🧪 Testing

### Test Command
```bash
node src/tests/completeProfileTest.js
```

### Configuration
Update in test file:
- `TEST_USER_ID`: Your user UUID
- `ACCESS_TOKEN`: Your JWT token
- `OTHER_USER_ID`: Another user UUID (for privacy tests)

---

## ⚠️ Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 401 | Unauthorized (no token) |
| 403 | Forbidden (no permission) |
| 404 | User not found |
| 500 | Server error |

---

## 💡 Usage Examples

### 1. Get Own Profile
```javascript
const response = await axios.get(
  `http://localhost:3000/users/${userId}/profile`,
  {
    headers: { Authorization: `Bearer ${token}` }
  }
);

console.log('Completion:', response.data.data.profile_completion.percentage);
console.log('Verified:', response.data.data.verification_status.is_verified);
console.log('Badges:', response.data.data.badges.length);
```

### 2. Check Matching Readiness
```javascript
const { profile_completion } = response.data.data;
const isReady = profile_completion.readiness.is_ready_for_matching;

if (isReady) {
  console.log('✅ Ready for matching!');
} else {
  console.log('⏳ Complete profile to unlock matching');
}
```

### 3. Get Verification Status
```javascript
const response = await axios.get(
  `http://localhost:3000/users/${userId}/verification-status`,
  {
    headers: { Authorization: `Bearer ${token}` }
  }
);

const pending = response.data.data.pending_verifications;
console.log('Pending:', pending.join(', '));
```

---

## 🔗 Related Endpoints

- `GET /users/:id/profile-completion` - Detailed completion breakdown
- `GET /users/:id/personal` - Personal details only
- `GET /users/:id/photos` - Photos only
- `GET /users/:id/education` - Education only

---

## 📚 Documentation

- **Full Summary**: `TASK_2.10_COMPLETE_PROFILE_SUMMARY.md`
- **Swagger UI**: `http://localhost:3000/api-docs`
- **Test Suite**: `src/tests/completeProfileTest.js`

---

## ✅ Quick Checklist

Before calling the API:
- [ ] User is authenticated (JWT token)
- [ ] User ID is valid UUID format
- [ ] Authorization header is set

Expected in response:
- [ ] All 13 sections present
- [ ] Photos are approved only
- [ ] Education sorted by year
- [ ] Sensitive data filtered (if viewing others)
- [ ] Badges calculated
- [ ] Verification status included

---

**Task 2.10 Complete** ✅  
Ready for production use! 🚀
