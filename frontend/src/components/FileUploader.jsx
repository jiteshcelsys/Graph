import { useRef, useState } from 'react';
import { Upload, FileSpreadsheet, X } from 'lucide-react';

export default function FileUploader({ onUpload, loading }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  function handleFile(file) {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['csv', 'xlsx', 'xls', 'sql'].includes(ext)) {
      alert('Only CSV, Excel, and SQL files are supported');
      return;
    }
    setSelectedFile(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }

  function clearFile() {
    setSelectedFile(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !selectedFile && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
          ${dragging ? 'border-blue-500 bg-blue-950/30' : 'border-gray-700 hover:border-gray-600'}
          ${selectedFile ? 'cursor-default' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls,.sql"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />

        {selectedFile ? (
          <div className="flex items-center justify-between gap-3 bg-gray-800 rounded-lg px-4 py-3">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-5 h-5 text-blue-400 shrink-0" />
              <div className="text-left">
                <p className="text-sm font-medium text-gray-200">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); clearFile(); }} className="text-gray-500 hover:text-red-400 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="w-8 h-8 text-gray-600 mx-auto" />
            <p className="text-sm text-gray-400">Drag & drop or <span className="text-blue-400">browse</span></p>
            <p className="text-xs text-gray-600">CSV, XLSX, SQL up to 50 MB</p>
          </div>
        )}
      </div>

      {selectedFile && (
        <button
          className="btn-primary w-full justify-center"
          disabled={loading}
          onClick={() => onUpload(selectedFile)}
        >
          {loading ? 'Parsing…' : 'Upload & Analyze'}
        </button>
      )}
    </div>
  );
}
