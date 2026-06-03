export const FARM = {
  name: 'Talakag Banana Farm',
  owner: 'Talakag Agricultural Cooperative',
  region: 'Bukidnon, Philippines',
  coordinates: '8.1500° N, 124.8500° E',
  farmArea: '10.5 hectares',
};

export const FARMERS = [
  {
    id: '1',
    name: 'Dinah V. Caburatan',
    initials: 'DC',
    email: 'dinahcaburatan@gmail.com',
    password: 'pass1',
    role: 'Farm Worker',
  },
  {
    id: '2',
    name: 'Jhonara Fay Payot',
    initials: 'JP',
    email: 'jhonarapayot@gmail.com',
    password: 'pass2',
    role: 'Farm Worker',
  },
  {
    id: '3',
    name: 'Florie Jayne Soler',
    initials: 'FS',
    email: 'floriesoler@gmail.com',
    password: 'pass3',
    role: 'Farm Worker',
  },
  {
    id: '4',
    name: 'Stella Marie Galinada',
    initials: 'SG',
    email: 'stellamariegalinada@gmail.com',
    password: 'pass4',
    role: 'Farm Worker',
  },
];

export const ALERTS = [
  {
    id: '1',
    lat: 8.1234,
    lng: 124.5678,
    detectionClass: 'Black Sigatoka',
    dateReceived: '2025-06-01T08:30:00',
    status: 'active',
    uavScanId: 'UAV-20250601-001',
    message: 'Black Sigatoka detected at 8.1234° N, 124.5678° E — Leaf removal advised.',
  },
  {
    id: '2',
    lat: 8.1290,
    lng: 124.5701,
    detectionClass: 'Black Sigatoka',
    dateReceived: '2025-05-28T14:15:00',
    status: 'resolved',
    uavScanId: 'UAV-20250528-003',
    message: 'Black Sigatoka detected at 8.1290° N, 124.5701° E — Fungicide application advised.',
  },
  {
    id: '3',
    lat: 8.1210,
    lng: 124.5655,
    detectionClass: 'Black Sigatoka',
    dateReceived: '2025-05-25T10:00:00',
    status: 'resolved',
    uavScanId: 'UAV-20250525-002',
    message: 'Black Sigatoka detected at 8.1210° N, 124.5655° E — Affected leaves removed.',
  },
  {
    id: '4',
    lat: 8.1245,
    lng: 124.5690,
    detectionClass: 'Black Sigatoka',
    dateReceived: '2025-05-20T09:45:00',
    status: 'active',
    uavScanId: 'UAV-20250520-001',
    message: 'Black Sigatoka detected at 8.1245° N, 124.5690° E — Immediate action required.',
  },
];

export const FARM_POLYGON = [
  { latitude: 8.1220, longitude: 124.5660 },
  { latitude: 8.1260, longitude: 124.5660 },
  { latitude: 8.1260, longitude: 124.5710 },
  { latitude: 8.1220, longitude: 124.5710 },
];