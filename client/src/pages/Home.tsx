import { useGreetings } from "@/hooks/use-greetings";
import { motion } from "framer-motion";

export default function Home() {
  const { data: greetings, isLoading, error } = useGreetings();
  
  // Default message if API fails or returns empty
  const greetingMessage = !isLoading && greetings && greetings.length > 0 
    ? greetings[0].message 
    : "Hello World";

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background p-6">
      
      {/* Decorative refined background element */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0"
           style={{
             backgroundImage: `radial-gradient(circle at 50% 50%, currentColor 1px, transparent 1px)`,
             backgroundSize: '40px 40px'
           }}
      />

      <main className="relative z-10 max-w-4xl w-full text-center">
        {isLoading ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
            <p className="text-sm text-muted-foreground font-medium tracking-wide uppercase">Loading...</p>
          </div>
        ) : error ? (
           <motion.div 
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             className="text-center space-y-2"
           >
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-semibold tracking-tight text-foreground leading-none">
              Hello World
            </h1>
            <p className="text-muted-foreground mt-4 font-light italic">
              (Unable to connect to greeting service, showing default)
            </p>
           </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-8"
          >
            <span className="inline-block px-4 py-1.5 rounded-full border border-border bg-secondary/50 text-xs font-medium tracking-widest uppercase text-muted-foreground mb-4 backdrop-blur-sm">
              Welcome
            </span>
            
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-semibold tracking-tighter text-foreground leading-[0.9]">
              {greetingMessage}
            </h1>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-lg md:text-xl text-muted-foreground font-light max-w-lg mx-auto leading-relaxed"
            >
              A clean, minimal starting point for your next big idea.
              Crafted with precision and simplicity in mind.
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="pt-12"
            >
              <button 
                className="group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-full bg-primary px-8 font-medium text-primary-foreground transition-all duration-300 hover:w-40 hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-95"
                onClick={() => console.log("Explore clicked")}
              >
                <span className="mr-0 transition-all duration-300 group-hover:mr-2">Explore</span>
                <span className="opacity-0 transition-all duration-300 group-hover:opacity-100">→</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </main>

      <footer className="fixed bottom-6 left-0 right-0 text-center">
        <p className="text-xs text-muted-foreground/50 font-mono">
          DESIGNED FOR EXCELLENCE
        </p>
      </footer>
    </div>
  );
}
