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
 * Get HTML content from element for copying (preserves images and formatting)
 */
export const getElementHtmlContent = (element) => {
  if (!element) return '';

  switch (element.type) {
    case 'title':
    case 'description':
      return element.content?.value || '';

    case 'macro':
      const macroTitle = element.content?.title || '';
      const macroDesc = element.content?.description || '';
      return `<div><strong>${macroTitle}</strong></div><br/><div>${macroDesc}</div>`;

    case 'example':
      const currentExample = element.content?.examples?.[element.content?.currentExampleIndex || 0];
      if (!currentExample) return '';

      const exampleTitle = currentExample.title || '';
      const messagesHtml = currentExample.messages?.map(msg => {
        const msgType = msg.type === 'user' ? 'User' : 'Agent';
        return `<div><strong>[${msgType}]:</strong> ${msg.text || ''}</div>`;
      }).join('<br/>') || '';

      return `<div><strong>${exampleTitle}</strong></div><br/>${messagesHtml}`;

    default:
      return element.content?.text || element.content?.title || '';
  }
};

/**
 * Get plain text content from element for copying
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
 * Copy element content to clipboard with rich text (HTML) support including images
 */
export const copyElementContent = async (element) => {
  const htmlContent = getElementHtmlContent(element);
  const plainTextContent = getElementContent(element);

  if (!htmlContent && !plainTextContent) {
    toast.error('No content to copy');
    return false;
  }

  try {
    // Use Clipboard API to write both HTML and plain text
    const clipboardItem = new ClipboardItem({
      'text/html': new Blob([htmlContent], { type: 'text/html' }),
      'text/plain': new Blob([plainTextContent], { type: 'text/plain' })
    });

    await navigator.clipboard.write([clipboardItem]);
    toast.success('Element content copied!');
    return true;
  } catch (error) {
    console.error('Failed to copy with rich text:', error);

    // Fallback to plain text only if rich text copy fails
    try {
      await navigator.clipboard.writeText(plainTextContent);
      toast.success('Element content copied (plain text)!');
      return true;
    } catch (fallbackError) {
      console.error('Failed to copy to clipboard:', fallbackError);
      toast.error('Failed to copy to clipboard');
      return false;
    }
  }
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
