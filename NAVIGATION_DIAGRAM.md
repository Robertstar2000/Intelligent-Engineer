# Complete Navigation Diagram

## Visual Navigation Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                         HEADER                                   │
│  [Logo] Projects Templates Analytics AI Integrations [Settings]  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DASHBOARD (/)                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Quick Actions:                                            │  │
│  │  [New Project] [Use Template] [Team] [Analytics]         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Platform Features:                                        │  │
│  │  [AI Generation] [Risk Assessment] [Export] [NLP Query]  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Enterprise Features:                                      │  │
│  │  [Compliance] [Audit Trail] [Version Control] [Integr.]  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
       │         │         │         │         │         │
       ▼         ▼         ▼         ▼         ▼         ▼
   ┌────────┬────────┬────────┬────────┬────────┬────────┐
   │Projects│Template│Analytics│  AI   │Complian│Integrat│
   │        │        │        │Features│  ce    │  ions  │
   └────────┴────────┴────────┴────────┴────────┴────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PROJECTS PAGE (/projects)                     │
│  [← Back to Dashboard]                                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ [Project Card 1] [Project Card 2] [Project Card 3]       │  │
│  │ [Project Card 4] [Project Card 5] [+ New Project]        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│              PROJECT DETAIL (/projects/:id)                      │
│  [← Back] [Team] [Risks] [Versions] [Export]                    │
│  ┌──────────┬──────────────────────────────────────────────┐   │
│  │ Phases   │  Phase Content                                │   │
│  │ ├─ Req   │  ┌────────────────────────────────────────┐  │   │
│  │ ├─ Design│  │ Phase details and content              │  │   │
│  │ ├─ Test  │  │ [Generate with AI] [Edit] [Save]       │  │   │
│  │ └─ Launch│  └────────────────────────────────────────┘  │   │
│  └──────────┴──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
       │         │         │         │
       ▼         ▼         ▼         ▼
   ┌────────┬────────┬────────┬────────┐
   │  Team  │ Risks  │Versions│ Export │
   │  Page  │  Page  │  Page  │  Page  │
   └────────┴────────┴────────┴────────┘
```

## Detailed Page Flows

### 1. Team Management Flow
```
Dashboard → Projects → Project Detail → Team Page
                                          │
                                          ├─ [Invite Member] → Modal
                                          │                     ├─ [Cancel] → Team Page
                                          │                     └─ [Send] → Team Page
                                          │
                                          └─ [← Back] → Project Detail
```

### 2. Risk Assessment Flow
```
Dashboard → Projects → Project Detail → Risk Assessment Page
                                          │
                                          ├─ [Refresh] → Reload risks
                                          └─ [← Back] → Project Detail
```

### 3. Version Control Flow
```
Dashboard → Projects → Project Detail → Version Control Page
                                          │
                                          ├─ [New Branch] → Create branch
                                          ├─ [Merge] → Merge branches
                                          ├─ [Revert] → Revert to version
                                          └─ [← Back] → Project Detail
```

### 4. Export Flow
```
Dashboard → Projects → Project Detail → Export Page
                                          │
                                          ├─ Select format
                                          ├─ Select content
                                          ├─ Configure options
                                          ├─ [Export] → Download
                                          ├─ [Cancel] → Project Detail
                                          └─ [← Back] → Project Detail
```

### 5. Compliance Flow
```
Dashboard → Compliance Page
              │
              ├─ View standards
              ├─ Check gaps
              ├─ [Generate Report] → Download
              └─ [← Back] → Dashboard
```

### 6. Audit Trail Flow
```
Dashboard → Audit Trail Page
              │
              ├─ Search events
              ├─ Filter by type
              ├─ [Export Log] → Download
              └─ [← Back] → Dashboard
```

### 7. Integrations Flow
```
Dashboard → Integrations Page
              │
              ├─ View connected
              ├─ Browse available
              ├─ [Connect] → Setup integration
              ├─ [Disconnect] → Remove integration
              └─ [← Back] → Dashboard
```

### 8. Settings Flow
```
Dashboard → Settings Page
              │
              ├─ Profile tab
              ├─ Notifications tab
              ├─ Security tab
              ├─ Appearance tab
              ├─ [Save Changes] → Update settings
              ├─ [Cancel] → Dashboard
              └─ [← Back] → Dashboard
```

## Mobile Navigation

```
┌─────────────────────────────────────┐
│  [☰ Menu]  Platform Logo  [User]   │
└─────────────────────────────────────┘
         │
         ▼ (when opened)
┌─────────────────────────────────────┐
│  Projects                           │
│  Templates                          │
│  Analytics                          │
│  AI Features                        │
│  Integrations                       │
│  Compliance                         │
│  Audit Trail                        │
│  ─────────────────────              │
│  Settings                           │
│  Logout                             │
└─────────────────────────────────────┘
```

## Back Button Hierarchy

```
Level 0 (Home):
  Dashboard
    │
    ├─ No back button
    └─ Entry point for all navigation

Level 1 (Main Pages):
  Projects, Templates, Analytics, AI, Compliance, Audit, Integrations, Settings
    │
    ├─ [← Back to Dashboard]
    └─ Top-level features

Level 2 (Project Pages):
  Project Detail
    │
    ├─ [← Back to Projects]
    └─ Specific project view

Level 3 (Sub-Pages):
  Team, Risks, Versions, Export
    │
    ├─ [← Back to Project Detail]
    └─ Project-specific features
```

## Modal Navigation Pattern

```
Any Page → [Action Button] → Modal
                               │
                               ├─ [X] Close → Return to page
                               ├─ [Cancel] → Return to page
                               └─ [Submit] → Process & return
```

## Quick Access Shortcuts

### From Dashboard:
- **New Project** → Projects page with create modal
- **Use Template** → Templates page
- **Team** → First project's team page
- **Analytics** → Analytics page
- **Any Feature Card** → Respective feature page

### From Project Detail:
- **Team** → Team management
- **Risks** → Risk assessment
- **Versions** → Version control
- **Export** → Export options

### From Header (Always Available):
- **Logo** → Dashboard
- **Projects** → Projects page
- **Templates** → Templates page
- **Analytics** → Analytics page
- **AI** → AI features page
- **Integrations** → Integrations page
- **Settings** → Settings page

## Navigation State Management

```
Current Location: /projects/123/team
                   │       │   │
                   │       │   └─ Feature (team)
                   │       └───── Project ID (123)
                   └───────────── Section (projects)

Breadcrumb Trail:
Dashboard > Projects > Project "ABC" > Team

Back Button Destination:
/projects/123 (Project Detail)
```

## Summary

✅ **Every page accessible from Dashboard**
✅ **Every page has back button (except Dashboard)**
✅ **Every modal has cancel/close buttons**
✅ **Multiple paths to reach each feature**
✅ **Consistent navigation patterns**
✅ **Clear visual hierarchy**
✅ **Mobile-responsive menu**
✅ **Breadcrumb-style navigation**

The navigation structure provides:
- **Intuitive hierarchy** - Users always know where they are
- **Multiple access paths** - Features accessible from multiple locations
- **Consistent back buttons** - Always return to logical parent page
- **Modal escape routes** - Always can cancel or close
- **Mobile optimization** - Full feature access on small screens
