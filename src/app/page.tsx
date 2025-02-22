"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Shield, TrendingDown, Headset, Settings } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
    <div className="h-screen bg-crisis-dark text-crisis-light p-4 flex items-center justify-center bg-gradient-to-b from-black to-crisis-dark">
      <div className="max-w-3xl w-full relative">
        <div className="absolute inset-0 bg-crisis-red/5 blur-[100px] rounded-full animate-float" />

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
                <Link href="/scenarios/nuclear-crisis">
                  <Card className="group relative p-6 text-left crisis-button glass-panel cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-r from-crisis-red/20 to-crisis-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
                  <Shield className="w-8 h-8 mb-3 text-crisis-red" />
                  <h2 className="text-lg font-bold mb-2">Nuclear Crisis</h2>
                  <p className="text-xs text-muted-foreground">
                    Lead the nation through an imminent nuclear threat. Every second counts.
                  </p>
                  </Card>
                </Link>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>National security crisis simulation</p>
            </TooltipContent>
          </Tooltip>

          <motion.div variants={itemVariants}>
            <Link href="/scenarios/market-crisis">
              <Card className="group relative p-6 text-left crisis-button glass-panel cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-yellow-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
              <TrendingDown className="w-8 h-8 mb-3 text-orange-500" />
              <h2 className="text-lg font-bold mb-2">Black Monday</h2>
              <p className="text-xs text-muted-foreground">
                Navigate a devastating market crash. Make decisions to stabilize the economy.
              </p>
              </Card>
            </Link>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Link href="/scenarios/emergency-center">
              <Card className="group relative p-6 text-left crisis-button glass-panel cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
              <Headset className="w-8 h-8 mb-3 text-blue-500" />
              <h2 className="text-lg font-bold mb-2">Emergency Call Center</h2>
              <p className="text-xs text-muted-foreground">
                Manage critical emergency calls. Coordinate response teams effectively.
              </p>
              </Card>
            </Link>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Link href="/scenarios/custom">
              <Card className="group relative p-6 text-left crisis-button glass-panel cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
              <Settings className="w-8 h-8 mb-3 text-purple-500" />
              <h2 className="text-lg font-bold mb-2">Custom Scenario</h2>
              <p className="text-xs text-muted-foreground">
                Create your own crisis scenario. Define the parameters and challenges.
              </p>
              </Card>
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="text-center mt-8 text-muted-foreground/80 text-xs"
        >
          Select a scenario to begin the simulation
        </motion.div>
      </div>
    </div>
  );
}
