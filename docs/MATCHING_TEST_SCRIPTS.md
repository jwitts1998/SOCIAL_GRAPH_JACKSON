# Matching System Test Scripts

**Purpose**: Test conversation scripts to validate match generation during recording  
**Last Updated**: 2025-01-31

## How to Use

1. **Start recording** in the app
2. **Speak one of these scripts** naturally (as if in a real conversation)
3. **Wait 30 seconds** after starting
4. **Check console** for polling logs
5. **Verify matches** appear in UI

---

## Test Script 1: B2B SaaS Pre-Seed (Strong Match Scenario)

**Duration**: ~1-2 minutes  
**Expected Matches**: Should find contacts who invest in B2B SaaS at pre-seed stage

**Script**:
```
"Hey, I just had a great conversation with a startup founder. They're building a B2B SaaS product, 
really interesting. They're at the pre-seed stage, looking to raise about $1 million. 

The company is based in San Francisco, and they're targeting enterprise customers. They've got a 
solid team, about 5 people right now. The founder has a strong technical background.

They're looking for investors who understand B2B SaaS and have experience with pre-seed companies. 
The check size they're targeting is around $500K to $1M. They want to close this round in the next 
couple of months.

I think this could be a good opportunity for some of our contacts. We should definitely follow up 
on this one."
```

**What to Look For**:
- ✅ Entities extracted: `sector: B2B SaaS`, `stage: pre-seed`, `check_size: $1M`, `geo: San Francisco`
- ✅ Matches appear after 30 seconds
- ✅ Contacts with B2B SaaS in their thesis should match
- ✅ Contacts who invest at pre-seed should match

---

## Test Script 2: Fintech Series A (Medium Match Scenario)

**Duration**: ~1-2 minutes  
**Expected Matches**: Should find contacts who invest in fintech at Series A

**Script**:
```
"So I met with this fintech startup yesterday. They're building a payment processing platform for 
small businesses. Really interesting space.

They're at Series A stage, looking to raise about $5 million. The company is based in New York, 
and they've got about 20 employees now. They've been growing really fast.

The founder mentioned they're looking for investors who have experience in fintech and understand 
the payments space. They want someone who can help with partnerships and go-to-market strategy.

The check size they're looking for is in the $2M to $5M range. They're planning to close this 
round in Q2. I think this could be a good fit for some of our network."
```

**What to Look For**:
- ✅ Entities: `sector: fintech`, `stage: Series A`, `check_size: $5M`, `geo: New York`
- ✅ Matches appear
- ✅ Fintech investors should match
- ✅ Series A investors should match

---

## Test Script 3: AI/ML Seed Stage (Multiple Criteria)

**Duration**: ~2 minutes  
**Expected Matches**: Should find contacts who invest in AI/ML at seed stage

**Script**:
```
"I had a really interesting call today with an AI startup. They're building machine learning tools 
for healthcare companies. It's a B2B SaaS model focused on AI and ML.

They're at seed stage, looking to raise around $2 million. The company is based in the SF Bay Area, 
and they've got a team of about 10 people. The founders have strong backgrounds in AI and healthcare.

They're looking for investors who understand AI and machine learning, and have connections in the 
healthcare space. The check size they're targeting is $1M to $2M.

They mentioned they're particularly interested in working with GPs and angels who have experience 
with AI startups. They want to close this round in the next 3 months.

I think this could be a great opportunity. We should definitely introduce them to some of our 
contacts who invest in AI and healthcare."
```

**What to Look For**:
- ✅ Entities: `sector: AI/ML`, `tech_stack: AI/ML`, `stage: seed`, `check_size: $2M`, `geo: SF Bay Area`, `persona: GP/Angel`
- ✅ Multiple matches (AI investors, healthcare investors, seed stage investors)
- ✅ Higher quality matches (multiple criteria)

---

## Test Script 4: Name Mention (Direct Match)

**Duration**: ~30 seconds  
**Expected Matches**: Should find contact mentioned by name (3 stars)

**Script**:
```
"I think John Smith would be a great match for this. He invests in B2B SaaS at pre-seed, and he's 
based in San Francisco. We should definitely introduce them."
```

**What to Look For**:
- ✅ Entity: `person_name: John Smith`
- ✅ Match appears immediately (name matching)
- ✅ Match has 3 stars (name matches are highest priority)
- ✅ Contact "John Smith" appears in matches

**Note**: Replace "John Smith" with an actual contact name from your database

---

## Test Script 5: Remote-First Startup (Geo Match)

**Duration**: ~1 minute  
**Expected Matches**: Should find contacts who invest in remote companies

**Script**:
```
"I talked to this startup founder today. They're building a remote-first company, so geography 
isn't really a constraint. They're looking for investors who are comfortable with remote teams.

They're at seed stage, looking to raise about $1.5 million. The team is distributed across 
different time zones, which is interesting. They're in the B2B SaaS space, building tools for 
remote teams.

The founder mentioned they're looking for investors who understand remote work and have experience 
with distributed teams. The check size is around $1M to $2M."
```

**What to Look For**:
- ✅ Entities: `geo: remote`, `stage: seed`, `sector: B2B SaaS`, `check_size: $1.5M`
- ✅ Matches include contacts who invest in remote companies
- ✅ Geographic flexibility is considered

---

## Test Script 6: Family Office LP (Persona Match)

**Duration**: ~1 minute  
**Expected Matches**: Should find family office contacts

**Script**:
```
"I met with a family office today. They're looking to invest in early-stage startups, particularly 
in the healthcare and fintech spaces. They typically write checks between $500K and $2M.

They're interested in pre-seed and seed stage companies. They're based in New York, but they're 
open to investing in companies anywhere. They mentioned they're particularly interested in 
healthcare and fintech.

The family office has been investing for about 10 years, and they have a good track record. They're 
looking for opportunities where they can add value beyond just capital."
```

**What to Look For**:
- ✅ Entities: `persona: family office`, `sector: healthcare/fintech`, `stage: pre-seed/seed`, `check_size: $500K-$2M`
- ✅ Family office contacts should match
- ✅ LP contacts should match

---

## Test Script 7: Multiple Sectors (Complex Match)

**Duration**: ~2 minutes  
**Expected Matches**: Should find contacts who match multiple criteria

**Script**:
```
"I had a really interesting conversation with a startup founder. They're building something at the 
intersection of AI, healthcare, and fintech. It's a B2B SaaS platform that uses machine learning 
to help healthcare companies manage their financial operations.

They're at seed stage, looking to raise about $3 million. The company is based in San Francisco, 
and they've got a team of about 15 people. The founders have backgrounds in both healthcare and 
fintech.

They're looking for investors who understand AI, healthcare, and fintech. The check size they're 
targeting is $1M to $3M. They want to close this round in the next 4 months.

I think this could be a great opportunity for investors who have experience in any of these 
sectors. We should definitely introduce them to some of our contacts."
```

**What to Look For**:
- ✅ Entities: `sector: AI/healthcare/fintech`, `tech_stack: AI/ML`, `stage: seed`, `check_size: $3M`
- ✅ Multiple matches (contacts matching any of the sectors)
- ✅ Higher quality matches for contacts matching multiple sectors

---

## Test Script 8: Minimal Context (Weak Match Scenario)

**Duration**: ~30 seconds  
**Expected Matches**: Should still find some matches even with minimal info

**Script**:
```
"I talked to a startup founder today. They're looking to raise money. It's a B2B SaaS company at 
seed stage."
```

**What to Look For**:
- ✅ Entities: `sector: B2B SaaS`, `stage: seed`
- ✅ Some matches appear (even if weak)
- ✅ System handles minimal context gracefully

---

## Test Script 9: No Match Scenario (Negative Test)

**Duration**: ~30 seconds  
**Expected Matches**: Should return no matches or very weak matches

**Script**:
```
"I had a conversation about the weather today. It's been really nice outside. I'm thinking about 
going for a walk later. Maybe I'll grab some coffee."
```

**What to Look For**:
- ✅ No entities extracted (or very few)
- ✅ No matches (or only very weak 1-star matches)
- ✅ System handles non-investment conversations gracefully

---

## Test Script 10: Realistic Full Conversation

**Duration**: ~3-4 minutes  
**Expected Matches**: Should find multiple high-quality matches

**Script**:
```
"Hey, I just got off a call with a really interesting startup. They're building a B2B SaaS 
platform for healthcare companies. It's an AI-powered solution that helps hospitals manage their 
patient data more efficiently.

They're at pre-seed stage, looking to raise about $1.5 million. The company is based in San 
Francisco, and they've got a team of about 8 people. The founders have strong backgrounds in 
healthcare and AI.

They're looking for investors who understand both healthcare and AI. The check size they're 
targeting is around $500K to $1.5M. They want to close this round in the next couple of months.

I think this could be a great opportunity. We should definitely introduce them to some of our 
contacts who invest in healthcare or AI. Maybe someone like Sarah Johnson would be a good match - 
she invests in healthcare startups at pre-seed.

They also mentioned they're looking for angels and GPs who have experience with healthcare 
companies. They want investors who can help with partnerships and go-to-market strategy.

The founder said they're particularly interested in working with investors who have connections 
in the healthcare space. They're planning to raise a seed round next year, so they're looking 
for investors who can help them get there.

I think we should follow up on this one. It's a really interesting opportunity."
```

**What to Look For**:
- ✅ Multiple entities extracted
- ✅ Multiple matches (3-star, 2-star, 1-star)
- ✅ Name match for "Sarah Johnson" (if exists in contacts)
- ✅ Healthcare and AI investors match
- ✅ Pre-seed investors match

---

## Testing Checklist

For each test script:

1. **Before Recording**:
   - [ ] Note which contacts should match (based on their theses)
   - [ ] Check contact database for relevant contacts

2. **During Recording**:
   - [ ] Start recording
   - [ ] Speak the script naturally
   - [ ] Wait 30+ seconds
   - [ ] Watch console for polling logs

3. **After 30 Seconds**:
   - [ ] Check console for: `⏰ 30s elapsed, starting entity extraction and matching...`
   - [ ] Check console for: `🔍 Extracting entities...`
   - [ ] Check console for: `🎯 Generating matches...`
   - [ ] Check console for: `🎉 Found X matches!`

4. **Verify Matches**:
   - [ ] Matches appear in UI
   - [ ] Expected contacts are matched
   - [ ] Match scores are reasonable (1-3 stars)
   - [ ] Match reasons make sense

5. **Check Database**:
   - [ ] Entities are stored in `conversation_entities` table
   - [ ] Matches are stored in `match_suggestions` table
   - [ ] Match reasons are stored correctly

---

## Troubleshooting

### No Matches Appear

**Check**:
1. Are entities being extracted? (Check `conversation_entities` table)
2. Do you have contacts with matching theses?
3. Check console for errors
4. Check Edge Function logs in Supabase Dashboard

### Wrong Matches

**Check**:
1. Are entities extracted correctly?
2. Do contacts have correct thesis data?
3. Check GPT response in Edge Function logs

### Polling Not Working

**Check**:
1. Is recording active? (`audioState.isRecording` should be true)
2. Is transcript length > 0? (Check `transcriptLengthRef.current`)
3. Check console for polling check logs
4. Wait full 30 seconds (check `timeSinceLastMatch` in logs)

---

## Next: Generate Personalized Test Scripts

See `scripts/generate-test-scripts.sql` for a SQL query that generates personalized test scripts based on your actual contacts.

