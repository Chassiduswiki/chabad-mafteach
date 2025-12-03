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
        // Generate random letters with random positions
        const count = 35; // Increased density
        const newLetters = Array.from({ length: count }, (_, i) => {
            // Tunnel logic: Spawn on left (0-25%) or right (75-100%) - kept wider to avoid center
            const isLeft = Math.random() > 0.5;
            const startX = isLeft
                ? Math.random() * 25 // 0-25%
                : Math.random() * 25 + 75; // 75-100%

            // Move inwards but not too far (avoid overlap)
            const targetX = isLeft
                ? startX + (Math.random() * 15 + 5) // Move right 5-20%
                : startX - (Math.random() * 15 + 5); // Move left 5-20%

            return {
                id: i,
                char: PURE_HEBREW_LETTERS[Math.floor(Math.random() * PURE_HEBREW_LETTERS.length)],
                x: startX,
                targetX,
                y: Math.random() * 100, // %
                size: Math.random() * 40 + 20, // 20px - 60px
                duration: Math.random() * 10 + 8, // 8-18s (slightly faster)
                delay: Math.random() * 1, // 0-1s delay (immediate start)
            };
        });
        setLetters(newLetters);
    }, []);

    return (
        <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
            {letters.map((letter) => (
                <motion.div
                    key={letter.id}
                    className="absolute text-blue-500/40 font-serif select-none font-bold"
                    style={{
                        left: `${letter.x}%`,
                        top: `${letter.y}%`,
                        fontSize: `${letter.size}px`,
                        fontFamily: '"SBL Hebrew", "Frank Ruhl Libre", "David Libre", serif',
                    }}
                    initial={{ opacity: 0, y: 50, scale: 0.8, x: 0 }}
                    animate={{
                        opacity: [0, 0.7, 0], // Fade out before end
                        y: [0, -200], // Float higher
                        x: [0, (letter as any).targetX - letter.x], // Move to target X relative to start
                        scale: [0.8, 1.1],
                        rotate: [Math.random() * 10 - 5, Math.random() * 10 - 5],
                    }}
                    transition={{
                        duration: letter.duration,
                        repeat: Infinity,
                        delay: letter.delay,
                        ease: "easeInOut",
                    }}
                >
                    {letter.char}
                </motion.div>
            ))}
        </div>
    );
}
