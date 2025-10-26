# 🎭 ADMIN GUIDE - DEMO & AUTO-GENERATED SERVICES

## Overview

Admins can now easily identify and delete demo/auto-generated services from the platform. These are test services that can be safely removed.

---

## 🎯 What Are Demo Services?

### Demo Services (`is_demo: true`)
- Test services created for demonstration
- Example services to show how the platform works
- Sample requests/offers for testing
- Training/tutorial services

### Auto-Generated Services (`is_auto_generated: true`)
- Services automatically created by the system
- Placeholder services for new users
- System-generated test data
- Bulk-created sample services

---

## 📍 Finding Demo Services in Admin Dashboard

### Step 1: Login as Admin
```
Email: official@timebank.com
Password: official123
```

### Step 2: Open Admin Dashboard
- Click "Admin" in navigation
- Dashboard loads with all sections

### Step 3: Find Demo Services Section
- Look for **"Demo & Auto-Generated Services"** section
- Orange/red colored section (stands out from others)
- Shows count of demo services
- Only appears if demo services exist

---

## 🗑️ How to Delete Demo Services

### Method 1: Delete Individual Demo Service

**Step 1:** Find the service in "Demo & Auto-Generated Services" table
**Step 2:** Click the red "Delete" button
**Step 3:** Confirm deletion in dialog
**Step 4:** Service removed from platform

### Method 2: Delete from Regular Services Section

If a demo service is also in the regular services list:
1. Scroll to "Services Management" section
2. Find the service
3. Click "Delete Service"
4. Confirm deletion

---

## 📊 Demo Services Table

### Columns Shown

| Column | Shows | Purpose |
|--------|-------|---------|
| **Service Title** | Name of service | Identify the service |
| **Provider** | Provider ID | See who created it |
| **Type** | Offer or Request | Understand service type |
| **Status** | 🎭 Demo or 🤖 Auto-Gen | Identify service type |
| **Admin Actions** | Delete button | Remove service |

### Example Table

```
Service Title          | Provider    | Type    | Status      | Actions
Web Design Demo        | demo-user   | Offer   | 🎭 Demo     | [Delete]
Sample Coding Request  | system      | Request | 🤖 Auto-Gen | [Delete]
Test Writing Service   | test-user   | Offer   | 🎭 Demo     | [Delete]
```

---

## 🔧 How to Mark Services as Demo

### When Creating a Service

If you want to create a demo service, add these flags:

```javascript
const demoService = {
  title: "Demo Web Design Service",
  description: "This is a demo service for testing",
  provider_id: "demo-user",
  type: "offer",
  credits_per_hour: 10,
  is_demo: true,  // Mark as demo
  is_auto_generated: false
};
```

### When Auto-Generating Services

For system-generated services:

```javascript
const autoService = {
  title: "Auto-Generated Test Service",
  description: "Automatically created for testing",
  provider_id: "system",
  type: "request",
  credits_per_hour: 5,
  is_demo: false,
  is_auto_generated: true  // Mark as auto-generated
};
```

---

## 🎯 Common Demo Service Scenarios

### Scenario 1: Testing the Platform
**Create demo services to:**
- Test booking flow
- Test chat functionality
- Test credit transfers
- Test review system

**Mark as:** `is_demo: true`

### Scenario 2: Onboarding New Users
**Create auto-generated services to:**
- Show new users example services
- Demonstrate platform features
- Provide sample data
- Help users understand the system

**Mark as:** `is_auto_generated: true`

### Scenario 3: Training & Tutorials
**Create demo services to:**
- Train support staff
- Create tutorial videos
- Document features
- Test edge cases

**Mark as:** `is_demo: true`

---

## 📋 Admin Responsibilities for Demo Services

### Daily
- [ ] Check for new demo services
- [ ] Verify demo services are marked correctly
- [ ] Delete old/expired demo services

### Weekly
- [ ] Clean up demo services
- [ ] Verify no demo services are being booked
- [ ] Remove test data

### Monthly
- [ ] Archive demo service data
- [ ] Review demo service usage
- [ ] Plan new demo services for testing

---

## ⚠️ Important Notes

### Cannot Delete
- ❌ Real user services (unless marked as demo)
- ❌ Services with active bookings
- ❌ Completed services (without admin override)

### Can Delete
- ✅ Services marked `is_demo: true`
- ✅ Services marked `is_auto_generated: true`
- ✅ Any service (admin override)

### Best Practices
- ✅ Always mark demo services clearly
- ✅ Delete demo services before going live
- ✅ Keep demo services separate from real data
- ✅ Document why services are marked as demo

---

## 🔍 Identifying Demo Services

### Visual Indicators

| Badge | Meaning |
|-------|---------|
| 🎭 Demo | Manually created demo service |
| 🤖 Auto-Gen | System auto-generated service |

### In Code

```javascript
// Check if service is demo
if (service.is_demo || service.is_auto_generated) {
  console.log("This is a demo/test service");
}
```

---

## 📊 Demo Services Statistics

### What Gets Tracked
- Total demo services
- Demo services by type (offer/request)
- Demo services by provider
- Demo services created date
- Demo services deletion date

### Viewing Statistics
1. Open Admin Dashboard
2. Look at "Demo & Auto-Generated Services" count
3. See breakdown in table

---

## 🛡️ Safety Features

### Confirmation Dialog
- Prevents accidental deletion
- Shows service details
- Requires explicit confirmation

### Audit Trail
- All deletions logged
- Admin ID recorded
- Timestamp recorded
- Reason can be added

### Recovery
- Deleted services can be restored from backup
- Contact admin for recovery
- Keep deletion logs for reference

---

## 🚀 Bulk Deletion (Advanced)

### Delete All Demo Services

```javascript
// In browser console (admin only)
const demoServices = services.filter(s => s.is_demo || s.is_auto_generated);
for (const service of demoServices) {
  await dataService.deleteService(service.id, adminUserId);
}
```

### Delete Demo Services by Provider

```javascript
const demoByProvider = services.filter(s => 
  (s.is_demo || s.is_auto_generated) && 
  s.provider_id === "demo-user"
);
for (const service of demoByProvider) {
  await dataService.deleteService(service.id, adminUserId);
}
```

---

## 📞 Troubleshooting

### Q: Demo services section not showing
**A:** No demo services exist. Create one with `is_demo: true` flag.

### Q: Can't delete demo service
**A:** Check if service has active bookings. Cancel bookings first.

### Q: Demo service still showing after deletion
**A:** Refresh page (Ctrl+R). Data might be cached.

### Q: How to mark existing service as demo
**A:** Edit service in database and set `is_demo: true`.

---

## ✨ Summary

**Demo Services Feature provides:**
- ✅ Easy identification of demo services
- ✅ Dedicated section in admin dashboard
- ✅ One-click deletion
- ✅ Clear visual indicators
- ✅ Safety confirmations
- ✅ Audit trail logging

**Use it to:**
- Keep platform clean
- Remove test data
- Manage demo content
- Maintain data quality
- Prepare for production

---

## 🎯 Next Steps

1. **Mark demo services** - Add `is_demo: true` or `is_auto_generated: true`
2. **Review in admin dashboard** - See all demo services in one place
3. **Delete when ready** - Remove demo services before going live
4. **Monitor regularly** - Check for new demo services weekly

---

**Your admin dashboard now makes it easy to manage demo services!** 🎉
