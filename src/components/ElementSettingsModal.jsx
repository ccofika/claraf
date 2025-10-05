import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Slider } from './ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

const ElementSettingsModal = ({ isOpen, onClose, element, onSave }) => {
  const defaultSettings = {
    // Text settings
    fontSize: 14,
    fontWeight: 'normal',
    fontFamily: 'system-ui',
    textColor: '#000000',
    textAlign: 'left',
    lineHeight: 1.5,
    letterSpacing: 0,

    // Title settings (for macro/example)
    titleFontSize: 18,
    titleFontWeight: 'semibold',
    titleColor: '#000000',

    // Description settings (for macro/example)
    descriptionFontSize: 14,
    descriptionColor: '#000000',

    // Message settings (for example)
    userMessageColor: '#6b7280',
    agentMessageColor: '#3b82f6',
    messageFontSize: 14,

    // Border & background
    backgroundColor: '#ffffff',
    borderColor: '#d1d5db',
    borderWidth: 2,
    borderRadius: 8,

    // Shadow
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,

    // Spacing
    padding: 12,
    opacity: 1,

    // Dimensions
    width: 400,
    height: 100,
  };

  const [settings, setSettings] = useState(defaultSettings);

  useEffect(() => {
    if (element?.style) {
      setSettings({
        // Text settings
        fontSize: element.style.fontSize || 14,
        fontWeight: element.style.fontWeight || 'normal',
        fontFamily: element.style.fontFamily || 'system-ui',
        textColor: element.style.textColor || '#000000',
        textAlign: element.style.textAlign || 'left',
        lineHeight: element.style.lineHeight || 1.5,
        letterSpacing: element.style.letterSpacing || 0,

        // Title settings
        titleFontSize: element.style.titleFontSize || 18,
        titleFontWeight: element.style.titleFontWeight || 'semibold',
        titleColor: element.style.titleColor || '#000000',

        // Description settings
        descriptionFontSize: element.style.descriptionFontSize || 14,
        descriptionColor: element.style.descriptionColor || '#000000',

        // Message settings
        userMessageColor: element.style.userMessageColor || '#6b7280',
        agentMessageColor: element.style.agentMessageColor || '#3b82f6',
        messageFontSize: element.style.messageFontSize || 14,

        // Border & background
        backgroundColor: element.style.backgroundColor || '#ffffff',
        borderColor: element.style.borderColor || '#d1d5db',
        borderWidth: element.style.borderWidth || 2,
        borderRadius: element.style.borderRadius || 8,

        // Shadow
        shadowColor: element.style.shadowColor || 'rgba(0, 0, 0, 0.1)',
        shadowBlur: element.style.shadowBlur || 0,
        shadowOffsetX: element.style.shadowOffsetX || 0,
        shadowOffsetY: element.style.shadowOffsetY || 0,

        // Spacing
        padding: element.style.padding || 12,
        opacity: element.style.opacity || 1,

        // Dimensions
        width: element.dimensions?.width || 400,
        height: element.dimensions?.height || 100,
      });
    }
  }, [element]);

  const handleSave = () => {
    const { width, height, ...styleSettings } = settings;
    onSave?.({
      ...element,
      dimensions: {
        width,
        height
      },
      style: {
        ...element.style,
        ...styleSettings
      }
    });
    onClose();
  };

  const resetTextSettings = () => {
    setSettings(prev => ({
      ...prev,
      fontSize: defaultSettings.fontSize,
      fontWeight: defaultSettings.fontWeight,
      fontFamily: defaultSettings.fontFamily,
      textColor: defaultSettings.textColor,
      textAlign: defaultSettings.textAlign,
      lineHeight: defaultSettings.lineHeight,
      letterSpacing: defaultSettings.letterSpacing,
    }));
  };

  const resetContentSettings = () => {
    setSettings(prev => ({
      ...prev,
      titleFontSize: defaultSettings.titleFontSize,
      titleFontWeight: defaultSettings.titleFontWeight,
      titleColor: defaultSettings.titleColor,
      descriptionFontSize: defaultSettings.descriptionFontSize,
      descriptionColor: defaultSettings.descriptionColor,
    }));
  };

  const resetMessageSettings = () => {
    setSettings(prev => ({
      ...prev,
      userMessageColor: defaultSettings.userMessageColor,
      agentMessageColor: defaultSettings.agentMessageColor,
      messageFontSize: defaultSettings.messageFontSize,
    }));
  };

  const resetStyleSettings = () => {
    setSettings(prev => ({
      ...prev,
      backgroundColor: defaultSettings.backgroundColor,
      borderColor: defaultSettings.borderColor,
      borderWidth: defaultSettings.borderWidth,
      borderRadius: defaultSettings.borderRadius,
      padding: defaultSettings.padding,
      opacity: defaultSettings.opacity,
    }));
  };

  const resetShadowSettings = () => {
    setSettings(prev => ({
      ...prev,
      shadowColor: defaultSettings.shadowColor,
      shadowBlur: defaultSettings.shadowBlur,
      shadowOffsetX: defaultSettings.shadowOffsetX,
      shadowOffsetY: defaultSettings.shadowOffsetY,
    }));
  };

  const resetDimensionSettings = () => {
    setSettings(prev => ({
      ...prev,
      width: defaultSettings.width,
      height: defaultSettings.height,
    }));
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const fontFamilies = [
    { value: 'system-ui', label: 'System UI' },
    { value: 'Arial', label: 'Arial' },
    { value: 'Helvetica', label: 'Helvetica' },
    { value: 'Times New Roman', label: 'Times New Roman' },
    { value: 'Georgia', label: 'Georgia' },
    { value: 'Courier New', label: 'Courier New' },
    { value: 'monospace', label: 'Monospace' },
    { value: 'sans-serif', label: 'Sans Serif' },
    { value: 'serif', label: 'Serif' },
  ];

  const fontWeights = [
    { value: 'lighter', label: 'Lighter' },
    { value: 'normal', label: 'Normal' },
    { value: 'medium', label: 'Medium' },
    { value: 'semibold', label: 'Semibold' },
    { value: 'bold', label: 'Bold' },
    { value: 'bolder', label: 'Bolder' },
  ];

  const textAlignments = [
    { value: 'left', label: 'Left' },
    { value: 'center', label: 'Center' },
    { value: 'right', label: 'Right' },
    { value: 'justify', label: 'Justify' },
  ];

  const renderTextSettings = () => (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={resetTextSettings}
          className="px-3 py-1.5 text-xs font-medium bg-gray-200 hover:bg-gray-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-700 dark:text-neutral-300 rounded-md transition-colors"
        >
          Reset to Default
        </button>
      </div>
      <div className="space-y-3">
        <Label>Font Size: {settings.fontSize}px</Label>
        <Slider
          value={[settings.fontSize]}
          onValueChange={(value) => updateSetting('fontSize', value[0])}
          min={8}
          max={72}
          step={1}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label>Font Family</Label>
        <Select value={settings.fontFamily} onValueChange={(value) => updateSetting('fontFamily', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {fontFamilies.map(font => (
              <SelectItem key={font.value} value={font.value}>
                {font.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Font Weight</Label>
        <Select value={settings.fontWeight} onValueChange={(value) => updateSetting('fontWeight', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {fontWeights.map(weight => (
              <SelectItem key={weight.value} value={weight.value}>
                {weight.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Text Color</Label>
        <div className="flex gap-2">
          <Input
            type="color"
            value={settings.textColor}
            onChange={(e) => updateSetting('textColor', e.target.value)}
            className="w-20 h-10"
          />
          <Input
            type="text"
            value={settings.textColor}
            onChange={(e) => updateSetting('textColor', e.target.value)}
            className="flex-1"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Text Alignment</Label>
        <Select value={settings.textAlign} onValueChange={(value) => updateSetting('textAlign', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {textAlignments.map(align => (
              <SelectItem key={align.value} value={align.value}>
                {align.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label>Line Height: {settings.lineHeight}</Label>
        <Slider
          value={[settings.lineHeight]}
          onValueChange={(value) => updateSetting('lineHeight', value[0])}
          min={0.5}
          max={3}
          step={0.1}
          className="w-full"
        />
      </div>

      <div className="space-y-3">
        <Label>Letter Spacing: {settings.letterSpacing}px</Label>
        <Slider
          value={[settings.letterSpacing]}
          onValueChange={(value) => updateSetting('letterSpacing', value[0])}
          min={-2}
          max={10}
          step={0.1}
          className="w-full"
        />
      </div>
    </div>
  );

  const renderMacroExampleSettings = () => (
    <div className="space-y-6">
      <div className="flex justify-end mb-4">
        <button
          onClick={resetContentSettings}
          className="px-3 py-1.5 text-xs font-medium bg-gray-200 hover:bg-gray-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-700 dark:text-neutral-300 rounded-md transition-colors"
        >
          Reset to Default
        </button>
      </div>
      <div className="border-b pb-4">
        <h3 className="font-semibold mb-4 text-gray-900 dark:text-neutral-100">Title Settings</h3>

        <div className="space-y-3 mb-4">
          <Label>Title Font Size: {settings.titleFontSize}px</Label>
          <Slider
            value={[settings.titleFontSize]}
            onValueChange={(value) => updateSetting('titleFontSize', value[0])}
            min={10}
            max={48}
            step={1}
            className="w-full"
          />
        </div>

        <div className="space-y-2 mb-4">
          <Label>Title Font Weight</Label>
          <Select value={settings.titleFontWeight} onValueChange={(value) => updateSetting('titleFontWeight', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fontWeights.map(weight => (
                <SelectItem key={weight.value} value={weight.value}>
                  {weight.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Title Color</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={settings.titleColor}
              onChange={(e) => updateSetting('titleColor', e.target.value)}
              className="w-20 h-10"
            />
            <Input
              type="text"
              value={settings.titleColor}
              onChange={(e) => updateSetting('titleColor', e.target.value)}
              className="flex-1"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-4 text-gray-900 dark:text-neutral-100">Description Settings</h3>

        <div className="space-y-3 mb-4">
          <Label>Description Font Size: {settings.descriptionFontSize}px</Label>
          <Slider
            value={[settings.descriptionFontSize]}
            onValueChange={(value) => updateSetting('descriptionFontSize', value[0])}
            min={8}
            max={32}
            step={1}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label>Description Color</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={settings.descriptionColor}
              onChange={(e) => updateSetting('descriptionColor', e.target.value)}
              className="w-20 h-10"
            />
            <Input
              type="text"
              value={settings.descriptionColor}
              onChange={(e) => updateSetting('descriptionColor', e.target.value)}
              className="flex-1"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderExampleMessageSettings = () => (
    <div className="space-y-6">
      <div className="flex justify-end mb-4">
        <button
          onClick={resetMessageSettings}
          className="px-3 py-1.5 text-xs font-medium bg-gray-200 hover:bg-gray-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-700 dark:text-neutral-300 rounded-md transition-colors"
        >
          Reset to Default
        </button>
      </div>
      <div className="space-y-3">
        <Label>Message Font Size: {settings.messageFontSize}px</Label>
        <Slider
          value={[settings.messageFontSize]}
          onValueChange={(value) => updateSetting('messageFontSize', value[0])}
          min={10}
          max={24}
          step={1}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label>User Message Color</Label>
        <div className="flex gap-2">
          <Input
            type="color"
            value={settings.userMessageColor}
            onChange={(e) => updateSetting('userMessageColor', e.target.value)}
            className="w-20 h-10"
          />
          <Input
            type="text"
            value={settings.userMessageColor}
            onChange={(e) => updateSetting('userMessageColor', e.target.value)}
            className="flex-1"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Agent Message Color</Label>
        <div className="flex gap-2">
          <Input
            type="color"
            value={settings.agentMessageColor}
            onChange={(e) => updateSetting('agentMessageColor', e.target.value)}
            className="w-20 h-10"
          />
          <Input
            type="text"
            value={settings.agentMessageColor}
            onChange={(e) => updateSetting('agentMessageColor', e.target.value)}
            className="flex-1"
          />
        </div>
      </div>
    </div>
  );

  const renderStyleSettings = () => (
    <div className="space-y-6">
      <div className="flex justify-end mb-4">
        <button
          onClick={resetStyleSettings}
          className="px-3 py-1.5 text-xs font-medium bg-gray-200 hover:bg-gray-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-700 dark:text-neutral-300 rounded-md transition-colors"
        >
          Reset to Default
        </button>
      </div>
      <div className="space-y-2">
        <Label>Background Color</Label>
        <div className="flex gap-2">
          <Input
            type="color"
            value={settings.backgroundColor === 'transparent' ? '#ffffff' : settings.backgroundColor}
            onChange={(e) => updateSetting('backgroundColor', e.target.value)}
            className="w-20 h-10"
          />
          <Input
            type="text"
            value={settings.backgroundColor}
            onChange={(e) => updateSetting('backgroundColor', e.target.value)}
            className="flex-1"
            placeholder="transparent or #hexcode"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Border Color</Label>
        <div className="flex gap-2">
          <Input
            type="color"
            value={settings.borderColor}
            onChange={(e) => updateSetting('borderColor', e.target.value)}
            className="w-20 h-10"
          />
          <Input
            type="text"
            value={settings.borderColor}
            onChange={(e) => updateSetting('borderColor', e.target.value)}
            className="flex-1"
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label>Border Width: {settings.borderWidth}px</Label>
        <Slider
          value={[settings.borderWidth]}
          onValueChange={(value) => updateSetting('borderWidth', value[0])}
          min={0}
          max={10}
          step={1}
          className="w-full"
        />
      </div>

      <div className="space-y-3">
        <Label>Border Radius: {settings.borderRadius}px</Label>
        <Slider
          value={[settings.borderRadius]}
          onValueChange={(value) => updateSetting('borderRadius', value[0])}
          min={0}
          max={50}
          step={1}
          className="w-full"
        />
      </div>

      <div className="space-y-3">
        <Label>Padding: {settings.padding}px</Label>
        <Slider
          value={[settings.padding]}
          onValueChange={(value) => updateSetting('padding', value[0])}
          min={0}
          max={50}
          step={1}
          className="w-full"
        />
      </div>

      <div className="space-y-3">
        <Label>Opacity: {settings.opacity}</Label>
        <Slider
          value={[settings.opacity]}
          onValueChange={(value) => updateSetting('opacity', value[0])}
          min={0}
          max={1}
          step={0.01}
          className="w-full"
        />
      </div>
    </div>
  );

  const renderShadowSettings = () => (
    <div className="space-y-6">
      <div className="flex justify-end mb-4">
        <button
          onClick={resetShadowSettings}
          className="px-3 py-1.5 text-xs font-medium bg-gray-200 hover:bg-gray-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-700 dark:text-neutral-300 rounded-md transition-colors"
        >
          Reset to Default
        </button>
      </div>
      <div className="space-y-2">
        <Label>Shadow Color</Label>
        <div className="flex gap-2">
          <Input
            type="text"
            value={settings.shadowColor}
            onChange={(e) => updateSetting('shadowColor', e.target.value)}
            className="flex-1"
            placeholder="rgba(0, 0, 0, 0.1)"
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label>Shadow Blur: {settings.shadowBlur}px</Label>
        <Slider
          value={[settings.shadowBlur]}
          onValueChange={(value) => updateSetting('shadowBlur', value[0])}
          min={0}
          max={50}
          step={1}
          className="w-full"
        />
      </div>

      <div className="space-y-3">
        <Label>Shadow Offset X: {settings.shadowOffsetX}px</Label>
        <Slider
          value={[settings.shadowOffsetX]}
          onValueChange={(value) => updateSetting('shadowOffsetX', value[0])}
          min={-50}
          max={50}
          step={1}
          className="w-full"
        />
      </div>

      <div className="space-y-3">
        <Label>Shadow Offset Y: {settings.shadowOffsetY}px</Label>
        <Slider
          value={[settings.shadowOffsetY]}
          onValueChange={(value) => updateSetting('shadowOffsetY', value[0])}
          min={-50}
          max={50}
          step={1}
          className="w-full"
        />
      </div>
    </div>
  );

  const renderDimensionSettings = () => (
    <div className="space-y-6">
      <div className="flex justify-end mb-4">
        <button
          onClick={resetDimensionSettings}
          className="px-3 py-1.5 text-xs font-medium bg-gray-200 hover:bg-gray-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-700 dark:text-neutral-300 rounded-md transition-colors"
        >
          Reset to Default
        </button>
      </div>

      <div className="space-y-3">
        <Label>Width: {settings.width}px</Label>
        <Slider
          value={[settings.width]}
          onValueChange={(value) => updateSetting('width', value[0])}
          min={100}
          max={1200}
          step={10}
          className="w-full"
        />
      </div>

      <div className="space-y-3">
        <Label>Height: {settings.height}px</Label>
        <Slider
          value={[settings.height]}
          onValueChange={(value) => updateSetting('height', value[0])}
          min={50}
          max={800}
          step={10}
          className="w-full"
        />
      </div>

      <div className="p-4 bg-gray-50 dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800">
        <p className="text-sm text-gray-600 dark:text-neutral-400">
          <strong>Current Size:</strong> {settings.width}px × {settings.height}px
        </p>
      </div>
    </div>
  );

  if (!element) return null;

  const elementType = element.type;
  const isMacroOrExample = elementType === 'macro' || elementType === 'example';
  const isExample = elementType === 'example';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-neutral-100">
            Element Settings
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-neutral-400">
            Customize the appearance and styling of your {elementType} element
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="text" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="text">Text</TabsTrigger>
            {isMacroOrExample && <TabsTrigger value="content">Content</TabsTrigger>}
            {isExample && <TabsTrigger value="messages">Messages</TabsTrigger>}
            <TabsTrigger value="style">Style</TabsTrigger>
            <TabsTrigger value="shadow">Shadow</TabsTrigger>
            <TabsTrigger value="dimensions">Size</TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="mt-6">
            {renderTextSettings()}
          </TabsContent>

          {isMacroOrExample && (
            <TabsContent value="content" className="mt-6">
              {renderMacroExampleSettings()}
            </TabsContent>
          )}

          {isExample && (
            <TabsContent value="messages" className="mt-6">
              {renderExampleMessageSettings()}
            </TabsContent>
          )}

          <TabsContent value="style" className="mt-6">
            {renderStyleSettings()}
          </TabsContent>

          <TabsContent value="shadow" className="mt-6">
            {renderShadowSettings()}
          </TabsContent>

          <TabsContent value="dimensions" className="mt-6">
            {renderDimensionSettings()}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-neutral-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-md text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            Save Changes
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ElementSettingsModal;
