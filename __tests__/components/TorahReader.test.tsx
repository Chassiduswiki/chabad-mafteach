import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TorahReader } from '../../components/TorahReader';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('TorahReader', () => {
  const mockProps = {
    documentTitle: 'Test Sefer',
    documentType: 'book',
    sections: [
      {
        id: 1,
        title: 'Chapter 1',
        order_key: '1',
        statements: [
          {
            id: 1,
            order_key: '1',
            text: 'בראשית ברא אלהים את השמים ואת הארץ',
            topics: [{ id: 1, name: 'Creation' }],
            sources: []
          },
          {
            id: 2,
            order_key: '2',
            text: 'והארץ היתה תהו ובהו',
            topics: [],
            sources: []
          }
        ]
      }
    ],
    currentSection: 1,
    totalSections: 10,
    topicsInDocument: [{ id: 1, name: 'Creation' }],
    sources: [],
    isLoading: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render document title and section info', () => {
    render(<TorahReader {...mockProps} />);

    expect(screen.getByText('Test Sefer')).toBeInTheDocument();
    expect(screen.getByText('Section 1 of 10')).toBeInTheDocument();
  });

  it('should render statements as clickable text', () => {
    render(<TorahReader {...mockProps} />);

    const firstStatement = screen.getByText('בראשית ברא אלהים את השמים ואת הארץ');
    expect(firstStatement).toBeInTheDocument();
    expect(firstStatement).toHaveClass('cursor-pointer');
  });

  it('should show loading skeleton when isLoading is true', () => {
    render(<TorahReader {...mockProps} isLoading={true} />);

    // Should show skeleton instead of content
    expect(screen.queryByText('Test Sefer')).not.toBeInTheDocument();
  });

  it('should display topics in sidebar', () => {
    render(<TorahReader {...mockProps} />);

    expect(screen.getByText('Topics in this Document')).toBeInTheDocument();
    expect(screen.getByText('Creation')).toBeInTheDocument();
  });

  it('should show instruction text when statements exist', () => {
    render(<TorahReader {...mockProps} />);

    expect(screen.getByText(/Tap any sentence/)).toBeInTheDocument();
  });

  it('should render section title when provided', () => {
    render(<TorahReader {...mockProps} />);

    expect(screen.getByText('Chapter 1')).toBeInTheDocument();
  });

  it('should handle empty sections gracefully', () => {
    const emptyProps = {
      ...mockProps,
      sections: [{
        id: 1,
        order_key: '1',
        statements: []
      }]
    };

    render(<TorahReader {...emptyProps} />);

    expect(screen.getByText('No content available for this section.')).toBeInTheDocument();
  });
});
