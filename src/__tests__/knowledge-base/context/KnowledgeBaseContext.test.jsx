import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { KnowledgeBaseProvider, useKnowledgeBase } from '../../../context/KnowledgeBaseContext';
import axios from 'axios';

// Mock axios
jest.mock('axios');

// Mock AuthContext
jest.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { _id: 'user1', email: 'test@test.com', name: 'Test User' }
  })
}));

// Test component that exposes context values
const TestConsumer = ({ onRender }) => {
  const context = useKnowledgeBase();
  onRender(context);
  return <div data-testid="consumer">Ready</div>;
};

const renderWithProvider = (onRender) => {
  return render(
    <BrowserRouter>
      <KnowledgeBaseProvider>
        <TestConsumer onRender={onRender} />
      </KnowledgeBaseProvider>
    </BrowserRouter>
  );
};

describe('KnowledgeBaseContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('token', 'test-token');

    // Default mocks
    axios.get.mockImplementation((url) => {
      if (url.includes('check-admin')) {
        return Promise.resolve({ data: { isAdmin: true, isSuperAdmin: false } });
      }
      if (url.includes('/pages') && !url.includes('versions') && !url.includes('comments')) {
        return Promise.resolve({ data: [] });
      }
      if (url.includes('/favorites')) {
        return Promise.resolve({ data: [] });
      }
      if (url.includes('/recent')) {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: {} });
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Page Operations', () => {
    it('fetches page tree on mount', async () => {
      const mockTree = [
        { _id: 'p1', title: 'Page 1', slug: 'page-1', icon: '📄', children: [] }
      ];
      axios.get.mockImplementation((url) => {
        if (url.includes('/pages') && !url.includes('by-slug')) {
          return Promise.resolve({ data: mockTree });
        }
        if (url.includes('check-admin')) {
          return Promise.resolve({ data: { isAdmin: true, isSuperAdmin: false } });
        }
        return Promise.resolve({ data: [] });
      });

      let contextValue;
      await act(async () => {
        renderWithProvider((ctx) => { contextValue = ctx; });
      });

      await waitFor(() => {
        expect(contextValue.pageTree).toEqual(mockTree);
      });
    });

    it('creates page with correct data', async () => {
      const newPage = { _id: 'new1', title: 'New Page', slug: 'new-page' };
      axios.post.mockResolvedValueOnce({ data: newPage });
      axios.get.mockImplementation(() => Promise.resolve({ data: [] }));

      let contextValue;
      await act(async () => {
        renderWithProvider((ctx) => { contextValue = ctx; });
      });

      await act(async () => {
        const result = await contextValue.createPage({ title: 'New Page' });
        expect(result).toEqual(newPage);
      });

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/pages'),
        { title: 'New Page' },
        expect.any(Object)
      );
    });

    it('updates page correctly', async () => {
      const updated = { _id: 'p1', title: 'Updated', slug: 'updated' };
      axios.put.mockResolvedValueOnce({ data: updated });
      axios.get.mockImplementation(() => Promise.resolve({ data: [] }));

      let contextValue;
      await act(async () => {
        renderWithProvider((ctx) => { contextValue = ctx; });
      });

      await act(async () => {
        const result = await contextValue.updatePage('p1', { title: 'Updated' });
        expect(result).toEqual(updated);
      });
    });

    it('deletes page and navigates', async () => {
      axios.delete.mockResolvedValueOnce({});
      axios.get.mockImplementation(() => Promise.resolve({ data: [] }));

      let contextValue;
      await act(async () => {
        renderWithProvider((ctx) => { contextValue = ctx; });
      });

      await act(async () => {
        await contextValue.deletePage('p1');
      });

      expect(axios.delete).toHaveBeenCalledWith(
        expect.stringContaining('/pages/p1'),
        expect.any(Object)
      );
    });
  });

  describe('Variant Resolution', () => {
    it('resolves content with no variants', async () => {
      let contextValue;
      await act(async () => {
        renderWithProvider((ctx) => { contextValue = ctx; });
      });

      const block = { defaultContent: 'Hello', variants: {} };
      expect(contextValue.resolveContent(block)).toBe('Hello');
    });

    it('falls back to default when no variant matches', async () => {
      let contextValue;
      await act(async () => {
        renderWithProvider((ctx) => { contextValue = ctx; });
      });

      const block = {
        defaultContent: 'Default text',
        variants: { 'dropdown1:optionA': 'Variant A text' }
      };
      expect(contextValue.resolveContent(block)).toBe('Default text');
    });

    it('handles null block', async () => {
      let contextValue;
      await act(async () => {
        renderWithProvider((ctx) => { contextValue = ctx; });
      });

      expect(contextValue.resolveContent(null)).toBe('');
    });
  });

  describe('Admin Operations', () => {
    it('correctly identifies admin status', async () => {
      axios.get.mockImplementation((url) => {
        if (url.includes('check-admin')) {
          return Promise.resolve({ data: { isAdmin: true, isSuperAdmin: false } });
        }
        return Promise.resolve({ data: [] });
      });

      let contextValue;
      await act(async () => {
        renderWithProvider((ctx) => { contextValue = ctx; });
      });

      await waitFor(() => {
        expect(contextValue.isAdmin).toBe(true);
        expect(contextValue.isSuperAdmin).toBe(false);
      });
    });
  });

  describe('Favorites', () => {
    it('toggles favorite', async () => {
      axios.post.mockResolvedValueOnce({
        data: { favorites: [{ _id: 'p1', title: 'Fav Page' }] }
      });
      axios.get.mockImplementation(() => Promise.resolve({ data: [] }));

      let contextValue;
      await act(async () => {
        renderWithProvider((ctx) => { contextValue = ctx; });
      });

      await act(async () => {
        await contextValue.toggleFavorite('p1');
      });

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/favorites/p1'),
        {},
        expect.any(Object)
      );
    });
  });

  describe('Search', () => {
    it('searches pages', async () => {
      const results = [{ _id: 'p1', title: 'Match', slug: 'match' }];
      axios.get.mockImplementation((url) => {
        if (url.includes('/search')) {
          return Promise.resolve({ data: results });
        }
        return Promise.resolve({ data: [] });
      });

      let contextValue;
      await act(async () => {
        renderWithProvider((ctx) => { contextValue = ctx; });
      });

      let searchResults;
      await act(async () => {
        searchResults = await contextValue.searchPages('test');
      });

      expect(searchResults).toEqual(results);
    });
  });

  describe('Templates', () => {
    it('fetches templates', async () => {
      const mockTemplates = [{ _id: 't1', title: 'Template 1' }];
      axios.get.mockImplementation((url) => {
        if (url.includes('/templates')) {
          return Promise.resolve({ data: mockTemplates });
        }
        return Promise.resolve({ data: [] });
      });

      let contextValue;
      await act(async () => {
        renderWithProvider((ctx) => { contextValue = ctx; });
      });

      await act(async () => {
        await contextValue.fetchTemplates();
      });

      expect(contextValue.templates).toEqual(mockTemplates);
    });
  });
});
