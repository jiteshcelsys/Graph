import { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { BarChart2, Upload, Database } from 'lucide-react';
import FileUploader from './FileUploader';
import DBConnector from './DBConnector';
import RecentDatasets from './RecentDatasets';

const TABS = [
  { id: 'file', label: 'Upload File', Icon: Upload },
  { id: 'db', label: 'Connect DB', Icon: Database },
];

const Sidebar = forwardRef(function Sidebar({ onDatasetLoaded, onDatasetSelected, fileLoading, onFileUpload }, ref) {
  const [tab, setTab] = useState('file');
  const recentRef = useRef(null);

  useImperativeHandle(ref, () => ({
    refreshRecent: () => recentRef.current?.refresh(),
  }));

  return (
    <aside className="w-72 shrink-0 flex flex-col gap-4 h-screen sticky top-0 overflow-y-auto p-4 border-r border-gray-800">
      <div className="flex items-center gap-2 py-2">
        <BarChart2 className="w-6 h-6 text-blue-400" />
        <span className="font-semibold text-gray-100 text-lg">DataViz</span>
      </div>

      <div className="flex rounded-lg bg-gray-800 p-1 gap-1">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-md font-medium transition-colors
              ${tab === id ? 'bg-gray-700 text-gray-100' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      <div className="card">
        {tab === 'file' ? (
          <FileUploader onUpload={onFileUpload} loading={fileLoading} />
        ) : (
          <DBConnector onConnected={onDatasetLoaded} />
        )}
      </div>

      <div className="card flex-1">
        <RecentDatasets ref={recentRef} onLoad={onDatasetSelected} />
      </div>
    </aside>
  );
});

export default Sidebar;
