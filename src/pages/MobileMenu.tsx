
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Home, Music, FileText, BarChart2, MessageSquare, Phone, Shield, ArrowLeft } from 'lucide-react';

const MobileMenu = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { name: 'Home', path: '/', icon: <Home className="h-5 w-5 mr-3" /> },
    { name: 'Music', path: '/music', icon: <Music className="h-5 w-5 mr-3" /> },
    { name: 'Blog', path: '/blog', icon: <FileText className="h-5 w-5 mr-3" /> },
    { name: 'Polls', path: '/polls', icon: <BarChart2 className="h-5 w-5 mr-3" /> },
    { name: 'Feedback', path: '/feedback', icon: <MessageSquare className="h-5 w-5 mr-3" /> },
    { name: 'Contact', path: '/contact', icon: <Phone className="h-5 w-5 mr-3" /> },
  ];

  if (isAuthenticated) {
    menuItems.push({ 
      name: 'Admin', 
      path: '/admin', 
      icon: <Shield className="h-5 w-5 mr-3" /> 
    });
  }

  return (
    <Layout>
      <div className="container py-8">
        <Button 
          variant="ghost" 
          className="mb-4" 
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5 mr-2" /> Back
        </Button>
        
        <h1 className="text-2xl font-bold mb-6">Menu</h1>
        
        <div className="grid gap-3">
          {menuItems.map((item) => (
            <Link 
              key={item.name} 
              to={item.path} 
              className="flex items-center p-4 rounded-lg border border-border hover:bg-accent transition-colors"
            >
              {item.icon}
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default MobileMenu;
