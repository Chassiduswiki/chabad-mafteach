"use client";

import OverviewTab from "./OverviewTab";
import { Topic } from "@/lib/types";

interface TopicTabsProps {
    topic: Topic;
}

export default function TopicTabs({ topic }: TopicTabsProps) {
    return (
        <div>
            <OverviewTab topic={topic} />
        </div>
    );
}
