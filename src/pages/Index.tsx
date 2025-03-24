
import React from 'react';
import Layout from '@/components/layout/Layout';
import Hero from '@/components/ui-custom/Hero';
import SongOfTheWeek from '@/components/ui-custom/SongOfTheWeek';
import AdminPopup from '@/components/admin/AdminPopup';
import { useAuth } from '@/context/AuthContext';

const Index: React.FC = () => {
  const { isAuthenticated } = useAuth();
  
  return (
    <Layout>
      <Hero />
      <SongOfTheWeek />
      {isAuthenticated && <AdminPopup delay={20000} />}
    </Layout>
  );
};

export default Index;
