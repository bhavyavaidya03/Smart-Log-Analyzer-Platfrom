import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import {
  Upload, FileText, X, Check, AlertCircle, FolderOpen, ChevronDown,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { logsApi, projectsApi } from '@/api';
import { AppLayout } from '@/components/layout/AppLayout';
import Button from '@/components/ui/Button';

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const ALLOWED_TYPES = ['.log', '.txt', '.csv', '.json'];

export default function UploadPage() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.list(),
  });

  const projects = projectsData?.data.data ?? [];

  const onDrop = useCallback((accepted: File[], rejected: any[]) => {
    if (rejected.length > 0) {
      toast.error(`File type not allowed. Use: ${ALLOWED_TYPES.join(', ')}`);
      return;
    }
    if (accepted.length > 0) {
      const file = accepted[0];
      if (file.size > 50 * 1024 * 1024) {
        toast.error('File size exceeds 50MB limit');
        return;
      }
      setSelectedFile(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.log', '.txt'],
      'text/csv': ['.csv'],
      'application/json': ['.json'],
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024,
  });

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90));
    }, 200);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const res = await logsApi.upload(formData, selectedProject || undefined);
      clearInterval(progressInterval);
      setProgress(100);

      setTimeout(() => {
        toast.success('Log file uploaded and parsed successfully!');
        navigate(`/logs/${res.data.data.id}`);
      }, 500);
    } catch (err: any) {
      clearInterval(progressInterval);
      setProgress(0);
      toast.error(err.response?.data?.detail || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    const colors: Record<string, string> = { log: 'text-warning', txt: 'text-primary-400', csv: 'text-success', json: 'text-accent' };
    return colors[ext || ''] || 'text-text-muted';
  };

  return (
    <AppLayout breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Upload Logs' }]}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-primary mb-1">Upload Log File</h1>
          <p className="text-text-secondary text-sm">
            Upload a log file to automatically parse and analyze its contents.
          </p>
        </div>

        {/* Drop zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div
            {...getRootProps()}
            className={`upload-zone ${isDragActive ? 'drag-over' : ''}`}
          >
            <input {...getInputProps()} id="file-upload-input" />
            <AnimatePresence mode="wait">
              {isDragActive ? (
                <motion.div
                  key="dragging"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-primary-500/20 border-2 border-primary-500 flex items-center justify-center mx-auto mb-4 animate-float">
                    <Upload className="w-8 h-8 text-primary-400" />
                  </div>
                  <p className="text-lg font-semibold text-primary-400">Drop it here!</p>
                </motion.div>
              ) : (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-bg-elevated border border-bg-border flex items-center justify-center mx-auto mb-4 group-hover:border-primary-500/30 transition-colors">
                    <Upload className="w-8 h-8 text-text-muted" />
                  </div>
                  <p className="text-base font-medium text-text-primary mb-1">
                    Drag & drop your log file here
                  </p>
                  <p className="text-sm text-text-muted mb-4">or click to browse files</p>
                  <p className="text-xs text-text-disabled">
                    Supports: {ALLOWED_TYPES.join(', ')} · Max 50MB
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Selected file */}
        <AnimatePresence>
          {selectedFile && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <div className="card flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl bg-bg-base flex items-center justify-center flex-shrink-0`}>
                  <FileText className={`w-5 h-5 ${getFileIcon(selectedFile.name)}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{selectedFile.name}</p>
                  <p className="text-xs text-text-muted">{formatFileSize(selectedFile.size)}</p>
                </div>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="p-1.5 rounded-lg hover:bg-danger/10 text-text-muted hover:text-danger transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Progress bar */}
              {uploading && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-text-muted mb-1">
                    <span>Parsing...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="progress-bar">
                    <motion.div
                      className="progress-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Project selector */}
        {projects.length > 0 && (
          <div className="mb-6">
            <label className="label">Assign to Project (optional)</label>
            <div className="relative">
              <select
                value={selectedProject}
                onChange={e => setSelectedProject(e.target.value)}
                className="input appearance-none pr-10 cursor-pointer"
                id="project-select"
              >
                <option value="">No Project</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
            </div>
          </div>
        )}

        {/* Upload button */}
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          loading={uploading}
          variant="primary"
          className="w-full justify-center"
          size="lg"
          leftIcon={<Upload className="w-4 h-4" />}
        >
          {uploading ? 'Uploading & Parsing...' : 'Upload & Analyze'}
        </Button>

        {/* Supported formats */}
        <div className="mt-8 card">
          <h3 className="text-sm font-semibold text-text-primary mb-3">Supported Log Formats</h3>
          <div className="grid grid-cols-2 gap-2 text-xs text-text-muted">
            {[
              'Common Log Format (Apache/Nginx)',
              'Combined Log Format',
              'JSON Structured Logs',
              'Python/Django/FastAPI Logs',
              'Log4j / Logback Format',
              'Syslog Format',
              'ISO Timestamp Logs',
              'Custom Delimited Formats',
            ].map((fmt, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <Check className="w-3 h-3 text-success flex-shrink-0" />
                {fmt}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
