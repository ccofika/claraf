import { toast } from 'sonner';

/**
 * Strip HTML tags from a string and return plain text
 */
export const stripHtml = (html) => {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

/**
 * Copy text content to clipboard
 */
export const copyToClipboard = async (content, successMessage = 'Copied to clipboard!') => {
  try {
    await navigator.clipboard.writeText(content);
    toast.success(successMessage);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    toast.error('Failed to copy to clipboard');
    return false;
  }
};

/**
 * Get content from element for copying
 */
export const getElementContent = (element) => {
  if (!element) return '';

  switch (element.type) {
    case 'title':
    case 'description':
      return stripHtml(element.content?.value || '');

    case 'macro':
      const macroTitle = stripHtml(element.content?.title || '');
      const macroDesc = stripHtml(element.content?.description || '');
      return `${macroTitle}\n\n${macroDesc}`;

    case 'example':
      const currentExample = element.content?.examples?.[element.content?.currentExampleIndex || 0];
      if (!currentExample) return '';

      const exampleTitle = stripHtml(currentExample.title || '');
      const messages = currentExample.messages?.map(msg => {
        const msgText = stripHtml(msg.text || '');
        return `[${msg.type === 'user' ? 'User' : 'Agent'}]: ${msgText}`;
      }).join('\n') || '';

      return `${exampleTitle}\n\n${messages}`;

    default:
      return element.content?.text || element.content?.title || '';
  }
};

/**
 * Copy element content to clipboard
 */
export const copyElementContent = async (element) => {
  const content = getElementContent(element);
  if (!content) {
    toast.error('No content to copy');
    return false;
  }
  return await copyToClipboard(content, 'Element content copied!');
};

/**
 * Generate shareable link for an element
 */
export const generateShareLink = (workspaceId, elementId) => {
  return `${window.location.origin}/workspace/${workspaceId}?element=${elementId}`;
};

/**
 * Copy shareable link to clipboard
 */
export const shareElement = async (workspaceId, elementId) => {
  const shareUrl = generateShareLink(workspaceId, elementId);
  return await copyToClipboard(shareUrl, 'Share link copied!');
};

/**
 * Parse element ID from URL query params
 */
export const getElementIdFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get('element');
};
