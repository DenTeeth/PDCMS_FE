# Private Dental Clinic Management System - Frontend

A modern, high-performance dental clinic management system built with Next.js 14, React, TypeScript, and Tailwind CSS.

## 🚀 Features

### Public Website
- **Modern Homepage** with impressive animations using Framer Motion
- **Responsive Design** optimized for all devices
- **Performance Optimized** with lazy loading and code splitting
- **SEO Friendly** with proper meta tags and structured data
- Sections: Hero, About, Stats, Services, Doctors, Testimonials, FAQ, Appointment

### Management System
Multiple role-based dashboards:
- **Admin**: System management, accounts, appointments, blogs, roles, settings
- **Manager**: Analytics, appointments, employees, feedback, patients, settings
- **Dentist**: Schedule, patients, treatments, stages, follow-ups
- **Receptionist**: Appointments, customer management (groups & contacts), patient records, KPI, settings
- **Accountant**: Performance monitoring and financial management
- **Warehouse**: Inventory, products, statistics

### Customer Management
- **Integrated Tabs Interface** for Customer Groups and Customer Contacts
- **Contact Form** with validation for customer details
- **Source Tracking**: Website, Facebook, Zalo, Walk-in, Referral
- **Service Selection**: 13+ dental services available
- **Clean URL Structure**: `/receptionist/customers/contact/*`

## 🎨 Design System

### Colors
- **Primary**: `#8b5fbf` (Purple)
- **Secondary**: `#b794f6` (Light Purple)
- **Accent**: `#e9d5ff` (Pale Purple)

### Typography
- Font: Inter (Google Fonts)
- Headings: Bold, large sizes
- Body: Regular, readable sizes

### Components
- Built with Radix UI for accessibility
- Styled with Tailwind CSS
- Animations with Framer Motion

## ⚡ Performance Optimizations

### Implemented
- ✅ **Code Splitting**: Dynamic imports for below-fold components
- ✅ **Image Optimization**: Next.js Image component with WebP/AVIF
- ✅ **Lazy Loading**: Intersection Observer for animations and images
- ✅ **Bundle Optimization**: Tree-shaking and vendor chunk splitting
- ✅ **Animation Optimization**: React.memo, reduced complexity
- ✅ **Caching Strategy**: Static assets and vendor bundles

### Custom Hooks
- `useOptimizedAnimation`: Performance-aware animations
- `useDevicePerformance`: Adaptive animations based on device capabilities

### Target Metrics
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1
- Initial Bundle Size: < 200KB

See [PERFORMANCE_OPTIMIZATION.md](./PERFORMANCE_OPTIMIZATION.md) for detailed guide.

## 🛠️ Tech Stack

### Core
- **Next.js 14+**: React framework with App Router
- **React 18+**: UI library
- **TypeScript**: Type safety
- **Tailwind CSS**: Utility-first CSS

### UI Libraries
- **Radix UI**: Accessible component primitives
- **Framer Motion**: Animation library
- **React Intersection Observer**: Scroll-triggered animations
- **Lucide React**: Icon library

### Forms & Validation
- **React Hook Form**: Form management
- **Zod**: Schema validation

### Data Fetching
- **TanStack Query (React Query)**: Server state management
- **Axios**: HTTP client

### Charts & Visualization
- **Recharts**: Chart library

### Development Tools
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **TypeScript**: Static type checking

## 📦 Installation

```bash
# Clone the repository
git clone http://git.fa.edu.vn/hcm25_fr_fu_js_java_01/nha-khoa-group/sep193_privatedentalclinic/fe.git
cd fe

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Run development server
npm run dev
```

## 🚀 Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Analyze bundle size
npm run analyze
```

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (public)/          # Public pages (About, Contact, Services, Doctors)
│   ├── admin/             # Admin dashboard
│   ├── manager/           # Manager dashboard
│   ├── dentist/           # Dentist dashboard
│   ├── receptionist/      # Receptionist dashboard
│   ├── accountant/        # Accountant dashboard
│   ├── warehouse/         # Warehouse dashboard
│   └── user/              # User dashboard
├── components/            # React components
│   ├── accountant/        # Accountant-specific components
│   ├── admin/             # Admin-specific components
│   ├── auth/              # Authentication components
│   ├── dentist/           # Dentist-specific components
│   ├── homepage/          # Homepage sections
│   ├── layout/            # Layout components (Header, Footer, Navigation)
│   ├── manager/           # Manager-specific components
│   ├── receptionist/      # Receptionist-specific components
│   ├── ui/                # Reusable UI components
│   ├── user/              # User-specific components
│   └── warehouse/         # Warehouse-specific components
├── contexts/              # React contexts
│   ├── AuthContext.tsx    # Authentication state
│   └── StatusContext.tsx  # Status management
├── data/                  # Mock data and constants
├── hooks/                 # Custom React hooks
│   ├── useOptimizedAnimation.ts
│   └── useDevicePerformance.ts
├── lib/                   # Utility functions
│   ├── api.ts             # API client
│   ├── cookies.ts         # Cookie utilities
│   └── utils.ts           # Common utilities
├── types/                 # TypeScript types
└── img/                   # Static images
```

## 🔐 Authentication

The system uses JWT-based authentication with role-based access control (RBAC).

### Available Roles
- `ADMIN`: Full system access
- `MANAGER`: Management operations
- `DENTIST`: Clinical operations
- `RECEPTIONIST`: Front desk operations
- `ACCOUNTANT`: Financial operations
- `WAREHOUSE`: Inventory operations
- `USER`: Patient portal

### Protected Routes
- All dashboard routes are protected with `ProtectedRoute` component
- Automatic redirect to login if not authenticated
- Role-based access control for specific features

## 🎯 Key Features Implementation

### Customer Management with Tabs
Location: `/receptionist/customers`

Features:
- **Customer Groups Tab**: View and manage customer groups
- **Customer Contacts Tab**: View, create, edit customer contacts
- **Integrated Interface**: Seamless switching between tabs
- **Clean URLs**: `/receptionist/customers/contact/[id]` for contact details

### Contact Form with Dropdowns
Location: `src/components/receptionist/ContactForm.tsx`

Features:
- **Source Dropdown**: WEBSITE, FACEBOOK, ZALO, WALK_IN, REFERRAL
- **Service Dropdown**: 13 dental services
- **Form Validation**: Zod schema validation
- **Error Handling**: Field-level error messages

### Homepage with Animations
Location: `src/components/homepage/`

Sections:
1. **HeroSection**: Main banner with gradient background
2. **StatsSection**: Counter animations for key metrics
3. **AboutSection**: Company overview with features
4. **FeaturesSection**: Why choose us
5. **ServicesSection**: Dental services showcase
6. **DoctorsSection**: Team members
7. **TestimonialsSection**: Customer reviews carousel
8. **FAQSection**: Accordion FAQ
9. **AppointmentSection**: Booking form
10. **TeamSection**: Extended team information

## 📊 Performance Monitoring

### Tools
- **Lighthouse**: Built-in Chrome DevTools
- **WebPageTest**: External performance testing
- **PageSpeed Insights**: Google's performance tool

### Commands
```bash
# Build and analyze bundle
npm run build
npm run analyze

# Run Lighthouse
lighthouse http://localhost:3000 --view
```

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

## 🌐 Environment Variables

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8080/api

# Authentication
NEXT_PUBLIC_JWT_SECRET=your-secret-key

# Feature Flags
NEXT_PUBLIC_ENABLE_ANIMATIONS=true
NEXT_PUBLIC_ENABLE_ANALYTICS=false
```

## 📝 Documentation

- [Performance Optimization Guide](./PERFORMANCE_OPTIMIZATION.md)
- [Authentication Flow](./AUTH_FLOW_DETAILED.md)
- [Authentication Implementation Journey](./AUTH_IMPLEMENTATION_JOURNEY.md)
- [Frontend Integration Guide](./FRONTEND_INTEGRATION.md)
- [Code Review Checklist](./CODE_REVIEW_CHECKLIST.md)

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit your changes: `git commit -m 'Add some feature'`
3. Push to the branch: `git push origin feature/your-feature`
4. Submit a merge request

### Code Style
- Follow ESLint rules
- Use TypeScript strict mode
- Write meaningful commit messages
- Add comments for complex logic
- Keep components small and focused

## 👥 Team

- **Frontend Developers**: [Your Team]
- **Backend Developers**: [Your Team]
- **Designers**: [Your Team]
- **Project Manager**: [Your Team]

## 📄 License

This project is private and confidential.

## 🔗 Related Repositories

- **Backend API**: [Link to backend repo]
- **Design System**: [Link to design system]
- **Documentation**: [Link to docs]

## 📞 Support

For support, email support@dentalclinic.com or join our Slack channel.

---

**Note**: This is a student project for FPT University (SEP193_PRIVATEDENTALCLINIC).


## Add your files

- [ ] [Create](https://docs.gitlab.com/ee/user/project/repository/web_editor.html#create-a-file) or [upload](https://docs.gitlab.com/ee/user/project/repository/web_editor.html#upload-a-file) files
- [ ] [Add files using the command line](https://docs.gitlab.com/topics/git/add_files/#add-files-to-a-git-repository) or push an existing Git repository with the following command:

```
cd existing_repo
git remote add origin http://git.fa.edu.vn/hcm25_fr_fu_js_java_01/nha-khoa-group/sep193_privatedentalclinic/fe.git
git branch -M main
git push -uf origin main
```

## Integrate with your tools

- [ ] [Set up project integrations](http://git.fa.edu.vn/hcm25_fr_fu_js_java_01/nha-khoa-group/sep193_privatedentalclinic/fe/-/settings/integrations)

## Collaborate with your team

- [ ] [Invite team members and collaborators](https://docs.gitlab.com/ee/user/project/members/)
- [ ] [Create a new merge request](https://docs.gitlab.com/ee/user/project/merge_requests/creating_merge_requests.html)
- [ ] [Automatically close issues from merge requests](https://docs.gitlab.com/ee/user/project/issues/managing_issues.html#closing-issues-automatically)
- [ ] [Enable merge request approvals](https://docs.gitlab.com/ee/user/project/merge_requests/approvals/)
- [ ] [Set auto-merge](https://docs.gitlab.com/user/project/merge_requests/auto_merge/)

## Test and Deploy

Use the built-in continuous integration in GitLab.

- [ ] [Get started with GitLab CI/CD](https://docs.gitlab.com/ee/ci/quick_start/)
- [ ] [Analyze your code for known vulnerabilities with Static Application Security Testing (SAST)](https://docs.gitlab.com/ee/user/application_security/sast/)
- [ ] [Deploy to Kubernetes, Amazon EC2, or Amazon ECS using Auto Deploy](https://docs.gitlab.com/ee/topics/autodevops/requirements.html)
- [ ] [Use pull-based deployments for improved Kubernetes management](https://docs.gitlab.com/ee/user/clusters/agent/)
- [ ] [Set up protected environments](https://docs.gitlab.com/ee/ci/environments/protected_environments.html)

***

# Editing this README

When you're ready to make this README your own, just edit this file and use the handy template below (or feel free to structure it however you want - this is just a starting point!). Thanks to [makeareadme.com](https://www.makeareadme.com/) for this template.

## Suggestions for a good README

Every project is different, so consider which of these sections apply to yours. The sections used in the template are suggestions for most open source projects. Also keep in mind that while a README can be too long and detailed, too long is better than too short. If you think your README is too long, consider utilizing another form of documentation rather than cutting out information.

## Name
Choose a self-explaining name for your project.

## Description
Let people know what your project can do specifically. Provide context and add a link to any reference visitors might be unfamiliar with. A list of Features or a Background subsection can also be added here. If there are alternatives to your project, this is a good place to list differentiating factors.

## Badges
On some READMEs, you may see small images that convey metadata, such as whether or not all the tests are passing for the project. You can use Shields to add some to your README. Many services also have instructions for adding a badge.

## Visuals
Depending on what you are making, it can be a good idea to include screenshots or even a video (you'll frequently see GIFs rather than actual videos). Tools like ttygif can help, but check out Asciinema for a more sophisticated method.

## Installation
Within a particular ecosystem, there may be a common way of installing things, such as using Yarn, NuGet, or Homebrew. However, consider the possibility that whoever is reading your README is a novice and would like more guidance. Listing specific steps helps remove ambiguity and gets people to using your project as quickly as possible. If it only runs in a specific context like a particular programming language version or operating system or has dependencies that have to be installed manually, also add a Requirements subsection.

## Usage
Use examples liberally, and show the expected output if you can. It's helpful to have inline the smallest example of usage that you can demonstrate, while providing links to more sophisticated examples if they are too long to reasonably include in the README.

## Support
Tell people where they can go to for help. It can be any combination of an issue tracker, a chat room, an email address, etc.

## Roadmap
If you have ideas for releases in the future, it is a good idea to list them in the README.

## Contributing
State if you are open to contributions and what your requirements are for accepting them.

For people who want to make changes to your project, it's helpful to have some documentation on how to get started. Perhaps there is a script that they should run or some environment variables that they need to set. Make these steps explicit. These instructions could also be useful to your future self.

You can also document commands to lint the code or run tests. These steps help to ensure high code quality and reduce the likelihood that the changes inadvertently break something. Having instructions for running tests is especially helpful if it requires external setup, such as starting a Selenium server for testing in a browser.

## Authors and acknowledgment
Show your appreciation to those who have contributed to the project.

## License
For open source projects, say how it is licensed.

## Project status
If you have run out of energy or time for your project, put a note at the top of the README saying that development has slowed down or stopped completely. Someone may choose to fork your project or volunteer to step in as a maintainer or owner, allowing your project to keep going. You can also make an explicit request for maintainers.
