# Personalized Test Scripts Based on Your Contacts

**Analysis Date**: 2025-01-31  
**Total Contacts Analyzed**: 24

## 🔍 Analysis Summary

### Contact Types Found:
- **Operational Contacts**: 21 (engineers, developers, managers at tech companies)
- **Potential Investors**: 3
  - Arjun Metre (Intel Capital)
  - Ryan Wang (CLI Ventures)
  - Matthew Cook (AD Development Group - Partner)

### ⚠️ Important Finding:

**Most of your contacts are operational (not investors), which means:**

1. **Name Matching Will Work** ✅
   - If you mention any contact name in a conversation, they'll match (3 stars)
   - This is the fastest way to test the matching system

2. **Sector/Stage Matching Won't Work Yet** ❌
   - The matching system needs contacts marked as `is_investor = true`
   - Contacts need "theses" with sectors, stages, check sizes, etc.
   - Without theses, GPT can't match based on investment criteria

### 📋 What You Need to Do:

To test sector/stage matching, you need to:
1. Mark investor contacts as `is_investor = true` in your database
2. Add "theses" to investor contacts with:
   - Sectors (e.g., "B2B SaaS", "Fintech", "AI/ML")
   - Stages (e.g., "pre-seed", "seed", "Series A")
   - Check sizes (e.g., "$500K-$2M")
   - Geos (e.g., "San Francisco", "New York")

---

## ✅ Test Scripts That WILL Work (Name Matching)

### Test Script 1: Direct Name Mention (Arjun Metre)
**Expected Match**: Arjun Metre (3 stars - name match)

**Script**:
```
"I just had a conversation with a startup founder. They're building a B2B SaaS company at 
pre-seed stage. They're looking to raise about $1 million in San Francisco.

I think Arjun Metre would be a great match for this. He's at Intel Capital and might be 
interested in this opportunity. We should definitely introduce them."
```

**What to Check**:
- ✅ Arjun Metre appears as a match (3 stars)
- ✅ Match reason mentions "name match" or "mentioned in conversation"

---

### Test Script 2: Direct Name Mention (Ryan Wang)
**Expected Match**: Ryan Wang (3 stars - name match)

**Script**:
```
"I talked to a fintech startup today. They're at seed stage, looking to raise $2M. 
They're based in New York.

I think Ryan Wang from CLI Ventures would be interested. We should reach out to him."
```

**What to Check**:
- ✅ Ryan Wang appears as a match (3 stars)
- ✅ Match reason mentions name match

---

### Test Script 3: Direct Name Mention (Matthew Cook)
**Expected Match**: Matthew Cook (3 stars - name match)

**Script**:
```
"I met with an AI healthcare startup. They're at pre-seed, looking for $1.5M. They're 
building machine learning tools for hospitals.

Matthew Cook might be a good fit. He's a partner at AD Development Group. Let's introduce them."
```

**What to Check**:
- ✅ Matthew Cook appears as a match (3 stars)

---

### Test Script 4: Multiple Name Mentions
**Expected Matches**: Multiple contacts (3 stars each)

**Script**:
```
"I had a great conversation with a startup founder. They're building a B2B SaaS platform 
at seed stage. They're looking to raise $2M in San Francisco.

I think we should introduce them to a few people:
- Arjun Metre at Intel Capital
- Ryan Wang at CLI Ventures
- Maybe Matthew Cook too

They're all interested in early-stage B2B SaaS companies."
```

**What to Check**:
- ✅ All three contacts appear as matches (3 stars each)
- ✅ Multiple matches appear in the UI

---

### Test Script 5: Name + Company Mention
**Expected Match**: Arjun Metre (3 stars)

**Script**:
```
"I talked to a startup today. They're building something interesting in the B2B SaaS space.

I think someone from Intel Capital would be a good match. Maybe Arjun Metre? He's the Chief 
of Staff there. We should definitely reach out."
```

**What to Check**:
- ✅ Arjun Metre matches (name + company context)

---

## ⚠️ Test Scripts That WON'T Work Yet (Sector/Stage Matching)

These scripts **won't generate matches** until you add investor profiles and theses:

### Script A: B2B SaaS Pre-Seed (No Name Mention)
**Why It Won't Work**: No contacts have theses with "B2B SaaS" and "pre-seed"

**Script**:
```
"I just talked to a B2B SaaS startup at pre-seed stage. They're looking to raise $1M in 
San Francisco."
```

**Expected Result**: ❌ No matches (unless you mention a name)

---

### Script B: Fintech Seed
**Why It Won't Work**: No contacts have theses with "fintech" and "seed"

**Script**:
```
"I met a fintech company at seed stage. They want to raise $2M and they're based in New York."
```

**Expected Result**: ❌ No matches (unless you mention a name)

---

## 🎯 Recommended Testing Strategy

### Phase 1: Test Name Matching (Works Now)
1. Use Test Scripts 1-5 above
2. Verify 3-star matches appear when names are mentioned
3. Confirm match reasons mention "name match"

### Phase 2: Add Investor Profiles (Required for Sector Matching)
1. Mark these contacts as investors:
   - Arjun Metre (Intel Capital)
   - Ryan Wang (CLI Ventures)
   - Matthew Cook (AD Development Group)

2. Add theses to each investor:
   - **Arjun Metre**: 
     - Sectors: ["B2B SaaS", "Enterprise Software", "AI/ML"]
     - Stages: ["pre-seed", "seed", "Series A"]
     - Check sizes: ["$500K-$5M"]
     - Geos: ["San Francisco", "Silicon Valley"]
   
   - **Ryan Wang**:
     - Sectors: ["Fintech", "B2B SaaS"]
     - Stages: ["seed", "Series A"]
     - Check sizes: ["$1M-$3M"]
     - Geos: ["New York", "San Francisco"]
   
   - **Matthew Cook**:
     - Sectors: ["Healthcare", "AI/ML", "B2B SaaS"]
     - Stages: ["pre-seed", "seed"]
     - Check sizes: ["$500K-$2M"]
     - Geos: ["San Francisco", "Remote"]

### Phase 3: Test Sector/Stage Matching (After Adding Theses)
Once theses are added, the generic test scripts will work!

---

## 📝 Quick Test Scripts (Name-Based)

### Quick Test 1: Single Name
```
"I think Arjun Metre would be a great match for this B2B SaaS startup."
```

### Quick Test 2: Multiple Names
```
"Let's introduce them to Arjun Metre, Ryan Wang, and Matthew Cook."
```

### Quick Test 3: Name + Context
```
"I talked to a startup today. Arjun Metre at Intel Capital would be interested."
```

---

## 🔧 How to Add Investor Profiles

### Option 1: Via UI
1. Go to Contacts page
2. Find the contact (e.g., Arjun Metre)
3. Edit contact
4. Check "Is Investor"
5. Add thesis with sectors, stages, check sizes, geos

### Option 2: Via SQL
```sql
-- Mark as investor
UPDATE contacts 
SET is_investor = true 
WHERE name = 'Arjun Metre';

-- Add thesis (example)
INSERT INTO theses (contact_id, sectors, stages, check_sizes, geos)
VALUES (
  (SELECT id FROM contacts WHERE name = 'Arjun Metre'),
  ARRAY['B2B SaaS', 'Enterprise Software', 'AI/ML'],
  ARRAY['pre-seed', 'seed', 'Series A'],
  ARRAY['$500K-$5M'],
  ARRAY['San Francisco', 'Silicon Valley']
);
```

---

## 📊 Contact Summary

### Potential Investors:
1. **Arjun Metre** - Intel Capital (Chief of Staff)
2. **Ryan Wang** - CLI Ventures
3. **Matthew Cook** - AD Development Group (Partner)

### Operational Contacts (Name Matching Only):
- John Maher (Blizzard)
- Mike Sepso (Activision)
- Kevin Mayer (Disney)
- Alan Saporta (Disney)
- Richard Webby (Disney)
- John Love (Disney)
- Sean Leonard (Subpac)
- Julian Abiodun (TrueCar)
- Krishna Achanta (Xero)
- Mohammad Adib (Tinder)
- Victor Adu (Western Union)
- Shamik Aga (DoubleDutch)
- Saket Agarwal (DoubleDutch)
- Raheel Ahmad (Capital One)
- Sumayyah Ahmed (UC Davis)
- Jon Akhtar (Herbalife)
- Sheehan Alam (Blast Motion)
- Sergey Aldoukhov (21.co)
- Wisam Alhamad (Ensenta)
- Alexandra Alice (Google)
- Dandre Allison (HotelTonight)

---

## ✅ Next Steps

1. **Test name matching now** using Test Scripts 1-5
2. **Add investor profiles** to Arjun Metre, Ryan Wang, Matthew Cook
3. **Add theses** with sectors, stages, check sizes, geos
4. **Test sector/stage matching** using generic test scripts

Once you add theses, I can create more personalized test scripts based on your actual investment criteria!

