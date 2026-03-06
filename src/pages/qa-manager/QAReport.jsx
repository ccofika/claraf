import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  Search, Loader2, Plus, Trash2, Pencil, Play, ChevronLeft, ChevronRight,
  ArrowLeft, X, Tag, Users, UserRound, Globe, MessageSquare, Calendar,
  Filter, Copy, FileText, Ticket, Clock, ChevronDown, Check,
  Zap, MapPin, DollarSign, Link2, Archive, Gift, Dice5, Landmark,
  CreditCard, Gamepad2, Trophy, ShieldCheck, KeyRound, AlertTriangle,
  StickyNote, BarChart3, Wallet, Fingerprint, Lock, Flag, Gauge,
  RefreshCw, UserCog, RotateCw, Timer, Monitor, TrendingUp, Bookmark,
  ScrollText, Slash, ArrowDownUp, Star, Megaphone, Percent
} from 'lucide-react';
import { toast } from 'sonner';
import { useQAManager } from '../../context/QAManagerContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { DatePicker } from '../../components/ui/date-picker';
import { Button } from './components';
import ConversationPanel from '../../components/ConversationPanel';
import { useMinimizedTicket } from '../../context/MinimizedTicketContext';
import { staggerContainer, staggerItem } from '../../utils/animations';

const API_URL = process.env.REACT_APP_API_URL;

// Predefined Intercom topic options
const INTERCOM_TOPICS = [
  'promotion, benefits, weekly bonus, bonus, Rakeback, affiliate bonus, wager bonus, bonus drop, forum promotion, challenge',
  'Bonus (Expanded List)',
  'Promociones | Spanish',
  'Bonus (English)',
  'Available bonus',
  'Payment | Spanish',
  'Area restringida | Spanish',
  'inr, bic, ifsc, rupee, indian',
  'French | Transactions',
  'Sports',
  'KYC | Fraude Spanish',
  'French | Bonuses',
  'Criptomonedas | Spanish',
  'French | KYC',
  'USDT issue',
  'Money',
  'Casino',
  'Documents',
  'Juegos en vivo | Spanish',
  'Mantenimiento | Spanish',
  'Turkish | TRY FIAT',
  'RTP | Spanish',
  'usdt | Russia',
  'Monthly bonus',
  'Crypto',
  'KYC | Russia',
  'Crypto deposit | Crypto withdrawal | Token',
  'KYC | Fraud',
  'Affiliate',
  'Turkish | Bonuses',
  'RG | Spanish',
  'RG',
  'Coin mixing | AML | WR',
  'Límites de apuesta | Límites de juego | Spanish',
  'Coin mixing | AML | WR | Russia',
  'Seguridad | Spanish',
  'AC/SE | Spanish',
  'бонус | Russia',
  'Wager limits | Gambling limits',
  'Maintenance',
  'Restricted | situations related to ToS',
  'CAD, CA$, $CA',
  'Security changes',
  'Turkish | KYC',
  'affiliate | Russia',
  'Mute',
  'French | Affiliate',
  'крипта | Russia',
  'Live games, Evolution, Pragmatic, Rejected bets',
  'Security changes | Russia',
  'Account closure',
  'RTP, bad luck, losing streak, rigged, scam',
  'Telegram',
  'Solana issue',
  'TRX/TRON/TRC20',
  'Pending INR deposit, successful INR deposit, successful INR withdrawal, Pending INR withdrawal, Too many PSP Accounts, Too many payment methods',
  'Withdraw (POR)',
  'Data deletion , Data deletion request',
  'промоция',
  'Astropay/ARS',
  'Телеграм | Russia',
  'Maintenance eng',
  'Forwarded email',
  'Poker',
  'Bonus (JPN)',
  'онлайн игры | Russia',
  'взломал | Russia',
  'NGN fiat',
  'Slots',
  '你好',
  'Tech support',
  'Deposit (Portuguese)',
  'деньги | Russia',
  'Ontario IP address geo-blocking',
  'регион | situations related to ToS | Russian',
  'suicidal, gambling addiction, gambling problems, financial difficutlies',
  'hacked, stolen, ハッキングされた, 盗まれた, hackeado, roubado, アカウントが乗っ取られた...',
  'ВИП привилегии | Russia',
  'VIP | VIP host',
  'ежемесячный бону',
  'Arabic | Bonuses',
  'Documents (POR)',
  'Live games inquires',
  'Hacked / Phishing',
  'Mezcla de monedas | AML',
  'Cashout',
  'Deposit (JPN)',
  'удача, скам | Russia',
  'Crash game',
  'спорт | Russia',
  'Crash',
  'Sold/bought accounts',
  'отправить письмо | Russia',
  'Plinko',
  'France, French, Francais',
  'Sports (POR)',
  'Casino (JPN)',
  'слот | Russia',
  'Arabic | KYC',
  'Wager limits | Gambling limits | Russia',
  'Eliminación de datos | Spanish',
  'покер | Russia',
  'удалить аккаунт | Russia',
  'закрытие аккаунта | Russia',
  'RG | Russia',
  'Affiliate (POR)',
  'Bonus (POR)',
  'техкоманда | Russia',
  'конвертация | Fiat | Russia',
  'Crash game | Russia',
  'мут | Russia',
  'competitor',
  'Freecash.com',
  'hellostake',
  'Live games | Russia',
  'Casino (POR)',
].map((name, i) => ({ id: String(i), name }));

// ISO 3166-1 alpha-2 country codes (matching Intercom KYC Country attribute)
const KYC_COUNTRIES = [
  { code: 'AF', name: 'Afghanistan' }, { code: 'AX', name: 'Åland Islands' }, { code: 'AL', name: 'Albania' },
  { code: 'DZ', name: 'Algeria' }, { code: 'AS', name: 'American Samoa' }, { code: 'AD', name: 'Andorra' },
  { code: 'AO', name: 'Angola' }, { code: 'AI', name: 'Anguilla' }, { code: 'AQ', name: 'Antarctica' },
  { code: 'AG', name: 'Antigua and Barbuda' }, { code: 'AR', name: 'Argentina' }, { code: 'AM', name: 'Armenia' },
  { code: 'AW', name: 'Aruba' }, { code: 'AU', name: 'Australia' }, { code: 'AT', name: 'Austria' },
  { code: 'AZ', name: 'Azerbaijan' }, { code: 'BS', name: 'Bahamas' }, { code: 'BH', name: 'Bahrain' },
  { code: 'BD', name: 'Bangladesh' }, { code: 'BB', name: 'Barbados' }, { code: 'BY', name: 'Belarus' },
  { code: 'BE', name: 'Belgium' }, { code: 'BZ', name: 'Belize' }, { code: 'BJ', name: 'Benin' },
  { code: 'BM', name: 'Bermuda' }, { code: 'BT', name: 'Bhutan' }, { code: 'BO', name: 'Bolivia' },
  { code: 'BQ', name: 'Bonaire, Sint Eustatius and Saba' }, { code: 'BA', name: 'Bosnia and Herzegovina' },
  { code: 'BW', name: 'Botswana' }, { code: 'BV', name: 'Bouvet Island' }, { code: 'BR', name: 'Brazil' },
  { code: 'IO', name: 'British Indian Ocean Territory' }, { code: 'BN', name: 'Brunei Darussalam' },
  { code: 'BG', name: 'Bulgaria' }, { code: 'BF', name: 'Burkina Faso' }, { code: 'BI', name: 'Burundi' },
  { code: 'CV', name: 'Cabo Verde' }, { code: 'KH', name: 'Cambodia' }, { code: 'CM', name: 'Cameroon' },
  { code: 'CA', name: 'Canada' }, { code: 'KY', name: 'Cayman Islands' }, { code: 'CF', name: 'Central African Republic' },
  { code: 'TD', name: 'Chad' }, { code: 'CL', name: 'Chile' }, { code: 'CN', name: 'China' },
  { code: 'CX', name: 'Christmas Island' }, { code: 'CC', name: 'Cocos (Keeling) Islands' }, { code: 'CO', name: 'Colombia' },
  { code: 'KM', name: 'Comoros' }, { code: 'CG', name: 'Congo' }, { code: 'CD', name: 'Congo (DRC)' },
  { code: 'CK', name: 'Cook Islands' }, { code: 'CR', name: 'Costa Rica' }, { code: 'CI', name: "Côte d'Ivoire" },
  { code: 'HR', name: 'Croatia' }, { code: 'CU', name: 'Cuba' }, { code: 'CW', name: 'Curaçao' },
  { code: 'CY', name: 'Cyprus' }, { code: 'CZ', name: 'Czechia' }, { code: 'DK', name: 'Denmark' },
  { code: 'DJ', name: 'Djibouti' }, { code: 'DM', name: 'Dominica' }, { code: 'DO', name: 'Dominican Republic' },
  { code: 'EC', name: 'Ecuador' }, { code: 'EG', name: 'Egypt' }, { code: 'SV', name: 'El Salvador' },
  { code: 'GQ', name: 'Equatorial Guinea' }, { code: 'ER', name: 'Eritrea' }, { code: 'EE', name: 'Estonia' },
  { code: 'SZ', name: 'Eswatini' }, { code: 'ET', name: 'Ethiopia' }, { code: 'FK', name: 'Falkland Islands' },
  { code: 'FO', name: 'Faroe Islands' }, { code: 'FJ', name: 'Fiji' }, { code: 'FI', name: 'Finland' },
  { code: 'FR', name: 'France' }, { code: 'GF', name: 'French Guiana' }, { code: 'PF', name: 'French Polynesia' },
  { code: 'TF', name: 'French Southern Territories' }, { code: 'GA', name: 'Gabon' }, { code: 'GM', name: 'Gambia' },
  { code: 'GE', name: 'Georgia' }, { code: 'DE', name: 'Germany' }, { code: 'GH', name: 'Ghana' },
  { code: 'GI', name: 'Gibraltar' }, { code: 'GR', name: 'Greece' }, { code: 'GL', name: 'Greenland' },
  { code: 'GD', name: 'Grenada' }, { code: 'GP', name: 'Guadeloupe' }, { code: 'GU', name: 'Guam' },
  { code: 'GT', name: 'Guatemala' }, { code: 'GG', name: 'Guernsey' }, { code: 'GN', name: 'Guinea' },
  { code: 'GW', name: 'Guinea-Bissau' }, { code: 'GY', name: 'Guyana' }, { code: 'HT', name: 'Haiti' },
  { code: 'HM', name: 'Heard Island and McDonald Islands' }, { code: 'VA', name: 'Holy See' },
  { code: 'HN', name: 'Honduras' }, { code: 'HK', name: 'Hong Kong' }, { code: 'HU', name: 'Hungary' },
  { code: 'IS', name: 'Iceland' }, { code: 'IN', name: 'India' }, { code: 'ID', name: 'Indonesia' },
  { code: 'IR', name: 'Iran' }, { code: 'IQ', name: 'Iraq' }, { code: 'IE', name: 'Ireland' },
  { code: 'IM', name: 'Isle of Man' }, { code: 'IL', name: 'Israel' }, { code: 'IT', name: 'Italy' },
  { code: 'JM', name: 'Jamaica' }, { code: 'JP', name: 'Japan' }, { code: 'JE', name: 'Jersey' },
  { code: 'JO', name: 'Jordan' }, { code: 'KZ', name: 'Kazakhstan' }, { code: 'KE', name: 'Kenya' },
  { code: 'KI', name: 'Kiribati' }, { code: 'KP', name: 'North Korea' }, { code: 'KR', name: 'South Korea' },
  { code: 'KW', name: 'Kuwait' }, { code: 'KG', name: 'Kyrgyzstan' }, { code: 'LA', name: 'Laos' },
  { code: 'LV', name: 'Latvia' }, { code: 'LB', name: 'Lebanon' }, { code: 'LS', name: 'Lesotho' },
  { code: 'LR', name: 'Liberia' }, { code: 'LY', name: 'Libya' }, { code: 'LI', name: 'Liechtenstein' },
  { code: 'LT', name: 'Lithuania' }, { code: 'LU', name: 'Luxembourg' }, { code: 'MO', name: 'Macao' },
  { code: 'MG', name: 'Madagascar' }, { code: 'MW', name: 'Malawi' }, { code: 'MY', name: 'Malaysia' },
  { code: 'MV', name: 'Maldives' }, { code: 'ML', name: 'Mali' }, { code: 'MT', name: 'Malta' },
  { code: 'MH', name: 'Marshall Islands' }, { code: 'MQ', name: 'Martinique' }, { code: 'MR', name: 'Mauritania' },
  { code: 'MU', name: 'Mauritius' }, { code: 'YT', name: 'Mayotte' }, { code: 'MX', name: 'Mexico' },
  { code: 'FM', name: 'Micronesia' }, { code: 'MD', name: 'Moldova' }, { code: 'MC', name: 'Monaco' },
  { code: 'MN', name: 'Mongolia' }, { code: 'ME', name: 'Montenegro' }, { code: 'MS', name: 'Montserrat' },
  { code: 'MA', name: 'Morocco' }, { code: 'MZ', name: 'Mozambique' }, { code: 'MM', name: 'Myanmar' },
  { code: 'NA', name: 'Namibia' }, { code: 'NR', name: 'Nauru' }, { code: 'NP', name: 'Nepal' },
  { code: 'NL', name: 'Netherlands' }, { code: 'NC', name: 'New Caledonia' }, { code: 'NZ', name: 'New Zealand' },
  { code: 'NI', name: 'Nicaragua' }, { code: 'NE', name: 'Niger' }, { code: 'NG', name: 'Nigeria' },
  { code: 'NU', name: 'Niue' }, { code: 'NF', name: 'Norfolk Island' }, { code: 'MK', name: 'North Macedonia' },
  { code: 'MP', name: 'Northern Mariana Islands' }, { code: 'NO', name: 'Norway' }, { code: 'OM', name: 'Oman' },
  { code: 'PK', name: 'Pakistan' }, { code: 'PW', name: 'Palau' }, { code: 'PS', name: 'Palestine' },
  { code: 'PA', name: 'Panama' }, { code: 'PG', name: 'Papua New Guinea' }, { code: 'PY', name: 'Paraguay' },
  { code: 'PE', name: 'Peru' }, { code: 'PH', name: 'Philippines' }, { code: 'PN', name: 'Pitcairn' },
  { code: 'PL', name: 'Poland' }, { code: 'PT', name: 'Portugal' }, { code: 'PR', name: 'Puerto Rico' },
  { code: 'QA', name: 'Qatar' }, { code: 'RE', name: 'Réunion' }, { code: 'RO', name: 'Romania' },
  { code: 'RU', name: 'Russia' }, { code: 'RW', name: 'Rwanda' }, { code: 'BL', name: 'Saint Barthélemy' },
  { code: 'SH', name: 'Saint Helena' }, { code: 'KN', name: 'Saint Kitts and Nevis' },
  { code: 'LC', name: 'Saint Lucia' }, { code: 'MF', name: 'Saint Martin' },
  { code: 'PM', name: 'Saint Pierre and Miquelon' }, { code: 'VC', name: 'Saint Vincent and the Grenadines' },
  { code: 'WS', name: 'Samoa' }, { code: 'SM', name: 'San Marino' }, { code: 'ST', name: 'São Tomé and Príncipe' },
  { code: 'SA', name: 'Saudi Arabia' }, { code: 'SN', name: 'Senegal' }, { code: 'RS', name: 'Serbia' },
  { code: 'SC', name: 'Seychelles' }, { code: 'SL', name: 'Sierra Leone' }, { code: 'SG', name: 'Singapore' },
  { code: 'SX', name: 'Sint Maarten' }, { code: 'SK', name: 'Slovakia' }, { code: 'SI', name: 'Slovenia' },
  { code: 'SB', name: 'Solomon Islands' }, { code: 'SO', name: 'Somalia' }, { code: 'ZA', name: 'South Africa' },
  { code: 'GS', name: 'South Georgia' }, { code: 'SS', name: 'South Sudan' }, { code: 'ES', name: 'Spain' },
  { code: 'LK', name: 'Sri Lanka' }, { code: 'SD', name: 'Sudan' }, { code: 'SR', name: 'Suriname' },
  { code: 'SJ', name: 'Svalbard and Jan Mayen' }, { code: 'SE', name: 'Sweden' }, { code: 'CH', name: 'Switzerland' },
  { code: 'SY', name: 'Syria' }, { code: 'TW', name: 'Taiwan' }, { code: 'TJ', name: 'Tajikistan' },
  { code: 'TZ', name: 'Tanzania' }, { code: 'TH', name: 'Thailand' }, { code: 'TL', name: 'Timor-Leste' },
  { code: 'TG', name: 'Togo' }, { code: 'TK', name: 'Tokelau' }, { code: 'TO', name: 'Tonga' },
  { code: 'TT', name: 'Trinidad and Tobago' }, { code: 'TN', name: 'Tunisia' }, { code: 'TR', name: 'Turkey' },
  { code: 'TM', name: 'Turkmenistan' }, { code: 'TC', name: 'Turks and Caicos Islands' }, { code: 'TV', name: 'Tuvalu' },
  { code: 'UG', name: 'Uganda' }, { code: 'UA', name: 'Ukraine' }, { code: 'AE', name: 'United Arab Emirates' },
  { code: 'GB', name: 'United Kingdom' }, { code: 'US', name: 'United States' },
  { code: 'UM', name: 'United States Minor Outlying Islands' }, { code: 'UY', name: 'Uruguay' },
  { code: 'UZ', name: 'Uzbekistan' }, { code: 'VU', name: 'Vanuatu' }, { code: 'VE', name: 'Venezuela' },
  { code: 'VN', name: 'Vietnam' }, { code: 'VG', name: 'Virgin Islands (British)' },
  { code: 'VI', name: 'Virgin Islands (U.S.)' }, { code: 'WF', name: 'Wallis and Futuna' },
  { code: 'EH', name: 'Western Sahara' }, { code: 'YE', name: 'Yemen' }, { code: 'ZM', name: 'Zambia' },
  { code: 'ZW', name: 'Zimbabwe' },
].map(c => ({ id: c.code, name: `${c.code} — ${c.name}` }));

// ============================================
// SEARCHABLE DROPDOWN COMPONENT
// ============================================

const SearchableDropdown = ({ items, selected, onSelect, onRemove, placeholder, labelKey = 'name', idKey = 'id', multi = true }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close dropdown when focus leaves the container entirely
  const handleBlur = useCallback((e) => {
    requestAnimationFrame(() => {
      if (ref.current && !ref.current.contains(document.activeElement)) {
        setOpen(false);
      }
    });
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(i => (i[labelKey] || '').toLowerCase().includes(q));
  }, [items, search, labelKey]);

  const selectedIds = new Set((selected || []).map(s => s[idKey] || s));

  return (
    <div ref={ref} className="relative" onBlur={handleBlur}>
      <div
        className="min-h-[36px] flex flex-wrap gap-1 items-center px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-white/5 cursor-text transition-colors"
        onClick={() => setOpen(true)}
      >
        {(selected || []).map(s => (
          <span key={s[idKey] || s} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-200/80 dark:bg-white/10 text-xs text-gray-700 dark:text-white/80">
            {s[labelKey] || s}
            <X className="w-3 h-3 cursor-pointer hover:text-gray-900 dark:hover:text-white" onClick={(e) => { e.stopPropagation(); onRemove(s); }} />
          </span>
        ))}
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
          placeholder={selected?.length ? '' : placeholder}
          className="flex-1 min-w-[80px] bg-transparent text-sm text-gray-900 dark:text-white/90 outline-none placeholder:text-gray-400 dark:placeholder:text-white/30"
          onFocus={() => setOpen(true)}
        />
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-lg dark:shadow-xl">
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-xs text-gray-400 dark:text-white/40">No results</div>
          )}
          {filtered.slice(0, 100).map(item => {
            const isSelected = selectedIds.has(item[idKey]);
            return (
              <button
                key={item[idKey]}
                className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-white/10 flex items-center gap-2 ${isSelected ? 'text-gray-400 dark:text-white/40' : 'text-gray-700 dark:text-white/80'}`}
                onClick={() => {
                  if (isSelected) {
                    onRemove(item);
                  } else {
                    onSelect(item);
                    if (!multi) setOpen(false);
                  }
                  setSearch('');
                }}
              >
                {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                {item[labelKey]}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ============================================
// CHIP INPUT (for Topics — free text)
// ============================================

const ChipInput = ({ values, onChange, placeholder }) => {
  const [input, setInput] = useState('');

  const addChip = () => {
    const val = input.trim();
    if (val && !values.includes(val)) {
      onChange([...values, val]);
    }
    setInput('');
  };

  return (
    <div className="min-h-[36px] flex flex-wrap gap-1 items-center px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-white/5 transition-colors">
      {values.map(v => (
        <span key={v} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-200/80 dark:bg-white/10 text-xs text-gray-700 dark:text-white/80">
          {v}
          <X className="w-3 h-3 cursor-pointer hover:text-gray-900 dark:hover:text-white" onClick={() => onChange(values.filter(x => x !== v))} />
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addChip(); } if (e.key === ',' ) { e.preventDefault(); addChip(); } }}
        onBlur={addChip}
        placeholder={values.length ? '' : placeholder}
        className="flex-1 min-w-[80px] bg-transparent text-sm text-gray-900 dark:text-white/90 outline-none placeholder:text-gray-400 dark:placeholder:text-white/30"
      />
    </div>
  );
};

// ============================================
// OPERATOR TOGGLE (is / is_not)
// ============================================

const OperatorToggle = ({ value, onChange }) => (
  <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-white/10 text-xs">
    <button
      className={`px-2.5 py-1 transition-colors ${value === 'is' ? 'bg-gray-100 dark:bg-white/15 text-gray-900 dark:text-white' : 'bg-white dark:bg-white/5 text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white/60'}`}
      onClick={() => onChange('is')}
    >
      is
    </button>
    <button
      className={`px-2.5 py-1 transition-colors ${value === 'is_not' ? 'bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-300' : 'bg-white dark:bg-white/5 text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white/60'}`}
      onClick={() => onChange('is_not')}
    >
      is not
    </button>
  </div>
);

// ============================================
// METADATA STRIP — single row, expand on overflow
// ============================================

const MetadataStrip = ({ conv, stateVal, topics, tags, conversationMeta }) => {
  const stripRef = useRef(null);
  const innerRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    if (expanded) return; // Only check when collapsed
    const check = () => {
      if (stripRef.current && innerRef.current) {
        setOverflows(innerRef.current.scrollWidth > stripRef.current.clientWidth);
      }
    };
    check();
    const ro = new ResizeObserver(check);
    if (stripRef.current) ro.observe(stripRef.current);
    return () => ro.disconnect();
  }, [conv?.id, topics, tags, conversationMeta, expanded]);

  // Reset expanded when conversation changes
  useEffect(() => { setExpanded(false); }, [conv?.id]);

  return (
    <div className="flex-shrink-0 border-b border-gray-100 dark:border-white/[0.04] bg-gray-50/50 dark:bg-white/[0.02] overflow-hidden">
      <div className="flex items-start">
        <div
          ref={stripRef}
          className="flex-1 min-w-0 px-4 py-2 overflow-hidden"
        >
          <div
            ref={innerRef}
            className={`flex items-center gap-2 ${expanded ? 'flex-wrap' : 'flex-nowrap'}`}
          >
            <button
              onClick={() => { navigator.clipboard.writeText(conv.id); toast.success('Copied'); }}
              className="inline-flex items-center gap-1 text-[10px] font-mono text-gray-400 dark:text-white/35 hover:text-gray-600 dark:hover:text-white/60 transition-colors flex-shrink-0"
              title="Copy conversation ID"
            >
              <span className="text-gray-300 dark:text-white/20">#</span>{conv.id}
              <Copy className="w-2.5 h-2.5" />
            </button>

            {(conversationMeta?.contactExternalId || conv.contactExternalId) && (
              <span className="text-[10px] font-mono text-gray-400 dark:text-white/30 flex-shrink-0" title="Contact External ID">
                <span className="text-gray-300 dark:text-white/15">ext:</span> {conversationMeta?.contactExternalId || conv.contactExternalId}
              </span>
            )}

            {conversationMeta?.kycCountry && (
              <span className="text-[10px] font-medium text-amber-700 dark:text-amber-400/70 bg-amber-50 dark:bg-amber-400/[0.08] px-1.5 py-0.5 rounded border border-amber-200/60 dark:border-amber-400/10 flex-shrink-0" title="KYC Country">
                {conversationMeta.kycCountry}
              </span>
            )}

            <span className={`inline-flex items-center gap-1 text-[10px] capitalize px-1.5 py-0.5 rounded border flex-shrink-0 ${
              stateVal === 'open'
                ? 'text-emerald-700 dark:text-emerald-400/70 bg-emerald-50 dark:bg-emerald-500/[0.08] border-emerald-200/60 dark:border-emerald-500/10'
                : stateVal === 'snoozed'
                ? 'text-amber-700 dark:text-amber-400/70 bg-amber-50 dark:bg-amber-500/[0.08] border-amber-200/60 dark:border-amber-500/10'
                : 'text-gray-500 dark:text-white/30 bg-gray-100 dark:bg-white/[0.03] border-gray-200 dark:border-white/[0.05]'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                stateVal === 'open' ? 'bg-emerald-500' :
                stateVal === 'snoozed' ? 'bg-amber-400' :
                'bg-gray-400 dark:bg-neutral-500'
              }`} />
              {stateVal}
            </span>

            {topics.map(t => (
              <span key={t} className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-blue-50 dark:bg-blue-500/[0.08] text-blue-600 dark:text-blue-300/70 border border-blue-100 dark:border-blue-500/[0.08] flex-shrink-0">
                {t}
              </span>
            ))}

            {tags.map(t => (
              <span key={t.id || t} className="px-1.5 py-0.5 rounded text-[9px] bg-gray-100 dark:bg-white/[0.03] text-gray-500 dark:text-white/30 border border-gray-200 dark:border-white/[0.05] flex-shrink-0">
                {t.name || t}
              </span>
            ))}

            {(conversationMeta?.aiTitle || conv.aiTitle) && (
              <span className="text-[10px] text-gray-500 dark:text-white/40 italic flex-shrink-0" title={conversationMeta?.aiTitle || conv.aiTitle}>
                {conversationMeta?.aiTitle || conv.aiTitle}
              </span>
            )}
          </div>
        </div>

        {overflows && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex-shrink-0 px-2 py-2 text-gray-400 dark:text-white/30 hover:text-gray-600 dark:hover:text-white/50 transition-colors"
            title={expanded ? 'Collapse' : 'Show all'}
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

const QAReport = () => {
  const { getAuthHeaders, agents, openTicketDialog, restoreFromMinimized } = useQAManager();
  const { minimizedTicket, clearMinimizedTicket, setRestoreRequested } = useMinimizedTicket();
  const [searchParams, setSearchParams] = useSearchParams();

  // Views: 'templates' | 'drill-in'
  const [view, setView] = useState('templates');
  const restoredRef = useRef(false);

  // Template state
  const [templates, setTemplates] = useState([]);
  const [defaultTemplates, setDefaultTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  // Editor dialog
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [editorName, setEditorName] = useState('');
  const [editorFilters, setEditorFilters] = useState({});
  const [saving, setSaving] = useState(false);

  // Reference data
  const [refData, setRefData] = useState({ admins: [], teams: [], tags: [] });
  const [loadingRefData, setLoadingRefData] = useState(false);

  // Report results (drill-in)
  const [reportResults, setReportResults] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [executing, setExecuting] = useState(false);
  const [activeFilters, setActiveFilters] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [conversationMeta, setConversationMeta] = useState(null);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [activeTemplateName, setActiveTemplateName] = useState('');
  const [activeTemplateId, setActiveTemplateId] = useState(null);

  // ACP state
  const [acpStatus, setAcpStatus] = useState(null); // { connected, expired, expiresAt }
  const [acpData, setAcpData] = useState(null);
  const [acpLoading, setAcpLoading] = useState(false);
  const [acpError, setAcpError] = useState(null);
  const [acpApiToken, setAcpApiToken] = useState(null);
  const [acpSidebarHover, setAcpSidebarHover] = useState(false);
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const [acpVisibleSections, setAcpVisibleSections] = useState([]); // ordered list of added section ids
  const [acpExpandedSections, setAcpExpandedSections] = useState(new Set());

  // Casino section state
  const [casinoTab, setCasinoTab] = useState('bets');
  const [casinoBets, setCasinoBets] = useState([]);
  const [casinoBetsLoading, setCasinoBetsLoading] = useState(false);
  const [casinoBetsPage, setCasinoBetsPage] = useState(0);
  const [casinoBetsHasMore, setCasinoBetsHasMore] = useState(false);
  const [casinoGames, setCasinoGames] = useState([]);
  const [casinoGamesLoading, setCasinoGamesLoading] = useState(false);
  const [casinoGamesSort, setCasinoGamesSort] = useState('wagered');
  const [casinoActiveOrig, setCasinoActiveOrig] = useState(null);
  const [casinoActiveOrigLoading, setCasinoActiveOrigLoading] = useState(false);
  const [casinoActive3p, setCasinoActive3p] = useState(null);
  const [casinoActive3pLoading, setCasinoActive3pLoading] = useState(false);

  // Deposit Limits
  const [depLimitTab, setDepLimitTab] = useState('active');
  const [depLimitHistory, setDepLimitHistory] = useState([]);
  const [depLimitHistoryLoading, setDepLimitHistoryLoading] = useState(false);

  // Gambling Limits
  const [gambLimitTab, setGambLimitTab] = useState('active');
  const [gambLimitHistory, setGambLimitHistory] = useState([]);
  const [gambLimitHistoryLoading, setGambLimitHistoryLoading] = useState(false);

  // Notes (ACP)
  const [acpNotes, setAcpNotes] = useState([]);
  const [acpNotesLoading, setAcpNotesLoading] = useState(false);
  const [acpNotesPage, setAcpNotesPage] = useState(0);
  const [acpNotesHasMore, setAcpNotesHasMore] = useState(false);
  const [acpNotesType, setAcpNotesType] = useState('all');

  // Overall (Currency Summary + Balances)
  const [overallTab, setOverallTab] = useState('currency-summary');
  const [overallData, setOverallData] = useState(null);
  const [overallLoading, setOverallLoading] = useState(false);

  // Rakeback
  const [rakebackTab, setRakebackTab] = useState('balances');
  const [rakebackClaims, setRakebackClaims] = useState([]);
  const [rakebackClaimsLoading, setRakebackClaimsLoading] = useState(false);

  // Reload (Faucet)
  const [reloadData, setReloadData] = useState([]);
  const [reloadLoading, setReloadLoading] = useState(false);
  const [reloadPage, setReloadPage] = useState(0);
  const [reloadHasMore, setReloadHasMore] = useState(false);

  // Rollover
  const [rolloverData, setRolloverData] = useState([]);
  const [rolloverLoading, setRolloverLoading] = useState(false);
  const [rolloverPage, setRolloverPage] = useState(0);
  const [rolloverHasMore, setRolloverHasMore] = useState(false);

  // Sessions
  const [sessionsTab, setSessionsTab] = useState('internal');
  const [sessionsInternal, setSessionsInternal] = useState([]);
  const [sessionsInternalLoading, setSessionsInternalLoading] = useState(false);
  const [sessionsInternalPage, setSessionsInternalPage] = useState(0);
  const [sessionsInternalHasMore, setSessionsInternalHasMore] = useState(false);
  const [sessionsInternalFilter, setSessionsInternalFilter] = useState('all');
  const [sessionsSoftswiss, setSessionsSoftswiss] = useState(null);
  const [sessionsSoftswissLoading, setSessionsSoftswissLoading] = useState(false);
  const [sessions3p, setSessions3p] = useState([]);
  const [sessions3pLoading, setSessions3pLoading] = useState(false);
  const [sessions3pProvider, setSessions3pProvider] = useState('beter');
  const [sessions3pPage, setSessions3pPage] = useState(0);
  const [sessions3pHasMore, setSessions3pHasMore] = useState(false);

  // Sportsbook
  const [sportsTab, setSportsTab] = useState('active');
  const [sportsActive, setSportsActive] = useState([]);
  const [sportsActiveLoading, setSportsActiveLoading] = useState(false);
  const [sportsActivePage, setSportsActivePage] = useState(0);
  const [sportsActiveHasMore, setSportsActiveHasMore] = useState(false);
  const [sportsResolved, setSportsResolved] = useState([]);
  const [sportsResolvedLoading, setSportsResolvedLoading] = useState(false);
  const [sportsResolvedPage, setSportsResolvedPage] = useState(0);
  const [sportsResolvedHasMore, setSportsResolvedHasMore] = useState(false);

  // Legs tooltip (fixed-position portal)
  const [legsTooltip, setLegsTooltip] = useState(null); // { lines, games, x, y }

  // Swish Markets
  const [swishTab, setSwishTab] = useState('bets');
  const [swishBetsFilter, setSwishBetsFilter] = useState('active');
  const [swishActive, setSwishActive] = useState([]);
  const [swishActiveLoading, setSwishActiveLoading] = useState(false);
  const [swishActivePage, setSwishActivePage] = useState(0);
  const [swishActiveHasMore, setSwishActiveHasMore] = useState(false);
  const [swishResolved, setSwishResolved] = useState([]);
  const [swishResolvedLoading, setSwishResolvedLoading] = useState(false);
  const [swishResolvedPage, setSwishResolvedPage] = useState(0);
  const [swishResolvedHasMore, setSwishResolvedHasMore] = useState(false);
  const [swishOverall, setSwishOverall] = useState(null);
  const [swishOverallLoading, setSwishOverallLoading] = useState(false);

  // Transactions
  const [txTab, setTxTab] = useState('coupons');
  const [txCouponsFilter, setTxCouponsFilter] = useState('all'); // all, redeemable, redeemed, expired
  const [txCoupons, setTxCoupons] = useState([]);
  const [txCouponsLoading, setTxCouponsLoading] = useState(false);
  const [txCouponsPage, setTxCouponsPage] = useState(0);
  const [txCouponsHasMore, setTxCouponsHasMore] = useState(false);
  const [txOptimoveFilter, setTxOptimoveFilter] = useState('unclaimed'); // claimed, unclaimed
  const [txOptimove, setTxOptimove] = useState([]);
  const [txOptimoveLoading, setTxOptimoveLoading] = useState(false);
  const [txOptimovePage, setTxOptimovePage] = useState(0);
  const [txOptimoveHasMore, setTxOptimoveHasMore] = useState(false);
  const [txCryptoDep, setTxCryptoDep] = useState([]);
  const [txCryptoDepLoading, setTxCryptoDepLoading] = useState(false);
  const [txCryptoDepPage, setTxCryptoDepPage] = useState(0);
  const [txCryptoDepHasMore, setTxCryptoDepHasMore] = useState(false);
  const [txCryptoWd, setTxCryptoWd] = useState([]);
  const [txCryptoWdLoading, setTxCryptoWdLoading] = useState(false);
  const [txCryptoWdPage, setTxCryptoWdPage] = useState(0);
  const [txCryptoWdHasMore, setTxCryptoWdHasMore] = useState(false);
  const [txFiatDep, setTxFiatDep] = useState([]);
  const [txFiatDepLoading, setTxFiatDepLoading] = useState(false);
  const [txFiatDepPage, setTxFiatDepPage] = useState(0);
  const [txFiatDepHasMore, setTxFiatDepHasMore] = useState(false);
  const [txFiatDepSort, setTxFiatDepSort] = useState('updatedAt');
  const [txFiatWd, setTxFiatWd] = useState([]);
  const [txFiatWdLoading, setTxFiatWdLoading] = useState(false);
  const [txFiatWdPage, setTxFiatWdPage] = useState(0);
  const [txFiatWdHasMore, setTxFiatWdHasMore] = useState(false);
  const [txFiatWdSort, setTxFiatWdSort] = useState('updatedAt');
  const [txOther, setTxOther] = useState([]);
  const [txOtherLoading, setTxOtherLoading] = useState(false);
  const [txOtherPage, setTxOtherPage] = useState(0);
  const [txOtherHasMore, setTxOtherHasMore] = useState(false);
  const [txOtherFilter, setTxOtherFilter] = useState('');

  // Money Laundering
  const [mlTab, setMlTab] = useState('outstanding');
  const [mlLogsByCurrency, setMlLogsByCurrency] = useState({}); // { currency: [...logs] }
  const [mlLogsLoading, setMlLogsLoading] = useState(false);
  const [mlLogsCurrency, setMlLogsCurrency] = useState('');
  const [mlAvailableCurrencies, setMlAvailableCurrencies] = useState([]); // currencies that have logs
  const [mlLogsDiscovered, setMlLogsDiscovered] = useState(false); // whether we've scanned all currencies

  // Ticket search
  const [ticketSearchOpen, setTicketSearchOpen] = useState(false);
  const [ticketSearchValue, setTicketSearchValue] = useState('');
  const [searchedTicketId, setSearchedTicketId] = useState(null); // temporary overlay, cleared on nav
  const ticketSearchRef = useRef(null);

  // Deleting state
  const [deletingId, setDeletingId] = useState(null);

  // ============================================
  // FETCH TEMPLATES
  // ============================================

  const fetchTemplates = useCallback(async () => {
    try {
      setLoadingTemplates(true);
      const { data } = await axios.get(`${API_URL}/api/qa/intercom-report/templates`, getAuthHeaders());
      setTemplates(data.userTemplates || []);
      setDefaultTemplates(data.defaultTemplates || []);
    } catch (err) {
      toast.error('Failed to load templates');
    } finally {
      setLoadingTemplates(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  // ============================================
  // DRILL-IN SESSION CACHE
  // ============================================

  const CACHE_KEY = 'clara_drill_cache';

  const saveDrillCache = useCallback((overrides = {}) => {
    try {
      const payload = {
        templateId: overrides.templateId ?? activeTemplateId,
        templateName: overrides.templateName ?? activeTemplateName,
        results: overrides.results ?? reportResults,
        totalCount: overrides.totalCount ?? totalCount,
        hasMore: overrides.hasMore ?? hasMore,
        nextCursor: overrides.nextCursor ?? nextCursor,
        filters: overrides.filters ?? activeFilters,
        ts: Date.now(),
      };
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    } catch { /* quota exceeded — ignore */ }
  }, [activeTemplateId, activeTemplateName, reportResults, totalCount, hasMore, nextCursor, activeFilters]);

  const clearDrillCache = useCallback(() => {
    sessionStorage.removeItem(CACHE_KEY);
  }, []);

  // ============================================
  // RESTORE DRILL-IN FROM URL ON MOUNT
  // ============================================

  const allTemplates = useMemo(() => [...defaultTemplates, ...templates], [defaultTemplates, templates]);

  useEffect(() => {
    if (restoredRef.current || (templates.length === 0 && defaultTemplates.length === 0)) return;
    const drillId = searchParams.get('drill');
    if (!drillId) return;
    restoredRef.current = true;
    const template = allTemplates.find(t => t._id === drillId);
    if (!template) return;
    const idx = parseInt(searchParams.get('idx') || '0', 10);
    setActiveTemplateId(drillId);
    fetchRefData();

    // Try restoring from session cache first
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw);
        if (cached.templateId === drillId && Date.now() - cached.ts < 30 * 60 * 1000 && cached.results?.length > 0) {
          setReportResults(cached.results);
          setTotalCount(cached.totalCount || 0);
          setHasMore(cached.hasMore || false);
          setNextCursor(cached.nextCursor || null);
          setActiveFilters(cached.filters || template.filters);
          setActiveTemplateName(cached.templateName || template.name);
          setCurrentIndex(Math.min(idx, cached.results.length - 1));
          setView('drill-in');
          return;
        }
      }
    } catch { /* corrupted cache — fall through */ }

    executeReport(template.filters, template.name, null, idx);
  }, [allTemplates, searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // ============================================
  // FETCH REFERENCE DATA
  // ============================================

  const fetchRefData = useCallback(async () => {
    if (refData.admins.length > 0) return; // Already loaded
    try {
      setLoadingRefData(true);
      const { data } = await axios.get(`${API_URL}/api/qa/intercom-report/reference-data`, getAuthHeaders());
      setRefData(data);
    } catch (err) {
      toast.error('Failed to load Intercom data');
    } finally {
      setLoadingRefData(false);
    }
  }, [getAuthHeaders, refData.admins.length]);

  // ============================================
  // TEMPLATE CRUD
  // ============================================

  const handleSaveTemplate = useCallback(async (andDrillIn = false) => {
    if (!editorName.trim()) {
      toast.error('Template name is required');
      return;
    }
    try {
      setSaving(true);
      let saved;
      if (editingTemplate) {
        const { data } = await axios.put(
          `${API_URL}/api/qa/intercom-report/templates/${editingTemplate._id}`,
          { name: editorName.trim(), filters: editorFilters },
          getAuthHeaders()
        );
        saved = data;
        setTemplates(prev => prev.map(t => t._id === saved._id ? saved : t));
        toast.success('Template updated');
      } else {
        const { data } = await axios.post(
          `${API_URL}/api/qa/intercom-report/templates`,
          { name: editorName.trim(), filters: editorFilters },
          getAuthHeaders()
        );
        saved = data;
        setTemplates(prev => [saved, ...prev]);
        toast.success('Template created');
      }
      setEditorOpen(false);
      if (andDrillIn) {
        setActiveTemplateId(saved._id);
        setSearchParams({ drill: saved._id, idx: '0' });
        executeReport(saved.filters, saved.name);
      }
    } catch (err) {
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  }, [editorName, editorFilters, editingTemplate, getAuthHeaders]);

  const handleDeleteTemplate = useCallback(async (id) => {
    try {
      setDeletingId(id);
      await axios.delete(`${API_URL}/api/qa/intercom-report/templates/${id}`, getAuthHeaders());
      setTemplates(prev => prev.filter(t => t._id !== id));
      toast.success('Template deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete template');
    } finally {
      setDeletingId(null);
    }
  }, [getAuthHeaders]);

  const handleDuplicateTemplate = useCallback(async (id) => {
    try {
      const { data } = await axios.post(`${API_URL}/api/qa/intercom-report/templates/${id}/duplicate`, {}, getAuthHeaders());
      setTemplates(prev => [data, ...prev]);
      toast.success('Template duplicated');
    } catch (err) {
      toast.error('Failed to duplicate template');
    }
  }, [getAuthHeaders]);

  // ============================================
  // OPEN EDITOR
  // ============================================

  const openEditor = useCallback((template = null) => {
    fetchRefData();
    if (template) {
      setEditingTemplate(template);
      setEditorName(template.name);
      setEditorFilters(template.filters || {});
    } else {
      setEditingTemplate(null);
      setEditorName('');
      setEditorFilters({});
    }
    setEditorOpen(true);
  }, [fetchRefData]);

  // ============================================
  // EXECUTE REPORT
  // ============================================

  const executeReport = useCallback(async (filters, templateName, cursor = null, initialIdx = null) => {
    try {
      if (!cursor) {
        setExecuting(true);
        setReportResults([]);
        setCurrentIndex(0);
        setTotalCount(0);
        setActiveFilters(filters);
        setActiveTemplateName(templateName || 'Report');

        // Run count and execute in parallel — don't wait for count to show results
        const countPromise = axios.post(
          `${API_URL}/api/qa/intercom-report/count`,
          { filters },
          getAuthHeaders()
        ).then(resp => {
          setTotalCount(resp.data.totalCount || 0);
        }).catch(() => {});

        const { data } = await axios.post(
          `${API_URL}/api/qa/intercom-report/execute`,
          { filters },
          getAuthHeaders()
        );

        setReportResults(data.conversations);
        setView('drill-in');
        setHasMore(data.hasMore);
        setNextCursor(data.nextCursor);

        // Restore index if provided (from URL restore)
        if (initialIdx != null && initialIdx > 0 && initialIdx < data.conversations.length) {
          setCurrentIndex(initialIdx);
        }

        // Wait for count to finish in background
        await countPromise;
      } else {
        setLoadingMore(true);

        const { data } = await axios.post(
          `${API_URL}/api/qa/intercom-report/execute`,
          { filters, cursor },
          getAuthHeaders()
        );

        setReportResults(prev => [...prev, ...data.conversations]);
        setHasMore(data.hasMore);
        setNextCursor(data.nextCursor);
      }
    } catch (err) {
      console.error('Execute report error:', err.response?.data || err.message);
      toast.error(err.response?.data?.message || 'Failed to execute report');
    } finally {
      setExecuting(false);
      setLoadingMore(false);
    }
  }, [getAuthHeaders]);

  // ============================================
  // FETCH CONVERSATION META
  // ============================================

  const fetchConversationMeta = useCallback(async (convId) => {
    try {
      setLoadingMeta(true);
      const { data } = await axios.get(
        `${API_URL}/api/qa/intercom-report/conversation/${convId}`,
        getAuthHeaders()
      );
      setConversationMeta(data);
    } catch (err) {
      setConversationMeta(null);
    } finally {
      setLoadingMeta(false);
    }
  }, [getAuthHeaders]);

  // Fetch meta when currentIndex or searchedTicketId changes
  useEffect(() => {
    if (view !== 'drill-in') return;
    const convId = searchedTicketId || reportResults[currentIndex]?.id;
    if (convId) fetchConversationMeta(convId);
  }, [view, currentIndex, reportResults, searchedTicketId, fetchConversationMeta]);

  // Sync URL with current drill-in index
  useEffect(() => {
    if (view === 'drill-in' && activeTemplateId) {
      setSearchParams({ drill: activeTemplateId, idx: String(currentIndex) }, { replace: true });
    }
  }, [view, currentIndex, activeTemplateId, setSearchParams]);

  // Persist drill-in state to session cache
  useEffect(() => {
    if (view === 'drill-in' && activeTemplateId && reportResults.length > 0) {
      saveDrillCache();
    }
  }, [view, activeTemplateId, reportResults, totalCount, hasMore, nextCursor, saveDrillCache]);

  // Auto-load more when reaching end
  useEffect(() => {
    if (view === 'drill-in' && currentIndex >= reportResults.length - 3 && hasMore && !loadingMore && activeFilters) {
      executeReport(activeFilters, activeTemplateName, nextCursor);
    }
  }, [currentIndex, reportResults.length, hasMore, loadingMore, activeFilters, nextCursor, view, activeTemplateName, executeReport]);

  // ============================================
  // ACP — Status, Auth, Query
  // ============================================

  const checkAcpStatus = useCallback(async () => {
    try {
      const requestId = 'acp_status_' + Date.now();
      const result = await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          window.removeEventListener('message', handler);
          resolve({ connected: false, expired: false });
        }, 3000);
        const handler = (event) => {
          if (event.data?.type === 'CLARA_ACP_STATUS_RESULT' && event.data.requestId === requestId) {
            clearTimeout(timeout);
            window.removeEventListener('message', handler);
            resolve(event.data.status);
          }
        };
        window.addEventListener('message', handler);
        window.postMessage({ type: 'CLARA_ACP_STATUS_CHECK', requestId }, '*');
      });
      setAcpStatus(result);
    } catch {
      setAcpStatus({ connected: false, expired: false });
    }
  }, []);

  const fetchAcpData = useCallback(async (externalId) => {
    if (!externalId) {
      setAcpError(null);
      setAcpData(null);
      return;
    }
    setAcpLoading(true);
    setAcpError(null);
    setAcpData(null);
    try {
      // Single query: user profile + USD-converted snapshotSummary per period
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const annualDays = Math.floor((now - startOfYear) / (1000 * 60 * 60 * 24));
      const ssFields = 'betValue profitValue expectedValue playerExpense siteExpense providerExpense affiliateBonusValue margin';
      const periods = [
        { alias: 'snapDay', days: 1 },
        { alias: 'snapWeek', days: 7 },
        { alias: 'snapFortnight', days: 14 },
        { alias: 'snapThirtyDays', days: 30 },
        { alias: 'snapAnnual', days: annualDays },
      ];
      const snapAliases = periods.map(p =>
        `${p.alias}: snapshotSummary(dayCount: ${p.days}) { ${ssFields} }`
      ).join('\n            ');

      const gqlQuery = `query UserLookup($userId: String!) {
          user(userId: $userId) {
            id name email createdAt lastLoginAt
            isBanned hasEmailVerified hasPhoneNumberVerified hasTfaEnabled hasEmailSubscribed hasPassword oauthProvider
            phoneNumber phoneCountryCode
            kycStatus veriffStatus affiliateDealType mtsLimitId
            preference { defaultFiatCurrency }
            rakeback { rate enabled createdAt balances { currency receivedAmount availableAmount } }
            flagProgress { progress flag }
            flags { flag }
            roles { name expireAt message }
            tags { id name }
            balances { available { amount currency } }
            depositAddressList(limit: 50, offset: 0) { id address currency createdAt active }
            adjustmentList(limit: 50, offset: 0) { message createdAt authId { id name } amount currency type value }
            campaignDefaultCommission { comission }
            campaignList(limit: 50, offset: 0) { id code offerCode name hitCount referCount uniqueDepositors depositCount comission type createdAt lastUpdatedBy { id name } balances { available { currency amount value } comission { currency amount value } } }
            referredCampaign { name comission code hitCount referCount uniqueDepositors depositCount type createdAt }
            bonusList(limit: 50, offset: 0) { id name sendBy { id name } amount value currency createdAt playerSnapshot }
            responsibleGamblingDepositLimit { id period limit active progress expireAt createdAt actionBy { id name } newLimit pendingAction coolingOff }
            responsibleGamblingLimits { id period progress type value coolingOff currency }
            outstandingWagerAmount { amount currency updatedAt }
            getUserPasskeys { id authenticatorName deviceName createdAt lastUsedAt }
            raffleList { progress ticketCount raffle { id name startTime endTime } }
            snapshotSummary { ${ssFields} }
            ${snapAliases}
          }
        }`;
      const gqlVariables = { userId: externalId };

      // Route query through extension (bypasses Cloudflare challenge)
      const requestId = 'acp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      const data = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          window.removeEventListener('message', handler);
          reject(new Error('ACP query timed out — make sure the extension is installed and ACP is accessible'));
        }, 30000);

        const handler = (event) => {
          if (event.data?.type === 'CLARA_ACP_QUERY_RESULT' && event.data.requestId === requestId) {
            clearTimeout(timeout);
            window.removeEventListener('message', handler);
            if (event.data.error) {
              reject(new Error(event.data.error));
            } else {
              resolve(event.data.data);
            }
          }
        };
        window.addEventListener('message', handler);

        window.postMessage({
          type: 'CLARA_ACP_QUERY',
          query: gqlQuery,
          variables: gqlVariables,
          requestId,
          apiToken: acpApiToken
        }, '*');
      });

      setAcpData(data);
      // Reset casino section state for new user
      setCasinoBets([]); setCasinoBetsPage(0); setCasinoBetsHasMore(false);
      setCasinoGames([]); setCasinoActiveOrig(null); setCasinoActive3p(null);
      setDepLimitHistory([]); setDepLimitTab('active');
      setGambLimitHistory([]); setGambLimitTab('active');
      setAcpNotes([]); setAcpNotesPage(0); setAcpNotesHasMore(false); setAcpNotesType('all');
      setOverallData(null); setOverallTab('currency-summary');
      setMlLogsByCurrency({}); setMlLogsCurrency(''); setMlTab('outstanding'); setMlAvailableCurrencies([]); setMlLogsDiscovered(false);
      setRakebackClaims([]); setRakebackTab('balances');
      setReloadData([]); setReloadPage(0); setReloadHasMore(false);
      setRolloverData([]); setRolloverPage(0); setRolloverHasMore(false);
      setSportsActive([]); setSportsActivePage(0); setSportsActiveHasMore(false);
      setSportsResolved([]); setSportsResolvedPage(0); setSportsResolvedHasMore(false); setSportsTab('active');
      setSwishActive([]); setSwishActivePage(0); setSwishActiveHasMore(false);
      setSwishResolved([]); setSwishResolvedPage(0); setSwishResolvedHasMore(false);
      setSwishOverall(null); setSwishTab('bets'); setSwishBetsFilter('active'); setLegsTooltip(null);
      setTxTab('coupons'); setTxCouponsFilter('all'); setTxCoupons([]); setTxCouponsPage(0); setTxCouponsHasMore(false);
      setTxOptimoveFilter('unclaimed'); setTxOptimove([]); setTxOptimovePage(0); setTxOptimoveHasMore(false);
      setTxCryptoDep([]); setTxCryptoDepPage(0); setTxCryptoDepHasMore(false);
      setTxCryptoWd([]); setTxCryptoWdPage(0); setTxCryptoWdHasMore(false);
      setTxFiatDep([]); setTxFiatDepPage(0); setTxFiatDepHasMore(false); setTxFiatDepSort('updatedAt');
      setTxFiatWd([]); setTxFiatWdPage(0); setTxFiatWdHasMore(false); setTxFiatWdSort('updatedAt');
      setTxOther([]); setTxOtherPage(0); setTxOtherHasMore(false); setTxOtherFilter('');
      setSessionsInternal([]); setSessionsInternalPage(0); setSessionsInternalHasMore(false); setSessionsInternalFilter('all'); setSessionsTab('internal');
      setSessionsSoftswiss(null); setSessions3p([]); setSessions3pPage(0); setSessions3pHasMore(false); setSessions3pProvider('beter');
    } catch (err) {
      console.error('[ACP] Extension query error:', err);
      const msg = err.message || 'Failed to fetch ACP data';
      setAcpError(msg);
    } finally {
      setAcpLoading(false);
    }
  }, [acpApiToken]);

  // Helper to run ACP GraphQL query via extension
  const acpQuery = useCallback((query, variables) => {
    const requestId = 'acp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => { window.removeEventListener('message', handler); reject(new Error('ACP query timed out')); }, 30000);
      const handler = (event) => {
        if (event.data?.type === 'CLARA_ACP_QUERY_RESULT' && event.data.requestId === requestId) {
          clearTimeout(timeout); window.removeEventListener('message', handler);
          event.data.error ? reject(new Error(event.data.error)) : resolve(event.data.data);
        }
      };
      window.addEventListener('message', handler);
      window.postMessage({ type: 'CLARA_ACP_QUERY', query, variables, requestId, apiToken: acpApiToken }, '*');
    });
  }, [acpApiToken]);

  const fetchCasinoBets = useCallback(async (userId, page = 0) => {
    setCasinoBetsLoading(true);
    try {
      const data = await acpQuery(`query UserHouseBetList($userId: String, $limit: Int, $offset: Int) {
        user(userId: $userId) { id houseBetList(limit: $limit, offset: $offset) { id iid type bet {
          __typename
          ... on CasinoBet { createdAt currency amount value payoutMultiplier payout user { name } game }
          ... on MultiplayerCrashBet { createdAt currency amount value payoutMultiplier payout user { name } }
          ... on MultiplayerSlideBet { createdAt currency amount value payoutMultiplier payout user { name } }
          ... on SoftswissBet { createdAt currency amount value payoutMultiplier payout user { name } softswissGame: game { name } }
          ... on ThirdPartyBet { createdAt currency amount value payoutMultiplier payout user { name } thirdPartyGame: game { name } }
          ... on EvolutionBet { createdAt currency amount value payoutMultiplier payout user { name } evolutionGame: game { name } }
          ... on SportBet { createdAt currency amount value payoutMultiplier payout user { name } status }
          ... on SwishBet { createdAt currency amount value payoutMultiplier payout user { name } status }
          ... on RacingBet { createdAt currency amount value payoutMultiplier payout user { name } }
          ... on SportsbookXMultiBet { createdAt currency amount value payoutMultiplier payout user { name } }
        } } } }`, { userId, limit: 50, offset: page * 50 });
      const bets = data?.data?.user?.houseBetList || [];
      setCasinoBets(bets);
      setCasinoBetsHasMore(bets.length >= 50);
      setCasinoBetsPage(page);
    } catch (err) { console.error('[ACP Casino Bets]', err); }
    finally { setCasinoBetsLoading(false); }
  }, [acpQuery]);

  const fetchCasinoGames = useCallback(async (userId, sort = 'wagered') => {
    setCasinoGamesLoading(true);
    try {
      const gamesQuery = `query UserGameStatistics($userId: String!, $limit: Int, $offset: Int, $sort: UserStatisticSortEnum) {
        user(userId: $userId) { id statisticList(limit: $limit, offset: $offset, sort: $sort) {
          currency game gameDetails { id provider { name } type } profitAmount profitValue betAmount betValue bets wins losses
        } } }`;
      // Fetch all pages
      let allStats = [];
      let offset = 0;
      while (true) {
        const data = await acpQuery(gamesQuery, { userId, limit: 50, offset, sort });
        const page = data?.data?.user?.statisticList || [];
        allStats = allStats.concat(page);
        if (page.length < 50) break;
        offset += 50;
      }
      // Merge duplicates by game name
      const merged = {};
      for (const g of allStats) {
        const key = (g.game || '').toLowerCase();
        if (!merged[key]) {
          merged[key] = { ...g, profitValue: Number(g.profitValue || 0), betValue: Number(g.betValue || 0), bets: g.bets || 0, wins: g.wins || 0, losses: g.losses || 0 };
        } else {
          merged[key].profitValue += Number(g.profitValue || 0);
          merged[key].betValue += Number(g.betValue || 0);
          merged[key].bets += g.bets || 0;
          merged[key].wins += g.wins || 0;
          merged[key].losses += g.losses || 0;
        }
      }
      // Sort merged results
      const sorted = Object.values(merged).sort((a, b) => sort === 'profit' ? b.profitValue - a.profitValue : b.betValue - a.betValue);
      setCasinoGames(sorted);
    } catch (err) { console.error('[ACP Casino Games]', err); }
    finally { setCasinoGamesLoading(false); }
  }, [acpQuery]);

  const fetchCasinoActiveOriginals = useCallback(async (userId) => {
    setCasinoActiveOrigLoading(true);
    try {
      const data = await acpQuery(`query ActiveCasinoBetsAcp($userId: String) {
        user(userId: $userId) { id activeCasinoBets { id amount currency game createdAt } activeServerSeed { id nextSeedHash } } }`, { userId });
      setCasinoActiveOrig(data?.data?.user?.activeCasinoBets || []);
    } catch (err) { console.error('[ACP Casino Active Originals]', err); }
    finally { setCasinoActiveOrigLoading(false); }
  }, [acpQuery]);

  const fetchCasinoActive3p = useCallback(async (userId) => {
    setCasinoActive3pLoading(true);
    try {
      const providers = ['beter','evenbet','evolutionOss','hacksaw','hub88','massive','pragmatic','softswiss','twist'];
      const allBets = [];
      for (const provider of providers) {
        const data = await acpQuery(`query UserThirdPartyActiveBets($userId: String, $provider: GameTypeEnum!, $limit: Int, $offset: Int) {
          user(userId: $userId) { id thirdPartyActiveBets(provider: $provider, limit: $limit, offset: $offset) {
            id active amount currency value payoutMultiplier payout createdAt
            thirdPartyGame: game { id name provider { id name } }
            session { id sourceCurrency targetCurrency }
          } } }`, { userId, provider, limit: 50, offset: 0 });
        const bets = data?.data?.user?.thirdPartyActiveBets || [];
        allBets.push(...bets);
      }
      // Batch lookup IIDs for all found bets
      if (allBets.length > 0) {
        const aliases = allBets.map((b, i) => `b${i}: bet(betId: "${b.id}") { iid }`).join('\n');
        try {
          const iidData = await acpQuery(`query LookupBetIIDs { ${aliases} }`, {});
          allBets.forEach((b, i) => { b._iid = iidData?.data?.[`b${i}`]?.iid || b.id; });
        } catch { /* fallback to UUID */ }
      }
      setCasinoActive3p(allBets);
    } catch (err) { console.error('[ACP Casino Active 3P]', err); setCasinoActive3p([]); }
    finally { setCasinoActive3pLoading(false); }
  }, [acpQuery]);

  // Fetch deposit limit history
  const fetchDepLimitHistory = useCallback(async (userId) => {
    setDepLimitHistoryLoading(true);
    try {
      const data = await acpQuery(`query GetUserResponsibleGamblingDepositLimitHistoryList($userId: String, $limit: Int, $offset: Int) {
        user(userId: $userId) {
          id
          responsibleGamblingDepositLimitHistoryList(limit: $limit, offset: $offset) {
            id action actionBy { id name } createdAt limit period reason
          }
        }
      }`, { userId, limit: 50, offset: 0 });
      setDepLimitHistory(data?.data?.user?.responsibleGamblingDepositLimitHistoryList || []);
    } catch (err) { console.error('[ACP Deposit Limit History]', err); setDepLimitHistory([]); }
    finally { setDepLimitHistoryLoading(false); }
  }, [acpQuery]);

  // Fetch gambling limit history
  const fetchGambLimitHistory = useCallback(async (userId) => {
    setGambLimitHistoryLoading(true);
    try {
      const data = await acpQuery(`query GetUserGamblingLimitHistoryList($userId: String) {
        user(userId: $userId) {
          id
          responsibleGamblingLimitHistoryList {
            id period progress type value coolingOff currency
            active expireAt createdAt updatedAt removedAt
            createdBy { id name }
            updatedBy { id name }
            removedBy { id name }
          }
        }
      }`, { userId });
      setGambLimitHistory(data?.data?.user?.responsibleGamblingLimitHistoryList || []);
    } catch (err) { console.error('[ACP Gambling Limit History]', err); setGambLimitHistory([]); }
    finally { setGambLimitHistoryLoading(false); }
  }, [acpQuery]);

  // Fetch ACP notes
  const fetchAcpNotes = useCallback(async (userId, page = 0, type = 'all') => {
    setAcpNotesLoading(true);
    try {
      const vars = { userId, limit: 50, offset: page * 50 };
      if (type && type !== 'all') vars.type = type;
      const data = await acpQuery(`query UserNextNoteList($userId: String, $limit: Int, $offset: Int, $type: NoteTypeEnum) {
        user(userId: $userId) {
          id
          nextNoteList(limit: $limit, offset: $offset, type: $type) {
            type refType targetId createdAt
            data {
              ... on NextNoteAddRoleData { ip user { id name } role roleMessage: message expireAt }
              ... on NextNoteRemoveRoleData { ip user { id name } role roleMessage: message }
              ... on NextNoteLoginData { ip }
              ... on NextNoteRegisterData { ip country }
              ... on NextNoteMuteUserData { ip action expireAt message }
              ... on NextNoteEventData { status data }
              ... on NextNoteFailedAccountAccessData { ip user { id name } optionalCreatedAt: createdAt }
              ... on NextNoteActionData { action }
              ... on NextNoteRecordData { reason }
              ... on NextNoteUpdatePasswordData { ip user { id name } }
              ... on NextNoteResetLinkPasswordData { ip user { id name } }
              ... on NextNoteAdminUpdatePasswordData { ip admin: adminId { id name } user { id name } }
              ... on NextNoteUpdateEmailData { ip user { id name } }
              ... on NextNoteUpdateUnconfirmedEmailData { ip message user { id name } }
              ... on NextNoteStaffOffboardedData { ip note user { id name } admin: authId { id name } createdAt: offboardAt }
              ... on NextNoteAdminUpdateEmailData { ip message admin: adminId { id name } user { id name } }
              ... on NextNoteRevealApiKeyData { ip user { id name } }
              ... on NextNoteEnableTfaData { ip user { id name } }
              ... on NextNoteDisableTfaData { ip user { id name } }
              ... on NextNoteRequestSelfExclusionData { expireAt ip message user { id name } }
              ... on NextNoteAdminDisableTfaData { ip admin: adminId { id name } user { id name } }
              ... on NextNoteAutoSuspensionData { reason rejectedAt rejectedBy role user { id name } }
              ... on NextNoteConfirmSelfExclusionData { expireAt ip message user { id name } }
              ... on NextNoteConfirmSelfExclusionStageTwoData { expireAt ip message user { id name } }
              ... on NoteCustomData { ip note sessionId type user { id name } }
              ... on NextNoteRequestResetLinkPasswordData { ip email user { id name } }
              ... on NextNoteBreakInPlayData { expireAt ip breakInPlayMessage: message user { id name } }
              ... on NextNoteImmediateSelfExclusionData { expireAt ip immediateSelfExclusionMessage: message user { id name } }
              ... on NextNoteAssignCampaignOwnerData { code type campaignOwnerMessage: message user { id name } }
              ... on NextNoteRakebackData { user { id name } action type balances }
              ... on NextNoteAdminAuthTransferOauthToPasswordData { ip admin: adminId { id name } user { id name } }
              ... on NextNoteAdminDisableUserOauthIdentityData { ip admin: adminId { id name } user { id name } }
              ... on NextNoteEmailConfirmedData { ip message user { id name } type }
              ... on NextNoteVeriffUserStatusUpdateData { ip message admin: adminId { id name } user { id name } optionalCreatedAt: createdAt }
              ... on NextNoteVeriffBiometricStatusUpdateData { ip note: message admin: adminId { id name } user { id name } optionalCreatedAt: createdAt }
              ... on NextNoteAddTagData { note: message admin: adminId { id name } user { id name } type }
              ... on NextNoteRemoveTagData { note: message admin: adminId { id name } user { id name } type }
              ... on NextNoteVipHostStatusUpdateData { ip note: message admin: adminId { id name } user { id name } type action }
              ... on NextNoteKycData { ip note: message admin: adminId { id name } user { id name } type action }
              ... on NextNotePasskeyDeletionData { ip user { id name } }
              ... on NextNoteVerifyPasskeyAuthenticationData { ip user { id name } }
              ... on NextNoteVerifyPasskeyRegistrationData { ip user { id name } }
              ... on NextNoteAddCampaignUserData { user { id name } action note: message ip country }
              ... on NextNoteRemoveCampaignUserData { user { id name } action note: message ip country }
              ... on NextNoteMigratedStakeUserData { user { id name } type note: message createdAt }
              ... on NextNoteVeriffAddRoleData { note: message user { id name } role createdAt }
              ... on NextNoteVeriffRemoveRoleData { note: message user { id name } role createdAt }
              ... on NextNoteSessionLimitChangeData { ip sessionId action note: message user { id name } }
            }
          }
        }
      }`, vars);
      const notes = data?.data?.user?.nextNoteList || [];
      setAcpNotes(notes);
      setAcpNotesPage(page);
      setAcpNotesHasMore(notes.length >= 50);
    } catch (err) { console.error('[ACP Notes]', err); setAcpNotes([]); }
    finally { setAcpNotesLoading(false); }
  }, [acpQuery]);

  // Fetch overall data (currency summary + balances)
  const fetchOverallData = useCallback(async (userId) => {
    setOverallLoading(true);
    try {
      const bf = 'amount currency value';
      const data = await acpQuery(`query UserAllBalances($userId: String, $showFiat: Boolean = true) {
        user(userId: $userId) {
          id
          statistic { currency game profitValue profitAmount betAmount betValue }
          balances {
            available { ${bf} }
            faucet { ${bf} }
            bonus { ${bf} }
            rakeback { ${bf} }
            bonusClaim { ${bf} }
            mixpanel { ${bf} }
            vault { ${bf} }
            vaultPending { ${bf} }
            race { ${bf} }
            tipReceived { ${bf} }
            tipSend { ${bf} }
            deposit { ${bf} }
            withdrawal { ${bf} }
          }
          withdrawalCounts { status count }
          depositCounts { status count }
          fiatWithdrawalCount @include(if: $showFiat)
          fiatDepositCount @include(if: $showFiat)
          tipSendCount
          tipReceivedCount
        }
      }`, { userId, showFiat: true });
      const user = data?.data?.user || null;
      console.log('[ACP Overall] raw response:', JSON.stringify(data));
      console.log('[ACP Overall] balances.deposit:', JSON.stringify(user?.balances?.deposit));
      console.log('[ACP Overall] balances.withdrawal:', JSON.stringify(user?.balances?.withdrawal));
      console.log('[ACP Overall] balances.tipReceived:', JSON.stringify(user?.balances?.tipReceived));
      setOverallData(user);
    } catch (err) { console.error('[ACP Overall] ERROR:', err); setOverallData(null); }
    finally { setOverallLoading(false); }
  }, [acpQuery]);

  // Fetch rakeback claim history (transactions)
  const fetchRakebackClaims = useCallback(async (userId) => {
    setRakebackClaimsLoading(true);
    try {
      const data = await acpQuery(`query UserRakebackTransactions($userId: String!, $limit: Int, $offset: Int) {
        user(userId: $userId) { id rakeback { transactions(limit: $limit, offset: $offset) { amount currency createdAt sendBy { name } } } }
      }`, { userId, limit: 50, offset: 0 });
      setRakebackClaims(data?.data?.user?.rakeback?.transactions || []);
    } catch (err) { console.error('[ACP Rakeback Claims]', err); setRakebackClaims([]); }
    finally { setRakebackClaimsLoading(false); }
  }, [acpQuery]);

  // Fetch reload (faucet) list with pagination
  const fetchReloadData = useCallback(async (userId, page = 0) => {
    setReloadLoading(true);
    try {
      const data = await acpQuery(`query UserFaucetList($userId: String, $limit: Int, $offset: Int) {
        user(userId: $userId) { id faucetList(limit: $limit, offset: $offset) { active value lastClaim claimCount expireAt claimInterval createdAt comment authBy { id name } } }
      }`, { userId, limit: 50, offset: page * 50 });
      const list = data?.data?.user?.faucetList || [];
      setReloadData(list.length > 0 ? list : ['__empty__']);
      setReloadPage(page);
      setReloadHasMore(list.length === 50);
    } catch (err) { console.error('[ACP Reload]', err); setReloadData(['__empty__']); }
    finally { setReloadLoading(false); }
  }, [acpQuery]);

  // Fetch rollover list with pagination
  const fetchRolloverData = useCallback(async (userId, page = 0) => {
    setRolloverLoading(true);
    try {
      const data = await acpQuery(`query userRollover($userId: String!, $limit: Int, $offset: Int) {
        user(userId: $userId) { rolloverList(limit: $limit, offset: $offset) { id active amount lossAmount createdAt type maxBet currency expectedAmount expectedAmountMin progress note } }
      }`, { userId, limit: 50, offset: page * 50 });
      const list = data?.data?.user?.rolloverList || [];
      setRolloverData(list.length > 0 ? list : ['__empty__']);
      setRolloverPage(page);
      setRolloverHasMore(list.length === 50);
    } catch (err) { console.error('[ACP Rollover]', err); setRolloverData(['__empty__']); }
    finally { setRolloverLoading(false); }
  }, [acpQuery]);

  // Fetch internal sessions
  const fetchSessionsInternal = useCallback(async (userId, apiOffset = 0) => {
    setSessionsInternalLoading(true);
    try {
      const data = await acpQuery(`query SessionListACP($offset: Int, $limit: Int, $userId: String) {
        user(userId: $userId) { id sessionList(offset: $offset, limit: $limit) { id sessionName ip country city active updatedAt } }
      }`, { userId, limit: 50, offset: apiOffset });
      const list = data?.data?.user?.sessionList || [];
      if (apiOffset === 0) {
        setSessionsInternal(list.length > 0 ? list : ['__empty__']);
        setSessionsInternalPage(0);
      } else {
        setSessionsInternal(prev => {
          const base = prev[0] === '__empty__' ? [] : prev;
          return [...base, ...list];
        });
      }
      setSessionsInternalHasMore(list.length === 50);
    } catch (err) { console.error('[ACP Sessions Internal]', err); if (apiOffset === 0) setSessionsInternal(['__empty__']); }
    finally { setSessionsInternalLoading(false); }
  }, [acpQuery]);

  // Fetch softswiss sessions
  const fetchSessionsSoftswiss = useCallback(async (userId) => {
    setSessionsSoftswissLoading(true);
    try {
      const data = await acpQuery(`query UserSoftswissSessions($userId: String) {
        user(userId: $userId) { id softswissSessions { id ip source target exchangeRate createdAt updatedAt country active profile { id priority } } }
      }`, { userId });
      setSessionsSoftswiss(data?.data?.user?.softswissSessions || []);
    } catch (err) { console.error('[ACP Sessions Softswiss]', err); setSessionsSoftswiss([]); }
    finally { setSessionsSoftswissLoading(false); }
  }, [acpQuery]);

  // Fetch third party sessions
  const fetchSessions3p = useCallback(async (userId, provider, page = 0) => {
    setSessions3pLoading(true);
    try {
      const data = await acpQuery(`query UserThirdPartySessions($userId: String, $provider: GameTypeEnum!, $offset: Int, $limit: Int) {
        user(userId: $userId) { id thirdPartySessionList(provider: $provider, offset: $offset, limit: $limit) { id extUserId createdAt updatedAt sourceCurrency targetCurrency lastExchangeRate } }
      }`, { userId, provider, limit: 50, offset: page * 50 });
      const list = data?.data?.user?.thirdPartySessionList || [];
      setSessions3p(list.length > 0 ? list : ['__empty__']);
      setSessions3pPage(page);
      setSessions3pHasMore(list.length === 50);
    } catch (err) { console.error('[ACP Sessions 3P]', err); setSessions3p(['__empty__']); }
    finally { setSessions3pLoading(false); }
  }, [acpQuery]);

  // Fetch active sport bets
  const fetchSportsActive = useCallback(async (userId, page = 0) => {
    setSportsActiveLoading(true);
    try {
      const data = await acpQuery(`query UserSportBetsActive($userId: String!, $limit: Int, $offset: Int) {
        user(userId: $userId) {
          id
          activeSportBets(limit: $limit, offset: $offset) {
            ... on SportBet { __typename id search { iid } createdAt updatedAt currency amount value payout payoutMultiplier potentialMultiplier status cancelReason customPrices { type } }
          }
          activeRacingBets(limit: $limit, offset: $offset) {
            ... on RacingBet { __typename id search { iid } createdAt updatedAt currency amount value payout payoutMultiplier betStatus: status betPotentialMultiplier: potentialMultiplier }
          }
        }
      }`, { userId, limit: 50, offset: page * 50 });
      const sports = data?.data?.user?.activeSportBets || [];
      const racing = data?.data?.user?.activeRacingBets || [];
      const combined = [...sports, ...racing].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setSportsActive(combined.length > 0 ? combined : ['__empty__']);
      setSportsActivePage(page);
      setSportsActiveHasMore(sports.length === 50 || racing.length === 50);
    } catch (err) { console.error('[ACP Sports Active]', err); setSportsActive(['__empty__']); }
    finally { setSportsActiveLoading(false); }
  }, [acpQuery]);

  // Fetch resolved sport bets
  const fetchSportsResolved = useCallback(async (userId, page = 0) => {
    setSportsResolvedLoading(true);
    try {
      const data = await acpQuery(`query UserSportBetsResolved($userId: String!, $limit: Int, $offset: Int) {
        user(userId: $userId) {
          id
          sportBetList(limit: $limit, offset: $offset) {
            id iid type
            bet {
              ... on SportBet { __typename id search { iid } createdAt updatedAt currency amount value payout payoutMultiplier potentialMultiplier status cancelReason customPrices { type } }
              ... on SwishBet { __typename id createdAt updatedAt currency amount value payout payoutMultiplier potentialMultiplier status }
              ... on RacingBet { __typename id createdAt updatedAt currency amount value payout payoutMultiplier betStatus: status betPotentialMultiplier: potentialMultiplier }
            }
          }
        }
      }`, { userId, limit: 50, offset: page * 50 });
      const list = (data?.data?.user?.sportBetList || []).map(item => {
        const bet = item.bet || {};
        return { ...bet, _iid: item.iid || bet.search?.iid, _type: item.type };
      });
      setSportsResolved(list.length > 0 ? list : ['__empty__']);
      setSportsResolvedPage(page);
      setSportsResolvedHasMore(list.length === 50);
    } catch (err) { console.error('[ACP Sports Resolved]', err); setSportsResolved(['__empty__']); }
    finally { setSportsResolvedLoading(false); }
  }, [acpQuery]);

  // Fetch coupons (bonus claims)
  const fetchTxCoupons = useCallback(async (userId, page = 0, filter = 'all') => {
    setTxCouponsLoading(true);
    try {
      const vars = { userId, limit: 50, offset: page * 50, expired: null, redeemed: null };
      if (filter === 'redeemable') { vars.expired = false; vars.redeemed = false; }
      if (filter === 'redeemed') { vars.redeemed = true; }
      if (filter === 'expired') { vars.expired = true; }
      const data = await acpQuery(`query UserBonusClaimListAcp($userId: String, $limit: Int, $offset: Int, $expired: Boolean, $redeemed: Boolean) {
        user(userId: $userId) { id bonusClaimList(limit: $limit, offset: $offset, expired: $expired, redeemed: $redeemed) {
          amount currency redeemed claimedAt value bonusCode { id code note active expiresAt createdBy { id name } }
        } }
      }`, vars);
      const list = data?.data?.user?.bonusClaimList || [];
      setTxCoupons(list.length > 0 ? list : ['__empty__']);
      setTxCouponsPage(page);
      setTxCouponsHasMore(list.length === 50);
    } catch (err) { console.error('[ACP Coupons]', err); setTxCoupons(['__empty__']); }
    finally { setTxCouponsLoading(false); }
  }, [acpQuery]);

  // Fetch optimove promos
  const fetchTxOptimove = useCallback(async (userId, page = 0, filter = 'unclaimed') => {
    setTxOptimoveLoading(true);
    try {
      const data = await acpQuery(`query OptimovePromoClaimList($userId: String, $limit: Int, $offset: Int, $active: Boolean!, $types: [PromoTypeEnum!]) {
        user(userId: $userId) { id optimovePromoClaimList(limit: $limit, offset: $offset, active: $active, types: $types) {
          claimedAt createdAt expireAt id startAt updatedAt
          data { __typename ... on PromoBonusClaimData { amount currency value } ... on PromoReloadClaimData { claimIntervalMins expireAt value } ... on PromoDepositBonusClaimData { bonusMultiplier depositBonusCurrency: currency depositBonusCurrencyType: currencyType expectedAmountMultiplier maxBetMultiplier minDepositValue maxDepositValue } }
          promo { active code name type updatedAt data { __typename ... on PromoBonusData { value bonusCurrencyType: currencyType } ... on PromoReloadData { value claimIntervalMins expireDurationMins } ... on PromoDepositBonusData { bonusMultiplier currency depositBonusCurrencyType: currencyType expectedAmountMultiplier maxBetMultiplier minDepositValue maxDepositValue } } }
        } }
      }`, { userId, limit: 50, offset: page * 50, active: filter === 'unclaimed', types: ['bonus', 'reload'] });
      const list = data?.data?.user?.optimovePromoClaimList || [];
      setTxOptimove(list.length > 0 ? list : ['__empty__']);
      setTxOptimovePage(page);
      setTxOptimoveHasMore(list.length === 50);
    } catch (err) { console.error('[ACP Optimove]', err); setTxOptimove(['__empty__']); }
    finally { setTxOptimoveLoading(false); }
  }, [acpQuery]);

  // Fetch crypto deposits
  const fetchTxCryptoDep = useCallback(async (userId, page = 0) => {
    setTxCryptoDepLoading(true);
    try {
      const data = await acpQuery(`query DepositListAcp($userId: String, $limit: Int, $offset: Int) {
        user(userId: $userId) { id depositList(limit: $limit, offset: $offset) {
          id hash status amount value walletFee createdAt currency chain address { address type } depositPaymentProvider
        } }
      }`, { userId, limit: 50, offset: page * 50 });
      const list = data?.data?.user?.depositList || [];
      setTxCryptoDep(list.length > 0 ? list : ['__empty__']);
      setTxCryptoDepPage(page);
      setTxCryptoDepHasMore(list.length === 50);
    } catch (err) { console.error('[ACP Crypto Dep]', err); setTxCryptoDep(['__empty__']); }
    finally { setTxCryptoDepLoading(false); }
  }, [acpQuery]);

  // Fetch crypto withdrawals
  const fetchTxCryptoWd = useCallback(async (userId, page = 0) => {
    setTxCryptoWdLoading(true);
    try {
      const data = await acpQuery(`query WithdrawalListAcp($userId: String, $limit: Int, $offset: Int) {
        user(userId: $userId) { id withdrawalList(offset: $offset, limit: $limit) {
          id createdAt amount value currency chain status hash address ip refFee walletFee withdrawalProvider
        } }
      }`, { userId, limit: 50, offset: page * 50 });
      const list = data?.data?.user?.withdrawalList || [];
      setTxCryptoWd(list.length > 0 ? list : ['__empty__']);
      setTxCryptoWdPage(page);
      setTxCryptoWdHasMore(list.length === 50);
    } catch (err) { console.error('[ACP Crypto Wd]', err); setTxCryptoWd(['__empty__']); }
    finally { setTxCryptoWdLoading(false); }
  }, [acpQuery]);

  // Fetch fiat deposits
  const fetchTxFiatDep = useCallback(async (userId, page = 0, sort = 'updatedAt') => {
    setTxFiatDepLoading(true);
    try {
      const data = await acpQuery(`query FiatTxListAcp($userId: String!, $offset: Int, $limit: Int, $filters: FiatTransactionListFiltersInput, $sort: FiatTransactionSort) {
        user(userId: $userId) { id fiatTransactionList(offset: $offset, limit: $limit, filters: $filters, sort: $sort) {
          id currency methodType integrationEnum integrationTransactionId amount value feeAmount status createdAt updatedAt
          integrationTransactionData { ... on CashierTransaction { __typename txType pspStatus pspService pspAccount message info preBalanceAmount postBalanceAmount } }
        } }
      }`, { userId, limit: 50, offset: page * 50, filters: { methodTypes: ['deposit'] }, sort });
      const list = data?.data?.user?.fiatTransactionList || [];
      setTxFiatDep(list.length > 0 ? list : ['__empty__']);
      setTxFiatDepPage(page);
      setTxFiatDepHasMore(list.length === 50);
    } catch (err) { console.error('[ACP Fiat Dep]', err); setTxFiatDep(['__empty__']); }
    finally { setTxFiatDepLoading(false); }
  }, [acpQuery]);

  // Fetch fiat withdrawals
  const fetchTxFiatWd = useCallback(async (userId, page = 0, sort = 'updatedAt') => {
    setTxFiatWdLoading(true);
    try {
      const data = await acpQuery(`query FiatTxListAcp($userId: String!, $offset: Int, $limit: Int, $filters: FiatTransactionListFiltersInput, $sort: FiatTransactionSort) {
        user(userId: $userId) { id fiatTransactionList(offset: $offset, limit: $limit, filters: $filters, sort: $sort) {
          id currency methodType integrationEnum integrationTransactionId amount value feeAmount status createdAt updatedAt
          integrationTransactionData { ... on CashierTransaction { __typename txType pspStatus pspService pspAccount message info preBalanceAmount postBalanceAmount } }
        } }
      }`, { userId, limit: 50, offset: page * 50, filters: { methodTypes: ['withdrawal'] }, sort });
      const list = data?.data?.user?.fiatTransactionList || [];
      setTxFiatWd(list.length > 0 ? list : ['__empty__']);
      setTxFiatWdPage(page);
      setTxFiatWdHasMore(list.length === 50);
    } catch (err) { console.error('[ACP Fiat Wd]', err); setTxFiatWd(['__empty__']); }
    finally { setTxFiatWdLoading(false); }
  }, [acpQuery]);

  const fetchTxOther = useCallback(async (userId, apiOffset = 0, filter = '') => {
    setTxOtherLoading(true);
    try {
      const vars = { userId, limit: 50, offset: apiOffset };
      if (filter) vars.types = [filter];
      const data = await acpQuery(`query TransactionAcp($userId: String, $types: [TransactionTypeEnum!], $offset: Int, $limit: Int) {
        user(userId: $userId) { id transaction(types: $types, limit: $limit, offset: $offset) {
          id type currency amount createdAt value ip
          data { ... on ChatTip { id sender: sendBy { id name } receiver: user { id name } } ... on BonusCode { code } ... on ConditionBonusCode { code } ... on RaceResult { name claimed } ... on BetData { betId } }
        } }
      }`, vars);
      const list = data?.data?.user?.transaction || [];
      if (apiOffset === 0) {
        setTxOther(list.length > 0 ? list : ['__empty__']);
        setTxOtherPage(0);
      } else {
        setTxOther(prev => {
          const base = prev[0] === '__empty__' ? [] : prev;
          return [...base, ...list];
        });
      }
      setTxOtherHasMore(list.length === 50);
    } catch (err) { console.error('[ACP Tx Other]', err); if (apiOffset === 0) setTxOther(['__empty__']); }
    finally { setTxOtherLoading(false); }
  }, [acpQuery]);

  // Fetch active swish bets
  const fetchSwishActive = useCallback(async (userId, page = 0) => {
    setSwishActiveLoading(true);
    try {
      const data = await acpQuery(`query SwishActive($userId: String!, $limit: Int, $offset: Int) {
        user(userId: $userId) { id activeSwishBetList(limit: $limit, offset: $offset) {
          id createdAt updatedAt currency amount value potentialMultiplier payoutMultiplier payout status customBet
          outcomes { id odds outcome { name competitor { name } market { stat { name value } game { fixture { data { ... on SportFixtureDataMatch { competitors { name } } } } } } } }
        } }
      }`, { userId, limit: 50, offset: page * 50 });
      const list = data?.data?.user?.activeSwishBetList || [];
      setSwishActive(list.length > 0 ? list : ['__empty__']);
      setSwishActivePage(page);
      setSwishActiveHasMore(list.length === 50);
    } catch (err) { console.error('[ACP Swish Active]', err); setSwishActive(['__empty__']); }
    finally { setSwishActiveLoading(false); }
  }, [acpQuery]);

  // Fetch resolved swish bets
  const fetchSwishResolved = useCallback(async (userId, page = 0) => {
    setSwishResolvedLoading(true);
    try {
      const data = await acpQuery(`query SwishResolved($userId: String!, $limit: Int, $offset: Int) {
        user(userId: $userId) { id swishBetList(limit: $limit, offset: $offset) {
          id bet { ... on SwishBet {
            id createdAt updatedAt currency amount value potentialMultiplier payoutMultiplier payout status customBet
            outcomes { id odds outcome { name competitor { name } market { stat { name value } game { fixture { data { ... on SportFixtureDataMatch { competitors { name } } } } } } } }
          } }
        } }
      }`, { userId, limit: 50, offset: page * 50 });
      const list = (data?.data?.user?.swishBetList || []).map(item => item.bet || {}).filter(b => b.id);
      setSwishResolved(list.length > 0 ? list : ['__empty__']);
      setSwishResolvedPage(page);
      setSwishResolvedHasMore(list.length === 50);
    } catch (err) { console.error('[ACP Swish Resolved]', err); setSwishResolved(['__empty__']); }
    finally { setSwishResolvedLoading(false); }
  }, [acpQuery]);

  // Fetch swish overall statistics
  const fetchSwishOverall = useCallback(async (userId) => {
    setSwishOverallLoading(true);
    try {
      const data = await acpQuery(`query SwishOverall($userId: String!, $limit: Int, $offset: Int, $type: UserSportsStatisticSortEnum) {
        user(userId: $userId) { id statisticList(limit: $limit, offset: $offset, type: $type) {
          currency game gameDetails { id provider { name } type } profitAmount profitValue betAmount betValue bets wins losses
        } }
      }`, { userId, limit: 200, offset: 0, type: 'swish' });
      setSwishOverall(data?.data?.user?.statisticList || []);
    } catch (err) { console.error('[ACP Swish Overall]', err); setSwishOverall([]); }
    finally { setSwishOverallLoading(false); }
  }, [acpQuery]);

  // Discover all currencies that have ML logs by querying all known currencies in parallel
  const discoverMlLogs = useCallback(async (userId) => {
    setMlLogsLoading(true);
    const allCurrencies = ['usdt','btc','eth','ltc','sol','doge','bch','xrp','trx','eos','bnb','usdc','busd','matic','ada','dot','shib','avax','link','uni','cad','usd','eur','gbp','aud','jpy','brl','inr','krw','try','mxn','php','pln','czk','clp','pen','cop'];
    const mlQuery = `query UserEventLogList($userId: String!, $currency: CurrencyEnum!, $endDate: Date, $offset: Int, $limit: Int) {
      user(userId: $userId) { id coinMixingEventLogList(currency: $currency, endDate: $endDate, offset: $offset, limit: $limit) { id eventType currency outstanding data date } }
    }`;
    const endDate = new Date().toISOString().slice(0, 16);
    const results = {};
    const found = [];
    await Promise.all(allCurrencies.map(async (cur) => {
      try {
        const data = await acpQuery(mlQuery, { userId, currency: cur, endDate, offset: 0, limit: 50 });
        const logs = data?.data?.user?.coinMixingEventLogList || [];
        if (logs.length > 0) { results[cur] = logs; found.push(cur); }
      } catch { /* currency not in enum or no data */ }
    }));
    const sorted = found.sort();
    setMlLogsByCurrency(results);
    setMlAvailableCurrencies(sorted);
    setMlLogsDiscovered(true);
    if (sorted.length > 0) setMlLogsCurrency(sorted[0]);
    setMlLogsLoading(false);
  }, [acpQuery]);

  const startAcpAuth = useCallback(() => {
    window.postMessage({ type: 'CLARA_START_ACP_AUTH' }, '*');
    toast.info('Opening ACP login — complete login to connect');
  }, []);

  const saveAcpToken = useCallback(async (token) => {
    try {
      await axios.post(`${API_URL}/api/qa/acp/token`, { token }, getAuthHeaders());
      setAcpStatus({ connected: true, expired: false });
      return true;
    } catch {
      return false;
    }
  }, [getAuthHeaders]);

  // Check ACP status and fetch API token on mount
  useEffect(() => {
    checkAcpStatus();
    // Fetch the Stake API token for extension-based ACP queries
    axios.get(`${API_URL}/api/qa/acp/api-token`, getAuthHeaders())
      .then(({ data }) => setAcpApiToken(data.token))
      .catch(() => {});
  }, [checkAcpStatus, getAuthHeaders]);

  // Fetch ACP data when conversation changes and connected
  useEffect(() => {
    if (view === 'drill-in' && acpStatus?.connected) {
      const conv = searchedTicketId ? null : reportResults[currentIndex];
      const extId = conversationMeta?.contactExternalId || conv?.contactExternalId;
      if (extId) {
        fetchAcpData(extId);
      }
    }
  }, [view, currentIndex, reportResults, searchedTicketId, conversationMeta?.contactExternalId, acpStatus?.connected, fetchAcpData]);

  // Listen for ACP token from extension
  useEffect(() => {
    const handleAcpToken = async (event) => {
      if (event.data?.type === 'CLARA_ACP_TOKEN_RECEIVED' && event.data.token) {
        toast.success('ACP connected!');
        setAcpStatus({ connected: true, expired: false });
        if (view === 'drill-in') {
          const conv = searchedTicketId ? null : reportResults[currentIndex];
          const extId = conversationMeta?.contactExternalId || conv?.contactExternalId;
          if (extId) fetchAcpData(extId);
        }
      }
    };
    window.addEventListener('message', handleAcpToken);
    return () => window.removeEventListener('message', handleAcpToken);
  }, [view, currentIndex, reportResults, conversationMeta, fetchAcpData]);

  // ============================================
  // KEYBOARD NAV (drill-in)
  // ============================================

  useEffect(() => {
    if (view !== 'drill-in') return;
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowRight' && currentIndex < reportResults.length - 1) {
        setSearchedTicketId(null); setCurrentIndex(i => i + 1);
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setSearchedTicketId(null); setCurrentIndex(i => i - 1);
      } else if (e.key === 'Escape') {
        setView('templates');
        setActiveTemplateId(null);
        setSearchParams({});
        clearDrillCache();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [view, currentIndex, reportResults.length]);

  // ============================================
  // CREATE TICKET FROM DRILL-IN
  // ============================================

  const handleCreateTicket = useCallback(() => {
    const conv = reportResults[currentIndex];
    if (!conv) return;

    // Try matching Intercom admin name to agent's maestroName (Intercom display name), fallback to agent.name
    let matchedAgentId = null;
    if (conv.adminAssigneeId && refData.admins.length > 0) {
      const admin = refData.admins.find(a => a.id === String(conv.adminAssigneeId));
      if (admin) {
        const adminLower = admin.name.toLowerCase();
        const matched = agents.find(a =>
          (a.maestroName && a.maestroName.toLowerCase() === adminLower) ||
          a.name.toLowerCase() === adminLower
        );
        if (matched) matchedAgentId = matched._id;
      }
    }

    openTicketDialog('create', null, 'report', matchedAgentId, {
      ticketId: String(conv.id),
      dateEntered: new Date().toISOString().split('T')[0]
    });
  }, [reportResults, currentIndex, refData.admins, agents, openTicketDialog]);

  // ============================================
  // FILTER SUMMARY HELPER
  // ============================================

  const getFilterSummary = (filters) => {
    if (!filters) return 'No filters';
    const parts = [];
    if (filters.adminAssigneeIds?.length) parts.push(`${filters.adminAssigneeOperator === 'is_not' ? '!' : ''}Admins: ${filters.adminAssigneeIds.length}`);
    if (filters.teamAssigneeIds?.length) parts.push(`${filters.teamAssigneeOperator === 'is_not' ? '!' : ''}Teams: ${filters.teamAssigneeIds.length}`);
    if (filters.tagIds?.length) parts.push(`${filters.tagOperator === 'is_not' ? '!' : ''}Tags: ${filters.tagIds.length}`);
    if (filters.topics?.length) parts.push(`${filters.topicOperator === 'is_not' ? '!' : ''}Topics: ${filters.topics.length}`);
    if (filters.kycCountries?.length) parts.push(`${filters.kycCountryOperator === 'is_not' ? '!' : ''}Countries: ${filters.kycCountries.length}`);
    if (filters.dateFrom || filters.dateTo) parts.push('Date range');
    if (filters.state) parts.push(`State: ${filters.state}`);
    return parts.length ? parts.join(' · ') : 'No filters';
  };

  // ============================================
  // UPDATE FILTER HELPER
  // ============================================

  const updateFilter = useCallback((key, value) => {
    setEditorFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // ============================================
  // RENDER: TEMPLATES VIEW
  // ============================================

  if (view === 'templates') {
    return (
      <div className="space-y-4 sm:space-y-6 px-4 sm:px-8 lg:px-12 py-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Report Templates</h2>
            <p className="text-sm text-gray-500 dark:text-white/40 mt-0.5">Create Intercom search templates and browse matching conversations</p>
          </div>
          <button
            onClick={() => openEditor()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-sm font-medium text-gray-700 dark:text-white/80 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <Plus className="w-4 h-4" /> New Template
          </button>
        </div>

        {/* Template List */}
        {loadingTemplates ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-gray-300 dark:text-white/40" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Default Templates */}
            {defaultTemplates.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-white/30 mb-3">Default Templates</h3>
                <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid gap-3">
                  {defaultTemplates.map(template => (
                    <motion.div
                      key={template._id}
                      variants={staggerItem}
                      className="group flex items-center justify-between p-4 rounded-xl bg-blue-50/50 dark:bg-blue-500/[0.04] border border-blue-100/60 dark:border-blue-400/[0.08] hover:bg-blue-50 dark:hover:bg-blue-500/[0.07] shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-none transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white/90 truncate">{template.name}</h3>
                          <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300">Default</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-white/35 mt-1 truncate">{getFilterSummary(template.filters)}</p>
                      </div>
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleDuplicateTemplate(template._id)}
                          className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-500/15 text-gray-400 dark:text-white/40 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
                          title="Duplicate to My Templates"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            fetchRefData();
                            setActiveTemplateId(template._id);
                            setSearchParams({ drill: template._id, idx: '0' });
                            executeReport(template.filters, template.name);
                          }}
                          disabled={executing}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-500/15 hover:bg-blue-200 dark:hover:bg-blue-500/25 text-sm text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
                          title="Execute & Drill In"
                        >
                          {executing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                          Drill In
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            )}

            {/* User Templates */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-white/30 mb-3">My Templates</h3>
              {templates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-white/40">
                  <FileText className="w-8 h-8 mb-2 opacity-40" />
                  <p className="text-sm">No custom templates yet</p>
                  <p className="text-xs mt-1 text-gray-400 dark:text-white/30">Create one or duplicate a default template</p>
                </div>
              ) : (
                <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid gap-3">
                  {templates.map(template => (
                    <motion.div
                      key={template._id}
                      variants={staggerItem}
                      className="group flex items-center justify-between p-4 rounded-xl bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] hover:bg-gray-50 dark:hover:bg-white/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-none transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white/90 truncate">{template.name}</h3>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-white/35 mt-1 truncate">{getFilterSummary(template.filters)}</p>
                        <p className="text-xs text-gray-400 dark:text-white/25 mt-0.5">
                          Updated {new Date(template.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditor(template)}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/80 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDuplicateTemplate(template._id)}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/80 transition-colors"
                          title="Duplicate"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(template._id)}
                          disabled={deletingId === template._id}
                          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 dark:text-white/40 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          {deletingId === template._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => {
                            fetchRefData();
                            setActiveTemplateId(template._id);
                            setSearchParams({ drill: template._id, idx: '0' });
                            executeReport(template.filters, template.name);
                          }}
                          disabled={executing}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-sm text-gray-700 dark:text-white/80 hover:text-gray-900 dark:hover:text-white transition-colors"
                          title="Execute & Drill In"
                        >
                          {executing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                          Drill In
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        )}

        {/* TEMPLATE EDITOR DIALOG */}
        <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-white dark:bg-neutral-900 border-gray-200 dark:border-white/10">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-white">
                {editingTemplate ? 'Edit Template' : 'New Template'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-5 mt-2">
              {/* Template Name */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-white/50 mb-1.5">Template Name</label>
                <input
                  value={editorName}
                  onChange={(e) => setEditorName(e.target.value)}
                  placeholder="e.g. GordanR Weekly Review"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-white/5 text-sm text-gray-900 dark:text-white/90 outline-none focus:border-gray-300 dark:focus:border-white/20 placeholder:text-gray-400 dark:placeholder:text-white/25"
                />
              </div>

              {loadingRefData ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400 dark:text-white/40" />
                  <span className="ml-2 text-sm text-gray-400 dark:text-white/40">Loading Intercom data...</span>
                </div>
              ) : (
                <>
                  {/* Teammate replied to */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-gray-500 dark:text-white/50 flex items-center gap-1.5">
                        <UserRound className="w-3.5 h-3.5" /> Teammate
                      </label>
                      <OperatorToggle
                        value={editorFilters.adminAssigneeOperator || 'is'}
                        onChange={(v) => updateFilter('adminAssigneeOperator', v)}
                      />
                    </div>
                    <SearchableDropdown
                      items={refData.admins}
                      selected={editorFilters.adminAssigneeIds || []}
                      onSelect={(item) => updateFilter('adminAssigneeIds', [...(editorFilters.adminAssigneeIds || []), { id: item.id, name: item.name }])}
                      onRemove={(item) => updateFilter('adminAssigneeIds', (editorFilters.adminAssigneeIds || []).filter(a => a.id !== item.id))}
                      placeholder="Search teammates..."
                    />
                  </div>

                  {/* Topics */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-gray-500 dark:text-white/50 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" /> Topics
                      </label>
                      <OperatorToggle
                        value={editorFilters.topicOperator || 'is'}
                        onChange={(v) => updateFilter('topicOperator', v)}
                      />
                    </div>
                    <SearchableDropdown
                      items={INTERCOM_TOPICS}
                      selected={(editorFilters.topics || []).map(t => typeof t === 'string' ? INTERCOM_TOPICS.find(it => it.name === t) || { id: t, name: t } : t)}
                      onSelect={(item) => updateFilter('topics', [...(editorFilters.topics || []), item.name])}
                      onRemove={(item) => updateFilter('topics', (editorFilters.topics || []).filter(t => t !== (item.name || item)))}
                      placeholder="Search topics..."
                    />
                  </div>

                  {/* Conversation Tags */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-gray-500 dark:text-white/50 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5" /> Conversation Tags
                      </label>
                      <OperatorToggle
                        value={editorFilters.tagOperator || 'is'}
                        onChange={(v) => updateFilter('tagOperator', v)}
                      />
                    </div>
                    <SearchableDropdown
                      items={refData.tags}
                      selected={editorFilters.tagIds || []}
                      onSelect={(item) => updateFilter('tagIds', [...(editorFilters.tagIds || []), { id: item.id, name: item.name }])}
                      onRemove={(item) => updateFilter('tagIds', (editorFilters.tagIds || []).filter(t => t.id !== item.id))}
                      placeholder="Search tags..."
                    />
                  </div>

                  {/* KYC Country */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-gray-500 dark:text-white/50 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5" /> KYC Country
                      </label>
                      <OperatorToggle
                        value={editorFilters.kycCountryOperator || 'is'}
                        onChange={(v) => updateFilter('kycCountryOperator', v)}
                      />
                    </div>
                    <SearchableDropdown
                      items={KYC_COUNTRIES}
                      selected={(editorFilters.kycCountries || []).map(c => typeof c === 'string' ? KYC_COUNTRIES.find(k => k.id === c) || { id: c, name: c } : c)}
                      onSelect={(item) => updateFilter('kycCountries', [...(editorFilters.kycCountries || []), item.id])}
                      onRemove={(item) => updateFilter('kycCountries', (editorFilters.kycCountries || []).filter(c => c !== (item.id || item)))}
                      placeholder="Search countries..."
                    />
                  </div>

                  {/* Team */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-gray-500 dark:text-white/50 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" /> Team
                      </label>
                      <OperatorToggle
                        value={editorFilters.teamAssigneeOperator || 'is'}
                        onChange={(v) => updateFilter('teamAssigneeOperator', v)}
                      />
                    </div>
                    <SearchableDropdown
                      items={refData.teams}
                      selected={editorFilters.teamAssigneeIds || []}
                      onSelect={(item) => updateFilter('teamAssigneeIds', [...(editorFilters.teamAssigneeIds || []), { id: item.id, name: item.name }])}
                      onRemove={(item) => updateFilter('teamAssigneeIds', (editorFilters.teamAssigneeIds || []).filter(t => t.id !== item.id))}
                      placeholder="Search teams..."
                    />
                  </div>

                  {/* Date Range */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-white/50 mb-1.5 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> Date Range
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <DatePicker
                          value={editorFilters.dateFrom || ''}
                          onChange={(d) => updateFilter('dateFrom', d || null)}
                          placeholder="From"
                          disablePortal
                        />
                      </div>
                      <span className="text-gray-400 dark:text-white/30 text-xs">to</span>
                      <div className="flex-1">
                        <DatePicker
                          value={editorFilters.dateTo || ''}
                          onChange={(d) => updateFilter('dateTo', d || null)}
                          placeholder="To"
                          disablePortal
                        />
                      </div>
                    </div>
                  </div>

                  {/* State */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-white/50 mb-1.5">State</label>
                    <select
                      value={editorFilters.state || ''}
                      onChange={(e) => updateFilter('state', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-white/5 text-sm text-gray-900 dark:text-white/90 outline-none"
                    >
                      <option value="">Any</option>
                      <option value="open">Open</option>
                      <option value="closed">Closed</option>
                      <option value="snoozed">Snoozed</option>
                    </select>
                  </div>
                </>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-white/[0.06]">
                <button
                  onClick={() => setEditorOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm text-gray-500 dark:text-white/50 hover:text-gray-700 dark:hover:text-white/70 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSaveTemplate(false)}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-sm text-gray-700 dark:text-white/80 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                </button>
                <button
                  onClick={() => handleSaveTemplate(true)}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm text-white transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Play className="w-3.5 h-3.5" /> Save & Drill In</>}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ============================================
  // RENDER: DRILL-IN VIEW
  // ============================================

  const currentConv = searchedTicketId ? { id: searchedTicketId } : reportResults[currentIndex];

  const handleTicketSearch = () => {
    const id = ticketSearchValue.trim().replace(/^#/, '');
    if (!id) return;
    // Check if already in results — just navigate there
    const existingIdx = reportResults.findIndex(c => c.id === id);
    if (existingIdx !== -1) {
      setSearchedTicketId(null);
      setCurrentIndex(existingIdx);
    } else {
      // Temporary overlay — doesn't touch reportResults
      setSearchedTicketId(id);
    }
    setTicketSearchOpen(false);
    setTicketSearchValue('');
  };

  const navControls = (
    <>
      <button
        onClick={() => { setView('templates'); setActiveTemplateId(null); setSearchParams({}); clearDrillCache(); }}
        className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:text-neutral-500 dark:hover:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
        title="Back to templates"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
      </button>
      <span className="mx-0.5 h-3 w-px bg-gray-200 dark:bg-neutral-700" />
      {ticketSearchOpen ? (
        <form
          onSubmit={(e) => { e.preventDefault(); handleTicketSearch(); }}
          className="flex items-center gap-1 flex-1 min-w-0"
        >
          <input
            ref={ticketSearchRef}
            autoFocus
            value={ticketSearchValue}
            onChange={(e) => setTicketSearchValue(e.target.value)}
            placeholder="Conversation ID..."
            className="w-full min-w-[100px] bg-transparent text-[10px] text-gray-700 dark:text-neutral-300 placeholder-gray-400 dark:placeholder-neutral-600 outline-none font-mono"
            onKeyDown={(e) => { if (e.key === 'Escape') { setTicketSearchOpen(false); setTicketSearchValue(''); } }}
            onBlur={() => { if (!ticketSearchValue) setTicketSearchOpen(false); }}
          />
          <button type="submit" className="p-0.5 rounded text-gray-400 hover:text-gray-600 dark:text-neutral-500 dark:hover:text-neutral-300 transition-colors">
            <ArrowLeft className="w-3 h-3 rotate-[225deg]" />
          </button>
        </form>
      ) : (
        <>
          <span className="text-[9px] text-gray-400 dark:text-neutral-600 truncate max-w-[80px]" title={activeTemplateName}>
            {activeTemplateName}
          </span>
          <button
            onClick={() => { setTicketSearchOpen(true); setTimeout(() => ticketSearchRef.current?.focus(), 0); }}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:text-neutral-500 dark:hover:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors ml-auto"
            title="Search conversation by ID"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        </>
      )}
      {!ticketSearchOpen && (
        <>
          <span className="text-[10px] text-gray-400 dark:text-neutral-500 tabular-nums px-0.5 ml-auto">
            {reportResults.length > 0 ? `${currentIndex + 1}/${totalCount || reportResults.length}` : '0'}
          </span>
          <button
            onClick={() => { setSearchedTicketId(null); setCurrentIndex(i => Math.max(0, i - 1)); }}
            disabled={currentIndex === 0}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:text-neutral-500 dark:hover:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 disabled:opacity-20 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => { setSearchedTicketId(null); setCurrentIndex(i => Math.min(reportResults.length - 1, i + 1)); }}
            disabled={currentIndex >= reportResults.length - 1}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:text-neutral-500 dark:hover:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 disabled:opacity-20 transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </>
      )}
    </>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Main Content */}
      {executing ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-gray-300 dark:text-white/20" />
        </div>
      ) : reportResults.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[11px] text-gray-400 dark:text-white/25">No conversations match</p>
        </div>
      ) : (
        <div className="flex-1 flex min-h-0">
          {/* LEFT — Chat (collapsible) */}
          <div className={`border-r border-gray-200 dark:border-white/[0.04] overflow-y-auto transition-all duration-300 ease-in-out ${chatCollapsed ? 'w-0 min-w-0 overflow-hidden border-r-0' : 'w-[30%] min-w-[320px]'}`}>
            {currentConv && !chatCollapsed && (
              <ConversationPanel key={currentConv.id} ticketId={currentConv.id} headerExtra={navControls} />
            )}
          </div>

          {/* RIGHT — Metadata strip + ACP area + Create Ticket */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Metadata strip — single row, expandable */}
            <div className="flex items-stretch">
              <button
                onClick={() => setChatCollapsed(prev => !prev)}
                className="shrink-0 flex items-center gap-1 px-2 border-b border-r border-gray-100 dark:border-white/[0.04] bg-gray-50/50 dark:bg-white/[0.02] hover:bg-gray-100 dark:hover:bg-white/[0.05] text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white/70 transition-colors"
                title={chatCollapsed ? 'Show chat' : 'Hide chat'}
              >
                <ChevronLeft className={`w-3.5 h-3.5 transition-transform duration-300 ${chatCollapsed ? 'rotate-180' : ''}`} />
              </button>
              <div className="flex-1 min-w-0">
                {currentConv && (() => {
                  const stateVal = conversationMeta?.state || currentConv.state;
                  const topics = conversationMeta?.topics || currentConv.topics || [];
                  const tags = conversationMeta?.tags || currentConv.tags || [];
                  return (
                    <MetadataStrip
                      conv={currentConv}
                      stateVal={stateVal}
                      topics={topics}
                      tags={tags}
                      conversationMeta={conversationMeta}
                    />
                  );
                })()}
              </div>
            </div>

            {/* ACP Data Area — fills all remaining space */}
            <div className="flex-1 min-h-0 flex">
              {/* ACP Sidebar — collapsed icons, expands on hover */}
              {acpData?.data?.user && (
                <div
                  className={`shrink-0 border-r border-gray-100 dark:border-white/[0.04] flex flex-col overflow-x-hidden overflow-y-auto transition-all duration-200 ease-out ${acpSidebarHover ? 'acp-sidebar-expanded' : 'acp-sidebar-collapsed'}`}
                  style={{ width: acpSidebarHover ? 185 : 40 }}
                  onMouseEnter={() => setAcpSidebarHover(true)}
                  onMouseLeave={() => setAcpSidebarHover(false)}
                >
                  {(() => {
                    const acpPages = [
                      { id: 'summary', label: 'Summary', icon: BarChart3, isDefault: true },
                      { id: 'actions', label: 'Actions', icon: Zap },
                      { id: 'addresses', label: 'Addresses', icon: MapPin },
                      { id: 'adjustments', label: 'Adjustments', icon: DollarSign },
                      { id: 'affiliate', label: 'Affiliate', icon: Link2 },
                      { id: 'affiliate-profile', label: 'Affiliate Profile', icon: UserCog },
                      { id: 'bet-archives', label: 'Bet Archives', icon: Archive },
                      { id: 'bonuses', label: 'Bonuses', icon: Gift },
                      { id: 'cash-advance', label: 'Cash Advance', icon: Landmark },
                      { id: 'cashier', label: 'Cashier', icon: CreditCard },
                      { id: 'casino', label: 'Casino', icon: Dice5 },
                      { id: 'challenges', label: 'Challenges', icon: Trophy },
                      { id: 'chat', label: 'Chat', icon: MessageSquare },
                      { id: 'deposit-limits', label: 'Deposit Limits', icon: ArrowDownUp },
                      { id: 'gambling-limits', label: 'Gambling Limits', icon: Slash },
                      { id: 'kick', label: 'KICK', icon: Megaphone },
                      { id: 'kyc', label: 'KYC', icon: ShieldCheck },
                      { id: 'login-codes', label: 'Login Codes', icon: KeyRound },
                      { id: 'money-laundering', label: 'Money Laundering', icon: AlertTriangle },
                      { id: 'notes', label: 'Notes', icon: StickyNote },
                      { id: 'overall', label: 'Overall', icon: Globe },
                      { id: 'passkeys', label: 'Passkeys', icon: Fingerprint },
                      { id: 'permission', label: 'Permission', icon: Lock },
                      { id: 'race-positions', label: 'Race Positions', icon: Flag },
                      { id: 'racebook', label: 'Racebook', icon: Gauge },
                      { id: 'raffles', label: 'Raffles', icon: Star },
                      { id: 'rakeback', label: 'Rakeback', icon: Percent },
                      { id: 'rate-limits', label: 'Rate Limits', icon: Timer },
                      { id: 'reload', label: 'Reload', icon: RefreshCw },
                      { id: 'roles', label: 'Roles', icon: UserCog },
                      { id: 'rollover', label: 'Rollover', icon: RotateCw },
                      { id: 'session-limits', label: 'Session Limits', icon: Timer },
                      { id: 'sessions', label: 'Sessions', icon: Monitor },
                      { id: 'sportsbook', label: 'Sportsbook', icon: TrendingUp },
                      { id: 'swish-markets', label: 'Swish Markets', icon: BarChart3 },
                      { id: 'tags', label: 'Tags', icon: Tag },
                      { id: 'terms-of-service', label: 'Terms of Service', icon: ScrollText },
                      { id: 'throttles', label: 'Throttles', icon: Gauge },
                      { id: 'transactions', label: 'Transactions', icon: ArrowDownUp },
                      { id: 'vip', label: 'VIP', icon: Star },
                      { id: 'withdrawal-limits', label: 'Withdrawal Limits', icon: ArrowDownUp },
                      { type: 'divider' },
                      { id: 'offers', label: 'Offers', icon: Gift },
                      { id: 'promotions', label: 'Promotions', icon: Megaphone },
                      { id: 'search', label: 'Search', icon: Search },
                    ];

                    const toggleSection = (id) => {
                      setAcpVisibleSections(prev => {
                        if (prev.includes(id)) return prev.filter(s => s !== id);
                        return [...prev, id];
                      });
                      setAcpExpandedSections(prev => { const n = new Set(prev); n.delete(id); return n; });
                    };

                    return acpPages.map((page, i) => {
                      if (page.type === 'divider') {
                        return <div key={`div-${i}`} className="my-1 mx-2 border-t border-gray-100 dark:border-white/[0.06]" />;
                      }
                      const Icon = page.icon;
                      const isActive = page.isDefault || acpVisibleSections.includes(page.id);
                      return (
                        <button
                          key={page.id}
                          onClick={() => !page.isDefault && toggleSection(page.id)}
                          className={`flex items-center gap-2 px-2.5 py-1.5 text-left transition-colors whitespace-nowrap ${
                            isActive
                              ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/[0.08]'
                              : 'text-gray-500 dark:text-white/50 hover:text-gray-700 dark:hover:text-white/50 hover:bg-gray-50 dark:hover:bg-white/[0.03]'
                          }`}
                          title={!acpSidebarHover ? page.label : undefined}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span className={`text-[12px] font-medium truncate transition-opacity duration-200 ${acpSidebarHover ? 'opacity-100' : 'opacity-0'}`}>{page.label}</span>
                        </button>
                      );
                    });
                  })()}
                </div>
              )}

              {/* ACP Main Content */}
              <div className="flex-1 min-w-0 overflow-y-auto p-4">
              {!acpStatus?.connected ? (
                <div className="h-full rounded-lg border border-dashed border-gray-200 dark:border-white/[0.06] flex flex-col items-center justify-center gap-3 bg-gray-50/30 dark:bg-transparent">
                  <span className="text-[12px] text-gray-500 dark:text-white/45 select-none tracking-widest uppercase">ACP</span>
                  <button
                    onClick={startAcpAuth}
                    className="px-3 py-1.5 rounded-md text-[12px] font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                  >
                    {acpStatus?.expired ? 'Reconnect ACP' : 'Connect ACP'}
                  </button>
                  {acpStatus?.expired && (
                    <span className="text-[11px] text-amber-500">Token expired</span>
                  )}
                </div>
              ) : acpLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400 dark:text-white/35" />
                </div>
              ) : acpError ? (
                <div className="h-full rounded-lg border border-dashed border-red-200 dark:border-red-500/10 flex flex-col items-center justify-center gap-2 bg-red-50/30 dark:bg-transparent">
                  <span className="text-[12px] text-red-400 dark:text-red-400/60">{acpError}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const conv = reportResults[currentIndex];
                        const extId = conversationMeta?.contactExternalId || conv?.contactExternalId;
                        if (extId) fetchAcpData(extId);
                      }}
                      className="px-2.5 py-1 rounded text-[11px] font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 hover:bg-red-50 dark:hover:bg-red-500/[0.05] transition-colors"
                    >
                      Retry
                    </button>
                    <button
                      onClick={startAcpAuth}
                      className="px-2.5 py-1 rounded text-[11px] font-medium text-gray-500 dark:text-white/50 border border-gray-200 dark:border-white/[0.06] hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors"
                    >
                      Reconnect
                    </button>
                  </div>
                </div>
              ) : acpData?.data?.user ? (
                (() => {
                  const u = acpData.data.user;
                  const copyText = (t) => { navigator.clipboard.writeText(t).then(() => toast.success('Copied')); };
                  const fmt$ = (v) => v == null ? '—' : typeof v === 'number' ? (v < 0 ? '-$' + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })) : String(v);
                  const fmtPct = (v) => v == null ? '—' : (v * 100).toFixed(2) + '%';

                  // Skeleton loader for ACP sections
                  const AcpSkeleton = ({ rows = 6 }) => {
                    const widths = [
                      [72, 96, 56, 120],
                      [88, 64, 104, 80],
                      [64, 112, 72, 96],
                      [96, 80, 88, 64],
                      [80, 72, 96, 112],
                      [104, 88, 64, 80],
                      [72, 96, 112, 56],
                      [88, 64, 80, 104],
                    ];
                    return (
                      <div className="animate-pulse py-1">
                        <div className="flex gap-6 mb-4 px-1">
                          <div className="h-2.5 w-16 rounded-sm bg-gray-200/70 dark:bg-white/[0.06]" />
                          <div className="h-2.5 w-20 rounded-sm bg-gray-200/70 dark:bg-white/[0.06]" />
                          <div className="h-2.5 w-14 rounded-sm bg-gray-200/70 dark:bg-white/[0.06]" />
                          <div className="h-2.5 w-24 rounded-sm bg-gray-200/70 dark:bg-white/[0.06]" />
                        </div>
                        {Array.from({ length: rows }).map((_, i) => (
                          <div key={i} className="flex gap-6 items-center py-[9px] px-1 border-t border-gray-100/50 dark:border-white/[0.04]">
                            {(widths[i % widths.length]).map((w, j) => (
                              <div key={j} className="h-3 rounded-sm bg-gray-100 dark:bg-white/[0.04]" style={{ width: w }} />
                            ))}
                            <div className="h-3 flex-1 rounded-sm bg-gray-50 dark:bg-white/[0.02]" />
                          </div>
                        ))}
                      </div>
                    );
                  };

                  // VIP
                  const currentFlags = (u.flags || []).map(f => f.flag);
                  const vipOrder = ['bronze','silver','gold','platinum','diamond','obsidian'];
                  const currentVip = [...vipOrder].reverse().find(v => currentFlags.includes(v)) || 'none';
                  const vipLabels = { none:'None', bronze:'Bronze', silver:'Silver', gold:'Gold', platinum:'Platinum I', diamond:'Diamond', obsidian:'Obsidian' };
                  const nextVipMap = { none:'Bronze', bronze:'Silver', silver:'Gold', gold:'Platinum I', platinum:'Platinum II', diamond:'Obsidian', obsidian:'' };
                  const vipBarColor = { none:'#6b7280', bronze:'#b45309', silver:'#9ca3af', gold:'#eab308', platinum:'#22c55e', diamond:'#3b82f6', obsidian:'#7c3aed' };
                  const vipProgress = u.flagProgress?.progress ?? 0;

                  // Balances (non-zero)
                  const nonZeroBalances = (u.balances || []).filter(b => {
                    const a = b.available;
                    if (!a) return false;
                    if (Array.isArray(a)) return a.some(x => parseFloat(x.amount) !== 0);
                    return parseFloat(a.amount) !== 0;
                  });

                  // Build snapshot rows from USD-converted snapshotSummary per period
                  const ssToRow = (label, ss) => ({
                    label,
                    wagered: ss?.betValue || 0,
                    profit: (ss?.profitValue || 0) + (ss?.playerExpense || 0),
                    bonuses: ss?.playerExpense || 0,
                  });
                  const periodRows = [
                    ssToRow('Day', u.snapDay),
                    ssToRow('Week', u.snapWeek),
                    ssToRow('Fortnight', u.snapFortnight),
                    ssToRow('30 Days', u.snapThirtyDays),
                    ssToRow('Annual', u.snapAnnual),
                    ssToRow('Overall', u.snapshotSummary),
                  ];

                  // Green/Red badge helpers
                  const GBadge = ({ children }) => (
                    <span className="px-1.5 py-0.5 rounded text-[12px] font-medium bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20">{children}</span>
                  );
                  const RedBadge = ({ children }) => (
                    <span className="px-1.5 py-0.5 rounded text-[12px] font-medium bg-red-500/15 text-red-500 dark:text-red-400 border border-red-500/15">{children}</span>
                  );

                  return (
                    <div className="space-y-2">

                      {/* ── Row 1: Username + ID + VIP — all inline ── */}
                      <div className="flex items-center gap-2 flex-wrap shrink-0">
                        {/* Role badges */}
                        {u.roles && u.roles.length > 0 && u.roles.map((role, ri) => {
                          const roleName = (role.name || '').toLowerCase();
                          const roleColors = {
                            suspendedtipping: 'bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border-amber-500/20',
                            whitelist: 'bg-blue-500/15 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border-blue-500/20',
                            suspended: 'bg-red-500/15 text-red-500 dark:bg-red-500/20 dark:text-red-400 border-red-500/20',
                            banned: 'bg-red-600/15 text-red-600 dark:bg-red-600/20 dark:text-red-400 border-red-600/20',
                            muted: 'bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border-amber-500/20',
                            admin: 'bg-purple-500/15 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 border-purple-500/20',
                            moderator: 'bg-blue-500/15 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border-blue-500/20',
                          };
                          const colorCls = roleColors[roleName] || Object.entries(roleColors).find(([k]) => roleName.includes(k))?.[1] || 'bg-gray-500/15 text-gray-600 dark:bg-gray-500/20 dark:text-gray-500 border-gray-500/20';
                          const fmtExpiry = (ts) => {
                            if (!ts) return null;
                            const d = new Date(/^\d+$/.test(String(ts)) ? Number(ts) : ts);
                            if (isNaN(d)) return null;
                            const diff = d.getTime() - Date.now();
                            if (diff <= 0) return 'expired';
                            const mins = Math.floor(diff / 60000);
                            if (mins < 60) return `in ${mins} min`;
                            const hrs = Math.floor(mins / 60);
                            if (hrs < 24) return `in ${hrs} hr${hrs > 1 ? 's' : ''}`;
                            const days = Math.floor(hrs / 24);
                            if (days < 7) return `in ${days} day${days > 1 ? 's' : ''}`;
                            const weeks = Math.floor(days / 7);
                            return `in ${weeks} week${weeks > 1 ? 's' : ''}`;
                          };
                          const expiry = fmtExpiry(role.expireAt);
                          return (
                            <span key={ri} className={`group relative w-5 h-5 rounded border text-[11px] font-bold uppercase cursor-default inline-flex items-center justify-center ${colorCls}`}>
                              {(role.name || '?')[0]}
                              <span className="pointer-events-none absolute top-full left-0 mt-1.5 px-2.5 py-1.5 rounded-md bg-gray-900 dark:bg-[#1a1a1a] text-[11px] text-white dark:text-white/80 font-normal normal-case whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg border border-white/10">
                                <span className="font-semibold">{role.name}</span>
                                {expiry && <span> expires at: {expiry}</span>}
                                {role.message && <><br />Reason: {role.message}</>}
                              </span>
                            </span>
                          );
                        })}
                        <span className="text-[14px] font-bold text-gray-800 dark:text-white/90">{u.name}</span>
                        <button onClick={() => copyText(u.name)} className="text-gray-400 dark:text-white/35 hover:text-gray-500 dark:hover:text-white/50"><Copy className="w-3 h-3" /></button>
                        {u.isBanned && <span className="px-1 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-500 uppercase">Banned</span>}
                        <span className="text-gray-400 dark:text-white/10">|</span>
                        <span className="text-[12px] text-gray-500 dark:text-white/50 font-mono truncate max-w-[220px]">{u.id}</span>
                        <button onClick={() => copyText(u.id)} className="text-gray-400 dark:text-white/35 hover:text-gray-500 dark:hover:text-white/50"><Copy className="w-3 h-3" /></button>
                        {u.flagProgress && (<>
                          <span className="text-gray-400 dark:text-white/10">|</span>
                          <span className="text-[12px] font-medium" style={{ color: vipBarColor[currentVip] }}>{vipLabels[currentVip]}</span>
                          <div className="w-16 h-1.5 rounded-full bg-gray-200 dark:bg-white/[0.06] overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${Math.min(vipProgress * 100, 100)}%`, backgroundColor: vipBarColor[currentVip] }} />
                          </div>
                          <span className="text-[12px] font-bold" style={{ color: vipBarColor[currentVip] }}>{(vipProgress * 100).toFixed(1)}%</span>
                          {nextVipMap[currentVip] && <span className="text-[11px] text-gray-500 dark:text-white/35">→ {nextVipMap[currentVip]}</span>}
                        </>)}
                        <button onClick={startAcpAuth} className="ml-auto text-[11px] text-gray-500 dark:text-white/35 hover:text-gray-600 dark:hover:text-white/50">Reconnect</button>
                      </div>

                      {/* ── Tags ── */}
                      {u.tags && u.tags.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap">
                          {u.tags.map(tag => (
                            <span key={tag.id} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-white/55 border border-gray-200 dark:border-white/[0.06]">
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* ── Row 2: Account details — all inline, wrapping ── */}
                      <div className="flex flex-wrap gap-x-3 gap-y-1 shrink-0">
                        {(() => {
                          // KYC display: "L2-Confirmed", "L1-Pending" etc
                          const kycDisplay = (() => {
                            const s = u.kycStatus || '';
                            if (s.includes('extended')) return 'L2-' + (s.includes('Confirmed') ? 'Confirmed' : s.includes('Pending') ? 'Pending' : s.replace('extended', ''));
                            if (s.includes('basic')) return 'L1-' + (s.includes('Confirmed') ? 'Confirmed' : s.includes('Pending') ? 'Pending' : s.replace('basic', ''));
                            return s || '—';
                          })();
                          // Preferred fiat
                          const prefFiat = u.preference?.defaultFiatCurrency || '';
                          // Phone: single +, no unverified tag
                          const phone = u.phoneNumber ? `+${(u.phoneCountryCode || '').replace(/^\+/, '')} ${u.phoneNumber}` : '';

                          const fields = [
                            ['Created', u.createdAt ? new Date(u.createdAt).toLocaleString('en-US', { hour:'numeric', minute:'2-digit', hour12:true, month:'numeric', day:'numeric', year:'numeric' }) : '—'],
                            ['Account Type', u.oauthProvider ? u.oauthProvider : 'password', 'green'],
                            ['Email' + (u.email ? (u.hasEmailVerified ? ' (verified)' : '') : ''), u.email || '—', u.email && u.hasEmailVerified ? 'green' : null],
                            ['2FA', u.hasTfaEnabled ? 'Yes' : 'No', u.hasTfaEnabled ? 'green' : null],
                            ['Phone' + (phone ? (u.hasPhoneNumberVerified ? ' (verified)' : '') : ''), phone || '—', phone ? (u.hasPhoneNumberVerified ? 'green' : 'caution') : null],
                            ['Rakeback', u.rakeback?.rate != null && u.rakeback.rate > 0 ? `${u.rakeback.rate} (${u.rakeback.enabled ? 'enabled' : 'disabled'})` : 'No', u.rakeback?.rate > 0 ? (u.rakeback.enabled ? 'green' : 'caution') : null],
                            ['KYC', kycDisplay, u.kycStatus?.includes('Confirmed') ? 'green' : null],
                            ['Preferred Fiat Currency', prefFiat || '—'],
                            ['Email Subscribed', u.hasEmailSubscribed ? 'Yes' : 'No', u.hasEmailSubscribed ? 'green' : null],
                          ];

                          return fields.map(([label, val, badge], i) => (
                            <span key={i} className="inline-flex items-center gap-1 text-[12px]">
                              <span className="text-gray-500 dark:text-white/50 font-medium">{label}</span>
                              {badge === 'green' ? <GBadge>{val}</GBadge> : badge === 'red' ? <RedBadge>{val}</RedBadge> : badge === 'caution' ? (
                                <span className="px-1.5 py-0.5 rounded text-[12px] font-medium bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/15">{val}</span>
                              ) : <span className="text-gray-700 dark:text-white/75 font-medium">{val}</span>}
                            </span>
                          ));
                        })()}
                        {nonZeroBalances.length > 0 && nonZeroBalances.map((b, i) => {
                          const a = b.available;
                          const avail = Array.isArray(a) ? a.find(x => parseFloat(x.amount) !== 0) : a;
                          if (!avail) return null;
                          return (
                            <span key={`bal-${i}`} className="inline-flex items-center gap-0.5 text-[12px]">
                              <span className="font-medium text-gray-700 dark:text-white/75">{parseFloat(avail.amount).toFixed(2)}</span>
                              <span className="text-gray-500 dark:text-white/50 uppercase text-[10px]">{avail.currency}</span>
                            </span>
                          );
                        })}
                      </div>

                      {/* ── Snapshot Table ── */}
                      <div>
                        {periodRows.length > 0 ? (
                          <div className="rounded-lg bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] overflow-hidden">
                            <div>
                              <table className="w-full">
                                <thead>
                                  <tr className="border-b border-gray-200 dark:border-white/[0.06]">
                                    {['Period','Wagered','Profit','Bonuses'].map(h => (
                                      <th key={h} className="px-3 py-1.5 text-left text-[12px] font-medium text-gray-500 dark:text-white/50 whitespace-nowrap">{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {periodRows.map((r, i) => (
                                    <tr key={i} className={`border-b border-gray-100 dark:border-white/[0.04] hover:bg-gray-100/50 dark:hover:bg-white/[0.02] transition-colors ${r.label === 'Overall' ? 'bg-gray-100/40 dark:bg-white/[0.02] font-semibold' : ''}`}>
                                      <td className="px-3 py-2 text-[13px] font-medium text-gray-700 dark:text-white/75 whitespace-nowrap">{r.label}</td>
                                      <td className="px-3 py-2 text-[13px] text-gray-700 dark:text-white/75 whitespace-nowrap">{fmt$(r.wagered)}</td>
                                      <td className={`px-3 py-2 text-[13px] font-semibold whitespace-nowrap ${r.profit < 0 ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{fmt$(r.profit)}</td>
                                      <td className="px-3 py-2 text-[13px] text-gray-700 dark:text-white/75 whitespace-nowrap">{fmt$(r.bonuses)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ) : (
                          <div className="py-6 rounded-lg border border-dashed border-gray-200 dark:border-white/[0.06] flex items-center justify-center bg-gray-50/30 dark:bg-transparent">
                            <span className="text-[13px] text-gray-500 dark:text-white/50">No snapshot data</span>
                          </div>
                        )}
                      </div>

                      {/* ── Collapsible ACP Sections ── */}
                      {acpVisibleSections.map(sectionId => {
                        const sectionLabels = {
                          'actions': 'Actions', 'addresses': 'Addresses', 'adjustments': 'Adjustments',
                          'affiliate': 'Affiliate', 'affiliate-profile': 'Affiliate Profile', 'bet-archives': 'Bet Archives',
                          'bonuses': 'Bonuses', 'cash-advance': 'Cash Advance', 'cashier': 'Cashier',
                          'casino': 'Casino', 'challenges': 'Challenges', 'chat': 'Chat',
                          'deposit-limits': 'Deposit Limits', 'gambling-limits': 'Gambling Limits', 'kick': 'KICK',
                          'kyc': 'KYC', 'login-codes': 'Login Codes', 'money-laundering': 'Money Laundering',
                          'notes': 'Notes', 'overall': 'Overall',
                          'passkeys': 'Passkeys', 'permission': 'Permission', 'race-positions': 'Race Positions',
                          'racebook': 'Racebook', 'raffles': 'Raffles', 'rakeback': 'Rakeback',
                          'rate-limits': 'Rate Limits', 'reload': 'Reload', 'roles': 'Roles',
                          'rollover': 'Rollover', 'session-limits': 'Session Limits', 'sessions': 'Sessions',
                          'sportsbook': 'Sportsbook', 'swish-markets': 'Swish Markets', 'tags': 'Tags',
                          'terms-of-service': 'Terms of Service', 'throttles': 'Throttles', 'transactions': 'Transactions',
                          'vip': 'VIP', 'withdrawal-limits': 'Withdrawal Limits',
                          'offers': 'Offers', 'promotions': 'Promotions', 'search': 'Search',
                        };
                        const isExpanded = acpExpandedSections.has(sectionId);
                        return (
                          <div key={sectionId} className="mt-3 rounded-lg border border-gray-200/60 dark:border-white/[0.08] overflow-hidden">
                            <div className="flex items-center bg-gray-50/80 dark:bg-white/[0.04]">
                              <button
                                onClick={() => setAcpExpandedSections(prev => { const n = new Set(prev); if (n.has(sectionId)) n.delete(sectionId); else n.add(sectionId); return n; })}
                                className="flex-1 flex items-center gap-1.5 px-3 py-2 hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors"
                              >
                                <ChevronDown className={`w-3.5 h-3.5 text-gray-500 dark:text-white/45 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                                <span className="text-[13px] font-semibold text-gray-800 dark:text-white/85">{sectionLabels[sectionId] || sectionId}</span>
                              </button>
                              <button
                                onClick={() => {
                                  setAcpVisibleSections(prev => prev.filter(s => s !== sectionId));
                                  setAcpExpandedSections(prev => { const n = new Set(prev); n.delete(sectionId); return n; });
                                }}
                                className="px-2 py-2 text-gray-400 dark:text-white/30 hover:text-gray-500 dark:hover:text-white/40 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                            {isExpanded && (
                              <div className="px-3 py-3">
                                {sectionId === 'actions' ? (() => {
                                  const u = acpData?.data?.user;
                                  if (!u) return <span className="text-[13px] text-gray-500 dark:text-white/55 italic">No data</span>;
                                  return (
                                    <div>
                                      <span className="text-[12px] font-semibold text-gray-700 dark:text-white/65 tracking-wide">Marketing Preferences</span>
                                      <div className="mt-2 flex flex-col gap-1.5">
                                        {[
                                          { label: 'Subscribe to emails', value: u.hasEmailSubscribed },
                                        ].map(pref => (
                                          <div key={pref.label} className="flex items-center gap-2">
                                            <div className={`w-4 h-4 rounded flex items-center justify-center ${
                                              pref.value
                                                ? 'bg-emerald-500/15 dark:bg-emerald-500/20'
                                                : 'bg-gray-100 dark:bg-white/[0.06]'
                                            }`}>
                                              {pref.value && <Check className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />}
                                            </div>
                                            <span className={`text-[12px] ${
                                              pref.value
                                                ? 'text-gray-700 dark:text-white/75'
                                                : 'text-gray-500 dark:text-white/45'
                                            }`}>{pref.label}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })() : sectionId === 'addresses' ? (() => {
                                  const u = acpData?.data?.user;
                                  const addrs = u?.depositAddressList;
                                  if (!addrs?.length) return <span className="text-[13px] text-gray-500 dark:text-white/55 italic">No addresses</span>;
                                  const cryptoIcon = (c) => `https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/32/color/${c.toLowerCase()}.png`;
                                  const fmtDate = (ts) => {
                                    if (!ts) return '—';
                                    const d = new Date(/^\d+$/.test(ts) ? Number(ts) : ts);
                                    return isNaN(d) ? '—' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                  };
                                  const half = Math.ceil(addrs.length / 2);
                                  const cols = [addrs.slice(0, half), addrs.slice(half)];
                                  const renderCol = (list) => (
                                    <table className="w-full text-[13px]">
                                      <thead>
                                        <tr className="text-[12px] text-gray-500 dark:text-white/45 uppercase tracking-wide">
                                          <th className="text-left pb-2 pl-1 font-medium">Currency</th>
                                          <th className="text-left pb-2 font-medium">Address</th>
                                          <th className="text-right pb-2 pr-1 font-medium">Created</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {list.map((addr, i) => (
                                          <tr key={addr.id || i} className="border-t border-gray-100/80 dark:border-white/[0.06]">
                                            <td className="py-1.5 pl-1 whitespace-nowrap">
                                              <div className="flex items-center gap-1.5">
                                                <img src={cryptoIcon(addr.currency)} alt="" className="w-4 h-4 rounded-full"
                                                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                                                <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-white/10 items-center justify-center text-[8px] font-bold text-gray-500 dark:text-white/55 hidden">
                                                  {addr.currency?.slice(0,2)}
                                                </div>
                                                <span className="font-semibold text-gray-700 dark:text-white/75">{addr.currency}</span>
                                              </div>
                                            </td>
                                            <td className="py-1.5">
                                              <span className="text-gray-500 dark:text-white/55 font-mono text-[12px] select-all break-all">{addr.address}</span>
                                            </td>
                                            <td className="py-1.5 pr-1 text-right text-gray-500 dark:text-white/45 whitespace-nowrap">
                                              {fmtDate(addr.createdAt)}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  );
                                  return (
                                    <div className="max-h-[320px] overflow-y-auto">
                                      <div className="grid grid-cols-2 gap-3">
                                        <div>{renderCol(cols[0])}</div>
                                        <div>{renderCol(cols[1])}</div>
                                      </div>
                                      {addrs.length >= 50 && (
                                        <div className="mt-2 text-center text-[11px] text-gray-500 dark:text-white/35 italic">Showing first 50 addresses</div>
                                      )}
                                    </div>
                                  );
                                })() : sectionId === 'adjustments' ? (() => {
                                  const u = acpData?.data?.user;
                                  const adjs = u?.adjustmentList;
                                  if (!adjs?.length) return <span className="text-[13px] text-gray-500 dark:text-white/55 italic">No adjustments</span>;
                                  const fmtDate = (ts) => {
                                    if (!ts) return '—';
                                    const d = new Date(/^\d+$/.test(ts) ? Number(ts) : ts);
                                    return isNaN(d) ? '—' : d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
                                  };
                                  return (
                                    <div className="max-h-[320px] overflow-y-auto">
                                      <table className="w-full text-[13px]">
                                        <thead className="sticky top-0 bg-white dark:bg-[#0a0a0a] z-[1]">
                                          <tr className="text-[12px] text-gray-500 dark:text-white/45 uppercase tracking-wide">
                                            <th className="text-left pb-2 pl-1 font-medium">Message</th>
                                            <th className="text-right pb-2 font-medium whitespace-nowrap">Amount</th>
                                            <th className="text-right pb-2 font-medium">Value</th>
                                            <th className="text-left pb-2 pl-2 font-medium">Type</th>
                                            <th className="text-right pb-2 font-medium whitespace-nowrap">Created At</th>
                                            <th className="text-right pb-2 pr-1 font-medium whitespace-nowrap">Sent By</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {adjs.map((adj, i) => (
                                            <tr key={i} className="border-t border-gray-100/80 dark:border-white/[0.06] align-top">
                                              <td className="py-1.5 pl-1 text-gray-700 dark:text-white/75 break-words min-w-[120px]">{adj.message || '—'}</td>
                                              <td className="py-1.5 text-right font-mono text-gray-600 dark:text-white/65 whitespace-nowrap">
                                                {adj.amount != null ? (
                                                  <span className="inline-flex items-center gap-1 justify-end">
                                                    {Number(adj.amount).toFixed(8)}
                                                    {adj.currency && <>
                                                      <img src={`https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/32/color/${adj.currency.toLowerCase()}.png`} alt="" className="w-3.5 h-3.5 rounded-full inline-block" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                                                      <span className="w-3.5 h-3.5 rounded-full bg-gray-200 dark:bg-white/10 items-center justify-center text-[6px] font-bold text-gray-500 dark:text-white/55 hidden shrink-0">{adj.currency.slice(0,2)}</span>
                                                    </>}
                                                  </span>
                                                ) : '—'}
                                              </td>
                                              <td className="py-1.5 text-right font-mono text-gray-600 dark:text-white/65 whitespace-nowrap">{adj.value != null ? `$${Number(adj.value).toFixed(2)}` : '—'}</td>
                                              <td className="py-1.5 pl-2 text-gray-500 dark:text-white/55">{adj.type || '—'}</td>
                                              <td className="py-1.5 text-right text-gray-500 dark:text-white/45 whitespace-nowrap">{fmtDate(adj.createdAt)}</td>
                                              <td className="py-1.5 pr-1 text-right text-gray-500 dark:text-white/55 whitespace-nowrap">{adj.authId?.name || '—'}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                      {adjs.length >= 50 && (
                                        <div className="mt-2 text-center text-[11px] text-gray-500 dark:text-white/35 italic">Showing first 50 adjustments</div>
                                      )}
                                    </div>
                                  );
                                })() : sectionId === 'affiliate' ? (() => {
                                  const u = acpData?.data?.user;
                                  if (!u) return <span className="text-[13px] text-gray-500 dark:text-white/55 italic">No data</span>;
                                  const campaigns = u.campaignList || [];
                                  const referred = u.referredCampaign;
                                  const defComm = u.campaignDefaultCommission?.comission;
                                  const fmtDate = (ts) => {
                                    if (!ts) return '—';
                                    const d = new Date(/^\d+$/.test(ts) ? Number(ts) : ts);
                                    return isNaN(d) ? '—' : d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
                                  };
                                  const sumBal = (balances, field) => {
                                    if (!balances?.length) return '—';
                                    const total = balances.reduce((sum, b) => sum + Number(b[field]?.value ?? 0), 0);
                                    return `$${total.toFixed(2)} USD`;
                                  };
                                  return (
                                    <div className="max-h-[400px] overflow-y-auto flex flex-col gap-4">
                                      {/* Campaigns */}
                                      <div>
                                        <div className="flex items-center gap-2 mb-2">
                                          <span className="text-[12px] font-semibold text-gray-700 dark:text-white/65 tracking-wide">Campaigns</span>
                                          {defComm != null && <span className="text-[10px] text-gray-500 dark:text-white/35">Default commission: {defComm}</span>}
                                          <span className="text-[10px] text-gray-500 dark:text-white/35 ml-auto">{campaigns.length} result{campaigns.length !== 1 ? 's' : ''}</span>
                                        </div>
                                        {campaigns.length === 0 ? (
                                          <span className="text-[13px] text-gray-500 dark:text-white/55 italic">No campaigns</span>
                                        ) : (
                                          <div className="overflow-x-auto">
                                            <table className="w-full text-[13px]">
                                              <thead className="sticky top-0 bg-white dark:bg-[#0a0a0a] z-[1]">
                                                <tr className="text-[12px] text-gray-500 dark:text-white/45 uppercase tracking-wide">
                                                  <th className="text-left pb-2 pl-1 font-medium">Campaign</th>
                                                  <th className="text-left pb-2 font-medium">ID</th>
                                                  <th className="text-left pb-2 font-medium">Offer</th>
                                                  <th className="text-right pb-2 font-medium">Hits</th>
                                                  <th className="text-right pb-2 font-medium">Referrals</th>
                                                  <th className="text-right pb-2 font-medium">FTDs</th>
                                                  <th className="text-right pb-2 font-medium">Deposits</th>
                                                  <th className="text-left pb-2 pl-2 font-medium">Type</th>
                                                  <th className="text-right pb-2 font-medium">Comm.</th>
                                                  <th className="text-right pb-2 font-medium">Balances</th>
                                                  <th className="text-right pb-2 font-medium">Commission</th>
                                                  <th className="text-right pb-2 font-medium whitespace-nowrap">Created</th>
                                                  <th className="text-right pb-2 pr-1 font-medium whitespace-nowrap">Updated By</th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {campaigns.map((c, i) => (
                                                  <tr key={c.id || i} className="border-t border-gray-100/80 dark:border-white/[0.06] align-top">
                                                    <td className="py-1.5 pl-1 text-gray-700 dark:text-white/75 font-medium">{c.name || '—'}</td>
                                                    <td className="py-1.5 text-gray-500 dark:text-white/55 font-mono text-[12px]">{c.code || '—'}</td>
                                                    <td className="py-1.5 text-gray-500 dark:text-white/55 text-[11px]">{c.offerCode || '—'}</td>
                                                    <td className="py-1.5 text-right font-mono text-gray-600 dark:text-white/65">{c.hitCount?.toLocaleString() ?? '—'}</td>
                                                    <td className="py-1.5 text-right font-mono text-gray-600 dark:text-white/65">{c.referCount?.toLocaleString() ?? '—'}</td>
                                                    <td className="py-1.5 text-right font-mono text-gray-600 dark:text-white/65">{c.uniqueDepositors?.toLocaleString() ?? '—'}</td>
                                                    <td className="py-1.5 text-right font-mono text-gray-600 dark:text-white/65">{c.depositCount?.toLocaleString() ?? '—'}</td>
                                                    <td className="py-1.5 pl-2 text-gray-500 dark:text-white/55">{c.type || '—'}</td>
                                                    <td className="py-1.5 text-right font-mono text-gray-600 dark:text-white/65">{c.comission ?? '—'}</td>
                                                    <td className="py-1.5 text-right text-gray-500 dark:text-white/55 text-[11px] whitespace-nowrap">{sumBal(c.balances, 'available')}</td>
                                                    <td className="py-1.5 text-right text-gray-500 dark:text-white/55 text-[11px] whitespace-nowrap">{sumBal(c.balances, 'comission')}</td>
                                                    <td className="py-1.5 text-right text-gray-500 dark:text-white/45 whitespace-nowrap">{fmtDate(c.createdAt)}</td>
                                                    <td className="py-1.5 pr-1 text-right text-gray-500 dark:text-white/55 whitespace-nowrap">{c.lastUpdatedBy?.name || '—'}</td>
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                          </div>
                                        )}
                                      </div>

                                      {/* Referred Campaign */}
                                      <div>
                                        <span className="text-[12px] font-semibold text-gray-700 dark:text-white/65 tracking-wide mb-2 block">Referred Campaign</span>
                                        {!referred ? (
                                          <span className="text-[13px] text-gray-500 dark:text-white/55 italic">No referred campaign</span>
                                        ) : (
                                          <div className="overflow-x-auto">
                                            <table className="w-full text-[13px]">
                                              <thead>
                                                <tr className="text-[12px] text-gray-500 dark:text-white/45 uppercase tracking-wide">
                                                  <th className="text-left pb-2 pl-1 font-medium">Name</th>
                                                  <th className="text-left pb-2 font-medium">ID</th>
                                                  <th className="text-right pb-2 font-medium">Hits</th>
                                                  <th className="text-right pb-2 font-medium">Referrals</th>
                                                  <th className="text-right pb-2 font-medium">FTDs</th>
                                                  <th className="text-right pb-2 font-medium">Deposits</th>
                                                  <th className="text-left pb-2 pl-2 font-medium">Type</th>
                                                  <th className="text-right pb-2 font-medium">Comm.</th>
                                                  <th className="text-right pb-2 pr-1 font-medium whitespace-nowrap">Created</th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                <tr className="border-t border-gray-100/80 dark:border-white/[0.06]">
                                                  <td className="py-1.5 pl-1 text-gray-700 dark:text-white/75 font-medium">{referred.name || '—'}</td>
                                                  <td className="py-1.5 text-gray-500 dark:text-white/55 font-mono text-[12px]">{referred.code || '—'}</td>
                                                  <td className="py-1.5 text-right font-mono text-gray-600 dark:text-white/65">{referred.hitCount?.toLocaleString() ?? '—'}</td>
                                                  <td className="py-1.5 text-right font-mono text-gray-600 dark:text-white/65">{referred.referCount?.toLocaleString() ?? '—'}</td>
                                                  <td className="py-1.5 text-right font-mono text-gray-600 dark:text-white/65">{referred.uniqueDepositors?.toLocaleString() ?? '—'}</td>
                                                  <td className="py-1.5 text-right font-mono text-gray-600 dark:text-white/65">{referred.depositCount?.toLocaleString() ?? '—'}</td>
                                                  <td className="py-1.5 pl-2 text-gray-500 dark:text-white/55">{referred.type || '—'}</td>
                                                  <td className="py-1.5 text-right font-mono text-gray-600 dark:text-white/65">{referred.comission ?? '—'}</td>
                                                  <td className="py-1.5 pr-1 text-right text-gray-500 dark:text-white/45 whitespace-nowrap">{fmtDate(referred.createdAt)}</td>
                                                </tr>
                                              </tbody>
                                            </table>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })() : sectionId === 'bonuses' ? (() => {
                                  const u = acpData?.data?.user;
                                  if (!u) return <span className="text-[13px] text-gray-500 dark:text-white/55 italic">No data</span>;
                                  const bonuses = u.bonusList || [];
                                  const fmtDate = (ts) => {
                                    if (!ts) return '—';
                                    const d = new Date(/^\d+$/.test(ts) ? Number(ts) : ts);
                                    return isNaN(d) ? '—' : d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
                                  };
                                  const cryptoIcon = (c) => `https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/32/color/${c.toLowerCase()}.png`;
                                  const fmtSnap = (snap) => {
                                    if (!snap) return '—';
                                    try {
                                      const s = typeof snap === 'string' ? JSON.parse(snap) : snap;
                                      const m = s.margin != null ? `M: ${(Number(s.margin) * 100).toFixed(2)}%` : null;
                                      const rp = s.realProfit != null ? `RP: $${Number(s.realProfit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : null;
                                      const w = s.wagered != null ? `W: $${Number(s.wagered).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : null;
                                      const ev = s.expectedValue != null ? `EV: $${Number(s.expectedValue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : null;
                                      return [m, rp, w, ev].filter(Boolean).join(' | ') || '—';
                                    } catch { return '—'; }
                                  };
                                  return (
                                    <div className="max-h-[400px] overflow-y-auto flex flex-col gap-4">
                                      {/* Received */}
                                      <div>
                                        <div className="flex items-center gap-2 mb-2">
                                          <span className="text-[12px] font-semibold text-gray-700 dark:text-white/65 tracking-wide">Received</span>
                                          <span className="text-[10px] text-gray-500 dark:text-white/35 ml-auto">{bonuses.length} result{bonuses.length !== 1 ? 's' : ''}</span>
                                        </div>
                                        {bonuses.length === 0 ? (
                                          <span className="text-[13px] text-gray-500 dark:text-white/55 italic">No bonuses</span>
                                        ) : (
                                          <div className="overflow-x-auto">
                                            <table className="w-full text-[13px]">
                                              <thead className="sticky top-0 bg-white dark:bg-[#0a0a0a] z-[1]">
                                                <tr className="text-[12px] text-gray-500 dark:text-white/45 uppercase tracking-wide">
                                                  <th className="text-left pb-2 pl-1 font-medium">Note</th>
                                                  <th className="text-right pb-2 font-medium">Amount</th>
                                                  <th className="text-right pb-2 font-medium">Value</th>
                                                  <th className="text-right pb-2 font-medium whitespace-nowrap">Created At</th>
                                                  <th className="text-right pb-2 font-medium whitespace-nowrap">Sent By</th>
                                                  <th className="text-left pb-2 pl-2 font-medium">Snapshot</th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {bonuses.map((b, i) => (
                                                  <tr key={b.id || i} className="border-t border-gray-100/80 dark:border-white/[0.06] align-top">
                                                    <td className="py-1.5 pl-1 text-gray-700 dark:text-white/75 break-words min-w-[140px]">{b.name || '—'}</td>
                                                    <td className="py-1.5 text-right font-mono text-gray-600 dark:text-white/65 whitespace-nowrap">
                                                      {b.amount != null ? (
                                                        <span className="inline-flex items-center gap-1 justify-end">
                                                          {Number(b.amount).toFixed(8)}
                                                          {b.currency && <>
                                                            <img src={cryptoIcon(b.currency)} alt="" className="w-3.5 h-3.5 rounded-full inline-block" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                                                            <span className="w-3.5 h-3.5 rounded-full bg-gray-200 dark:bg-white/10 items-center justify-center text-[6px] font-bold text-gray-500 dark:text-white/55 hidden shrink-0">{b.currency.slice(0,2).toUpperCase()}</span>
                                                          </>}
                                                        </span>
                                                      ) : '—'}
                                                    </td>
                                                    <td className="py-1.5 text-right font-mono text-gray-600 dark:text-white/65 whitespace-nowrap">{b.value != null ? `$${Number(b.value).toFixed(2)}` : '—'}</td>
                                                    <td className="py-1.5 text-right text-gray-500 dark:text-white/45 whitespace-nowrap">{fmtDate(b.createdAt)}</td>
                                                    <td className="py-1.5 text-right text-gray-500 dark:text-white/55 whitespace-nowrap">{b.sendBy?.name || '—'}</td>
                                                    <td className="py-1.5 pl-2 text-gray-500 dark:text-white/45 text-[11px] whitespace-nowrap">{fmtSnap(b.playerSnapshot)}</td>
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                          </div>
                                        )}
                                      </div>

                                      {/* Sent */}
                                      <div>
                                        <span className="text-[12px] font-semibold text-gray-700 dark:text-white/65 tracking-wide mb-2 block">Sent</span>
                                        <span className="text-[13px] text-gray-500 dark:text-white/55 italic">Coming soon</span>
                                      </div>

                                      {/* Deposit Bonuses */}
                                      <div>
                                        <span className="text-[12px] font-semibold text-gray-700 dark:text-white/65 tracking-wide mb-2 block">Deposit Bonuses</span>
                                        <span className="text-[13px] text-gray-500 dark:text-white/55 italic">Coming soon</span>
                                      </div>
                                    </div>
                                  );
                                })() : sectionId === 'casino' ? (() => {
                                  const u = acpData?.data?.user;
                                  if (!u) return <span className="text-[13px] text-gray-500 dark:text-white/55 italic">No data</span>;
                                  const userId = u.id;
                                  const casinoTabs = [
                                    { id: 'bets', label: 'Bets' },
                                    { id: 'games', label: 'Games' },
                                    { id: 'active-originals', label: 'Active Originals' },
                                    { id: 'active-3p', label: 'Active Thirdparty' },
                                  ];
                                  const cryptoIcon = (c) => `https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/32/color/${c.toLowerCase()}.png`;
                                  const fmtDate = (ts) => {
                                    if (!ts) return '—';
                                    const d = new Date(/^\d+$/.test(ts) ? Number(ts) : ts);
                                    return isNaN(d) ? '—' : d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
                                  };
                                  const getBetGame = (bet) => {
                                    if (!bet) return '—';
                                    const b = bet;
                                    if (b.game && typeof b.game === 'string') return b.game;
                                    if (b.softswissGame?.name) return b.softswissGame.name;
                                    if (b.thirdPartyGame?.name) return b.thirdPartyGame.name;
                                    if (b.evolutionGame?.name) return b.evolutionGame.name;
                                    if (b.__typename) return b.__typename.replace('Bet', '').replace(/([A-Z])/g, ' $1').trim();
                                    return '—';
                                  };
                                  const CryptoAmount = ({ amount, currency }) => (
                                    <span className="inline-flex items-center gap-1 justify-end">
                                      {Number(amount).toFixed(8)}
                                      {currency && <>
                                        <img src={cryptoIcon(currency)} alt="" className="w-3.5 h-3.5 rounded-full inline-block" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                                        <span className="w-3.5 h-3.5 rounded-full bg-gray-200 dark:bg-white/10 items-center justify-center text-[6px] font-bold text-gray-500 dark:text-white/55 hidden shrink-0">{currency.slice(0,2).toUpperCase()}</span>
                                      </>}
                                    </span>
                                  );
                                  return (
                                    <div>
                                      {/* Mini navbar */}
                                      <div className="flex items-center gap-0.5 border-b border-gray-100 dark:border-white/[0.06] mb-3">
                                        {casinoTabs.map(t => (
                                          <button
                                            key={t.id}
                                            onClick={() => {
                                              setCasinoTab(t.id);
                                              if (t.id === 'bets' && casinoBets.length === 0 && !casinoBetsLoading) fetchCasinoBets(userId, 0);
                                              if (t.id === 'games' && casinoGames.length === 0 && !casinoGamesLoading) fetchCasinoGames(userId, casinoGamesSort);
                                              if (t.id === 'active-originals' && casinoActiveOrig === null && !casinoActiveOrigLoading) fetchCasinoActiveOriginals(userId);
                                              if (t.id === 'active-3p' && casinoActive3p === null && !casinoActive3pLoading) fetchCasinoActive3p(userId);
                                            }}
                                            className={`px-3 py-2 text-[12px] font-medium border-b-2 transition-colors ${
                                              casinoTab === t.id
                                                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                                : 'border-transparent text-gray-500 dark:text-white/45 hover:text-gray-600 dark:hover:text-white/40'
                                            }`}
                                          >{t.label}</button>
                                        ))}
                                      </div>

                                      {/* Bets tab */}
                                      {casinoTab === 'bets' && (
                                        <div>
                                          {casinoBets.length === 0 && !casinoBetsLoading && (
                                            <button onClick={() => fetchCasinoBets(userId, 0)} className="text-[11px] text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
                                              Load bets
                                            </button>
                                          )}
                                          {casinoBetsLoading && <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-gray-400 dark:text-white/35" /></div>}
                                          {!casinoBetsLoading && casinoBets.length > 0 && (
                                            <div className="max-h-[400px] overflow-y-auto">
                                              <table className="w-full text-[13px]">
                                                <thead className="sticky top-0 bg-white dark:bg-[#0a0a0a] z-[1]">
                                                  <tr className="text-[12px] text-gray-500 dark:text-white/45 uppercase tracking-wide">
                                                    <th className="text-left pb-2 pl-1 font-medium">IID</th>
                                                    <th className="text-left pb-2 font-medium">User</th>
                                                    <th className="text-right pb-2 font-medium whitespace-nowrap">Placed At</th>
                                                    <th className="text-left pb-2 pl-2 font-medium">Type</th>
                                                    <th className="text-left pb-2 font-medium">Game</th>
                                                    <th className="text-right pb-2 font-medium whitespace-nowrap">Bet Amount</th>
                                                    <th className="text-right pb-2 font-medium whitespace-nowrap">Bet Value</th>
                                                    <th className="text-right pb-2 font-medium">Multi.</th>
                                                    <th className="text-right pb-2 font-medium">Payout</th>
                                                    <th className="text-right pb-2 pr-1 font-medium whitespace-nowrap">Payout Val.</th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {casinoBets.map((item, i) => {
                                                    const b = item.bet || {};
                                                    const pVal = b.payout != null ? (b.payout * (b.value && b.amount ? b.value / b.amount : 1)) : null;
                                                    return (
                                                      <tr key={item.id || i} className="border-t border-gray-100/80 dark:border-white/[0.06] align-top">
                                                        <td className="py-1.5 pl-1 text-gray-500 dark:text-white/55 font-mono text-[12px] whitespace-nowrap">{item.iid || item.id || '—'}</td>
                                                        <td className="py-1.5 text-gray-600 dark:text-white/65 whitespace-nowrap">{b.user?.name || '—'}</td>
                                                        <td className="py-1.5 text-right text-gray-500 dark:text-white/45 whitespace-nowrap">{fmtDate(b.createdAt)}</td>
                                                        <td className="py-1.5 pl-2 text-gray-500 dark:text-white/55">{item.type || '—'}</td>
                                                        <td className="py-1.5 text-gray-600 dark:text-white/65 capitalize">{getBetGame(b)}</td>
                                                        <td className="py-1.5 text-right font-mono text-gray-600 dark:text-white/65 whitespace-nowrap">
                                                          {b.amount != null ? <CryptoAmount amount={b.amount} currency={b.currency} /> : '—'}
                                                        </td>
                                                        <td className="py-1.5 text-right font-mono text-gray-600 dark:text-white/65 whitespace-nowrap">{b.value != null ? `$${Number(b.value).toFixed(2)}` : '—'}</td>
                                                        <td className="py-1.5 text-right font-mono text-gray-600 dark:text-white/65 whitespace-nowrap">{b.payoutMultiplier != null ? `${Number(b.payoutMultiplier).toFixed(2)}×` : '—'}</td>
                                                        <td className="py-1.5 text-right font-mono text-gray-600 dark:text-white/65 whitespace-nowrap">
                                                          {b.payout != null ? <CryptoAmount amount={b.payout} currency={b.currency} /> : '—'}
                                                        </td>
                                                        <td className="py-1.5 pr-1 text-right font-mono text-gray-600 dark:text-white/65 whitespace-nowrap">{b.payout != null && b.value != null && b.amount ? `$${(b.payout * b.value / b.amount).toFixed(2)}` : '—'}</td>
                                                      </tr>
                                                    );
                                                  })}
                                                </tbody>
                                              </table>
                                              {/* Pagination */}
                                              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50 dark:border-white/[0.04]">
                                                <span className="text-[11px] text-gray-500 dark:text-white/35">Page {casinoBetsPage + 1}</span>
                                                <div className="flex items-center gap-1">
                                                  <button
                                                    disabled={casinoBetsPage === 0}
                                                    onClick={() => fetchCasinoBets(userId, casinoBetsPage - 1)}
                                                    className="px-2.5 py-1 text-[12px] rounded bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-white/55 hover:bg-gray-200 dark:hover:bg-white/[0.1] disabled:opacity-30 transition-colors"
                                                  >Prev</button>
                                                  <button
                                                    disabled={!casinoBetsHasMore}
                                                    onClick={() => fetchCasinoBets(userId, casinoBetsPage + 1)}
                                                    className="px-2.5 py-1 text-[12px] rounded bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-white/55 hover:bg-gray-200 dark:hover:bg-white/[0.1] disabled:opacity-30 transition-colors"
                                                  >Next</button>
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {/* Games tab */}
                                      {casinoTab === 'games' && (
                                        <div>
                                          <div className="flex items-center gap-2 mb-2">
                                            {casinoGames.length === 0 && !casinoGamesLoading && (
                                              <button onClick={() => fetchCasinoGames(userId, casinoGamesSort)} className="text-[11px] text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
                                                Load games
                                              </button>
                                            )}
                                            {casinoGames.length > 0 && (
                                              <select
                                                value={casinoGamesSort}
                                                onChange={(e) => { setCasinoGamesSort(e.target.value); fetchCasinoGames(userId, e.target.value); }}
                                                className="text-[11px] bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-white/65 rounded px-1.5 py-0.5 border-0 outline-none [&>option]:bg-white [&>option]:dark:bg-[#1a1a1a] [&>option]:dark:text-white/75"
                                              >
                                                <option value="wagered">Sort: Wagered</option>
                                                <option value="profit">Sort: Profit</option>
                                              </select>
                                            )}
                                          </div>
                                          {casinoGamesLoading && <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-gray-400 dark:text-white/35" /></div>}
                                          {!casinoGamesLoading && casinoGames.length > 0 && (
                                            <div className="max-h-[400px] overflow-y-auto">
                                              <table className="w-full text-[13px]">
                                                <thead className="sticky top-0 bg-white dark:bg-[#0a0a0a] z-[1]">
                                                  <tr className="text-[12px] text-gray-500 dark:text-white/45 uppercase tracking-wide">
                                                    <th className="text-left pb-2 pl-1 font-medium">Game</th>
                                                    <th className="text-left pb-2 font-medium">Provider</th>
                                                    <th className="text-left pb-2 font-medium">Aggregator</th>
                                                    <th className="text-right pb-2 font-medium">Bets</th>
                                                    <th className="text-right pb-2 font-medium">Wins</th>
                                                    <th className="text-right pb-2 font-medium">Losses</th>
                                                    <th className="text-right pb-2 font-medium">Profit</th>
                                                    <th className="text-right pb-2 pr-1 font-medium">Wagered</th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {casinoGames.map((g, i) => (
                                                    <tr key={i} className="border-t border-gray-100/80 dark:border-white/[0.06] align-top">
                                                      <td className="py-1.5 pl-1 text-gray-700 dark:text-white/75 font-medium capitalize">{g.game || '—'}</td>
                                                      <td className="py-1.5 text-gray-500 dark:text-white/55">{g.gameDetails?.provider?.name || '—'}</td>
                                                      <td className="py-1.5 text-gray-500 dark:text-white/55">{g.gameDetails?.type || '—'}</td>
                                                      <td className="py-1.5 text-right font-mono text-gray-600 dark:text-white/65">{g.bets?.toLocaleString() ?? '—'}</td>
                                                      <td className="py-1.5 text-right font-mono text-gray-600 dark:text-white/65">{g.wins?.toLocaleString() ?? '—'}</td>
                                                      <td className="py-1.5 text-right font-mono text-gray-600 dark:text-white/65">{g.losses?.toLocaleString() ?? '—'}</td>
                                                      <td className={`py-1.5 text-right font-mono whitespace-nowrap ${Number(g.profitValue) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                                                        {g.profitValue != null ? `$${Number(g.profitValue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                                                      </td>
                                                      <td className="py-1.5 pr-1 text-right font-mono text-gray-600 dark:text-white/65 whitespace-nowrap">
                                                        {g.betValue != null ? `$${Number(g.betValue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                                                      </td>
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </table>
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {/* Active Originals tab */}
                                      {casinoTab === 'active-originals' && (
                                        <div>
                                          {casinoActiveOrig === null && !casinoActiveOrigLoading && (
                                            <button onClick={() => fetchCasinoActiveOriginals(userId)} className="text-[11px] text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
                                              Load active originals
                                            </button>
                                          )}
                                          {casinoActiveOrigLoading && <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-gray-400 dark:text-white/35" /></div>}
                                          {!casinoActiveOrigLoading && casinoActiveOrig !== null && (
                                            casinoActiveOrig.length === 0 ? (
                                              <span className="text-[13px] text-gray-500 dark:text-white/55 italic">No active original bets</span>
                                            ) : (
                                              <div className="max-h-[400px] overflow-y-auto">
                                                <table className="w-full text-[13px]">
                                                  <thead className="sticky top-0 bg-white dark:bg-[#0a0a0a] z-[1]">
                                                    <tr className="text-[12px] text-gray-500 dark:text-white/45 uppercase tracking-wide">
                                                      <th className="text-left pb-2 pl-1 font-medium">Game</th>
                                                      <th className="text-right pb-2 font-medium">Amount</th>
                                                      <th className="text-right pb-2 pr-1 font-medium">Date</th>
                                                    </tr>
                                                  </thead>
                                                  <tbody>
                                                    {casinoActiveOrig.map((bet, i) => (
                                                      <tr key={bet.id || i} className="border-t border-gray-100/80 dark:border-white/[0.06]">
                                                        <td className="py-1.5 pl-1 text-gray-700 dark:text-white/75 font-medium capitalize">{bet.game || '—'}</td>
                                                        <td className="py-1.5 text-right font-mono text-gray-600 dark:text-white/65 whitespace-nowrap">
                                                          {bet.amount != null ? (
                                                            <span className="inline-flex items-center gap-1 justify-end">
                                                              {Number(bet.amount).toFixed(8)}
                                                              {bet.currency && <>
                                                                <img src={cryptoIcon(bet.currency)} alt="" className="w-3.5 h-3.5 rounded-full inline-block" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                                                                <span className="w-3.5 h-3.5 rounded-full bg-gray-200 dark:bg-white/10 items-center justify-center text-[6px] font-bold text-gray-500 dark:text-white/55 hidden shrink-0">{bet.currency.slice(0,2).toUpperCase()}</span>
                                                              </>}
                                                            </span>
                                                          ) : '—'}
                                                        </td>
                                                        <td className="py-1.5 pr-1 text-right text-gray-500 dark:text-white/45 whitespace-nowrap">{fmtDate(bet.createdAt)}</td>
                                                      </tr>
                                                    ))}
                                                  </tbody>
                                                </table>
                                              </div>
                                            )
                                          )}
                                        </div>
                                      )}

                                      {/* Active Thirdparty tab */}
                                      {casinoTab === 'active-3p' && (
                                        <div>
                                          {casinoActive3p === null && !casinoActive3pLoading && (
                                            <button onClick={() => fetchCasinoActive3p(userId)} className="text-[11px] text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
                                              Load active thirdparty bets
                                            </button>
                                          )}
                                          {casinoActive3pLoading && (
                                            <div className="flex items-center gap-2 justify-center py-4">
                                              <Loader2 className="w-4 h-4 animate-spin text-gray-400 dark:text-white/35" />
                                              <span className="text-[11px] text-gray-500 dark:text-white/35">Checking all providers...</span>
                                            </div>
                                          )}
                                          {!casinoActive3pLoading && casinoActive3p !== null && (
                                            casinoActive3p.length === 0 ? (
                                              <span className="text-[13px] text-gray-500 dark:text-white/55 italic">No active thirdparty bets</span>
                                            ) : (
                                              <div className="max-h-[400px] overflow-y-auto">
                                                <table className="w-full text-[13px]">
                                                  <thead className="sticky top-0 bg-white dark:bg-[#0a0a0a] z-[1]">
                                                    <tr className="text-[12px] text-gray-500 dark:text-white/45 uppercase tracking-wide">
                                                      <th className="text-left pb-2 pl-1 font-medium">ID</th>
                                                      <th className="text-left pb-2 font-medium">Provider</th>
                                                      <th className="text-left pb-2 font-medium">Game</th>
                                                      <th className="text-right pb-2 font-medium whitespace-nowrap">Created At</th>
                                                      <th className="text-left pb-2 pl-2 font-medium whitespace-nowrap">Session ID</th>
                                                      <th className="text-center pb-2 font-medium">Source</th>
                                                      <th className="text-center pb-2 pr-1 font-medium">Target</th>
                                                    </tr>
                                                  </thead>
                                                  <tbody>
                                                    {casinoActive3p.map((bet, i) => (
                                                      <tr key={bet.id || i} className="border-t border-gray-100/80 dark:border-white/[0.06] align-top">
                                                        <td className="py-1.5 pl-1 text-gray-500 dark:text-white/55 font-mono text-[12px]" title={bet.id}>{bet._iid || bet.id || '—'}</td>
                                                        <td className="py-1.5 text-gray-600 dark:text-white/65">{bet.thirdPartyGame?.provider?.name || '—'}</td>
                                                        <td className="py-1.5 text-gray-700 dark:text-white/75 font-medium">{bet.thirdPartyGame?.name || '—'}</td>
                                                        <td className="py-1.5 text-right text-gray-500 dark:text-white/45 whitespace-nowrap">{fmtDate(bet.createdAt)}</td>
                                                        <td className="py-1.5 pl-2 text-gray-500 dark:text-white/55 font-mono text-[12px]">{bet.session?.id || '—'}</td>
                                                        <td className="py-1.5 text-center">
                                                          {bet.session?.sourceCurrency ? (
                                                            <span className="inline-flex items-center gap-1">
                                                              <img src={cryptoIcon(bet.session.sourceCurrency)} alt="" className="w-4 h-4 rounded-full" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                                                              <span className="w-4 h-4 rounded-full bg-gray-200 dark:bg-white/10 items-center justify-center text-[6px] font-bold text-gray-500 dark:text-white/55 hidden">{bet.session.sourceCurrency.slice(0,3).toUpperCase()}</span>
                                                            </span>
                                                          ) : '—'}
                                                        </td>
                                                        <td className="py-1.5 pr-1 text-center">
                                                          {bet.session?.targetCurrency ? (
                                                            <span className="inline-flex items-center gap-1">
                                                              <img src={cryptoIcon(bet.session.targetCurrency)} alt="" className="w-4 h-4 rounded-full" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                                                              <span className="w-4 h-4 rounded-full bg-gray-200 dark:bg-white/10 items-center justify-center text-[6px] font-bold text-gray-500 dark:text-white/55 hidden">{bet.session.targetCurrency.slice(0,3).toUpperCase()}</span>
                                                            </span>
                                                          ) : '—'}
                                                        </td>
                                                      </tr>
                                                    ))}
                                                  </tbody>
                                                </table>
                                              </div>
                                            )
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })() : sectionId === 'deposit-limits' ? (() => {
                                  const u = acpData?.data?.user;
                                  const userId = u?.id;
                                  const activeLimits = u?.responsibleGamblingDepositLimit || [];
                                  const depLimitTabs = [
                                    { id: 'active', label: 'Active' },
                                    { id: 'history', label: 'History' },
                                  ];
                                  const fmtDate = (ts) => { if (!ts) return '—'; const d = new Date(/^\d+$/.test(String(ts)) ? Number(ts) : ts); return isNaN(d) ? '—' : d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, month: 'numeric', day: 'numeric', year: 'numeric' }); };
                                  const fmtMoney = (v) => { if (v == null || v === '') return '—'; const n = Number(v); return isNaN(n) ? v : `$${n.toFixed(2)}`; };
                                  return (
                                    <div>
                                      {/* Mini navbar */}
                                      <div className="flex items-center gap-0.5 border-b border-gray-100 dark:border-white/[0.06] mb-3">
                                        {depLimitTabs.map(t => (
                                          <button key={t.id} onClick={() => {
                                            setDepLimitTab(t.id);
                                            if (t.id === 'history' && depLimitHistory.length === 0 && !depLimitHistoryLoading && userId) fetchDepLimitHistory(userId);
                                          }}
                                            className={`px-3 py-2 text-[12px] font-medium border-b-2 transition-colors ${
                                              depLimitTab === t.id ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 dark:text-white/45 hover:text-gray-600 dark:hover:text-white/40'
                                            }`}>{t.label}</button>
                                        ))}
                                      </div>

                                      {depLimitTab === 'active' && (
                                        <div>
                                          {activeLimits.length === 0 ? (
                                            <span className="text-[13px] text-gray-500 dark:text-white/55 italic">No active deposit limits</span>
                                          ) : (
                                            <div className="max-h-[320px] overflow-y-auto">
                                              <table className="w-full text-[13px]">
                                                <thead className="sticky top-0 bg-white dark:bg-[#0a0a0a] z-[1]">
                                                  <tr className="text-[12px] text-gray-500 dark:text-white/45 uppercase tracking-wide">
                                                    <th className="text-left pb-2 pl-1 font-medium">Action By</th>
                                                    <th className="text-left pb-2 font-medium">Period</th>
                                                    <th className="text-left pb-2 font-medium">Limit</th>
                                                    <th className="text-left pb-2 font-medium">New Limit</th>
                                                    <th className="text-left pb-2 font-medium">Progress</th>
                                                    <th className="text-left pb-2 font-medium">Pending</th>
                                                    <th className="text-left pb-2 font-medium">Created</th>
                                                    <th className="text-left pb-2 font-medium">Expires</th>
                                                    <th className="text-left pb-2 font-medium">Cooling Off</th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {activeLimits.map((lim, i) => {
                                                    const limitVal = Number(lim.limit || 0);
                                                    const progressVal = Number(lim.progress || 0);
                                                    const remaining = limitVal - progressVal;
                                                    const pct = limitVal > 0 ? ((progressVal / limitVal) * 100).toFixed(1) : 0;
                                                    return (
                                                      <tr key={lim.id || i} className="border-t border-gray-100/80 dark:border-white/[0.06] align-top">
                                                        <td className="py-1.5 pl-1 text-gray-700 dark:text-white/75">{lim.actionBy?.name || '—'}</td>
                                                        <td className="py-1.5 text-gray-700 dark:text-white/75 capitalize">{lim.period || '—'}</td>
                                                        <td className="py-1.5 text-gray-700 dark:text-white/75 font-mono">{fmtMoney(lim.limit)}</td>
                                                        <td className="py-1.5 text-gray-700 dark:text-white/75 font-mono">{lim.newLimit ? fmtMoney(lim.newLimit) : '—'}</td>
                                                        <td className="py-1.5 text-gray-700 dark:text-white/75">
                                                          <div className="font-mono">{fmtMoney(remaining)} left</div>
                                                          <div className="text-[10px] text-gray-500 dark:text-white/35">{pct}%</div>
                                                        </td>
                                                        <td className="py-1.5 text-gray-700 dark:text-white/75">{lim.pendingAction || '—'}</td>
                                                        <td className="py-1.5 text-gray-500 dark:text-white/50 whitespace-nowrap">{fmtDate(lim.createdAt)}</td>
                                                        <td className="py-1.5 text-gray-500 dark:text-white/50 whitespace-nowrap">{fmtDate(lim.expireAt)}</td>
                                                        <td className="py-1.5 text-gray-700 dark:text-white/75">{lim.coolingOff ? 'Yes' : '—'}</td>
                                                      </tr>
                                                    );
                                                  })}
                                                </tbody>
                                              </table>
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {depLimitTab === 'history' && (
                                        <div>
                                          {depLimitHistoryLoading ? (
                                            <AcpSkeleton />
                                          ) : depLimitHistory.length === 0 ? (
                                            <span className="text-[13px] text-gray-500 dark:text-white/55 italic">No deposit limit history</span>
                                          ) : (
                                            <div className="max-h-[320px] overflow-y-auto">
                                              <table className="w-full text-[13px]">
                                                <thead className="sticky top-0 bg-white dark:bg-[#0a0a0a] z-[1]">
                                                  <tr className="text-[12px] text-gray-500 dark:text-white/45 uppercase tracking-wide">
                                                    <th className="text-left pb-2 pl-1 font-medium">Action By</th>
                                                    <th className="text-left pb-2 font-medium">Limit</th>
                                                    <th className="text-left pb-2 font-medium">Period</th>
                                                    <th className="text-left pb-2 font-medium">Action</th>
                                                    <th className="text-left pb-2 font-medium">Updated</th>
                                                    <th className="text-left pb-2 font-medium">Reason</th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {depLimitHistory.map((h, i) => (
                                                    <tr key={h.id || i} className="border-t border-gray-100/80 dark:border-white/[0.06] align-top">
                                                      <td className="py-1.5 pl-1 text-gray-700 dark:text-white/75">{h.actionBy?.name || '—'}</td>
                                                      <td className="py-1.5 text-gray-700 dark:text-white/75 font-mono">{fmtMoney(h.limit)}</td>
                                                      <td className="py-1.5 text-gray-700 dark:text-white/75 capitalize">{h.period || '—'}</td>
                                                      <td className="py-1.5 text-gray-700 dark:text-white/75">{h.action || '—'}</td>
                                                      <td className="py-1.5 text-gray-500 dark:text-white/50 whitespace-nowrap">{fmtDate(h.createdAt)}</td>
                                                      <td className="py-1.5 text-gray-700 dark:text-white/75">{h.reason || '—'}</td>
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </table>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })() : sectionId === 'gambling-limits' ? (() => {
                                  const u = acpData?.data?.user;
                                  const userId = u?.id;
                                  const activeLimits = u?.responsibleGamblingLimits || [];
                                  const gambTabs = [
                                    { id: 'active', label: 'Active' },
                                    { id: 'history', label: 'History' },
                                  ];
                                  const fmtDate = (ts) => { if (!ts) return '—'; const d = new Date(/^\d+$/.test(String(ts)) ? Number(ts) : ts); return isNaN(d) ? '—' : d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, month: 'numeric', day: 'numeric', year: 'numeric' }); };
                                  const fmtMoney = (v, cur) => { if (v == null || v === '') return '—'; const n = Number(v); if (isNaN(n)) return v; const sym = (cur && cur !== 'USD') ? cur + ' ' : '$'; return `${sym}${n.toFixed(2)}`; };
                                  return (
                                    <div>
                                      {/* Mini navbar */}
                                      <div className="flex items-center gap-0.5 border-b border-gray-100 dark:border-white/[0.06] mb-3">
                                        {gambTabs.map(t => (
                                          <button key={t.id} onClick={() => {
                                            setGambLimitTab(t.id);
                                            if (t.id === 'history' && gambLimitHistory.length === 0 && !gambLimitHistoryLoading && userId) fetchGambLimitHistory(userId);
                                          }}
                                            className={`px-3 py-2 text-[12px] font-medium border-b-2 transition-colors ${
                                              gambLimitTab === t.id ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 dark:text-white/45 hover:text-gray-600 dark:hover:text-white/40'
                                            }`}>{t.label}</button>
                                        ))}
                                      </div>

                                      {gambLimitTab === 'active' && (
                                        <div>
                                          {activeLimits.length === 0 ? (
                                            <span className="text-[13px] text-gray-500 dark:text-white/55 italic">No active gambling limits</span>
                                          ) : (
                                            <div className="max-h-[320px] overflow-y-auto">
                                              <table className="w-full text-[13px]">
                                                <thead className="sticky top-0 bg-white dark:bg-[#0a0a0a] z-[1]">
                                                  <tr className="text-[12px] text-gray-500 dark:text-white/45 uppercase tracking-wide">
                                                    <th className="text-left pb-2 pl-1 font-medium">Type</th>
                                                    <th className="text-left pb-2 font-medium">Amount</th>
                                                    <th className="text-left pb-2 font-medium">Period</th>
                                                    <th className="text-left pb-2 font-medium">Progress</th>
                                                    <th className="text-left pb-2 font-medium">Cooling Off</th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {activeLimits.map((lim, i) => {
                                                    const limitVal = Number(lim.value || 0);
                                                    const progressVal = Number(lim.progress || 0);
                                                    const remaining = limitVal - progressVal;
                                                    const pct = limitVal > 0 ? ((progressVal / limitVal) * 100).toFixed(1) : 0;
                                                    return (
                                                      <tr key={lim.id || i} className="border-t border-gray-100/80 dark:border-white/[0.06] align-top">
                                                        <td className="py-1.5 pl-1 text-gray-700 dark:text-white/75 capitalize">{lim.type || '—'}</td>
                                                        <td className="py-1.5 text-gray-700 dark:text-white/75 font-mono">{fmtMoney(lim.value, lim.currency)}</td>
                                                        <td className="py-1.5 text-gray-700 dark:text-white/75 capitalize">{lim.period || '—'}</td>
                                                        <td className="py-1.5 text-gray-700 dark:text-white/75 min-w-[120px]">
                                                          <div className="font-mono text-[12px]">{fmtMoney(remaining, lim.currency)} left</div>
                                                          <div className="mt-1 h-1.5 w-full rounded-full bg-gray-100 dark:bg-white/[0.06] overflow-hidden">
                                                            <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: pct >= 90 ? '#ef4444' : pct >= 60 ? '#f59e0b' : '#22c55e' }} />
                                                          </div>
                                                          <div className="text-[10px] text-gray-500 dark:text-white/35 mt-0.5">{pct}%</div>
                                                        </td>
                                                        <td className="py-1.5 text-gray-700 dark:text-white/75">{lim.coolingOff ? 'Yes' : '—'}</td>
                                                      </tr>
                                                    );
                                                  })}
                                                </tbody>
                                              </table>
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {gambLimitTab === 'history' && (
                                        <div>
                                          {gambLimitHistoryLoading ? (
                                            <AcpSkeleton />
                                          ) : gambLimitHistory.length === 0 ? (
                                            <span className="text-[13px] text-gray-500 dark:text-white/55 italic">No gambling limit history</span>
                                          ) : (
                                            <div className="max-h-[320px] overflow-y-auto">
                                              <table className="w-full text-[13px]">
                                                <thead className="sticky top-0 bg-white dark:bg-[#0a0a0a] z-[1]">
                                                  <tr className="text-[12px] text-gray-500 dark:text-white/45 uppercase tracking-wide">
                                                    <th className="text-left pb-2 pl-1 font-medium">Type</th>
                                                    <th className="text-left pb-2 font-medium">Period</th>
                                                    <th className="text-left pb-2 font-medium">Amount</th>
                                                    <th className="text-left pb-2 font-medium">Active</th>
                                                    <th className="text-left pb-2 font-medium">Created</th>
                                                    <th className="text-left pb-2 font-medium">Created By</th>
                                                    <th className="text-left pb-2 font-medium">Updated</th>
                                                    <th className="text-left pb-2 font-medium">Updated By</th>
                                                    <th className="text-left pb-2 font-medium">Removed</th>
                                                    <th className="text-left pb-2 font-medium">Removed By</th>
                                                    <th className="text-left pb-2 font-medium">Cooling Off</th>
                                                    <th className="text-left pb-2 font-medium">Expires</th>
                                                    <th className="text-left pb-2 font-medium">Progress</th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {gambLimitHistory.map((h, i) => {
                                                    const limitVal = Number(h.value || 0);
                                                    const progressVal = Number(h.progress || 0);
                                                    const remaining = limitVal - progressVal;
                                                    const pct = limitVal > 0 ? ((progressVal / limitVal) * 100).toFixed(1) : 0;
                                                    return (
                                                      <tr key={h.id || i} className="border-t border-gray-100/80 dark:border-white/[0.06] align-top">
                                                        <td className="py-1.5 pl-1 text-gray-700 dark:text-white/75 capitalize">{h.type || '—'}</td>
                                                        <td className="py-1.5 text-gray-700 dark:text-white/75 capitalize">{h.period || '—'}</td>
                                                        <td className="py-1.5 text-gray-700 dark:text-white/75 font-mono">{fmtMoney(h.value, h.currency)}</td>
                                                        <td className="py-1.5 text-gray-700 dark:text-white/75">{h.active ? 'true' : 'false'}</td>
                                                        <td className="py-1.5 text-gray-500 dark:text-white/50 whitespace-nowrap">{fmtDate(h.createdAt)}</td>
                                                        <td className="py-1.5 text-gray-700 dark:text-white/75">{h.createdBy?.name || '—'}</td>
                                                        <td className="py-1.5 text-gray-500 dark:text-white/50 whitespace-nowrap">{fmtDate(h.updatedAt)}</td>
                                                        <td className="py-1.5 text-gray-700 dark:text-white/75">{h.updatedBy?.name || '—'}</td>
                                                        <td className="py-1.5 text-gray-500 dark:text-white/50 whitespace-nowrap">{h.removedAt ? fmtDate(h.removedAt) : 'N/A'}</td>
                                                        <td className="py-1.5 text-gray-700 dark:text-white/75">{h.removedBy?.name || '—'}</td>
                                                        <td className="py-1.5 text-gray-700 dark:text-white/75">{h.coolingOff ? fmtDate(h.coolingOff) : 'N/A'}</td>
                                                        <td className="py-1.5 text-gray-500 dark:text-white/50 whitespace-nowrap">{fmtDate(h.expireAt)}</td>
                                                        <td className="py-1.5 text-gray-700 dark:text-white/75 min-w-[120px]">
                                                          <div className="font-mono text-[12px]">{fmtMoney(remaining, h.currency)} left</div>
                                                          <div className="mt-1 h-1.5 w-full rounded-full bg-gray-100 dark:bg-white/[0.06] overflow-hidden">
                                                            <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: pct >= 90 ? '#ef4444' : pct >= 60 ? '#f59e0b' : '#22c55e' }} />
                                                          </div>
                                                          <div className="text-[10px] text-gray-500 dark:text-white/35 mt-0.5">{pct}%</div>
                                                        </td>
                                                      </tr>
                                                    );
                                                  })}
                                                </tbody>
                                              </table>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })() : sectionId === 'money-laundering' ? (() => {
                                  const u = acpData?.data?.user;
                                  const userId = u?.id;
                                  const outstanding = u?.outstandingWagerAmount || [];
                                  const fmtDate = (ts) => { if (!ts) return '—'; const d = new Date(/^\d+$/.test(String(ts)) ? Number(ts) : ts); return isNaN(d) ? '—' : d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, month: 'numeric', day: 'numeric', year: 'numeric' }); };
                                  const mlTabs = [
                                    { id: 'outstanding', label: 'Outstanding' },
                                    { id: 'logs', label: 'Logs' },
                                  ];
                                  const currentLogs = mlLogsByCurrency[mlLogsCurrency] || [];
                                  return (
                                    <div>
                                      <div className="flex items-center gap-0.5 border-b border-gray-100 dark:border-white/[0.06] mb-3">
                                        {mlTabs.map(t => (
                                          <button key={t.id} onClick={() => {
                                            setMlTab(t.id);
                                            if (t.id === 'logs' && !mlLogsDiscovered && userId) discoverMlLogs(userId);
                                          }}
                                            className={`px-3 py-2 text-[12px] font-medium border-b-2 transition-colors ${
                                              mlTab === t.id ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 dark:text-white/45 hover:text-gray-600 dark:hover:text-white/40'
                                            }`}>{t.label}</button>
                                        ))}
                                      </div>

                                      {mlTab === 'outstanding' && (
                                        <div>
                                          {outstanding.length === 0 ? (
                                            <span className="text-[13px] text-gray-500 dark:text-white/55 italic">No outstanding wager amounts</span>
                                          ) : (
                                            <div className="max-h-[320px] overflow-y-auto">
                                              <table className="w-full text-[13px]">
                                                <thead className="sticky top-0 bg-white dark:bg-[#0a0a0a] z-[1]">
                                                  <tr className="text-[12px] text-gray-500 dark:text-white/45 uppercase tracking-wide">
                                                    <th className="text-left pb-2 pl-1 font-medium">Currency</th>
                                                    <th className="text-left pb-2 font-medium">Outstanding Amount</th>
                                                    <th className="text-left pb-2 font-medium">Updated At</th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {outstanding.map((o, i) => (
                                                    <tr key={i} className="border-t border-gray-100/80 dark:border-white/[0.06] align-top">
                                                      <td className="py-1.5 pl-1 text-gray-700 dark:text-white/75">
                                                        <span className="inline-flex items-center gap-1.5">
                                                          <img src={`https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/32/color/${(o.currency || '').toLowerCase()}.png`} alt="" className="w-3.5 h-3.5 rounded-full inline-block"
                                                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                                                          <span className="w-3.5 h-3.5 rounded-full bg-gray-200 dark:bg-white/10 items-center justify-center text-[6px] font-bold text-gray-500 dark:text-white/55 hidden shrink-0">
                                                            {(o.currency || '').slice(0,2).toUpperCase()}
                                                          </span>
                                                          <span className="uppercase font-medium">{o.currency || '—'}</span>
                                                        </span>
                                                      </td>
                                                      <td className="py-1.5 text-gray-700 dark:text-white/75 font-mono">{o.amount != null ? Number(o.amount).toFixed(2) : '—'}</td>
                                                      <td className="py-1.5 text-gray-500 dark:text-white/50 whitespace-nowrap">{fmtDate(o.updatedAt)}</td>
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </table>
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {mlTab === 'logs' && (
                                        <div>
                                          {mlLogsLoading ? (
                                            <div>
                                              <div className="flex items-center gap-2 mb-3 px-1"><Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400 dark:text-white/30" /><span className="text-[12px] text-gray-500 dark:text-white/45">Scanning currencies...</span></div>
                                              <AcpSkeleton rows={4} />
                                            </div>
                                          ) : mlAvailableCurrencies.length === 0 && mlLogsDiscovered ? (
                                            <span className="text-[13px] text-gray-500 dark:text-white/55 italic">No event logs found for any currency</span>
                                          ) : mlAvailableCurrencies.length > 0 ? (
                                            <>
                                              <div className="flex items-center gap-2 mb-2">
                                                <span className="text-[12px] text-gray-500 dark:text-white/45 uppercase tracking-wide">Currency:</span>
                                                <select
                                                  value={mlLogsCurrency}
                                                  onChange={(e) => setMlLogsCurrency(e.target.value)}
                                                  className="text-[11px] bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-white/65 rounded px-1.5 py-0.5 border-0 outline-none [&>option]:bg-white [&>option]:dark:bg-[#1a1a1a] [&>option]:dark:text-white/75"
                                                >
                                                  {mlAvailableCurrencies.map(c => (
                                                    <option key={c} value={c}>{c.toUpperCase()}</option>
                                                  ))}
                                                </select>
                                                <span className="text-[10px] text-gray-400 dark:text-white/30">{mlAvailableCurrencies.length} currencies with logs</span>
                                              </div>

                                              {currentLogs.length === 0 ? (
                                                <span className="text-[13px] text-gray-500 dark:text-white/55 italic">No event logs for {mlLogsCurrency.toUpperCase()}</span>
                                              ) : (
                                                <div className="max-h-[400px] overflow-y-auto">
                                                  <table className="w-full text-[13px]">
                                                    <thead className="sticky top-0 bg-white dark:bg-[#0a0a0a] z-[1]">
                                                      <tr className="text-[12px] text-gray-500 dark:text-white/45 uppercase tracking-wide">
                                                        <th className="text-left pb-2 pl-1 font-medium">Date</th>
                                                        <th className="text-left pb-2 font-medium">Outstanding</th>
                                                        <th className="text-left pb-2 font-medium">Event Type</th>
                                                        <th className="text-left pb-2 font-medium">Data</th>
                                                      </tr>
                                                    </thead>
                                                    <tbody>
                                                      {currentLogs.map((log, i) => {
                                                        let parsedData = null;
                                                        try { parsedData = typeof log.data === 'string' ? JSON.parse(log.data) : log.data; } catch { parsedData = log.data; }
                                                        return (
                                                          <tr key={log.id || i} className="border-t border-gray-100/80 dark:border-white/[0.06] align-top">
                                                            <td className="py-1.5 pl-1 text-gray-500 dark:text-white/50 whitespace-nowrap">{fmtDate(log.date)}</td>
                                                            <td className="py-1.5 text-gray-700 dark:text-white/75 font-mono">{log.outstanding != null ? Number(log.outstanding).toFixed(2) : '—'}</td>
                                                            <td className="py-1.5 text-gray-700 dark:text-white/75">{log.eventType || '—'}</td>
                                                            <td className="py-1.5 text-gray-500 dark:text-white/50 font-mono text-[12px] break-all">{parsedData && typeof parsedData === 'object' ? JSON.stringify(parsedData) : (parsedData || '—')}</td>
                                                          </tr>
                                                        );
                                                      })}
                                                    </tbody>
                                                  </table>
                                                </div>
                                              )}
                                            </>
                                          ) : null}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })() : sectionId === 'notes' ? (() => {
                                  const u = acpData?.data?.user;
                                  const userId = u?.id;
                                  const fmtDate = (ts) => { if (!ts) return '—'; const d = new Date(/^\d+$/.test(String(ts)) ? Number(ts) : ts); return isNaN(d) ? '—' : d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, month: 'numeric', day: 'numeric', year: 'numeric' }); };

                                  // Auto-fetch on first render
                                  if (acpNotes.length === 0 && !acpNotesLoading && userId) {
                                    setTimeout(() => fetchAcpNotes(userId, 0, acpNotesType), 0);
                                  }

                                  const noteTypeOptions = ['all','action','add_role','admin_auth_transfer_oauth_to_password','admin_disable_user_oauth_identity','admin_email_update','admin_password_update','admin_tfa_disable','api_key_reveal','assign_campaign_owner','auto_suspension','break_in_play','campaign_user_add','campaign_user_remove','custom_note','delete_role','deposit_holding_balance','email_confirmed','email_update','event','failed_account_access','geocomply_bypass','immediate_self_exclusion','kyc','login','migrated_stake','mute','name_change','oauth_device_change','oauth_payment','passkey_deleted_by_support','passkey_deletion','password_link_reset','password_update','rakeback','record','register','request_password_link_reset','self_exclusion_confirm','self_exclusion_request','self_exclusion_stage_2_confirm','session_limit_change','setting_update','staff_offboarded','tag_add','tag_delete','tag_remove','tfa_disable','tfa_enable','unconfirmed_email_update','veriff_biometric_status_update','veriff_decision_add_role','veriff_decision_remove_role','veriff_user_status_update','verify_passkey_authentication','verify_passkey_registration','vip_host_status_update','visit_url'];

                                  const getNoteTypeAndAction = (note) => {
                                    const d = note.data || {};
                                    const t = note.type || '';
                                    switch (t) {
                                      case 'login': return { type: 'Auth', action: 'Login' };
                                      case 'register': return { type: 'Auth', action: 'Register' };
                                      case 'add_role': return { type: 'Role', action: `Add role ${d.role || ''}`.trim() };
                                      case 'delete_role': return { type: 'Role', action: `Delete role ${d.role || ''}`.trim() };
                                      default: {
                                        const action = d.action || '—';
                                        return { type: t, action };
                                      }
                                    }
                                  };

                                  const extractField = (note, field) => {
                                    const d = note.data || {};
                                    switch (field) {
                                      case 'expireAt': return d.expireAt;
                                      case 'createdBy': return d.user?.name || d.admin?.name || '—';
                                      case 'ip': return d.ip || '—';
                                      case 'country': return d.country || '—';
                                      case 'message': return d.message || d.roleMessage || d.breakInPlayMessage || d.immediateSelfExclusionMessage || d.campaignOwnerMessage || d.note || d.reason || d.email || '—';
                                      case 'balances': return d.balances || '—';
                                      default: return '—';
                                    }
                                  };

                                  return (
                                    <div>
                                      {/* Filter dropdown */}
                                      <div className="flex items-center gap-2 mb-3">
                                        <select
                                          value={acpNotesType}
                                          onChange={(e) => {
                                            const newType = e.target.value;
                                            setAcpNotesType(newType);
                                            if (userId) fetchAcpNotes(userId, 0, newType);
                                          }}
                                          className="text-[12px] px-2.5 py-1.5 rounded border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] text-gray-700 dark:text-white/75 outline-none focus:border-indigo-300 dark:focus:border-indigo-500/30"
                                        >
                                          {noteTypeOptions.map(t => (
                                            <option key={t} value={t}>{t}</option>
                                          ))}
                                        </select>
                                      </div>

                                      {acpNotesLoading ? (
                                        <AcpSkeleton />
                                      ) : acpNotes.length === 0 ? (
                                        <span className="text-[13px] text-gray-500 dark:text-white/55 italic">No notes found</span>
                                      ) : (
                                        <>
                                          <div className="max-h-[400px] overflow-y-auto">
                                            <table className="w-full text-[13px]">
                                              <thead className="sticky top-0 bg-white dark:bg-[#0a0a0a] z-[1]">
                                                <tr className="text-[12px] text-gray-500 dark:text-white/45 uppercase tracking-wide">
                                                  <th className="text-left pb-2 pl-1 font-medium">Type</th>
                                                  <th className="text-left pb-2 font-medium">Action</th>
                                                  <th className="text-left pb-2 font-medium">Created at</th>
                                                  <th className="text-left pb-2 font-medium">Expire at</th>
                                                  <th className="text-left pb-2 font-medium">Created by</th>
                                                  <th className="text-left pb-2 font-medium">IP</th>
                                                  <th className="text-left pb-2 font-medium">Country</th>
                                                  <th className="text-left pb-2 font-medium">Message</th>
                                                  <th className="text-left pb-2 font-medium">Balances</th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {acpNotes.map((note, i) => {
                                                  const { type: displayType, action: displayAction } = getNoteTypeAndAction(note);
                                                  return (
                                                  <tr key={i} className="border-t border-gray-100/80 dark:border-white/[0.06] align-top">
                                                    <td className="py-1.5 pl-1 text-gray-700 dark:text-white/75">{displayType}</td>
                                                    <td className="py-1.5 text-gray-700 dark:text-white/75">{displayAction}</td>
                                                    <td className="py-1.5 text-gray-500 dark:text-white/50 whitespace-nowrap">{fmtDate(note.createdAt)}</td>
                                                    <td className="py-1.5 text-gray-500 dark:text-white/50 whitespace-nowrap">{fmtDate(extractField(note, 'expireAt'))}</td>
                                                    <td className="py-1.5 text-gray-700 dark:text-white/75">{extractField(note, 'createdBy')}</td>
                                                    <td className="py-1.5 text-gray-500 dark:text-white/50 font-mono text-[12px]">{extractField(note, 'ip')}</td>
                                                    <td className="py-1.5 text-gray-700 dark:text-white/75">{extractField(note, 'country')}</td>
                                                    <td className="py-1.5 text-gray-700 dark:text-white/75 max-w-[200px] truncate">{extractField(note, 'message')}</td>
                                                    <td className="py-1.5 text-gray-700 dark:text-white/75">{extractField(note, 'balances')}</td>
                                                  </tr>
                                                  ); })}
                                              </tbody>
                                            </table>
                                          </div>
                                          {/* Pagination */}
                                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50 dark:border-white/[0.04]">
                                            <span className="text-[11px] text-gray-500 dark:text-white/35">Page {acpNotesPage + 1}</span>
                                            <div className="flex items-center gap-1">
                                              <button
                                                disabled={acpNotesPage === 0}
                                                onClick={() => fetchAcpNotes(userId, acpNotesPage - 1, acpNotesType)}
                                                className="px-2.5 py-1 text-[12px] rounded bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-white/55 hover:bg-gray-200 dark:hover:bg-white/[0.1] disabled:opacity-30 transition-colors"
                                              >Prev</button>
                                              <button
                                                disabled={!acpNotesHasMore}
                                                onClick={() => fetchAcpNotes(userId, acpNotesPage + 1, acpNotesType)}
                                                className="px-2.5 py-1 text-[12px] rounded bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-white/55 hover:bg-gray-200 dark:hover:bg-white/[0.1] disabled:opacity-30 transition-colors"
                                              >Next</button>
                                            </div>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  );
                                })() : sectionId === 'overall' ? (() => {
                                  const u = acpData?.data?.user;
                                  const userId = u?.id;

                                  // Auto-fetch on first render
                                  if (overallData === null && !overallLoading && userId) {
                                    setTimeout(() => fetchOverallData(userId), 0);
                                  }

                                  const overallTabs = [
                                    { id: 'currency-summary', label: 'Currency Summary' },
                                    { id: 'balances', label: 'Balances' },
                                  ];

                                  const cryptoIcon = (c) => `https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/32/color/${(c || '').toLowerCase()}.png`;
                                  const FIAT_CURRENCIES = new Set(['usd','eur','gbp','cad','aud','jpy','inr','brl','krw','mxn','idr','rub','try','php','cop','clp','pen','ars','pkr','bdt','thb','ngn','zar','egp','nzd','sgd','hkd','myr','twd']);
                                  const isFiat = (c) => FIAT_CURRENCIES.has((c || '').toLowerCase());

                                  const CurrencyLabel = ({ currency }) => (
                                    <span className="inline-flex items-center gap-1">
                                      {isFiat(currency) ? (
                                        <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-[8px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">{(currency || '').slice(0, 1)}</span>
                                      ) : (
                                        <><img src={cryptoIcon(currency)} alt="" className="w-4 h-4 rounded-full shrink-0" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} /><span style={{display:'none'}} className="w-4 h-4 rounded-full bg-gray-200 dark:bg-white/10 items-center justify-center text-[8px] font-bold text-gray-500 dark:text-white/55 shrink-0">{(currency || '?').slice(0, 2)}</span></>
                                      )}
                                      <span className="uppercase text-[11px] font-medium">{currency || '—'}</span>
                                    </span>
                                  );

                                  const fmtNum = (v) => { if (v == null || v === '') return '—'; const n = Number(v); if (isNaN(n)) return v; return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 }).replace(/0+$/, '').replace(/\.$/, '.00'); };
                                  const fmtUsd = (v) => { if (v == null || v === '') return '—'; const n = Number(v); if (isNaN(n)) return v; return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; };

                                  return (
                                    <div>
                                      {/* Tab navbar */}
                                      <div className="flex items-center gap-0.5 border-b border-gray-100 dark:border-white/[0.06] mb-3">
                                        {overallTabs.map(t => (
                                          <button key={t.id} onClick={() => setOverallTab(t.id)}
                                            className={`px-3 py-2 text-[12px] font-medium border-b-2 transition-colors ${
                                              overallTab === t.id ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 dark:text-white/45 hover:text-gray-600 dark:hover:text-white/40'
                                            }`}>{t.label}</button>
                                        ))}
                                      </div>

                                      {overallLoading ? (
                                        <AcpSkeleton />
                                      ) : !overallData ? (
                                        <span className="text-[13px] text-gray-500 dark:text-white/55 italic">No data</span>
                                      ) : overallTab === 'currency-summary' ? (() => {
                                        // Aggregate statistic by currency
                                        const stats = overallData.statistic || [];
                                        const byCurrency = {};
                                        stats.forEach(s => {
                                          const c = s.currency;
                                          if (!byCurrency[c]) byCurrency[c] = { currency: c, wagered: 0, profit: 0 };
                                          byCurrency[c].wagered += Number(s.betAmount || 0);
                                          byCurrency[c].profit += Number(s.profitAmount || 0);
                                        });
                                        // Map balance arrays by currency
                                        const bal = overallData.balances || {};
                                        const mapByCur = (arr) => { const m = {}; (arr || []).forEach(b => { if (b.currency) m[b.currency] = b; }); return m; };
                                        const tipRecvMap = mapByCur(bal.tipReceived);
                                        const tipSendMap = mapByCur(bal.tipSend);
                                        const depMap = mapByCur(bal.deposit);
                                        const wdMap = mapByCur(bal.withdrawal);

                                        // Collect all currencies from stats + balances
                                        const allCurrencies = new Set(Object.keys(byCurrency));
                                        [bal.tipReceived, bal.tipSend, bal.deposit, bal.withdrawal, bal.available].forEach(arr => (arr || []).forEach(b => { if (b.currency) allCurrencies.add(b.currency); }));

                                        const rows = Array.from(allCurrencies).sort((a, b) => {
                                          const aFiat = isFiat(a), bFiat = isFiat(b);
                                          if (aFiat !== bFiat) return aFiat ? 1 : -1;
                                          return a.localeCompare(b);
                                        }).map(c => ({
                                          currency: c,
                                          wagered: byCurrency[c]?.wagered || 0,
                                          profit: byCurrency[c]?.profit || 0,
                                          tipRecv: Number(tipRecvMap[c]?.amount || 0),
                                          tipSend: Number(tipSendMap[c]?.amount || 0),
                                          dep: Number(depMap[c]?.amount || 0),
                                          wd: Number(wdMap[c]?.amount || 0),
                                          depValue: Number(depMap[c]?.value || 0),
                                          wdValue: Number(wdMap[c]?.value || 0),
                                        }));

                                        return (
                                          <div className="max-h-[400px] overflow-y-auto">
                                            {rows.length === 0 ? (
                                              <span className="text-[13px] text-gray-500 dark:text-white/55 italic">No currency data</span>
                                            ) : (
                                              <table className="w-full text-[13px]">
                                                <thead className="sticky top-0 bg-white dark:bg-[#0a0a0a] z-[1]">
                                                  <tr className="text-[12px] text-gray-500 dark:text-white/45 uppercase tracking-wide">
                                                    <th className="text-left pb-2 pl-1 font-medium">Currency</th>
                                                    <th className="text-right pb-2 font-medium">Wagered</th>
                                                    <th className="text-right pb-2 font-medium">Profit</th>
                                                    <th className="text-right pb-2 font-medium">Tips Recv</th>
                                                    <th className="text-right pb-2 font-medium">Tips Sent</th>
                                                    <th className="text-right pb-2 font-medium">Deposits</th>
                                                    <th className="text-right pb-2 font-medium">Withdrawals</th>
                                                    <th className="text-right pb-2 font-medium">Deposits ($)</th>
                                                    <th className="text-right pb-2 pr-1 font-medium">Withdrawals ($)</th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {rows.map((r, i) => (
                                                    <tr key={r.currency || i} className="border-t border-gray-100/80 dark:border-white/[0.06] align-top">
                                                      <td className="py-1.5 pl-1"><CurrencyLabel currency={r.currency} /></td>
                                                      <td className="py-1.5 text-right font-mono text-gray-700 dark:text-white/75">{fmtNum(r.wagered)}</td>
                                                      <td className={`py-1.5 text-right font-mono ${r.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>{fmtNum(r.profit)}</td>
                                                      <td className="py-1.5 text-right font-mono text-gray-700 dark:text-white/75">{fmtNum(r.tipRecv)}</td>
                                                      <td className="py-1.5 text-right font-mono text-gray-700 dark:text-white/75">{fmtNum(r.tipSend)}</td>
                                                      <td className="py-1.5 text-right font-mono text-gray-700 dark:text-white/75">{fmtNum(r.dep)}</td>
                                                      <td className="py-1.5 text-right font-mono text-gray-700 dark:text-white/75">{fmtNum(r.wd)}</td>
                                                      <td className="py-1.5 text-right font-mono text-gray-700 dark:text-white/75">{fmtUsd(r.depValue)}</td>
                                                      <td className="py-1.5 text-right pr-1 font-mono text-gray-700 dark:text-white/75">{fmtUsd(r.wdValue)}</td>
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </table>
                                            )}
                                          </div>
                                        );
                                      })() : (() => {
                                        // Balances tab
                                        const bal = overallData.balances || {};
                                        const mapByCur = (arr) => { const m = {}; (arr || []).forEach(b => { if (b.currency) m[b.currency] = b; }); return m; };
                                        const availMap = mapByCur(bal.available);
                                        const faucetMap = mapByCur(bal.faucet);
                                        const bonusMap = mapByCur(bal.bonus);
                                        const mixMap = mapByCur(bal.mixpanel);
                                        const rbMap = mapByCur(bal.rakeback);
                                        const bcMap = mapByCur(bal.bonusClaim);
                                        const vaultMap = mapByCur(bal.vault);
                                        const vpMap = mapByCur(bal.vaultPending);
                                        const raceMap = mapByCur(bal.race);

                                        const allCurrencies = new Set();
                                        [bal.available, bal.faucet, bal.bonus, bal.mixpanel, bal.rakeback, bal.bonusClaim, bal.vault, bal.vaultPending, bal.race].forEach(arr => (arr || []).forEach(b => { if (b.currency) allCurrencies.add(b.currency); }));

                                        const rows = Array.from(allCurrencies).sort((a, b) => {
                                          const aFiat = isFiat(a), bFiat = isFiat(b);
                                          if (aFiat !== bFiat) return aFiat ? 1 : -1;
                                          return a.localeCompare(b);
                                        });

                                        return (
                                          <div className="max-h-[400px] overflow-y-auto">
                                            {rows.length === 0 ? (
                                              <span className="text-[13px] text-gray-500 dark:text-white/55 italic">No balance data</span>
                                            ) : (
                                              <table className="w-full text-[13px]">
                                                <thead className="sticky top-0 bg-white dark:bg-[#0a0a0a] z-[1]">
                                                  <tr className="text-[12px] text-gray-500 dark:text-white/45 uppercase tracking-wide">
                                                    <th className="text-left pb-2 pl-1 font-medium">Currency</th>
                                                    <th className="text-right pb-2 font-medium">Available</th>
                                                    <th className="text-right pb-2 font-medium">Faucet</th>
                                                    <th className="text-right pb-2 font-medium">Bonus</th>
                                                    <th className="text-right pb-2 font-medium">Mixpanel</th>
                                                    <th className="text-right pb-2 font-medium">Rakeback</th>
                                                    <th className="text-right pb-2 font-medium">Bonus Claim</th>
                                                    <th className="text-right pb-2 font-medium">Vault</th>
                                                    <th className="text-right pb-2 font-medium">Vault Pend.</th>
                                                    <th className="text-right pb-2 pr-1 font-medium">Race</th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {rows.map((c, i) => (
                                                    <tr key={c || i} className="border-t border-gray-100/80 dark:border-white/[0.06] align-top">
                                                      <td className="py-1.5 pl-1"><CurrencyLabel currency={c} /></td>
                                                      <td className="py-1.5 text-right font-mono text-gray-700 dark:text-white/75">{fmtNum(availMap[c]?.amount)}</td>
                                                      <td className="py-1.5 text-right font-mono text-gray-700 dark:text-white/75">{fmtNum(faucetMap[c]?.amount)}</td>
                                                      <td className="py-1.5 text-right font-mono text-gray-700 dark:text-white/75">{fmtNum(bonusMap[c]?.amount)}</td>
                                                      <td className="py-1.5 text-right font-mono text-gray-700 dark:text-white/75">{fmtNum(mixMap[c]?.amount)}</td>
                                                      <td className="py-1.5 text-right font-mono text-gray-700 dark:text-white/75">{fmtNum(rbMap[c]?.amount)}</td>
                                                      <td className="py-1.5 text-right font-mono text-gray-700 dark:text-white/75">{fmtNum(bcMap[c]?.amount)}</td>
                                                      <td className="py-1.5 text-right font-mono text-gray-700 dark:text-white/75">{fmtNum(vaultMap[c]?.amount)}</td>
                                                      <td className="py-1.5 text-right font-mono text-gray-700 dark:text-white/75">{fmtNum(vpMap[c]?.amount)}</td>
                                                      <td className="py-1.5 text-right pr-1 font-mono text-gray-700 dark:text-white/75">{fmtNum(raceMap[c]?.amount)}</td>
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </table>
                                            )}
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  );
                                })() : sectionId === 'passkeys' ? (() => {
                                  const u = acpData?.data?.user;
                                  const passkeys = u?.getUserPasskeys || [];
                                  const fmtDate = (ts) => { if (!ts) return '—'; const d = new Date(/^\d+$/.test(String(ts)) ? Number(ts) : ts); return isNaN(d) ? '—' : d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, month: 'numeric', day: 'numeric', year: 'numeric' }); };
                                  return (
                                    <div>
                                      <div className="text-[11px] text-gray-500 dark:text-white/35 mb-2">Passkeys ({passkeys.length}/10)</div>
                                      {passkeys.length === 0 ? (
                                        <span className="text-[13px] text-gray-500 dark:text-white/55 italic">No passkeys configured</span>
                                      ) : (
                                        <div className="max-h-[320px] overflow-y-auto">
                                          <table className="w-full text-[13px]">
                                            <thead className="sticky top-0 bg-white dark:bg-[#0a0a0a] z-[1]">
                                              <tr className="text-[12px] text-gray-500 dark:text-white/45 uppercase tracking-wide">
                                                <th className="text-left pb-2 pl-1 font-medium">Authenticator</th>
                                                <th className="text-left pb-2 font-medium">Created On</th>
                                                <th className="text-left pb-2 font-medium">Device</th>
                                                <th className="text-left pb-2 font-medium">Last Used</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {passkeys.map((pk, i) => (
                                                <tr key={pk.id || i} className="border-t border-gray-100/80 dark:border-white/[0.06] align-top">
                                                  <td className="py-1.5 pl-1 text-gray-700 dark:text-white/75">{pk.authenticatorName || '—'}</td>
                                                  <td className="py-1.5 text-gray-500 dark:text-white/50 whitespace-nowrap">{fmtDate(pk.createdAt)}</td>
                                                  <td className="py-1.5 text-gray-700 dark:text-white/75">{pk.deviceName || '—'}</td>
                                                  <td className="py-1.5 text-gray-500 dark:text-white/50 whitespace-nowrap">{fmtDate(pk.lastUsedAt)}</td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })() : sectionId === 'raffles' ? (() => {
                                  const u = acpData?.data?.user;
                                  const raffles = u?.raffleList || [];
                                  const fmtDate = (ts) => { if (!ts) return '—'; const d = new Date(/^\d+$/.test(String(ts)) ? Number(ts) : ts); return isNaN(d) ? '—' : d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, month: 'numeric', day: 'numeric', year: 'numeric' }); };
                                  return (
                                    <div>
                                      {raffles.length === 0 ? (
                                        <span className="text-[13px] text-gray-500 dark:text-white/55 italic">No raffles</span>
                                      ) : (
                                        <div className="max-h-[400px] overflow-y-auto">
                                          <table className="w-full text-[13px]">
                                            <thead className="sticky top-0 bg-white dark:bg-[#0a0a0a] z-[1]">
                                              <tr className="text-[12px] text-gray-500 dark:text-white/45 uppercase tracking-wide">
                                                <th className="text-left pb-2 pl-1 font-medium">Name</th>
                                                <th className="text-left pb-2 font-medium">Start Time</th>
                                                <th className="text-left pb-2 font-medium">End Time</th>
                                                <th className="text-left pb-2 font-medium">Tickets</th>
                                                <th className="text-left pb-2 font-medium">Progress</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {raffles.map((r, i) => {
                                                const pct = r.progress != null ? (Number(r.progress) * 100).toFixed(2) : '—';
                                                return (
                                                  <tr key={r.raffle?.id || i} className="border-t border-gray-100/80 dark:border-white/[0.06] align-top">
                                                    <td className="py-1.5 pl-1 text-gray-700 dark:text-white/75">{r.raffle?.name || '—'}</td>
                                                    <td className="py-1.5 text-gray-500 dark:text-white/50 whitespace-nowrap">{fmtDate(r.raffle?.startTime)}</td>
                                                    <td className="py-1.5 text-gray-500 dark:text-white/50 whitespace-nowrap">{fmtDate(r.raffle?.endTime)}</td>
                                                    <td className="py-1.5 text-gray-700 dark:text-white/75 font-mono">{r.ticketCount ?? '—'}</td>
                                                    <td className="py-1.5 text-gray-700 dark:text-white/75 font-mono">{pct}%</td>
                                                  </tr>
                                                );
                                              })}
                                            </tbody>
                                          </table>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })() : sectionId === 'rakeback' ? (() => {
                                  const u = acpData?.data?.user;
                                  const userId = u?.id;
                                  const rb = u?.rakeback;
                                  const fmtDate = (ts) => { if (!ts) return '—'; const d = new Date(/^\d+$/.test(String(ts)) ? Number(ts) : ts); return isNaN(d) ? '—' : d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, month: 'numeric', day: 'numeric', year: 'numeric' }); };
                                  const balances = rb?.balances || [];
                                  const rbTabs = [
                                    { id: 'balances', label: 'Rakeback' },
                                    { id: 'claims', label: 'Claim History' },
                                  ];
                                  const fiatSymbols = { usd:'$', eur:'€', gbp:'£', jpy:'¥', cny:'¥', krw:'₩', inr:'₹', brl:'R$', try:'₺', ars:'ARS ', cad:'CA$', aud:'A$', mxn:'MX$', php:'₱', pln:'zł', czk:'Kč', clp:'CLP ', pen:'S/', cop:'COP ', idr:'IDR ', ngn:'NGN ', vnd:'₫', thb:'฿', zar:'R', sek:'kr', nok:'kr', dkk:'kr', huf:'Ft', ron:'lei', bgn:'лв', hrk:'kn', rub:'₽', uah:'₴', sgd:'S$', hkd:'HK$', nzd:'NZ$', chf:'CHF ', twd:'NT$', ils:'₪', aed:'AED ', sar:'SAR ', qar:'QAR ', kwd:'KD', bdt:'৳', pkr:'₨', lkr:'Rs', mmk:'K', kzt:'₸', gel:'₾', azn:'₼' };
                                  const cryptos = new Set(['btc','eth','ltc','sol','doge','bch','xrp','trx','eos','bnb','usdt','usdc','busd','matic','ada','dot','shib','avax','link','uni','dai','aave','comp','mkr','snx','yfi','sushi','crv','bat','zrx','enj','mana','sand','gala','axs','ftm','near','atom','algo','xlm','vet','hbar','icp','fil','theta','egld','flow','kda','kas','apt','arb','op','sui','sei','ton','tia','jup','wld','pyth','bonk','pepe','floki','wif','render','fet','ocean','grt']);
                                  const isCrypto = (cur) => cryptos.has((cur || '').toLowerCase());
                                  const fmtAmount = (amount, currency) => {
                                    const cur = (currency || '').toLowerCase();
                                    const val = amount != null ? Number(amount) : 0;
                                    if (isCrypto(cur)) return val.toFixed(8).replace(/\.?0+$/, '');
                                    const sym = fiatSymbols[cur] || cur.toUpperCase() + ' ';
                                    return sym + val.toFixed(2);
                                  };
                                  const CurIcon = ({ currency }) => {
                                    const cur = (currency || '').toLowerCase();
                                    if (!isCrypto(cur)) return null;
                                    return (
                                      <>
                                        <img src={`https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/32/color/${cur}.png`} alt="" className="w-3.5 h-3.5 rounded-full inline-block"
                                          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                                        <span className="w-3.5 h-3.5 rounded-full bg-gray-200 dark:bg-white/10 items-center justify-center text-[6px] font-bold text-gray-500 dark:text-white/55 hidden shrink-0">
                                          {cur.slice(0,2).toUpperCase()}
                                        </span>
                                      </>
                                    );
                                  };
                                  return (
                                    <div>
                                      {/* Header info */}
                                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3 text-[12px]">
                                        <span className="inline-flex items-center gap-1">
                                          <span className="text-gray-500 dark:text-white/50 font-medium">Rakeback</span>
                                          <span className="text-gray-700 dark:text-white/75 font-mono font-semibold">{rb?.rate ?? '—'}</span>
                                        </span>
                                        <span className={`px-1.5 py-0.5 rounded text-[11px] font-medium ${rb?.enabled ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400'}`}>
                                          {rb?.enabled ? 'enabled' : 'disabled'}
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                          <span className="text-gray-500 dark:text-white/50 font-medium">Created</span>
                                          <span className="text-gray-500 dark:text-white/55">{fmtDate(rb?.createdAt)}</span>
                                        </span>
                                      </div>

                                      {/* Mini navbar */}
                                      <div className="flex items-center gap-0.5 border-b border-gray-100 dark:border-white/[0.06] mb-3">
                                        {rbTabs.map(t => (
                                          <button key={t.id} onClick={() => {
                                            setRakebackTab(t.id);
                                            if (t.id === 'claims' && rakebackClaims.length === 0 && !rakebackClaimsLoading && userId) fetchRakebackClaims(userId);
                                          }}
                                            className={`px-3 py-2 text-[12px] font-medium border-b-2 transition-colors ${
                                              rakebackTab === t.id ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 dark:text-white/45 hover:text-gray-600 dark:hover:text-white/40'
                                            }`}>{t.label}</button>
                                        ))}
                                      </div>

                                      {rakebackTab === 'balances' && (
                                        <div>
                                          {balances.length === 0 ? (
                                            <span className="text-[13px] text-gray-500 dark:text-white/55 italic">No rakeback balances</span>
                                          ) : (
                                            <div className="max-h-[320px] overflow-y-auto">
                                              <table className="w-full text-[13px]">
                                                <thead className="sticky top-0 bg-white dark:bg-[#0a0a0a] z-[1]">
                                                  <tr className="text-[12px] text-gray-500 dark:text-white/45 uppercase tracking-wide">
                                                    <th className="text-left pb-2 pl-1 font-medium">Available Amount</th>
                                                    <th className="text-left pb-2 font-medium">Received Amount</th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {balances.map((b, i) => (
                                                    <tr key={i} className="border-t border-gray-100/80 dark:border-white/[0.06] align-top">
                                                      <td className="py-1.5 pl-1 text-gray-700 dark:text-white/75 font-mono">
                                                        <span className="inline-flex items-center gap-1.5">
                                                          <CurIcon currency={b.currency} />
                                                          {fmtAmount(b.availableAmount, b.currency)}
                                                        </span>
                                                      </td>
                                                      <td className="py-1.5 text-gray-700 dark:text-white/75 font-mono">
                                                        <span className="inline-flex items-center gap-1.5">
                                                          <CurIcon currency={b.currency} />
                                                          {fmtAmount(b.receivedAmount, b.currency)}
                                                        </span>
                                                      </td>
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </table>
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {rakebackTab === 'claims' && (
                                        <div>
                                          {rakebackClaimsLoading ? (
                                            <AcpSkeleton />
                                          ) : rakebackClaims.length === 0 ? (
                                            <span className="text-[13px] text-gray-500 dark:text-white/55 italic">No claim history</span>
                                          ) : (
                                            <div className="max-h-[400px] overflow-y-auto">
                                              <table className="w-full text-[13px]">
                                                <thead className="sticky top-0 bg-white dark:bg-[#0a0a0a] z-[1]">
                                                  <tr className="text-[12px] text-gray-500 dark:text-white/45 uppercase tracking-wide">
                                                    <th className="text-left pb-2 pl-1 font-medium">Amount</th>
                                                    <th className="text-left pb-2 font-medium">Date</th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {rakebackClaims.map((c, i) => (
                                                    <tr key={i} className="border-t border-gray-100/80 dark:border-white/[0.06] align-top">
                                                      <td className="py-1.5 pl-1 text-gray-700 dark:text-white/75 font-mono">
                                                        <span className="inline-flex items-center gap-1.5">
                                                          <CurIcon currency={c.currency} />
                                                          {fmtAmount(c.amount, c.currency)}
                                                        </span>
                                                      </td>
                                                      <td className="py-1.5 text-gray-500 dark:text-white/50 whitespace-nowrap">{fmtDate(c.createdAt)}</td>
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </table>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })() : sectionId === 'reload' ? (() => {
                                  const u = acpData?.data?.user;
                                  const userId = u?.id;
                                  const fmtDate = (ts) => { if (!ts) return '—'; const d = new Date(/^\d+$/.test(String(ts)) ? Number(ts) : ts); return isNaN(d) ? '—' : d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, month: 'numeric', day: 'numeric', year: 'numeric' }); };
                                  const fmtInterval = (ms) => {
                                    if (!ms) return '—';
                                    const n = Number(ms);
                                    if (isNaN(n)) return ms;
                                    const mins = n / 60000;
                                    if (mins < 60) return `${Math.round(mins)} min`;
                                    const hrs = mins / 60;
                                    if (hrs < 24) return `${Math.round(hrs)} hr`;
                                    const days = hrs / 24;
                                    return `${Math.round(days)} day${Math.round(days) !== 1 ? 's' : ''}`;
                                  };
                                  if (reloadData.length === 0 && !reloadLoading && userId) {
                                    setTimeout(() => fetchReloadData(userId, 0), 0);
                                  }
                                  return (
                                    <div>
                                      {reloadLoading ? (
                                        <AcpSkeleton />
                                      ) : reloadData.length > 0 && reloadData[0] !== '__empty__' ? (
                                        <>
                                          <div className="max-h-[400px] overflow-y-auto">
                                            <table className="w-full text-[13px]">
                                              <thead className="sticky top-0 bg-white dark:bg-[#0a0a0a] z-[1]">
                                                <tr className="text-[12px] text-gray-500 dark:text-white/45 uppercase tracking-wide">
                                                  <th className="text-left pb-2 pl-1 font-medium">Active</th>
                                                  <th className="text-left pb-2 font-medium">Value</th>
                                                  <th className="text-left pb-2 font-medium">Last Claim</th>
                                                  <th className="text-left pb-2 font-medium">Claims</th>
                                                  <th className="text-left pb-2 font-medium">Expires</th>
                                                  <th className="text-left pb-2 font-medium">Interval</th>
                                                  <th className="text-left pb-2 font-medium">Created</th>
                                                  <th className="text-left pb-2 font-medium">Comment</th>
                                                  <th className="text-left pb-2 font-medium">Sent By</th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {reloadData.map((r, i) => (
                                                  <tr key={i} className="border-t border-gray-100/80 dark:border-white/[0.06] align-top">
                                                    <td className="py-1.5 pl-1">
                                                      {r.active ? (
                                                        <span className="w-4 h-4 rounded bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 inline-flex items-center justify-center text-[10px]">✓</span>
                                                      ) : (
                                                        <span className="w-4 h-4 rounded bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-white/30 inline-flex items-center justify-center text-[10px]">—</span>
                                                      )}
                                                    </td>
                                                    <td className="py-1.5 text-gray-700 dark:text-white/75 font-mono">{r.value != null ? `$${Number(r.value).toFixed(2)}` : '—'}</td>
                                                    <td className="py-1.5 text-gray-500 dark:text-white/50 whitespace-nowrap">{fmtDate(r.lastClaim)}</td>
                                                    <td className="py-1.5 text-gray-700 dark:text-white/75 font-mono">{(() => {
                                                      if (r.claimCount == null) return '—';
                                                      const interval = Number(r.claimInterval);
                                                      const created = r.createdAt ? new Date(/^\d+$/.test(String(r.createdAt)) ? Number(r.createdAt) : r.createdAt).getTime() : 0;
                                                      const expires = r.expireAt ? new Date(/^\d+$/.test(String(r.expireAt)) ? Number(r.expireAt) : r.expireAt).getTime() : 0;
                                                      if (interval > 0 && created && expires) {
                                                        const total = Math.round((expires - created) / interval);
                                                        return `${r.claimCount} / ${total}`;
                                                      }
                                                      return String(r.claimCount);
                                                    })()}</td>
                                                    <td className="py-1.5 text-gray-500 dark:text-white/50 whitespace-nowrap">{fmtDate(r.expireAt)}</td>
                                                    <td className="py-1.5 text-gray-700 dark:text-white/75">{fmtInterval(r.claimInterval)}</td>
                                                    <td className="py-1.5 text-gray-500 dark:text-white/50 whitespace-nowrap">{fmtDate(r.createdAt)}</td>
                                                    <td className="py-1.5 text-gray-700 dark:text-white/75">{r.comment || '—'}</td>
                                                    <td className="py-1.5 text-gray-700 dark:text-white/75">{r.authBy?.name || '—'}</td>
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                          </div>
                                          {/* Pagination */}
                                          <div className="flex items-center justify-between mt-2 text-[11px]">
                                            <span className="text-gray-500 dark:text-white/35">Page {reloadPage + 1}</span>
                                            <div className="flex items-center gap-2">
                                              <button disabled={reloadPage === 0} onClick={() => fetchReloadData(userId, reloadPage - 1)}
                                                className={`px-2 py-0.5 rounded ${reloadPage === 0 ? 'text-gray-400 dark:text-white/10 cursor-not-allowed' : 'text-indigo-500 dark:text-indigo-400 hover:underline'}`}>Previous</button>
                                              <button disabled={!reloadHasMore} onClick={() => fetchReloadData(userId, reloadPage + 1)}
                                                className={`px-2 py-0.5 rounded ${!reloadHasMore ? 'text-gray-400 dark:text-white/10 cursor-not-allowed' : 'text-indigo-500 dark:text-indigo-400 hover:underline'}`}>Next</button>
                                            </div>
                                          </div>
                                        </>
                                      ) : (
                                        <span className="text-[13px] text-gray-500 dark:text-white/55 italic">No reloads</span>
                                      )}
                                    </div>
                                  );
                                })() : sectionId === 'rollover' ? (() => {
                                  const u = acpData?.data?.user;
                                  const userId = u?.id;
                                  const fmtDate = (ts) => { if (!ts) return '—'; const d = new Date(/^\d+$/.test(String(ts)) ? Number(ts) : ts); return isNaN(d) ? '—' : d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, month: 'numeric', day: 'numeric', year: 'numeric' }); };
                                  const fmtCurAmount = (amount, currency) => {
                                    if (amount == null) return '—';
                                    const cur = (currency || '').toUpperCase();
                                    const val = Number(amount);
                                    return `${cur} ${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                                  };
                                  if (rolloverData.length === 0 && !rolloverLoading && userId) {
                                    setTimeout(() => fetchRolloverData(userId, 0), 0);
                                  }
                                  return (
                                    <div>
                                      {rolloverLoading ? (
                                        <AcpSkeleton />
                                      ) : rolloverData.length > 0 && rolloverData[0] !== '__empty__' ? (
                                        <>
                                          <div className="max-h-[400px] overflow-y-auto">
                                            <table className="w-full text-[13px]">
                                              <thead className="sticky top-0 bg-white dark:bg-[#0a0a0a] z-[1]">
                                                <tr className="text-[12px] text-gray-500 dark:text-white/45 uppercase tracking-wide">
                                                  <th className="text-left pb-2 pl-1 font-medium">Active</th>
                                                  <th className="text-left pb-2 font-medium">Progress</th>
                                                  <th className="text-left pb-2 font-medium">Created</th>
                                                  <th className="text-left pb-2 font-medium">Amount</th>
                                                  <th className="text-left pb-2 font-medium">Loss</th>
                                                  <th className="text-left pb-2 font-medium">Expected</th>
                                                  <th className="text-left pb-2 font-medium">Expected (min)</th>
                                                  <th className="text-left pb-2 font-medium">Max Bet</th>
                                                  <th className="text-left pb-2 font-medium">Note</th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {rolloverData.map((r, i) => {
                                                  const pct = r.progress != null ? (Number(r.progress) * 100).toFixed(2) : '—';
                                                  return (
                                                    <tr key={r.id || i} className="border-t border-gray-100/80 dark:border-white/[0.06] align-top">
                                                      <td className="py-1.5 pl-1">
                                                        {r.active ? (
                                                          <span className="w-4 h-4 rounded bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 inline-flex items-center justify-center text-[10px]">✓</span>
                                                        ) : (
                                                          <span className="w-4 h-4 rounded bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-white/30 inline-flex items-center justify-center text-[10px]">—</span>
                                                        )}
                                                      </td>
                                                      <td className="py-1.5 text-gray-700 dark:text-white/75 font-mono">{pct}%</td>
                                                      <td className="py-1.5 text-gray-500 dark:text-white/50 whitespace-nowrap">{fmtDate(r.createdAt)}</td>
                                                      <td className="py-1.5 text-gray-700 dark:text-white/75 font-mono whitespace-nowrap">{fmtCurAmount(r.amount, r.currency)}</td>
                                                      <td className="py-1.5 text-gray-700 dark:text-white/75 font-mono whitespace-nowrap">{fmtCurAmount(r.lossAmount, r.currency)}</td>
                                                      <td className="py-1.5 text-gray-700 dark:text-white/75 font-mono whitespace-nowrap">{fmtCurAmount(r.expectedAmount, r.currency)}</td>
                                                      <td className="py-1.5 text-gray-700 dark:text-white/75 font-mono whitespace-nowrap">{fmtCurAmount(r.expectedAmountMin, r.currency)}</td>
                                                      <td className="py-1.5 text-gray-700 dark:text-white/75 font-mono whitespace-nowrap">{fmtCurAmount(r.maxBet, r.currency)}</td>
                                                      <td className="py-1.5 text-gray-700 dark:text-white/75">{r.note || '—'}</td>
                                                    </tr>
                                                  );
                                                })}
                                              </tbody>
                                            </table>
                                          </div>
                                          {/* Pagination */}
                                          <div className="flex items-center justify-between mt-2 text-[11px]">
                                            <span className="text-gray-500 dark:text-white/35">Page {rolloverPage + 1}</span>
                                            <div className="flex items-center gap-2">
                                              <button disabled={rolloverPage === 0} onClick={() => fetchRolloverData(userId, rolloverPage - 1)}
                                                className={`px-2 py-0.5 rounded ${rolloverPage === 0 ? 'text-gray-400 dark:text-white/10 cursor-not-allowed' : 'text-indigo-500 dark:text-indigo-400 hover:underline'}`}>Previous</button>
                                              <button disabled={!rolloverHasMore} onClick={() => fetchRolloverData(userId, rolloverPage + 1)}
                                                className={`px-2 py-0.5 rounded ${!rolloverHasMore ? 'text-gray-400 dark:text-white/10 cursor-not-allowed' : 'text-indigo-500 dark:text-indigo-400 hover:underline'}`}>Next</button>
                                            </div>
                                          </div>
                                        </>
                                      ) : (
                                        <span className="text-[13px] text-gray-500 dark:text-white/55 italic">No rollovers</span>
                                      )}
                                    </div>
                                  );
                                })() : sectionId === 'sessions' ? (() => {
                                  const u = acpData?.data?.user;
                                  const userId = u?.id;
                                  const fmtDate = (ts) => { if (!ts) return '—'; const d = new Date(/^\d+$/.test(String(ts)) ? Number(ts) : ts); return isNaN(d) ? '—' : d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, month: 'numeric', day: 'numeric', year: 'numeric' }); };
                                  const sessTabs = [
                                    { id: 'internal', label: 'Internal' },
                                    { id: 'softswiss', label: 'Softswiss' },
                                    { id: 'thirdparty', label: 'Third Party' },
                                  ];
                                  const tp3pProviders = ['beter','evenbet','evolution','evolutionOss','hacksaw','hub88','massive','pragmatic','twist'];
                                  const cryptos = new Set(['btc','eth','ltc','sol','doge','bch','xrp','trx','eos','bnb','usdt','usdc','busd','matic','ada','dot','shib','avax','link','uni','dai']);
                                  const isCrypto = (c) => cryptos.has((c || '').toLowerCase());
                                  const CurLabel = ({ currency }) => {
                                    const cur = (currency || '').toLowerCase();
                                    if (!cur) return <span>—</span>;
                                    if (isCrypto(cur)) return (
                                      <span className="inline-flex items-center gap-1">
                                        <img src={`https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/32/color/${cur}.png`} alt="" className="w-3.5 h-3.5 rounded-full"
                                          onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
                                        <span className="w-3.5 h-3.5 rounded-full bg-gray-200 dark:bg-white/10 items-center justify-center text-[6px] font-bold text-gray-500 dark:text-white/55 hidden shrink-0">{cur.slice(0,2).toUpperCase()}</span>
                                        <span className="uppercase">{cur}</span>
                                      </span>
                                    );
                                    return <span className="uppercase">{cur}</span>;
                                  };

                                  // Auto-fetch internal on first render
                                  if (sessionsTab === 'internal' && sessionsInternal.length === 0 && !sessionsInternalLoading && userId) {
                                    setTimeout(() => fetchSessionsInternal(userId, 0), 0);
                                  }

                                  // Filter internal sessions (all accumulated data)
                                  const allFiltered = sessionsInternal[0] === '__empty__' ? [] :
                                    sessionsInternalFilter === 'all' ? sessionsInternal :
                                    sessionsInternalFilter === 'active' ? sessionsInternal.filter(s => s.active) :
                                    sessionsInternal.filter(s => !s.active);
                                  // Client-side pagination on filtered data
                                  const viewStart = sessionsInternalPage * 50;
                                  const filteredInternal = allFiltered.slice(viewStart, viewStart + 50);
                                  const hasNextFilteredPage = allFiltered.length > viewStart + 50;

                                  return (
                                    <div>
                                      {/* Mini navbar */}
                                      <div className="flex items-center gap-0.5 border-b border-gray-100 dark:border-white/[0.06] mb-3">
                                        {sessTabs.map(t => (
                                          <button key={t.id} onClick={() => {
                                            setSessionsTab(t.id);
                                            if (t.id === 'internal' && sessionsInternal.length === 0 && !sessionsInternalLoading && userId) fetchSessionsInternal(userId, 0);
                                            if (t.id === 'softswiss' && sessionsSoftswiss === null && !sessionsSoftswissLoading && userId) fetchSessionsSoftswiss(userId);
                                            if (t.id === 'thirdparty' && sessions3p.length === 0 && !sessions3pLoading && userId) fetchSessions3p(userId, sessions3pProvider, 0);
                                          }}
                                            className={`px-3 py-2 text-[12px] font-medium border-b-2 transition-colors ${
                                              sessionsTab === t.id ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 dark:text-white/45 hover:text-gray-600 dark:hover:text-white/40'
                                            }`}>{t.label}</button>
                                        ))}
                                      </div>

                                      {/* ── Internal ── */}
                                      {sessionsTab === 'internal' && (
                                        <div>
                                          <div className="flex items-center gap-2 mb-2">
                                            <span className="text-[12px] text-gray-500 dark:text-white/45 uppercase tracking-wide">Provider:</span>
                                            <select value={sessionsInternalFilter} onChange={(e) => { setSessionsInternalFilter(e.target.value); setSessionsInternalPage(0); }}
                                              className="text-[11px] bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-white/65 rounded px-1.5 py-0.5 border-0 outline-none [&>option]:bg-white [&>option]:dark:bg-[#1a1a1a] [&>option]:dark:text-white/75">
                                              <option value="all">All</option>
                                              <option value="active">Active</option>
                                              <option value="inactive">Inactive</option>
                                            </select>
                                          </div>
                                          {sessionsInternalLoading ? (
                                            <AcpSkeleton />
                                          ) : filteredInternal.length === 0 ? (
                                            <span className="text-[13px] text-gray-500 dark:text-white/55 italic">No sessions</span>
                                          ) : (
                                            <>
                                              <div className="max-h-[400px] overflow-y-auto">
                                                <table className="w-full text-[13px]">
                                                  <thead className="sticky top-0 bg-white dark:bg-[#0a0a0a] z-[1]">
                                                    <tr className="text-[12px] text-gray-500 dark:text-white/45 uppercase tracking-wide">
                                                      <th className="text-left pb-2 pl-1 font-medium">Browser</th>
                                                      <th className="text-left pb-2 font-medium">Near</th>
                                                      <th className="text-left pb-2 font-medium">IP Address</th>
                                                      <th className="text-left pb-2 font-medium">Last Used</th>
                                                      <th className="text-left pb-2 font-medium">Status</th>
                                                    </tr>
                                                  </thead>
                                                  <tbody>
                                                    {filteredInternal.map((s, i) => (
                                                      <tr key={s.id || i} className="border-t border-gray-100/80 dark:border-white/[0.06] align-top">
                                                        <td className="py-1.5 pl-1 text-gray-700 dark:text-white/75">{s.sessionName || '—'}</td>
                                                        <td className="py-1.5 text-gray-700 dark:text-white/75 whitespace-nowrap">{[s.city, s.country].filter(Boolean).join(', ') || '—'}</td>
                                                        <td className="py-1.5 text-gray-500 dark:text-white/50 font-mono">{s.ip || '—'}</td>
                                                        <td className="py-1.5 text-gray-500 dark:text-white/50 whitespace-nowrap">{fmtDate(s.updatedAt)}</td>
                                                        <td className="py-1.5">
                                                          {s.active ? (
                                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">Active</span>
                                                          ) : (
                                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-white/35">Removed</span>
                                                          )}
                                                        </td>
                                                      </tr>
                                                    ))}
                                                  </tbody>
                                                </table>
                                              </div>
                                              <div className="flex items-center justify-between mt-2 text-[11px]">
                                                <span className="text-gray-500 dark:text-white/35">Page {sessionsInternalPage + 1}</span>
                                                <div className="flex items-center gap-2">
                                                  <button disabled={sessionsInternalPage === 0} onClick={() => setSessionsInternalPage(p => p - 1)}
                                                    className={`px-2 py-0.5 rounded ${sessionsInternalPage === 0 ? 'text-gray-400 dark:text-white/10 cursor-not-allowed' : 'text-indigo-500 dark:text-indigo-400 hover:underline'}`}>Previous</button>
                                                  <button disabled={!hasNextFilteredPage && !sessionsInternalHasMore} onClick={() => {
                                                    if (hasNextFilteredPage) {
                                                      setSessionsInternalPage(p => p + 1);
                                                    } else if (sessionsInternalHasMore && userId) {
                                                      const nextOffset = sessionsInternal[0] === '__empty__' ? 0 : sessionsInternal.length;
                                                      fetchSessionsInternal(userId, nextOffset).then(() => setSessionsInternalPage(p => p + 1));
                                                    }
                                                  }}
                                                    className={`px-2 py-0.5 rounded ${!hasNextFilteredPage && !sessionsInternalHasMore ? 'text-gray-400 dark:text-white/10 cursor-not-allowed' : 'text-indigo-500 dark:text-indigo-400 hover:underline'}`}>Next</button>
                                                </div>
                                              </div>
                                            </>
                                          )}
                                        </div>
                                      )}

                                      {/* ── Softswiss ── */}
                                      {sessionsTab === 'softswiss' && (
                                        <div>
                                          {sessionsSoftswissLoading ? (
                                            <AcpSkeleton />
                                          ) : sessionsSoftswiss && sessionsSoftswiss.length === 0 ? (
                                            <span className="text-[13px] text-gray-500 dark:text-white/55 italic">No Softswiss sessions</span>
                                          ) : sessionsSoftswiss ? (
                                            <div className="max-h-[400px] overflow-y-auto">
                                              <table className="w-full text-[13px]">
                                                <thead className="sticky top-0 bg-white dark:bg-[#0a0a0a] z-[1]">
                                                  <tr className="text-[12px] text-gray-500 dark:text-white/45 uppercase tracking-wide">
                                                    <th className="text-left pb-2 pl-1 font-medium">ID</th>
                                                    <th className="text-left pb-2 font-medium">Source</th>
                                                    <th className="text-left pb-2 font-medium">Target</th>
                                                    <th className="text-left pb-2 font-medium">Updated</th>
                                                    <th className="text-left pb-2 font-medium">Priority</th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {sessionsSoftswiss.map((s, i) => (
                                                    <tr key={s.id || i} className="border-t border-gray-100/80 dark:border-white/[0.06] align-top">
                                                      <td className="py-1.5 pl-1 text-gray-500 dark:text-white/50 font-mono text-[12px] break-all max-w-[140px]">{s.id || '—'}</td>
                                                      <td className="py-1.5 text-gray-700 dark:text-white/75"><CurLabel currency={s.source} /></td>
                                                      <td className="py-1.5 text-gray-700 dark:text-white/75"><CurLabel currency={s.target} /></td>
                                                      <td className="py-1.5 text-gray-500 dark:text-white/50 whitespace-nowrap">{fmtDate(s.updatedAt)}</td>
                                                      <td className="py-1.5 text-gray-700 dark:text-white/75 font-mono">{s.profile?.priority ?? '—'}</td>
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </table>
                                            </div>
                                          ) : null}
                                        </div>
                                      )}

                                      {/* ── Third Party ── */}
                                      {sessionsTab === 'thirdparty' && (
                                        <div>
                                          <div className="flex items-center gap-2 mb-2">
                                            <span className="text-[12px] text-gray-500 dark:text-white/45 uppercase tracking-wide">Session Filter:</span>
                                            <select value={sessions3pProvider} onChange={(e) => {
                                              setSessions3pProvider(e.target.value);
                                              if (userId) fetchSessions3p(userId, e.target.value, 0);
                                            }}
                                              className="text-[11px] bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-white/65 rounded px-1.5 py-0.5 border-0 outline-none [&>option]:bg-white [&>option]:dark:bg-[#1a1a1a] [&>option]:dark:text-white/75">
                                              {tp3pProviders.map(p => <option key={p} value={p}>{p}</option>)}
                                            </select>
                                          </div>
                                          {sessions3pLoading ? (
                                            <AcpSkeleton />
                                          ) : sessions3p.length > 0 && sessions3p[0] !== '__empty__' ? (
                                            <>
                                              <div className="max-h-[400px] overflow-y-auto">
                                                <table className="w-full text-[13px]">
                                                  <thead className="sticky top-0 bg-white dark:bg-[#0a0a0a] z-[1]">
                                                    <tr className="text-[12px] text-gray-500 dark:text-white/45 uppercase tracking-wide">
                                                      <th className="text-left pb-2 pl-1 font-medium">ID</th>
                                                      <th className="text-left pb-2 font-medium">Session ID</th>
                                                      <th className="text-left pb-2 font-medium">Source</th>
                                                      <th className="text-left pb-2 font-medium">Target</th>
                                                      <th className="text-left pb-2 font-medium">Created</th>
                                                      <th className="text-left pb-2 font-medium">Updated</th>
                                                      <th className="text-left pb-2 font-medium">Exchange Rate</th>
                                                    </tr>
                                                  </thead>
                                                  <tbody>
                                                    {sessions3p.map((s, i) => (
                                                      <tr key={s.id || i} className="border-t border-gray-100/80 dark:border-white/[0.06] align-top">
                                                        <td className="py-1.5 pl-1 text-gray-500 dark:text-white/50 font-mono text-[12px] break-all max-w-[120px]">{s.id || '—'}</td>
                                                        <td className="py-1.5 text-gray-500 dark:text-white/50 font-mono text-[12px] break-all max-w-[120px]">{s.extUserId || '—'}</td>
                                                        <td className="py-1.5 text-gray-700 dark:text-white/75"><CurLabel currency={s.sourceCurrency} /></td>
                                                        <td className="py-1.5 text-gray-700 dark:text-white/75"><CurLabel currency={s.targetCurrency} /></td>
                                                        <td className="py-1.5 text-gray-500 dark:text-white/50 whitespace-nowrap">{fmtDate(s.createdAt)}</td>
                                                        <td className="py-1.5 text-gray-500 dark:text-white/50 whitespace-nowrap">{fmtDate(s.updatedAt)}</td>
                                                        <td className="py-1.5 text-gray-700 dark:text-white/75 font-mono">{s.lastExchangeRate ?? '—'}</td>
                                                      </tr>
                                                    ))}
                                                  </tbody>
                                                </table>
                                              </div>
                                              <div className="flex items-center justify-between mt-2 text-[11px]">
                                                <span className="text-gray-500 dark:text-white/35">Page {sessions3pPage + 1}</span>
                                                <div className="flex items-center gap-2">
                                                  <button disabled={sessions3pPage === 0} onClick={() => fetchSessions3p(userId, sessions3pProvider, sessions3pPage - 1)}
                                                    className={`px-2 py-0.5 rounded ${sessions3pPage === 0 ? 'text-gray-400 dark:text-white/10 cursor-not-allowed' : 'text-indigo-500 dark:text-indigo-400 hover:underline'}`}>Previous</button>
                                                  <button disabled={!sessions3pHasMore} onClick={() => fetchSessions3p(userId, sessions3pProvider, sessions3pPage + 1)}
                                                    className={`px-2 py-0.5 rounded ${!sessions3pHasMore ? 'text-gray-400 dark:text-white/10 cursor-not-allowed' : 'text-indigo-500 dark:text-indigo-400 hover:underline'}`}>Next</button>
                                                </div>
                                              </div>
                                            </>
                                          ) : sessions3p.length > 0 ? (
                                            <span className="text-[13px] text-gray-500 dark:text-white/55 italic">No sessions for {sessions3pProvider}</span>
                                          ) : null}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })() : sectionId === 'sportsbook' ? (() => {
                                  const userId = acpData?.data?.user?.id;
                                  const sportsTabs = [
                                    { id: 'active', label: 'Active Bets' },
                                    { id: 'resolved', label: 'Resolved Bets' },
                                    { id: 'promo', label: 'Promotion Bets' },
                                    { id: 'rejected', label: 'Rejected Promo' },
                                  ];

                                  const cryptos = new Set(['btc','eth','ltc','sol','doge','bch','xrp','trx','eos','bnb','usdt','usdc','busd','matic','ada','dot','shib','avax','link','uni','dai','aave','comp','mkr','snx','yfi','sushi','crv','bat','zrx','enj','mana','sand','gala','axs','ftm','near','atom','algo','xlm','vet','hbar','icp','fil','theta','egld','flow','kda','kas','apt','arb','op','sui','sei','ton','tia','jup','wld','pyth','bonk','pepe','floki','wif','render','fet','ocean','grt']);
                                  const fmtDate = (ts) => { if (!ts) return '—'; const d = new Date(/^\d+$/.test(String(ts)) ? Number(ts) : ts); return isNaN(d) ? '—' : d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, month: 'numeric', day: 'numeric', year: 'numeric' }); };

                                  // Auto-fetch on first render
                                  if (sportsTab === 'active' && sportsActive.length === 0 && !sportsActiveLoading && userId) {
                                    setTimeout(() => fetchSportsActive(userId, 0), 0);
                                  }

                                  // Helper: get bet ID display
                                  const getBetId = (b) => {
                                    const iid = b._iid || b.search?.iid;
                                    if (iid && String(iid).includes(':')) return String(iid);
                                    const tn = (b.__typename || b._type || '').replace('Bet', '').toLowerCase();
                                    return iid ? `${tn}:${iid}` : (b.id || '—');
                                  };

                                  // Crypto icon helper
                                  const CurIcon = ({ currency }) => {
                                    const cur = (currency || '').toLowerCase();
                                    if (!cryptos.has(cur)) return null;
                                    return (
                                      <>
                                        <img src={`https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/32/color/${cur}.png`}
                                          alt={cur} className="w-3.5 h-3.5 inline-block mr-0.5 align-middle shrink-0"
                                          onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
                                        <span className="w-3.5 h-3.5 rounded-full bg-gray-200 dark:bg-white/10 items-center justify-center text-[6px] font-bold text-gray-500 dark:text-white/55 hidden shrink-0 inline-flex mr-0.5 align-middle">{cur.slice(0,2).toUpperCase()}</span>
                                      </>
                                    );
                                  };

                                  // Helper: format amount with USD value
                                  const fmtBetAmount = (amount, value, currency) => {
                                    const cur = (currency || '').toLowerCase();
                                    const amt = amount != null ? Number(amount) : 0;
                                    const usd = value != null ? Number(value) : null;
                                    const isCr = cryptos.has(cur);
                                    const amtStr = isCr ? amt.toFixed(8).replace(/\.?0+$/, '') : `${cur.toUpperCase()} ${amt.toFixed(2)}`;
                                    return (
                                      <div>
                                        <div className="text-gray-700 dark:text-white/75 flex items-center gap-0.5">
                                          {isCr && <CurIcon currency={cur} />}
                                          <span>{amtStr}</span>
                                        </div>
                                        {usd != null && <div className="text-gray-500 dark:text-white/35 text-[10px]">${usd.toFixed(2)}</div>}
                                      </div>
                                    );
                                  };

                                  // Helper: format payout with USD
                                  const fmtPayout = (payout, amount, value, currency) => {
                                    const cur = (currency || '').toLowerCase();
                                    const pay = payout != null ? Number(payout) : 0;
                                    const isCr = cryptos.has(cur);
                                    const payStr = isCr ? pay.toFixed(8).replace(/\.?0+$/, '') : `${cur.toUpperCase()} ${pay.toFixed(2)}`;
                                    const rate = (amount && value && Number(amount) !== 0) ? Number(value) / Number(amount) : null;
                                    const payUsd = rate ? pay * rate : null;
                                    return (
                                      <div>
                                        <div className="text-gray-700 dark:text-white/75 flex items-center gap-0.5">
                                          {isCr && <CurIcon currency={cur} />}
                                          <span>{payStr}</span>
                                        </div>
                                        {payUsd != null && <div className="text-gray-500 dark:text-white/35 text-[10px]">${payUsd.toFixed(2)}</div>}
                                      </div>
                                    );
                                  };

                                  // Status color
                                  const statusCls = (s) => {
                                    const st = (s || '').toLowerCase();
                                    if (st === 'settled' || st === 'won') return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400';
                                    if (st === 'cashout') return 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400';
                                    if (st === 'confirmed' || st === 'active' || st === 'pending') return 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400';
                                    if (st === 'cancelled' || st === 'rejected' || st === 'lost') return 'bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400';
                                    return 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-white/50';
                                  };

                                  // Render bet table
                                  const renderBetTable = (bets, loading, page, hasMore, fetchFn) => {
                                    if (loading) return <AcpSkeleton />;
                                    const items = bets[0] === '__empty__' ? [] : bets;
                                    if (items.length === 0 && bets.length > 0) return <span className="text-[13px] text-gray-500 dark:text-white/55 italic">No bets</span>;
                                    if (items.length === 0) return null;
                                    return (
                                      <>
                                        <div className="max-h-[400px] overflow-y-auto">
                                          <table className="w-full text-[13px]">
                                            <thead className="sticky top-0 bg-white dark:bg-[#0a0a0a] z-[1]">
                                              <tr className="text-[12px] text-gray-500 dark:text-white/45 uppercase tracking-wide">
                                                <th className="text-left pb-2 pl-1 font-medium">Bet ID</th>
                                                <th className="text-left pb-2 font-medium">Created</th>
                                                <th className="text-left pb-2 font-medium">Bet Amount</th>
                                                <th className="text-left pb-2 font-medium">Mult.</th>
                                                <th className="text-left pb-2 font-medium">Payout</th>
                                                <th className="text-left pb-2 font-medium">Type</th>
                                                <th className="text-left pb-2 font-medium">Status</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {items.map((b, i) => {
                                                const st = b.status || b.betStatus || '—';
                                                const mult = b.payoutMultiplier != null ? Number(b.payoutMultiplier).toFixed(2) + '×' : '—';
                                                const hasShield = (b.customPrices || []).some(p => p.type === 'stakeShield');
                                                return (
                                                  <tr key={b.id || i} className="border-t border-gray-100/80 dark:border-white/[0.06] align-top">
                                                    <td className="py-1.5 pl-1 text-gray-500 dark:text-white/50 font-mono text-[12px] whitespace-nowrap">{getBetId(b)}</td>
                                                    <td className="py-1.5 text-gray-500 dark:text-white/50 whitespace-nowrap">{fmtDate(b.createdAt)}</td>
                                                    <td className="py-1.5">{fmtBetAmount(b.amount, b.value, b.currency)}</td>
                                                    <td className="py-1.5 text-gray-700 dark:text-white/75 font-mono">{mult}</td>
                                                    <td className="py-1.5">{fmtPayout(b.payout, b.amount, b.value, b.currency)}</td>
                                                    <td className="py-1.5 whitespace-nowrap">
                                                      <span className="text-gray-600 dark:text-white/65">{b.__typename || b._type || '—'}</span>
                                                      {hasShield && <span className="ml-1 text-[8px] px-1 py-0.5 rounded bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">Shield</span>}
                                                    </td>
                                                    <td className="py-1.5">
                                                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${statusCls(st)}`}>{st}</span>
                                                    </td>
                                                  </tr>
                                                );
                                              })}
                                            </tbody>
                                          </table>
                                        </div>
                                        {fetchFn && (
                                          <div className="flex items-center justify-between mt-2 text-[11px]">
                                            <span className="text-gray-500 dark:text-white/35">Page {page + 1}</span>
                                            <div className="flex items-center gap-2">
                                              <button disabled={page === 0} onClick={() => fetchFn(userId, page - 1)}
                                                className={`px-2 py-0.5 rounded ${page === 0 ? 'text-gray-400 dark:text-white/10 cursor-not-allowed' : 'text-indigo-500 dark:text-indigo-400 hover:underline'}`}>Previous</button>
                                              <button disabled={!hasMore} onClick={() => fetchFn(userId, page + 1)}
                                                className={`px-2 py-0.5 rounded ${!hasMore ? 'text-gray-400 dark:text-white/10 cursor-not-allowed' : 'text-indigo-500 dark:text-indigo-400 hover:underline'}`}>Next</button>
                                            </div>
                                          </div>
                                        )}
                                      </>
                                    );
                                  };

                                  return (
                                    <div>
                                      {/* Mini navbar */}
                                      <div className="flex items-center gap-0.5 border-b border-gray-100 dark:border-white/[0.06] mb-3">
                                        {sportsTabs.map(t => (
                                          <button key={t.id} onClick={() => {
                                            setSportsTab(t.id);
                                            if (t.id === 'active' && sportsActive.length === 0 && !sportsActiveLoading && userId) fetchSportsActive(userId, 0);
                                            if (t.id === 'resolved' && sportsResolved.length === 0 && !sportsResolvedLoading && userId) fetchSportsResolved(userId, 0);
                                          }}
                                            className={`px-3 py-2 text-[12px] font-medium border-b-2 transition-colors ${
                                              sportsTab === t.id ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 dark:text-white/45 hover:text-gray-600 dark:hover:text-white/40'
                                            }`}>{t.label}</button>
                                        ))}
                                      </div>

                                      {/* Active Bets */}
                                      {sportsTab === 'active' && renderBetTable(sportsActive, sportsActiveLoading, sportsActivePage, sportsActiveHasMore, fetchSportsActive)}

                                      {/* Resolved Bets */}
                                      {sportsTab === 'resolved' && renderBetTable(sportsResolved, sportsResolvedLoading, sportsResolvedPage, sportsResolvedHasMore, fetchSportsResolved)}

                                      {/* Promotion Bets */}
                                      {sportsTab === 'promo' && (
                                        <span className="text-[13px] text-gray-500 dark:text-white/55 italic">Coming soon</span>
                                      )}

                                      {/* Rejected Promotion Bets */}
                                      {sportsTab === 'rejected' && (
                                        <span className="text-[13px] text-gray-500 dark:text-white/55 italic">Coming soon</span>
                                      )}
                                    </div>
                                  );
                                })() : sectionId === 'swish-markets' ? (() => {
                                  const userId = acpData?.data?.user?.id;
                                  const cryptos = new Set(['btc','eth','ltc','sol','doge','bch','xrp','trx','eos','bnb','usdt','usdc','busd','matic','ada','dot','shib','avax','link','uni','dai','aave','comp','mkr','snx','yfi','sushi','crv','bat','zrx','enj','mana','sand','gala','axs','ftm','near','atom','algo','xlm','vet','hbar','icp','fil','theta','egld','flow','kda','kas','apt','arb','op','sui','sei','ton','tia','jup','wld','pyth','bonk','pepe','floki','wif','render','fet','ocean','grt']);
                                  const fmtDate = (ts) => { if (!ts) return '—'; const d = new Date(/^\d+$/.test(String(ts)) ? Number(ts) : ts); return isNaN(d) ? '—' : d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, month: 'numeric', day: 'numeric', year: 'numeric' }); };

                                  const swishSubTabs = [
                                    { id: 'bets', label: 'Bets' },
                                    { id: 'overall', label: 'Overall' },
                                  ];

                                  // Auto-fetch on first render
                                  if (swishTab === 'bets' && swishBetsFilter === 'active' && swishActive.length === 0 && !swishActiveLoading && userId) {
                                    setTimeout(() => fetchSwishActive(userId, 0), 0);
                                  }

                                  // Extract lines from bet outcomes
                                  const getLines = (bet) => (bet.outcomes || []).map(o => {
                                    const comp = o.outcome?.competitor?.name || '';
                                    const name = o.outcome?.name || '';
                                    return comp ? `${comp} ${name}` : name;
                                  }).filter(Boolean);

                                  // Extract unique games from bet outcomes
                                  const getGames = (bet) => [...new Set((bet.outcomes || []).flatMap(o => {
                                    const comps = o.outcome?.market?.game?.fixture?.data?.competitors;
                                    if (comps && comps.length >= 2) return [`${comps[0].name} - ${comps[1].name}`];
                                    return [];
                                  }))];

                                  // Profit calculation
                                  const calcProfit = (bet) => {
                                    const st = (bet.status || '').toLowerCase();
                                    if (st.startsWith('rejected')) return { val: 0, label: '$0.00' };
                                    const value = bet.value != null ? Number(bet.value) : 0;
                                    const amount = bet.amount != null ? Number(bet.amount) : 0;
                                    const payout = bet.payout != null ? Number(bet.payout) : 0;
                                    const rate = amount > 0 ? value / amount : 0;
                                    const payoutUsd = payout * rate;
                                    const profit = payoutUsd - value;
                                    return { val: profit, label: profit >= 0 ? `$${profit.toFixed(2)}` : `-$${Math.abs(profit).toFixed(2)}` };
                                  };

                                  // Status color
                                  const statusCls = (s) => {
                                    const st = (s || '').toLowerCase();
                                    if (st === 'settled' || st === 'won') return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400';
                                    if (st === 'cashout') return 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400';
                                    if (st === 'confirmed' || st === 'active' || st === 'pending') return 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400';
                                    if (st.includes('rejected') || st === 'cancelled' || st === 'lost') return 'bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400';
                                    return 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-white/50';
                                  };

                                  // Crypto icon
                                  const CurIcon = ({ currency }) => {
                                    const cur = (currency || '').toLowerCase();
                                    if (!cryptos.has(cur)) return null;
                                    return (
                                      <>
                                        <img src={`https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/32/color/${cur}.png`}
                                          alt={cur} className="w-3.5 h-3.5 inline-block mr-0.5 align-middle shrink-0"
                                          onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
                                        <span className="w-3.5 h-3.5 rounded-full bg-gray-200 dark:bg-white/10 items-center justify-center text-[6px] font-bold text-gray-500 dark:text-white/55 hidden shrink-0 inline-flex mr-0.5 align-middle">{cur.slice(0,2).toUpperCase()}</span>
                                      </>
                                    );
                                  };

                                  // Render swish bet table
                                  const renderSwishBetTable = (bets, loading, page, hasMore, fetchFn) => {
                                    if (loading) return <AcpSkeleton />;
                                    const items = bets[0] === '__empty__' ? [] : bets;
                                    if (items.length === 0 && bets.length > 0) return <span className="text-[13px] text-gray-500 dark:text-white/55 italic">No bets</span>;
                                    if (items.length === 0) return null;
                                    return (
                                      <>
                                        <div className="max-h-[400px] overflow-y-auto">
                                          <table className="w-full text-[13px]">
                                            <thead className="sticky top-0 bg-white dark:bg-[#0a0a0a] z-[1]">
                                              <tr className="text-[12px] text-gray-500 dark:text-white/45 uppercase tracking-wide">
                                                <th className="text-left pb-2 pl-1 font-medium">Date</th>
                                                <th className="text-left pb-2 font-medium">Value</th>
                                                <th className="text-left pb-2 font-medium">Odds</th>
                                                <th className="text-left pb-2 font-medium">Legs</th>
                                                <th className="text-left pb-2 font-medium">Custom</th>
                                                <th className="text-left pb-2 font-medium">Status</th>
                                                <th className="text-left pb-2 font-medium">Stake</th>
                                                <th className="text-left pb-2 font-medium">Profit</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {items.map((b, i) => {
                                                const lines = getLines(b);
                                                const games = getGames(b);
                                                const profit = calcProfit(b);
                                                const mult = b.potentialMultiplier != null ? Number(b.potentialMultiplier).toFixed(2) + '×' : '—';
                                                const val = b.value != null ? `$${Number(b.value).toFixed(2)}` : '—';
                                                const amt = b.amount != null ? Number(b.amount) : 0;
                                                const cur = (b.currency || '').toLowerCase();
                                                const isCr = cryptos.has(cur);
                                                const stakeStr = isCr ? amt.toFixed(8).replace(/\.?0+$/, '') : amt.toFixed(2);
                                                return (
                                                  <tr key={b.id || i} className="border-t border-gray-100/80 dark:border-white/[0.06] align-top">
                                                    <td className="py-1.5 pl-1 text-gray-500 dark:text-white/50 whitespace-nowrap">{fmtDate(b.createdAt)}</td>
                                                    <td className="py-1.5 text-gray-700 dark:text-white/75 font-mono">{val}</td>
                                                    <td className="py-1.5 text-gray-700 dark:text-white/75 font-mono">{mult}</td>
                                                    <td className="py-1.5">
                                                      <span className="cursor-help"
                                                        onMouseEnter={(e) => {
                                                          if (lines.length === 0) return;
                                                          const rect = e.currentTarget.getBoundingClientRect();
                                                          setLegsTooltip({ lines, games, x: rect.left, y: rect.bottom + 4, anchorRight: rect.left > window.innerWidth / 2, anchorUp: rect.bottom > window.innerHeight - 220 , anchorY: rect.top });
                                                        }}
                                                        onMouseLeave={() => setLegsTooltip(null)}>
                                                        <span className="text-indigo-500 dark:text-indigo-400 font-medium">{lines.length}</span>
                                                      </span>
                                                    </td>
                                                    <td className="py-1.5">
                                                      {b.customBet ? (
                                                        <span className="px-1 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">Yes</span>
                                                      ) : (
                                                        <span className="text-gray-500 dark:text-white/35 text-[10px]">No</span>
                                                      )}
                                                    </td>
                                                    <td className="py-1.5">
                                                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap ${statusCls(b.status)}`}>{b.status || '—'}</span>
                                                    </td>
                                                    <td className="py-1.5">
                                                      <div className="flex items-center gap-0.5 text-gray-700 dark:text-white/75 font-mono">
                                                        {isCr && <CurIcon currency={cur} />}
                                                        <span>{stakeStr}</span>
                                                      </div>
                                                    </td>
                                                    <td className={`py-1.5 font-mono ${profit.val > 0 ? 'text-emerald-600 dark:text-emerald-400' : profit.val < 0 ? 'text-red-500 dark:text-red-400' : 'text-gray-500 dark:text-white/35'}`}>
                                                      {profit.label}
                                                    </td>
                                                  </tr>
                                                );
                                              })}
                                            </tbody>
                                          </table>
                                        </div>
                                        <div className="flex items-center justify-between mt-2 text-[11px]">
                                          <span className="text-gray-500 dark:text-white/35">Page {page + 1}</span>
                                          <div className="flex items-center gap-2">
                                            <button disabled={page === 0} onClick={() => fetchFn(userId, page - 1)}
                                              className={`px-2 py-0.5 rounded ${page === 0 ? 'text-gray-400 dark:text-white/10 cursor-not-allowed' : 'text-indigo-500 dark:text-indigo-400 hover:underline'}`}>Previous</button>
                                            <button disabled={!hasMore} onClick={() => fetchFn(userId, page + 1)}
                                              className={`px-2 py-0.5 rounded ${!hasMore ? 'text-gray-400 dark:text-white/10 cursor-not-allowed' : 'text-indigo-500 dark:text-indigo-400 hover:underline'}`}>Next</button>
                                          </div>
                                        </div>
                                      </>
                                    );
                                  };

                                  return (
                                    <div>
                                      {/* Mini navbar */}
                                      <div className="flex items-center gap-0.5 border-b border-gray-100 dark:border-white/[0.06] mb-3">
                                        {swishSubTabs.map(t => (
                                          <button key={t.id} onClick={() => {
                                            setSwishTab(t.id);
                                            if (t.id === 'bets' && swishBetsFilter === 'active' && swishActive.length === 0 && !swishActiveLoading && userId) fetchSwishActive(userId, 0);
                                            if (t.id === 'bets' && swishBetsFilter === 'resolved' && swishResolved.length === 0 && !swishResolvedLoading && userId) fetchSwishResolved(userId, 0);
                                            if (t.id === 'overall' && swishOverall === null && !swishOverallLoading && userId) fetchSwishOverall(userId);
                                          }}
                                            className={`px-3 py-2 text-[12px] font-medium border-b-2 transition-colors ${
                                              swishTab === t.id ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 dark:text-white/45 hover:text-gray-600 dark:hover:text-white/40'
                                            }`}>{t.label}</button>
                                        ))}
                                      </div>

                                      {/* ── Bets ── */}
                                      {swishTab === 'bets' && (
                                        <div>
                                          <div className="flex items-center gap-2 mb-2">
                                            <span className="text-[12px] text-gray-500 dark:text-white/45 uppercase tracking-wide">Filter:</span>
                                            <select value={swishBetsFilter} onChange={(e) => {
                                              const v = e.target.value;
                                              setSwishBetsFilter(v);
                                              if (v === 'active' && swishActive.length === 0 && !swishActiveLoading && userId) fetchSwishActive(userId, 0);
                                              if (v === 'resolved' && swishResolved.length === 0 && !swishResolvedLoading && userId) fetchSwishResolved(userId, 0);
                                            }}
                                              className="text-[11px] bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-white/65 rounded px-1.5 py-0.5 border-0 outline-none [&>option]:bg-white [&>option]:dark:bg-[#1a1a1a] [&>option]:dark:text-white/75">
                                              <option value="active">Active</option>
                                              <option value="resolved">Resolved</option>
                                            </select>
                                          </div>
                                          {swishBetsFilter === 'active' && renderSwishBetTable(swishActive, swishActiveLoading, swishActivePage, swishActiveHasMore, fetchSwishActive)}
                                          {swishBetsFilter === 'resolved' && renderSwishBetTable(swishResolved, swishResolvedLoading, swishResolvedPage, swishResolvedHasMore, fetchSwishResolved)}
                                        </div>
                                      )}

                                      {/* ── Overall ── */}
                                      {swishTab === 'overall' && (() => {
                                        if (swishOverallLoading) return <AcpSkeleton />;
                                        if (!swishOverall || swishOverall.length === 0) return <span className="text-[13px] text-gray-500 dark:text-white/55 italic">No statistics</span>;

                                        // Aggregate totals
                                        const totals = swishOverall.reduce((acc, s) => ({
                                          bets: acc.bets + (s.bets || 0),
                                          wins: acc.wins + (s.wins || 0),
                                          losses: acc.losses + (s.losses || 0),
                                          betValue: acc.betValue + (s.betValue || 0),
                                          profitValue: acc.profitValue + (s.profitValue || 0),
                                        }), { bets: 0, wins: 0, losses: 0, betValue: 0, profitValue: 0 });

                                        return (
                                          <div>
                                            {/* Summary cards */}
                                            <div className="grid grid-cols-5 gap-2 mb-4">
                                              {[
                                                { label: 'Wagered (USD)', value: `$${totals.betValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
                                                { label: 'Bets', value: totals.bets.toLocaleString() },
                                                { label: 'Wins', value: totals.wins.toLocaleString(), cls: 'text-emerald-600 dark:text-emerald-400' },
                                                { label: 'Losses', value: totals.losses.toLocaleString(), cls: 'text-red-500 dark:text-red-400' },
                                                { label: 'Profit (USD)', value: `${totals.profitValue >= 0 ? '' : '-'}$${Math.abs(totals.profitValue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, cls: totals.profitValue >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400' },
                                              ].map((c, i) => (
                                                <div key={i} className="rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.04] p-2 text-center">
                                                  <div className="text-[10px] text-gray-500 dark:text-white/45 uppercase tracking-wider mb-1">{c.label}</div>
                                                  <div className={`text-[12px] font-semibold ${c.cls || 'text-gray-700 dark:text-white/75'}`}>{c.value}</div>
                                                </div>
                                              ))}
                                            </div>

                                            {/* Per-game breakdown */}
                                            <div className="max-h-[300px] overflow-y-auto">
                                              <table className="w-full text-[13px]">
                                                <thead className="sticky top-0 bg-white dark:bg-[#0a0a0a] z-[1]">
                                                  <tr className="text-[12px] text-gray-500 dark:text-white/45 uppercase tracking-wide">
                                                    <th className="text-left pb-2 pl-1 font-medium">Game</th>
                                                    <th className="text-left pb-2 font-medium">Currency</th>
                                                    <th className="text-right pb-2 font-medium">Wagered</th>
                                                    <th className="text-right pb-2 font-medium">Bets</th>
                                                    <th className="text-right pb-2 font-medium">W/L</th>
                                                    <th className="text-right pb-2 font-medium">Profit</th>
                                                    <th className="text-right pb-2 pr-1 font-medium">Profit $</th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {swishOverall.map((s, i) => {
                                                    const isCr = cryptos.has((s.currency || '').toLowerCase());
                                                    const wagered = s.betAmount != null ? Number(s.betAmount) : 0;
                                                    const profit = s.profitAmount != null ? Number(s.profitAmount) : 0;
                                                    const profitUsd = s.profitValue != null ? Number(s.profitValue) : 0;
                                                    return (
                                                      <tr key={i} className="border-t border-gray-100/80 dark:border-white/[0.06] align-top">
                                                        <td className="py-1.5 pl-1 text-gray-700 dark:text-white/75 max-w-[120px] truncate">{s.game || '—'}</td>
                                                        <td className="py-1.5">
                                                          <div className="flex items-center gap-0.5 text-gray-600 dark:text-white/65 uppercase text-[11px]">
                                                            {isCr && <CurIcon currency={s.currency} />}
                                                            <span>{s.currency || '—'}</span>
                                                          </div>
                                                        </td>
                                                        <td className="py-1.5 text-right text-gray-700 dark:text-white/75 font-mono">{isCr ? wagered.toFixed(8).replace(/\.?0+$/, '') : wagered.toFixed(2)}</td>
                                                        <td className="py-1.5 text-right text-gray-600 dark:text-white/65">{s.bets || 0}</td>
                                                        <td className="py-1.5 text-right">
                                                          <span className="text-emerald-600 dark:text-emerald-400">{s.wins || 0}</span>
                                                          <span className="text-gray-400 dark:text-white/10 mx-0.5">/</span>
                                                          <span className="text-red-500 dark:text-red-400">{s.losses || 0}</span>
                                                        </td>
                                                        <td className={`py-1.5 text-right font-mono ${profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                                                          {isCr ? (profit >= 0 ? '' : '-') + Math.abs(profit).toFixed(8).replace(/\.?0+$/, '') : profit.toFixed(2)}
                                                        </td>
                                                        <td className={`py-1.5 text-right pr-1 font-mono ${profitUsd >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                                                          {profitUsd >= 0 ? '' : '-'}${Math.abs(profitUsd).toFixed(2)}
                                                        </td>
                                                      </tr>
                                                    );
                                                  })}
                                                </tbody>
                                              </table>
                                            </div>
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  );
                                })() : sectionId === 'tags' ? (() => {
                                  const tags = acpData?.data?.user?.tags || [];
                                  if (tags.length === 0) return <span className="text-[13px] text-gray-500 dark:text-white/55 italic">No tags</span>;
                                  return (
                                    <table className="w-full text-[13px]">
                                      <thead>
                                        <tr className="text-[12px] text-gray-500 dark:text-white/45 uppercase tracking-wide">
                                          <th className="text-left pb-2 pl-1 font-medium">Name</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {tags.map((t, i) => (
                                          <tr key={t.id || i} className="border-t border-gray-100/80 dark:border-white/[0.06]">
                                            <td className="py-1.5 pl-1 text-gray-700 dark:text-white/75">{t.name || '—'}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  );
                                })() : sectionId === 'transactions' ? (() => {
                                  const userId = acpData?.data?.user?.id;
                                  const cryptos = new Set(['btc','eth','ltc','sol','doge','bch','xrp','trx','eos','bnb','usdt','usdc','busd','matic','ada','dot','shib','avax','link','uni','dai','aave','comp','mkr','snx','yfi','sushi','crv','bat','zrx','enj','mana','sand','gala','axs','ftm','near','atom','algo','xlm','vet','hbar','icp','fil','theta','egld','flow','kda','kas','apt','arb','op','sui','sei','ton','tia','jup','wld','pyth','bonk','pepe','floki','wif','render','fet','ocean','grt']);
                                  const fmtDate = (ts) => { if (!ts) return '—'; const d = new Date(/^\d+$/.test(String(ts)) ? Number(ts) : ts); return isNaN(d) ? '—' : d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, month: 'numeric', day: 'numeric', year: 'numeric' }); };
                                  const fiatSymbols = { usd:'$', eur:'€', gbp:'£', jpy:'¥', cny:'¥', krw:'₩', inr:'₹', brl:'R$', try:'₺', cad:'CA$', aud:'A$', mxn:'MX$', php:'₱', pln:'zł', czk:'Kč' };

                                  const CurIcon = ({ currency }) => {
                                    const cur = (currency || '').toLowerCase();
                                    if (!cryptos.has(cur)) return null;
                                    return (
                                      <>
                                        <img src={`https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/32/color/${cur}.png`}
                                          alt={cur} className="w-3.5 h-3.5 inline-block mr-0.5 align-middle shrink-0"
                                          onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
                                        <span className="w-3.5 h-3.5 rounded-full bg-gray-200 dark:bg-white/10 items-center justify-center text-[6px] font-bold text-gray-500 dark:text-white/55 hidden shrink-0 inline-flex mr-0.5 align-middle">{cur.slice(0,2).toUpperCase()}</span>
                                      </>
                                    );
                                  };

                                  const fmtAmt = (amount, currency) => {
                                    const cur = (currency || '').toLowerCase();
                                    const val = amount != null ? Number(amount) : 0;
                                    if (cryptos.has(cur)) return val.toFixed(8).replace(/\.?0+$/, '');
                                    const sym = fiatSymbols[cur] || cur.toUpperCase() + ' ';
                                    return sym + val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                  };

                                  const statusCls = (s) => {
                                    const st = (s || '').toLowerCase();
                                    if (st === 'confirmed' || st === 'successful' || st === 'success') return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400';
                                    if (st === 'pending' || st === 'processing') return 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400';
                                    return 'bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400';
                                  };

                                  // Explorer URL for crypto tx
                                  const explorerUrl = (hash, chain) => {
                                    if (!hash) return null;
                                    const c = (chain || '').toLowerCase();
                                    if (c === 'trx' || c === 'tron') return `https://tronscan.org/#/transaction/${hash}`;
                                    if (c === 'eth' || c === 'ethereum' || c === 'erc20') return `https://etherscan.io/tx/${hash}`;
                                    if (c === 'btc' || c === 'bitcoin') return `https://mempool.space/tx/${hash}`;
                                    if (c === 'bsc' || c === 'bnb') return `https://bscscan.com/tx/${hash}`;
                                    if (c === 'sol' || c === 'solana') return `https://solscan.io/tx/${hash}`;
                                    if (c === 'ltc' || c === 'litecoin') return `https://blockchair.com/litecoin/transaction/${hash}`;
                                    if (c === 'doge' || c === 'dogecoin') return `https://blockchair.com/dogecoin/transaction/${hash}`;
                                    if (c === 'matic' || c === 'polygon') return `https://polygonscan.com/tx/${hash}`;
                                    if (c === 'avax' || c === 'avalanche') return `https://snowtrace.io/tx/${hash}`;
                                    if (c === 'xrp' || c === 'ripple') return `https://xrpscan.com/tx/${hash}`;
                                    return null;
                                  };

                                  // Expiry label
                                  const expiryLabel = (expiresAt) => {
                                    if (!expiresAt) return null;
                                    const exp = new Date(expiresAt);
                                    const now = new Date();
                                    const diffMs = exp - now;
                                    const absDays = Math.abs(Math.round(diffMs / 86400000));
                                    if (diffMs > 0) {
                                      if (absDays < 7) return `Expires in ${absDays} day${absDays !== 1 ? 's' : ''}`;
                                      const weeks = Math.round(absDays / 7);
                                      return `Expires in ${weeks} week${weeks !== 1 ? 's' : ''}`;
                                    }
                                    if (absDays < 7) return `Expires ${absDays} day${absDays !== 1 ? 's' : ''} ago`;
                                    const weeks = Math.round(absDays / 7);
                                    return `Expires ${weeks} week${weeks !== 1 ? 's' : ''} ago`;
                                  };

                                  // Check/X icon
                                  const BoolIcon = ({ val }) => val ? (
                                    <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-emerald-50 dark:bg-emerald-500/10"><Check className="w-3 h-3 text-emerald-500 dark:text-emerald-400" /></span>
                                  ) : (
                                    <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-red-50 dark:bg-red-500/10"><X className="w-3 h-3 text-red-400 dark:text-red-400" /></span>
                                  );

                                  // Pagination component
                                  const Pager = ({ page, hasMore, onPrev, onNext }) => (
                                    <div className="flex items-center justify-between mt-2 text-[11px]">
                                      <span className="text-gray-500 dark:text-white/35">Page {page + 1}</span>
                                      <div className="flex items-center gap-2">
                                        <button disabled={page === 0} onClick={onPrev}
                                          className={`px-2 py-0.5 rounded ${page === 0 ? 'text-gray-400 dark:text-white/10 cursor-not-allowed' : 'text-indigo-500 dark:text-indigo-400 hover:underline'}`}>Previous</button>
                                        <button disabled={!hasMore} onClick={onNext}
                                          className={`px-2 py-0.5 rounded ${!hasMore ? 'text-gray-400 dark:text-white/10 cursor-not-allowed' : 'text-indigo-500 dark:text-indigo-400 hover:underline'}`}>Next</button>
                                      </div>
                                    </div>
                                  );

                                  const txSubTabs = [
                                    { id: 'coupons', label: 'Coupons' },
                                    { id: 'optimove', label: 'Optimove' },
                                    { id: 'crypto-dep', label: 'Crypto Deposits' },
                                    { id: 'crypto-wd', label: 'Crypto Withdrawals' },
                                    { id: 'fiat-dep', label: 'Fiat Deposits' },
                                    { id: 'fiat-wd', label: 'Fiat Withdrawals' },
                                    { id: 'other', label: 'Other' },
                                  ];

                                  // Auto-fetch coupons on first render
                                  if (txTab === 'coupons' && txCoupons.length === 0 && !txCouponsLoading && userId) {
                                    setTimeout(() => fetchTxCoupons(userId, 0, txCouponsFilter), 0);
                                  }

                                  return (
                                    <div>
                                      {/* Mini navbar */}
                                      <div className="flex items-center gap-0.5 border-b border-gray-100 dark:border-white/[0.06] mb-3 flex-wrap">
                                        {txSubTabs.map(t => (
                                          <button key={t.id} onClick={() => {
                                            setTxTab(t.id);
                                            if (t.id === 'coupons' && txCoupons.length === 0 && !txCouponsLoading && userId) fetchTxCoupons(userId, 0, txCouponsFilter);
                                            if (t.id === 'optimove' && txOptimove.length === 0 && !txOptimoveLoading && userId) fetchTxOptimove(userId, 0, txOptimoveFilter);
                                            if (t.id === 'crypto-dep' && txCryptoDep.length === 0 && !txCryptoDepLoading && userId) fetchTxCryptoDep(userId, 0);
                                            if (t.id === 'crypto-wd' && txCryptoWd.length === 0 && !txCryptoWdLoading && userId) fetchTxCryptoWd(userId, 0);
                                            if (t.id === 'fiat-dep' && txFiatDep.length === 0 && !txFiatDepLoading && userId) fetchTxFiatDep(userId, 0, txFiatDepSort);
                                            if (t.id === 'fiat-wd' && txFiatWd.length === 0 && !txFiatWdLoading && userId) fetchTxFiatWd(userId, 0, txFiatWdSort);
                                            if (t.id === 'other' && txOther.length === 0 && !txOtherLoading && userId) fetchTxOther(userId, 0, txOtherFilter);
                                          }}
                                            className={`px-2 py-1.5 text-[11px] font-medium border-b-2 transition-colors whitespace-nowrap ${
                                              txTab === t.id ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 dark:text-white/45 hover:text-gray-600 dark:hover:text-white/40'
                                            }`}>{t.label}</button>
                                        ))}
                                      </div>

                                      {/* ── Coupons ── */}
                                      {txTab === 'coupons' && (() => {
                                        const items = txCoupons[0] === '__empty__' ? [] : txCoupons;
                                        return (
                                          <div>
                                            <div className="flex items-center gap-2 mb-2">
                                              <span className="text-[12px] text-gray-500 dark:text-white/45 uppercase tracking-wide">Filter:</span>
                                              <select value={txCouponsFilter} onChange={(e) => { const v = e.target.value; setTxCouponsFilter(v); setTxCouponsPage(0); setTxCoupons([]); if (userId) fetchTxCoupons(userId, 0, v); }}
                                                className="text-[11px] bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-white/65 rounded px-1.5 py-0.5 border-0 outline-none [&>option]:bg-white [&>option]:dark:bg-[#1a1a1a] [&>option]:dark:text-white/75">
                                                <option value="all">All</option>
                                                <option value="redeemable">Redeemable</option>
                                                <option value="redeemed">Redeemed</option>
                                                <option value="expired">Expired</option>
                                              </select>
                                            </div>
                                            {txCouponsLoading ? (
                                              <AcpSkeleton />
                                            ) : items.length === 0 ? (
                                              <span className="text-[13px] text-gray-500 dark:text-white/55 italic">No coupons</span>
                                            ) : (
                                              <>
                                                <div className="max-h-[400px] overflow-y-auto">
                                                  <table className="w-full text-[13px]">
                                                    <thead className="sticky top-0 bg-white dark:bg-[#0a0a0a] z-[1]">
                                                      <tr className="text-[12px] text-gray-500 dark:text-white/45 uppercase tracking-wide">
                                                        <th className="text-left pb-2 pl-1 font-medium">Code</th>
                                                        <th className="text-left pb-2 font-medium">Note</th>
                                                        <th className="text-right pb-2 font-medium">Amount</th>
                                                        <th className="text-right pb-2 font-medium">Value</th>
                                                        <th className="text-center pb-2 font-medium">Active</th>
                                                        <th className="text-center pb-2 font-medium">Redeemed</th>
                                                        <th className="text-left pb-2 font-medium">Expires</th>
                                                        <th className="text-left pb-2 font-medium">Claimed</th>
                                                      </tr>
                                                    </thead>
                                                    <tbody>
                                                      {items.map((c, i) => {
                                                        const bc = c.bonusCode || {};
                                                        const cur = (c.currency || '').toLowerCase();
                                                        const isCr = cryptos.has(cur);
                                                        return (
                                                          <tr key={bc.id || i} className="border-t border-gray-100/80 dark:border-white/[0.06] align-top">
                                                            <td className="py-1.5 pl-1 text-gray-700 dark:text-white/75 font-mono text-[12px] max-w-[120px] break-all">{bc.code || '—'}</td>
                                                            <td className="py-1.5 text-gray-500 dark:text-white/50 max-w-[140px] truncate text-[11px]">{bc.note || '—'}</td>
                                                            <td className="py-1.5 text-right">
                                                              <div className="flex items-center justify-end gap-0.5 text-gray-700 dark:text-white/75 font-mono">
                                                                {isCr && <CurIcon currency={cur} />}
                                                                <span>{fmtAmt(c.amount, c.currency)}</span>
                                                              </div>
                                                            </td>
                                                            <td className="py-1.5 text-right text-gray-500 dark:text-white/50 font-mono">${c.value != null ? Number(c.value).toFixed(2) : '0.00'}</td>
                                                            <td className="py-1.5 text-center"><BoolIcon val={bc.active} /></td>
                                                            <td className="py-1.5 text-center"><BoolIcon val={c.redeemed} /></td>
                                                            <td className="py-1.5 text-gray-500 dark:text-white/50 whitespace-nowrap">
                                                              <div>{fmtDate(bc.expiresAt)}</div>
                                                              {bc.expiresAt && <div className="text-[8px] text-gray-500 dark:text-white/30">({expiryLabel(bc.expiresAt)})</div>}
                                                            </td>
                                                            <td className="py-1.5 text-gray-500 dark:text-white/50 whitespace-nowrap">{c.claimedAt ? fmtDate(c.claimedAt) : 'N/A'}</td>
                                                          </tr>
                                                        );
                                                      })}
                                                    </tbody>
                                                  </table>
                                                </div>
                                                <Pager page={txCouponsPage} hasMore={txCouponsHasMore} onPrev={() => fetchTxCoupons(userId, txCouponsPage - 1, txCouponsFilter)} onNext={() => fetchTxCoupons(userId, txCouponsPage + 1, txCouponsFilter)} />
                                              </>
                                            )}
                                          </div>
                                        );
                                      })()}

                                      {/* ── Optimove ── */}
                                      {txTab === 'optimove' && (() => {
                                        const items = txOptimove[0] === '__empty__' ? [] : txOptimove;
                                        return (
                                          <div>
                                            <div className="flex items-center gap-2 mb-2">
                                              <span className="text-[12px] text-gray-500 dark:text-white/45 uppercase tracking-wide">Filter:</span>
                                              <select value={txOptimoveFilter} onChange={(e) => { const v = e.target.value; setTxOptimoveFilter(v); setTxOptimovePage(0); setTxOptimove([]); if (userId) fetchTxOptimove(userId, 0, v); }}
                                                className="text-[11px] bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-white/65 rounded px-1.5 py-0.5 border-0 outline-none [&>option]:bg-white [&>option]:dark:bg-[#1a1a1a] [&>option]:dark:text-white/75">
                                                <option value="unclaimed">Unclaimed</option>
                                                <option value="claimed">Claimed</option>
                                              </select>
                                            </div>
                                            {txOptimoveLoading ? (
                                              <AcpSkeleton />
                                            ) : items.length === 0 ? (
                                              <span className="text-[13px] text-gray-500 dark:text-white/55 italic">No promos</span>
                                            ) : (
                                              <>
                                                <div className="max-h-[400px] overflow-y-auto">
                                                  <table className="w-full text-[13px]">
                                                    <thead className="sticky top-0 bg-white dark:bg-[#0a0a0a] z-[1]">
                                                      <tr className="text-[12px] text-gray-500 dark:text-white/45 uppercase tracking-wide">
                                                        <th className="text-left pb-2 pl-1 font-medium">Code</th>
                                                        <th className="text-left pb-2 font-medium">Type</th>
                                                        <th className="text-right pb-2 font-medium">Amount</th>
                                                        <th className="text-right pb-2 font-medium">Value</th>
                                                        <th className="text-center pb-2 font-medium">Active</th>
                                                        <th className="text-center pb-2 font-medium">Redeemed</th>
                                                        <th className="text-left pb-2 font-medium">Expires</th>
                                                        <th className="text-left pb-2 font-medium">Sent</th>
                                                        <th className="text-left pb-2 font-medium">Claimed</th>
                                                      </tr>
                                                    </thead>
                                                    <tbody>
                                                      {items.map((p, i) => {
                                                        const promo = p.promo || {};
                                                        const d = p.data || {};
                                                        const cur = (d.currency || '').toLowerCase();
                                                        const isCr = cryptos.has(cur);
                                                        const amt = d.amount != null ? d.amount : null;
                                                        const val = d.value != null ? d.value : null;
                                                        return (
                                                          <tr key={p.id || i} className="border-t border-gray-100/80 dark:border-white/[0.06] align-top">
                                                            <td className="py-1.5 pl-1 text-gray-700 dark:text-white/75 font-mono text-[12px] max-w-[120px] break-all">{promo.code || '—'}</td>
                                                            <td className="py-1.5 text-gray-600 dark:text-white/65 capitalize text-[11px]">{promo.type || '—'}</td>
                                                            <td className="py-1.5 text-right">
                                                              {amt != null ? (
                                                                <div className="flex items-center justify-end gap-0.5 text-gray-700 dark:text-white/75 font-mono">
                                                                  {isCr && <CurIcon currency={cur} />}
                                                                  <span>{fmtAmt(amt, d.currency)}</span>
                                                                </div>
                                                              ) : '—'}
                                                            </td>
                                                            <td className="py-1.5 text-right text-gray-500 dark:text-white/50 font-mono">{val != null ? `$${Number(val).toFixed(2)}` : '—'}</td>
                                                            <td className="py-1.5 text-center"><BoolIcon val={promo.active} /></td>
                                                            <td className="py-1.5 text-center"><BoolIcon val={!!p.claimedAt} /></td>
                                                            <td className="py-1.5 text-gray-500 dark:text-white/50 whitespace-nowrap">
                                                              <div>{fmtDate(p.expireAt)}</div>
                                                              {p.expireAt && <div className="text-[8px] text-gray-500 dark:text-white/30">({expiryLabel(p.expireAt)})</div>}
                                                            </td>
                                                            <td className="py-1.5 text-gray-500 dark:text-white/50 whitespace-nowrap">{fmtDate(p.createdAt)}</td>
                                                            <td className="py-1.5 text-gray-500 dark:text-white/50 whitespace-nowrap">{p.claimedAt ? fmtDate(p.claimedAt) : 'N/A'}</td>
                                                          </tr>
                                                        );
                                                      })}
                                                    </tbody>
                                                  </table>
                                                </div>
                                                <Pager page={txOptimovePage} hasMore={txOptimoveHasMore} onPrev={() => fetchTxOptimove(userId, txOptimovePage - 1, txOptimoveFilter)} onNext={() => fetchTxOptimove(userId, txOptimovePage + 1, txOptimoveFilter)} />
                                              </>
                                            )}
                                          </div>
                                        );
                                      })()}

                                      {/* ── Crypto Deposits ── */}
                                      {txTab === 'crypto-dep' && (() => {
                                        const items = txCryptoDep[0] === '__empty__' ? [] : txCryptoDep;
                                        return (
                                          <div>
                                            {txCryptoDepLoading ? (
                                              <AcpSkeleton />
                                            ) : items.length === 0 ? (
                                              <span className="text-[13px] text-gray-500 dark:text-white/55 italic">No deposits</span>
                                            ) : (
                                              <>
                                                <div className="max-h-[400px] overflow-y-auto">
                                                  <table className="w-full text-[13px]">
                                                    <thead className="sticky top-0 bg-white dark:bg-[#0a0a0a] z-[1]">
                                                      <tr className="text-[12px] text-gray-500 dark:text-white/45 uppercase tracking-wide">
                                                        <th className="text-left pb-2 pl-1 font-medium">TxId</th>
                                                        <th className="text-left pb-2 font-medium">Address</th>
                                                        <th className="text-right pb-2 font-medium">Amount</th>
                                                        <th className="text-right pb-2 font-medium">Value</th>
                                                        <th className="text-left pb-2 font-medium">Chain</th>
                                                        <th className="text-left pb-2 font-medium">Status</th>
                                                        <th className="text-left pb-2 font-medium">Provider</th>
                                                        <th className="text-left pb-2 font-medium">Created</th>
                                                      </tr>
                                                    </thead>
                                                    <tbody>
                                                      {items.map((d, i) => {
                                                        const cur = (d.currency || '').toLowerCase();
                                                        const isCr = cryptos.has(cur);
                                                        const txUrl = explorerUrl(d.hash, d.chain || d.currency);
                                                        return (
                                                          <tr key={d.id || i} className="border-t border-gray-100/80 dark:border-white/[0.06] align-top">
                                                            <td className="py-1.5 pl-1">
                                                              {txUrl ? (
                                                                <a href={txUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-500 dark:text-indigo-400 hover:underline text-[11px]">View</a>
                                                              ) : <span className="text-gray-500 dark:text-white/35 text-[11px]">—</span>}
                                                            </td>
                                                            <td className="py-1.5 text-gray-500 dark:text-white/50 font-mono text-[10px] max-w-[100px] truncate">{d.address?.address || '—'}</td>
                                                            <td className="py-1.5 text-right">
                                                              <div className="flex items-center justify-end gap-0.5 text-gray-700 dark:text-white/75 font-mono">
                                                                {isCr && <CurIcon currency={cur} />}
                                                                <span>{fmtAmt(d.amount, d.currency)}</span>
                                                              </div>
                                                            </td>
                                                            <td className="py-1.5 text-right text-gray-500 dark:text-white/50 font-mono">${d.value != null ? Number(d.value).toFixed(2) : '0.00'}</td>
                                                            <td className="py-1.5 text-gray-600 dark:text-white/65 uppercase text-[11px]">{d.chain || '—'}</td>
                                                            <td className="py-1.5"><span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${statusCls(d.status)}`}>{d.status || '—'}</span></td>
                                                            <td className="py-1.5 text-gray-500 dark:text-white/50 text-[11px] max-w-[80px] truncate">{d.depositPaymentProvider || '—'}</td>
                                                            <td className="py-1.5 text-gray-500 dark:text-white/50 whitespace-nowrap">{fmtDate(d.createdAt)}</td>
                                                          </tr>
                                                        );
                                                      })}
                                                    </tbody>
                                                  </table>
                                                </div>
                                                <Pager page={txCryptoDepPage} hasMore={txCryptoDepHasMore} onPrev={() => fetchTxCryptoDep(userId, txCryptoDepPage - 1)} onNext={() => fetchTxCryptoDep(userId, txCryptoDepPage + 1)} />
                                              </>
                                            )}
                                          </div>
                                        );
                                      })()}

                                      {/* ── Crypto Withdrawals ── */}
                                      {txTab === 'crypto-wd' && (() => {
                                        const items = txCryptoWd[0] === '__empty__' ? [] : txCryptoWd;
                                        return (
                                          <div>
                                            {txCryptoWdLoading ? (
                                              <AcpSkeleton />
                                            ) : items.length === 0 ? (
                                              <span className="text-[13px] text-gray-500 dark:text-white/55 italic">No withdrawals</span>
                                            ) : (
                                              <>
                                                <div className="max-h-[400px] overflow-y-auto">
                                                  <table className="w-full text-[13px]">
                                                    <thead className="sticky top-0 bg-white dark:bg-[#0a0a0a] z-[1]">
                                                      <tr className="text-[12px] text-gray-500 dark:text-white/45 uppercase tracking-wide">
                                                        <th className="text-left pb-2 pl-1 font-medium">TxId</th>
                                                        <th className="text-left pb-2 font-medium">Address</th>
                                                        <th className="text-right pb-2 font-medium">Amount</th>
                                                        <th className="text-right pb-2 font-medium">Value</th>
                                                        <th className="text-left pb-2 font-medium">Chain</th>
                                                        <th className="text-left pb-2 font-medium">Status</th>
                                                        <th className="text-left pb-2 font-medium">IP</th>
                                                        <th className="text-right pb-2 font-medium">Fee</th>
                                                        <th className="text-left pb-2 font-medium">Created</th>
                                                      </tr>
                                                    </thead>
                                                    <tbody>
                                                      {items.map((w, i) => {
                                                        const cur = (w.currency || '').toLowerCase();
                                                        const isCr = cryptos.has(cur);
                                                        const txUrl = explorerUrl(w.hash, w.chain || w.currency);
                                                        return (
                                                          <tr key={w.id || i} className="border-t border-gray-100/80 dark:border-white/[0.06] align-top">
                                                            <td className="py-1.5 pl-1">
                                                              {txUrl ? (
                                                                <a href={txUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-500 dark:text-indigo-400 hover:underline text-[11px]">View</a>
                                                              ) : <span className="text-gray-500 dark:text-white/35 text-[11px]">—</span>}
                                                            </td>
                                                            <td className="py-1.5 text-gray-500 dark:text-white/50 font-mono text-[10px] max-w-[100px] truncate">{w.address || '—'}</td>
                                                            <td className="py-1.5 text-right">
                                                              <div className="flex items-center justify-end gap-0.5 text-gray-700 dark:text-white/75 font-mono">
                                                                {isCr && <CurIcon currency={cur} />}
                                                                <span>{fmtAmt(w.amount, w.currency)}</span>
                                                              </div>
                                                            </td>
                                                            <td className="py-1.5 text-right text-gray-500 dark:text-white/50 font-mono">${w.value != null ? Number(w.value).toFixed(2) : '0.00'}</td>
                                                            <td className="py-1.5 text-gray-600 dark:text-white/65 uppercase text-[11px]">{w.chain || '—'}</td>
                                                            <td className="py-1.5"><span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${statusCls(w.status)}`}>{w.status || '—'}</span></td>
                                                            <td className="py-1.5 text-gray-500 dark:text-white/50 font-mono text-[12px]">{w.ip || '—'}</td>
                                                            <td className="py-1.5 text-right text-gray-500 dark:text-white/50 font-mono">{fmtAmt(w.walletFee, w.currency)}</td>
                                                            <td className="py-1.5 text-gray-500 dark:text-white/50 whitespace-nowrap">{fmtDate(w.createdAt)}</td>
                                                          </tr>
                                                        );
                                                      })}
                                                    </tbody>
                                                  </table>
                                                </div>
                                                <Pager page={txCryptoWdPage} hasMore={txCryptoWdHasMore} onPrev={() => fetchTxCryptoWd(userId, txCryptoWdPage - 1)} onNext={() => fetchTxCryptoWd(userId, txCryptoWdPage + 1)} />
                                              </>
                                            )}
                                          </div>
                                        );
                                      })()}

                                      {/* ── Fiat Deposits ── */}
                                      {txTab === 'fiat-dep' && (() => {
                                        const items = txFiatDep[0] === '__empty__' ? [] : txFiatDep;
                                        return (
                                          <div>
                                            <div className="flex items-center gap-2 mb-2">
                                              <span className="text-[12px] text-gray-500 dark:text-white/45 uppercase tracking-wide">Sort by:</span>
                                              <select value={txFiatDepSort} onChange={(e) => { const v = e.target.value; setTxFiatDepSort(v); setTxFiatDepPage(0); setTxFiatDep([]); if (userId) fetchTxFiatDep(userId, 0, v); }}
                                                className="text-[11px] bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-white/65 rounded px-1.5 py-0.5 border-0 outline-none [&>option]:bg-white [&>option]:dark:bg-[#1a1a1a] [&>option]:dark:text-white/75">
                                                <option value="updatedAt">Last Updated</option>
                                                <option value="createdAt">Creation Time</option>
                                              </select>
                                            </div>
                                            {txFiatDepLoading ? (
                                              <AcpSkeleton />
                                            ) : items.length === 0 ? (
                                              <span className="text-[13px] text-gray-500 dark:text-white/55 italic">No fiat deposits</span>
                                            ) : (
                                              <>
                                                <div className="max-h-[400px] overflow-y-auto">
                                                  <table className="w-full text-[13px]">
                                                    <thead className="sticky top-0 bg-white dark:bg-[#0a0a0a] z-[1]">
                                                      <tr className="text-[12px] text-gray-500 dark:text-white/45 uppercase tracking-wide">
                                                        <th className="text-left pb-2 pl-1 font-medium">Created</th>
                                                        <th className="text-left pb-2 font-medium">Updated</th>
                                                        <th className="text-left pb-2 font-medium">Tx Ref</th>
                                                        <th className="text-right pb-2 font-medium">Amount</th>
                                                        <th className="text-right pb-2 font-medium">Fee</th>
                                                        <th className="text-left pb-2 font-medium">Status</th>
                                                        <th className="text-left pb-2 font-medium">PSP</th>
                                                        <th className="text-left pb-2 font-medium">Service</th>
                                                        <th className="text-right pb-2 font-medium">Pre Bal</th>
                                                        <th className="text-right pb-2 pr-1 font-medium">Post Bal</th>
                                                      </tr>
                                                    </thead>
                                                    <tbody>
                                                      {items.map((tx, i) => {
                                                        const itd = tx.integrationTransactionData || {};
                                                        const cur = (tx.currency || '').toLowerCase();
                                                        const sym = fiatSymbols[cur] || cur.toUpperCase() + ' ';
                                                        return (
                                                          <tr key={tx.id || i} className="border-t border-gray-100/80 dark:border-white/[0.06] align-top">
                                                            <td className="py-1.5 pl-1 text-gray-500 dark:text-white/50 whitespace-nowrap">{fmtDate(tx.createdAt)}</td>
                                                            <td className="py-1.5 text-gray-500 dark:text-white/50 whitespace-nowrap">{fmtDate(tx.updatedAt)}</td>
                                                            <td className="py-1.5 text-gray-500 dark:text-white/50 font-mono text-[10px] max-w-[90px] truncate">{tx.integrationTransactionId || '—'}</td>
                                                            <td className="py-1.5 text-right text-gray-700 dark:text-white/75 font-mono">{sym}{tx.amount != null ? Math.abs(Number(tx.amount)).toFixed(2) : '0.00'}</td>
                                                            <td className="py-1.5 text-right text-gray-500 dark:text-white/50 font-mono">-{sym}{tx.feeAmount != null ? Math.abs(Number(tx.feeAmount)).toFixed(2) : '0.00'}</td>
                                                            <td className="py-1.5"><span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${statusCls(tx.status)}`}>{tx.status || '—'}</span></td>
                                                            <td className="py-1.5 text-gray-500 dark:text-white/50 text-[11px]">{itd.pspService || tx.integrationEnum || '—'}</td>
                                                            <td className="py-1.5 text-gray-500 dark:text-white/50 text-[11px]">{itd.txType || '—'}</td>
                                                            <td className="py-1.5 text-right text-gray-500 dark:text-white/50 font-mono">{itd.preBalanceAmount != null ? `${sym}${Number(itd.preBalanceAmount).toFixed(2)}` : '—'}</td>
                                                            <td className="py-1.5 text-right pr-1 text-gray-700 dark:text-white/75 font-mono">{itd.postBalanceAmount != null ? `${sym}${Number(itd.postBalanceAmount).toFixed(2)}` : '—'}</td>
                                                          </tr>
                                                        );
                                                      })}
                                                    </tbody>
                                                  </table>
                                                </div>
                                                <Pager page={txFiatDepPage} hasMore={txFiatDepHasMore} onPrev={() => fetchTxFiatDep(userId, txFiatDepPage - 1, txFiatDepSort)} onNext={() => fetchTxFiatDep(userId, txFiatDepPage + 1, txFiatDepSort)} />
                                              </>
                                            )}
                                          </div>
                                        );
                                      })()}

                                      {/* ── Fiat Withdrawals ── */}
                                      {txTab === 'fiat-wd' && (() => {
                                        const items = txFiatWd[0] === '__empty__' ? [] : txFiatWd;
                                        return (
                                          <div>
                                            <div className="flex items-center gap-2 mb-2">
                                              <span className="text-[12px] text-gray-500 dark:text-white/45 uppercase tracking-wide">Sort by:</span>
                                              <select value={txFiatWdSort} onChange={(e) => { const v = e.target.value; setTxFiatWdSort(v); setTxFiatWdPage(0); setTxFiatWd([]); if (userId) fetchTxFiatWd(userId, 0, v); }}
                                                className="text-[11px] bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-white/65 rounded px-1.5 py-0.5 border-0 outline-none [&>option]:bg-white [&>option]:dark:bg-[#1a1a1a] [&>option]:dark:text-white/75">
                                                <option value="updatedAt">Last Updated</option>
                                                <option value="createdAt">Creation Time</option>
                                              </select>
                                            </div>
                                            {txFiatWdLoading ? (
                                              <AcpSkeleton />
                                            ) : items.length === 0 ? (
                                              <span className="text-[13px] text-gray-500 dark:text-white/55 italic">No fiat withdrawals</span>
                                            ) : (
                                              <>
                                                <div className="max-h-[400px] overflow-y-auto">
                                                  <table className="w-full text-[13px]">
                                                    <thead className="sticky top-0 bg-white dark:bg-[#0a0a0a] z-[1]">
                                                      <tr className="text-[12px] text-gray-500 dark:text-white/45 uppercase tracking-wide">
                                                        <th className="text-left pb-2 pl-1 font-medium">Created</th>
                                                        <th className="text-left pb-2 font-medium">Updated</th>
                                                        <th className="text-left pb-2 font-medium">Tx Ref</th>
                                                        <th className="text-right pb-2 font-medium">Amount</th>
                                                        <th className="text-right pb-2 font-medium">Fee</th>
                                                        <th className="text-left pb-2 font-medium">Status</th>
                                                        <th className="text-left pb-2 font-medium">PSP</th>
                                                        <th className="text-left pb-2 font-medium">Service</th>
                                                        <th className="text-right pb-2 font-medium">Pre Bal</th>
                                                        <th className="text-right pb-2 pr-1 font-medium">Post Bal</th>
                                                      </tr>
                                                    </thead>
                                                    <tbody>
                                                      {items.map((tx, i) => {
                                                        const itd = tx.integrationTransactionData || {};
                                                        const cur = (tx.currency || '').toLowerCase();
                                                        const sym = fiatSymbols[cur] || cur.toUpperCase() + ' ';
                                                        return (
                                                          <tr key={tx.id || i} className="border-t border-gray-100/80 dark:border-white/[0.06] align-top">
                                                            <td className="py-1.5 pl-1 text-gray-500 dark:text-white/50 whitespace-nowrap">{fmtDate(tx.createdAt)}</td>
                                                            <td className="py-1.5 text-gray-500 dark:text-white/50 whitespace-nowrap">{fmtDate(tx.updatedAt)}</td>
                                                            <td className="py-1.5 text-gray-500 dark:text-white/50 font-mono text-[10px] max-w-[90px] truncate">{tx.integrationTransactionId || '—'}</td>
                                                            <td className="py-1.5 text-right text-gray-700 dark:text-white/75 font-mono">-{sym}{tx.amount != null ? Math.abs(Number(tx.amount)).toFixed(2) : '0.00'}</td>
                                                            <td className="py-1.5 text-right text-gray-500 dark:text-white/50 font-mono">-{sym}{tx.feeAmount != null ? Math.abs(Number(tx.feeAmount)).toFixed(2) : '0.00'}</td>
                                                            <td className="py-1.5"><span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${statusCls(tx.status)}`}>{tx.status || '—'}</span></td>
                                                            <td className="py-1.5 text-gray-500 dark:text-white/50 text-[11px]">{itd.pspService || tx.integrationEnum || '—'}</td>
                                                            <td className="py-1.5 text-gray-500 dark:text-white/50 text-[11px]">{itd.txType || '—'}</td>
                                                            <td className="py-1.5 text-right text-gray-500 dark:text-white/50 font-mono">{itd.preBalanceAmount != null ? `${sym}${Number(itd.preBalanceAmount).toFixed(2)}` : '—'}</td>
                                                            <td className="py-1.5 text-right pr-1 text-gray-700 dark:text-white/75 font-mono">{itd.postBalanceAmount != null ? `${sym}${Number(itd.postBalanceAmount).toFixed(2)}` : '—'}</td>
                                                          </tr>
                                                        );
                                                      })}
                                                    </tbody>
                                                  </table>
                                                </div>
                                                <Pager page={txFiatWdPage} hasMore={txFiatWdHasMore} onPrev={() => fetchTxFiatWd(userId, txFiatWdPage - 1, txFiatWdSort)} onNext={() => fetchTxFiatWd(userId, txFiatWdPage + 1, txFiatWdSort)} />
                                              </>
                                            )}
                                          </div>
                                        );
                                      })()}

                                      {/* ── Other ── */}
                                      {txTab === 'other' && (() => {
                                        const allItems = txOther[0] === '__empty__' ? [] : txOther;
                                        const viewStart = txOtherPage * 50;
                                        const items = allItems.slice(viewStart, viewStart + 50);
                                        const hasNextPage = allItems.length > viewStart + 50;
                                        const otherFilterOptions = [
                                          { value: '', label: 'All' },
                                          { value: 'betAdjustment', label: 'Bet Adjustment' },
                                          { value: 'bonusCode', label: 'Bonus Code' },
                                          { value: 'bonusDrop', label: 'Bonus Drop' },
                                          { value: 'campaignWithdrawal', label: 'Campaign Withdrawal' },
                                          { value: 'challengeClaim', label: 'Challenge Claim' },
                                          { value: 'challengeCreation', label: 'Challenge Creation' },
                                          { value: 'dailyBonusClaim', label: 'Daily Bonus Claim' },
                                          { value: 'depositBonus', label: 'Deposit Bonus' },
                                          { value: 'esportBetAdjustment', label: 'Esport Bet Adjustment' },
                                          { value: 'faucetClaim', label: 'Reload Claim' },
                                          { value: 'holdingBalance', label: 'Holding Balance' },
                                          { value: 'manualBonus', label: 'Manual Bonus' },
                                          { value: 'mixpanelClaim', label: 'Mixpanel Claim' },
                                          { value: 'optimoveClaim', label: 'Optimove Claim' },
                                          { value: 'postcardCodeClaim', label: 'Postcard Code Claim' },
                                          { value: 'racebookBetAdjustment', label: 'Racebook Bet Adjustment' },
                                          { value: 'racePayout', label: 'Race Payout' },
                                          { value: 'rainReceived', label: 'Rain Received' },
                                          { value: 'rainSend', label: 'Rain Send' },
                                          { value: 'rakeback', label: 'Rakeback' },
                                          { value: 'sportBetAdjustment', label: 'Sport Bet Adjustment' },
                                          { value: 'sportsbookPromotionPayout', label: 'Sportsbook Promotion Payout' },
                                          { value: 'sportsbookXMultiBetAdjustment', label: 'Sportsbook X Multi Bet Adjustment' },
                                          { value: 'swapDeposit', label: 'Swap Deposit' },
                                          { value: 'swapWithdrawal', label: 'Swap Withdrawal' },
                                          { value: 'swishBetAdjustment', label: 'Swish Bet Adjustment' },
                                          { value: 'tipReceived', label: 'Tip Received' },
                                          { value: 'tipSend', label: 'Tip Send' },
                                          { value: 'topUpBonusClaim', label: 'Top Up Bonus Claim' },
                                          { value: 'vaultDeposit', label: 'Vault Deposit' },
                                          { value: 'vaultWithdrawal', label: 'Vault Withdrawal' },
                                        ];
                                        return (
                                          <div>
                                            <div className="flex items-center gap-2 mb-2">
                                              <span className="text-[12px] text-gray-500 dark:text-white/45 uppercase tracking-wide">Filter:</span>
                                              <select value={txOtherFilter} onChange={(e) => { const v = e.target.value; setTxOtherFilter(v); setTxOtherPage(0); setTxOther([]); if (userId) fetchTxOther(userId, 0, v); }}
                                                className="text-[11px] bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-white/65 rounded px-1.5 py-0.5 border-0 outline-none [&>option]:bg-white [&>option]:dark:bg-[#1a1a1a] [&>option]:dark:text-white/75">
                                                {otherFilterOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                              </select>
                                            </div>
                                            {txOtherLoading ? (
                                              <AcpSkeleton />
                                            ) : items.length === 0 ? (
                                              <span className="text-[13px] text-gray-500 dark:text-white/55 italic">No transactions</span>
                                            ) : (
                                              <>
                                                <div className="max-h-[400px] overflow-y-auto">
                                                  <table className="w-full text-[13px]">
                                                    <thead className="sticky top-0 bg-white dark:bg-[#0a0a0a] z-[1]">
                                                      <tr className="text-[12px] text-gray-500 dark:text-white/45 uppercase tracking-wide">
                                                        <th className="text-left pb-2 pl-1 font-medium">Date</th>
                                                        <th className="text-right pb-2 font-medium">Amount</th>
                                                        <th className="text-right pb-2 font-medium">Value</th>
                                                        <th className="text-left pb-2 font-medium">Type</th>
                                                        <th className="text-left pb-2 font-medium">Bet ID</th>
                                                        <th className="text-left pb-2 pr-1 font-medium">IP</th>
                                                      </tr>
                                                    </thead>
                                                    <tbody>
                                                      {items.map((tx, i) => {
                                                        const cur = (tx.currency || '').toLowerCase();
                                                        const betId = tx.data?.betId || '';
                                                        return (
                                                          <tr key={tx.id || i} className="border-t border-gray-100/80 dark:border-white/[0.06] align-top">
                                                            <td className="py-1.5 pl-1 text-gray-500 dark:text-white/50 whitespace-nowrap">{fmtDate(tx.createdAt)}</td>
                                                            <td className="py-1.5 text-right text-gray-700 dark:text-white/75 font-mono whitespace-nowrap">
                                                              <CurIcon currency={tx.currency} />
                                                              {fmtAmt(tx.amount, tx.currency)}
                                                            </td>
                                                            <td className="py-1.5 text-right text-gray-500 dark:text-white/50 font-mono">${tx.value != null ? Number(tx.value).toFixed(2) : '0.00'}</td>
                                                            <td className="py-1.5 text-gray-500 dark:text-white/50 text-[11px]">{tx.type || '—'}</td>
                                                            <td className="py-1.5 text-gray-500 dark:text-white/50 font-mono text-[10px] max-w-[90px] truncate">{betId || '—'}</td>
                                                            <td className="py-1.5 pr-1 text-gray-500 dark:text-white/50 font-mono text-[11px]">{tx.ip || '—'}</td>
                                                          </tr>
                                                        );
                                                      })}
                                                    </tbody>
                                                  </table>
                                                </div>
                                                <div className="flex items-center justify-between mt-2 text-[10px]">
                                                  <span className="text-gray-400 dark:text-white/20">Page {txOtherPage + 1}</span>
                                                  <div className="flex items-center gap-2">
                                                    <button disabled={txOtherPage === 0} onClick={() => setTxOtherPage(p => p - 1)}
                                                      className="px-2 py-0.5 rounded bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-white/50 disabled:opacity-30 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">Previous</button>
                                                    <button disabled={!hasNextPage && !txOtherHasMore} onClick={() => {
                                                      if (hasNextPage) {
                                                        setTxOtherPage(p => p + 1);
                                                      } else if (txOtherHasMore && userId) {
                                                        const nextOffset = txOther[0] === '__empty__' ? 0 : txOther.length;
                                                        fetchTxOther(userId, nextOffset, txOtherFilter).then(() => setTxOtherPage(p => p + 1));
                                                      }
                                                    }}
                                                      className="px-2 py-0.5 rounded bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-white/50 disabled:opacity-30 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">Next</button>
                                                  </div>
                                                </div>
                                              </>
                                            )}
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  );
                                })() : (
                                  <span className="text-[13px] text-gray-500 dark:text-white/55 italic">Coming soon</span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}

                    </div>
                  );
                })()
              ) : acpData?.data && !acpData.data.user ? (
                <div className="h-full rounded-lg border border-dashed border-amber-200 dark:border-amber-500/10 flex flex-col items-center justify-center gap-2 bg-amber-50/30 dark:bg-transparent">
                  <span className="text-[12px] text-amber-500 dark:text-amber-400/60">User not found on ACP</span>
                  <button onClick={startAcpAuth} className="text-[10px] text-gray-500 dark:text-white/35 hover:text-gray-600 dark:hover:text-white/40 transition-colors">Reconnect</button>
                </div>
              ) : (
                <div className="h-full rounded-lg border border-dashed border-gray-200 dark:border-white/[0.06] flex items-center justify-center bg-gray-50/30 dark:bg-transparent">
                  <span className="text-[13px] text-gray-500 dark:text-white/50 select-none">No ACP data for this conversation</span>
                </div>
              )}
              </div> {/* end ACP Main Content */}

              {/* Legs tooltip portal */}
              {legsTooltip && createPortal(
                <div
                  className="fixed z-[99999] w-[280px] max-h-[220px] overflow-y-auto p-2 rounded-lg bg-white dark:bg-[#1a1a1a] shadow-xl border border-gray-200 dark:border-white/10 text-[10px] text-gray-600 dark:text-white/65 leading-relaxed pointer-events-none"
                  style={{
                    left: legsTooltip.anchorRight ? undefined : Math.min(legsTooltip.x, window.innerWidth - 296),
                    right: legsTooltip.anchorRight ? Math.max(8, window.innerWidth - legsTooltip.x - 16) : undefined,
                    top: legsTooltip.anchorUp ? undefined : legsTooltip.y,
                    bottom: legsTooltip.anchorUp ? Math.max(8, window.innerHeight - legsTooltip.anchorY + 4) : undefined,
                  }}>
                  {legsTooltip.lines.slice(0, 15).map((l, j) => <div key={j} className="py-0.5">{l}</div>)}
                  {legsTooltip.lines.length > 15 && <div className="py-0.5 text-gray-500 dark:text-white/35 italic">...and {legsTooltip.lines.length - 15} more</div>}
                  {legsTooltip.games.length > 0 && (
                    <div className="mt-1 pt-1 border-t border-gray-100 dark:border-white/5 text-[8px] text-gray-500 dark:text-white/35">
                      {legsTooltip.games.map((g, j) => <div key={j}>{g}</div>)}
                    </div>
                  )}
                </div>,
                document.body
              )}
            </div>

            {/* Bottom bar — Create Ticket + inline minimized ticket */}
            <div className="flex-shrink-0 px-4 py-2.5 border-t border-gray-100 dark:border-white/[0.04] flex items-center gap-2">
              <button
                onClick={handleCreateTicket}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-medium text-white transition-all shadow-sm hover:shadow"
              >
                <Ticket className="w-3.5 h-3.5" /> Create Ticket
              </button>

              {minimizedTicket && (
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-gray-100 dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.08]">
                  <Clock className="w-3.5 h-3.5 text-gray-500 dark:text-neutral-400 flex-shrink-0" />
                  <span className="text-xs font-medium text-gray-600 dark:text-neutral-300">Ongoing ticket</span>
                  <div className="w-px h-3.5 bg-gray-300/60 dark:bg-neutral-500/40" />
                  <span className="text-xs text-gray-500 dark:text-neutral-400 max-w-[100px] truncate">
                    {minimizedTicket.agentName || 'Unknown'}
                  </span>
                  <div className="w-px h-3.5 bg-gray-300/60 dark:bg-neutral-500/40" />
                  <button
                    onClick={() => {
                      restoreFromMinimized(minimizedTicket);
                      clearMinimizedTicket();
                    }}
                    className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors whitespace-nowrap"
                  >
                    Back to Edit
                  </button>
                  <button
                    onClick={() => clearMinimizedTicket()}
                    className="text-gray-500 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-neutral-300 transition-colors text-xs"
                    title="Dismiss"
                  >
                    &times;
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QAReport;
