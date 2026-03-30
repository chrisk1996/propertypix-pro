import dynamic from 'next/dynamic';

// Force client-side rendering since react-konva requires browser
const FloorPlanClient = dynamic(() => import('./FloorPlanClient'), { ssr: false });

export default FloorPlanClient;
