"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, HTMLMotionProps, motion } from "framer-motion";

import { cn } from "@/lib/utils";

interface WordRotateProps {
    words: string[];
    duration?: number;
    framerProps?: HTMLMotionProps<"div">;
    className?: string;
}

export function WordRotate({
    words,
    duration = 2500,
    framerProps = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 },
        transition: { duration: 0.3, ease: "easeOut" },
    },
    className,
}: WordRotateProps) {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (!words || words.length === 0) return;
        
        const interval = setInterval(() => {
            setIndex((prevIndex) => (prevIndex + 1) % words.length);
        }, duration);

        return () => clearInterval(interval);
    }, [words, duration]);

    if (!words || words.length === 0) return null;

    return (
        <div className="relative overflow-hidden py-1">
            <AnimatePresence mode="wait">
                <motion.div
                    key={words[index]}
                    className={cn(className)}
                    {...framerProps}
                >
                    {words[index]}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
