import React from 'react';
import { useQAManager } from '../../context/QAManagerContext';
import BugReportsAdmin from '../../components/BugReportsAdmin';

const QABugsPage = () => {
  const { user, getAuthHeaders } = useQAManager();

  return (
    <BugReportsAdmin
      getAuthHeaders={getAuthHeaders}
      userEmail={user?.email}
    />
  );
};

export default QABugsPage;
