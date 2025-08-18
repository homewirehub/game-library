import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import '../styles/main.css';
import WizardActions from '../components/WizardActions';

interface SystemRequirements {
  node: { current: string; required: string; satisfied: boolean };
  disk: { available: string; required: string; satisfied: boolean };
  memory: { available: string; required: string; satisfied: boolean };
}

interface InstallationConfig {
  database: {
    type: 'postgres' | 'sqlite';
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    database: string;
    path?: string;
  };
  admin: {
    username: string;
    password: string;
    email?: string;
  };
  server: {
    port: number;
    host: string;
    domain?: string;
  };
  storage: {
    path: string;
    maxFileSize: number;
  };
}

const InstallationWizard: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [requirements, setRequirements] = useState<SystemRequirements | null>(null);
  const [config, setConfig] = useState<InstallationConfig>({
    database: {
      type: 'sqlite',
      database: 'gamelib.db',
      path: './data/gamelib.db',
    },
    admin: {
      username: 'admin',
      password: 'demo1234',
      email: 'admin@gamelib.com',
    },
    server: {
      port: 3001,
      host: 'localhost',
    },
    storage: {
      path: 'C:\\Users\\offic\\Desktop\\game.lib\\backend\\uploads\\games',
      maxFileSize: 1073741824, // 1GB
    },
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [installing, setInstalling] = useState(false);
  const [isTestingDatabase, setIsTestingDatabase] = useState(false);
  const [dbTestResult, setDbTestResult] = useState<{success: boolean; message: string} | null>(null);

  useEffect(() => {
    // Check installation status
    checkInstallationStatus();
    // Load requirements
    loadSystemRequirements();
  }, []);

  const checkInstallationStatus = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.INSTALLATION_STATUS);
      if (response.data.installed) {
        navigate('/');
      }
    } catch (error) {
      console.log('Installation not complete, continuing with wizard');
    }
  };

  const loadSystemRequirements = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.INSTALLATION_REQUIREMENTS);
      setRequirements(response.data.requirements);
    } catch (error) {
      console.error('Failed to load system requirements:', error);
    }
  };

  const testDatabaseConnection = async () => {
    setIsTestingDatabase(true);
    setDbTestResult(null);
    
    try {
      const response = await axios.post(API_ENDPOINTS.INSTALLATION_TEST_DB, config.database);
      setDbTestResult({
        success: response.data.success,
        message: response.data.message
      });
    } catch (error: any) {
      setDbTestResult({
        success: false,
        message: error.response?.data?.message || 'Connection failed'
      });
    } finally {
      setIsTestingDatabase(false);
    }
  };

  const performInstallation = async () => {
    setInstalling(true);
    setErrors({});

    try {
      const response = await axios.post(API_ENDPOINTS.INSTALLATION_INSTALL, config);
      
      if (response.data.success) {
        setCurrentStep(6);
      } else {
        setErrors({ general: response.data.message || 'Installation failed' });
      }
    } catch (error: any) {
      setErrors({ 
        general: error.response?.data?.message || 'Installation failed. Please check your configuration.' 
      });
    } finally {
      setInstalling(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            <p className="step-intro">
              Welcome! This wizard will help you install and manage games from itch.io, GOG, and local folders.
            </p>
            
            <ul className="feature-list">
              <li>Steam-style library view</li>
              <li>Automatic metadata enrichment</li>
              <li>Multi-source downloads</li>
              <li>Cover art management</li>
              <li>Steam shortcut injection</li>
              <li>Secure user management</li>
            </ul>

            {requirements && (
              <>
                <h3>System Requirements</h3>
                <div className="requirements-grid">
                  <div className="requirement-item">
                    <span>Node.js {requirements.node.required}: {requirements.node.current}</span>
                    <span className={`requirement-status ${requirements.node.satisfied ? 'satisfied' : 'not-satisfied'}`}>
                      {requirements.node.satisfied ? 'OK' : 'FAIL'}
                    </span>
                  </div>
                  <div className="requirement-item">
                    <span>Disk Space {requirements.disk.required}: {requirements.disk.available}</span>
                    <span className={`requirement-status ${requirements.disk.satisfied ? 'satisfied' : 'not-satisfied'}`}>
                      {requirements.disk.satisfied ? 'OK' : 'FAIL'}
                    </span>
                  </div>
                  <div className="requirement-item">
                    <span>Memory {requirements.memory.required}: {requirements.memory.available}</span>
                    <span className={`requirement-status ${requirements.memory.satisfied ? 'satisfied' : 'not-satisfied'}`}>
                      {requirements.memory.satisfied ? 'OK' : 'FAIL'}
                    </span>
                  </div>
                </div>
              </>
            )}
          </>
        );

      case 2:
        return (
          <>
            <h2>Configure Database</h2>
            <p>Choose your database configuration to store your game library</p>
            
            <div className="form-group">
              <label>
                <input
                  type="radio"
                  value="postgres"
                  checked={config.database.type === 'postgres'}
                  onChange={(e) => {
                    setConfig(prev => ({
                      ...prev,
                      database: {
                        ...prev.database,
                        type: 'postgres',
                        host: 'localhost',
                        port: 5432,
                        username: '',
                        password: '',
                        database: 'gamelib'
                      }
                    }));
                  }}
                />
                PostgreSQL
              </label>
              
              <label>
                <input
                  type="radio"
                  value="sqlite"
                  checked={config.database.type === 'sqlite'}
                  onChange={(e) => {
                    setConfig(prev => ({
                      ...prev,
                      database: {
                        ...prev.database,
                        type: 'sqlite',
                        database: 'gamelib.db',
                        path: './data/gamelib.db'
                      }
                    }));
                  }}
                />
                SQLite (Recommended)
              </label>
            </div>

            {config.database.type === 'postgres' ? (
              <>
        <div className="input-field">
                  <label>Host</label>
                  <input
                    type="text"
          className="input"
                    value={config.database.host || ''}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      database: { ...prev.database, host: e.target.value }
                    }))}
                    placeholder="localhost"
                  />
                </div>

        <div className="input-field">
                  <label>Port</label>
                  <input
                    type="number"
          className="input"
                    value={config.database.port || 5432}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      database: { ...prev.database, port: parseInt(e.target.value) || 5432 }
                    }))}
                    placeholder="5432"
                  />
                </div>

        <div className="input-field">
                  <label>Username</label>
                  <input
                    type="text"
          className="input"
                    value={config.database.username || ''}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      database: { ...prev.database, username: e.target.value }
                    }))}
                    placeholder="postgres"
                  />
                </div>

        <div className="input-field">
                  <label>Password</label>
                  <input
                    type="password"
          className="input"
                    value={config.database.password || ''}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      database: { ...prev.database, password: e.target.value }
                    }))}
                    placeholder="Enter database password"
                  />
                </div>

        <div className="input-field">
                  <label>Database Name</label>
                  <input
                    type="text"
          className="input"
                    value={config.database.database}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      database: { ...prev.database, database: e.target.value }
                    }))}
                    placeholder="gamelib"
                  />
                </div>
              </>
            ) : (
              <>
        <div className="input-field">
                  <label>Database File Path</label>
                  <input
                    type="text"
          className="input"
                    value={config.database.path || config.database.database}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      database: { 
                        ...prev.database, 
                        path: e.target.value,
                        database: e.target.value 
                      }
                    }))}
                    placeholder="./data/gamelib.db"
                  />
                  <small>
                    The SQLite database file will be created automatically if it doesn't exist.
                  </small>
                </div>
              </>
            )}
            
            <div className="stack">
              <button
                type="button"
                className="btn"
                onClick={testDatabaseConnection}
                disabled={isTestingDatabase}
              >
                {isTestingDatabase ? 'Testing Connection...' : 'Test Database Connection'}
              </button>
              {dbTestResult && (
                <div className={`alert ${dbTestResult.success ? '' : 'alert--error'}`}>
                  {dbTestResult.success ? '✓' : '✗'} {dbTestResult.message}
                </div>
              )}
            </div>
          </>
        );

      case 3:
        return (
          <>
            <h2>Admin Account Setup</h2>
            <p>Create your administrator account</p>

      <div className="input-field">
              <label>Username</label>
              <input
                type="text"
        className="input"
                value={config.admin.username}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  admin: { ...prev.admin, username: e.target.value }
                }))}
                placeholder="admin"
              />
            </div>

      <div className="input-field">
              <label>Email</label>
              <input
                type="email"
        className="input"
                value={config.admin.email || ''}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  admin: { ...prev.admin, email: e.target.value }
                }))}
                placeholder="admin@gamelib.com"
              />
            </div>

      <div className="input-field">
              <label>Password (minimum 8 characters)</label>
              <input
                type="password"
        className="input"
                value={config.admin.password}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  admin: { ...prev.admin, password: e.target.value }
                }))}
                placeholder="Enter a secure password"
                minLength={8}
              />
            </div>

            <div className="demo-indicator">
              💡 Demo Mode: Password is pre-filled with "demo1234" for quick setup
            </div>
          </>
        );

      case 4:
        return (
          <>
            <h2>Server Configuration</h2>
            <p>Configure your server settings</p>

      <div className="input-field">
              <label>Server Port</label>
              <input
                type="number"
        className="input"
                value={config.server.port}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  server: { ...prev.server, port: parseInt(e.target.value) || 3001 }
                }))}
                placeholder="3001"
              />
            </div>

      <div className="input-field">
              <label>Server Host</label>
              <input
                type="text"
        className="input"
                value={config.server.host}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  server: { ...prev.server, host: e.target.value }
                }))}
                placeholder="localhost"
              />
            </div>

      <div className="input-field">
              <label>Storage Path</label>
              <input
                type="text"
        className="input"
                value={config.storage.path}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  storage: { ...prev.storage, path: e.target.value }
                }))}
                placeholder="Path where games will be stored"
              />
            </div>
          </>
        );

      case 5:
        return (
          <>
            <h2>Review Configuration</h2>
            <p>Please review your settings before installation</p>

            <div className="requirements-grid">
              <div className="requirement-item">
                <span>Database: {config.database.type === 'sqlite' ? 'SQLite' : 'PostgreSQL'}</span>
              </div>
              <div className="requirement-item">
                <span>Admin User: {config.admin.username}</span>
              </div>
              <div className="requirement-item">
                <span>Server Port: {config.server.port}</span>
              </div>
              <div className="requirement-item">
                <span>Storage: {config.storage.path}</span>
              </div>
            </div>

            {errors.general && (
              <div className="alert alert--error">{errors.general}</div>
            )}

            {installing && (
              <div className="alert">Installing Game Library...</div>
            )}
          </>
        );

      case 6:
        return (
          <>
            <h2>🎉 Installation Complete!</h2>
            <p className="step-intro">
              Your Game Library has been successfully installed and configured.
            </p>

            <ul className="feature-list">
              <li>Database configured and ready</li>
              <li>Admin account created</li>
              <li>Server configuration saved</li>
              <li>Storage directory set up</li>
              <li>All systems operational</li>
              <li>Ready to manage your games!</li>
            </ul>

            <div className="alert">🚀 Your Game Library is now ready to use!</div>
          </>
        );

      default:
        return <div>Unknown step</div>;
    }
  };

  const renderProgressIndicator = () => {
    const pct = Math.min((currentStep - 1) / (6 - 1), 1) * 100;
    return (
      <div className="progress" aria-label="Installation progress">
        <div className="progress__bar" style={{ width: `${pct}%` }} />
      </div>
    );
  };

  return (
    <main className="container">
      <h1>Game Library Installation</h1>
      <p className="subtle">Step {currentStep} of 6</p>

      <div className="card section stack" style={{ marginTop: 'var(--space-4)' }}>
        {renderProgressIndicator()}

        <div className="card card--inset section">
          {renderStep()}
        </div>

        <WizardActions
          onBack={currentStep > 1 && currentStep < 6 ? prevStep : undefined}
          onNext={currentStep < 5 ? nextStep : undefined}
          nextLabel={currentStep < 5 ? 'Next →' : undefined}
        />

        {currentStep === 5 && (
          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <button className="btn" onClick={performInstallation} disabled={installing}>
              {installing ? 'Installing...' : 'Install & Start 🚀'}
            </button>
          </div>
        )}

        {currentStep === 6 && (
          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <button className="btn" onClick={() => navigate('/')}>Go to Game Library 🎮</button>
          </div>
        )}
      </div>
    </main>
  );
};

export default InstallationWizard;