import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  const [acpVisibleSections, setAcpVisibleSections] = useState([]); // ordered list of added section ids
  const [acpExpandedSections, setAcpExpandedSections] = useState(new Set());

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
      setTemplates(data);
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

  useEffect(() => {
    if (restoredRef.current || templates.length === 0) return;
    const drillId = searchParams.get('drill');
    if (!drillId) return;
    restoredRef.current = true;
    const template = templates.find(t => t._id === drillId);
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
  }, [templates, searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

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
      toast.error('Failed to delete template');
    } finally {
      setDeletingId(null);
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

  // Fetch meta when currentIndex changes
  useEffect(() => {
    if (view === 'drill-in' && reportResults[currentIndex]) {
      fetchConversationMeta(reportResults[currentIndex].id);
    }
  }, [view, currentIndex, reportResults, fetchConversationMeta]);

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
    // Check via extension — ask if CF_Authorization cookie exists
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
            rakeback { rate }
            flagProgress { progress flag }
            flags { flag }
            balances { available { amount currency } }
            depositAddressList(limit: 50, offset: 0) { id address currency createdAt active }
            adjustmentList(limit: 50, offset: 0) { message createdAt authId { id name } amount currency type value }
            campaignDefaultCommission { comission }
            campaignList(limit: 50, offset: 0) { id code offerCode name hitCount referCount uniqueDepositors depositCount comission type createdAt lastUpdatedBy { id name } balances { comission { currency amount value } available { currency amount value } } }
            referredCampaign { name comission code hitCount referCount uniqueDepositors depositCount type createdAt }
            snapshotSummary { ${ssFields} }
            ${snapAliases}
          }
        }`;
      const gqlVariables = { userId: externalId };

      console.log('[ACP] Querying for externalId:', externalId);
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

      console.log('[ACP] Extension query result:', JSON.stringify(data).substring(0, 500));
      setAcpData(data);
    } catch (err) {
      console.error('[ACP] Extension query error:', err);
      const msg = err.message || 'Failed to fetch ACP data';
      setAcpError(msg);
    } finally {
      setAcpLoading(false);
    }
  }, [acpApiToken]);

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
      const conv = reportResults[currentIndex];
      const extId = conversationMeta?.contactExternalId || conv?.contactExternalId;
      if (extId) {
        fetchAcpData(extId);
      }
    }
  }, [view, currentIndex, reportResults, conversationMeta?.contactExternalId, acpStatus?.connected, fetchAcpData]);

  // Listen for ACP token from extension
  useEffect(() => {
    const handleAcpToken = async (event) => {
      if (event.data?.type === 'CLARA_ACP_TOKEN_RECEIVED' && event.data.token) {
        toast.success('ACP connected!');
        setAcpStatus({ connected: true, expired: false });
        if (view === 'drill-in') {
          const conv = reportResults[currentIndex];
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
        ) : templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-white/40">
            <FileText className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">No templates yet</p>
            <button onClick={() => openEditor()} className="mt-2 text-xs text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300">
              Create your first template
            </button>
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
          {/* LEFT 30% — Chat */}
          <div className="w-[30%] min-w-[320px] border-r border-gray-200 dark:border-white/[0.04] overflow-y-auto">
            {currentConv && (
              <ConversationPanel key={currentConv.id} ticketId={currentConv.id} headerExtra={navControls} />
            )}
          </div>

          {/* RIGHT 70% — Metadata strip + ACP area + Create Ticket */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Metadata strip — single row, expandable */}
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

            {/* ACP Data Area — fills all remaining space */}
            <div className="flex-1 min-h-0 flex">
              {/* ACP Sidebar — collapsed icons, expands on hover */}
              {acpData?.data?.user && (
                <div
                  className={`shrink-0 border-r border-gray-100 dark:border-white/[0.04] flex flex-col overflow-x-hidden overflow-y-auto transition-all duration-200 ease-out ${acpSidebarHover ? 'acp-sidebar-expanded' : 'acp-sidebar-collapsed'}`}
                  style={{ width: acpSidebarHover ? 170 : 36 }}
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
                      { id: 'balances', label: 'Balances', icon: Wallet },
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

                    const addSection = (id) => {
                      setAcpVisibleSections(prev => {
                        if (prev.includes(id)) return prev;
                        return [...prev, id];
                      });
                      // New sections are collapsed by default
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
                          onClick={() => !page.isDefault && addSection(page.id)}
                          className={`flex items-center gap-2 px-2.5 py-1.5 text-left transition-colors whitespace-nowrap ${
                            isActive
                              ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/[0.08]'
                              : 'text-gray-500 dark:text-white/30 hover:text-gray-700 dark:hover:text-white/50 hover:bg-gray-50 dark:hover:bg-white/[0.03]'
                          }`}
                          title={!acpSidebarHover ? page.label : undefined}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span className={`text-[11px] font-medium truncate transition-opacity duration-200 ${acpSidebarHover ? 'opacity-100' : 'opacity-0'}`}>{page.label}</span>
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
                  <span className="text-[11px] text-gray-400 dark:text-white/25 select-none tracking-widest uppercase">ACP</span>
                  <button
                    onClick={startAcpAuth}
                    className="px-3 py-1.5 rounded-md text-[11px] font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                  >
                    {acpStatus?.expired ? 'Reconnect ACP' : 'Connect ACP'}
                  </button>
                  {acpStatus?.expired && (
                    <span className="text-[10px] text-amber-500">Token expired</span>
                  )}
                </div>
              ) : acpLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-300 dark:text-white/20" />
                </div>
              ) : acpError ? (
                <div className="h-full rounded-lg border border-dashed border-red-200 dark:border-red-500/10 flex flex-col items-center justify-center gap-2 bg-red-50/30 dark:bg-transparent">
                  <span className="text-[11px] text-red-400 dark:text-red-400/60">{acpError}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const conv = reportResults[currentIndex];
                        const extId = conversationMeta?.contactExternalId || conv?.contactExternalId;
                        if (extId) fetchAcpData(extId);
                      }}
                      className="px-2.5 py-1 rounded text-[10px] font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 hover:bg-red-50 dark:hover:bg-red-500/[0.05] transition-colors"
                    >
                      Retry
                    </button>
                    <button
                      onClick={startAcpAuth}
                      className="px-2.5 py-1 rounded text-[10px] font-medium text-gray-500 dark:text-white/30 border border-gray-200 dark:border-white/[0.06] hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors"
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
                    <span className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20">{children}</span>
                  );
                  const RedBadge = ({ children }) => (
                    <span className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-red-500/15 text-red-500 dark:text-red-400 border border-red-500/15">{children}</span>
                  );

                  return (
                    <div className="space-y-2">

                      {/* ── Row 1: Username + ID + VIP — all inline ── */}
                      <div className="flex items-center gap-2 flex-wrap shrink-0">
                        <span className="text-[14px] font-bold text-gray-800 dark:text-white/90">{u.name}</span>
                        <button onClick={() => copyText(u.name)} className="text-gray-300 dark:text-white/20 hover:text-gray-500 dark:hover:text-white/50"><Copy className="w-3 h-3" /></button>
                        {u.isBanned && <span className="px-1 py-0.5 rounded text-[9px] font-bold bg-red-500/20 text-red-500 uppercase">Banned</span>}
                        <span className="text-gray-300 dark:text-white/10">|</span>
                        <span className="text-[11px] text-gray-400 dark:text-white/30 font-mono truncate max-w-[220px]">{u.id}</span>
                        <button onClick={() => copyText(u.id)} className="text-gray-300 dark:text-white/20 hover:text-gray-500 dark:hover:text-white/50"><Copy className="w-3 h-3" /></button>
                        {u.flagProgress && (<>
                          <span className="text-gray-300 dark:text-white/10">|</span>
                          <span className="text-[11px] font-medium" style={{ color: vipBarColor[currentVip] }}>{vipLabels[currentVip]}</span>
                          <div className="w-16 h-1.5 rounded-full bg-gray-200 dark:bg-white/[0.06] overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${Math.min(vipProgress * 100, 100)}%`, backgroundColor: vipBarColor[currentVip] }} />
                          </div>
                          <span className="text-[11px] font-bold" style={{ color: vipBarColor[currentVip] }}>{(vipProgress * 100).toFixed(1)}%</span>
                          {nextVipMap[currentVip] && <span className="text-[10px] text-gray-400 dark:text-white/20">→ {nextVipMap[currentVip]}</span>}
                        </>)}
                        <button onClick={startAcpAuth} className="ml-auto text-[10px] text-gray-400 dark:text-white/20 hover:text-gray-600 dark:hover:text-white/50">Reconnect</button>
                      </div>

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
                            ['Rakeback', u.rakeback?.rate != null && u.rakeback.rate > 0 ? 'Yes' : 'No', u.rakeback?.rate > 0 ? 'green' : null],
                            ['KYC', kycDisplay, u.kycStatus?.includes('Confirmed') ? 'green' : null],
                            ['Preferred Fiat Currency', prefFiat || '—'],
                            ['Email Subscribed', u.hasEmailSubscribed ? 'Yes' : 'No', u.hasEmailSubscribed ? 'green' : null],
                          ];

                          return fields.map(([label, val, badge], i) => (
                            <span key={i} className="inline-flex items-center gap-1 text-[11px]">
                              <span className="text-gray-400 dark:text-white/30 font-medium">{label}</span>
                              {badge === 'green' ? <GBadge>{val}</GBadge> : badge === 'red' ? <RedBadge>{val}</RedBadge> : badge === 'caution' ? (
                                <span className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/15">{val}</span>
                              ) : <span className="text-gray-700 dark:text-white/60 font-medium">{val}</span>}
                            </span>
                          ));
                        })()}
                        {nonZeroBalances.length > 0 && nonZeroBalances.map((b, i) => {
                          const a = b.available;
                          const avail = Array.isArray(a) ? a.find(x => parseFloat(x.amount) !== 0) : a;
                          if (!avail) return null;
                          return (
                            <span key={`bal-${i}`} className="inline-flex items-center gap-0.5 text-[11px]">
                              <span className="font-medium text-gray-700 dark:text-white/60">{parseFloat(avail.amount).toFixed(2)}</span>
                              <span className="text-gray-400 dark:text-white/30 uppercase text-[9px]">{avail.currency}</span>
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
                                      <th key={h} className="px-3 py-1.5 text-left text-[11px] font-medium text-gray-400 dark:text-white/30 whitespace-nowrap">{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {periodRows.map((r, i) => (
                                    <tr key={i} className={`border-b border-gray-100 dark:border-white/[0.04] hover:bg-gray-100/50 dark:hover:bg-white/[0.02] transition-colors ${r.label === 'Overall' ? 'bg-gray-100/40 dark:bg-white/[0.02] font-semibold' : ''}`}>
                                      <td className="px-3 py-2 text-[13px] font-medium text-gray-700 dark:text-white/60 whitespace-nowrap">{r.label}</td>
                                      <td className="px-3 py-2 text-[13px] text-gray-700 dark:text-white/60 whitespace-nowrap">{fmt$(r.wagered)}</td>
                                      <td className={`px-3 py-2 text-[13px] font-semibold whitespace-nowrap ${r.profit < 0 ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{fmt$(r.profit)}</td>
                                      <td className="px-3 py-2 text-[13px] text-gray-700 dark:text-white/60 whitespace-nowrap">{fmt$(r.bonuses)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ) : (
                          <div className="py-6 rounded-lg border border-dashed border-gray-200 dark:border-white/[0.06] flex items-center justify-center bg-gray-50/30 dark:bg-transparent">
                            <span className="text-[11px] text-gray-300 dark:text-white/15">No snapshot data</span>
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
                          'notes': 'Notes', 'overall': 'Overall', 'balances': 'Balances',
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
                          <div key={sectionId} className="mt-3 rounded-lg border border-gray-100 dark:border-white/[0.06] overflow-hidden">
                            <div className="flex items-center bg-gray-50 dark:bg-white/[0.03]">
                              <button
                                onClick={() => setAcpExpandedSections(prev => { const n = new Set(prev); if (n.has(sectionId)) n.delete(sectionId); else n.add(sectionId); return n; })}
                                className="flex-1 flex items-center gap-1.5 px-3 py-2 hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors"
                              >
                                <ChevronDown className={`w-3 h-3 text-gray-400 dark:text-white/25 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                                <span className="text-[12px] font-semibold text-gray-700 dark:text-white/70">{sectionLabels[sectionId] || sectionId}</span>
                              </button>
                              <button
                                onClick={() => {
                                  setAcpVisibleSections(prev => prev.filter(s => s !== sectionId));
                                  setAcpExpandedSections(prev => { const n = new Set(prev); n.delete(sectionId); return n; });
                                }}
                                className="px-2 py-2 text-gray-300 dark:text-white/15 hover:text-gray-500 dark:hover:text-white/40 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                            {isExpanded && (
                              <div className="px-3 py-3">
                                {sectionId === 'actions' ? (() => {
                                  const u = acpData?.data?.user;
                                  if (!u) return <span className="text-[11px] text-gray-400 dark:text-white/25 italic">No data</span>;
                                  return (
                                    <div>
                                      <span className="text-[11px] font-semibold text-gray-600 dark:text-white/50 tracking-wide">Marketing Preferences</span>
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
                                            <span className={`text-[11px] ${
                                              pref.value
                                                ? 'text-gray-700 dark:text-white/60'
                                                : 'text-gray-400 dark:text-white/25'
                                            }`}>{pref.label}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })() : sectionId === 'addresses' ? (() => {
                                  const u = acpData?.data?.user;
                                  const addrs = u?.depositAddressList;
                                  if (!addrs?.length) return <span className="text-[11px] text-gray-400 dark:text-white/25 italic">No addresses</span>;
                                  const cryptoIcon = (c) => `https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/32/color/${c.toLowerCase()}.png`;
                                  const fmtDate = (ts) => {
                                    if (!ts) return '—';
                                    const d = new Date(/^\d+$/.test(ts) ? Number(ts) : ts);
                                    return isNaN(d) ? '—' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                  };
                                  const half = Math.ceil(addrs.length / 2);
                                  const cols = [addrs.slice(0, half), addrs.slice(half)];
                                  const renderCol = (list) => (
                                    <table className="w-full text-[11px]">
                                      <thead>
                                        <tr className="text-[10px] text-gray-400 dark:text-white/25 uppercase tracking-wider">
                                          <th className="text-left pb-2 pl-1 font-medium">Currency</th>
                                          <th className="text-left pb-2 font-medium">Address</th>
                                          <th className="text-right pb-2 pr-1 font-medium">Created</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {list.map((addr, i) => (
                                          <tr key={addr.id || i} className="border-t border-gray-50 dark:border-white/[0.03]">
                                            <td className="py-1.5 pl-1 whitespace-nowrap">
                                              <div className="flex items-center gap-1.5">
                                                <img src={cryptoIcon(addr.currency)} alt="" className="w-4 h-4 rounded-full"
                                                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                                                <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-white/10 items-center justify-center text-[8px] font-bold text-gray-500 dark:text-white/40 hidden">
                                                  {addr.currency?.slice(0,2)}
                                                </div>
                                                <span className="font-semibold text-gray-700 dark:text-white/60">{addr.currency}</span>
                                              </div>
                                            </td>
                                            <td className="py-1.5">
                                              <span className="text-gray-500 dark:text-white/35 font-mono text-[10px] select-all break-all">{addr.address}</span>
                                            </td>
                                            <td className="py-1.5 pr-1 text-right text-gray-400 dark:text-white/25 whitespace-nowrap">
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
                                        <div className="mt-2 text-center text-[10px] text-gray-400 dark:text-white/20 italic">Showing first 50 addresses</div>
                                      )}
                                    </div>
                                  );
                                })() : sectionId === 'adjustments' ? (() => {
                                  const u = acpData?.data?.user;
                                  const adjs = u?.adjustmentList;
                                  if (!adjs?.length) return <span className="text-[11px] text-gray-400 dark:text-white/25 italic">No adjustments</span>;
                                  const fmtDate = (ts) => {
                                    if (!ts) return '—';
                                    const d = new Date(/^\d+$/.test(ts) ? Number(ts) : ts);
                                    return isNaN(d) ? '—' : d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
                                  };
                                  return (
                                    <div className="max-h-[320px] overflow-y-auto">
                                      <table className="w-full text-[11px]">
                                        <thead className="sticky top-0 bg-white dark:bg-[#0a0a0a] z-[1]">
                                          <tr className="text-[10px] text-gray-400 dark:text-white/25 uppercase tracking-wider">
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
                                            <tr key={i} className="border-t border-gray-50 dark:border-white/[0.03] align-top">
                                              <td className="py-1.5 pl-1 text-gray-700 dark:text-white/60 break-words min-w-[120px]">{adj.message || '—'}</td>
                                              <td className="py-1.5 text-right font-mono text-gray-600 dark:text-white/50 whitespace-nowrap">
                                                {adj.amount != null ? (
                                                  <span className="inline-flex items-center gap-1 justify-end">
                                                    {Number(adj.amount).toFixed(8)}
                                                    {adj.currency && <>
                                                      <img src={`https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/32/color/${adj.currency.toLowerCase()}.png`} alt="" className="w-3.5 h-3.5 rounded-full inline-block" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                                                      <span className="w-3.5 h-3.5 rounded-full bg-gray-200 dark:bg-white/10 items-center justify-center text-[6px] font-bold text-gray-500 dark:text-white/40 hidden shrink-0">{adj.currency.slice(0,2)}</span>
                                                    </>}
                                                  </span>
                                                ) : '—'}
                                              </td>
                                              <td className="py-1.5 text-right font-mono text-gray-600 dark:text-white/50 whitespace-nowrap">{adj.value != null ? `$${Number(adj.value).toFixed(2)}` : '—'}</td>
                                              <td className="py-1.5 pl-2 text-gray-500 dark:text-white/35">{adj.type || '—'}</td>
                                              <td className="py-1.5 text-right text-gray-400 dark:text-white/25 whitespace-nowrap">{fmtDate(adj.createdAt)}</td>
                                              <td className="py-1.5 pr-1 text-right text-gray-500 dark:text-white/40 whitespace-nowrap">{adj.authId?.name || '—'}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                      {adjs.length >= 50 && (
                                        <div className="mt-2 text-center text-[10px] text-gray-400 dark:text-white/20 italic">Showing first 50 adjustments</div>
                                      )}
                                    </div>
                                  );
                                })() : sectionId === 'affiliate' ? (() => {
                                  const u = acpData?.data?.user;
                                  if (!u) return <span className="text-[11px] text-gray-400 dark:text-white/25 italic">No data</span>;
                                  const campaigns = u.campaignList || [];
                                  const referred = u.referredCampaign;
                                  const defComm = u.campaignDefaultCommission?.comission;
                                  const fmtDate = (ts) => {
                                    if (!ts) return '—';
                                    const d = new Date(/^\d+$/.test(ts) ? Number(ts) : ts);
                                    return isNaN(d) ? '—' : d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
                                  };
                                  const fmtBal = (balArr) => {
                                    if (!balArr) return '—';
                                    if (!balArr.length) return '$0.00';
                                    return balArr.map(b => `$${Number(b.value ?? 0).toFixed(2)} ${b.currency}`).join(', ');
                                  };
                                  return (
                                    <div className="max-h-[400px] overflow-y-auto flex flex-col gap-4">
                                      {/* Campaigns */}
                                      <div>
                                        <div className="flex items-center gap-2 mb-2">
                                          <span className="text-[11px] font-semibold text-gray-600 dark:text-white/50 tracking-wide">Campaigns</span>
                                          {defComm != null && <span className="text-[9px] text-gray-400 dark:text-white/20">Default commission: {defComm}</span>}
                                          <span className="text-[9px] text-gray-400 dark:text-white/20 ml-auto">{campaigns.length} result{campaigns.length !== 1 ? 's' : ''}</span>
                                        </div>
                                        {campaigns.length === 0 ? (
                                          <span className="text-[11px] text-gray-400 dark:text-white/25 italic">No campaigns</span>
                                        ) : (
                                          <div className="overflow-x-auto">
                                            <table className="w-full text-[11px]">
                                              <thead className="sticky top-0 bg-white dark:bg-[#0a0a0a] z-[1]">
                                                <tr className="text-[10px] text-gray-400 dark:text-white/25 uppercase tracking-wider">
                                                  <th className="text-left pb-2 pl-1 font-medium">Campaign</th>
                                                  <th className="text-left pb-2 font-medium">ID</th>
                                                  <th className="text-left pb-2 font-medium">Offer</th>
                                                  <th className="text-right pb-2 font-medium">Hits</th>
                                                  <th className="text-right pb-2 font-medium">Referrals</th>
                                                  <th className="text-right pb-2 font-medium">FTDs</th>
                                                  <th className="text-right pb-2 font-medium">Deposits</th>
                                                  <th className="text-left pb-2 pl-2 font-medium">Type</th>
                                                  <th className="text-right pb-2 font-medium">Comm.</th>
                                                  <th className="text-right pb-2 font-medium">Bal. Comm.</th>
                                                  <th className="text-right pb-2 font-medium">Bal. Avail.</th>
                                                  <th className="text-right pb-2 font-medium whitespace-nowrap">Created</th>
                                                  <th className="text-right pb-2 pr-1 font-medium whitespace-nowrap">Updated By</th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {campaigns.map((c, i) => (
                                                  <tr key={c.id || i} className="border-t border-gray-50 dark:border-white/[0.03] align-top">
                                                    <td className="py-1.5 pl-1 text-gray-700 dark:text-white/60 font-medium">{c.name || '—'}</td>
                                                    <td className="py-1.5 text-gray-500 dark:text-white/35 font-mono text-[10px]">{c.code || '—'}</td>
                                                    <td className="py-1.5 text-gray-500 dark:text-white/35 text-[10px]">{c.offerCode || '—'}</td>
                                                    <td className="py-1.5 text-right font-mono text-gray-600 dark:text-white/50">{c.hitCount?.toLocaleString() ?? '—'}</td>
                                                    <td className="py-1.5 text-right font-mono text-gray-600 dark:text-white/50">{c.referCount?.toLocaleString() ?? '—'}</td>
                                                    <td className="py-1.5 text-right font-mono text-gray-600 dark:text-white/50">{c.uniqueDepositors?.toLocaleString() ?? '—'}</td>
                                                    <td className="py-1.5 text-right font-mono text-gray-600 dark:text-white/50">{c.depositCount?.toLocaleString() ?? '—'}</td>
                                                    <td className="py-1.5 pl-2 text-gray-500 dark:text-white/35">{c.type || '—'}</td>
                                                    <td className="py-1.5 text-right font-mono text-gray-600 dark:text-white/50">{c.comission ?? '—'}</td>
                                                    <td className="py-1.5 text-right text-gray-500 dark:text-white/35 text-[10px] whitespace-nowrap">{fmtBal(c.balances?.comission)}</td>
                                                    <td className="py-1.5 text-right text-gray-500 dark:text-white/35 text-[10px] whitespace-nowrap">{fmtBal(c.balances?.available)}</td>
                                                    <td className="py-1.5 text-right text-gray-400 dark:text-white/25 whitespace-nowrap">{fmtDate(c.createdAt)}</td>
                                                    <td className="py-1.5 pr-1 text-right text-gray-500 dark:text-white/40 whitespace-nowrap">{c.lastUpdatedBy?.name || '—'}</td>
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                          </div>
                                        )}
                                      </div>

                                      {/* Referred Campaign */}
                                      <div>
                                        <span className="text-[11px] font-semibold text-gray-600 dark:text-white/50 tracking-wide mb-2 block">Referred Campaign</span>
                                        {!referred ? (
                                          <span className="text-[11px] text-gray-400 dark:text-white/25 italic">No referred campaign</span>
                                        ) : (
                                          <div className="overflow-x-auto">
                                            <table className="w-full text-[11px]">
                                              <thead>
                                                <tr className="text-[10px] text-gray-400 dark:text-white/25 uppercase tracking-wider">
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
                                                <tr className="border-t border-gray-50 dark:border-white/[0.03]">
                                                  <td className="py-1.5 pl-1 text-gray-700 dark:text-white/60 font-medium">{referred.name || '—'}</td>
                                                  <td className="py-1.5 text-gray-500 dark:text-white/35 font-mono text-[10px]">{referred.code || '—'}</td>
                                                  <td className="py-1.5 text-right font-mono text-gray-600 dark:text-white/50">{referred.hitCount?.toLocaleString() ?? '—'}</td>
                                                  <td className="py-1.5 text-right font-mono text-gray-600 dark:text-white/50">{referred.referCount?.toLocaleString() ?? '—'}</td>
                                                  <td className="py-1.5 text-right font-mono text-gray-600 dark:text-white/50">{referred.uniqueDepositors?.toLocaleString() ?? '—'}</td>
                                                  <td className="py-1.5 text-right font-mono text-gray-600 dark:text-white/50">{referred.depositCount?.toLocaleString() ?? '—'}</td>
                                                  <td className="py-1.5 pl-2 text-gray-500 dark:text-white/35">{referred.type || '—'}</td>
                                                  <td className="py-1.5 text-right font-mono text-gray-600 dark:text-white/50">{referred.comission ?? '—'}</td>
                                                  <td className="py-1.5 pr-1 text-right text-gray-400 dark:text-white/25 whitespace-nowrap">{fmtDate(referred.createdAt)}</td>
                                                </tr>
                                              </tbody>
                                            </table>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })() : (
                                  <span className="text-[11px] text-gray-400 dark:text-white/25 italic">Coming soon</span>
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
                  <span className="text-[11px] text-amber-500 dark:text-amber-400/60">User not found on ACP</span>
                  <button onClick={startAcpAuth} className="text-[9px] text-gray-400 dark:text-white/20 hover:text-gray-600 dark:hover:text-white/40 transition-colors">Reconnect</button>
                </div>
              ) : (
                <div className="h-full rounded-lg border border-dashed border-gray-200 dark:border-white/[0.06] flex items-center justify-center bg-gray-50/30 dark:bg-transparent">
                  <span className="text-[11px] text-gray-300 dark:text-white/15 select-none">No ACP data for this conversation</span>
                </div>
              )}
              </div> {/* end ACP Main Content */}
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
                    className="text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-neutral-300 transition-colors text-xs"
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
