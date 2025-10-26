import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ArrowLeft, FileText, Search, Filter, Download, Clock, User } from 'lucide-react';

export const AuditPage: React.FC = () => {
  const navigate = useNavigate();
  const [auditEvents, setAuditEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    loadAuditTrail();
  }, []);

  const loadAuditTrail = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      setAuditEvents([
        {
          id: '1',
          timestamp: new Date(),
          userId: 'user-1',
          userName: 'John Doe',
          action: 'Project Created',
          resourceType: 'Project',
          resourceId: 'proj-123',
          details: 'Created new project "Mobile App Development"',
          ipAddress: '192.168.1.1',
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 3600000),
          userId: 'user-2',
          userName: 'Jane Smith',
          action: 'Phase Updated',
          resourceType: 'Phase',
          resourceId: 'phase-456',
          details: 'Updated phase content for "Requirements Analysis"',
          ipAddress: '192.168.1.2',
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 7200000),
          userId: 'user-1',
          userName: 'John Doe',
          action: 'Team Member Invited',
          resourceType: 'Team',
          resourceId: 'team-789',
          details: 'Invited jane.smith@example.com to project',
          ipAddress: '192.168.1.1',
        },
        {
          id: '4',
          timestamp: new Date(Date.now() - 10800000),
          userId: 'user-3',
          userName: 'Bob Johnson',
          action: 'Document Exported',
          resourceType: 'Export',
          resourceId: 'export-101',
          details: 'Exported project documentation as PDF',
          ipAddress: '192.168.1.3',
        },
      ]);
    } catch (error) {
      console.error('Error loading audit trail:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = auditEvents.filter((event) => {
    const matchesSearch = event.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.userName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || event.resourceType.toLowerCase() === filterType.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <FileText className="w-6 h-6 mr-2 text-blue-600" />
                Audit Trail
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Complete history of all system activities
              </p>
            </div>
          </div>
          <Button variant="primary">
            <Download className="w-4 h-4 mr-2" />
            Export Audit Log
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search audit events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">All Types</option>
                <option value="project">Projects</option>
                <option value="phase">Phases</option>
                <option value="team">Team</option>
                <option value="export">Exports</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Audit Events */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Audit Events ({filteredEvents.length})
            </h2>
            <div className="space-y-3">
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge variant="info">{event.action}</Badge>
                        <Badge variant="outline">{event.resourceType}</Badge>
                      </div>
                      <p className="text-sm text-gray-900 dark:text-white font-medium">
                        {event.details}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-gray-600 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <User className="w-3 h-3" />
                      <span>{event.userName}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(event.timestamp).toLocaleString()}</span>
                    </div>
                    <span>IP: {event.ipAddress}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
