
import React, { useState } from 'react';
import { ProfessionalDashboard } from '@/components/ProfessionalDashboard';

const Index = () => {
  const [balance] = useState(10000);

  const handleTrade = (order: any) => {
    console.log('Trade executed:', order);
  };

  return (
    <ProfessionalDashboard 
      balance={balance}
      onTrade={handleTrade}
    />
  );
};

export default Index;
