import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, LogOut, PlusCircle, UserCheck, Shield, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserSettingsModal } from './UserSettingsModal';

export const Navbar: React.FC = () => {
  const { user, isOwner, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const isReaderPage = location.pathname.startsWith('/read/');

  const isAuthPage = ['/login', '/register', '/forgot-password'].includes(location.pathname);

  if (isReaderPage) {
    return null;
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-paper-bg/90 backdrop-blur-md border-b border-paper-border/70 transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo */}
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-9 h-9 rounded-lg bg-amber-900/10 flex items-center justify-center text-amber-900 group-hover:bg-amber-900 group-hover:text-amber-50 transition-all shadow-xs">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="font-playfair text-xl font-bold tracking-tight text-stone-900">
                  Phoenix-<span className="text-amber-800">Scroll</span>
                </span>
                <span className="hidden sm:inline-block ml-2 text-xs uppercase tracking-widest text-stone-400 font-sans">
                  Library
                </span>
              </div>
            </Link>

            {/* Navigation Links */}
            <nav className="flex items-center space-x-2 sm:space-x-4">
              {!isAuthPage && (
                <Link
                  to="/"
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    location.pathname === '/' ? 'text-stone-900 bg-stone-100 font-semibold' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                  }`}
                >
                  Library
                </Link>
              )}

              {isOwner && (
                <>
                  <Link
                    to="/dashboard"
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      location.pathname === '/dashboard' ? 'text-amber-900 bg-amber-50 font-semibold' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                    }`}
                  >
                    Author Studio
                  </Link>

                  <Link
                    to="/editor/new"
                    className="hidden sm:inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-sm font-medium text-amber-900 bg-amber-100/70 hover:bg-amber-100 rounded-md border border-amber-200/80 transition-all shadow-xs"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>New Story</span>
                  </Link>
                </>
              )}

              {/* Auth Status & User Badge */}
              {user ? (
                <div className="flex items-center space-x-2 pl-2 border-l border-stone-200">
                  <div className="hidden md:flex flex-col text-right">
                    <span className="text-xs font-semibold text-stone-800 flex items-center justify-end space-x-1">
                      {user.role === 'owner' ? (
                        <Shield className="w-3 h-3 text-amber-700 inline" />
                      ) : (
                        <UserCheck className="w-3 h-3 text-emerald-600 inline" />
                      )}
                      <span>{user.name}</span>
                    </span>
                    <span
                      className={`text-[10px] uppercase tracking-wider font-semibold ${
                        user.role === 'owner' ? 'text-amber-800' : 'text-emerald-700'
                      }`}
                    >
                      {user.role === 'owner' ? 'Author' : 'Reader'}
                    </span>
                  </div>

                  <button
                    onClick={() => setIsSettingsOpen(true)}
                    title="Account Settings & Password"
                    className="p-2 text-stone-600 hover:text-amber-900 hover:bg-stone-100 rounded-lg transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      logout();
                      navigate('/');
                    }}
                    title="Sign Out"
                    className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-full transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                !isAuthPage && (
                  <Link
                    to="/login"
                    className="flex items-center space-x-1.5 px-4 py-1.5 text-sm font-medium text-stone-50 bg-stone-900 hover:bg-stone-800 rounded-md shadow-xs transition-all"
                  >
                    <span>Sign In</span>
                  </Link>
                )
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* User Settings Modal */}
      {user && (
        <UserSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </>
  );
};
