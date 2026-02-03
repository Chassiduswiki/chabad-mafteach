'use client';

import React from 'react';

interface ArticleReaderProps {
  contentBlocks: any;
  topicsInArticle: any[];
  sources: any[];
  articleTitle: string;
}

export const ArticleReader = ({ contentBlocks, topicsInArticle, sources, articleTitle }: ArticleReaderProps) => {
  return (
    <div className="article-reader">
      <h2>{articleTitle}</h2>
      <div>Article Reader Component</div>
    </div>
  );
};
