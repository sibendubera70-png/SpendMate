import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Wallet,
  Menu,
  X,
  ArrowUpRight,
  TrendingUp,
  Receipt,
  ChartNoAxesCombined,
  ShieldCheck,
  Sparkles,
  CheckCircle,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import AnimatedSection from "../components/AnimatedSection";

function Home() {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    };

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = () => {
    navigate(user ? "/dashboard" : "/login");
    setMenuOpen(false);
  };

  const handleGetStarted = () => {
    navigate(user ? "/dashboard" : "/signup");
    setMenuOpen(false);
  };

  const features = [
    {
      icon: Receipt,
      title: "Expense Tracking",
      description:
        "Record, organize, and monitor your daily transactions with ease.",
    },
    {
      icon: ChartNoAxesCombined,
      title: "Smart Analytics",
      description:
        "Understand your spending habits through simple visual reports.",
    },
    {
      icon: ShieldCheck,
      title: "Budget Protection",
      description:
        "Set spending limits and stay on track with your financial goals.",
    },
  ];

  const navigationLinks = [
    { label: "Home", href: "#home" },
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "About", href: "#about" },
  ];

  return (
    <div className="min-h-screen overflow-hidden bg-[#061412] text-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#061412]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400 text-[#061412]">
              <Wallet size={24} strokeWidth={2.5} />
            </div>

            <span className="text-2xl font-bold tracking-tight">
              Spend<span className="text-emerald-400">Mate</span>
            </span>
          </button>

          {/* Desktop navigation */}
          <div className="hidden items-center gap-8 md:flex">
            {navigationLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm font-medium text-slate-300 transition hover:text-emerald-400"
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Desktop actions */}
          <div className="hidden items-center gap-3 md:flex">
            <button
              type="button"
              onClick={handleLogin}
              className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-medium transition hover:border-emerald-400 hover:text-emerald-400"
            >
              {user ? "Dashboard" : "Login"}
            </button>

            <button
              type="button"
              onClick={handleGetStarted}
              className="flex items-center gap-2 rounded-full bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-[#061412] transition hover:bg-emerald-300"
            >
              {user ? "Go to Dashboard" : "Get Started"}
              <ArrowUpRight size={17} />
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMenuOpen((previous) => !previous)}
            className="rounded-lg p-2 text-white transition hover:bg-white/10 md:hidden"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>

        {/* Mobile navigation */}
        {menuOpen && (
          <div className="border-t border-white/10 px-6 py-6 md:hidden">
            <div className="flex flex-col gap-5">
              {navigationLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="text-slate-300 transition hover:text-emerald-400"
                >
                  {item.label}
                </a>
              ))}

              <button
                type="button"
                onClick={handleLogin}
                className="rounded-full border border-white/20 px-5 py-3 text-center transition hover:border-emerald-400 hover:text-emerald-400"
              >
                {user ? "Dashboard" : "Login"}
              </button>

              <button
                type="button"
                onClick={handleGetStarted}
                className="rounded-full bg-emerald-400 px-5 py-3 text-center font-semibold text-[#061412] transition hover:bg-emerald-300"
              >
                {user ? "Go to Dashboard" : "Get Started"}
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero section */}
      <section
        id="home"
        className="relative mx-auto grid min-h-[88vh] max-w-7xl items-center gap-14 px-6 py-20 lg:grid-cols-2 lg:px-8"
      >
        <div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />

        <AnimatedSection className="relative">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-300">
            <Sparkles size={16} />
            Smart finance management
          </div>

          <h1 className="text-5xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
            Take Control of
            <span className="block text-emerald-400">Your Finances</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-400">
            Track expenses, manage budgets, and make smarter financial
            decisions with a simple and powerful personal finance companion.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <button
              type="button"
              onClick={handleGetStarted}
              className="flex items-center gap-2 rounded-full bg-emerald-400 px-7 py-3.5 font-semibold text-[#061412] transition hover:bg-emerald-300"
            >
              {user ? "Open Dashboard" : "Start Managing Money"}
              <ArrowUpRight size={19} />
            </button>

            <a
              href="#features"
              className="rounded-full border border-white/20 px-7 py-3.5 font-semibold transition hover:border-emerald-400 hover:text-emerald-400"
            >
              Explore Features
            </a>
          </div>

          <div className="mt-10 flex flex-wrap gap-6 text-sm text-slate-400">
            <span className="flex items-center gap-2">
              <CheckCircle size={17} className="text-emerald-400" />
              Easy to use
            </span>

            <span className="flex items-center gap-2">
              <CheckCircle size={17} className="text-emerald-400" />
              Secure tracking
            </span>
          </div>
        </AnimatedSection>

        {/* Dashboard preview */}
        <AnimatedSection className="relative">
          <div className="rounded-[2rem] border border-emerald-400/20 bg-white/[0.04] p-3 shadow-2xl shadow-emerald-950/40">
            <div className="rounded-3xl bg-[#0c211d] p-6 sm:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Total Balance</p>
                  <h2 className="mt-2 text-4xl font-bold">₹85,420</h2>
                </div>

                <div className="rounded-2xl bg-emerald-400/10 p-3 text-emerald-400">
                  <Wallet size={28} />
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 text-sm text-emerald-400">
                <TrendingUp size={17} />
                12.5% this month
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-sm text-slate-400">Income</p>
                  <p className="mt-2 text-xl font-semibold text-emerald-400">
                    ₹52,000
                  </p>
                </div>

                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-sm text-slate-400">Expenses</p>
                  <p className="mt-2 text-xl font-semibold text-red-400">
                    ₹24,580
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl bg-white/5 p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-400">Monthly Spending</p>
                  <ChartNoAxesCombined
                    size={19}
                    className="text-emerald-400"
                  />
                </div>

                <div className="mt-6 flex h-36 items-end gap-3">
                  {[42, 68, 48, 88, 58, 96, 72].map((height, index) => (
                    <div
                      key={index}
                      className="flex-1 rounded-t-lg bg-emerald-400 transition hover:bg-emerald-300"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>

                <div className="mt-3 flex justify-between text-xs text-slate-500">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                    (day) => (
                      <span key={day}>{day}</span>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <AnimatedSection className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">
              Powerful features
            </p>

            <h2 className="mt-4 text-4xl font-bold sm:text-5xl">
              Everything You Need to Manage Money
            </h2>

            <p className="mt-5 text-slate-400">
              Make better financial decisions with tools designed for your
              everyday needs.
            </p>
          </AnimatedSection>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <AnimatedSection key={feature.title}>
                  <div className="h-full rounded-3xl border border-white/10 bg-white/[0.04] p-8 transition duration-300 hover:-translate-y-2 hover:border-emerald-400/40">
                    <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-400">
                      <Icon size={28} />
                    </div>

                    <h3 className="text-2xl font-semibold">
                      {feature.title}
                    </h3>

                    <p className="mt-4 leading-relaxed text-slate-400">
                      {feature.description}
                    </p>
                  </div>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="px-6 py-24 lg:px-8">
        <AnimatedSection className="mx-auto max-w-4xl rounded-3xl border border-emerald-400/20 bg-emerald-400/[0.06] p-8 text-center sm:p-14">
          <Sparkles className="mx-auto text-emerald-400" size={36} />

          <h2 className="mt-5 text-4xl font-bold">
            Your financial journey starts here
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-slate-400">
            Add your transactions, set your budget, and understand your
            spending patterns—all from one simple dashboard.
          </p>

          <button
            type="button"
            onClick={handleGetStarted}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-emerald-400 px-7 py-3.5 font-semibold text-[#061412] transition hover:bg-emerald-300"
          >
            {user ? "Go to Dashboard" : "Get Started"}
            <ArrowUpRight size={18} />
          </button>
        </AnimatedSection>
      </section>

      {/* Footer */}
      <footer id="about" className="border-t border-white/10 px-6 py-10 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2 text-2xl font-bold">
              <Wallet className="text-emerald-400" />
              Spend<span className="text-emerald-400">Mate</span>
            </div>

            <p className="mt-2 text-sm text-slate-500">
              Your smarter personal finance companion.
            </p>
          </div>

          <div className="flex flex-wrap gap-5 text-sm text-slate-400">
            <a href="#home" className="transition hover:text-emerald-400">
              Home
            </a>
            <a
              href="#features"
              className="transition hover:text-emerald-400"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="transition hover:text-emerald-400"
            >
              How It Works
            </a>
            <button
              type="button"
              onClick={handleLogin}
              className="transition hover:text-emerald-400"
            >
              {user ? "Dashboard" : "Login"}
            </button>
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-7xl border-t border-white/10 pt-6 text-center text-sm text-slate-500">
          © 2026 SpendMate. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export default Home;