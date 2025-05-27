
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Package, Image, User } from 'lucide-react';

const navItems = [
  {
    name: 'בית',
    icon: Home,
    path: '/customer/dashboard'
  },
  {
    name: 'מנות',
    icon: Package,
    path: '/customer/submissions-status'
  },
  {
    name: 'גלריה',
    icon: Image,
    path: '/customer/gallery'
  },
  {
    name: 'חשבון',
    icon: User,
    path: '/customer/profile'
  }
];

export function BottomNavigation() {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path || 
           (path !== '/customer/new-submission' && location.pathname.startsWith(path));
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t md:hidden">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors
              ${isActive(item.path) 
                ? 'text-primary' 
                : 'text-gray-500 hover:text-primary'}`}
          >
            <item.icon className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">{item.name}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
} 
