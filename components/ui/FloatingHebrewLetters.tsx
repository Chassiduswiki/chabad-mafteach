"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FloatingHebrewLettersProps {
    className?: string;
}

const HEBREW_LETTERS = [
    "א", "ב", "ג", "ד", "ה", "ו", "z", "ח", "ט", "י", "כ", "ל", "מ", "נ", "s", "ע", "פ", "צ", "ק", "r", "ש", "ת"
];

// Correcting the array to be pure Hebrew letters for the visual
const PURE_HEBREW_LETTERS = [
    "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט", "י", "כ", "ל", "מ", "נ", "ס", "ע", "פ", "צ", "ק", "ר", "ש", "ת"
];

export function FloatingHebrewLetters({ className }: FloatingHebrewLettersProps) {
    const [letters, setLetters] = useState<{ id: number; char: string; x: number; targetX: number; y: number; size: number; duration: number; delay: number }[]>([]);

    useEffect(() => {
        // Generate random letters spawning from top 1/3 (search bar area)
        const count = 35;
        const newLetters = Array.from({ length: count }, (_, i) => {
            // Spawn from left (0-30%) or right (70-100%) sides
            const isLeft = Math.random() > 0.5;
            const startX = isLeft
                ? Math.random() * 30 // 0-30%
                : Math.random() * 30 + 70; // 70-100%

            // Move inwards slightly
            const targetX = isLeft
                ? startX + (Math.random() * 10 + 5) // Move right 5-15%
                : startX - (Math.random() * 10 + 5); // Move left 5-15%

            return {
                id: i,
                char: PURE_HEBREW_LETTERS[Math.floor(Math.random() * PURE_HEBREW_LETTERS.length)],
                x: startX,
                targetX,
                y: Math.random() * 33, // Spawn only in top 1/3 (0-33%)
                size: Math.random() * 35 + 18, // 18px - 53px
                duration: Math.random() * 12 + 10, // 10-22s (slower drift)
                delay: Math.random() * 2, // 0-2s staggered delay
            };
        });
        setLetters(newLetters);
    }, []);

    return (
        <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
            {letters.map((letter) => (
                <motion.div
                    key={letter.id}
                    className="absolute text-primary/30 font-serif select-none font-bold will-change-transform"
                    style={{
                        left: `${letter.x}%`,
                        top: `${letter.y}%`,
                        fontSize: `${letter.size}px`,
                        fontFamily: '"SBL Hebrew", "Frank Ruhl Libre", "David Libre", serif',
                        filter: 'blur(1.5px)',
                        WebkitFilter: 'blur(1.5px)',
                        backfaceVisibility: 'hidden',
                        transform: 'translateZ(0)',
                    }}
                    initial={{ opacity: 0, y: -20, scale: 0.9, x: 0 }}
                    animate={{
                        opacity: [0, 0.5, 0.3, 0], // Gentle fade in then out
                        y: [-20, 150, 300], // Float downward from search bar area
                        x: [0, (letter.targetX - letter.x) * 0.5], // Subtle horizontal drift
                        scale: [0.9, 1, 0.95],
                    }}
                    transition={{
                        duration: letter.duration,
                        repeat: Infinity,
                        delay: letter.delay,
                        ease: "easeOut",
                    }}
                >
                    {letter.char}
                </motion.div>
            ))}
        </div>
    );
}
