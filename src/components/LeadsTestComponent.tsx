// src/pages/admin/LeadsTestPage.tsx
import React from 'react';
import LeadsTestComponent from '@/components/admin/leads/LeadsTestComponent';

const LeadsTestPage: React.FC = () => {
  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <header style={{ marginBottom: '30px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
        <h1 style={{ fontSize: '28px', color: '#333' }}>Leads Test Page</h1>
        <p style={{ fontSize: '16px', color: '#555' }}>
          This page is used to test the functionality of the <code>LeadsTestComponent</code>.
        </p>
      </header>
      
      <main>
        <LeadsTestComponent />
      </main>

      <footer style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #eee', textAlign: 'center', fontSize: '14px', color: '#777' }}>
        <p>End of test page.</p>
      </footer>
    </div>
  );
};

export default LeadsTestPage;
