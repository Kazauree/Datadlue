// ============================================================
// DATADLUE LABS — UNIFIED DATABASE LAYER (db.js)
// Support for Supabase integration with localStorage fallback
// ============================================================

const MOCK_PROJECTS_KEY = 'datadlue_marketplace_projects';
const MOCK_ORDERS_KEY = 'datadlue_marketplace_orders';

const INITIAL_PROJECTS = [
  {
    id: 'proj-1',
    title: 'AgriPulse: AI-Powered Crop Disease Diagnosis & Yield Prediction System',
    description: 'An intelligent web-based expert system that leverages deep learning to detect crop foliage diseases and forecast yields based on real-time soil and meteorological inputs in Nigeria.',
    department: 'Computer Science',
    level: 'B.Sc',
    price: 35000,
    technologies: ['React', 'Python', 'TensorFlow', 'FastAPI'],
    pdfUrl: '/app-release.apk', // Mock PDF/file download
    images: ['/screen1.png', '/screen3.png', '/screen2.png'],
    sales: 14,
    createdAt: '2026-06-15T12:00:00Z'
  },
  {
    id: 'proj-2',
    title: 'Delta Shield: Advanced Cyber Threat Detection & Intrusion Prevention System',
    description: 'A cybersecurity monitoring tool implementing machine learning classifiers to analyze network packets, log events, and identify distributed denial-of-service (DDoS) patterns in local enterprise intranets.',
    department: 'Cybersecurity',
    level: 'B.Sc',
    price: 45000,
    technologies: ['Python', 'Docker', 'Elasticsearch', 'Kibana'],
    pdfUrl: '/app-release.apk',
    images: ['/screen3.png', '/screen2.png', '/screen1.png'],
    sales: 9,
    createdAt: '2026-06-20T14:30:00Z'
  },
  {
    id: 'proj-3',
    title: 'IoT-Enabled Smart Irrigation & Automated Soil Health Analysis Network',
    description: 'A hardware-software agricultural solution linking ESP32 sensors, soil moisture meters, and web panels to automate irrigation cycles and minimize water consumption.',
    department: 'IT',
    level: 'HND',
    price: 30000,
    technologies: ['C++', 'React', 'Node.js', 'Express', 'MongoDB'],
    pdfUrl: '/app-release.apk',
    images: ['/screen2.png', '/screen1.png', '/screen3.png'],
    sales: 18,
    createdAt: '2026-06-22T09:15:00Z'
  },
  {
    id: 'proj-4',
    title: 'Secure Electronic Voting Platform implementing Ring Signatures & Blockchain',
    description: 'A distributed cryptographic voting protocol designed for student union elections to guarantee anonymous, tamper-proof, and verifiable ballot tracking.',
    department: 'Computer Science',
    level: 'M.Sc',
    price: 60000,
    technologies: ['Solidity', 'Web3.js', 'React', 'Node.js'],
    pdfUrl: '/app-release.apk',
    images: ['/screen1.png', '/screen2.png', '/screen3.png'],
    sales: 5,
    createdAt: '2026-06-25T11:00:00Z'
  },
  {
    id: 'proj-5',
    title: 'Intelligent Network Bandwidth Allocation & QoS Monitoring Framework',
    description: 'A software-defined networking dashboard that monitors real-time bandwidth consumption across different subnets, prioritizing critical traffic based on user roles.',
    department: 'Networking',
    level: 'ND',
    price: 25000,
    technologies: ['Python', 'Django', 'SQLite', 'React'],
    pdfUrl: '/app-release.apk',
    images: ['/screen2.png', '/screen3.png', '/screen1.png'],
    sales: 11,
    createdAt: '2026-06-28T16:00:00Z'
  },
  {
    id: 'proj-6',
    title: 'AI Crop Price Predictor & Agro-Vendor Supply Chain Management Hub',
    description: 'An e-commerce and analytical forecasting portal that aggregates daily Nigerian commodity prices, offering predictive graphs and vendor coordination interfaces.',
    department: 'IT',
    level: 'M.Sc',
    price: 40000,
    technologies: ['React', 'Python', 'Statsmodels', 'Supabase'],
    pdfUrl: '/app-release.apk',
    images: ['/screen3.png', '/screen1.png', '/screen2.png'],
    sales: 7,
    createdAt: '2026-07-01T10:00:00Z'
  }
];

// Initialize mock DB if empty
if (!localStorage.getItem(MOCK_PROJECTS_KEY)) {
  localStorage.setItem(MOCK_PROJECTS_KEY, JSON.stringify(INITIAL_PROJECTS));
}
if (!localStorage.getItem(MOCK_ORDERS_KEY)) {
  localStorage.setItem(MOCK_ORDERS_KEY, JSON.stringify([]));
}

// ── database helper API ──────────────────────────────────────
export const db = {
  // Get all projects
  getProjects: async () => {
    // If Supabase keys exist in env, we can hook it up here:
    // const { data, error } = await supabase.from('projects').select('*');
    // if (error) throw error; return data;

    const data = localStorage.getItem(MOCK_PROJECTS_KEY);
    return data ? JSON.parse(data) : [];
  },

  // Save/Create project
  saveProject: async (projectData) => {
    const projects = await db.getProjects();
    const isEdit = !!projectData.id;

    if (isEdit) {
      const index = projects.findIndex((p) => p.id === projectData.id);
      if (index !== -1) {
        projects[index] = {
          ...projects[index],
          ...projectData,
          updatedAt: new Date().toISOString()
        };
      }
    } else {
      const newProj = {
        ...projectData,
        id: 'proj-' + Math.random().toString(36).substr(2, 9),
        sales: 0,
        createdAt: new Date().toISOString()
      };
      projects.push(newProj);
    }

    localStorage.setItem(MOCK_PROJECTS_KEY, JSON.stringify(projects));
    return projects;
  },

  // Delete project
  deleteProject: async (id) => {
    const projects = await db.getProjects();
    const filtered = projects.filter((p) => p.id !== id);
    localStorage.setItem(MOCK_PROJECTS_KEY, JSON.stringify(filtered));
    return filtered;
  },

  // Buy project
  purchaseProject: async (projectId, userEmail) => {
    const projects = await db.getProjects();
    const project = projects.find((p) => p.id === projectId);
    if (!project) throw new Error('Project not found');

    // Record the order
    const orders = await db.getOrders();
    const newOrder = {
      orderId: 'ord-' + Math.random().toString(36).substr(2, 9),
      projectId: project.id,
      projectTitle: project.title,
      projectPrice: project.price,
      purchasedBy: userEmail,
      purchaseDate: new Date().toISOString()
    };
    orders.push(newOrder);
    localStorage.setItem(MOCK_ORDERS_KEY, JSON.stringify(orders));

    // Increment sales count
    project.sales += 1;
    localStorage.setItem(MOCK_PROJECTS_KEY, JSON.stringify(projects));

    return newOrder;
  },

  // Get orders
  getOrders: async () => {
    const data = localStorage.getItem(MOCK_ORDERS_KEY);
    return data ? JSON.parse(data) : [];
  },

  // Get purchased projects for user
  getUserPurchases: async (userEmail) => {
    const orders = await db.getOrders();
    const userOrders = orders.filter((o) => o.purchasedBy === userEmail);
    const projects = await db.getProjects();
    
    return userOrders.map((order) => {
      const proj = projects.find((p) => p.id === order.projectId);
      return {
        ...order,
        projectDetails: proj || {
          title: order.projectTitle,
          price: order.projectPrice,
          description: 'Project details unavailable.',
          technologies: [],
          images: ['/screen1.png'],
          pdfUrl: '#'
        }
      };
    });
  },

  // Get Analytics Dashboard info
  getAnalytics: async () => {
    const projects = await db.getProjects();
    const orders = await db.getOrders();

    const totalRevenue = orders.reduce((sum, o) => sum + o.projectPrice, 0);
    const mockPreloadedRevenue = 35000 * 14 + 45000 * 9 + 30000 * 18 + 60000 * 5 + 25000 * 11 + 40000 * 7;
    const finalRevenue = totalRevenue > 0 ? totalRevenue : mockPreloadedRevenue;
    
    const buyers = new Set(orders.map((o) => o.purchasedBy));
    const uniqueBuyers = buyers.size > 0 ? buyers.size : 34; // realistic preloaded baseline

    const totalSalesCount = orders.length > 0 ? orders.length : projects.reduce((sum, p) => sum + p.sales, 0);

    // Get popular projects sorted
    const popularProjects = [...projects].sort((a, b) => b.sales - a.sales).slice(0, 5);

    return {
      totalSales: totalSalesCount,
      totalRevenue: finalRevenue,
      uniqueBuyers: uniqueBuyers,
      popularProjects,
      recentOrders: orders.slice(-5).reverse()
    };
  }
};
