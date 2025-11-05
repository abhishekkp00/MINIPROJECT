# Project Model Documentation

## Overview
The Project model has been successfully created with all requested features and additional utility methods for comprehensive project management.

---

## ✅ Schema Fields

### Required Fields:
1. **name** (String, required)
   - Min: 3 characters
   - Max: 100 characters
   - Trimmed and validated

2. **owner** (ObjectId ref to User, required)
   - Indexed for fast queries
   - Automatically references User model

### Optional Fields:
3. **description** (String, optional)
   - Max: 1000 characters
   - Default: empty string

4. **members** (Array of ObjectId refs to User)
   - Array of user references
   - Owner automatically excluded from members

5. **deadline** (Date, optional)
   - Validates future dates for new projects

6. **status** (enum, default: 'active')
   - Values: 'planning', 'active', 'completed'
   - Case-insensitive

7. **priority** (enum, default: 'medium')
   - Values: 'low', 'medium', 'high'
   - Case-insensitive

8. **tags** (Array of Strings)
   - Max 30 characters per tag
   - Lowercase and trimmed
   - Duplicates automatically removed

9. **createdAt** (Timestamp - auto-generated)
10. **updatedAt** (Timestamp - auto-generated)

---

## 📊 Indexes

Performance-optimized indexes:
- `owner` - Single field index
- `owner + status` - Compound index
- `status + priority` - Compound index
- `deadline` - Single field index
- `tags` - Single field index
- Text index on `name`, `description`, and `tags` for search

---

## 🔧 Virtual Properties

### `isOverdue`
Returns `true` if deadline has passed and status is not 'completed'
```javascript
const project = await Project.findById(projectId);
console.log(project.isOverdue); // true or false
```

### `daysRemaining`
Returns number of days until deadline (negative if overdue)
```javascript
console.log(project.daysRemaining); // e.g., 5 or -3
```

### `memberCount`
Returns the number of members in the project
```javascript
console.log(project.memberCount); // e.g., 3
```

---

## 📝 Instance Methods

### `isOwner(userId)`
Check if a user is the project owner
```javascript
if (project.isOwner(req.user._id)) {
  // User is the owner
}
```

### `isMember(userId)`
Check if a user is a member
```javascript
if (project.isMember(userId)) {
  // User is a member
}
```

### `hasAccess(userId)`
Check if user is owner OR member
```javascript
if (!project.hasAccess(req.user._id)) {
  return res.status(403).json({ error: 'Access denied' });
}
```

### `addMember(userId)`
Add a member to the project
```javascript
try {
  await project.addMember(newUserId);
  res.json({ message: 'Member added successfully' });
} catch (error) {
  res.status(400).json({ error: error.message });
}
```

### `removeMember(userId)`
Remove a member from the project
```javascript
try {
  await project.removeMember(userId);
  res.json({ message: 'Member removed successfully' });
} catch (error) {
  res.status(400).json({ error: error.message });
}
```

### `getSummary()`
Get safe public project data
```javascript
const summary = project.getSummary();
// Returns: { id, name, description, status, priority, deadline, tags, memberCount, isOverdue, daysRemaining, createdAt, updatedAt }
```

---

## 🔍 Static Methods (Query Helpers)

### `findByOwner(userId, options)`
Find all projects owned by a user
```javascript
const projects = await Project.findByOwner(userId, {
  status: 'active',
  priority: 'high'
});
```

### `findByMember(userId, options)`
Find projects where user is a member
```javascript
const projects = await Project.findByMember(userId, {
  status: 'active'
});
```

### `findAccessibleByUser(userId, options)`
Find all projects user can access (owner OR member)
```javascript
const projects = await Project.findAccessibleByUser(userId, {
  status: 'active',
  priority: 'high'
});
```

### `searchProjects(searchText, userId)`
Full-text search in projects accessible by user
```javascript
const results = await Project.searchProjects('machine learning', userId);
```

### `findOverdue()`
Find all overdue projects
```javascript
const overdueProjects = await Project.findOverdue();
```

---

## 🔄 Pre-Save Hooks

The model automatically:
1. **Removes owner from members array** - Owner is implicit, no need to be in members
2. **Removes duplicate members** - Ensures unique member list
3. **Normalizes tags** - Removes duplicates and empty strings

---

## 💡 Usage Examples

### Create a Project
```javascript
const Project = require('./models/Project');

const project = new Project({
  name: 'AI Chatbot',
  description: 'Build an intelligent chatbot',
  owner: req.user._id,
  members: [userId1, userId2],
  deadline: new Date('2025-12-31'),
  status: 'active',
  priority: 'high',
  tags: ['ai', 'nlp', 'chatbot']
});

await project.save();
```

### Get User's Projects
```javascript
// Get projects where user is owner
const ownedProjects = await Project.findByOwner(userId);

// Get projects where user is member
const memberProjects = await Project.findByMember(userId);

// Get all accessible projects
const allProjects = await Project.findAccessibleByUser(userId);
```

### Update Project
```javascript
const project = await Project.findById(projectId);

if (!project.hasAccess(req.user._id)) {
  return res.status(403).json({ error: 'Access denied' });
}

project.status = 'completed';
project.tags.push('finished');
await project.save();
```

### Manage Members
```javascript
const project = await Project.findById(projectId)
  .populate('owner', 'name email')
  .populate('members', 'name email role');

// Check access
if (!project.isOwner(req.user._id)) {
  return res.status(403).json({ error: 'Only owner can add members' });
}

// Add member
await project.addMember(newUserId);

// Remove member
await project.removeMember(userId);
```

### Search Projects
```javascript
const searchResults = await Project.searchProjects('machine learning', userId);
```

### Check Overdue Status
```javascript
const project = await Project.findById(projectId);

if (project.isOverdue) {
  console.log(`Project is ${Math.abs(project.daysRemaining)} days overdue!`);
}
```

---

## 🛡️ Validation Rules

1. **Name**: Required, 3-100 characters
2. **Description**: Optional, max 1000 characters
3. **Owner**: Required, must be valid User ObjectId
4. **Deadline**: Must be in future (for new projects)
5. **Status**: Must be 'planning', 'active', or 'completed'
6. **Priority**: Must be 'low', 'medium', or 'high'
7. **Tags**: Each tag max 30 characters

---

## 🎯 Best Practices

1. **Always populate owner and members for display**
   ```javascript
   .populate('owner', 'name email role')
   .populate('members', 'name email role')
   ```

2. **Check access before modifications**
   ```javascript
   if (!project.hasAccess(userId)) {
     throw new Error('Access denied');
   }
   ```

3. **Use static methods for queries**
   ```javascript
   // Good
   const projects = await Project.findAccessibleByUser(userId);
   
   // Instead of manual query
   const projects = await Project.find({
     $or: [{ owner: userId }, { members: userId }]
   });
   ```

4. **Use getSummary() for API responses**
   ```javascript
   res.json({
     success: true,
     project: project.getSummary()
   });
   ```

---

## 🧪 Testing the Model

```javascript
// Test in Node REPL or route
const Project = require('./models/Project');

// Create test project
const project = new Project({
  name: 'Test Project',
  description: 'Testing the model',
  owner: '507f1f77bcf86cd799439011', // Use real user ID
  members: ['507f1f77bcf86cd799439012'],
  deadline: new Date('2025-12-31'),
  status: 'active',
  priority: 'high',
  tags: ['test', 'demo']
});

await project.save();
console.log('Project created:', project.getSummary());
```

---

## ✅ Model Complete!

All requested features have been implemented:
- ✅ All 10 schema fields
- ✅ Timestamps enabled
- ✅ Validation rules
- ✅ Index on owner
- ✅ Populate methods via static queries
- ✅ Additional utility methods
- ✅ Virtual properties
- ✅ Pre-save hooks
- ✅ CommonJS export

The Project model is production-ready! 🚀
