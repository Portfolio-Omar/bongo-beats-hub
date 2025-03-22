
import React from 'react';
import Layout from '@/components/layout/Layout';
import FeedbackForm from '@/components/layout/FeedbackForm';
import { motion } from 'framer-motion';

const Feedback: React.FC = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto text-center mb-12"
        >
          <h1 className="text-4xl font-display font-bold mb-4">Feedback</h1>
          <p className="text-muted-foreground">
            We value your feedback and suggestions. Please share your thoughts with us to help improve our services.
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <FeedbackForm />
        </motion.div>
      </div>
    </Layout>
  );
};

export default Feedback;
