// ============================================================
// DATADLUE LABS — UNIFIED DATABASE LAYER (db.js)
// Supabase Integration with localStorage fallback
// ============================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn('[db] Supabase keys missing. Falling back to local mock DB.');
}

// ── FALLBACK MOCK DATA ────────────────────────────────────────

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
    pdfUrl: '/app-release.apk',
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
  }
];

function ensureInitMock() {
  try {
    if (!localStorage.getItem(MOCK_PROJECTS_KEY)) {
      localStorage.setItem(MOCK_PROJECTS_KEY, JSON.stringify(INITIAL_PROJECTS));
    }
    if (!localStorage.getItem(MOCK_ORDERS_KEY)) {
      localStorage.setItem(MOCK_ORDERS_KEY, JSON.stringify([]));
    }
  } catch (e) {
    console.warn('[db] localStorage unavailable:', e.message);
  }
}

// ── DATABASE API ─────────────────────────────────────────────

export const db = {
  // Get all projects
  getProjects: async () => {
    if (supabase) {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Map Supabase snake_case to camelCase for the frontend
      return data.map(p => ({
        id: p.id,
        title: p.title,
        description: p.description,
        department: p.department,
        level: p.level,
        price: Number(p.price),
        technologies: p.technologies || [],
        pdfUrl: p.pdf_url,
        images: p.images || [],
        sales: p.sales || 0,
        createdAt: p.created_at,
        updatedAt: p.updated_at
      }));
    }

    ensureInitMock();
    const data = localStorage.getItem(MOCK_PROJECTS_KEY);
    return data ? JSON.parse(data) : [];
  },

  // Save/Create project
  saveProject: async (projectData) => {
    if (supabase) {
      const payload = {
        title: projectData.title,
        description: projectData.description,
        department: projectData.department,
        level: projectData.level,
        price: projectData.price,
        technologies: projectData.technologies,
        pdf_url: projectData.pdfUrl || projectData.pdf_url,
        images: projectData.images
      };

      if (projectData.id && !projectData.id.startsWith('proj-')) {
        // Update
        payload.id = projectData.id;
        payload.updated_at = new Date().toISOString();
        const { error } = await supabase.from('projects').update(payload).eq('id', projectData.id);
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase.from('projects').insert([payload]);
        if (error) throw error;
      }
      
      return db.getProjects(); // Refresh list
    }

    // Mock implementation
    ensureInitMock();
    const projects = await db.getProjects();
    const isEdit = projectData.id && projects.some(p => p.id === projectData.id);

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
    if (supabase) {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
      return db.getProjects();
    }

    // Mock implementation
    ensureInitMock();
    const projects = await db.getProjects();
    const filtered = projects.filter((p) => p.id !== id);
    localStorage.setItem(MOCK_PROJECTS_KEY, JSON.stringify(filtered));
    return filtered;
  },

  // Buy project
  purchaseProject: async (projectId, userEmail) => {
    if (supabase) {
      // 1. Get project details to store snapshot
      const { data: project, error: projErr } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
      
      if (projErr || !project) throw new Error('Project not found');

      // 2. Insert order
      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert([{
          project_id: project.id,
          project_title: project.title,
          project_price: project.price,
          purchased_by: userEmail
        }])
        .select()
        .single();
        
      if (orderErr) throw orderErr;

      // 3. Increment project sales (Supabase RPC would be better, but we can do a simple update)
      await supabase
        .from('projects')
        .update({ sales: (project.sales || 0) + 1 })
        .eq('id', project.id);

      return {
        orderId: order.order_id,
        projectId: order.project_id,
        projectTitle: order.project_title,
        projectPrice: Number(order.project_price),
        purchasedBy: order.purchased_by,
        purchaseDate: order.purchase_date
      };
    }

    // Mock implementation
    ensureInitMock();
    const projects = await db.getProjects();
    const project = projects.find((p) => p.id === projectId);
    if (!project) throw new Error('Project not found');

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

    project.sales += 1;
    localStorage.setItem(MOCK_PROJECTS_KEY, JSON.stringify(projects));

    return newOrder;
  },

  // Get orders (Admin)
  getOrders: async () => {
    if (supabase) {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('purchase_date', { ascending: false });
      
      if (error) throw error;
      
      return data.map(o => ({
        orderId: o.order_id,
        projectId: o.project_id,
        projectTitle: o.project_title,
        projectPrice: Number(o.project_price),
        purchasedBy: o.purchased_by,
        purchaseDate: o.purchase_date
      }));
    }

    ensureInitMock();
    const data = localStorage.getItem(MOCK_ORDERS_KEY);
    return data ? JSON.parse(data) : [];
  },

  // Get purchased projects for user
  getUserPurchases: async (userEmail) => {
    if (supabase) {
      // Fetch orders for this user
      const { data: orders, error: orderErr } = await supabase
        .from('orders')
        .select('*')
        .eq('purchased_by', userEmail)
        .order('purchase_date', { ascending: false });
        
      if (orderErr) throw orderErr;
      if (!orders || orders.length === 0) return [];

      // Fetch the corresponding projects
      const projectIds = [...new Set(orders.map(o => o.project_id))].filter(Boolean);
      let projects = [];
      
      if (projectIds.length > 0) {
        const { data: projs, error: projsErr } = await supabase
          .from('projects')
          .select('*')
          .in('id', projectIds);
          
        if (!projsErr && projs) {
          projects = projs;
        }
      }

      // Combine
      return orders.map(order => {
        const proj = projects.find(p => p.id === order.project_id);
        
        return {
          orderId: order.order_id,
          projectId: order.project_id,
          projectTitle: order.project_title,
          projectPrice: Number(order.project_price),
          purchasedBy: order.purchased_by,
          purchaseDate: order.purchase_date,
          projectDetails: proj ? {
            title: proj.title,
            description: proj.description,
            price: proj.price,
            technologies: proj.technologies || [],
            images: proj.images || ['/screen1.png'],
            pdfUrl: proj.pdf_url || '#'
          } : {
            title: order.project_title,
            price: order.project_price,
            description: 'Project details unavailable.',
            technologies: [],
            images: ['/screen1.png'],
            pdfUrl: '#'
          }
        };
      });
    }

    // Mock implementation
    ensureInitMock();
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
    if (supabase) {
      const { data: projects, error: pErr } = await supabase.from('projects').select('sales');
      const { data: orders, error: oErr } = await supabase.from('orders').select('project_price, purchased_by, purchase_date, order_id');
      
      if (pErr || oErr) throw (pErr || oErr);

      const totalRevenue = orders.reduce((sum, o) => sum + Number(o.project_price), 0);
      const buyers = new Set(orders.map((o) => o.purchased_by));
      const totalSalesCount = orders.length;

      // Best sellers
      const { data: popular } = await supabase
        .from('projects')
        .select('*')
        .order('sales', { ascending: false })
        .limit(5);

      return {
        totalSales: totalSalesCount,
        totalRevenue: totalRevenue,
        uniqueBuyers: buyers.size,
        popularProjects: popular ? popular.map(p => ({
          id: p.id,
          title: p.title,
          sales: p.sales
        })) : [],
        recentOrders: orders
          .sort((a, b) => new Date(b.purchase_date) - new Date(a.purchase_date))
          .slice(0, 5)
          .map(o => ({
            orderId: o.order_id,
            projectPrice: Number(o.project_price),
            purchasedBy: o.purchased_by,
            purchaseDate: o.purchase_date
          }))
      };
    }

    // Mock implementation
    ensureInitMock();
    const projects = await db.getProjects();
    const orders = await db.getOrders();

    const totalRevenue = orders.reduce((sum, o) => sum + o.projectPrice, 0);
    const mockPreloadedRevenue = 35000 * 14 + 45000 * 9 + 30000 * 18 + 60000 * 5 + 25000 * 11 + 40000 * 7;
    const finalRevenue = totalRevenue > 0 ? totalRevenue : mockPreloadedRevenue;
    
    const buyers = new Set(orders.map((o) => o.purchasedBy));
    const uniqueBuyers = buyers.size > 0 ? buyers.size : 34;

    const totalSalesCount = orders.length > 0 ? orders.length : projects.reduce((sum, p) => sum + p.sales, 0);

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
