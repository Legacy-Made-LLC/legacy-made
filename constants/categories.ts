import type { Category } from '@/data/types';

export const categories: Category[] = [
  {
    id: 'contacts',
    title: 'Key Contacts',
    description: 'Who to call and why',
    guidance: 'Start with one primary contact — the person who should be called first. Then add backup contacts like your attorney, financial advisor, or close friends who can help.',
    icon: '👤',
    route: '/contacts',
  },
  {
    id: 'finances',
    title: 'Financial Accounts',
    description: 'Where your money lives',
    guidance: 'List your bank accounts, investments, and any debts. You don\'t need account numbers — just enough detail so your family knows where to look.',
    icon: '💰',
    route: '/finances',
  },
  {
    id: 'insurance',
    title: 'Insurance',
    description: 'Policies that protect your family',
    guidance: 'Include life insurance first, then health, home, and auto policies. Note the provider and policy number so claims can be filed.',
    icon: '🛡️',
    route: '/insurance',
  },
  {
    id: 'documents',
    title: 'Legal Documents',
    description: 'Where to find what matters',
    guidance: 'Record where your will, trust, and power of attorney documents are stored. Include who has copies and how to access them.',
    icon: '📄',
    route: '/documents',
  },
  {
    id: 'home-responsibilities',
    title: 'Home & Responsibilities',
    description: 'What needs ongoing attention',
    guidance: 'Think about what would need attention if you weren\'t here — property, vehicles, pets, or recurring obligations that someone would need to handle.',
    icon: '🏠',
    route: '/home-responsibilities',
  },
  {
    id: 'digital',
    title: 'Digital Access',
    description: 'Accounts and how to reach them',
    guidance: 'Focus on critical accounts first: email, password manager, and financial logins. Don\'t store passwords here — just note where to find them.',
    icon: '💻',
    route: '/digital',
  },
];
