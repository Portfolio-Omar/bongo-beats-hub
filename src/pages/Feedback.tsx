
import React from 'react';
import Layout from '@/components/layout/Layout';
import FeedbackForm from '@/components/layout/FeedbackForm';

const Feedback: React.FC = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto mb-8 text-center">
          <h1 className="text-3xl font-display font-bold mb-4">Share Your Feedback</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We value your input and are committed to improving our platform. 
            Please share your thoughts, suggestions, or experiences with us.
          </p>
        </div>
        
        <FeedbackForm />
      </div>
    </Layout>
  );
};

export default Feedback;
