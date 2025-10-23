import React, { useState, useEffect } from 'react';
import {
  CADConnection,
  CADSoftware,
  CADCredentials,
  CADSyncResult,
  CADSoftwareType,
} from '@shared/types';

interface CADIntegrationManagerProps {
  projectId: string;
}

interface SupportedSoftware {
  type: CADSoftwareType;
  name: string;
  description: string;
  capabilities: string[];
  supportedFormats: string[];
}

export const CADIntegrationManager: React.FC<CADIntegrationManagerProps> = ({ projectId }) => {
  const [connections, setConnections] = useState<CADConnection[]>([]);
  const [supportedSoftware, setSupportedSoftware] = useState<SupportedSoftware[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [selectedSoftware, setSelectedSoftware] = useState<SupportedSoftware | null>(null);
  const [syncResults, setSyncResults] = useState<Record<string, CADSyncResult>>({});

  useEffect(() => {
    loadConnections();
    loadSupportedSoftware();
  }, [projectId]);

  const loadConnections = async () => {
    try {
      const response = await fetch(`/api/cad/project/${projectId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConnections(data.connections);
      }
    } catch (error) {
      console.error('Failed to load CAD connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSupportedSoftware = async () => {
    try {
      const response = await fetch('/api/cad/supported-software', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSupportedSoftware(data.software);
      }
    } catch (error) {
      console.error('Failed to load supported software:', error);
    }
  };

  const handleConnect = async (software: SupportedSoftware, credentials: CADCredentials) => {
    try {
      const cadSoftware: CADSoftware = {
        type: software.type,
        name: software.name,
        version: '1.0',
        apiVersion: '1.0',
        capabilities: software.capabilities.map(cap => ({
          name: cap,
          description: cap,
          supported: true,
        })),
        supportedFormats: software.supportedFormats,
      };

      const response = await fetch('/api/cad/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          projectId,
          software: cadSoftware,
          credentials,
          syncSettings: {
            autoSync: true,
            syncInterval: 30,
            syncDirection: 'bidirectional',
            conflictResolution: 'manual',
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setConnections([...connections, data.connection]);
        setShowConnectDialog(false);
        alert('CAD software connected successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to connect: ${error.details}`);
      }
    } catch (error) {
      console.error('Failed to connect CAD software:', error);
      alert('Failed to connect CAD software');
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    if (!confirm('Are you sure you want to disconnect this CAD software?')) {
      return;
    }

    try {
      const response = await fetch(`/api/cad/${connectionId}/disconnect`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        setConnections(connections.filter(c => c.id !== connectionId));
        alert('CAD software disconnected successfully');
      } else {
        alert('Failed to disconnect CAD software');
      }
    } catch (error) {
      console.error('Failed to disconnect:', error);
      alert('Failed to disconnect CAD software');
    }
  };

  const handleSync = async (connectionId: string) => {
    try {
      const response = await fetch(`/api/cad/${connectionId}/sync`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSyncResults({ ...syncResults, [connectionId]: data.result });
        alert(`Sync completed: ${data.result.summary}`);
        loadConnections();
      } else {
        alert('Failed to sync files');
      }
    } catch (error) {
      console.error('Failed to sync:', error);
      alert('Failed to sync files');
    }
  };

  if (loading) {
    return <div className="cad-integration-loading">Loading CAD integrations...</div>;
  }

  return (
    <div className="cad-integration-manager">
      <div className="cad-header">
        <h2>CAD Software Integrations</h2>
        <button
          className="btn-primary"
          onClick={() => setShowConnectDialog(true)}
        >
          + Connect CAD Software
        </button>
      </div>

      {connections.length === 0 ? (
        <div className="cad-empty-state">
          <p>No CAD software connected yet.</p>
          <p>Connect your CAD software to enable bidirectional file synchronization and automated workflows.</p>
        </div>
      ) : (
        <div className="cad-connections-list">
          {connections.map(connection => (
            <div key={connection.id} className="cad-connection-card">
              <div className="connection-header">
                <div className="connection-info">
                  <h3>{connection.software.name}</h3>
                  <span className={`status-badge status-${connection.status}`}>
                    {connection.status}
                  </span>
                </div>
                <div className="connection-actions">
                  <button
                    className="btn-secondary"
                    onClick={() => handleSync(connection.id)}
                    disabled={connection.status !== 'connected'}
                  >
                    Sync Now
                  </button>
                  <button
                    className="btn-danger"
                    onClick={() => handleDisconnect(connection.id)}
                  >
                    Disconnect
                  </button>
                </div>
              </div>

              <div className="connection-details">
                <div className="detail-item">
                  <span className="label">Software Type:</span>
                  <span className="value">{connection.software.type}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Version:</span>
                  <span className="value">{connection.software.version}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Last Sync:</span>
                  <span className="value">
                    {connection.lastSync
                      ? new Date(connection.lastSync).toLocaleString()
                      : 'Never'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="label">Synced Files:</span>
                  <span className="value">{connection.syncedFiles.length}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Auto Sync:</span>
                  <span className="value">
                    {connection.configuration.syncSettings.autoSync
                      ? `Every ${connection.configuration.syncSettings.syncInterval} minutes`
                      : 'Disabled'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="label">Sync Direction:</span>
                  <span className="value">
                    {connection.configuration.syncSettings.syncDirection}
                  </span>
                </div>
              </div>

              {syncResults[connection.id] && (
                <div className="sync-result">
                  <h4>Last Sync Result</h4>
                  <p>{syncResults[connection.id].summary}</p>
                  <div className="sync-stats">
                    <span>Processed: {syncResults[connection.id].filesProcessed}</span>
                    <span>Succeeded: {syncResults[connection.id].filesSucceeded}</span>
                    <span>Failed: {syncResults[connection.id].filesFailed}</span>
                    <span>Conflicts: {syncResults[connection.id].conflicts.length}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showConnectDialog && (
        <ConnectCADDialog
          supportedSoftware={supportedSoftware}
          onConnect={handleConnect}
          onCancel={() => setShowConnectDialog(false)}
        />
      )}
    </div>
  );
};

interface ConnectCADDialogProps {
  supportedSoftware: SupportedSoftware[];
  onConnect: (software: SupportedSoftware, credentials: CADCredentials) => void;
  onCancel: () => void;
}

const ConnectCADDialog: React.FC<ConnectCADDialogProps> = ({
  supportedSoftware,
  onConnect,
  onCancel,
}) => {
  const [selectedSoftware, setSelectedSoftware] = useState<SupportedSoftware | null>(null);
  const [credentialType, setCredentialType] = useState<CADCredentials['type']>('api-key');
  const [apiKey, setApiKey] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSoftware) {
      alert('Please select a CAD software');
      return;
    }

    const credentials: CADCredentials = {
      type: credentialType,
    };

    if (credentialType === 'api-key') {
      if (!apiKey) {
        alert('Please enter an API key');
        return;
      }
      credentials.apiKey = apiKey;
    } else if (credentialType === 'basic') {
      if (!username || !password) {
        alert('Please enter username and password');
        return;
      }
      credentials.username = username;
      credentials.password = password;
    }

    onConnect(selectedSoftware, credentials);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content cad-connect-dialog">
        <h2>Connect CAD Software</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Select CAD Software</label>
            <select
              value={selectedSoftware?.type || ''}
              onChange={(e) => {
                const software = supportedSoftware.find(s => s.type === e.target.value);
                setSelectedSoftware(software || null);
              }}
              required
            >
              <option value="">-- Select Software --</option>
              {supportedSoftware.map(software => (
                <option key={software.type} value={software.type}>
                  {software.name}
                </option>
              ))}
            </select>
          </div>

          {selectedSoftware && (
            <>
              <div className="software-info">
                <p>{selectedSoftware.description}</p>
                <div className="capabilities">
                  <strong>Capabilities:</strong>
                  <ul>
                    {selectedSoftware.capabilities.map((cap, idx) => (
                      <li key={idx}>{cap}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="form-group">
                <label>Authentication Type</label>
                <select
                  value={credentialType}
                  onChange={(e) => setCredentialType(e.target.value as CADCredentials['type'])}
                  required
                >
                  <option value="api-key">API Key</option>
                  <option value="basic">Username/Password</option>
                  <option value="oauth">OAuth (Coming Soon)</option>
                  <option value="plugin">Plugin-based</option>
                </select>
              </div>

              {credentialType === 'api-key' && (
                <div className="form-group">
                  <label>API Key</label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your API key"
                    required
                  />
                </div>
              )}

              {credentialType === 'basic' && (
                <>
                  <div className="form-group">
                    <label>Username</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter username"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      required
                    />
                  </div>
                </>
              )}

              {credentialType === 'plugin' && (
                <div className="info-message">
                  Plugin-based authentication requires installing the CAD software plugin.
                  Please refer to the documentation for installation instructions.
                </div>
              )}
            </>
          )}

          <div className="dialog-actions">
            <button type="button" className="btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={!selectedSoftware || credentialType === 'oauth'}
            >
              Connect
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
