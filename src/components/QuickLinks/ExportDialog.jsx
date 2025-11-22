import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Label } from '../ui/label';
import { Download, FileJson, FileCode } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const ExportDialog = ({ open, onOpenChange }) => {
  const [format, setFormat] = useState('json');
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    try {
      setExporting(true);
      const token = localStorage.getItem('token');

      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/quicklinks/export?format=${format}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: format === 'html' ? 'blob' : 'json',
        }
      );

      if (format === 'html') {
        // Download HTML file
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'bookmarks.html');
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } else {
        // Download JSON file
        const dataStr = JSON.stringify(response.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'quick-links.json');
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }

      toast.success('Quick links exported successfully');
      onOpenChange(false);
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('Failed to export quick links');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export Quick Links</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label className="text-sm font-medium text-card-foreground mb-3 block">
              Select Export Format
            </Label>

            <div className="space-y-2">
              {/* JSON Option */}
              <label
                className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  format === 'json'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-border hover:border-blue-300'
                }`}
              >
                <input
                  type="radio"
                  name="format"
                  value="json"
                  checked={format === 'json'}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <FileJson className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">JSON Format</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Export as JSON file (can be re-imported)
                  </p>
                </div>
              </label>

              {/* HTML Bookmarks Option */}
              <label
                className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  format === 'html'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-border hover:border-blue-300'
                }`}
              >
                <input
                  type="radio"
                  name="format"
                  value="html"
                  checked={format === 'html'}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <FileCode className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">HTML Bookmarks</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Export as HTML (importable to browsers)
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-xs text-blue-800 dark:text-blue-200">
              💡 <strong>Tip:</strong> Use JSON format if you plan to re-import your links later.
              Use HTML format to import links into your browser.
            </p>
          </div>
        </div>

        <DialogFooter className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-card-foreground border border-input rounded-lg hover:bg-muted/50 transition-colors"
            disabled={exporting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Exporting...' : 'Export'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;
