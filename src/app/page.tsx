"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import Link from "next/link";
import { Shield, TrendingDown, Headset, Settings } from "lucide-react";

export default function Index() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="h-screen bg-background text-foreground p-4 flex items-center justify-center bg-gradient-to-b from-black to-muted">
      <div className="max-w-3xl w-full relative">
        <div className="absolute inset-0 bg-primary/5 blur-[100px] rounded-full animate-float" />
        
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-center mb-8 relative z-10"
        >
          <h1 className="text-3xl md:text-5xl font-bold mb-3 animate-glow tracking-tight">
            decide.io
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm max-w-md mx-auto">
            Simulate critical scenarios. Make impactful decisions. Handle the consequences.
          </p>
        </motion.div>
        
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto relative"
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div variants={itemVariants}>
                <Card className="group relative p-6 text-left transition-all hover:bg-accent/10">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg" />
                  <Shield className="w-8 h-8 mb-3 text-primary" />
                  <h2 className="text-lg font-bold mb-2">Nuclear Crisis</h2>
                  <p className="text-xs text-muted-foreground">
                    Lead the nation through an imminent nuclear threat. Every second counts.
                  </p>
                  <Button asChild variant="ghost" className="mt-4 w-full">
                    <Link href="/scenarios/nuclear-crisis">
                      Start Simulation
                    </Link>
                  </Button>
                </Card>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>National security crisis simulation</p>
            </TooltipContent>
          </Tooltip>

          <motion.div variants={itemVariants}>
            <Card className="group relative p-6 text-left transition-all hover:bg-accent/10">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg" />
              <TrendingDown className="w-8 h-8 mb-3 text-secondary" />
              <h2 className="text-lg font-bold mb-2">Black Monday</h2>
              <p className="text-xs text-muted-foreground">
                Navigate a devastating market crash. Make decisions to stabilize the economy.
              </p>
              <Button variant="ghost" className="mt-4 w-full" disabled>
                Coming Soon
              </Button>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="group relative p-6 text-left transition-all hover:bg-accent/10">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg" />
              <Headset className="w-8 h-8 mb-3 text-blue-500" />
              <h2 className="text-lg font-bold mb-2">Emergency Call Center</h2>
              <p className="text-xs text-muted-foreground">
                Manage critical emergency calls. Coordinate response teams effectively.
              </p>
              <Button variant="ghost" className="mt-4 w-full" disabled>
                Coming Soon
              </Button>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="group relative p-6 text-left transition-all hover:bg-accent/10">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg" />
              <Settings className="w-8 h-8 mb-3 text-purple-500" />
              <h2 className="text-lg font-bold mb-2">Custom Scenario</h2>
              <p className="text-xs text-muted-foreground">
                Create your own crisis scenario. Define the parameters and challenges.
              </p>
              <Button variant="ghost" className="mt-4 w-full" disabled>
                Coming Soon
              </Button>
            </Card>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="text-center mt-8 text-muted-foreground text-xs"
        >
          Select a scenario to begin the simulation
        </motion.div>
      </div>
    </div>
  );
}
