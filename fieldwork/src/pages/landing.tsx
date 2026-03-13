import { Link } from "wouter";
import { motion } from "framer-motion";
import { Hexagon, ArrowRight, TicketCheck, TrendingUp, Wallet, ChevronRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: TicketCheck,
    title: "Real Work Tickets",
    description: "Students complete genuine workplace tasks — not quizzes. Each ticket mirrors an actual job scenario from a real employer.",
    color: "bg-blue-100 text-blue-600",
  },
  {
    icon: TrendingUp,
    title: "Progress-Based Refunds",
    description: "Pay a small platform fee, earn it back as you go. Complete 100% of a course and get your full fee refunded.",
    color: "bg-emerald-100 text-emerald-600",
  },
  {
    icon: Wallet,
    title: "Verified by Companies",
    description: "Every course is built with an industry partner. Your completion record is visible proof of work — not just a certificate.",
    color: "bg-purple-100 text-purple-600",
  },
];

const testimonials = [
  { name: "Amara Osei", role: "Cloud Engineering Intern, AWS", quote: "I landed my internship by showing my Fieldwork ticket history. No other platform gave me that." },
  { name: "Brian Otieno", role: "Junior Data Analyst, Microsoft", quote: "The refund model pushed me to actually finish. I got 70% back and a job offer." },
  { name: "Wanjiru Karimi", role: "Product Analyst, Safaricom", quote: "Real tickets from real companies. It felt like working before I even had a job." },
];

const personas = [
  { label: "Students", description: "Build a real portfolio of completed work", accent: "bg-blue-500" },
  { label: "Instructors", description: "Earn by teaching what you do every day", accent: "bg-emerald-500" },
  { label: "Companies", description: "Find graduates who've already done the job", accent: "bg-purple-500" },
];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 260, damping: 22 } } };

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
              <Hexagon className="w-5 h-5 fill-current" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight text-slate-900">Fieldwork</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-slate-600 hover:text-slate-900 font-medium">
                Log in
              </Button>
            </Link>
            <Link href="/login">
              <Button className="font-semibold shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all">
                Get started <ArrowRight className="ml-1.5 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-36 pb-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-primary/8 to-transparent rounded-full blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 font-semibold px-4 py-1.5 text-sm">
              Real work. Real proof.
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-display text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] text-slate-900"
          >
            The platform where<br />
            <span className="text-primary">students do the work</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed"
          >
            Fieldwork replaces video lectures with real job tickets. Complete actual workplace tasks, earn back your fees as you progress, and build a portfolio companies can verify.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/login">
              <Button size="lg" className="h-13 px-8 text-base font-semibold shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 transition-all w-full sm:w-auto">
                Create free account <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="h-13 px-8 text-base font-medium border-slate-200 hover:bg-slate-50 w-full sm:w-auto">
                Sign in to your portal
              </Button>
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-5 text-sm text-slate-400"
          >
            1,284 students enrolled · 14,760 tickets completed · 18 live courses
          </motion.p>
        </div>
      </section>

      {/* Who it's for */}
      <section className="py-16 px-6 bg-slate-50 border-y border-slate-100">
        <div className="max-w-4xl mx-auto">
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6"
          >
            {personas.map(p => (
              <motion.div key={p.label} variants={item} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-4">
                <div className={`w-2 h-10 rounded-full ${p.accent}`} />
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">{p.label}</h3>
                  <p className="text-sm text-slate-500 mt-0.5">{p.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-4xl font-bold text-slate-900">Why Fieldwork works</h2>
            <p className="text-slate-500 mt-3 text-lg max-w-xl mx-auto">Built around one idea: the best way to show you can do a job is to actually do it.</p>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {features.map(f => (
              <motion.div key={f.title} variants={item} className="p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow bg-white">
                <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center mb-5`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-xl text-slate-900 mb-3">{f.title}</h3>
                <p className="text-slate-500 leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats banner */}
      <section className="py-16 px-6 bg-primary">
        <div className="max-w-4xl mx-auto">
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
          >
            {[
              { value: "1,284", label: "Students enrolled" },
              { value: "18", label: "Live courses" },
              { value: "14,760", label: "Tickets completed" },
              { value: "KES 61K", label: "Refunded to students" },
            ].map(s => (
              <motion.div key={s.label} variants={item}>
                <p className="text-4xl font-display font-bold text-white">{s.value}</p>
                <p className="text-primary-foreground/70 mt-1 text-sm font-medium">{s.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-4xl font-bold text-slate-900">From students who got hired</h2>
          </motion.div>
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {testimonials.map(t => (
              <motion.div key={t.name} variants={item} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-slate-700 leading-relaxed flex-1">"{t.quote}"</p>
                <div>
                  <p className="font-bold text-slate-900 text-sm">{t.name}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-slate-900 mb-5">
              Ready to do real work?
            </h2>
            <p className="text-slate-500 text-lg mb-10">
              Join thousands of students building portfolios that prove what they can do — not just what they've watched.
            </p>
            <Link href="/login">
              <Button size="lg" className="h-14 px-10 text-base font-semibold shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 transition-all">
                Get started for free <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <p className="text-sm text-slate-400 mt-4">No credit card required. Any password works in demo mode.</p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center text-primary-foreground">
              <Hexagon className="w-4 h-4 fill-current" />
            </div>
            <span className="font-display font-bold text-slate-900">Fieldwork</span>
            <span className="text-slate-300 ml-2 text-sm">© 2026</span>
          </div>
          <p className="text-sm text-slate-400">Real work. Real proof.</p>
        </div>
      </footer>

    </div>
  );
}
