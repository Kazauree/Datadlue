import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useParams,
} from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* ── Company data ─────────────────────────────────────────── */
const company = {
  name: 'Datadlue Labs',
  tagline: 'Connecting Data, Agriculture & Innovation for a Smarter Future',
  email: 'Datadlue@gmail.com',
  phone: '+234 810 375 7754',
  whatsapp: '08103757754',
};

/* ── Slider data ──────────────────────────────────────────── */
const slides = [
  {
    title: 'AgriPulse Intelligence',
    category: 'Precision Farming Platform',
    description:
      'AI-powered crop monitoring, yield signals, and decision support for modern Nigerian farms. Real-time insight at every growth stage.',
    accent: 'Neural sensing • Live data',
    index: '01',
  },
  {
    title: 'Delta Commerce Engine',
    category: 'Economic Empowerment Suite',
    description:
      'A digital commerce framework that helps communities build resilient local trade ecosystems through smart coordination tools.',
    accent: 'Trust infrastructure • Market access',
    index: '02',
  },
  {
    title: 'Atlas Studio',
    category: 'Future-Ready Web Systems',
    description:
      'Premium web platforms, product design, and intelligent automation for brands that demand clarity, speed, and visual impact.',
    accent: 'Immersive UI • Zero friction',
    index: '03',
  },
];

/* ── Feature cards data ───────────────────────────────────── */
const features = [
  {
    icon: '🧠',
    num: '01',
    title: 'AI Strategy',
    text: 'We turn data into decision-making systems with predictive workflows and elegant interfaces that adapt to real conditions.',
    tag: 'Intelligence Systems',
  },
  {
    icon: '🌿',
    num: '02',
    title: 'Agri-Tech Systems',
    text: 'Smart tools for farmers, cooperatives, and agri-businesses that need reliable operational leverage and market intelligence.',
    tag: 'Agricultural AI',
  },
  {
    icon: '📈',
    num: '03',
    title: 'Digital Growth',
    text: 'Conversion-focused digital products that elevate visibility, revenue, and community trust at every stage of scale.',
    tag: 'Revenue Expansion',
  },
  {
    icon: '⚡',
    num: '04',
    title: 'Automation',
    text: 'Lean, scalable automations that remove bottlenecks and unlock faster execution across your entire operation.',
    tag: 'Workflow Intelligence',
  },
];

/* ── Services data ────────────────────────────────────────── */
const services = [
  {
    symbol: '◈',
    name: 'AI-Powered Websites',
    description:
      'Crafted web experiences that blend innovation, motion, and business clarity — built for impact from the first pixel.',
  },
  {
    symbol: '⌁',
    name: 'Agriculture Intelligence',
    description:
      'Insight systems for farming operations, agribusiness, and food supply value chains with real-time data layers.',
  },
  {
    symbol: '◎',
    name: 'Product Design Labs',
    description:
      'Discovery, interface design, and prototype development for modern digital products that people actually love using.',
  },
  {
    symbol: '⟡',
    name: 'Community Empowerment',
    description:
      'Platforms that improve access, coordination, and growth for local economies and underserved digital markets.',
  },
];

/* ── Blog posts ───────────────────────────────────────────── */
const blogPosts = [
  {
    slug: 'designing-for-nigerian-agriculture',
    title: 'Designing for Nigerian Agriculture in the Age of AI',
    excerpt:
      'A look at how intelligent systems can make farm operations clearer, faster, and more profitable for Nigerian farmers.',
    readingTime: '5 min read',
    date: 'June 2026',
    body: [
      'Agriculture in Nigeria has enormous potential, but the people building within it need tools that reduce friction instead of adding more complexity. The challenge is not access to data — it is access to insight.',
      'At Datadlue Labs, we believe the best agricultural software should feel calm, trustworthy, and immediate. That means clearer dashboards, faster actions, and systems that support real-world decisions under unpredictable conditions like erratic weather, supply chain gaps, or fluctuating market prices.',
      'The future of Nigerian agriculture is not just about collecting data. It is about translating weather patterns, soil sensors, crop indicators, and market signals into actions that improve yield, profitability, and long-term resilience for every farmer on the ground.',
      'Our AgriPulse platform is the direct expression of this belief — built for real farms, real cooperatives, and real economic growth.',
    ],
  },
  {
    slug: 'web-platforms-that-earn-trust',
    title: 'Web Platforms That Earn Trust From the First Second',
    excerpt:
      'Why premium visual language, speed, and motion design matter for high-stakes digital products in emerging markets.',
    readingTime: '4 min read',
    date: 'May 2026',
    body: [
      'Trust is not a nice-to-have. It is the operating system of any serious digital business — especially in markets where users carry skepticism as default armor.',
      'A strong first impression combines visual hierarchy, purposeful motion, accessibility, and a clear narrative flow. When those layers work together seamlessly, users feel oriented instead of overwhelmed.',
      'That is why every Datadlue Labs build starts with clarity and ends with polish. We design premium web experiences that look futuristic, but also feel understandable, fast, and genuinely useful to the people who need them.',
      'The result? Lower bounce rates, higher engagement, and users who come back. In digital product terms, that is trust — earned in under three seconds.',
    ],
  },
  {
    slug: 'economic-empowerment-through-digital-tools',
    title: 'Economic Empowerment Through Digital Tools',
    excerpt:
      'How better platforms can help Nigerian communities create sustainable value, access markets, and unlock real opportunity.',
    readingTime: '6 min read',
    date: 'April 2026',
    body: [
      'Economic empowerment is strongest when digital systems help people coordinate, sell, learn, and scale with less friction — not when technology adds new layers of complexity to already difficult situations.',
      'Whether it is a cooperative platform, a local marketplace, a trade coordination tool, or an educational product, the goal is always the same: create access to opportunity where it previously did not exist.',
      'We design systems that deeply respect local realities — connectivity constraints, language preferences, trust patterns — while introducing the speed, structure, and intelligence that modern commerce demands.',
      'The Delta Commerce Engine is our commitment to that vision: a toolkit for communities to build their own digital economies on their own terms.',
    ],
  },
];

/* ── Team ─────────────────────────────────────────────────── */
const team = [
  'AI product designers',
  'Full-stack engineers',
  'Growth strategists',
  'Agri-tech problem solvers',
  'UX researchers',
  'Data scientists',
];

const awards = [
  'Innovation-first product thinking',
  'Future-ready visual direction',
  'Community-centered digital strategy',
  'Rapid prototyping excellence',
];

/* =========================================================== */
/*  ROOT APP                                                    */
/* =========================================================== */
function App() {
  useScrollReveal();
  useHeaderScroll();

  return (
    <div className="app-shell">
      <BackgroundEffects />
      <Header />
      <main className="page-shell">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/blog" element={<BlogIndex />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
        </Routes>
      </main>
      <SiteFooter />
    </div>
  );
}

/* ── Scroll reveal hook ───────────────────────────────────── */
function useScrollReveal() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    );

    const elements = document.querySelectorAll('[data-reveal]');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [location.pathname]);
}

/* ── Header scroll hook ───────────────────────────────────── */
function useHeaderScroll() {
  useEffect(() => {
    const header = document.querySelector('.header');
    const handler = () => {
      if (window.scrollY > 20) {
        header?.classList.add('scrolled');
      } else {
        header?.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);
}

/* =========================================================== */
/*  BACKGROUND                                                  */
/* =========================================================== */
function BackgroundEffects() {
  return (
    <div className="bg-effects" aria-hidden="true">
      <div className="bg-orb bg-orb-a" />
      <div className="bg-orb bg-orb-b" />
      <div className="bg-orb bg-orb-c" />
      <div className="bg-grid" />
      <div className="bg-scanline" />
    </div>
  );
}

/* =========================================================== */
/*  HEADER                                                      */
/* =========================================================== */
function Header() {
  const [open, setOpen] = useState(false);
  const navItems = [
    { to: '/', label: 'Home', exact: true },
    { to: '/about', label: 'About' },
    { to: '/blog', label: 'Blog' },
  ];

  const close = useCallback(() => setOpen(false), []);

  // Close menu on escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [close]);

  return (
    <header className="header" role="banner">
      <Link to="/" className="brand" aria-label="Datadlue Labs Home" onClick={close}>
        <img
          src="/logo.png"
          alt="Datadlue Labs Logo"
          className="brand-logo-img"
          width="42"
          height="42"
        />
        <div className="brand-text">
          <strong>Datadlue Labs</strong>
          <small>AI-powered innovation</small>
        </div>
      </Link>

      <nav
        className={`nav${open ? ' open' : ''}`}
        id="main-nav"
        aria-label="Main navigation"
      >
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) =>
              `nav-link${isActive ? ' active' : ''}`
            }
            onClick={close}
          >
            {item.label}
          </NavLink>
        ))}
        <a
          className="nav-link nav-cta"
          href={`mailto:${company.email}`}
          onClick={close}
        >
          Start a project
        </a>
      </nav>

      <button
        className={`menu-btn${open ? ' open' : ''}`}
        type="button"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls="main-nav"
        onClick={() => setOpen((v) => !v)}
      >
        <span aria-hidden="true" />
        <span aria-hidden="true" />
        <span aria-hidden="true" />
      </button>
    </header>
  );
}

/* =========================================================== */
/*  HOME PAGE                                                   */
/* =========================================================== */
function HomePage() {
  return (
    <>
      <HeroSection />
      <TickerBanner />
      <FeaturedSlider />
      <FeatureCards />
      <ServicesShowcase />
      <DownloadSection />
      <ContactBand />
    </>
  );
}

/* ── Hero ─────────────────────────────────────────────────── */
function HeroSection() {
  const particles = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        id: i,
        size: Math.random() * 4 + 2,
        x: Math.random() * 100,
        y: Math.random() * 100,
        dur: Math.random() * 8 + 5,
        delay: Math.random() * 6,
        tx: (Math.random() - 0.5) * 80,
        ty: (Math.random() - 0.5) * 80,
        color: ['#00D4FF', '#7C3AED', '#10B981', '#22D3EE'][Math.floor(Math.random() * 4)],
      })),
    []
  );

  const neuralDots = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        id: i,
        x: 10 + i * 9,
        y: 20 + (i % 4) * 20,
      })),
    []
  );

  return (
    <section className="hero" aria-labelledby="hero-title">
      {/* Left: content */}
      <div className="hero-content" data-reveal>
        <div className="hero-badge" aria-label="Company status">
          <span className="hero-badge-dot" aria-hidden="true" />
          Future technology · Agriculture · Economic empowerment
        </div>

        <h1 id="hero-title" className="hero-title">
          Designing the intelligent systems that power{' '}
          <span className="gradient-text">Nigeria&apos;s next digital leap.</span>
        </h1>

        <p className="hero-copy">
          Datadlue Labs builds AI-driven web products, immersive interfaces, and
          strategic digital experiences that help agriculture, commerce, and
          innovation-led brands move with precision.
        </p>

        <div className="hero-actions">
          <a
            id="hero-cta-primary"
            className="btn btn-primary"
            href={`mailto:${company.email}`}
          >
            Launch with us →
          </a>
          <Link
            id="hero-cta-secondary"
            className="btn btn-secondary"
            to="/about"
          >
            Our story
          </Link>
        </div>

        <div className="hero-stats">
          <div className="stat-item">
            <label>Focus areas</label>
            <strong>3+ domains</strong>
          </div>
          <div className="stat-item">
            <label>Technology</label>
            <strong>AI-first</strong>
          </div>
          <div className="stat-item">
            <label>Based in</label>
            <strong>Nigeria 🇳🇬</strong>
          </div>
        </div>
      </div>

      {/* Right: visual */}
      <div className="hero-visual" aria-hidden="true" data-reveal data-delay="2">
        {/* Floating particles */}
        <div className="particle-field">
          {particles.map((p) => (
            <span
              key={p.id}
              className="particle"
              style={{
                width: p.size,
                height: p.size,
                left: `${p.x}%`,
                top: `${p.y}%`,
                background: p.color,
                boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
                '--dur': `${p.dur}s`,
                '--delay': `${p.delay}s`,
                '--tx': `${p.tx}px`,
                '--ty': `${p.ty}px`,
              }}
            />
          ))}
        </div>

        {/* Neural network background */}
        <div className="neural-wrap">
          <svg
            viewBox="0 0 500 500"
            className="neural-lines"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M30 80 Q120 50 200 120 T380 90 T500 140" />
            <path d="M30 200 Q150 160 250 220 T440 180 T510 230" />
            <path d="M30 320 Q130 280 220 340 T400 300 T520 350" />
            <path d="M80 30 Q120 150 100 260 T130 420" />
            <path d="M250 20 Q280 140 260 280 T290 450" />
            <path d="M420 50 Q450 180 430 300 T460 440" />
          </svg>
          {neuralDots.map((dot) => (
            <span
              key={dot.id}
              className="neural-dot"
              style={{ left: `${dot.x}%`, top: `${dot.y}%` }}
            />
          ))}
        </div>

        {/* Main holographic card */}
        <div className="hero-card">
          <div className="orbit-ring orbit-ring-1">
            <span className="orbit-dot orbit-dot-1" />
          </div>
          <div className="orbit-ring orbit-ring-2">
            <span className="orbit-dot orbit-dot-2" />
          </div>
          <div className="orbit-ring orbit-ring-3">
            <span className="orbit-dot orbit-dot-3" />
          </div>

          <div className="logo-core">
            <img src="/logo.png" alt="Datadlue Labs" />
          </div>
        </div>

        {/* Floating metric chips */}
        <div className="hero-metrics hero-metrics-left">
          <div className="metric-chip">
            <strong>AI Systems</strong>
            <span>Smart · Adaptive</span>
          </div>
          <div className="metric-chip">
            <strong>Agri Impact</strong>
            <span>Harvest insights</span>
          </div>
        </div>
        <div className="hero-metrics hero-metrics-right">
          <div className="metric-chip">
            <strong>100% Custom</strong>
            <span>Every build</span>
          </div>
          <div className="metric-chip">
            <strong>Future-ready</strong>
            <span>Scale with ease</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Ticker ───────────────────────────────────────────────── */
function TickerBanner() {
  const items = [
    'AI Web Systems',
    'Future Farming Tools',
    'Digital Empowerment',
    'Product Strategy',
    'Workflow Automation',
    'Cinematic UI Design',
    'Agricultural AI',
    'Economic Platforms',
  ];
  const doubled = [...items, ...items];

  return (
    <section className="ticker" aria-label="Capabilities ticker">
      <div className="ticker-track" role="marquee">
        {doubled.map((item, idx) => (
          <span key={`${item}-${idx}`} className="ticker-item">
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}

/* ── Featured Slider ──────────────────────────────────────── */
function FeaturedSlider() {
  const [active, setActive] = useState(0);
  const count = slides.length;

  const prev = useCallback(
    () => setActive((c) => (c - 1 + count) % count),
    [count]
  );
  const next = useCallback(() => setActive((c) => (c + 1) % count), [count]);

  // Autoplay
  useEffect(() => {
    const id = setInterval(next, 6000);
    return () => clearInterval(id);
  }, [next]);

  // Keyboard
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [prev, next]);

  return (
    <section className="slider-section" data-reveal aria-label="Featured projects slider">
      <div className="section-header">
        <div>
          <p className="eyebrow">Featured systems</p>
          <h2>Project spotlight</h2>
        </div>
        <div className="slider-btns" role="group" aria-label="Slider controls">
          <button
            id="slider-prev"
            className="slider-btn"
            type="button"
            onClick={prev}
            aria-label="Previous slide"
          >
            ←
          </button>
          <button
            id="slider-next"
            className="slider-btn"
            type="button"
            onClick={next}
            aria-label="Next slide"
          >
            →
          </button>
        </div>
      </div>

      <div className="slider-window" role="region" aria-live="polite">
        <div
          className="slider-track"
          style={{ transform: `translateX(-${active * 100}%)` }}
        >
          {slides.map((slide) => (
            <article key={slide.title} className="slide-panel">
              <div className="slide-number" aria-hidden="true">
                {slide.index}
              </div>
              <div className="slide-badge">{slide.category}</div>
              <h3>{slide.title}</h3>
              <p>{slide.description}</p>
              <span className="slide-accent">{slide.accent}</span>
            </article>
          ))}
        </div>
      </div>

      <div className="slider-controls-row">
        <div className="slider-dots" role="group" aria-label="Go to slide">
          {slides.map((slide, idx) => (
            <button
              key={slide.title}
              id={`slider-dot-${idx}`}
              className={`slider-dot${idx === active ? ' active' : ''}`}
              type="button"
              onClick={() => setActive(idx)}
              aria-label={`Go to ${slide.title}`}
              aria-pressed={idx === active}
            />
          ))}
        </div>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.72rem',
            color: 'var(--clr-text-faint)',
            letterSpacing: '0.1em',
          }}
        >
          {String(active + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
        </span>
      </div>
    </section>
  );
}

/* ── Feature Cards ────────────────────────────────────────── */
function FeatureCards() {
  return (
    <section className="section" data-reveal aria-labelledby="features-heading">
      <div className="section-header">
        <div>
          <p className="eyebrow">Why Datadlue Labs</p>
          <h2 id="features-heading">Built for clarity, speed, and impact</h2>
        </div>
        <p className="section-caption">
          We blend strategy, engineering, and visual storytelling to create
          software that feels premium and performs under pressure.
        </p>
      </div>

      <div className="feature-grid">
        {features.map((feature) => (
          <article
            key={feature.title}
            className="feature-card"
            data-reveal
            data-delay={features.indexOf(feature) + 1}
          >
            <div className="feature-icon-wrap" aria-hidden="true">
              {feature.icon}
            </div>
            <h3>{feature.title}</h3>
            <p>{feature.text}</p>
            <span className="feature-tag">{feature.tag}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ── Services Showcase ────────────────────────────────────── */
function ServicesShowcase() {
  return (
    <section className="section" data-reveal aria-labelledby="services-heading">
      <div className="section-header">
        <div>
          <p className="eyebrow">Services</p>
          <h2 id="services-heading">Core offerings</h2>
        </div>
        <p className="section-caption">
          Four focused solution areas that drive our work — each designed to
          create real, measurable impact.
        </p>
      </div>

      <div className="services-grid">
        {services.map((service) => (
          <article key={service.name} className="service-card">
            <span className="service-symbol" aria-hidden="true">
              {service.symbol}
            </span>
            <h3>{service.name}</h3>
            <p>{service.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ── Download Section ─────────────────────────────────────── */
function DownloadSection() {
  const screenshots = [
    {
      src: '/screen1.png',
      alt: 'Datadlue App Dashboard Screenshot',
      title: 'Real-Time Farm Dashboard',
      description: 'Monitor soil moisture, weather data, and yield forecasts instantly.'
    },
    {
      src: '/screen2.png',
      alt: 'Datadlue App Commodity Market Prices Screenshot',
      title: 'Live Commodity Market Prices',
      description: 'Track daily commodity price trends across Nigeria and make profitable decisions.'
    },
    {
      src: '/screen3.png',
      alt: 'Datadlue App AI Crop Insights Screenshot',
      title: 'AI Health & Risk Assessment',
      description: 'Scan leaves to identify crop diseases early and receive actionable recommendations.'
    }
  ];

  const [activeScreen, setActiveScreen] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveScreen((prev) => (prev + 1) % screenshots.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [screenshots.length]);

  return (
    <section className="section download-section" data-reveal aria-labelledby="download-heading">
      <div className="download-grid">
        <div className="download-info">
          <p className="eyebrow">Mobile Application</p>
          <h2 id="download-heading" className="section-title">
            Datadlue AI Agriculture App
          </h2>
          <p className="download-desc">
            Put precision agriculture, smart crop intelligence, and live market pricing indices in your pocket. Built specifically to empower local farmers and cooperatives across Nigeria, even with low network connectivity.
          </p>

          <div className="app-stats-grid">
            <div className="app-stat-card">
              <span className="app-stat-num">500+</span>
              <span className="app-stat-label">Active Farmers</span>
            </div>
            <div className="app-stat-card">
              <span className="app-stat-num">4.8★</span>
              <span className="app-stat-label">User Rating</span>
            </div>
            <div className="app-stat-card">
              <span className="app-stat-num">98%</span>
              <span className="app-stat-label">Offline Access</span>
            </div>
          </div>

          <div className="download-actions-wrap">
            <a
              href="/app-release.apk"
              download="Datadlue-Agri-App.apk"
              className="btn btn-primary btn-download"
            >
              <span className="btn-icon">📥</span>
              <div className="btn-text-wrap">
                <span className="btn-subtext">Download for Android</span>
                <strong className="btn-maintext">Download Our App</strong>
              </div>
            </a>
            
            <div className="apk-metadata">
              <span>Android APK v1.0.4</span>
              <span>•</span>
              <span>Size: 5.7 MB</span>
            </div>
          </div>

          {/* QR Code Container with Animation */}
          <div className="qr-container-wrap">
            <div className="qr-box">
              <div className="qr-laser-scanner" />
              {/* Decorative corners */}
              <div className="qr-corner qr-top-left" />
              <div className="qr-corner qr-top-right" />
              <div className="qr-corner qr-bottom-left" />
              <div className="qr-corner qr-bottom-right" />
              
              {/* CSS Mock QR Code Grid */}
              <div className="qr-mock-code">
                {/* 3 standard positioning squares in corners */}
                <div className="qr-pos-square qr-pos-tl"><div className="qr-pos-inner" /></div>
                <div className="qr-pos-square qr-pos-tr"><div className="qr-pos-inner" /></div>
                <div className="qr-pos-square qr-pos-bl"><div className="qr-pos-inner" /></div>
                
                {/* Small random data pattern layout */}
                <div className="qr-dots-matrix">
                  {Array.from({ length: 49 }).map((_, i) => (
                    <span 
                      key={i} 
                      className="qr-matrix-dot" 
                      style={{ 
                        opacity: Math.random() > 0.45 ? 1 : 0.15,
                        backgroundColor: Math.random() > 0.6 ? 'var(--clr-primary)' : 'var(--clr-accent)' 
                      }} 
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="qr-text">
              <strong>Scan to download</strong>
              <span>Point your smartphone camera to download the APK instantly</span>
            </div>
          </div>
        </div>

        {/* Right side: Interactive app screenshot mockup */}
        <div className="download-visual">
          <div className="phone-mockup-wrapper">
            <div className="phone-outer-shell">
              <div className="phone-screen-container">
                <div className="phone-speaker-camera" />
                <div className="phone-screen-slider">
                  {screenshots.map((screen, idx) => (
                    <div 
                      key={idx} 
                      className={`phone-slide ${idx === activeScreen ? 'active' : ''}`}
                    >
                      <img src={screen.src} alt={screen.alt} className="phone-screenshot-img" />
                      <div className="phone-slide-caption">
                        <h4>{screen.title}</h4>
                        <p>{screen.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Slider Controls */}
            <div className="phone-slider-controls">
              <button 
                type="button" 
                className="slider-nav-btn" 
                onClick={() => setActiveScreen((prev) => (prev - 1 + screenshots.length) % screenshots.length)}
                aria-label="Previous screenshot"
              >
                ←
              </button>
              <div className="phone-slider-dots">
                {screenshots.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`phone-dot ${idx === activeScreen ? 'active' : ''}`}
                    onClick={() => setActiveScreen(idx)}
                    aria-label={`Go to screenshot ${idx + 1}`}
                  />
                ))}
              </div>
              <button 
                type="button" 
                className="slider-nav-btn" 
                onClick={() => setActiveScreen((prev) => (prev + 1) % screenshots.length)}
                aria-label="Next screenshot"
              >
                →
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Contact Band ─────────────────────────────────────────── */
function ContactBand() {
  return (
    <section className="contact-band" data-reveal aria-labelledby="contact-heading">
      <p className="eyebrow">Ready to build</p>
      <h2 id="contact-heading">
        Let&apos;s create a smarter digital future together.
      </h2>
      <p>
        Whether you have a bold idea, a real problem to solve, or just want to
        explore what&apos;s possible — we&apos;re ready to talk.
      </p>
      <div className="contact-links">
        <a
          id="contact-email"
          className="contact-link"
          href={`mailto:${company.email}`}
        >
          ✉ {company.email}
        </a>
        <a
          id="contact-phone"
          className="contact-link"
          href={`tel:${company.phone.replace(/\s+/g, '')}`}
        >
          📞 {company.phone}
        </a>
        <a
          id="contact-whatsapp"
          className="contact-link"
          href="https://wa.me/2348103757754"
          target="_blank"
          rel="noreferrer"
        >
          💬 WhatsApp
        </a>
      </div>
    </section>
  );
}

/* =========================================================== */
/*  ABOUT PAGE                                                  */
/* =========================================================== */
function AboutPage() {
  return (
    <>
      <div className="page-hero" data-reveal>
        <p className="eyebrow">About Datadlue Labs</p>
        <h1>
          We build futuristic technology with{' '}
          <span className="gradient-text">real-world usefulness.</span>
        </h1>
        <p>
          Datadlue Labs exists at the intersection of AI, agriculture, and
          economic empowerment. Our work focuses on elegant digital systems that
          help ambitious teams do more with less friction.
        </p>
      </div>

      {/* Stats band */}
      <div className="about-stats" data-reveal>
        <div className="about-stat">
          <span className="stat-val">AI</span>
          <span className="stat-label">First approach</span>
        </div>
        <div className="about-stat">
          <span className="stat-val">3+</span>
          <span className="stat-label">Core domains</span>
        </div>
        <div className="about-stat">
          <span className="stat-val">🇳🇬</span>
          <span className="stat-label">Built for Nigeria</span>
        </div>
      </div>

      <div className="story-grid" data-reveal>
        <article className="panel-card" data-reveal data-delay="1">
          <h2>Company story</h2>
          <p>
            We started with a simple conviction: technology for Nigeria should
            not feel generic. It should feel context-aware, premium, and capable
            of solving the day-to-day problems that shape business and community
            growth. Every line of code we write carries that intention.
          </p>
        </article>

        <article className="panel-card" data-reveal data-delay="2">
          <h2>Our mission</h2>
          <p>
            To connect data, agriculture, and innovation through
            high-performance digital products that empower people, create
            opportunity, and unlock smarter futures for communities across
            Nigeria and beyond.
          </p>
        </article>

        <article className="panel-card" data-reveal data-delay="3">
          <h2>Team highlights</h2>
          <ul className="list-chips">
            {team.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="panel-card" data-reveal data-delay="4">
          <h2>Awards &amp; strengths</h2>
          <ul className="list-chips">
            {awards.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </div>

      <ContactBand />
    </>
  );
}

/* =========================================================== */
/*  BLOG INDEX                                                  */
/* =========================================================== */
function BlogIndex() {
  return (
    <>
      <div className="page-hero" data-reveal>
        <p className="eyebrow">Blog</p>
        <h1>
          Thoughts, build notes &amp;{' '}
          <span className="gradient-text">future-focused insights.</span>
        </h1>
        <p>
          Select any article below to open a full read with its own route and
          unique content.
        </p>
      </div>

      <section
        className="blog-list"
        data-reveal
        aria-label="Blog articles list"
      >
        {blogPosts.map((post, idx) => (
          <Link
            key={post.slug}
            id={`blog-item-${idx}`}
            to={`/blog/${post.slug}`}
            className="blog-row"
          >
            <div>
              <h2>{post.title}</h2>
              <p>{post.excerpt}</p>
            </div>
            <div className="blog-meta">
              <span className="blog-time">{post.readingTime}</span>
              <span className="blog-time">{post.date}</span>
              <span className="blog-arrow" aria-hidden="true">→</span>
            </div>
          </Link>
        ))}
      </section>
    </>
  );
}

/* =========================================================== */
/*  BLOG POST                                                   */
/* =========================================================== */
function BlogPost() {
  const { slug } = useParams();
  const post = useMemo(
    () => blogPosts.find((p) => p.slug === slug),
    [slug]
  );

  if (!post) {
    return (
      <div className="page-hero" data-reveal>
        <p className="eyebrow">Blog</p>
        <h1>Post not found.</h1>
        <Link className="btn btn-secondary" to="/blog" style={{ marginTop: 24 }}>
          ← Return to blog
        </Link>
      </div>
    );
  }

  return (
    <article className="blog-article" data-reveal>
      <Link className="back-link" to="/blog" id="blog-back-link">
        Back to blog
      </Link>
      <p className="eyebrow">{post.readingTime} · {post.date}</p>
      <h1>{post.title}</h1>
      <div className="article-body">
        {post.body.map((para, idx) => (
          <p key={idx}>{para}</p>
        ))}
      </div>
    </article>
  );
}

/* =========================================================== */
/*  FOOTER                                                      */
/* =========================================================== */
function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer" role="contentinfo">
      <div className="footer-inner">
        <div className="footer-brand">
          <img
            src="/logo.png"
            alt="Datadlue Labs"
            style={{ width: 48, height: 48, borderRadius: 10, marginBottom: 16, boxShadow: '0 0 20px rgba(0,212,255,0.3)' }}
          />
          <strong>{company.name}</strong>
          <p>{company.tagline}</p>
        </div>

        <div className="footer-col">
          <h4>Navigation</h4>
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
          <Link to="/blog">Blog</Link>
        </div>

        <div className="footer-col">
          <h4>Contact</h4>
          <a href={`mailto:${company.email}`}>{company.email}</a>
          <a href={`tel:${company.phone.replace(/\s+/g, '')}`}>{company.phone}</a>
          <a
            href="https://wa.me/2348103757754"
            target="_blank"
            rel="noreferrer"
          >
            WhatsApp: {company.whatsapp}
          </a>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {year} {company.name}. All rights reserved.</p>
        <a href={`mailto:${company.email}`}>Build with us →</a>
      </div>
    </footer>
  );
}

export default App;
