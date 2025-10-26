# Frontend Navigation Guide

## Complete UI Structure

This document outlines all pages, navigation paths, and back button implementations in the Intelligent Engineering Platform 2.0 frontend.

## Main Navigation Structure

### Header Navigation (Desktop)
- **Projects** → `/projects`
- **Templates** → `/templates`
- **Analytics** → `/analytics`
- **AI** → `/ai`
- **Integrations** → `/integrations`
- **Settings** (icon) → `/settings`
- **Logout** (icon)

### Mobile Navigation (Hamburger Menu)
All desktop links plus:
- **Compliance** → `/compliance`
- **Audit Trail** → `/audit`

## All Pages with Back Buttons

### 1. Dashboard (`/`)
**Back Button:** None (home page)
**Quick Actions:**
- New Project
- Use Template
- Team
- Analytics

**Navigation Links:**
- All recent projects
- Featured templates
- Platform features (AI, Risk, Export, NLP)
- Enterprise features (Compliance, Audit, Version Control, Integrations)

---

### 2. Projects Page (`/projects`)
**Back Button:** ← Back to Dashboard
**Features:**
- Project grid with cards
- Create new project button
- Search and filter projects

---

### 3. Project Detail Page (`/projects/:projectId`)
**Back Button:** ← Back to Projects
**Action Buttons:**
- **Team** → `/projects/:projectId/team`
- **Risks** → `/projects/:projectId/risks`
- **Versions** → `/projects/:projectId/versions`
- **Export** → `/projects/:projectId/export`

**Content:**
- Phase navigation sidebar
- Phase content view
- AI generation controls

---

### 4. Team Page (`/projects/:projectId/team`)
**Back Button:** ← Back to Project Detail
**Features:**
- Team member list
- Invite member modal (with Cancel button)
- Active users indicator
- Role management

---

### 5. Risk Assessment Page (`/projects/:projectId/risks`)
**Back Button:** ← Back to Project Detail
**Features:**
- Overall risk score
- Risk list with severity indicators
- Mitigation strategies
- AI recommendations
- Refresh button

---

### 6. Version Control Page (`/projects/:projectId/versions`)
**Back Button:** ← Back to Project Detail
**Features:**
- Branch list
- Version history timeline
- Merge and revert options
- Create branch button

---

### 7. Export Page (`/projects/:projectId/export`)
**Back Button:** ← Back to Project Detail
**Features:**
- Format selection (PDF, Word, PowerPoint, Markdown)
- Content selection
- Export options
- Cancel button

---

### 8. Templates Page (`/templates`)
**Back Button:** ← Back to Dashboard
**Features:**
- Template library grid
- Template cards with details
- Create new template button

---

### 9. Analytics Page (`/analytics`)
**Back Button:** ← Back to Dashboard
**Features:**
- Performance metrics
- Comparative analytics
- Report generator
- Charts and visualizations

---

### 10. AI Features Page (`/ai`)
**Back Button:** ← Back to Dashboard
**Tabs:**
- **AI Profiles** - Manage AI tuning settings
- **NLP Query** - Natural language project queries

---

### 11. Compliance Page (`/compliance`)
**Back Button:** ← Back to Dashboard
**Features:**
- Overall compliance score
- Standards tracking (ISO, FDA, GDPR, etc.)
- Compliance gaps
- Recent activities
- Generate report button

---

### 12. Audit Trail Page (`/audit`)
**Back Button:** ← Back to Dashboard
**Features:**
- Audit event list
- Search and filter
- Event details with timestamps
- Export audit log button

---

### 13. Integrations Page (`/integrations`)
**Back Button:** ← Back to Dashboard
**Features:**
- Connected integrations (GitHub, Jira, etc.)
- Available integrations (SolidWorks, AutoCAD, ANSYS, MATLAB, Slack)
- Integration categories
- Connect/disconnect buttons

---

### 14. Settings Page (`/settings`)
**Back Button:** ← Back to Dashboard
**Tabs:**
- **Profile** - User information
- **Notifications** - Email and notification preferences
- **Security** - Password change, 2FA
- **Appearance** - Theme, language, timezone

**Action Buttons:**
- Save Changes
- Cancel (returns to dashboard)

---

## Modal Navigation

### All Modals Include:
- **Close button** (X in top right)
- **Cancel button** (returns to previous view)
- **Submit/Save button** (completes action)

### Modal Examples:
1. **Invite Team Member Modal**
   - Cancel button returns to Team Page
   
2. **Create Project Modal**
   - Cancel button returns to Projects Page
   
3. **Export Configuration Modal**
   - Cancel button returns to Export Page

---

## Navigation Patterns

### Hierarchical Navigation
```
Dashboard (/)
├── Projects (/projects)
│   └── Project Detail (/projects/:id)
│       ├── Team (/projects/:id/team)
│       ├── Risks (/projects/:id/risks)
│       ├── Versions (/projects/:id/versions)
│       └── Export (/projects/:id/export)
├── Templates (/templates)
├── Analytics (/analytics)
├── AI Features (/ai)
├── Compliance (/compliance)
├── Audit Trail (/audit)
├── Integrations (/integrations)
└── Settings (/settings)
```

### Back Button Behavior
- **All pages** have a back button in the top-left corner
- **Dashboard** is the only page without a back button (it's the home)
- **Project-specific pages** return to Project Detail
- **Top-level pages** return to Dashboard
- **Modals** have both X button and Cancel button

---

## Feature Access Matrix

| Feature | Dashboard Link | Header Link | Project Detail Link | Direct URL |
|---------|---------------|-------------|---------------------|------------|
| Projects | ✓ | ✓ | - | /projects |
| Templates | ✓ | ✓ | - | /templates |
| Analytics | ✓ | ✓ | - | /analytics |
| AI Features | ✓ | ✓ | - | /ai |
| Team Management | ✓ | - | ✓ | /projects/:id/team |
| Risk Assessment | ✓ | - | ✓ | /projects/:id/risks |
| Version Control | ✓ | - | ✓ | /projects/:id/versions |
| Export | ✓ | - | ✓ | /projects/:id/export |
| Compliance | ✓ | Mobile | - | /compliance |
| Audit Trail | ✓ | Mobile | - | /audit |
| Integrations | ✓ | ✓ | - | /integrations |
| Settings | - | ✓ | - | /settings |

---

## Responsive Design

### Desktop (≥1024px)
- Full header navigation
- Sidebar navigation on some pages
- Multi-column layouts

### Tablet (768px - 1023px)
- Condensed header navigation
- Responsive grids (2 columns)
- Touch-friendly buttons

### Mobile (<768px)
- Hamburger menu
- Single column layouts
- Full-width cards
- Bottom navigation for key actions

---

## Accessibility Features

### Keyboard Navigation
- All pages support Tab navigation
- Enter key activates buttons
- Escape key closes modals

### Screen Reader Support
- Semantic HTML structure
- ARIA labels on interactive elements
- Descriptive button text

### Visual Indicators
- Focus states on all interactive elements
- Loading states with spinners
- Success/error feedback with colors and icons

---

## Summary

✅ **All pages have back buttons** (except Dashboard)
✅ **All modals have cancel/close buttons**
✅ **Dashboard provides access to all features**
✅ **Consistent navigation patterns throughout**
✅ **Mobile-responsive navigation**
✅ **Clear visual hierarchy**
✅ **Multiple ways to access each feature**

The frontend now provides complete UI controls and displays for every function and feature in the platform, with intuitive navigation and consistent back button behavior throughout the application.
