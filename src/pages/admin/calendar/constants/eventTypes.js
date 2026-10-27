import { TreePalm, Palmtree, Cake, Star, PartyPopper, BookOpen } from "lucide-react";
export const EVENT_TYPES = {
  holiday:     { label: 'Holiday',     color: '#ef4444', bg: '#fef2f2', icon: <TreePalm size={13} /> },
  leave:       { label: 'Leave',       color: '#3b82f6', bg: '#eff6ff', icon: <Palmtree size={13} /> },
  birthday:    { label: 'Birthday',    color: '#22c55e', bg: '#f0fdf4', icon: <Cake size={13} /> },
  review:      { label: 'Review',      color: '#a855f7', bg: '#faf5ff', icon: <Star size={13} /> },
  anniversary: { label: 'Anniversary', color: '#ec4899', bg: '#fdf2f8', icon: <PartyPopper size={13} /> },
  training:    { label: 'Training',    color: '#f97316', bg: '#fff7ed', icon: <BookOpen size={13} /> },
};

export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const ADDABLE_TYPES = ['training', 'review', 'anniversary'];
