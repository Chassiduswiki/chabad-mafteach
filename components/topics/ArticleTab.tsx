'use client';

import React from 'react';
import { ArticleReader } from './ArticleReader';

interface ArticleTabProps {
  topic: {
    id: number;
    canonical_title: string;
    slug: string;
    name: string;
    paragraphs: any[];
  };
}

const ArticleTab = ({ topic }: ArticleTabProps) => {
  const hasContent = topic.paragraphs && topic.paragraphs.length > 0;

  if (!hasContent) {
    return (
      <div className="article-tab">
        <div>Article in Development</div>
        <div>While we build the full article, explore related content:</div>
      </div>
    );
  }

  return (
    <div className="article-tab">
      <ArticleReader
        contentBlocks={topic.paragraphs}
        topicsInArticle={[]}
        sources={[]}
        articleTitle={topic.canonical_title}
      />
    </div>
  );
};

export default ArticleTab;
