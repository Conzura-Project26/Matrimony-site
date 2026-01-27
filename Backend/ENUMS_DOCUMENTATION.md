# Enums and Master Data Documentation

## Overview
This document provides comprehensive information about all enums and master data available in the SarvVivah Matrimony Platform.

---

## 📋 Basic Enums (Task 1.10 - Completed)

### Gender
```javascript
Gender.MALE          // 'Male'
Gender.FEMALE        // 'Female'
Gender.OTHER         // 'Other'
```

### Profile Created By
```javascript
ProfileCreatedBy.SELF      // 'Self'
ProfileCreatedBy.PARENT    // 'Parent'
ProfileCreatedBy.GUARDIAN  // 'Guardian'
```

### Interest Status
```javascript
InterestStatus.PENDING   // 'PENDING'
InterestStatus.ACCEPTED  // 'ACCEPTED'
InterestStatus.REJECTED  // 'REJECTED'
```

---

## 🎯 Extended Enums (Task 1.11 - Completed)

### Marital Status
```javascript
MaritalStatus.NEVER_MARRIED     // 'Never Married'
MaritalStatus.DIVORCED          // 'Divorced'
MaritalStatus.WIDOWED           // 'Widowed'
MaritalStatus.AWAITING_DIVORCE  // 'Awaiting Divorce'
MaritalStatus.SEPARATED         // 'Separated'
MaritalStatus.ANNULLED          // 'Annulled'
```

### Physical Status
```javascript
PhysicalStatus.NORMAL              // 'Normal'
PhysicalStatus.VISUALLY_IMPAIRED   // 'Visually Impaired'
PhysicalStatus.HEARING_IMPAIRED    // 'Hearing Impaired'
PhysicalStatus.MOBILITY_IMPAIRED   // 'Mobility Impaired'
PhysicalStatus.OTHER               // 'Other'
```

### Employment Type
```javascript
EmploymentType.GOVERNMENT_JOB  // 'Government Job'
EmploymentType.PRIVATE_JOB     // 'Private Job'
EmploymentType.BUSINESS        // 'Business'
EmploymentType.SELF_EMPLOYED   // 'Self-Employed'
EmploymentType.RETIRED         // 'Retired'
EmploymentType.NOT_WORKING     // 'Not Working'
EmploymentType.STUDENT         // 'Student'
```

### Family Values
```javascript
FamilyValues.ORTHODOX      // 'Orthodox'
FamilyValues.TRADITIONAL   // 'Traditional'
FamilyValues.MODERATE      // 'Moderate'
FamilyValues.LIBERAL       // 'Liberal'
FamilyValues.PROGRESSIVE   // 'Progressive'
```

### Income Range (Lakhs per annum)
```javascript
IncomeRange.BELOW_2L    // 'Below 2 Lakhs'
IncomeRange.L2_TO_5L    // '2 - 5 Lakhs'
IncomeRange.L5_TO_10L   // '5 - 10 Lakhs'
IncomeRange.L10_TO_15L  // '10 - 15 Lakhs'
IncomeRange.L15_TO_20L  // '15 - 20 Lakhs'
IncomeRange.L20_TO_30L  // '20 - 30 Lakhs'
IncomeRange.L30_TO_50L  // '30 - 50 Lakhs'
IncomeRange.ABOVE_50L   // 'Above 50 Lakhs'
```

### Photo Visibility
```javascript
PhotoVisibility.PUBLIC     // 'PUBLIC' - Visible to all users
PhotoVisibility.PRIVATE    // 'PRIVATE' - Only visible to you
PhotoVisibility.ON_REQUEST // 'ON_REQUEST' - Visible after approval
PhotoVisibility.PROTECTED  // 'PROTECTED' - Visible after interest accepted
```

### Education Level
```javascript
EducationLevel.HIGH_SCHOOL          // 'High School'
EducationLevel.DIPLOMA              // 'Diploma'
EducationLevel.BACHELORS            // "Bachelor's Degree"
EducationLevel.MASTERS              // "Master's Degree"
EducationLevel.DOCTORATE            // 'Doctorate/PhD'
EducationLevel.PROFESSIONAL_DEGREE  // 'Professional Degree'
```

### Diet Preference
```javascript
DietPreference.VEGETARIAN      // 'Vegetarian'
DietPreference.NON_VEGETARIAN  // 'Non-Vegetarian'
DietPreference.EGGETARIAN      // 'Eggetarian'
DietPreference.VEGAN           // 'Vegan'
```

### Drinking Habit
```javascript
DrinkingHabit.NEVER         // 'Never'
DrinkingHabit.OCCASIONALLY  // 'Occasionally'
DrinkingHabit.SOCIALLY      // 'Socially'
DrinkingHabit.REGULARLY     // 'Regularly'
```

### Smoking Habit
```javascript
SmokingHabit.NEVER         // 'Never'
SmokingHabit.OCCASIONALLY  // 'Occasionally'
SmokingHabit.SOCIALLY      // 'Socially'
SmokingHabit.REGULARLY     // 'Regularly'
```

---

## 🌐 API Endpoints

### Get All Enums
```
GET /master/enums
```
Returns all enum options in a structured format.

**Response:**
```json
{
  "success": true,
  "data": {
    "gender": [...],
    "maritalStatus": [...],
    "physicalStatus": [...],
    "employmentType": [...],
    "familyValues": [...],
    "incomeRange": [...],
    "photoVisibility": [...],
    "educationLevel": [...],
    "dietPreference": [...],
    "drinkingHabit": [...],
    "smokingHabit": [...],
    "heightRanges": [...],
    "ageRanges": [...],
    "motherTongue": [...],
    "rasi": [...],
    "nakshatra": [...]
  }
}
```

### Get All Religions
```
GET /master/religions
```
Returns all active religions.

**Response:**
```json
{
  "success": true,
  "data": [
    { "id": 1, "religion_name": "Hinduism" },
    { "id": 2, "religion_name": "Islam" },
    ...
  ]
}
```

### Get Castes by Religion
```
GET /master/castes/:religionId
```
Returns all castes for a specific religion.

**Example:**
```
GET /master/castes/1
```

**Response:**
```json
{
  "success": true,
  "data": [
    { "id": 1, "caste_name": "Brahmin", "religion_id": 1 },
    { "id": 2, "caste_name": "Kshatriya", "religion_id": 1 },
    ...
  ]
}
```

### Get Sub-Castes by Caste
```
GET /master/sub-castes/:casteId
```
Returns all sub-castes for a specific caste.

**Example:**
```
GET /master/sub-castes/1
```

**Response:**
```json
{
  "success": true,
  "data": [
    { "id": 1, "sub_caste_name": "Iyer", "caste_id": 1 },
    { "id": 2, "sub_caste_name": "Iyengar", "caste_id": 1 },
    ...
  ]
}
```

### Get All Master Data
```
GET /master/all
```
Returns all master data (enums + religions) in one call.

### Get Religion Hierarchy
```
GET /master/religions/:religionId/hierarchy
```
Returns religion with all castes and sub-castes in hierarchical structure.

---

## 📊 Seeded Data Summary

| Data Type | Count |
|-----------|-------|
| Religions | 10 |
| Castes | 92 |
| Sub-Castes | 62 |
| Permissions | 38 |
| Roles | 3 |
| Role-Permission Mappings | 74 |

### Religions Seeded:
1. Hinduism
2. Islam
3. Christianity
4. Sikhism
5. Buddhism
6. Jainism
7. Parsi
8. Judaism
9. Other
10. No Religion

---

## 💡 Usage Examples

### Frontend Dropdown Population
```javascript
// Fetch all enums for form dropdowns
const response = await fetch('/master/enums');
const { data } = await response.json();

// Use in select dropdown
<Select options={data.maritalStatus} />
```

### Cascading Dropdowns (Religion → Caste → Sub-Caste)
```javascript
// 1. Load religions
const religions = await fetch('/master/religions');

// 2. When religion selected, load castes
const castes = await fetch(`/master/castes/${selectedReligionId}`);

// 3. When caste selected, load sub-castes
const subCastes = await fetch(`/master/sub-castes/${selectedCasteId}`);
```

### Validation
```javascript
import { isValidMaritalStatus } from './src/types/enums.js';

if (!isValidMaritalStatus(userInput)) {
  throw new Error('Invalid marital status');
}
```

---

## 🔧 Utility Functions

### getEnumValues(enumObj)
Returns all values from an enum object.

```javascript
import { getEnumValues, Gender } from './src/types/enums.js';

const genderValues = getEnumValues(Gender);
// ['Male', 'Female', 'Other']
```

### getEnumKeys(enumObj)
Returns all keys from an enum object.

```javascript
import { getEnumKeys, Gender } from './src/types/enums.js';

const genderKeys = getEnumKeys(Gender);
// ['MALE', 'FEMALE', 'OTHER']
```

### isValidEnum(enumObj, value)
Checks if a value exists in an enum.

```javascript
import { isValidEnum, MaritalStatus } from './src/types/enums.js';

const isValid = isValidEnum(MaritalStatus, 'Divorced');
// true
```

---

## 🎨 Frontend Integration Notes

All enum options come with additional metadata for better UX:

- **Priority:** For sorting (e.g., maritalStatus)
- **Category:** For grouping (e.g., employmentType)
- **Icon:** For visual display (e.g., dietPreference)
- **Severity:** For color coding (e.g., drinkingHabit)
- **Min/Max:** For range filters (e.g., incomeRange, heightRanges)
- **Description:** For tooltips (e.g., familyValues)

---

## 🔄 Re-seeding Database

To re-run the seed script:

```bash
npm run prisma:seed
# or
node prisma/seed.js
```

This will upsert all data, so it's safe to run multiple times.

---

## 📝 Adding New Enums

1. Add enum to `src/types/enums.js`
2. Add validation helper
3. Add to `prisma/seeds/enumMasterData.js` with display options
4. Update `masterDataController.js` to expose via API
5. Update this documentation

---

## ✅ Checklist for Phase 1 - Developer 2

- [x] Task 1.9: Master Data Seeding
  - [x] Religions seeded (10)
  - [x] Castes seeded (92)
  - [x] Sub-Castes seeded (62)
  - [x] Permissions seeded (38)
  - [x] Roles seeded (3)
  - [x] Role-Permissions mapped (74)

- [x] Task 1.10: Basic Enums (Already done)
  - [x] Gender
  - [x] ProfileCreatedBy
  - [x] InterestStatus

- [x] Task 1.11: Enum Extensions
  - [x] MaritalStatus
  - [x] PhysicalStatus
  - [x] EmploymentType
  - [x] FamilyValues
  - [x] IncomeRange
  - [x] PhotoVisibility
  - [x] EducationLevel
  - [x] DietPreference
  - [x] DrinkingHabit
  - [x] SmokingHabit
  - [x] Additional master data (height, age, mother tongue, rasi, nakshatra)
  - [x] Validation helpers
  - [x] API endpoints
  - [x] Documentation
