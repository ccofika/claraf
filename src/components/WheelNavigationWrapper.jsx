import React from 'react';
import { useWheelNavigation } from '../context/WheelNavigationContext';
import WheelNavigation from './WheelNavigation';

const WheelNavigationWrapper = () => {
  const { isOpen, closeWheel } = useWheelNavigation();

  return <WheelNavigation isOpen={isOpen} onClose={closeWheel} />;
};

export default WheelNavigationWrapper;
