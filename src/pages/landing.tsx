import { Link } from "wouter";
import { motion } from "framer-motion";
import { Hexagon, ArrowRight, Code, Terminal, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Terminal,
    title: "Interactive Coding",
    description: "Write code, run it, and get instant feedback in your browser.",
  },
  {
    icon: Code,
    title: "Real-world Scenarios",
    description: "Build projects that mimic actual job situations.",
  },
  {
    icon: Briefcase,
    title: "Career Ready",
    description: "Develop a tangible portfolio you can show employers.",
  },
];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 260, damping: 22 } } };

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 flex items-center justify-center text-primary">
              <Hexagon className="w-6 h-6 fill-current" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-foreground">Fieldwork</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-foreground hover:bg-secondary font-bold hidden sm:inline-flex">
                Log In
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="font-bold bg-primary text-primary-foreground hover:bg-primary/90 border-b-4 border-primary/50 translate-y-[-2px] hover:translate-y-[0px] hover:border-b-0 transition-all rounded-sm px-6">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-20 px-6 relative flex flex-col items-center justify-center min-h-[80vh]">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="font-display text-6xl md:text-8xl font-bold tracking-tight leading-none text-foreground mb-6"
          >
            Learn by <span className="text-primary underline decoration-primary decoration-4 underline-offset-[12px]">doing.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mt-6 text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-tight"
          >
            Master tech skills through real-world scenarios. No fluff, just code.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/signup">
              <Button size="lg" className="h-14 px-8 text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-sm w-full sm:w-auto shadow-[4px_4px_0px_0px_rgba(255,211,0,0.3)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
                Start Coding for Free <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
        
        {/* Decorative Grid Background Elements */}
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </section>

      {/* Features */}
      <section className="py-24 px-6 bg-card border-y border-border">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {features.map(f => (
              <motion.div key={f.title} variants={item} className="p-8 rounded-sm border-2 border-border shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] bg-background">
                <div className="w-12 h-12 rounded-sm bg-primary/20 text-primary flex items-center justify-center mb-6">
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-2xl text-foreground mb-3">{f.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-lg">{f.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Hexagon className="w-5 h-5 text-primary fill-current" />
            <span className="font-display font-bold text-foreground">Fieldwork</span>
          </div>
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Fieldwork. Learn by doing.</p>
        </div>
      </footer>

    </div>
  );
}
