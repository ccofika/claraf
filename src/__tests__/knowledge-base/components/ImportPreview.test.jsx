import React from 'react';
import { render, screen } from '@testing-library/react';
import ImportPreview from '../../../components/KnowledgeBase/io/ImportPreview';

describe('ImportPreview', () => {
  it('renders JSON format preview', () => {
    const data = {
      title: 'Test Page',
      icon: null,
      blocks: [
        { id: 'b1', type: 'paragraph', defaultContent: 'Hello' },
        { id: 'b2', type: 'heading_1', defaultContent: 'Title' }
      ],
      tags: ['test', 'docs']
    };
    render(<ImportPreview data={data} fileName="test.json" />);
    expect(screen.getByText('test.json')).toBeInTheDocument();
    expect(screen.getByText('Test Page')).toBeInTheDocument();
    expect(screen.getByText('2 blocks')).toBeInTheDocument();
  });

  it('renders Markdown format preview', () => {
    const data = {
      title: 'My Doc',
      format: 'markdown',
      content: '# Hello World\n\nThis is a test document with some content.'
    };
    render(<ImportPreview data={data} fileName="doc.md" />);
    expect(screen.getByText('doc.md')).toBeInTheDocument();
    expect(screen.getByText('Markdown')).toBeInTheDocument();
  });

  it('renders HTML format preview', () => {
    const data = {
      title: 'HTML Page',
      format: 'html',
      content: '<h1>Hello</h1><p>World</p>'
    };
    render(<ImportPreview data={data} fileName="page.html" />);
    expect(screen.getByText('page.html')).toBeInTheDocument();
    expect(screen.getByText('HTML')).toBeInTheDocument();
  });

  it('shows block type summary for JSON', () => {
    const data = {
      title: 'Page',
      blocks: [
        { id: 'b1', type: 'paragraph' },
        { id: 'b2', type: 'paragraph' },
        { id: 'b3', type: 'heading_1' }
      ]
    };
    render(<ImportPreview data={data} fileName="page.json" />);
    expect(screen.getByText(/paragraph \(2\)/)).toBeInTheDocument();
    expect(screen.getByText(/heading 1 \(1\)/)).toBeInTheDocument();
  });

  it('shows tags if present', () => {
    const data = {
      title: 'Tagged Page',
      blocks: [],
      tags: ['react', 'docs']
    };
    render(<ImportPreview data={data} fileName="tagged.json" />);
    expect(screen.getByText('react, docs')).toBeInTheDocument();
  });

  it('shows content preview for markdown', () => {
    const data = {
      title: 'Doc',
      format: 'markdown',
      content: '# Title\n\nSome content here'
    };
    render(<ImportPreview data={data} fileName="doc.md" />);
    expect(screen.getByText('Content Preview')).toBeInTheDocument();
  });

  it('shows dropdown count for JSON with dropdowns', () => {
    const data = {
      title: 'Page',
      blocks: [{ id: 'b1', type: 'paragraph' }],
      dropdowns: [{ id: 'd1', label: 'Product' }]
    };
    render(<ImportPreview data={data} fileName="page.json" />);
    expect(screen.getByText('1 dropdowns')).toBeInTheDocument();
  });
});
