import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Upload, FileJson, AlertCircle, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const ImportDialog = ({ open, onOpenChange, onImportSuccess }) => {
  const [importing, setImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/json') {
      setSelectedFile(file);
      setImportResult(null);
    } else {
      toast.error('Please select a valid JSON file');
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    try {
      setImporting(true);

      // Read file content
      const fileContent = await selectedFile.text();
      const data = JSON.parse(fileContent);

      // Validate structure
      if (!Array.isArray(data)) {
        throw new Error('Invalid file format: expected an array of categories');
      }

      const token = localStorage.getItem('token');

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/quicklinks/import`,
        { categories: data },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setImportResult(response.data);
      toast.success(`Imported ${response.data.imported} ${response.data.imported === 1 ? 'category' : 'categories'}`);

      // Call success callback after a short delay to show results
      setTimeout(() => {
        onImportSuccess();
        onOpenChange(false);
      }, 2000);
    } catch (error) {
      console.error('Error importing:', error);
      if (error.message.includes('JSON')) {
        toast.error('Invalid JSON file format');
      } else {
        toast.error(error.response?.data?.message || 'Failed to import quick links');
      }
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setImportResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Import Quick Links</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!importResult ? (
            <>
              {/* File Upload Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <Upload className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">
                      Click to select a JSON file
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Import quick links from a previously exported file
                    </p>
                  </div>
                </div>
              </div>

              {/* Selected File */}
              {selectedFile && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <FileJson className="w-5 h-5 text-blue-600" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              )}

              {/* Info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  <strong>Note:</strong> Categories with names that already exist will be skipped.
                  All links within imported categories will be added.
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Import Results */}
              <div className="space-y-3">
                {/* Success */}
                {importResult.imported > 0 && (
                  <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        Successfully imported {importResult.imported} {importResult.imported === 1 ? 'category' : 'categories'}
                      </p>
                      {importResult.details?.imported.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {importResult.details.imported.slice(0, 5).map((cat, idx) => (
                            <li key={idx} className="text-xs text-green-700 dark:text-green-300">
                              • {cat.categoryName} ({cat.links.length} {cat.links.length === 1 ? 'link' : 'links'})
                            </li>
                          ))}
                          {importResult.details.imported.length > 5 && (
                            <li className="text-xs text-green-700 dark:text-green-300">
                              ... and {importResult.details.imported.length - 5} more
                            </li>
                          )}
                        </ul>
                      )}
                    </div>
                  </div>
                )}

                {/* Skipped */}
                {importResult.skipped > 0 && (
                  <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                        Skipped {importResult.skipped} {importResult.skipped === 1 ? 'category' : 'categories'}
                      </p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                        These categories already exist in your account
                      </p>
                      {importResult.details?.skipped.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {importResult.details.skipped.map((item, idx) => (
                            <li key={idx} className="text-xs text-yellow-700 dark:text-yellow-300">
                              • {item.categoryName}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-card-foreground border border-input rounded-lg hover:bg-muted/50 transition-colors"
            disabled={importing}
          >
            {importResult ? 'Close' : 'Cancel'}
          </button>
          {!importResult && (
            <button
              type="button"
              onClick={handleImport}
              disabled={!selectedFile || importing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-4 h-4" />
              {importing ? 'Importing...' : 'Import'}
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportDialog;
