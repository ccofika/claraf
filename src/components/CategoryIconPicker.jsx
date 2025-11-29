import React, { useState, useMemo } from 'react';
import ReactDOM from 'react-dom';
import {
  X, Search,
  // Crypto & Finance
  Bitcoin, Wallet, Coins, Landmark, CreditCard, Banknote, CircleDollarSign, PiggyBank, Receipt, TrendingUp, TrendingDown, BarChart3, LineChart, PieChart, ArrowUpDown, ArrowRightLeft, DollarSign, Euro, PoundSterling, BadgeDollarSign, HandCoins,
  // Rewards & Achievements
  Gift, Award, Trophy, Star, Medal, Crown, Gem, Target, Zap, Sparkles, PartyPopper, Cake, Heart, ThumbsUp, Flame,
  // Security & Verification
  Shield, ShieldCheck, ShieldAlert, Lock, Unlock, Key, KeyRound, Fingerprint, Eye, EyeOff, ScanFace, BadgeCheck, CircleCheck, CheckCircle2, UserCheck, FileCheck, ClipboardCheck,
  // Documents & Files
  File, FileText, Files, Folder, FolderOpen, FolderClosed, Archive, FileBox, ClipboardList, ScrollText, Newspaper, BookOpen, Book, Library, FileSignature, FileBadge,
  // Communication
  MessageSquare, MessageCircle, Mail, MailOpen, Send, Inbox, AtSign, Phone, PhoneCall, Video, Headphones, Mic, Radio, Bell, BellRing, Megaphone,
  // Users & People
  User, Users, UserPlus, UserMinus, UserCog, UserCircle, Contact, UsersRound, CircleUser, PersonStanding, Baby, Accessibility,
  // Time & Scheduling
  Clock, Timer, TimerOff, Hourglass, Calendar, CalendarDays, CalendarCheck, CalendarClock, AlarmClock, Watch, History, RotateCcw,
  // Status & Alerts
  AlertTriangle, AlertCircle, AlertOctagon, Info, HelpCircle, Ban, XCircle, CheckCircle, CircleDot, Circle, Loader, RefreshCw, RefreshCcw,
  // Navigation & UI
  Home, Settings, SettingsIcon, Cog, Sliders, SlidersHorizontal, Menu, MoreHorizontal, MoreVertical, Grid, List, LayoutGrid, LayoutList, Columns, Rows, Table,
  // Actions
  Plus, Minus, Edit, Edit2, Edit3, Pencil, PenTool, Trash, Trash2, Copy, Clipboard, Download, Upload, Share, Share2, ExternalLink, Link, Link2, Unlink,
  // Arrows & Direction
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ChevronsUp, ChevronsDown, MoveUp, MoveDown, CornerDownRight, CornerUpLeft,
  // Media
  Image, Images, Camera, Film, Play, Pause, Square, Volume2, VolumeX, Music, Mic2, Video as VideoIcon,
  // Tags & Labels
  Tag, Tags, Bookmark, BookmarkCheck, Flag, Hash, Asterisk, AtSign as At,
  // Tools & Work
  Wrench, Hammer, Paintbrush, Scissors, Ruler, Compass, Calculator, Terminal, Code, CodeXml, Bug, Puzzle, Lightbulb,
  // Nature & Weather
  Sun, Moon, Cloud, CloudRain, Snowflake, Wind, Leaf, Flower2, Mountain, Waves,
  // Objects
  Box, Package, Briefcase, ShoppingBag, ShoppingCart, Store, Building, Building2, Factory, Warehouse, Car, Plane, Ship, Truck,
  // Gaming & Fun
  Gamepad2, Dice1, Dice5, Ghost, Skull, Bomb, Rocket, Swords, ShieldQuestion,
  // Misc
  Globe, Map, MapPin, Navigation, Compass as CompassIcon, Anchor, Wifi, Signal, Battery, Power, Plug, Cpu, HardDrive, Database, Server, Cloud as CloudIcon, CloudUpload, CloudDownload
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

/**
 * CategoryIconPicker - Icon selection modal for categories
 * Clean black/white SVG icons organized by themed sections
 */
const CategoryIconPicker = ({
  isOpen,
  onClose,
  onSelect,
  currentIcon,
  color = '#6366f1'
}) => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');

  // Icon component mapping
  const iconComponents = {
    // Crypto & Finance
    'bitcoin': Bitcoin,
    'wallet': Wallet,
    'coins': Coins,
    'landmark': Landmark,
    'credit-card': CreditCard,
    'banknote': Banknote,
    'dollar-sign': CircleDollarSign,
    'piggy-bank': PiggyBank,
    'receipt': Receipt,
    'trending-up': TrendingUp,
    'trending-down': TrendingDown,
    'bar-chart': BarChart3,
    'line-chart': LineChart,
    'pie-chart': PieChart,
    'arrow-up-down': ArrowUpDown,
    'exchange': ArrowRightLeft,
    'dollar': DollarSign,
    'euro': Euro,
    'pound': PoundSterling,
    'badge-dollar': BadgeDollarSign,
    'hand-coins': HandCoins,
    // Rewards & Achievements
    'gift': Gift,
    'award': Award,
    'trophy': Trophy,
    'star': Star,
    'medal': Medal,
    'crown': Crown,
    'gem': Gem,
    'target': Target,
    'zap': Zap,
    'sparkles': Sparkles,
    'party': PartyPopper,
    'cake': Cake,
    'heart': Heart,
    'thumbs-up': ThumbsUp,
    'flame': Flame,
    // Security & Verification
    'shield': Shield,
    'shield-check': ShieldCheck,
    'shield-alert': ShieldAlert,
    'lock': Lock,
    'unlock': Unlock,
    'key': Key,
    'key-round': KeyRound,
    'fingerprint': Fingerprint,
    'eye': Eye,
    'eye-off': EyeOff,
    'scan-face': ScanFace,
    'badge-check': BadgeCheck,
    'circle-check': CircleCheck,
    'check-circle': CheckCircle2,
    'user-check': UserCheck,
    'file-check': FileCheck,
    'clipboard-check': ClipboardCheck,
    // Documents & Files
    'file': File,
    'file-text': FileText,
    'files': Files,
    'folder': Folder,
    'folder-open': FolderOpen,
    'folder-closed': FolderClosed,
    'archive': Archive,
    'file-box': FileBox,
    'clipboard-list': ClipboardList,
    'scroll': ScrollText,
    'newspaper': Newspaper,
    'book-open': BookOpen,
    'book': Book,
    'library': Library,
    'file-signature': FileSignature,
    'file-badge': FileBadge,
    // Communication
    'message-square': MessageSquare,
    'message-circle': MessageCircle,
    'mail': Mail,
    'mail-open': MailOpen,
    'send': Send,
    'inbox': Inbox,
    'at-sign': AtSign,
    'phone': Phone,
    'phone-call': PhoneCall,
    'video': Video,
    'headphones': Headphones,
    'mic': Mic,
    'radio': Radio,
    'bell': Bell,
    'bell-ring': BellRing,
    'megaphone': Megaphone,
    // Users & People
    'user': User,
    'users': Users,
    'user-plus': UserPlus,
    'user-minus': UserMinus,
    'user-cog': UserCog,
    'user-circle': UserCircle,
    'contact': Contact,
    'users-round': UsersRound,
    'circle-user': CircleUser,
    'person': PersonStanding,
    'baby': Baby,
    'accessibility': Accessibility,
    // Time & Scheduling
    'clock': Clock,
    'timer': Timer,
    'timer-off': TimerOff,
    'hourglass': Hourglass,
    'calendar': Calendar,
    'calendar-days': CalendarDays,
    'calendar-check': CalendarCheck,
    'calendar-clock': CalendarClock,
    'alarm': AlarmClock,
    'watch': Watch,
    'history': History,
    'rotate': RotateCcw,
    // Status & Alerts
    'alert-triangle': AlertTriangle,
    'alert-circle': AlertCircle,
    'alert-octagon': AlertOctagon,
    'info': Info,
    'help': HelpCircle,
    'ban': Ban,
    'x-circle': XCircle,
    'check': CheckCircle,
    'circle-dot': CircleDot,
    'circle': Circle,
    'loader': Loader,
    'refresh': RefreshCw,
    'refresh-ccw': RefreshCcw,
    // Navigation & UI
    'home': Home,
    'settings': Settings,
    'cog': Cog,
    'sliders': Sliders,
    'sliders-h': SlidersHorizontal,
    'menu': Menu,
    'more-h': MoreHorizontal,
    'more-v': MoreVertical,
    'grid': Grid,
    'list': List,
    'layout-grid': LayoutGrid,
    'layout-list': LayoutList,
    'columns': Columns,
    'rows': Rows,
    'table': Table,
    // Actions
    'plus': Plus,
    'minus': Minus,
    'edit': Edit,
    'edit-2': Edit2,
    'edit-3': Edit3,
    'pencil': Pencil,
    'pen': PenTool,
    'trash': Trash,
    'trash-2': Trash2,
    'copy': Copy,
    'clipboard': Clipboard,
    'download': Download,
    'upload': Upload,
    'share': Share,
    'share-2': Share2,
    'external-link': ExternalLink,
    'link': Link,
    'link-2': Link2,
    'unlink': Unlink,
    // Arrows
    'arrow-up': ArrowUp,
    'arrow-down': ArrowDown,
    'arrow-left': ArrowLeft,
    'arrow-right': ArrowRight,
    'chevron-up': ChevronUp,
    'chevron-down': ChevronDown,
    'chevron-left': ChevronLeft,
    'chevron-right': ChevronRight,
    'chevrons-up': ChevronsUp,
    'chevrons-down': ChevronsDown,
    'move-up': MoveUp,
    'move-down': MoveDown,
    // Media
    'image': Image,
    'images': Images,
    'camera': Camera,
    'film': Film,
    'play': Play,
    'pause': Pause,
    'stop': Square,
    'volume': Volume2,
    'mute': VolumeX,
    'music': Music,
    'mic-2': Mic2,
    // Tags & Labels
    'tag': Tag,
    'tags': Tags,
    'bookmark': Bookmark,
    'bookmark-check': BookmarkCheck,
    'flag': Flag,
    'hash': Hash,
    'asterisk': Asterisk,
    // Tools & Work
    'wrench': Wrench,
    'hammer': Hammer,
    'paintbrush': Paintbrush,
    'scissors': Scissors,
    'ruler': Ruler,
    'compass': Compass,
    'calculator': Calculator,
    'terminal': Terminal,
    'code': Code,
    'code-xml': CodeXml,
    'bug': Bug,
    'puzzle': Puzzle,
    'lightbulb': Lightbulb,
    // Nature & Weather
    'sun': Sun,
    'moon': Moon,
    'cloud': Cloud,
    'rain': CloudRain,
    'snow': Snowflake,
    'wind': Wind,
    'leaf': Leaf,
    'flower': Flower2,
    'mountain': Mountain,
    'waves': Waves,
    // Objects
    'box': Box,
    'package': Package,
    'briefcase': Briefcase,
    'shopping-bag': ShoppingBag,
    'shopping-cart': ShoppingCart,
    'store': Store,
    'building': Building,
    'building-2': Building2,
    'factory': Factory,
    'warehouse': Warehouse,
    'car': Car,
    'plane': Plane,
    'ship': Ship,
    'truck': Truck,
    // Gaming & Fun
    'gamepad': Gamepad2,
    'dice': Dice5,
    'ghost': Ghost,
    'skull': Skull,
    'bomb': Bomb,
    'rocket': Rocket,
    'swords': Swords,
    'shield-question': ShieldQuestion,
    // Misc
    'globe': Globe,
    'map': Map,
    'map-pin': MapPin,
    'navigation': Navigation,
    'anchor': Anchor,
    'wifi': Wifi,
    'signal': Signal,
    'battery': Battery,
    'power': Power,
    'plug': Plug,
    'cpu': Cpu,
    'hard-drive': HardDrive,
    'database': Database,
    'server': Server,
    'cloud-storage': CloudIcon,
    'cloud-upload': CloudUpload,
    'cloud-download': CloudDownload,
  };

  // Icon categories with clean SVG icons
  const iconCategories = useMemo(() => ({
    'Finance & Crypto': [
      { id: 'bitcoin', label: 'Bitcoin' },
      { id: 'wallet', label: 'Wallet' },
      { id: 'coins', label: 'Coins' },
      { id: 'landmark', label: 'Bank' },
      { id: 'credit-card', label: 'Credit Card' },
      { id: 'banknote', label: 'Banknote' },
      { id: 'dollar-sign', label: 'Dollar Sign' },
      { id: 'piggy-bank', label: 'Piggy Bank' },
      { id: 'receipt', label: 'Receipt' },
      { id: 'trending-up', label: 'Trending Up' },
      { id: 'trending-down', label: 'Trending Down' },
      { id: 'bar-chart', label: 'Bar Chart' },
      { id: 'line-chart', label: 'Line Chart' },
      { id: 'pie-chart', label: 'Pie Chart' },
      { id: 'arrow-up-down', label: 'Up Down' },
      { id: 'exchange', label: 'Exchange' },
      { id: 'dollar', label: 'Dollar' },
      { id: 'euro', label: 'Euro' },
      { id: 'pound', label: 'Pound' },
      { id: 'badge-dollar', label: 'Badge Dollar' },
      { id: 'hand-coins', label: 'Hand Coins' },
    ],
    'Rewards & Achievements': [
      { id: 'gift', label: 'Gift' },
      { id: 'award', label: 'Award' },
      { id: 'trophy', label: 'Trophy' },
      { id: 'star', label: 'Star' },
      { id: 'medal', label: 'Medal' },
      { id: 'crown', label: 'Crown' },
      { id: 'gem', label: 'Gem' },
      { id: 'target', label: 'Target' },
      { id: 'zap', label: 'Zap' },
      { id: 'sparkles', label: 'Sparkles' },
      { id: 'party', label: 'Party' },
      { id: 'cake', label: 'Cake' },
      { id: 'heart', label: 'Heart' },
      { id: 'thumbs-up', label: 'Thumbs Up' },
      { id: 'flame', label: 'Flame' },
    ],
    'Security & Verification': [
      { id: 'shield', label: 'Shield' },
      { id: 'shield-check', label: 'Shield Check' },
      { id: 'shield-alert', label: 'Shield Alert' },
      { id: 'lock', label: 'Lock' },
      { id: 'unlock', label: 'Unlock' },
      { id: 'key', label: 'Key' },
      { id: 'key-round', label: 'Key Round' },
      { id: 'fingerprint', label: 'Fingerprint' },
      { id: 'eye', label: 'Eye' },
      { id: 'eye-off', label: 'Eye Off' },
      { id: 'scan-face', label: 'Face Scan' },
      { id: 'badge-check', label: 'Badge Check' },
      { id: 'circle-check', label: 'Circle Check' },
      { id: 'check-circle', label: 'Check Circle' },
      { id: 'user-check', label: 'User Check' },
      { id: 'file-check', label: 'File Check' },
      { id: 'clipboard-check', label: 'Clipboard Check' },
    ],
    'Documents & Files': [
      { id: 'file', label: 'File' },
      { id: 'file-text', label: 'File Text' },
      { id: 'files', label: 'Files' },
      { id: 'folder', label: 'Folder' },
      { id: 'folder-open', label: 'Folder Open' },
      { id: 'folder-closed', label: 'Folder Closed' },
      { id: 'archive', label: 'Archive' },
      { id: 'file-box', label: 'File Box' },
      { id: 'clipboard-list', label: 'Clipboard List' },
      { id: 'scroll', label: 'Scroll' },
      { id: 'newspaper', label: 'Newspaper' },
      { id: 'book-open', label: 'Book Open' },
      { id: 'book', label: 'Book' },
      { id: 'library', label: 'Library' },
      { id: 'file-signature', label: 'Signature' },
      { id: 'file-badge', label: 'File Badge' },
    ],
    'Communication': [
      { id: 'message-square', label: 'Message' },
      { id: 'message-circle', label: 'Chat' },
      { id: 'mail', label: 'Mail' },
      { id: 'mail-open', label: 'Mail Open' },
      { id: 'send', label: 'Send' },
      { id: 'inbox', label: 'Inbox' },
      { id: 'at-sign', label: 'At Sign' },
      { id: 'phone', label: 'Phone' },
      { id: 'phone-call', label: 'Phone Call' },
      { id: 'video', label: 'Video' },
      { id: 'headphones', label: 'Headphones' },
      { id: 'mic', label: 'Microphone' },
      { id: 'radio', label: 'Radio' },
      { id: 'bell', label: 'Bell' },
      { id: 'bell-ring', label: 'Bell Ring' },
      { id: 'megaphone', label: 'Megaphone' },
    ],
    'Users & People': [
      { id: 'user', label: 'User' },
      { id: 'users', label: 'Users' },
      { id: 'user-plus', label: 'User Plus' },
      { id: 'user-minus', label: 'User Minus' },
      { id: 'user-cog', label: 'User Settings' },
      { id: 'user-circle', label: 'User Circle' },
      { id: 'contact', label: 'Contact' },
      { id: 'users-round', label: 'Users Round' },
      { id: 'circle-user', label: 'Circle User' },
      { id: 'person', label: 'Person' },
      { id: 'baby', label: 'Baby' },
      { id: 'accessibility', label: 'Accessibility' },
    ],
    'Time & Scheduling': [
      { id: 'clock', label: 'Clock' },
      { id: 'timer', label: 'Timer' },
      { id: 'timer-off', label: 'Timer Off' },
      { id: 'hourglass', label: 'Hourglass' },
      { id: 'calendar', label: 'Calendar' },
      { id: 'calendar-days', label: 'Calendar Days' },
      { id: 'calendar-check', label: 'Calendar Check' },
      { id: 'calendar-clock', label: 'Calendar Clock' },
      { id: 'alarm', label: 'Alarm' },
      { id: 'watch', label: 'Watch' },
      { id: 'history', label: 'History' },
      { id: 'rotate', label: 'Rotate' },
    ],
    'Status & Alerts': [
      { id: 'alert-triangle', label: 'Warning' },
      { id: 'alert-circle', label: 'Alert' },
      { id: 'alert-octagon', label: 'Stop' },
      { id: 'info', label: 'Info' },
      { id: 'help', label: 'Help' },
      { id: 'ban', label: 'Ban' },
      { id: 'x-circle', label: 'Error' },
      { id: 'check', label: 'Success' },
      { id: 'circle-dot', label: 'Dot' },
      { id: 'circle', label: 'Circle' },
      { id: 'loader', label: 'Loading' },
      { id: 'refresh', label: 'Refresh' },
      { id: 'refresh-ccw', label: 'Sync' },
    ],
    'Navigation & UI': [
      { id: 'home', label: 'Home' },
      { id: 'settings', label: 'Settings' },
      { id: 'cog', label: 'Cog' },
      { id: 'sliders', label: 'Sliders' },
      { id: 'sliders-h', label: 'Sliders H' },
      { id: 'menu', label: 'Menu' },
      { id: 'more-h', label: 'More' },
      { id: 'more-v', label: 'More V' },
      { id: 'grid', label: 'Grid' },
      { id: 'list', label: 'List' },
      { id: 'layout-grid', label: 'Layout Grid' },
      { id: 'layout-list', label: 'Layout List' },
      { id: 'columns', label: 'Columns' },
      { id: 'rows', label: 'Rows' },
      { id: 'table', label: 'Table' },
    ],
    'Actions': [
      { id: 'plus', label: 'Plus' },
      { id: 'minus', label: 'Minus' },
      { id: 'edit', label: 'Edit' },
      { id: 'edit-2', label: 'Edit 2' },
      { id: 'pencil', label: 'Pencil' },
      { id: 'pen', label: 'Pen' },
      { id: 'trash', label: 'Trash' },
      { id: 'trash-2', label: 'Delete' },
      { id: 'copy', label: 'Copy' },
      { id: 'clipboard', label: 'Clipboard' },
      { id: 'download', label: 'Download' },
      { id: 'upload', label: 'Upload' },
      { id: 'share', label: 'Share' },
      { id: 'share-2', label: 'Share 2' },
      { id: 'external-link', label: 'External' },
      { id: 'link', label: 'Link' },
      { id: 'link-2', label: 'Link 2' },
      { id: 'unlink', label: 'Unlink' },
    ],
    'Media': [
      { id: 'image', label: 'Image' },
      { id: 'images', label: 'Images' },
      { id: 'camera', label: 'Camera' },
      { id: 'film', label: 'Film' },
      { id: 'play', label: 'Play' },
      { id: 'pause', label: 'Pause' },
      { id: 'stop', label: 'Stop' },
      { id: 'volume', label: 'Volume' },
      { id: 'mute', label: 'Mute' },
      { id: 'music', label: 'Music' },
      { id: 'mic-2', label: 'Mic' },
    ],
    'Tags & Labels': [
      { id: 'tag', label: 'Tag' },
      { id: 'tags', label: 'Tags' },
      { id: 'bookmark', label: 'Bookmark' },
      { id: 'bookmark-check', label: 'Bookmark Check' },
      { id: 'flag', label: 'Flag' },
      { id: 'hash', label: 'Hash' },
      { id: 'asterisk', label: 'Asterisk' },
    ],
    'Tools & Work': [
      { id: 'wrench', label: 'Wrench' },
      { id: 'hammer', label: 'Hammer' },
      { id: 'paintbrush', label: 'Paintbrush' },
      { id: 'scissors', label: 'Scissors' },
      { id: 'ruler', label: 'Ruler' },
      { id: 'compass', label: 'Compass' },
      { id: 'calculator', label: 'Calculator' },
      { id: 'terminal', label: 'Terminal' },
      { id: 'code', label: 'Code' },
      { id: 'code-xml', label: 'Code XML' },
      { id: 'bug', label: 'Bug' },
      { id: 'puzzle', label: 'Puzzle' },
      { id: 'lightbulb', label: 'Lightbulb' },
    ],
    'Nature & Weather': [
      { id: 'sun', label: 'Sun' },
      { id: 'moon', label: 'Moon' },
      { id: 'cloud', label: 'Cloud' },
      { id: 'rain', label: 'Rain' },
      { id: 'snow', label: 'Snow' },
      { id: 'wind', label: 'Wind' },
      { id: 'leaf', label: 'Leaf' },
      { id: 'flower', label: 'Flower' },
      { id: 'mountain', label: 'Mountain' },
      { id: 'waves', label: 'Waves' },
    ],
    'Objects & Places': [
      { id: 'box', label: 'Box' },
      { id: 'package', label: 'Package' },
      { id: 'briefcase', label: 'Briefcase' },
      { id: 'shopping-bag', label: 'Shopping Bag' },
      { id: 'shopping-cart', label: 'Cart' },
      { id: 'store', label: 'Store' },
      { id: 'building', label: 'Building' },
      { id: 'building-2', label: 'Office' },
      { id: 'factory', label: 'Factory' },
      { id: 'warehouse', label: 'Warehouse' },
      { id: 'car', label: 'Car' },
      { id: 'plane', label: 'Plane' },
      { id: 'ship', label: 'Ship' },
      { id: 'truck', label: 'Truck' },
    ],
    'Gaming & Fun': [
      { id: 'gamepad', label: 'Gamepad' },
      { id: 'dice', label: 'Dice' },
      { id: 'ghost', label: 'Ghost' },
      { id: 'skull', label: 'Skull' },
      { id: 'bomb', label: 'Bomb' },
      { id: 'rocket', label: 'Rocket' },
      { id: 'swords', label: 'Swords' },
      { id: 'shield-question', label: 'Mystery' },
    ],
    'Technology': [
      { id: 'globe', label: 'Globe' },
      { id: 'map', label: 'Map' },
      { id: 'map-pin', label: 'Pin' },
      { id: 'navigation', label: 'Navigate' },
      { id: 'anchor', label: 'Anchor' },
      { id: 'wifi', label: 'WiFi' },
      { id: 'signal', label: 'Signal' },
      { id: 'battery', label: 'Battery' },
      { id: 'power', label: 'Power' },
      { id: 'plug', label: 'Plug' },
      { id: 'cpu', label: 'CPU' },
      { id: 'hard-drive', label: 'Hard Drive' },
      { id: 'database', label: 'Database' },
      { id: 'server', label: 'Server' },
      { id: 'cloud-storage', label: 'Cloud' },
      { id: 'cloud-upload', label: 'Cloud Upload' },
      { id: 'cloud-download', label: 'Cloud Down' },
    ],
  }), []);

  // Render icon component
  const renderIcon = (iconId, size = 20) => {
    const IconComponent = iconComponents[iconId];
    if (IconComponent) {
      return <IconComponent size={size} strokeWidth={1.5} />;
    }
    return <Folder size={size} strokeWidth={1.5} />;
  };

  // Filter icons based on search
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return iconCategories;

    const query = searchQuery.toLowerCase();
    const filtered = {};

    for (const [category, icons] of Object.entries(iconCategories)) {
      const matchingIcons = icons.filter(
        icon =>
          icon.label.toLowerCase().includes(query) ||
          icon.id.toLowerCase().includes(query)
      );
      if (matchingIcons.length > 0) {
        filtered[category] = matchingIcons;
      }
    }

    return filtered;
  }, [searchQuery, iconCategories]);

  const allFilteredIcons = useMemo(() => {
    return Object.values(filteredCategories).flat();
  }, [filteredCategories]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`
        relative w-full max-w-lg max-h-[80vh] rounded-xl shadow-2xl overflow-hidden
        ${isDarkMode ? 'bg-neutral-900 border border-white/10' : 'bg-white border border-gray-200'}
      `}>
        {/* Header */}
        <div className={`
          flex items-center justify-between px-4 py-3 border-b
          ${isDarkMode ? 'border-white/10' : 'border-gray-200'}
        `}>
          <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Choose Icon
          </h3>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
          <div className={`
            flex items-center gap-2 px-3 py-2 rounded-lg
            ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}
          `}>
            <Search size={16} className="text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search icons..."
              className={`
                flex-1 bg-transparent outline-none text-sm
                ${isDarkMode ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}
              `}
              autoFocus
            />
          </div>
        </div>

        {/* Icon Grid */}
        <div className="overflow-y-auto max-h-[450px] p-4">
          {Object.keys(filteredCategories).length === 0 ? (
            <div className="text-center py-8">
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                No icons found
              </p>
            </div>
          ) : searchQuery.trim() ? (
            /* Flat grid when searching */
            <div className="grid grid-cols-8 gap-1">
              {allFilteredIcons.map((icon) => (
                <button
                  key={icon.id}
                  onClick={() => onSelect(icon.id)}
                  title={icon.label}
                  className={`
                    relative p-2.5 rounded-lg flex items-center justify-center
                    transition-all duration-150
                    ${currentIcon === icon.id
                      ? 'ring-2 ring-blue-500'
                      : isDarkMode
                        ? 'hover:bg-white/10'
                        : 'hover:bg-gray-100'
                    }
                    ${isDarkMode ? 'text-white' : 'text-gray-700'}
                  `}
                  style={{
                    backgroundColor: currentIcon === icon.id ? `${color}20` : undefined
                  }}
                >
                  {renderIcon(icon.id, 18)}
                </button>
              ))}
            </div>
          ) : (
            /* Categorized view */
            <div className="space-y-4">
              {Object.entries(filteredCategories).map(([category, icons]) => (
                <div key={category}>
                  <h4 className={`text-xs font-semibold uppercase tracking-wide mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {category}
                  </h4>
                  <div className="grid grid-cols-8 gap-1">
                    {icons.map((icon) => (
                      <button
                        key={icon.id}
                        onClick={() => onSelect(icon.id)}
                        title={icon.label}
                        className={`
                          relative p-2.5 rounded-lg flex items-center justify-center
                          transition-all duration-150
                          ${currentIcon === icon.id
                            ? 'ring-2 ring-blue-500'
                            : isDarkMode
                              ? 'hover:bg-white/10'
                              : 'hover:bg-gray-100'
                          }
                          ${isDarkMode ? 'text-white' : 'text-gray-700'}
                        `}
                        style={{
                          backgroundColor: currentIcon === icon.id ? `${color}20` : undefined
                        }}
                      >
                        {renderIcon(icon.id, 18)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Current Selection Preview */}
        <div className={`
          flex items-center justify-between px-4 py-3 border-t
          ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}
        `}>
          <div className="flex items-center gap-2">
            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Selected:
            </span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDarkMode ? 'text-white' : 'text-gray-700'}`}
              style={{ backgroundColor: `${color}20` }}
            >
              {renderIcon(currentIcon, 18)}
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CategoryIconPicker;
