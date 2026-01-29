'use client';

import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FileText, Link2, Settings } from 'lucide-react';
import { NewTopicEditorTab } from './hooks/useTopicEditorState';

interface TopicEditorTabsProps {
  activeTab: NewTopicEditorTab;
  onTabChange: (tab: NewTopicEditorTab) => void;
  editContent: React.ReactNode;
  connectionsContent: React.ReactNode;
  scholarlyContent: React.ReactNode;
  settingsContent: React.ReactNode;
}

export function TopicEditorTabs({
  activeTab,
  onTabChange,
  editContent,
  connectionsContent,
  scholarlyContent,
  settingsContent,
}: TopicEditorTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as NewTopicEditorTab)}>
      <TabsList className="w-full justify-start border-b border-border bg-transparent p-0 h-auto">
        <TabsTrigger
          value="edit"
          className="flex items-center gap-2 px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
        >
          <FileText className="h-4 w-4" />
          Edit
        </TabsTrigger>
        <TabsTrigger
          value="connections"
          className="flex items-center gap-2 px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
        >
          <Link2 className="h-4 w-4" />
          Connections
        </TabsTrigger>
        <TabsTrigger
          value="scholarly"
          className="flex items-center gap-2 px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
        >
          <span className="h-4 w-4 flex items-center justify-center font-serif font-bold text-xs">S</span>
          Scholarly
        </TabsTrigger>
        <TabsTrigger
          value="settings"
          className="flex items-center gap-2 px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
        >
          <Settings className="h-4 w-4" />
          Settings
        </TabsTrigger>
      </TabsList>

      <TabsContent value="edit" className="mt-6">
        {editContent}
      </TabsContent>

      <TabsContent value="connections" className="mt-6">
        {connectionsContent}
      </TabsContent>

      <TabsContent value="scholarly" className="mt-6">
        {scholarlyContent}
      </TabsContent>

      <TabsContent value="settings" className="mt-6">
        {settingsContent}
      </TabsContent>
    </Tabs>
  );
}

export default TopicEditorTabs;
