# 🚀 Quick Start Guide - Master Data & Enums

## For Other Developers

### 📦 What's Available

You now have access to:
- **10 Religions** with **92 Castes** and **62 Sub-Castes**
- **38 Permissions** mapped to **3 Roles**
- **13 Comprehensive Enums** with validation helpers
- **6 Master Data API Endpoints**

---

## 🎯 Common Use Cases

### 1. Get All Master Data (One API Call)
```javascript
const response = await fetch('http://localhost:3000/master/all');
const { data } = await response.json();

// Access enums
const genderOptions = data.enums.gender;
const maritalStatusOptions = data.enums.maritalStatus;

// Access religions
const religions = data.religions;
```

### 2. Build Cascading Dropdowns (Religion → Caste → Sub-Caste)
```javascript
// Step 1: Get religions
const religions = await fetch('/master/religions').then(r => r.json());

// Step 2: When user selects religion, get castes
const castes = await fetch(`/master/castes/${selectedReligionId}`).then(r => r.json());

// Step 3: When user selects caste, get sub-castes
const subCastes = await fetch(`/master/sub-castes/${selectedCasteId}`).then(r => r.json());
```

### 3. Validate User Input
```javascript
import { isValidMaritalStatus, isValidEmploymentType } from './src/types/enums.js';

// Validate marital status
if (!isValidMaritalStatus(userInput.maritalStatus)) {
  throw new Error('Invalid marital status');
}

// Validate employment type
if (!isValidEmploymentType(userInput.employmentType)) {
  throw new Error('Invalid employment type');
}
```

### 4. Use Enums in Your Code
```javascript
import { Gender, MaritalStatus, EmploymentType } from './src/types/enums.js';

// Use in comparisons
if (user.gender === Gender.MALE) {
  // Do something
}

// Use in database queries
const users = await prisma.user.findMany({
  where: {
    marital_status: MaritalStatus.NEVER_MARRIED
  }
});
```

### 5. Check User Permissions
```javascript
// In your middleware or controller
const userRole = await prisma.role.findUnique({
  where: { id: user.role_id },
  include: {
    role_permissions: {
      include: {
        permission: true
      }
    }
  }
});

const hasPermission = userRole.role_permissions.some(
  rp => rp.permission.permission_name === 'approve_photos'
);
```

---

## 📝 All Available Enums

```javascript
// Import from src/types/enums.js

Gender.MALE
Gender.FEMALE
Gender.OTHER

ProfileCreatedBy.SELF
ProfileCreatedBy.PARENT
ProfileCreatedBy.GUARDIAN

MaritalStatus.NEVER_MARRIED
MaritalStatus.DIVORCED
MaritalStatus.WIDOWED
MaritalStatus.AWAITING_DIVORCE
MaritalStatus.SEPARATED
MaritalStatus.ANNULLED

PhysicalStatus.NORMAL
PhysicalStatus.VISUALLY_IMPAIRED
PhysicalStatus.HEARING_IMPAIRED
PhysicalStatus.MOBILITY_IMPAIRED
PhysicalStatus.OTHER

EmploymentType.GOVERNMENT_JOB
EmploymentType.PRIVATE_JOB
EmploymentType.BUSINESS
EmploymentType.SELF_EMPLOYED
EmploymentType.RETIRED
EmploymentType.NOT_WORKING
EmploymentType.STUDENT

FamilyValues.ORTHODOX
FamilyValues.TRADITIONAL
FamilyValues.MODERATE
FamilyValues.LIBERAL
FamilyValues.PROGRESSIVE

IncomeRange.BELOW_2L
IncomeRange.L2_TO_5L
IncomeRange.L5_TO_10L
IncomeRange.L10_TO_15L
IncomeRange.L15_TO_20L
IncomeRange.L20_TO_30L
IncomeRange.L30_TO_50L
IncomeRange.ABOVE_50L

PhotoVisibility.PUBLIC
PhotoVisibility.PRIVATE
PhotoVisibility.ON_REQUEST
PhotoVisibility.PROTECTED

EducationLevel.HIGH_SCHOOL
EducationLevel.DIPLOMA
EducationLevel.BACHELORS
EducationLevel.MASTERS
EducationLevel.DOCTORATE
EducationLevel.PROFESSIONAL_DEGREE

DietPreference.VEGETARIAN
DietPreference.NON_VEGETARIAN
DietPreference.EGGETARIAN
DietPreference.VEGAN

DrinkingHabit.NEVER
DrinkingHabit.OCCASIONALLY
DrinkingHabit.SOCIALLY
DrinkingHabit.REGULARLY

SmokingHabit.NEVER
SmokingHabit.OCCASIONALLY
SmokingHabit.SOCIALLY
SmokingHabit.REGULARLY

InterestStatus.PENDING
InterestStatus.ACCEPTED
InterestStatus.REJECTED
```

---

## 🔧 Validation Helpers

```javascript
import {
  isValidGender,
  isValidMaritalStatus,
  isValidEmploymentType,
  isValidIncomeRange,
  // ... etc
} from './src/types/enums.js';

// Use in Zod schemas
const profileSchema = z.object({
  gender: z.string().refine(isValidGender, 'Invalid gender'),
  maritalStatus: z.string().refine(isValidMaritalStatus, 'Invalid marital status')
});
```

---

## 🌐 API Endpoints Reference

| Endpoint | Description | Example Response |
|----------|-------------|------------------|
| `GET /master/all` | Get everything | `{ enums: {...}, religions: [...] }` |
| `GET /master/enums` | Get all enums | `{ gender: [...], maritalStatus: [...], ... }` |
| `GET /master/religions` | Get religions | `[{ id: 1, religion_name: "Hinduism" }]` |
| `GET /master/castes/:id` | Get castes by religion | `[{ id: 1, caste_name: "Brahmin", religion_id: 1 }]` |
| `GET /master/sub-castes/:id` | Get sub-castes by caste | `[{ id: 1, sub_caste_name: "Iyer", caste_id: 1 }]` |
| `GET /master/religions/:id/hierarchy` | Get full hierarchy | `{ religion: {...}, castes: [{..., sub_castes: [...]}] }` |

---

## 🧪 Testing

```bash
# Run the seed script
node prisma/seed.js

# Test all master data APIs
node src/tests/masterDataTest.js

# Start the server
npm run dev
```

---

## 📚 Documentation Files

1. **ENUMS_DOCUMENTATION.md** - Detailed enum reference
2. **PHASE1_DEV2_SUMMARY.md** - Complete task summary
3. **VISUAL_SUMMARY.md** - Visual diagrams and architecture
4. **QUICK_START.md** - This file

---

## 💡 Pro Tips

1. **Cache Master Data:** Call `/master/all` once on app load and cache it
2. **Use Validation:** Always validate enum values before saving to DB
3. **Rich Metadata:** Use the metadata (icons, colors, descriptions) for better UX
4. **Type Safety:** Import enums instead of using strings directly
5. **Test Coverage:** All endpoints are tested - see `src/tests/masterDataTest.js`

---

## 🆘 Need Help?

- Check **ENUMS_DOCUMENTATION.md** for detailed examples
- See **src/tests/masterDataTest.js** for working code examples
- Review **prisma/seeds/** files to see how data is structured

---

## ✨ Example: Complete Profile Form

```javascript
// Frontend Component
import { useState, useEffect } from 'react';

function ProfileForm() {
  const [masterData, setMasterData] = useState(null);
  const [selectedReligion, setSelectedReligion] = useState('');
  const [castes, setCastes] = useState([]);
  
  // Load master data once
  useEffect(() => {
    fetch('/master/all')
      .then(r => r.json())
      .then(data => setMasterData(data.data));
  }, []);
  
  // Load castes when religion changes
  useEffect(() => {
    if (selectedReligion) {
      fetch(`/master/castes/${selectedReligion}`)
        .then(r => r.json())
        .then(data => setCastes(data.data));
    }
  }, [selectedReligion]);
  
  if (!masterData) return <div>Loading...</div>;
  
  return (
    <form>
      {/* Gender Dropdown */}
      <select name="gender">
        {masterData.enums.gender.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {/* Marital Status Dropdown */}
      <select name="maritalStatus">
        {masterData.enums.maritalStatus.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {/* Religion Dropdown */}
      <select 
        name="religion" 
        value={selectedReligion}
        onChange={e => setSelectedReligion(e.target.value)}
      >
        {masterData.religions.map(religion => (
          <option key={religion.id} value={religion.id}>
            {religion.religion_name}
          </option>
        ))}
      </select>
      
      {/* Caste Dropdown (cascading) */}
      <select name="caste" disabled={!selectedReligion}>
        {castes.map(caste => (
          <option key={caste.id} value={caste.id}>
            {caste.caste_name}
          </option>
        ))}
      </select>
      
      {/* Employment Type with Icons */}
      <select name="employmentType">
        {masterData.enums.employmentType.map(option => (
          <option key={option.value} value={option.value}>
            {option.label} ({option.category})
          </option>
        ))}
      </select>
      
      {/* Income Range with Min/Max */}
      <select name="incomeRange">
        {masterData.enums.incomeRange.map(option => (
          <option 
            key={option.value} 
            value={option.value}
            data-min={option.min}
            data-max={option.max}
          >
            {option.label}
          </option>
        ))}
      </select>
    </form>
  );
}
```

---

**Happy Coding! 🚀**

All the groundwork is done - just import and use! ✨
